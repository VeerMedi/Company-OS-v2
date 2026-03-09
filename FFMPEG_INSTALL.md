# FFmpeg Installation Guide for Windows

## Why FFmpeg is Needed

FFmpeg is required to convert WebM audio files to WAV format. This solves the "EBML header parsing failed" errors you're seeing.

## Installation Options

### Option 1: Using Chocolatey (Recommended - Easiest)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install FFmpeg**:
   ```powershell
   choco install ffmpeg -y
   ```

3. **Verify Installation**:
   ```bash
   ffmpeg -version
   ```

### Option 2: Manual Installation

1. **Download FFmpeg**:
   - Go to: https://www.gyan.dev/ffmpeg/builds/
   - Download: `ffmpeg-release-essentials.zip`

2. **Extract**:
   - Extract to: `C:\ffmpeg`
   - Folder structure should be: `C:\ffmpeg\bin\ffmpeg.exe`

3. **Add to PATH**:
   - Open System Properties → Advanced → Environment Variables
   - Under "System Variables", find and edit "Path"
   - Add new entry: `C:\ffmpeg\bin`
   - Click OK on all windows

4. **Verify** (close and reopen terminal):
   ```bash
   ffmpeg -version
   ```

### Option 3: Using Scoop

1. **Install Scoop** (if not already installed):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Install FFmpeg**:
   ```bash
   scoop install ffmpeg
   ```

3. **Verify**:
   ```bash
   ffmpeg -version
   ```

## Testing

After installation, test that FFmpeg is accessible:

```bash
# Test FFmpeg
ffmpeg -version

# Test audio conversion (if you have a WebM file)
ffmpeg -i test.webm -ar 16000 -ac 1 test.wav
```

## What This Fixes

Once FFmpeg is installed, the voice agent will:
- ✓ Automatically convert WebM files to WAV
- ✓ Avoid "EBML header parsing failed" errors
- ✓ Handle corrupted WebM files gracefully
- ✓ Improve transcription reliability

## Without FFmpeg

If you don't install FFmpeg:
- The code will still work
- It will try to process WebM files directly
- You may still see occasional EBML errors
- But CPU mode fix will help with the main CUDA issue

## Troubleshooting

**"ffmpeg not found" after installation:**
- Close and reopen your terminal/command prompt
- Verify PATH is set correctly: `echo %PATH%`
- Try running: `where ffmpeg`

**Still getting errors:**
- Make sure you're using Command Prompt or PowerShell, not Git Bash
- Restart your IDE/editor after installing
- Check if antivirus is blocking ffmpeg.exe

## Next Steps

1. Install FFmpeg using one of the options above
2. Restart your terminal and VS Code
3. Restart the analytics-llm server:
   ```bash
   cd Auto-LLM/analytics-llm
   python start_server.py
   ```
4. Test the voice agent in co-founder dashboard
