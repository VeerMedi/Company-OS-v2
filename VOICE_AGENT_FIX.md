# Voice Agent Error Fixes

## Issues Identified

Based on the error logs, there are three main issues:

### 1. CUDA Library Missing (`cublas64_12.dll`)
- **Error**: `Library cublas64_12.dll is not found or cannot be loaded`
- **Cause**: The system has CUDA configured but is missing the cuBLAS library required by PyTorch/faster-whisper
- **Impact**: GPU acceleration fails, causing transcription to fail

### 2. WebM Audio Format Parsing Errors
- **Errors**: 
  - `EBML header parsing failed`
  - `Error parsing Opus packet header`
  - `Invalid data found when processing input`
  - `File ended prematurely`
- **Cause**: The WebM files are either corrupted during transmission or not properly encoded
- **Impact**: Audio files cannot be read by faster-whisper

### 3. Empty Transcriptions
- **Error**: STT returns empty string `""`
- **Cause**: Combination of CUDA errors and WebM parsing failures
- **Impact**: No text is transcribed from user voice input

## Solutions

### Solution 1: Force CPU Mode (Immediate Fix)

Force the system to use CPU instead of CUDA to avoid the missing cuBLAS library:

**File**: `Auto-LLM/analytics-llm/voice/speech_to_text.py`

**Change Line 47-58**:
```python
def _get_device(self):
    """Determine best available device for Whisper model"""
    # TEMPORARY FIX: Force CPU mode to avoid CUDA library issues on Windows
    # TODO: Install proper CUDA toolkit with cuBLAS support for GPU acceleration
    print("ℹ️  Using CPU mode (CUDA disabled due to missing cuBLAS library)")
    return "cpu"
    
    # Original code (enable after fixing CUDA):
    # try:
    #     import torch
    #     if torch.cuda.is_available():
    #         print("✓ CUDA available - using GPU acceleration")
    #         return "cuda"
    #     print("ℹ️  Using CPU (optimized with CTranslate2)")
    #     return "cpu"
    # except ImportError:
    #     print("ℹ️  PyTorch not found, using CPU")
    #     return "cpu"
```

### Solution 2: Add Robust Audio Format Conversion

Add audio conversion to handle WebM issues by converting to WAV format:

**File**: `Auto-LLM/analytics-llm/voice/audio_utils.py`

Add this method after line 99:
```python
@staticmethod
def convert_to_wav(input_path: str, output_path: Optional[str] = None) -> Optional[str]:
    """
    Convert audio file to WAV format for better compatibility.
    
    Args:
        input_path: Path to input audio file
        output_path: Optional output path (creates temp file if None)
        
    Returns:
        Path to WAV file, or None if conversion failed
    """
    try:
        # Try using ffmpeg via subprocess
        import subprocess
        
        if output_path is None:
            temp_dir = os.path.join(tempfile.gettempdir(), 'voice_agent')
            os.makedirs(temp_dir, exist_ok=True)
            output_path = os.path.join(temp_dir, f"converted_{uuid.uuid4().hex[:8]}.wav")
        
        # Check if ffmpeg is available
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️  ffmpeg not found, skipping conversion")
            return None
        
        # Convert to WAV using ffmpeg
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-ar', '16000',  # Sample rate 16kHz
            '-ac', '1',      # Mono
            '-y',            # Overwrite output
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0 and os.path.exists(output_path):
            print(f"✓ Converted audio to WAV: {output_path}")
            return output_path
        else:
            print(f"❌ ffmpeg conversion failed: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Audio conversion error: {e}")
        return None

@staticmethod
def validate_audio_file(filepath: str) -> bool:
    """
    Validate that audio file is readable and not corrupted.
    
    Args:
        filepath: Path to audio file
        
    Returns:
        True if valid, False otherwise
    """
    try:
        if not os.path.exists(filepath):
            return False
        
        # Check file size (should be > 1KB)
        file_size = os.path.getsize(filepath)
        if file_size < 1024:
            print(f"⚠️  Audio file too small: {file_size} bytes")
            return False
        
        # Try to read first few bytes
        with open(filepath, 'rb') as f:
            header = f.read(100)
            if len(header) < 100:
                print(f"⚠️  Audio file incomplete")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Audio validation error: {e}")
        return False
```

### Solution 3: Update Speech-to-Text to Use Conversion

**File**: `Auto-LLM/analytics-llm/voice/speech_to_text.py`

