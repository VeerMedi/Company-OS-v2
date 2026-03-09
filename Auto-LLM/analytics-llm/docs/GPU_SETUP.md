# Voice Agent GPU Setup Guide

## Quick Setup (GPU Machine)

```bash
cd Auto-LLM/analytics-llm
chmod +x setup_gpu.sh
./setup_gpu.sh
```

## Manual Setup

### 1. Install CUDA Toolkit
Download from: https://developer.nvidia.com/cuda-downloads

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR: venv\Scripts\activate  # Windows
```

### 3. Install Requirements
```bash
pip install -r requirements.txt
```

### 4. Install PyTorch with CUDA
```bash
# For CUDA 12.x:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# For CUDA 11.8:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 5. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 6. Verify GPU
```bash
python3 -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

### 7. Start Server
```bash
python3 api.py
```

## Expected Performance

| Model | CPU | GPU (CUDA) |
|-------|-----|------------|
| tiny  | ~2s | ~0.3s |
| base  | ~3s | ~0.5s |
| small | ~4s | ~0.8s |
| **medium** | ~6-8s | **~1-2s** |
| large | ~15s | ~2-3s |

## API Keys Required

- **OPENROUTER_API_KEY**: For LLM (get at openrouter.ai)
- **ELEVENLABS_API_KEY**: For TTS (get at elevenlabs.io)
- **MONGODB_URI**: Your MongoDB connection string
