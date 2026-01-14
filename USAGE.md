# 🚀 MineHost Local - Como Usar

## Iniciando a Aplicação

### Opção 1: Script Launcher (Recomendado)
```bash
cd /home/djbug/Downloads/Server-MineCriator-main
./minecriaor.sh
```

Este script irá:
1. ✅ Verificar se o virtual environment existe
2. ✅ Iniciar o backend FastAPI automaticamente na porta 5000
3. ✅ Aguardar o backend ficar pronto
4. ✅ Iniciar a interface gráfica (AppImage)
5. ✅ Parar o backend quando a janela for fechada

**Logs:** `tail -f /tmp/minecriaor-backend.log`

### Opção 2: Iniciar Backend Manualmente
```bash
cd /home/djbug/Downloads/Server-MineCriator-main
source venv/bin/activate
python -m uvicorn backend.server:app --host 127.0.0.1 --port 5000
```

Depois, em outro terminal:
```bash
cd /home/djbug/Downloads/Server-MineCriator-main/frontend/dist
./MineHostLocal-0.1.0.AppImage
```

### Opção 3: Instalar como Sistema (DEB)
```bash
sudo dpkg -i /home/djbug/Downloads/Server-MineCriator-main/frontend/dist/minehostlocal_0.1.0_amd64.deb
```

Depois procure por "MineCriator" no menu de aplicações.

## Características Implementadas

### ✅ Integração E4MC
- Backend extrai automaticamente o IP público do mod e4mc
- API retorna `e4mc_enabled` (true/false) e `public_ip` (string)
- Dashboard mostra IP em card azul quando e4mc está ativo
- Botão de cópia para copiar IP à área de transferência

### ✅ Descrições de Propriedades
- 30+ propriedades do servidor com descrições detalhadas
- Sistema de tooltips com informações e avisos
- Avisos de segurança e performance

### ✅ Mod Management
- Detecção automática de dependências de mods
- Download automático de dependências via Modrinth API
- Suporte para Fabric, Forge, Paper e Vanilla

## Troubleshooting

### Backend não inicia
1. Verificar se Python 3.12+ está instalado: `python3 --version`
2. Verificar logs: `cat /tmp/minecriaor-backend.log`
3. Tentar iniciar manualmente (ver Opção 2 acima)

### AppImage não inicia
1. Tornar executável: `chmod +x /path/to/MineCriator-0.1.0.AppImage`
2. Se falhar, verificar se FUSE está instalado: `sudo apt install libfuse2`

### Porta 5000 já está em uso
1. Encontrar processo: `netstat -tulpn | grep :5000`
2. Matar processo: `kill -9 <PID>`
3. Ou usar outro port:
   ```bash
   python -m uvicorn backend.server:app --host 127.0.0.1 --port 5001
   ```
   E atualizar `frontend/public/electron.js` com `BACKEND_PORT = 5001`

## API Endpoints

### Servidores
- `GET /api/servers` - Listar todos os servidores
- `POST /api/servers` - Criar novo servidor
- `GET /api/servers/{id}` - Obter detalhes do servidor
- `PUT /api/servers/{id}` - Atualizar configuração

### Propriedades
- `GET /api/servers/{id}/properties` - Obter propriedades do servidor
- `PUT /api/servers/{id}/properties` - Atualizar propriedades

### Mods
- `GET /api/servers/{id}/mods` - Listar mods instalados
- `POST /api/servers/{id}/mods` - Instalar mod
- `DELETE /api/servers/{id}/mods/{mod_file}` - Remover mod

### Consola
- `WebSocket /api/servers/{id}/logs` - Receber logs em tempo real
- `POST /api/servers/{id}/command` - Executar comando no servidor

## Estrutura de Diretórios

```
/home/djbug/Downloads/Server-MineCriator-main/
├── backend/                  # API FastAPI
│   ├── server.py            # Servidor principal
│   └── requirements.txt      # Dependências Python
├── frontend/                # Interface React + Electron
│   ├── src/                 # Código React
│   ├── public/              # Assets públicos + electron.js
│   └── dist/                # Build final (AppImage + DEB)
├── minecriaor.sh            # Script launcher
├── venv/                    # Virtual environment Python
└── backend/data/            # Dados dos servidores (servers/ e configs/)
```
