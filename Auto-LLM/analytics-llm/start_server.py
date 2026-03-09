import subprocess
import sys
import os

def start_server():
    """Start the Analytics LLM API server"""
    print("=" * 60)
    print("Starting Analytics LLM API Server")
    print("=" * 60)
    print("\nServer will run on: http://localhost:5001")
    print("\nAvailable endpoints:")
    print("  - GET  /api/analytics/health")
    print("  - GET  /api/analytics/projects")
    print("  - GET  /api/analytics/employees")
    print("  - GET  /api/analytics/summary")
    print("  - GET  /api/analytics/insights")
    print("  - POST /api/analytics/refresh")
    print("\nPress CTRL+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        # Run the Flask app
        subprocess.run([sys.executable, "api.py"])
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
    except Exception as e:
        print(f"\n\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
