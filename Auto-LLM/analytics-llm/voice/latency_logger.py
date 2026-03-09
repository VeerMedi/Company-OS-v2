"""
Latency Logger for Voice Agent Pipeline
Tracks timing for STT, RAG, and TTS stages
"""

import os
import csv
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

class LatencyLogger:
    """Log voice pipeline latency to CSV file"""
    
    def __init__(self, log_dir: str = None):
        """Initialize latency logger"""
        self.log_dir = log_dir or os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'logs'
        )
        Path(self.log_dir).mkdir(parents=True, exist_ok=True)
        
        self.log_file = os.path.join(self.log_dir, 'latency.csv')
        self._ensure_header()
        
        print(f"✓ Latency logger initialized: {self.log_file}")
    
    def _ensure_header(self):
        """Create CSV header if file doesn't exist"""
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'timestamp',
                    'session_id',
                    'query_text',
                    'stt_time_ms',
                    'rag_time_ms',
                    'tts_time_ms',
                    'total_time_ms',
                    'stt_model',
                    'llm_model',
                    'tts_engine',
                    'answer_length',
                    'token_count',
                    'success'
                ])
    
    def log(
        self,
        session_id: str,
        query_text: str,
        stt_time: float,
        rag_time: float,
        tts_time: float,
        stt_model: str = "whisper-medium",
        llm_model: str = "gpt-4o-mini",
        tts_engine: str = "elevenlabs",
        answer_length: int = 0,
        token_count: int = 0,
        success: bool = True
    ):
        """
        Log a voice query with timing data
        
        Args:
            session_id: Unique session identifier
            query_text: User's transcribed question
            stt_time: Speech-to-text time in seconds
            rag_time: RAG processing time in seconds
            tts_time: Text-to-speech time in seconds
            stt_model: STT model used
            llm_model: LLM model used
            tts_engine: TTS engine used (elevenlabs/edge_tts)
            answer_length: Length of answer in characters
            token_count: Total tokens used
            success: Whether query succeeded
        """
        total_time = stt_time + rag_time + tts_time
        
        with open(self.log_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.now().isoformat(),
                session_id[:8] if session_id else 'unknown',
                query_text[:100],  # Truncate long queries
                int(stt_time * 1000),  # Convert to ms
                int(rag_time * 1000),
                int(tts_time * 1000),
                int(total_time * 1000),
                stt_model,
                llm_model,
                tts_engine,
                answer_length,
                token_count,
                success
            ])
        
        # Print summary
        print(f"\n📊 LATENCY LOG:")
        print(f"   STT:   {stt_time*1000:.0f}ms | RAG: {rag_time*1000:.0f}ms | TTS: {tts_time*1000:.0f}ms")
        print(f"   TOTAL: {total_time*1000:.0f}ms ({total_time:.2f}s)")
    
    def get_stats(self, last_n: int = 100) -> Dict[str, Any]:
        """Get latency statistics from recent queries"""
        stats = {
            'count': 0,
            'avg_stt': 0,
            'avg_rag': 0,
            'avg_tts': 0,
            'avg_total': 0,
            'min_total': float('inf'),
            'max_total': 0
        }
        
        if not os.path.exists(self.log_file):
            return stats
        
        rows = []
        with open(self.log_file, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)[-last_n:]
        
        if not rows:
            return stats
        
        stt_times = [int(r['stt_time_ms']) for r in rows]
        rag_times = [int(r['rag_time_ms']) for r in rows]
        tts_times = [int(r['tts_time_ms']) for r in rows]
        total_times = [int(r['total_time_ms']) for r in rows]
        
        stats['count'] = len(rows)
        stats['avg_stt'] = sum(stt_times) / len(stt_times)
        stats['avg_rag'] = sum(rag_times) / len(rag_times)
        stats['avg_tts'] = sum(tts_times) / len(tts_times)
        stats['avg_total'] = sum(total_times) / len(total_times)
        stats['min_total'] = min(total_times)
        stats['max_total'] = max(total_times)
        
        return stats


# Singleton
_latency_logger = None

def get_latency_logger() -> LatencyLogger:
    """Get singleton latency logger"""
    global _latency_logger
    if _latency_logger is None:
        _latency_logger = LatencyLogger()
    return _latency_logger
