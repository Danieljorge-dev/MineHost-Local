# MineHost Local - Product Requirements Document

## Original Problem Statement
Criar uma plataforma web local que permita ao usuário:
- Criar e configurar servidores Minecraft via interface gráfica
- Executar o servidor localmente, sem uso de terminal
- Conectar apenas via LAN / localhost
- Baixar o servidor completo como uma pasta funcional
- Suportar Vanilla, Paper, Fabric, Forge

## User Personas
1. **Jogador Casual** - Quer hospedar servidores locais sem conhecimento técnico
2. **Administrador de LAN Party** - Precisa gerenciar múltiplos servidores em rede local
3. **Modder** - Precisa de suporte a Fabric/Forge com instalação fácil de mods

## Core Requirements (Implemented)
- [x] Dashboard com lista de servidores
- [x] Wizard de criação de servidor (4 etapas)
- [x] Suporte a Vanilla, Paper, Fabric, Forge
- [x] Download automático de JARs via APIs oficiais
- [x] Editor visual de server.properties
- [x] Console com logs em tempo real (WebSocket)
- [x] Gerenciamento de Mods via Modrinth API
- [x] Gerenciamento de Plugins via Modrinth API
- [x] Gerenciamento de Mundos (upload/export)
- [x] Editor de Identidade (nome, MOTD, icon)
- [x] Aceitação visual de EULA
- [x] Export/Import de servidor completo (ZIP)
- [x] Internacionalização (PT-BR/EN)
- [x] Tema escuro/claro

## Architecture
- **Backend**: FastAPI (Python) + JSON file storage
- **Frontend**: React + Tailwind + Shadcn/UI
- **APIs Integradas**:
  - Mojang (Vanilla versions)
  - PaperMC (Paper versions)
  - FabricMC (Fabric versions)
  - Forge (Forge versions)
  - Modrinth (Mods/Plugins search & download)

## What's Been Implemented (2025-01-04)
1. Complete backend API with 30+ endpoints
2. Full frontend with Dashboard, Create Server, Server Panel
3. Real-time console with WebSocket
4. Server properties editor with descriptions and warnings
5. Mods browser (Fabric/Forge) with Modrinth integration
6. Plugins browser (Paper) with Modrinth integration
7. World management (list, upload, export, delete)
8. Server identity (name, MOTD with colors, icon upload)
9. i18n support (Portuguese Brazil / English)
10. Dark/Light theme toggle

## P0 Features (Critical - Implemented)
- [x] Create server (all types)
- [x] Start/Stop/Restart server
- [x] View console logs
- [x] EULA acceptance
- [x] Export server

## P1 Features (Important - Implemented)
- [x] Edit server.properties
- [x] Install mods/plugins from Modrinth
- [x] Upload/export worlds
- [x] Change server icon
- [x] i18n support

## P2 Features (Nice to Have - Future)
- [ ] Player whitelist management UI
- [ ] Backup scheduling
- [ ] Server performance graphs
- [ ] Multiple world support per server
- [ ] CurseForge integration (requires API key)
- [ ] Electron packaging for desktop app

## Next Tasks
1. Test server start functionality (requires Java installed)
2. Add whitelist/ops management UI
3. Add backup/restore functionality
4. Implement scheduled backups
5. Add performance monitoring dashboard

## Bug Fixes (2025-01-04 - Update 1)
- **Java Detection**: Added clear warning banner when Java is not installed
- **Improved Error Messages**: Better error handling for server start with detailed Java installation instructions
- **Download Link**: Direct link to Adoptium (Java 17+) download page
