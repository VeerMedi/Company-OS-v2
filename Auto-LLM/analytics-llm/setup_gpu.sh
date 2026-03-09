#!/bin/bash
# =============================================================================
# Analytics LLM - GPU Setup Script
# Run this on a machine with NVIDIA GPU and CUDA installed
# =============================================================================

echo "=============================================="
echo "Analytics LLM - Voice Agent GPU Setup"
echo "=============================================="

# Check if CUDA is available
echo ""
echo "Checking CUDA installation..."
if command -v nvidia-smi &> /dev/null; then
    echo "✓ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
else
    echo "❌ nvidia-smi not found. Please install NVIDIA drivers and CUDA."
    echo "   Download from: https://developer.nvidia.com/cuda-downloads"
    exit 1
fi

# Check CUDA version
if command -v nvcc &> /dev/null; then
    CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $5}' | cut -d',' -f1)
    echo "✓ CUDA Version: $CUDA_VERSION"
else
    echo "⚠️  nvcc not found. CUDA toolkit may not be fully installed."
fi

# Create virtual environment
echo ""
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install base requirements
echo ""
echo "Installing base requirements..."
pip install --upgrade pip
pip install -r requirements.txt

# Detect CUDA version and install appropriate PyTorch
echo ""
echo "Installing PyTorch with CUDA support..."

# Try to detect CUDA version
if command -v nvcc &> /dev/null; then
    CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $5}' | cut -d',' -f1)
    CUDA_MAJOR=$(echo $CUDA_VERSION | cut -d'.' -f1)
    CUDA_MINOR=$(echo $CUDA_VERSION | cut -d'.' -f2)
    
    if [ "$CUDA_MAJOR" -ge "12" ]; then
        echo "Installing PyTorch for CUDA 12.x..."
        pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    elif [ "$CUDA_MAJOR" -eq "11" ] && [ "$CUDA_MINOR" -ge "8" ]; then
        echo "Installing PyTorch for CUDA 11.8..."
        pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
    else
        echo "Installing PyTorch for CUDA 11.7..."
        pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu117
    fi
else
    echo "Could not detect CUDA version. Installing PyTorch for CUDA 12.1 (latest)..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
fi

# Verify GPU detection
echo ""
echo "Verifying PyTorch GPU detection..."
python3 -c "
import torch
print(f'PyTorch version: {torch.__version__}')
print(f'CUDA available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA version: {torch.version.cuda}')
    print(f'GPU device: {torch.cuda.get_device_name(0)}')
    print(f'GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
    print('✓ GPU acceleration is ENABLED!')
else:
    print('❌ GPU not detected by PyTorch. Check CUDA installation.')
"

# Verify Faster-Whisper
echo ""
echo "Verifying Faster-Whisper installation..."
python3 -c "
from faster_whisper import WhisperModel
import torch
device = 'cuda' if torch.cuda.is_available() else 'cpu'
compute = 'float16' if device == 'cuda' else 'int8'
print(f'Faster-Whisper will use: {device} ({compute})')
print('✓ Speech-to-Text ready!')
"

# Setup .env if not exists
echo ""
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys!"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=============================================="
echo "Setup Complete!"
echo "=============================================="
echo ""
echo "Expected STT performance with GPU:"
echo "  - 'medium' model: ~1-2 seconds (vs 6-8s on CPU)"
echo "  - 'large' model: ~2-3 seconds (vs 15-20s on CPU)"
echo ""
echo "To start the server:"
echo "  source venv/bin/activate"
echo "  python3 api.py"
echo ""
