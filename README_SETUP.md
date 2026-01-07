# MineCriator - Minecraft Server Manager

Um gerenciador de servidores Minecraft robusto e user-friendly com interface web moderna e suporte a desktop.

## Características

- 🖥️ **Interface Web Moderna** - Construída com React e Tailwind CSS
- 🚀 **Backend em FastAPI** - API rápida e eficiente
- 🖨️ **Desktop App** - Electron para Linux (.deb, AppImage)
- 🔧 **Gerenciamento Completo** - Criar, iniciar, parar e deletar servidores
- 📊 **Monitoramento em Tempo Real** - WebSocket para logs ao vivo
- 🌐 **Interface Responsiva** - Funciona em todos os tamanhos de tela

## Instalação

### Pré-requisitos
- Node.js 18+
- Python 3.9+
- Yarn ou npm

### Instalação Local (Desenvolvimento)

```bash
# Clone ou extraia o repositório
cd Server-MineCriator-main

# Setup Frontend
cd frontend
yarn install

# Setup Backend
cd ..
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

## Como Executar

### Opção 1: Web (Desenvolvimento)

Terminal 1 - Backend:
```bash
cd Server-MineCriator-main
source venv/bin/activate
uvicorn backend.server:app --host 0.0.0.0 --port 5000 --reload
```

Terminal 2 - Frontend:
```bash
cd Server-MineCriator-main/frontend
yarn start
```

Acesse: `http://localhost:3000`

### Opção 2: Desktop App (Electron)

```bash
cd Server-MineCriator-main/frontend

# Desenvolvimento com hot reload
yarn electron-dev

# Build para desktop
yarn electron-build
```

### Opção 3: Build Distribuível

```bash
cd Server-MineCriator-main/frontend

# Build AppImage e .deb para Linux
yarn dist
```

Arquivos gerados em `dist/`:
- `MineCriator.AppImage` - Executável único (sem instalação)
- `MineCriator.deb` - Pacote Debian (instalável)

## Estrutura do Projeto

```
Server-MineCriator-main/
├── frontend/              # Aplicação React
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # Servidor FastAPI
│   ├── server.py
│   ├── requirements.txt
│   └── data/
├── electron/              # Configuração Electron
│   ├── main.js
│   └── preload.js
└── venv/                  # Ambiente Python
```

## API Endpoints

- `GET /api/servers` - Lista todos os servidores
- `POST /api/servers` - Criar novo servidor
- `GET /api/servers/{id}` - Detalhes do servidor
- `POST /api/servers/{id}/start` - Iniciar servidor
- `POST /api/servers/{id}/stop` - Parar servidor
- `GET /api/servers/{id}/logs` - Logs do servidor
- `WS /ws/servers/{id}` - WebSocket para logs em tempo real

Documentação Swagger: `http://localhost:5000/docs`

## Configuração Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Backend
BACKEND_PORT=5000
BACKEND_HOST=0.0.0.0

# Frontend
REACT_APP_BACKEND_URL=http://localhost:5000
```

## Troubleshooting

**Erro: "Porta 5000 em uso"**
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

**Erro: "Módulos Python não encontrados"**
```bash
source venv/bin/activate
pip install -r backend/requirements.txt
```

**Electron não inicia**
```bash
# Deletar cache do Electron
rm -rf ~/.config/MineCriator
yarn electron-dev
```

## Desenvolvimento

### Adicionar Novo Endpoint

1. Editar `backend/server.py`
2. Recarregar automaticamente (uvicorn watch)
3. Testar em `http://localhost:5000/docs`

### Modificar Frontend

1. Editar em `frontend/src/`
2. Hot reload automático (yarn start)
3. Ver mudanças em tempo real

## Build para Produção

### Build Web
```bash
cd frontend
yarn build
```

Arquivos em `frontend/build/`

### Build Desktop
```bash
cd frontend
yarn dist
```

Arquivos em `frontend/dist/`

## Licença

Propriedade privada - Desenvolvido internamente

## Suporte

Para problemas ou dúvidas, abra uma issue ou entre em contato com o time de desenvolvimento.

---

**MineCriator** - Gerenciamento de Servidores Minecraft, Simples e Poderoso