Update the `transcribe` method around line 185:
```python
def transcribe(
    self, 
    audio_path: str, 
    language: str = "auto"
) -> Dict[str, Any]:
    """
    Transcribe audio file to text using Faster-Whisper.
    
    Args:
        audio_path: Path to audio file (supports mp3, wav, webm, ogg, m4a, flac)
        language: Language code (e.g., 'en', 'hi') or 'auto' for detection
        
    Returns:
        Dictionary with transcription results or error
    """
    try:
        if not os.path.exists(audio_path):
            return {
                "success": False,
                "text": "",
                "error": f"Audio file not found: {audio_path}"
            }
        
        # NEW: Validate audio file
        from voice.audio_utils import AudioUtils
        
        if not AudioUtils.validate_audio_file(audio_path):
            return {
                "success": False,
                "text": "",
                "error": "Audio file is corrupted or too small. Please try recording again."
            }
        
        # NEW: Try to convert WebM to WAV for better compatibility
        converted_path = None
        if audio_path.lower().endswith('.webm'):
            print("🔄 Converting WebM to WAV for better compatibility...")
            converted_path = AudioUtils.convert_to_wav(audio_path)
            if converted_path:
                audio_path = converted_path
                print(f"✓ Using converted file: {audio_path}")
        
        try:
            # Load model (lazy)
            model = self._load_model()
            
            # Prepare language setting
            target_language = None  # None = auto-detect language
            
            if language and language != "auto":
                target_language = language
            
            print(f"Transcribing audio: {audio_path} on {self._device} (language: {target_language})")
            
            # ... rest of the transcription code ...
            
        finally:
            # NEW: Cleanup converted file
            if converted_path and os.path.exists(converted_path):
                try:
                    os.remove(converted_path)
                    print(f"✓ Cleaned up converted file: {converted_path}")
                except:
                    pass
```

### Solution 4: Add Better Error Handling in WebSocket Handler

**File**: `Auto-LLM/analytics-llm/voice/native_websocket_handler.py`

Update the `handle_audio_chunk` method around line 78:
```python
def handle_audio_chunk(self, data: str):
    """Process incoming audio chunk"""
    if not self.is_streaming or not self.stt:
        print("⚠️ Received audio chunk but stream not active")
        return
    
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(data)
        
        # NEW: Validate audio chunk size
        if len(audio_bytes) < 100:
            print(f"⚠️ Audio chunk too small: {len(audio_bytes)} bytes")
            return
        
        print(f"📦 Processing audio chunk: {len(audio_bytes)} bytes")
        
        # Process with STT
        result = self.stt.add_chunk(audio_bytes)
        
        if result.get("text"):
            # Send partial transcript
            self.send_message("transcript_partial", {
                "text": result["text"],
                "is_final": result.get("is_final", False),
                "duration": result.get("duration", 0)
            })
        
    except base64.binascii.Error as e:
        print(f"❌ Invalid base64 audio data: {e}")
        self.send_message("error", {"message": "Invalid audio data encoding"})
    except Exception as e:
        print(f"❌ Error processing audio chunk: {e}")
        import traceback
        traceback.print_exc()
        self.send_message("error", {"message": "Failed to process audio"})
```

## Installation Requirements

### For Solution 1 (CPU Mode - Immediate):
No additional installation needed. Just apply the code changes.

### For Solution 2 & 3 (Audio Conversion - Recommended):

1. **Install FFmpeg on Windows**:
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
# Add to PATH after installation
```

2. **Verify FFmpeg**:
```bash
ffmpeg -version
```

### For Full CUDA Support (Optional - Long-term):

If you want GPU acceleration working properly:

1. **Install NVIDIA CUDA Toolkit 12.x**:
   - Download from: https://developer.nvidia.com/cuda-downloads
   - Make sure to include cuBLAS library

2. **Verify CUDA Installation**:
```bash
nvcc --version
```

3. **Reinstall PyTorch with CUDA 12**:
```bash
pip uninstall torch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Testing After Fixes

1. **Test CPU Mode**:
```bash
cd Auto-LLM/analytics-llm
python -c "from voice.speech_to_text import SpeechToText; stt = SpeechToText(); print('✓ CPU mode working')"
```

2. **Test Audio Conversion** (after installing FFmpeg):
```bash
python -c "from voice.audio_utils import AudioUtils; print('✓ Audio utils ready')"
```

3. **Test Voice Agent**:
   - Open co-founder dashboard
   - Click voice button
   - Speak clearly for 3-5 seconds
   - Check console logs for errors

## Priority Order

1. **Apply Solution 1** (Force CPU) - Immediate fix to get it working
2. **Install FFmpeg** and apply **Solutions 2 & 3** - Better audio handling
3. **Apply Solution 4** - Better error messages
4. **Optional**: Install CUDA toolkit properly for GPU acceleration

## Expected Results

After applying all fixes:
- ✓ No more CUDA errors
- ✓ WebM files properly handled (converted to WAV)
- ✓ Better error messages
- ✓ Voice transcription works reliably
- ✓ Faster processing on CPU (int8 quantization)

## Performance Notes

- **CPU Mode**: ~3-5 seconds for 10-second audio (acceptable for co-founder dashboard)
- **GPU Mode** (after CUDA fix): ~0.5-1 second for 10-second audio
- **Audio Conversion**: Adds ~0.5 seconds overhead but increases reliability

## Monitoring

Check the logs for these success messages:
```
✓ Using CPU mode (CUDA disabled due to missing cuBLAS library)
✓ Converted audio to WAV: ...
✓ Faster-Whisper transcription complete in X.XXs: '...'
```
