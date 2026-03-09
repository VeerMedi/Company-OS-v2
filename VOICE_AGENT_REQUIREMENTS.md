# Voice Agent Requirements for Hustle OS v2

## Executive Summary

This document outlines the requirements for finding and integrating an open-source voice agent into Hustle OS v2. Our current implementation faces significant latency, reliability, and user experience issues that need to be addressed.

---

## Current System Overview

### Technology Stack
- **STT (Speech-to-Text)**: OpenAI Whisper (local) + Hugging Face Distil-Whisper (streaming)
- **TTS (Text-to-Speech)**: Microsoft Edge TTS (free neural voices) + Chunked streaming
- **LLM**: RAG-based system with ChromaDB vector database
- **Frontend**: React with WebM/WAV audio recording
- **Backend**: Python Flask + Node.js Express

### Architecture
```
Frontend (React) 
    ↓ WebM/WAV Audio
Backend (Python Flask)
    ↓ Whisper STT
    ↓ RAG Query Processing
    ↓ Edge TTS
    ↑ Audio Response + Captions
Frontend Display
```

---

## Critical Problems with Current Implementation

### 1. **Latency Issues** ⚠️
- **First audible response**: Often exceeds 2-3 seconds (target: <700ms)
- **STT processing**: 500-1500ms depending on audio length
- **LLM/RAG processing**: 1000-2000ms for complex queries
- **TTS generation**: 300-800ms for responses
- **Total round-trip**: 3-5 seconds (unacceptable for natural conversation)

### 2. **Audio Format & Corruption Problems** 🔴
- Frequent FFmpeg decoding failures with WebM format
- NaN values in transcription due to corrupted audio
- Inconsistent audio format handling between frontend and backend
- File I/O issues causing incomplete writes

### 3. **Conversational Flow Issues** 💬
- Microphone activates before agent finishes speaking (talk-over)
- No immediate filler responses during processing ("thinking...")
- Missing instant responses for greetings/small talk (everything goes through RAG)
- Confirmation loops (yes/no) are unreliable
- Context loss during multi-turn conversations

### 4. **Reliability & Stability** ⚡
- "Stuck thinking" state - system doesn't return to listening
- Audio playback deadlocks with browser TTS
- Streaming audio cleanup fails
- Memory leaks from temporary file accumulation
- Session state corruption on errors

### 5. **Task Creation Workflow** 📋
- Too many conversational turns for simple tasks
- No parameter extraction from natural language
- Missing smart defaults for non-critical fields
- Voice confirmations are too verbose

---

## Required Features

### Core Functionality

#### 1. **Ultra-Low Latency** (<1 second total)
- [ ] First audible response < 700ms
- [ ] Streaming STT with partial results
- [ ] Parallel processing pipeline (STT + intent detection + filler response)
- [ ] Optimized TTS with chunked output
- [ ] Minimal LLM overhead for simple queries

#### 2. **Streaming & Real-time Processing**
- [ ] Real-time audio streaming (not batch)
- [ ] Progressive text transcription display
- [ ] Immediate intent classification
- [ ] Chunked TTS playback (start speaking before full response ready)
- [ ] WebSocket or Server-Sent Events support

#### 3. **Robust Audio Handling**
- [ ] Native support for WebM, WAV, MP3, OGG formats
- [ ] Built-in audio preprocessing (noise reduction, normalization)
- [ ] Voice Activity Detection (VAD) for auto silence detection
- [ ] Audio corruption detection and recovery
- [ ] Multiple codec support (Opus, PCM, AAC)

#### 4. **Smart Conversational Features**
- [ ] Immediate filler responses ("Let me check...", "One moment...")
- [ ] Instant responses for greetings (bypass RAG/LLM)
- [ ] Context window management (relevant history only)
- [ ] Intent-based routing (simple vs complex queries)
- [ ] Interruption handling (user can interrupt agent)

#### 5. **Turn Management**
- [ ] Accurate turn-taking (agent finishes before mic activates)
- [ ] End-of-speech detection
- [ ] Barge-in support (user can interrupt)
- [ ] Audio queue management (no talk-over)

#### 6. **Natural Language Understanding**
- [ ] Parameter extraction from natural language
- [ ] Entity recognition (dates, times, names, priorities)
- [ ] Sentiment analysis (optional but helpful)
- [ ] Confirmation handling (yes/no detection)

