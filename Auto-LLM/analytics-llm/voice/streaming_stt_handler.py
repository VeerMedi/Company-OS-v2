"""
WebSocket Streaming STT Handler
Real-time speech-to-text with progressive feedback
"""
import json
import time
from flask import request
from gevent import sleep
from voice.chunked_stt import get_chunked_stt
from voice.audio_utils import AudioUtils


def handle_streaming_stt(ws):
    """
    Handle WebSocket connection for streaming STT
    
    Protocol:
    - Client sends: audio chunks (binary)
    - Client sends: {"action": "end"} to finalize
    - Server sends: {"type": "partial", "text": "..."} for progress
    - Server sends: {"type": "final", "text": "...", "confidence": 0.95}
    
    Args:
        ws: WebSocket connection
    """
    print("\n=== WebSocket Streaming STT Connected ===")
    
    # Initialize processor
    processor = get_chunked_stt()
    processor.reset()
    
    # State
    chunk_count = 0
    previous_chunk = None
    language = "en"
    format_type = "webm"
    
    try:
        # Initial handshake
        ws.send(json.dumps({
            "type": "ready",
            "message": "Streaming STT ready"
        }))
        
        while True:
            # Receive message
            message = ws.receive()
            
            if message is None:
                print("⚠️ Connection closed by client")
                break
            
            # Check for text commands (JSON)
            if isinstance(message, str):
                try:
                    command = json.loads(message)
                    
                    if command.get("action") == "end":
                        # Final accuracy pass
                        print("\n🎯 Processing final accuracy pass...")
                        final_result = processor.finalize(
                            format=format_type,
                            language=language
                        )
                        
                        ws.send(json.dumps({
                            "type": "final",
                            "text": final_result.get("text", ""),
                            "confidence": final_result.get("confidence", 1.0),
                            "success": final_result.get("success", False),
                            "error": final_result.get("error"),
                            "processing_time": final_result.get("processing_time", 0)
                        }))
                        
                        print("✓ Final result sent, closing connection")
                        break
                    
                    elif command.get("action") == "config":
                        # Update configuration
                        language = command.get("language", "en")
                        format_type = command.get("format", "webm")
                        print(f"⚙️ Config updated: language={language}, format={format_type}")
                        
                        ws.send(json.dumps({
                            "type": "config_ack",
                            "language": language,
                            "format": format_type
                        }))
                        
                except json.JSONDecodeError:
                    print(f"⚠️ Invalid JSON command: {message}")
                    continue
            
            # Binary audio chunk
            elif isinstance(message, bytes):
                chunk_count += 1
                chunk_size_kb = len(message) / 1024
                print(f"📦 Received chunk #{chunk_count} ({chunk_size_kb:.1f} KB)")
                
                # Process chunk with overlap for partial result
                start_time = time.time()
                partial_result = processor.process_with_overlap(
                    current_chunk=message,
                    previous_chunk=previous_chunk,
                    format=format_type,
                    language=language
                )
                elapsed = time.time() - start_time
                
                # Send partial result
                if partial_result.get("success"):
                    partial_text = partial_result.get("text", "")
                    confidence = partial_result.get("confidence", 0.7)
                    
                    print(f"   ⏱️ Processed in {elapsed:.2f}s")
                    print(f"   📝 Partial: \"{partial_text}\" (confidence: {confidence:.2f})")
                    
                    ws.send(json.dumps({
                        "type": "partial",
                        "text": partial_text,
                        "confidence": confidence,
                        "chunk_number": chunk_count,
                        "processing_time": elapsed
                    }))
                else:
                    print(f"   ❌ Processing failed: {partial_result.get('error')}")
                
                # Store for next overlap
                previous_chunk = message
                
    except Exception as e:
        print(f"❌ Streaming STT error: {e}")
        import traceback
        traceback.print_exc()
        
        try:
            ws.send(json.dumps({
                "type": "error",
                "error": str(e)
            }))
        except:
            pass
    
    finally:
        print(f"=== Streaming STT Disconnected (processed {chunk_count} chunks) ===\n")
        processor.reset()


def handle_streaming_voice(ws):
    """
    Handle full streaming voice pipeline: STT → RAG → TTS
    
    Protocol:
    - Client sends: audio chunks + {"action": "end"}
    - Server sends: partial transcriptions + final response audio
    
    Args:
        ws: WebSocket connection
    """
    print("\n=== WebSocket Streaming Voice Connected ===")
    
    from voice.chunked_stt import get_chunked_stt
    from rag.rag_agent import get_rag_agent
    from voice.elevenlabs_tts import get_elevenlabs_tts
    
    # Initialize components
    stt_processor = get_chunked_stt()
    stt_processor.reset()
    
    chunk_count = 0
    previous_chunk = None
    
    try:
        ws.send(json.dumps({
            "type": "ready",
            "message": "Streaming voice pipeline ready"
        }))
        
        while True:
            message = ws.receive()
            
            if message is None:
                break
            
            # Handle commands
            if isinstance(message, str):
                try:
                    command = json.loads(message)
                    
                    if command.get("action") == "end":
                        # Final STT pass
                        print("\n🎯 Final STT pass...")
                        final_stt = stt_processor.finalize(format="webm", language="en")
                        
                        if not final_stt.get("success"):
                            ws.send(json.dumps({
                                "type": "error",
                                "error": "Transcription failed"
                            }))
                            break
                        
                        question = final_stt.get("text", "")
                        print(f"✓ Final transcript: {question}")
                        
                        # Send final transcript
                        ws.send(json.dumps({
                            "type": "transcript",
                            "text": question
                        }))
                        
                        # RAG processing
                        print("🤖 Processing with RAG...")
                        rag = get_rag_agent()
                        response = rag.query(question, category="service-onboarding")
                        answer = response.get("answer", "I couldn't process that.")
                        
                        # Send answer text
                        ws.send(json.dumps({
                            "type": "answer",
                            "text": answer
                        }))
                        
                        # TTS
                        print("🎤 Generating speech...")
                        import tempfile
                        tts_file = tempfile.mktemp(suffix=".mp3")
                        tts = get_elevenlabs_tts()
                        tts_result = tts.synthesize(answer, output_file=tts_file)
                        
                        if tts_result.get("success"):
                            # Send audio
                            audio_b64 = tts_result.get("audio_base64")
                            ws.send(json.dumps({
                                "type": "audio",
                                "audio_base64": audio_b64,
                                "format": "mp3"
                            }))
                        
                        print("✓ Complete response sent")
                        break
                        
                except json.JSONDecodeError:
                    continue
            
            # Audio chunk
            elif isinstance(message, bytes):
                chunk_count += 1
                print(f"📦 Chunk #{chunk_count}")
                
                # Process for partial STT
                partial = stt_processor.process_with_overlap(
                    current_chunk=message,
                    previous_chunk=previous_chunk,
                    format="webm",
                    language="en"
                )
                
                if partial.get("success"):
                    ws.send(json.dumps({
                        "type": "partial",
                        "text": partial.get("text", "")
                    }))
                
                previous_chunk = message
                
    except Exception as e:
        print(f"❌ Streaming voice error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        print(f"=== Streaming Voice Disconnected ===\n")
        stt_processor.reset()
