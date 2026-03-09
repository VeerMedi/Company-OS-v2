# Eventlet monkey patching MUST be at the very top
import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sock import Sock
from datetime import datetime
import json
import os
from data_fetcher import DataFetcher
from config import AnalyticsLLMConfig

# RAG System imports
from rag.rag_agent import RAGAgent

# ── Voice Agent feature flag ──────────────────────────────────────────────────
# Set env var VOICE_ENABLED=true to re-enable the voice service.
# When False, all voice endpoints return 503 and the Whisper model is not loaded.
VOICE_ENABLED = os.environ.get('VOICE_ENABLED', 'false').lower() == 'true'

# Voice Agent imports (only loaded when enabled to avoid CPU overhead)
if VOICE_ENABLED:
    from voice.speech_to_text import SpeechToText
    from voice.elevenlabs_tts import get_elevenlabs_tts  # ElevenLabs with fallback
    from voice.audio_utils import AudioUtils
    from voice.pipeline import VoicePipeline
    from voice.parallel_pipeline import get_parallel_pipeline
    from voice.native_websocket_handler import handle_voice_websocket, VoiceWebSocketHandler
    from voice.stt_corrector import get_stt_corrector

# Global RAG agent instance
rag_agent_instance = None

# Global voice agent instances (lazy loaded)
stt_instance = None
tts_instance = None

# Voice audio cache for fast responses
voice_audio_cache = {}

# Pre-defined quick responses (no RAG needed)
QUICK_GREETINGS = [
    "Hello! What's on your mind?",
    "Hi there! How can I help?",
    "Hey! What would you like to know?",
    "Hello! Ready when you are.",
    "Hi! What can I do for you?",
    # Hinglish variants
    "Namaste! Kya madad kar sakta hoon?",
    "Hello! Aapko kya chahiye?",
    "Hi! Kaise help karun?",
]

QUICK_GOODBYES = [
    "Goodbye! Have a great day!",
    "See you later! Take care!",
    "Bye! Feel free to ask anytime.",
    "Goodbye! It was nice helping you.",
    "Take care! Come back anytime.",
    # Hinglish variants
    "Alvida! Acha din ho!",
    "Okay, phir milte hain!",
    "Bye! Kabhi bhi puchh sakte ho.",
]

QUICK_THANKS = [
    "You're welcome!",
    "Happy to help!",
    "Anytime!",
    "My pleasure!",
    "Glad I could help!",
    # Hinglish variants
    "Koi baat nahi!",
    "Khushi hui madad karke!",
    "Bilkul, kabhi bhi!",
]

QUICK_CONFIRMATIONS = [
    "Great! What else can I do for you?",
    "Perfect! Anything else?",
    "Understood! How else can I help?",
    "Got it! What's next?",
    # Hinglish variants
    "Achha! Aur kya chahiye?",
    "Perfect! Kuch aur?",
    "Samajh gaya! Aur kya help chahiye?",
]

QUICK_CLARIFICATIONS = [
    "I'm sorry, could you rephrase that?",
    "I didn't catch that. Could you say it again?",
    "Could you repeat your question?",
    "Sorry, I missed that. What did you say?",
    # Hinglish variants
    "Sorry, samajh nahi aaya. Phir se bolo?",
    "Kya kaha? Dobara bol sakte ho?",
    "Thoda aur clear bata sakte ho?",
]

app = Flask(__name__)

# Enable CORS globally for all domains to resolve preflight/access issues
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Flask app for longer timeouts (voice processing can take 10-30s)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB for audio uploads

# Initialize Flask-Sock for native WebSocket support
sock = Sock(app)

# Initialize Flask-SocketIO for WebSocket support (backward compatibility)
# Configure longer timeouts for voice processing (WebM transcription can take 10-30s)
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    async_mode='eventlet',
    ping_timeout=30,           # 30s ping timeout (wait for client response)
    ping_interval=25,          # Send ping every 25s to keep connection alive
    max_http_buffer_size=50 * 1024 * 1024,  # 50MB for audio uploads
    engineio_logger=False,     # Disable verbose logs
    logger=False               # Disable verbose logs
)


# ======== Native WebSocket Endpoint for Voice Agent ========
@sock.route('/ws/voice')
def voice_websocket(ws):
    """Native WebSocket endpoint for optimized voice streaming"""
    if not VOICE_ENABLED:
        import json as _json
        ws.send(_json.dumps({"type": "error", "data": {"message": "Voice service is currently disabled", "code": "VOICE_DISABLED"}}))
        return
    print("✅ Native WebSocket connected at /ws/voice")
    handler = VoiceWebSocketHandler(ws)
    handler.send_message("connected", {"status": "ready"})
    
    try:
        while True:
            message = ws.receive()
            if message is None:
                break
            handler.handle_message(message)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("🔌 Voice WebSocket disconnected")
        if handler.is_streaming:
            handler.handle_end_stream()


# ======== SocketIO Event Handlers for Streaming STT ========
streaming_stt_state = {}

@socketio.on('connect')
def handle_connect():
    print(f"✓ SocketIO client connected: {request.sid}")
    if not VOICE_ENABLED:
        emit('connected', {'status': 'disabled', 'message': 'Voice service is currently disabled'})
        return
    emit('connected', {'status': 'ready', 'message': 'Streaming STT ready'})

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f"✓ SocketIO client disconnected: {sid}")
    if sid in streaming_stt_state:
        del streaming_stt_state[sid]