### Advanced Features (Nice-to-Have)

- [ ] Multi-language support
- [ ] Voice cloning/customization
- [ ] Emotion detection
- [ ] Background noise suppression
- [ ] Wake word detection
- [ ] Offline mode capability
- [ ] Mobile-optimized audio handling

---

## Technical Requirements

### Performance
- **First Token Time**: < 300ms (STT partial result)
- **Full Transcription**: < 500ms (for 5-second audio)
- **Intent Detection**: < 100ms
- **TTS First Chunk**: < 400ms
- **Total Latency**: < 700ms (greeting/simple) | < 1500ms (complex RAG query)
- **Audio Processing**: < 100ms overhead

### Scalability
- Handle 50+ concurrent voice sessions
- Memory-efficient (< 500MB per session)
- Background cleanup of temp files
- Session timeout handling
- Connection pooling for backends

### Reliability
- 99.5% uptime for voice pipeline
- Graceful degradation on component failure
- Automatic retry logic
- Comprehensive error logging
- Health check endpoints

### Audio Quality
- Sample rate: 16kHz minimum (24kHz preferred)
- Bit depth: 16-bit minimum
- Codec: Opus, PCM, or AAC
- Latency: < 50ms audio buffer
- No perceptible quality loss in TTS

---

## Integration Requirements

### Must Be Compatible With

#### Frontend (React)
```javascript
// Current recording implementation
navigator.mediaDevices.getUserMedia({ audio: true })
// Needs to work with standard WebAudio API
```

#### Backend (Python Flask)
```python
# Must integrate with existing endpoints
@app.route('/query', methods=['POST'])
@app.route('/tts', methods=['POST'])
```

#### Existing RAG System
- ChromaDB vector database
- LangChain agent
- MongoDB data sources
- Category-based routing

#### API Schema
```json
{
  "audio": "base64_or_binary",
  "format": "webm|wav|mp3",
  "sessionId": "string",
  "context": [],
  "category": "optional_string"
}
```

### Integration Approach

1. **Drop-in Replacement** (Preferred)
   - Replace STT/TTS modules only
   - Keep existing RAG/LLM pipeline
   - Minimal changes to frontend

2. **Parallel Testing**
   - Run new agent alongside old one
   - A/B testing capability
   - Gradual migration path

3. **Full Replacement** (If necessary)
   - New end-to-end voice pipeline
   - Adapt RAG to new system
   - Major frontend changes acceptable

---

## Evaluation Criteria

### Priority 1 (Must-Have)
| Criterion | Weight | Minimum Requirement |
|-----------|--------|---------------------|
| **Latency** | 30% | < 1 second total round-trip |
| **Reliability** | 25% | 99%+ success rate, no stuck states |
| **Audio Format Support** | 15% | WebM, WAV at minimum |
| **Documentation** | 10% | Clear integration guide + examples |
| **License** | 10% | Permissive (MIT, Apache, BSD) |
| **Maintenance** | 10% | Active development (commits within 3 months) |

### Priority 2 (Important)
- **Community Support**: Active GitHub issues/discussions
- **Streaming Support**: Real-time processing capability
- **Language Support**: Python backend compatible
- **Deployment**: Docker support, easy cloud deployment
- **Monitoring**: Built-in metrics/logging

### Priority 3 (Nice-to-Have)
- **UI Components**: Pre-built React components
- **Advanced NLU**: Intent classification, entity extraction
- **Multi-modal**: Video support
- **Customization**: Voice cloning, model fine-tuning

---

## Candidate Open Source Projects

### To Evaluate

