"""
Audio utilities for voice agent.
Handles file operations and format conversions.
"""
import os
import tempfile
import uuid
from typing import Optional


class AudioUtils:
    """Utility class for audio file operations"""
    
    # Supported audio formats and their extensions
    MIME_TO_EXT = {
        'audio/webm': 'webm',
        'audio/webm;codecs=opus': 'webm',
        'audio/mp3': 'mp3',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/ogg;codecs=opus': 'ogg',
        'audio/mp4': 'm4a',
        'audio/m4a': 'm4a',
        'audio/flac': 'flac',
    }
    
    @staticmethod
    def get_audio_format_from_mimetype(mime_type: str) -> str:
        """
        Get file extension from MIME type.
        
        Args:
            mime_type: Audio MIME type (e.g., 'audio/webm')
            
        Returns:
            File extension (e.g., 'webm')
        """
        # Normalize mime type
        mime_type = mime_type.lower().strip()
        
        # Check direct match
        if mime_type in AudioUtils.MIME_TO_EXT:
            return AudioUtils.MIME_TO_EXT[mime_type]
        
        # Try without parameters (e.g., 'audio/webm;codecs=opus' -> 'audio/webm')
        base_mime = mime_type.split(';')[0].strip()
        if base_mime in AudioUtils.MIME_TO_EXT:
            return AudioUtils.MIME_TO_EXT[base_mime]
        
        # Default to webm for unknown types
        return 'webm'
    
    @staticmethod
    def save_audio_file(audio_data: bytes, format: str = 'webm') -> str:
        """
        Save audio data to a temporary file.
        
        Args:
            audio_data: Raw audio bytes
            format: File extension (default: 'webm')
            
        Returns:
            Path to saved temporary file
        """
        # Create temp directory if needed
        temp_dir = os.path.join(tempfile.gettempdir(), 'voice_agent')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        filename = f"audio_{uuid.uuid4().hex[:8]}.{format}"
        filepath = os.path.join(temp_dir, filename)
        
        # Write audio data
        with open(filepath, 'wb') as f:
            f.write(audio_data)
            f.flush()  # Ensure all data is written to disk
            os.fsync(f.fileno())  # Force OS to flush to disk
        
        print(f"✓ Saved audio file: {filepath} ({len(audio_data)} bytes)")
        return filepath
    
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
                print(f"❌ Audio file does not exist: {filepath}")
                return False
            
            # Check file size (should be > 1KB for valid audio)
            file_size = os.path.getsize(filepath)
            if file_size < 1024:
                print(f"⚠️  Audio file too small: {file_size} bytes (minimum 1KB)")
                return False
            
            # Try to read first few bytes to check file integrity
            with open(filepath, 'rb') as f:
                header = f.read(100)
                if len(header) < 100:
                    print(f"⚠️  Audio file incomplete (only {len(header)} bytes readable)")
                    return False
            
            print(f"✓ Audio file validated: {file_size} bytes")
            return True
            
        except Exception as e:
            print(f"❌ Audio validation error: {e}")
            return False
    
    @staticmethod
    def convert_to_wav(input_path: str, output_path: Optional[str] = None) -> Optional[str]:
        """
        Convert audio file to WAV format for better compatibility with faster-whisper.
        Uses FFmpeg if available, otherwise returns None.
        
        Args:
            input_path: Path to input audio file
            output_path: Optional output path (creates temp file if None)
            
        Returns:
            Path to WAV file, or None if conversion failed or FFmpeg not available
        """
        try:
            import subprocess
            
            # Check if ffmpeg is available
            try:
                subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True, timeout=5)
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                print("ℹ️  ffmpeg not found - skipping audio conversion (install ffmpeg for better WebM support)")
                return None
            
            # Generate output path if not provided
            if output_path is None:
                temp_dir = os.path.join(tempfile.gettempdir(), 'voice_agent')
                os.makedirs(temp_dir, exist_ok=True)
                output_path = os.path.join(temp_dir, f"converted_{uuid.uuid4().hex[:8]}.wav")
            
            print(f"🔄 Converting {input_path} to WAV format...")
            
            # Convert to WAV using ffmpeg with optimal settings for Whisper
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-ar', '16000',      # Sample rate 16kHz (Whisper optimal)
                '-ac', '1',          # Mono channel
                '-acodec', 'pcm_s16le',  # 16-bit PCM
                '-y',                # Overwrite output
                '-loglevel', 'error', # Only show errors
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and os.path.exists(output_path):
                output_size = os.path.getsize(output_path)
                print(f"✓ Converted audio to WAV: {output_path} ({output_size} bytes)")
                return output_path
            else:
                print(f"❌ ffmpeg conversion failed (code {result.returncode}): {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            print(f"❌ Audio conversion timeout (>30s)")
            return None
        except Exception as e:
            print(f"❌ Audio conversion error: {e}")
            return None
    
    @staticmethod
    def cleanup_file(filepath: str) -> bool:
        """
        Delete a temporary file.
        
        Args:
            filepath: Path to file to delete
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
                print(f"✓ Cleaned up: {filepath}")
                return True
        except Exception as e:
            print(f"Warning: Could not delete {filepath}: {e}")
        return False
    
    @staticmethod
    def cleanup_old_files(max_age_seconds: int = 3600) -> int:
        """
        Clean up old temporary files.
        
        Args:
            max_age_seconds: Delete files older than this (default: 1 hour)
            
        Returns:
            Number of files deleted
        """
        import time
        
        temp_dir = os.path.join(tempfile.gettempdir(), 'voice_agent')
        if not os.path.exists(temp_dir):
            return 0
        
        deleted = 0
        now = time.time()
        
        for filename in os.listdir(temp_dir):
            filepath = os.path.join(temp_dir, filename)
            try:
                if os.path.isfile(filepath):
                    file_age = now - os.path.getmtime(filepath)
                    if file_age > max_age_seconds:
                        os.remove(filepath)
                        deleted += 1
            except Exception:
                pass
        
        if deleted > 0:
            print(f"✓ Cleaned up {deleted} old audio files")
        
        return deleted
    
    @staticmethod
    def get_file_size_mb(filepath: str) -> float:
        """Get file size in megabytes"""
        if os.path.exists(filepath):
            return os.path.getsize(filepath) / (1024 * 1024)
        return 0.0