@socketio.on('start_streaming')
def handle_start_streaming(data):
    if not VOICE_ENABLED:
        emit('error', {'message': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'})
        return
    sid = request.sid
    language = data.get('language', 'en') if data else 'en'
    print(f"\n=== Streaming STT Started [{sid}] ===")
    from voice.chunked_stt import get_chunked_stt
    processor = get_chunked_stt()
    processor.reset()
    streaming_stt_state[sid] = {'processor': processor, 'language': language, 'chunks': [], 'previous_chunk': None}
    emit('streaming_started', {'status': 'recording'})

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    if not VOICE_ENABLED:
        emit('error', {'message': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'})
        return
    sid = request.sid
    if sid not in streaming_stt_state:
        emit('error', {'message': 'No active session'})
        return
    state = streaming_stt_state[sid]
    chunk_data = data.get('audio') if data else None
    if not chunk_data:
        return
    import base64
    audio_bytes = base64.b64decode(chunk_data) if isinstance(chunk_data, str) else chunk_data
    state['chunks'].append(audio_bytes)
    chunk_num = len(state['chunks'])
    print(f"   📦 Chunk #{chunk_num} ({len(audio_bytes)/1024:.1f}KB)")
    try:
        partial = state['processor'].process_with_overlap(audio_bytes, state['previous_chunk'], 'webm', state['language'])
        if partial.get('success'):
            emit('partial_result', {'text': partial.get('text',''), 'confidence': partial.get('confidence',0.7), 'chunk': chunk_num})
        state['previous_chunk'] = audio_bytes
    except Exception as e:
        print(f"   ⚠️ Chunk error: {e}")

@socketio.on('stop_streaming')
def handle_stop_streaming():
    if not VOICE_ENABLED:
        emit('error', {'message': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'})
        return
    sid = request.sid
    if sid not in streaming_stt_state:
        emit('error', {'message': 'No active session'})
        return
    state = streaming_stt_state[sid]
    print(f"\n🎯 Final pass [{sid}]...")
    try:
        final = state['processor'].finalize('webm', state['language'])
        emit('final_result', {'text': final.get('text',''), 'confidence': final.get('confidence',1.0), 'success': final.get('success',False)})
        print(f"   ✓ Final: \"{final.get('text','')}\"")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        emit('error', {'message': str(e)})
    finally:
        if sid in streaming_stt_state:
            del streaming_stt_state[sid]

@socketio.on('voice_pipeline')
def handle_voice_pipeline(data):
    """Full voice pipeline: Audio → STT → RAG → TTS over WebSocket"""
    if not VOICE_ENABLED:
        emit('pipeline_error', {'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'})
        return
    import base64
    import time
    sid = request.sid
    print(f"\n=== Voice Pipeline [{sid}] ===")
    start_time = time.time()
    
    # Declare globals at function level
    global stt_instance
    
    try:
        # Extract audio data
        audio_b64 = data.get('audio')
        category = data.get('category')
        conversation_state = data.get('conversation_state')
        
        if not audio_b64:
            emit('pipeline_error', {'error': 'No audio data provided'})
            return
        
        audio_bytes = base64.b64decode(audio_b64)
        print(f"   📦 Audio received: {len(audio_bytes)/1024:.1f}KB")
        print(f"   📥 Received conversation_state: {conversation_state}")
        
        # Send immediate acknowledgment to prevent timeout
        emit('pipeline_status', {'step': 'received', 'message': 'Audio received, processing...'})
        
        # Step 1: STT
        stt_start = time.time()
        emit('pipeline_status', {'step': 'stt', 'message': 'Transcribing audio... (this may take 10-30s for CPU processing)'})
        
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name
        
        # Send progress update for longer operations
        emit('pipeline_status', {'step': 'stt_progress', 'message': 'Converting audio format...'})
        
        # Use pre-loaded STT instance for faster processing
        if stt_instance is None:
            from voice.speech_to_text import SpeechToText
            stt_instance = SpeechToText()
        
        emit('pipeline_status', {'step': 'stt_progress', 'message': 'Running speech recognition...'})
        stt_result = stt_instance.transcribe(temp_path, language='en')
        os.unlink(temp_path)
        
        transcription = stt_result.get('text', '').strip()
        stt_time = time.time() - stt_start
        print(f"   🎤 STT ({stt_time:.2f}s): \"{transcription}\"")
        emit('pipeline_status', {'step': 'stt_done', 'text': transcription, 'time': stt_time})
        
        if not transcription:
            emit('pipeline_error', {'error': 'No speech detected'})
            return
        
        # Check for instant responses using existing response system
        from voice.instant_responses import get_instant_response_manager
        instant_mgr = get_instant_response_manager()
        intent = instant_mgr.detect_intent(transcription)
        
        # FEATURE 1: Play acknowledgment phrase while RAG processes (for non-instant responses)
        # CRITICAL FIX: Don't instantiate RAG agent here - it tries to connect to MongoDB!
        acknowledgment_text = None
        if not intent:
            from voice.acknowledgments import get_acknowledgment_manager
            ack_mgr = get_acknowledgment_manager()
            
            if ack_mgr.should_acknowledge(transcription):
                acknowledgment_text = ack_mgr.get_acknowledgment(transcription, category)
                print(f"   💬 Acknowledgment: \"{acknowledgment_text}\"")
                
                # Generate TTS audio for acknowledgement using ElevenLabs (SAME VOICE as response)
                # Do this BEFORE RAG agent instantiation to avoid blocking
                try:
                    from voice.elevenlabs_tts import get_elevenlabs_tts
                    import tempfile
                    tts = get_elevenlabs_tts()
                    
                    # Create temp file for acknowledgement audio
                    ack_audio_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
                    ack_audio_path = ack_audio_file.name
                    ack_audio_file.close()
                    
                    # Generate ElevenLabs TTS (very fast for short phrases ~200-500ms)
                    ack_tts_result = tts.synthesize(acknowledgment_text, ack_audio_path)
                    
                    if ack_tts_result.get('success'):
                        # Emit acknowledgment with audio to frontend for instant playback
                        emit('acknowledgment', {
                            'text': acknowledgment_text,
                            'audio_base64': ack_tts_result.get('audio_base64'),
                            'audio_format': 'mp3'
                        })
                        print(f"   ✓ Acknowledgment audio generated and sent ({ack_tts_result.get('size', 0)} bytes)")
                    else:
                        # Fallback: send text only if TTS fails
                        emit('acknowledgment', {'text': acknowledgment_text})
                        print(f"   ⚠️ Acknowledgment TTS failed, sent text only")
                    
                    # Cleanup temp file
                    import os
                    try:
                        os.unlink(ack_audio_path)
                    except:
                        pass
                        
                except Exception as ack_err:
                    print(f"   ⚠️ Acknowledgment TTS error: {ack_err}")
                    # Fallback: send text only
                    emit('acknowledgment', {'text': acknowledgment_text})
        
        if intent:
            # Get quick response (greetings, goodbyes, thanks, etc.)
            quick_response = instant_mgr.get_response(intent, user_text=transcription)
            if quick_response:
                answer = quick_response
                rag_result = {'answer': answer, 'success': True, 'is_instant': True, 'intent': intent}
                rag_time = 0.01
                print(f"   ⚡ Instant response ({intent}): \"{answer}\"")
                emit('pipeline_status', {'step': 'rag_done', 'answer': answer, 'time': rag_time})
            else:
                intent = None  # Fallback to RAG if no response
        
        if not intent:
            # Step 2: RAG (full processing)
            rag_start = time.time()
            emit('pipeline_status', {'step': 'rag', 'message': 'Processing...'})
            
            from rag.rag_agent import RAGAgent
            agent = RAGAgent()
            
            # Check if this is an action (task creation) - use non-streaming for conversational flow
            # This is needed because streaming doesn't support conversation_state properly
            action_intent = agent._detect_action_intent(transcription, category)
            
            if action_intent and action_intent.get("is_action"):
                print("🎯 Action detected - using non-streaming conversational flow")
                # Use regular query() which returns full result with conversation_state
                rag_result = agent.query(
                    question=transcription,
                    category=category,
                    conversation_history=[],
                    conversation_state=conversation_state,
                    is_voice=True
                )
                answer = rag_result.get('answer', '')
                rag_time = time.time() - rag_start
                print(f"   🤖 RAG ({rag_time:.2f}s): \"{answer[:50]}...\"")
                emit('pipeline_status', {'step': 'rag_done', 'answer': answer, 'time': rag_time})
            else:
                # Regular query - use streaming
                answer = ""
                rag_first_chunk_time = None
                
                print(f"   🤖 RAG Streaming started...")
                for chunk in agent.query_stream(transcription, category=category, history=conversation_state):
                    if rag_first_chunk_time is None:
                        rag_first_chunk_time = time.time() - rag_start
                        print(f"   ⚡ RAG First Chunk: {rag_first_chunk_time:.2f}s")
                    
                    answer += chunk
                    emit('llm_chunk', {'chunk': chunk}) # Send to frontend for real-time text
                
                rag_time = time.time() - rag_start
                rag_result = {'answer': answer, 'success': True}
                
                emit('pipeline_status', {'step': 'rag_done', 'answer': answer, 'time': rag_time})
            
            # Extract and display token usage
            token_usage = getattr(agent, 'last_stream_usage', {}) or rag_result.get('token_usage', {})
            if token_usage:
                prompt_tokens = token_usage.get('prompt_tokens', 0)
                completion_tokens = token_usage.get('completion_tokens', 0)
                total_tokens = token_usage.get('total_tokens', 0)
                
                # Pricing for o3-mini (update these if model changes)
                # Check OpenRouter for latest pricing: https://openrouter.ai/models
                MODEL_PRICING = {
                    'openai/o1': {'input': 15.0, 'output': 60.0},  # per 1M tokens (flagship reasoning)
                    'openai/o3-mini': {'input': 1.10, 'output': 4.40},  # per 1M tokens
                    'openai/gpt-4o-mini': {'input': 0.15, 'output': 0.60},
                    'openai/gpt-4o': {'input': 5.0, 'output': 15.0},
                    'google/gemini-flash-1.5': {'input': 0.075, 'output': 0.30},
                    'anthropic/claude-3-haiku': {'input': 0.25, 'output': 1.25},
                }
                
                # Get current model from config
                from config import AnalyticsLLMConfig
                config = AnalyticsLLMConfig()
                current_model = config.MODEL_NAME
                
                # Calculate cost
                pricing = MODEL_PRICING.get(current_model, {'input': 0, 'output': 0})
                input_cost = (prompt_tokens / 1_000_000) * pricing['input']
                output_cost = (completion_tokens / 1_000_000) * pricing['output']
                total_cost = input_cost + output_cost
                
                print(f"   🤖 RAG ({rag_time:.2f}s): \"{answer[:50]}...\"")
                print(f"   📊 Token Usage ({current_model}):")
                print(f"      • Input:  {prompt_tokens:,} tokens (${input_cost:.6f})")
                print(f"      • Output: {completion_tokens:,} tokens (${output_cost:.6f})")
                print(f"      • Total:  {total_tokens:,} tokens")
                print(f"   💰 Cost: ${total_cost:.6f} (~${total_cost * 1000:.3f} per 1K queries)")
            else:
                print(f"   🤖 RAG ({rag_time:.2f}s): \"{answer[:50]}...\"")
            
            emit('pipeline_status', {'step': 'rag_done', 'answer': answer, 'time': rag_time})
        
        # Step 3: TTS (with cache for instant responses)
        tts_start = time.time()
        emit('pipeline_status', {'step': 'tts', 'message': 'Speaking...'})
        
        audio_base64 = None
        
        # Check TTS cache FIRST for instant responses (greetings, thanks, etc.)
        if rag_result.get('is_instant') or intent:
            from voice.tts_cache import get_tts_cache
            tts_cache = get_tts_cache()
            cached = tts_cache.get(answer)
            if cached:
                audio_base64 = cached['audio_base64']
                print(f"   ⚡ TTS CACHE HIT! Instant audio for: \"{answer[:30]}...\"")
        
        # If not cached, generate with ElevenLabs
        if not audio_base64:
            from voice.elevenlabs_tts import get_elevenlabs_tts
            tts = get_elevenlabs_tts()
            
            # Create temp file for TTS output
            tts_output = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            tts_output_path = tts_output.name
            tts_output.close()
            
            tts_result = tts.synthesize(answer, tts_output_path)
            audio_base64 = tts_result.get('audio_base64', '')
            
            # Cache this response for future use if it's a short phrase
            if len(answer) < 100 and audio_base64:
                try:
                    from voice.tts_cache import get_tts_cache
                    tts_cache = get_tts_cache()
                    tts_cache.set(answer, audio_base64, 'audio/mp3')
                    print(f"   💾 Cached new phrase: \"{answer[:30]}...\"")
                except Exception as cache_err:
                    print(f"   ⚠️ Cache save failed: {cache_err}")
            
            # Clean up temp file (only if we created one)
            try:
                os.unlink(tts_output_path)
            except:
                pass
        
        tts_time = time.time() - tts_start
        total_time = time.time() - start_time
        print(f"   🔊 TTS ({tts_time:.2f}s): {len(audio_base64)/1024:.1f}KB")
        
        # Calculate latency distribution percentages
        stt_percent = (stt_time / total_time * 100) if total_time > 0 else 0
        rag_percent = (rag_time / total_time * 100) if total_time > 0 else 0
        tts_percent = (tts_time / total_time * 100) if total_time > 0 else 0
        
        print(f"\n   ⏱️  LATENCY BREAKDOWN (Total: {total_time:.2f}s):")
        print(f"      ├─ STT:  {stt_time:.2f}s ({stt_percent:.1f}%)")
        print(f"      ├─ RAG:  {rag_time:.2f}s ({rag_percent:.1f}%)")
        print(f"      └─ TTS:  {tts_time:.2f}s ({tts_percent:.1f}%)")
        print(f"   {'─' * 60}\n")
        
        # FEATURE 2: Generate follow-up suggestion (only for business queries, not greetings)
        followup_suggestion = None
        if not intent:  # Only for business queries
            from voice.followup_suggestions import get_followup_generator
            followup_gen = get_followup_generator()
            followup_suggestion = followup_gen.generate_followup(
                query=transcription,
                answer=answer,
                context=rag_result
            )
            
            if followup_suggestion:
                print(f"   💡 Follow-up: \"{followup_suggestion}\"")
        
        # FEATURE 3: Save to conversation memory
        from voice.conversation_memory import get_conversation_memory
        conv_memory = get_conversation_memory()
        
        # Extract entities from RAG result (if available)
        entities = []
        citations = rag_result.get('citations', [])
        for citation in citations[:3]:  # Top 3 entities
            entities.append({
                'type': citation.get('domain', 'unknown'),
                'name': citation.get('name', 'Unknown')
            })
        
        conv_memory.add_turn(
            session_id=sid,
            user_query=transcription,
            agent_response=answer,
            entities=entities,
            metadata={
                'category': category,
                'timing': {
                    'stt': stt_time,
                    'rag': rag_time,
                    'tts': tts_time,
                    'total': total_time
                }
            }
        )
        
        # Emit final result with audio
        conv_state_to_send = rag_result.get('conversation_state')
        print(f"   📤 Sending conversation_state to frontend: {conv_state_to_send}")
        
        # Check if this is a goodbye - signal frontend to auto-close
        should_close = intent == 'goodbye' if intent else False
        if should_close:
            print(f"   👋 Goodbye detected - signaling auto-close")
        
        emit('pipeline_complete', {
            'transcription': transcription,
            'answer': answer,
            'audio': audio_base64,
            'audio_format': 'mp3',
            'timing': {
                'stt': round(stt_time, 2),
                'rag': round(rag_time, 2),
                'tts': round(tts_time, 2),
                'total': round(total_time, 2)
            },
            'conversation_state': conv_state_to_send,
            'action': rag_result.get('action'),
            'followup_suggestion': followup_suggestion,  # Add follow-up to response
            'should_close': should_close  # Auto-close signal for goodbye
        })
        
    except Exception as e:
        import traceback
        print(f"   ❌ Pipeline error: {e}")
        traceback.print_exc()
        emit('pipeline_error', {'error': str(e)})

config = AnalyticsLLMConfig()

# In-memory cache (simple implementation)
cache = {}
cache_timestamps = {}

def generate_organizational_insights(analytics_data, category):
    """
    Generate comprehensive organizational insights using OpenRouter LLM
    
    This creates a detailed overview including:
    - Organization overview specific to the category
    - Project/Sales status
    - Underperforming employee report
    - Strategic recommendations for optimization
    """
    from openai import OpenAI
    
    # Get the data
    projects = analytics_data.get('projects', [])
    employees = analytics_data.get('employees', [])
    stats = analytics_data.get('summary_stats', {})
    
    # Determine category name
    category_name = "Service Delivery" if category == "service-delivery" else "Service Onboarding (Sales)"
    
    # Build comprehensive context for LLM
    context_parts = []
    
    # 1. Organization Overview
    context_parts.append(f"""
## Organization Overview - {category_name}
- Total Projects: {stats.get('total_projects', 0)}
- Active Projects: {stats.get('active_projects', 0)}
- Completed Projects: {stats.get('completed_projects', 0)}
- Total Tasks: {stats.get('total_tasks', 0)}
- Task Bunches: {stats.get('total_bunches', 0)}
- Team Members: {stats.get('total_employees', 0)}
- Task Completion Rate: {(stats.get('completed_tasks', 0) / stats.get('total_tasks', 1) * 100) if stats.get('total_tasks', 0) > 0 else 0:.1f}%
""")
    
    # 2. Project Status Details
    if category == "service-delivery":
        context_parts.append("\n## Project Status\n")
        for proj in projects[:10]:  # Top 10 projects
            context_parts.append(f"""
### {proj.get('name', 'Unnamed')}
- Status: {proj.get('status', 'N/A')}
- Progress: {proj.get('completion_percentage', 0)}%
- Total Tasks: {proj.get('total_tasks', 0)}
- Completed: {proj.get('completed_tasks', 0)}
- In Progress: {proj.get('in_progress_tasks', 0)}
- Manager: {proj.get('manager', {}).get('name', 'Unassigned')}
- Deadline: {proj.get('deadline', 'Not set')}
""")
    else:  # service-onboarding
        context_parts.append("\n## Sales Pipeline Status\n")
        # For service onboarding, we focus on sales metrics from employees
        total_leads = sum(emp.get('total_leads', 0) for emp in employees)
        total_revenue = sum(emp.get('total_revenue', 0) for emp in employees)
        avg_conversion = sum(emp.get('conversion_rate', 0) for emp in employees) / len(employees) if employees else 0
        
        context_parts.append(f"""
- Total Leads Generated: {total_leads}
- Total Revenue: ₹{total_revenue:,.2f}
- Average Conversion Rate: {avg_conversion:.1f}%
- Active Sales Team: {len(employees)} members
""")
    
    # 3. Employee Performance - Identify underperformers
    context_parts.append("\n## Employee Performance Analysis\n")
    
    # Sort employees by completion rate or productivity
    employees_sorted = sorted(employees, key=lambda x: x.get('completion_rate', 0))
    
    # Identify underperformers (bottom 30% or those with <60% completion rate)
    underperformers = []
    for emp in employees_sorted:
        completion_rate = emp.get('completion_rate', 0)
        if completion_rate < 60 or emp in employees_sorted[:max(1, len(employees_sorted) // 3)]:
            underperformers.append(emp)
    
    if underperformers:
        context_parts.append("### Underperforming Employees\n")
        for emp in underperformers[:5]:  # Top 5 underperformers
            context_parts.append(f"""
- **{emp.get('name', 'Unknown')}** (ID: {emp.get('employee_id', 'N/A')})
  - Completion Rate: {emp.get('completion_rate', 0):.1f}%
  - Completed Tasks: {emp.get('completed_tasks', 0)}/{emp.get('total_tasks', 0)}
  - Points Earned: {emp.get('completed_points', 0)}/{emp.get('total_points', 0)}
  - Role: {emp.get('role', 'N/A')}
""")
    
    # Add top performers for context
    top_performers = sorted(employees, key=lambda x: x.get('completion_rate', 0), reverse=True)[:3]
    if top_performers:
        context_parts.append("\n### Top Performers\n")
        for emp in top_performers:
            context_parts.append(f"""
- **{emp.get('name', 'Unknown')}**: {emp.get('completion_rate', 0):.1f}% completion, {emp.get('completed_tasks', 0)} tasks done
""")
    
    full_context = "\n".join(context_parts)
    
    # Create prompt for LLM
    prompt = f"""You are an AI assistant analyzing organizational performance data for {category_name}.

Based on the following data, provide a comprehensive organizational overview in a clear, structured format:

{full_context}

Please provide:

1. **Organization Overview**: A brief 2-3 sentence summary of the overall state of {category_name}, highlighting key metrics and general health.

2. **{"Project Status Analysis" if category == "service-delivery" else "Sales Pipeline Analysis"}**: 
   - Identify projects/initiatives that are at risk or behind schedule
   - Highlight high-performing projects/sales achievements
   - Note any resource allocation issues

3. **Employee Performance Report**:
   - Provide a detailed assessment of underperforming employees
   - Explain potential reasons for underperformance (heavy workload, skill gaps, resource constraints)
   - Identify patterns or common issues

4. **Strategic Recommendations**:
   - Provide 3-5 actionable recommendations for optimization
   - Focus on improving underperformer productivity
   - Suggest resource reallocation or process improvements
   - Include timeline suggestions for interventions

Format your response in clear Markdown with headers, bullet points, and emphasis where appropriate. Be specific and data-driven in your analysis."""

    try:
        # Use OpenRouter API
        client = OpenAI(
            base_url=config.OPENROUTER_BASE_URL,
            api_key=config.OPENROUTER_API_KEY
        )
        
        response = client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert organizational analyst providing insights for business leaders. Be concise, data-driven, and actionable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        insights_text = response.choices[0].message.content.strip()
        
        return {
            "insights": insights_text,
            "metadata": {
                "total_projects": stats.get('total_projects', 0),
                "total_employees": len(employees),
                "category": category,
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error generating insights with LLM: {e}")
        import traceback
        traceback.print_exc()
        
        # Return fallback insights
        return {
            "insights": f"""## {category_name} Overview

**Current Status**: The {category_name} department has {stats.get('total_projects', 0)} total projects with {stats.get('total_employees', 0)} team members.

### Key Metrics
- Active Projects: {stats.get('active_projects', 0)}
- Completed Projects: {stats.get('completed_projects', 0)}
- Overall Task Completion: {(stats.get('completed_tasks', 0) / stats.get('total_tasks', 1) * 100) if stats.get('total_tasks', 0) > 0 else 0:.1f}%

### Employee Performance
{len(underperformers) if 'underperformers' in locals() else 0} employees need attention for performance improvement.

### Recommendations
1. Review workload distribution across team members
2. Provide additional support to underperforming employees
3. Implement regular check-ins and performance reviews
4. Consider resource reallocation for at-risk projects

*Note: LLM-generated insights unavailable. Showing basic analysis.*""",
            "metadata": {
                "total_projects": stats.get('total_projects', 0),
                "total_employees": len(employees),
                "category": category,
                "generated_at": datetime.now().isoformat(),
                "fallback": True
            }
        }

def get_cached_data(key, ttl=300):
    """Get data from cache if not expired"""
    if key in cache and key in cache_timestamps:
        if (datetime.now() - cache_timestamps[key]).total_seconds() < ttl:
            print(f"Returning cached data for key: {key}")
            return cache[key]
    return None

def set_cached_data(key, data):
    """Set data in cache"""
    cache[key] = data
    cache_timestamps[key] = datetime.now()
    print(f"Cached data for key: {key}")

def precache_voice_responses():
    """Pre-cache TTS audio for common responses using TTS cache"""
    try:
        from voice.tts_cache import get_tts_cache
        
        tts = get_tts_instance()
        tts_cache = get_tts_cache()
        
        # Use the TTS cache's preload method
        cached_count = tts_cache.preload(tts)
        
        print(f"✓ TTS cache preloaded: {cached_count} phrases ready")
        
        # Also maintain old cache for backward compatibility
        global voice_audio_cache
        all_responses = (
            QUICK_GREETINGS + 
            QUICK_GOODBYES + 
            QUICK_THANKS + 
            QUICK_CONFIRMATIONS + 
            QUICK_CLARIFICATIONS
        )
        
        for response in all_responses:
            cached = tts_cache.get(response)
            if cached:
                voice_audio_cache[response] = {
                    'success': True,
                    'audio_base64': cached['audio_base64'],
                    'mime_type': cached['mime_type']
                }
        
        print(f"✓ Legacy cache populated: {len(voice_audio_cache)} responses")
        
    except Exception as e:
        print(f"Warning: Could not pre-cache voice responses: {e}")
        import traceback
        traceback.print_exc()

# ======== Task Generation Endpoint (from root api.py) ========
@app.route('/generate-tasks', methods=['POST'])
def generate_tasks():
    """Generate task breakdown for projects using LLM"""
    try:
        print("\n=== POST /generate-tasks ===")
        data = request.json
        project_name = data.get('project_name')
        project_description = data.get('project_description')

        if not project_name or not project_description:
            return jsonify({"error": "Project name and description are required"}), 400

        # Import the task breakdown function from the parent directory
        import sys
        import os
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        
        from task_breakdown import generate_task_breakdown
        
        result = generate_task_breakdown(project_name, project_description)
        return jsonify({"tasks": result})
    except Exception as e:
        print(f"❌ Error in generate_tasks: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/projects', methods=['GET'])
def get_projects_analytics():
    """Get project analytics data"""
    try:
        print("\n=== GET /api/analytics/projects ===")
        category = request.args.get('category', default=None, type=str)
        cache_key = f"analytics:projects:{category or 'all'}"
        
        # Check cache
        cached_data = get_cached_data(cache_key, config.CACHE_TTL)
        if cached_data:
            return jsonify(cached_data)
        
        # Fetch fresh data
        print(f"Fetching fresh projects data for category: {category}...")
        fetcher = DataFetcher()
        fetcher.connect()
        projects_data = fetcher.fetch_projects_data(category=category)
        fetcher.disconnect()
        
        print(f"Fetched {len(projects_data)} projects")
        
        # Cache the result
        set_cached_data(cache_key, projects_data)
        
        return jsonify(projects_data)
    
    except Exception as e:
        print(f"Error in get_projects_analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/employees', methods=['GET'])
def get_employees_analytics():
    """Get employee analytics data"""
    try:
        print("\n=== GET /api/analytics/employees ===")
        days = request.args.get('days', default=30, type=int)
        category = request.args.get('category', default=None, type=str)
        cache_key = f"analytics:employees:{category or 'all'}:{days}"
        
        # Check cache
        cached_data = get_cached_data(cache_key, config.CACHE_TTL)
        if cached_data:
            return jsonify(cached_data)
        
        # Fetch fresh data
        print(f"Fetching fresh employees data for category: {category} (last {days} days)...")
        fetcher = DataFetcher()
        fetcher.connect()
        employee_data = fetcher.fetch_employee_reports(days, category=category)
        fetcher.disconnect()
        
        print(f"Fetched {len(employee_data)} employees")
        
        # Cache the result
        set_cached_data(cache_key, employee_data)
        
        return jsonify(employee_data)
    
    except Exception as e:
        print(f"Error in get_employees_analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Get analytics summary with stats"""
    try:
        print("\n=== GET /api/analytics/summary ===")
        category = request.args.get('category', default='service-delivery', type=str)
        cache_key = f"analytics:summary:{category}"
        
        print(f"Requested category: {category}")
        
        # Check cache
        cached_data = get_cached_data(cache_key, config.CACHE_TTL)
        if cached_data:
            print(f"Returning cached data for {category}")
            return jsonify(cached_data)
        
        # Fetch fresh data
        print(f"Fetching analytics summary for category: {category}...")
        fetcher = DataFetcher()
        fetcher.connect()
        summary_data = fetcher.fetch_analytics_summary(category=category)
        fetcher.disconnect()
        
        print(f"Summary: {len(summary_data.get('projects', []))} projects, {len(summary_data.get('employees', []))} employees")
        print(f"Stats: {summary_data.get('summary_stats', {})}")
        
        # Cache the result
        set_cached_data(cache_key, summary_data)
        
        return jsonify(summary_data)
    
    except Exception as e:
        print(f"Error in get_analytics_summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/insights', methods=['GET'])
def get_insights():
    """Get LLM-generated insights for dashboard"""
    try:
        print("\n=== GET /api/analytics/insights ===")
        category = request.args.get('category', default='service-delivery', type=str)
        cache_key = f"analytics:insights:{category}"
        
        print(f"Requested category for insights: {category}")
        
        # Check cache
        cached_data = get_cached_data(cache_key, config.CACHE_TTL)
        if cached_data:
            print(f"Returning cached insights for {category}")
            return jsonify(cached_data)
        
        # Fetch and analyze data
        import time
        start_time = time.time()
        print(f"Generating fresh insights for category: {category}...")
        
        fetcher = DataFetcher()
        fetcher.connect()
        
        fetch_start = time.time()
        analytics_data = fetcher.fetch_analytics_summary(category=category)
        fetch_time = time.time() - fetch_start
        print(f"⏱️  Data fetch took: {fetch_time:.2f}s")
        
        fetcher.disconnect()
        
        print(f"Analytics data: {len(analytics_data.get('projects', []))} projects, {len(analytics_data.get('employees', []))} employees")
        
        # Generate structured insights using LLM with detailed organizational overview
        llm_start = time.time()
        insights = generate_organizational_insights(analytics_data, category)
        llm_time = time.time() - llm_start
        print(f"⏱️  LLM generation took: {llm_time:.2f}s")
        
        # Add summary stats and category info
        insights["summary_stats"] = analytics_data.get("summary_stats", {})
        insights["category"] = category
        
        # Cache the result
        set_cached_data(cache_key, insights)
        
        total_time = time.time() - start_time
        print(f"⏱️  TOTAL insights generation time: {total_time:.2f}s")
        print(f"Generated insights successfully for {category}")
        
        return jsonify(insights)
    
    except Exception as e:
        print(f"Error in get_insights: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "project_insights": {
                "summary": "Error generating insights. Please check server logs.",
                "at_risk": [],
                "top_performers": [],
                "resource_insights": "",
                "recommendations": []
            },
            "employee_insights": {
                "summary": "Error generating insights. Please check server logs.",
                "top_performers": [],
                "needs_attention": [],
                "workload_analysis": "",
                "recommendations": []
            },
            "summary_stats": {},
            "metadata": {
                "total_projects": 0,
                "total_employees": 0
            }
        }), 500

@app.route('/api/analytics/refresh', methods=['POST'])
def refresh_cache():
    """Clear cache and refresh analytics data"""
    try:
        print("\n=== POST /api/analytics/refresh ===")
        global cache, cache_timestamps
        
        # Clear in-memory cache
        cache = {}
        cache_timestamps = {}
        print("✓ In-memory cache cleared")
        
        # Also trigger RAG sync to ensure fresh data for insights
        try:
            agent = RAGAgent()
            agent.sync_data(force=True)
            print("✓ RAG data synced")
        except Exception as e:
            print(f"⚠️  RAG sync skipped: {e}")
        
        print("Cache refreshed successfully")
        return jsonify({"message": "Cache refreshed successfully", "timestamp": datetime.now().isoformat()})
    
    except Exception as e:
        print(f"Error in refresh_cache: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        print("\n=== GET /api/analytics/health ===")
        
        # Lightweight check - just return status
        # We don't need to query the DB every time just to check if API is alive
        
        health_data = {
            "status": "healthy",
            "service": "Analytics LLM API",
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"Health check: {health_data}")
        return jsonify(health_data)
        
    except Exception as e:
        print(f"Health check failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500
    
    except Exception as e:
        print(f"Health check failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# ================================
# RAG ENDPOINTS
# ================================

@app.route('/api/analytics/rag/query', methods=['POST'])
def rag_query():
    """
    Answer cofounder questions using RAG
    
    Request body:
    {
        "question": "What projects are at risk?",
        "category": "service-delivery" (optional),
        "conversation_history": [] (optional)
    }
    """
    try:
        print("\n=== POST /api/analytics/rag/query ===")
        data = request.get_json()
        
        question = data.get('question')
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        category = data.get('category')
        conversation_history = data.get('conversation_history', [])
        conversation_state = data.get('conversation_state')  # For multi-turn interactions
        
        print(f"Question: {question}")
        if category:
            print(f"Category: {category}")
        if conversation_state:
            print(f"Conversation State: {conversation_state.get('step', 'N/A')}")
        
        # Handle casual greetings smartly
        greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 
                     'whats up', "what's up", 'howdy', 'greetings', 'yo', 'sup',
                     'kya haal hai', 'kya hal hai', 'namaste', 'kaise ho', 'kaise hain']
        
        question_lower = question.lower().strip().replace('?', '').replace('!', '')
        
        # Check if it's just a greeting (not a question about data)
        is_greeting = any(question_lower == g or question_lower.startswith(g + ' ') for g in greetings)
        is_greeting = is_greeting and len(question_lower.split()) <= 4  # Short greetings only (Hinglish may be longer)
        
        if is_greeting:
            import random
            from datetime import datetime
            friendly_responses = [
                "Hello! I'm your business assistant. I can help you with information about employees, projects, tasks, and team performance. What would you like to know?",
                "Hi there! Ready to help with any questions about your company data. What can I look up for you?",
                "Hey! I'm here to assist with business insights. Ask me about employees, projects, or anything else!",
                "Good to hear from you! I can provide information on your team, projects, and operations. What interests you?",
                "Namaste! Bhaiya, kya jaanna chahte hain? Employees, projects ya tasks ke baare mein?",
                "Kaise ho! Main aapka business assistant hoon. Aapki company ke data ke baare mein kuch bhi pooch sakte hain.",
                "Sahi chal raha hai sab! Kya help karun aaj?",
            ]
            
            return jsonify({
                "answer": random.choice(friendly_responses),
                "question": question,
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "is_greeting": True
            })

        # Use global RAG agent
        global rag_agent_instance
        if rag_agent_instance is None:
            rag_agent_instance = RAGAgent()
        
        # Get answer with timing
        import time
        query_start = time.time()
        response = rag_agent_instance.query(
            question=question,
            category=category,
            conversation_history=conversation_history,
            conversation_state=conversation_state
        )
        query_time = time.time() - query_start
        
        # Log token usage and pricing
        token_usage = response.get('token_usage', {})
        if token_usage:
            prompt_tokens = token_usage.get('prompt_tokens', 0)
            completion_tokens = token_usage.get('completion_tokens', 0)
            total_tokens = token_usage.get('total_tokens', 0)
            
            # Pricing database (same as voice pipeline)
            MODEL_PRICING = {
                'openai/o1': {'input': 15.0, 'output': 60.0},  # flagship reasoning
                'openai/o3-mini': {'input': 1.10, 'output': 4.40},
                'openai/gpt-4o-mini': {'input': 0.15, 'output': 0.60},
                'openai/gpt-4o': {'input': 5.0, 'output': 15.0},
                'google/gemini-flash-1.5': {'input': 0.075, 'output': 0.30},
                'anthropic/claude-3-haiku': {'input': 0.25, 'output': 1.25},
            }
            
            from config import AnalyticsLLMConfig
            config = AnalyticsLLMConfig()
            current_model = config.MODEL_NAME
            
            pricing = MODEL_PRICING.get(current_model, {'input': 0, 'output': 0})
            input_cost = (prompt_tokens / 1_000_000) * pricing['input']
            output_cost = (completion_tokens / 1_000_000) * pricing['output']
            total_cost = input_cost + output_cost
            
            print(f"\n📊 Token Usage ({current_model}):")
            print(f"   • Input:  {prompt_tokens:,} tokens (${input_cost:.6f})")
            print(f"   • Output: {completion_tokens:,} tokens (${output_cost:.6f})")
            print(f"   • Total:  {total_tokens:,} tokens")
            print(f"💰 Cost: ${total_cost:.6f} (~${total_cost * 1000:.3f} per 1K queries)")
            print(f"⏱️  Query Time: {query_time:.2f}s\n")
        
        # If action needs to be executed immediately
        if response.get('execute_now') and response.get('action_params'):
            # Execute the action via backend API
            result = _execute_create_task(response['action_params'], request.headers.get('Authorization', '').replace('Bearer ', ''))
            
            if result.get('success'):
                response['answer'] = f"✅ **Task created successfully!**\n\nTask ID: {result.get('task_id')}\n\n{result.get('message', '')}"
                if result.get('overriddenTasks'):
                    response['answer'] += f"\n\n⚠️ **{len(result['overriddenTasks'])} task(s) were postponed** due to urgency."
            else:
                response['answer'] = f"❌ **Failed to create task:** {result.get('error')}"
            
            response['action_complete'] = True
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in rag_query: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "success": False
        }), 500



@app.route('/api/analytics/rag/health', methods=['GET'])
def rag_health():
    """Check RAG system health"""
    try:
        print("\n=== GET /api/analytics/rag/health ===")
        
        # Test MongoDB connection via RAG agent
        global rag_agent_instance
        if rag_agent_instance is None:
            rag_agent_instance = RAGAgent()
        
        return jsonify({
            "status": "healthy",
            "service": "Direct MongoDB RAG",
            "retrieval_method": "Direct MongoDB Queries",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"RAG health check failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/analytics/rag/summary', methods=['GET'])
def rag_summary():
    """Get high-level summary insights for cofounder"""
    try:
        print("\n=== GET /api/analytics/rag/summary ===")
        category = request.args.get('category', default=None, type=str)
        
        # Initialize RAG agent
        rag_agent = RAGAgent()
        
        # Get summary insights
        insights = rag_agent.get_summary_insights(category=category)
        
        return jsonify(insights)
        
    except Exception as e:
        print(f"Error in rag_summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/analytics/rag/execute-action', methods=['POST'])
def execute_action():
    """
    Execute an action (like task creation) on behalf of the cofounder
    Proxies authenticated requests to the main backend API
    """
    try:
        print("\n=== POST /api/analytics/rag/execute-action ===")
        
        # Get request data
        data = request.get_json()
        action_type = data.get('action_type')
        action_params = data.get('action_params')
        
        # Get JWT token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                "success": False,
                "error": "Missing or invalid authorization token"
            }), 401
        
        token = auth_header.split(' ')[1]
        
        print(f"Action type: {action_type}")
        print(f"Action params: {action_params}")
        
        # Route to appropriate action handler
        if action_type == 'create_task':
            result = _execute_create_task(action_params, token)
            return jsonify(result)
        else:
            return jsonify({
                "success": False,
                "error": f"Unknown action type: {action_type}"
            }), 400
        
    except Exception as e:
        print(f"Error in execute_action: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def _execute_create_task(params: dict, token: str) -> dict:
    """
    Execute task creation by calling main backend API
    
    Args:
        params: Task parameters from RAG extraction
        token: JWT token for authentication
        
    Returns:
        Result dictionary
    """
    import requests as req
    from data_fetcher import DataFetcher
    
    # Main backend URL
    backend_url = config.BACKEND_URL or "http://localhost:5001"
    
    # Resolve project and assignee names to IDs if needed
    fetcher = DataFetcher()
    fetcher.connect()
    
    project_id = params.get("project_id")
    assignee_id = params.get("assignee_id")
    
    # If only project_name is provided, resolve to ID
    if not project_id and params.get("project_name"):
        project = fetcher.find_project_by_name(params["project_name"])
        if project:
            project_id = project["_id"]
            print(f"✓ Resolved project '{params['project_name']}' to ID: {project_id}")
        else:
            fetcher.disconnect()
            return {
                "success": False,
                "error": f"Could not find project named '{params['project_name']}'"
            }
    
    # If only assignee_name is provided, resolve to ID (restrict to managers/HR)
    if not assignee_id and params.get("assignee_name"):
        user = fetcher.find_user_by_name(params["assignee_name"], role_filter=["manager", "hr"])
        if user:
            assignee_id = user["_id"]
            assignee_role = user.get("role", "manager")
            print(f"✓ Resolved assignee '{params['assignee_name']}' to ID: {assignee_id} ({assignee_role})")
        else:
            fetcher.disconnect()
            return {
                "success": False,
                "error": f"Could not find manager/HR user named '{params['assignee_name']}'"
            }
    else:
        assignee_role = params.get("assignee_role", "manager")
    
    fetcher.disconnect()
    
    # Check if project is required (not required for HR tasks)
    skip_project = params.get("skip_project", False) or assignee_role.lower() == "hr"
    
    # Prepare task creation payload
    task_payload = {
        "title": params.get("title"),
        "description": params.get("description"),
        "assignedToId": assignee_id,
        "deadline": params.get("deadline_iso"),
        "points": params.get("points", 3),
        "priority": params.get("priority", "high")
    }
    
    # Only include projectId if we have one and it's not skipped
    if project_id and not skip_project:
        task_payload["projectId"] = project_id
    
    # Add cofounder-specific metadata if available
    if params.get("source") == "cofounder_rag":
        task_payload["source"] = "cofounder_rag"
        task_payload["requiresOverride"] = params.get("requires_override", False)
    
    print(f"Sending task creation request to {backend_url}/api/tasks")
    print(f"Payload: {task_payload}")
    print(f"Skip project: {skip_project}, Assignee role: {assignee_role}")
    
    try:
        # Call main backend API
        response = req.post(
            f"{backend_url}/api/tasks",
            json=task_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        response.raise_for_status()
        
        result = response.json()
        print(f"✓ Task created successfully: {result}")
        
        return {
            "success": True,
            "message": "Task created successfully",
            "data": result.get("data"),
            "task_id": result.get("data", {}).get("_id"),
            "overriddenTasks": result.get("overriddenTasks", []),
            "pointsBoost": result.get("pointsBoost")
        }
        
    except req.exceptions.HTTPError as e:
        error_msg = f"Backend API error: {e.response.text if e.response else str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "error": error_msg,
            "status_code": e.response.status_code if e.response else 500
        }
    except Exception as e:
        error_msg = f"Request failed: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "error": error_msg
        }


# ================================
# VOICE AGENT ENDPOINTS
# ================================

def get_stt_instance():
    """Get or create Speech-to-Text instance"""
    global stt_instance
    if stt_instance is None:
        stt_instance = SpeechToText()
    return stt_instance

def get_tts_instance():
    """Get or create ElevenLabs Text-to-Speech instance"""
    global tts_instance
    if tts_instance is None:
        tts_instance = get_elevenlabs_tts(voice="female_warm")
    return tts_instance


@app.route('/api/analytics/rag/voice-query', methods=['POST'])
def voice_query():
    """
    Complete voice query endpoint: Audio In -> RAG -> Audio Out
    
    Accepts audio file, transcribes with Whisper, queries RAG,
    converts response to speech with Edge TTS, returns audio.
    
    Request: multipart/form-data with 'audio' file
    Response: JSON with audio_base64 of spoken response
    """
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    import time as time_module
    import uuid
    session_id = str(uuid.uuid4())
    stt_start_time = None
    rag_start_time = None
    tts_start_time = None
    stt_duration = 0
    rag_duration = 0
    tts_duration = 0
    
    input_filepath = None
    output_filepath = None
    
    try:
        print("\n=== POST /api/analytics/rag/voice-query ===")
        
        # Check for audio file in request
        if 'audio' not in request.files:
            return jsonify({
                "success": False,
                "error": "No audio file provided. Send audio in 'audio' field."
            }), 400
        
        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({
                "success": False,
                "error": "Empty audio file"
            }), 400
        
        # Get audio format from content type or filename
        content_type = audio_file.content_type or 'audio/webm'
        audio_format = AudioUtils.get_audio_format_from_mimetype(content_type)
        
        print(f"Received audio: {audio_file.filename}, type: {content_type}, format: {audio_format}")
        
        # Save uploaded audio to temp file
        audio_data = audio_file.read()
        input_filepath = AudioUtils.save_audio_file(audio_data, audio_format)
        
        # Get optional parameters
        category = request.form.get('category')
        language = request.form.get('language', 'auto')
        voice = request.form.get('voice')
        conversation_state = request.form.get('conversation_state')
        
        if conversation_state:
            import json as json_lib
            conversation_state = json_lib.loads(conversation_state)
            print(f"🔄 RECEIVED conversation_state: {conversation_state.get('step', 'unknown')}")
        else:
            print("🆕 NO conversation_state (new conversation)")
        
        # Step 1: Speech-to-Text
        print("\n--- Step 1: Speech-to-Text ---")
        stt_start_time = time_module.time()
        stt = get_stt_instance()
        transcription = stt.transcribe(input_filepath, language=language)
        stt_duration = time_module.time() - stt_start_time
        
        if not transcription.get('success'):
            return jsonify({
                "success": False,
                "error": f"Transcription failed: {transcription.get('error')}",
                "step": "speech-to-text"
            }), 500
        
        question = transcription.get('text', '').strip()
        
        if not question:
            return jsonify({
                "success": False,
                "error": "Could not transcribe any text from audio",
                "step": "speech-to-text"
            }), 400
        
        print(f"Transcribed question: {question}")
        
        # Step 1.5: STT Correction DISABLED (saves ~100ms + costs)
        # Uncomment below if needed in future:
        # stt_corrector = get_stt_corrector()
        # correction_result = stt_corrector.correct(question)
        # if correction_result['changed']:
        #     question = correction_result['corrected']
        
        # Step 2: Check for quick responses (greetings/goodbyes) before RAG
        print("\n--- Step 2: Processing Query ---")
        rag_start_time = time_module.time()

        question_lower = question.lower().strip()
        # Remove common punctuation for matching
        question_clean = question_lower.replace('?', '').replace('!', '').replace('.', '').replace(',', '').strip()
        
        # Greetings - short, friendly responses
        greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
                     'whats up', "what's up", 'howdy', 'greetings', 'yo', 'sup', 'hii', 'hiii',
                     'kya haal hai', 'kya hal hai', 'namaste', 'kaise ho', 'kaise hain',
                     'hi there', 'hello there', 'hey there']
        
        # Goodbyes - polite closings
        goodbyes = ['bye', 'goodbye', 'good bye', 'see you', 'see ya', 'take care', 
                    'goodnight', 'good night', 'bye bye', 'byebye', 'later', 'cya',
                    'thanks bye', 'thank you bye', 'ok bye', 'okay bye',
                    'alvida', 'phir milenge', 'chalo', 'theek hai bye']
        
        # Thanks - gratitude expressions
        thanks = ['thank you', 'thanks', 'thank', 'thankyou', 'thx', 'ty',
                  'appreciate it', 'thanks a lot', 'thanks so much', 'much appreciated',
                  'shukriya', 'dhanyavaad', 'cool thanks', 'awesome thanks']
        
        # Confirmations - yes/no/ok responses
        confirmations = ['yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'alright',
                        'fine', 'got it', 'understood', 'right', 'correct', 'exactly',
                        'han', 'haan', 'theek hai', 'acha', 'achha']
        
        # Clarifications - didn't hear or understand
        clarifications = ['what', 'huh', 'pardon', 'sorry', 'repeat', 'again',
                         'come again', 'say that again', 'i didnt hear', "i didn't hear",
                         'can you repeat', 'kya', 'kya kaha']
        
        # Check for action keywords first - if detected, skip quick responses
        action_keywords = ['create', 'make', 'add', 'assign', 'schedule', 'update', 'delete', 'remove']
        has_action_keyword = any(keyword in question_clean for keyword in action_keywords)
        
        # Check patterns - use word boundary matching to avoid false positives
        import re
        def matches_whole_word(text, patterns):
            """Check if any pattern matches as a whole word"""
            for pattern in patterns:
                # Create regex for whole word match
                if re.search(r'\b' + re.escape(pattern) + r'\b', text):
                    return True
            return False
        
        is_greeting = matches_whole_word(question_clean, greetings) and len(question_clean.split()) <= 7
        is_goodbye = matches_whole_word(question_clean, goodbyes) and len(question_clean.split()) <= 5
        is_thanks = matches_whole_word(question_clean, thanks) and len(question_clean.split()) <= 6
        is_confirmation = matches_whole_word(question_clean, confirmations) and len(question_clean.split()) <= 3
        is_clarification = matches_whole_word(question_clean, clarifications) and len(question_clean.split()) <= 6
        
        # Don't use quick responses if action keyword detected
        if has_action_keyword:
            is_greeting = is_goodbye = is_thanks = is_confirmation = is_clarification = False
        
        import random
        
        if is_greeting:
            # Use pre-defined quick greetings
            answer = random.choice(QUICK_GREETINGS)
            rag_response = {"answer": answer, "success": True, "is_greeting": True}
            print(f"⚡ Quick greeting response: {answer}")
            
        elif is_goodbye:
            # Use pre-defined quick goodbyes
            answer = random.choice(QUICK_GOODBYES)
            rag_response = {"answer": answer, "success": True, "is_goodbye": True}
            print(f"⚡ Quick goodbye response: {answer}")
            
        elif is_thanks:
            # Use pre-defined quick thanks
            answer = random.choice(QUICK_THANKS)
            rag_response = {"answer": answer, "success": True, "is_thanks": True}
            print(f"⚡ Quick thanks response: {answer}")
            
        elif is_confirmation:
            # Use pre-defined quick confirmations
            answer = random.choice(QUICK_CONFIRMATIONS)
            rag_response = {"answer": answer, "success": True, "is_confirmation": True}
            print(f"⚡ Quick confirmation response: {answer}")
            
        elif is_clarification:
            # Use pre-defined quick clarifications
            answer = random.choice(QUICK_CLARIFICATIONS)
            rag_response = {"answer": answer, "success": True, "is_clarification": True}
            print(f"⚡ Quick clarification response: {answer}")
            
        else:
            # Use RAG agent for actual questions
            print("Sending to RAG agent...")
            global rag_agent_instance
            if rag_agent_instance is None:
                rag_agent_instance = RAGAgent()
            
            rag_response = rag_agent_instance.query(
                question=question,
                category=category,
                conversation_history=[],
                conversation_state=conversation_state,
                is_voice=True  # Enable conversational voice-friendly prompts
            )
        
        answer = rag_response.get('answer', 'Sorry, I could not generate a response.')
        rag_duration = time_module.time() - rag_start_time
        print(f"RAG Answer: {answer[:100]}..." if len(answer) > 100 else f"RAG Answer: {answer}")
        
        # Step 3: Text-to-Speech
        print("\n--- Step 3: Text-to-Speech ---")
        tts_start_time = time_module.time()
        tts = get_tts_instance()
        
        # Generate temp file for TTS output
        import tempfile
        tts_output_path = tempfile.mktemp(suffix=".mp3", dir=tempfile.gettempdir())
        print(f"Synthesizing speech ({len(answer)} chars) to: {tts_output_path}")
        
        if voice:
            tts.set_voice(voice)
        tts_result = tts.synthesize(answer, output_file=tts_output_path)
        output_filepath = tts_result.get('output_path')
        
        if not tts_result.get('success'):
            # Return text response if TTS fails
            return jsonify({
                "success": True,
                "question": question,
                "answer": answer,
                "audio_available": False,
                "tts_error": tts_result.get('error'),
                "citations": rag_response.get('citations', []),
                "is_action": rag_response.get('is_action', False),
                "conversation_state": rag_response.get('conversation_state'),
                "timestamp": datetime.now().isoformat()
            })
        
        output_filepath = tts_result.get('output_path')
        tts_duration = time_module.time() - tts_start_time
        tts_engine = tts_result.get('engine', 'unknown')
        
        # Log latency to CSV
        from voice.latency_logger import get_latency_logger
        latency_logger = get_latency_logger()
        latency_logger.log(
            session_id=session_id,
            query_text=question,
            stt_time=stt_duration,
            rag_time=rag_duration,
            tts_time=tts_duration,
            tts_engine=tts_engine,
            answer_length=len(answer),
            success=True
        )
        
        print("✓ Voice query completed successfully")
        
        return jsonify({
            "success": True,
            "question": question,
            "answer": answer,
            "audio_base64": tts_result.get('audio_base64'),
            "audio_format": tts_result.get('format', 'mp3'),
            "audio_mime_type": tts_result.get('mime_type', 'audio/mp3'),
            "voice_used": tts_result.get('voice'),
            "citations": rag_response.get('citations', []),
            "domains_searched": rag_response.get('domains_searched', []),
            "is_action": rag_response.get('is_action', False),
            "conversation_state": rag_response.get('conversation_state'),
            "timestamp": datetime.now().isoformat(),
            "timing": {
                "stt_ms": int(stt_duration * 1000),
                "rag_ms": int(rag_duration * 1000),
                "tts_ms": int(tts_duration * 1000),
                "total_ms": int((stt_duration + rag_duration + tts_duration) * 1000)
            }
        })
        
    except Exception as e:
        print(f"Error in voice_query: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    
    finally:
        # OPTIMIZATION: Async cleanup - don't block response on file deletion
        import threading
        
        def async_cleanup():
            if input_filepath:
                AudioUtils.cleanup_file(input_filepath)
            if output_filepath:
                AudioUtils.cleanup_file(output_filepath)
        
        # Start cleanup in background thread
        if input_filepath or output_filepath:
            cleanup_thread = threading.Thread(target=async_cleanup, daemon=True)
            cleanup_thread.start()


@app.route('/api/analytics/rag/voice/latency-stats', methods=['GET'])
def voice_latency_stats():
    """Get aggregated latency statistics for voice queries"""
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    from voice.latency_logger import get_latency_logger
    logger = get_latency_logger()
    stats = logger.get_stats(last_n=100)
    
    return jsonify({
        "success": True,
        "stats": {
            "query_count": stats['count'],
            "avg_stt_ms": round(stats['avg_stt'], 1),
            "avg_rag_ms": round(stats['avg_rag'], 1),
            "avg_tts_ms": round(stats['avg_tts'], 1),
            "avg_total_ms": round(stats['avg_total'], 1),
            "min_total_ms": stats['min_total'] if stats['min_total'] != float('inf') else 0,
            "max_total_ms": stats['max_total']
        },
        "log_file": "logs/latency.csv"
    })


@app.route('/api/analytics/rag/speech-to-text', methods=['POST'])
def speech_to_text():
    """
    Convert audio to text using OpenAI Whisper (local).
    
    Request: multipart/form-data with 'audio' file
    Response: JSON with transcribed text
    """
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    input_filepath = None
    
    try:
        print("\n=== POST /api/analytics/rag/speech-to-text ===")
        
        if 'audio' not in request.files:
            return jsonify({
                "success": False,
                "error": "No audio file provided"
            }), 400
        
        audio_file = request.files['audio']
        
        # Get format and save
        content_type = audio_file.content_type or 'audio/webm'
        audio_format = AudioUtils.get_audio_format_from_mimetype(content_type)
        
        audio_data = audio_file.read()
        input_filepath = AudioUtils.save_audio_file(audio_data, audio_format)
        
        # Optional language hint
        language = request.form.get('language', 'auto')
        
        # Transcribe
        stt = get_stt_instance()
        result = stt.transcribe(input_filepath, language=language)
        
        return jsonify({
            "success": result.get('success', False),
            "text": result.get('text', ''),
            "language": result.get('language'),
            "error": result.get('error'),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in speech_to_text: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    
    finally:
        if input_filepath:
            AudioUtils.cleanup_file(input_filepath)


@app.route('/api/analytics/rag/text-to-speech', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech using Edge TTS.
    
    Request: JSON with 'text' field
    Response: JSON with audio_base64
    """
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    output_filepath = None
    
    try:
        print("\n=== POST /api/analytics/rag/text-to-speech ===")
        
        data = request.get_json()
        
        text = data.get('text')
        if not text:
            return jsonify({
                "success": False,
                "error": "No text provided"
            }), 400
        
        voice = data.get('voice')
        format_type = data.get('format', 'mp3')
        
        # Check cache first
        from voice.tts_cache import get_tts_cache
        tts_cache = get_tts_cache()
        cached = tts_cache.get(text)
        if cached:
            print(f"   ⚡ TTS cache hit: '{text[:30]}...'")
            return jsonify({
                "success": True,
                "audio_base64": cached['audio_base64'],
                "format": cached.get('format', format_type),
                "mime_type": cached.get('mime_type', f'audio/{format_type}'),
                "cached": True
            })

        # Create temp output file
        import tempfile
        output_filepath = tempfile.mktemp(suffix=f".{format_type}", dir=tempfile.gettempdir())
        
        # Synthesize with ElevenLabs
        tts = get_tts_instance()
        result = tts.synthesize(text, output_file=output_filepath, voice=voice)
        
        if result.get('success'):
            # Save to cache for next time
            tts_cache.set(text, result['audio_base64'], f'audio/{format_type}')
            print(f"   💾 Cached new phrase: '{text[:30]}...'")

        return jsonify({
            "success": result.get('success', False),
            "audio_base64": result.get('audio_base64'),
            "format": result.get('format'),
            "mime_type": f"audio/{format_type}",
            "voice": result.get('voice'),
            "engine": result.get('engine'),
            "error": result.get('error'),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in text_to_speech: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    
    finally:
        if output_filepath:
            AudioUtils.cleanup_file(output_filepath)


@app.route('/api/analytics/rag/voice/health', methods=['GET'])
def voice_health():
    """Check voice agent availability"""
    if not VOICE_ENABLED:
        return jsonify({'status': 'disabled', 'available': False, 'message': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    try:
        print("\n=== GET /api/analytics/rag/voice/health ===")
        
        stt_available = False
        tts_available = False
        
        try:
            stt = get_stt_instance()
            stt_available = stt.is_available()
        except Exception as e:
            print(f"STT check failed: {e}")
        
        try:
            tts = get_tts_instance()
            tts_available = tts.is_available()
        except Exception as e:
            print(f"TTS check failed: {e}")
        
        return jsonify({
            "status": "healthy" if (stt_available and tts_available) else "partial",
            "speech_to_text": {
                "available": stt_available,
                "engine": "OpenAI Whisper (Local)"
            },
            "text_to_speech": {
                "available": tts_available,
                "engine": "Microsoft Edge TTS"
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Voice health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500


@app.route('/api/analytics/rag/voice/voices', methods=['GET'])
def get_voices():
    """Get available TTS voices"""
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    try:
        voices = TextToSpeech.get_available_voices()
        return jsonify({
            "success": True,
            "voices": voices,
            "default": TextToSpeech.DEFAULT_VOICE
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/analytics/rag/voice/latency-stats/reset', methods=['POST'])
def voice_latency_stats_reset():
    """Reset latency statistics."""
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    try:
        from voice.latency_logger import get_latency_stats
        
        get_latency_stats().reset()
        return jsonify({
            "success": True,
            "message": "Latency statistics reset"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/analytics/rag/voice-stream', methods=['POST'])
def voice_stream():
    """
    Streaming Voice Endpoint with Low-Latency Parallel Processing.
    Input: Audio file
    Output: JSON stream (NDJSON) of status updates and audio chunks.
    
    Events:
    - {"type": "status", "payload": "Listening..."}
    - {"type": "transcription", "payload": {"text": "...", "partial": bool}}
    - {"type": "intent", "payload": "intent_name"}
    - {"type": "audio", "payload": {"data": "base64", "is_filler": true}}
    - {"type": "audio", "payload": {"data": "base64", "chunk": N, "is_last": bool}}
    - {"type": "latency", "payload": {...}}
    - {"type": "done", "payload": "complete"}
    
    Query params:
    - use_parallel: "true" (default) for low-latency parallel pipeline
    """
    if not VOICE_ENABLED:
        return jsonify({'error': 'Voice service is currently disabled', 'code': 'VOICE_DISABLED'}), 503
    try:
        print("\n=== POST /api/analytics/rag/voice-stream ===")
        
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
            
        audio_file = request.files['audio']
        category = request.form.get('category')
        
        # Save audio
        content_type = audio_file.content_type or 'audio/webm'
        audio_format = AudioUtils.get_audio_format_from_mimetype(content_type)
        audio_data = audio_file.read()
        input_filepath = AudioUtils.save_audio_file(audio_data, audio_format)
        
        # Extract conversation state if present
        conversation_state = None
        if request.form.get('conversation_state'):
            try:
                conversation_state = json.loads(request.form.get('conversation_state'))
            except:
                pass
                
        # Check if client wants to handle fillers (Hybrid TTS)
        skip_filler = request.form.get('skip_filler') == 'true'
        
        # Use parallel pipeline by default for low-latency streaming
        use_parallel = request.form.get('use_parallel', 'true').lower() != 'false'

        # Generator wrapper
        def generate():
            try:
                if use_parallel:
                    # Use new parallel pipeline for low-latency streaming
                    print("🚀 Using ParallelVoicePipeline for low-latency streaming")
                    parallel_pipeline = get_parallel_pipeline()
                    for event_json in parallel_pipeline.process_request_streaming(
                        input_filepath,
                        category=category,
                        conversation_state=conversation_state,
                        skip_filler=skip_filler
                    ):
                        yield event_json
                else:
                    # Fallback to original sequential pipeline
                    print("⚙️  Using VoicePipeline (sequential fallback)")
                    pipeline = VoicePipeline()
                    for event_json in pipeline.process_request(
                        input_filepath,
                        category=category,
                        conversation_state=conversation_state,
                        skip_filler=skip_filler
                    ):
                        yield event_json
            except Exception as e:
                import traceback
                traceback.print_exc()
                # Yield error event
                yield json.dumps({
                    "type": "error", 
                    "payload": str(e)
                }) + "\n"
        
        response = Response(stream_with_context(generate()), mimetype='application/x-ndjson')
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    except Exception as e:
        print(f"Error in voice_stream: {e}")
        return jsonify({"error": str(e)}), 500




if __name__ == '__main__':
    print("=" * 60)
    print("Starting Analytics LLM API Server...")
    print(f"Using Gemini Model: {config.MODEL_NAME}")
    print(f"Database: {config.DB_NAME}")
    print(f"MongoDB URI: {config.MONGODB_URI[:50]}...")
    print(f"Server URL: http://0.0.0.0:5002")
    print(f"Also accessible at: http://localhost:5002")
    print("=" * 60)
    
    # Pre-load models for faster first response
    print("\n🚀 Pre-loading models for faster responses...")
    # try:
    #     # Pre-load Whisper model (original OpenAI Whisper as fallback)
    #     stt = get_stt_instance()
    #     stt.preload_model()
    #     print("✓ Whisper STT model pre-loaded")
    # except Exception as e:
    #     print(f"⚠️  Could not pre-load Whisper: {e}")
    
    # try:
    #     # Pre-load Hugging Face models for streaming STT (low-latency)
    #     print("\n🤖 Initializing Hugging Face models for streaming...")
    #     hf_manager = get_hf_model_manager()
    #     hf_pipeline = hf_manager.load_whisper()
    #     if hf_pipeline:
    #         hf_status = hf_manager.get_status()
    #         print(f"✓ HF models ready: {hf_status}")
    #     else:
    #         print("⚠️  HF models could not be loaded, using fallback STT")
    # except Exception as e:
    #     print(f"⚠️  Could not initialize HF models: {e}")
    
    if VOICE_ENABLED:
        try:
            # Pre-cache voice responses
            print("\n🔊 Pre-caching voice responses...")
            precache_voice_responses()
        except Exception as e:
            print(f"⚠️  Could not pre-cache voice responses: {e}")
    
    print("")
    print("=" * 60)
    print("\nAvailable endpoints:")
    print("  GET  /api/analytics/health")
    print("  GET  /api/analytics/projects")
    print("  GET  /api/analytics/employees")
    print("  GET  /api/analytics/summary")
    print("  GET  /api/analytics/insights")
    print("  POST /api/analytics/refresh")
    print("\n  🤖 RAG Endpoints (Direct MongoDB):")
    print("  POST /api/analytics/rag/query       - Ask questions in natural language")
    print("  GET  /api/analytics/rag/health      - Check RAG system status")
    print("  GET  /api/analytics/rag/summary     - Get summary insights")
    print("\n  🎤 Voice Agent Endpoints:")
    print("  POST /api/analytics/rag/voice-query     - Voice query (audio in -> audio out)")
    print("  POST /api/analytics/rag/speech-to-text  - Convert audio to text")
    print("  POST /api/analytics/rag/text-to-speech  - Convert text to audio")
    print("  GET  /api/analytics/rag/voice/health    - Check voice agent status")
    print("  GET  /api/analytics/rag/voice/voices    - List available TTS voices")
    print("\n  🔌 WebSocket Endpoints (Streaming):")
    print("  WS   /ws/voice                          - Native WebSocket voice streaming")
    print("  WS   /socket.io/                        - Socket.IO voice streaming (legacy)")
    print("=" * 60)
    print("\n⚠️  Make sure to:")
    print("  1. Keep this terminal window open")
    print("  2. The server is running on http://localhost:5002")
    print("  3. Your frontend can access this URL")
    print("\n✓ Server is ready and waiting for requests...\n")
    
    # SocketIO event handlers registered at module level

    # Pre-load STT model to eliminate first-request latency (~5s savings)
    if VOICE_ENABLED:
        print("\n🔧 Pre-loading STT model for faster first response...")
        try:
            from voice.speech_to_text import SpeechToText
            stt_instance = SpeechToText()
            stt_instance.preload_model()
            print("✓ STT model pre-loaded successfully!")
        except Exception as e:
            print(f"⚠️ STT pre-load failed (will load on first request): {e}")
    else:
        print("\n⏸  Voice service is DISABLED (set VOICE_ENABLED=true to re-enable)")
    
    # Start Flask-SocketIO server
    print("\n🚀 SocketIO server starting on http://localhost:5002")
    print("   Streaming STT events: start_streaming, audio_chunk, stop_streaming")
    socketio.run(app, host='0.0.0.0', port=5002, debug=False, allow_unsafe_werkzeug=True)