1. **Vocode** (https://github.com/vocodedev/vocode-python)
   - End-to-end voice agent framework
   - Supports multiple STT/TTS providers
   - Real-time streaming

2. **Rasa Voice** (https://github.com/RasaHQ/rasa)
   - Conversational AI platform
   - Strong NLU capabilities
   - Extensible architecture

3. **OpenVoice** (https://github.com/myshell-ai/OpenVoice)
   - Instant voice cloning
   - Multi-lingual support
   - Flexible control

4. **SpeechBrain** (https://github.com/speechbrain/speechbrain)
   - All-in-one speech toolkit
   - Production-ready models
   - Active community

5. **Coqui TTS** (https://github.com/coqui-ai/TTS)
   - Deep learning TTS
   - Real-time inference
   - Voice cloning

6. **Pipecat** (https://github.com/pipecat-ai/pipecat)
   - Voice and multimodal conversational AI
   - Low-latency streaming
   - Designed for real-time applications

### Evaluation Process

For each candidate:
1. **Quick Test** (30 min)
   - Install and run basic example
   - Measure latency with sample audio
   - Check documentation quality

2. **Integration POC** (2-4 hours)
   - Replace current STT/TTS
   - Test with existing RAG backend
   - Measure performance metrics

3. **Reliability Test** (1-2 days)
   - 100 test conversations
   - Error rate tracking
   - Edge case handling

4. **Decision Matrix**
   - Score against evaluation criteria
   - Calculate weighted total
   - Select top 2 candidates for deeper testing

---

## Success Metrics

### Phase 1: Integration (Week 1-2)
- [ ] Successfully processes voice input
- [ ] Returns voice output
- [ ] Works with existing RAG backend
- [ ] No major regressions

### Phase 2: Performance (Week 3-4)
- [ ] Latency < 1 second (P95)
- [ ] 99% success rate for transcription
- [ ] No stuck states or deadlocks
- [ ] Proper audio format handling

### Phase 3: UX Enhancement (Week 5-6)
- [ ] Immediate filler responses
- [ ] Instant greeting replies (no RAG)
- [ ] Smooth turn-taking
- [ ] Task creation in < 3 turns

### Phase 4: Production Ready (Week 7-8)
- [ ] Monitoring and alerting
- [ ] Error recovery mechanisms
- [ ] Load testing (50+ concurrent users)
- [ ] Documentation complete

---

## Migration Strategy

### Option A: Gradual Migration (Lower Risk)
1. Integrate new STT module only
2. Test for 1 week with production traffic
3. Migrate TTS module
4. Test integrated system
5. Full cutover after validation

### Option B: Parallel Run (Medium Risk)
1. Deploy new voice agent alongside old one
2. Route 10% of traffic to new agent
3. Compare metrics and user feedback
4. Gradually increase traffic %
5. Sunset old agent after 30 days

### Option C: Clean Break (Higher Risk, Faster)
1. Complete integration in staging
2. Comprehensive testing
3. Single cutover with rollback plan
4. 24-hour monitoring
5. Hotfix capability ready

**Recommended**: Option B (Parallel Run)

---

## Resources & Timeline

### Development Effort
- **Research & Selection**: 3-5 days
- **POC Integration**: 5-7 days
- **Full Integration**: 10-15 days
- **Testing & Optimization**: 7-10 days
- **Production Deployment**: 3-5 days

**Total**: 4-6 weeks for full production deployment

### Team Requirements
- 1x Backend Engineer (Python/Flask)
- 1x Frontend Engineer (React)
- 1x DevOps/Infrastructure (optional, for deployment)

### Infrastructure
- GPU support for local model inference (optional but recommended)
- Increased memory allocation (+2GB per instance)
- WebSocket support in load balancer
- S3/Storage for audio logs (debugging)

---

## Next Steps

1. **Review this document** and approve/modify requirements
2. **Prioritize evaluation criteria** (if needed)
3. **Begin candidate evaluation** with quick tests
4. **Select top 2 candidates** for POC integration
5. **Build integration POC** for finalist
6. **Present findings** and recommendation
7. **Proceed with migration** based on chosen strategy

---

## Contacts & References

- **Current Implementation**: `/Auto-LLM/analytics-llm/voice/`
- **Frontend Component**: `/frontend/src/components/voice/VoiceAgentModal.jsx`
- **Backend Endpoint**: Flask app `/query` route
- **Documentation**: Previous conversation history shows multiple latency and reliability issues

## Questions to Resolve

- [ ] What is the acceptable budget for cloud STT/TTS APIs? (Currently using free solutions)
- [ ] Is GPU infrastructure available for local model inference?
- [ ] What is the priority: Latency vs Quality vs Cost?
- [ ] Are breaking changes to frontend API acceptable?
- [ ] What is the target deployment date?

---

**Last Updated**: 2025-12-30  
**Version**: 1.0  
**Status**: Draft - Awaiting Review
