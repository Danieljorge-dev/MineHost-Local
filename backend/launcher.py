#!/usr/bin/env python3
"""
Mini servidor que inicia o backend FastAPI
Usado pelo Electron quando o AppImage é clicado
"""

import subprocess
import sys
import time
import os
import signal
from pathlib import Path

def find_backend_dir():
    """Encontrar o diretório do backend"""
    candidates = [
        '/home/djbug/Downloads/Server-MineCriator-main',
        '/opt/minecriaor',
        os.path.expanduser('~/.minecriaor'),
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    ]
    
    for candidate in candidates:
        backend_path = Path(candidate) / 'backend' / 'server.py'
        if backend_path.exists():
            return candidate
    
    return None

def main():
    backend_dir = find_backend_dir()
    
    if not backend_dir:
        print("❌ Backend não encontrado")
        sys.exit(1)
    
    print(f"Backend dir: {backend_dir}")
    
    try:
        # Iniciar uvicorn
        process = subprocess.Popen(
            [sys.executable, '-m', 'uvicorn', 
             'backend.server:app',
             '--host', '127.0.0.1',
             '--port', '5000',
             '--log-level', 'info'],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        print(f"✓ Backend iniciado (PID: {process.pid})")
        
        # Manter o processo rodando
        while True:
            time.sleep(1)
            if process.poll() is not None:
                print(f"Backend encerrou com código: {process.returncode}")
                break
                
    except KeyboardInterrupt:
        print("\nEncerrando...")
        process.terminate()
        process.wait(timeout=5)
    except Exception as e:
        print(f"Erro: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
