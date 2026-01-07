import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      "app_name": "MineHost Local",
      "loading": "Loading...",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "confirm": "Confirm",
      "error": "Error",
      "success": "Success",
      "warning": "Warning",
      "close": "Close",
      "search": "Search",
      "install": "Install",
      "remove": "Remove",
      "export": "Export",
      "import": "Import",
      "upload": "Upload",
      "download": "Download",
      
      // Navigation
      "nav_dashboard": "Dashboard",
      "nav_create": "Create Server",
      "nav_settings": "Settings",
      
      // Dashboard
      "dashboard_title": "Your Servers",
      "dashboard_empty": "No servers yet",
      "dashboard_empty_desc": "Create your first Minecraft server to get started",
      "dashboard_create_first": "Create Your First Server",
      "server_running": "Running",
      "server_stopped": "Stopped",
      "server_downloading": "Downloading",
      "server_error": "Error",
      "players_online": "players online",
      
      // Create Server
      "create_title": "Create New Server",
      "create_step_type": "Server Type",
      "create_step_version": "Version",
      "create_step_config": "Configuration",
      "create_step_confirm": "Confirm",
      "server_name": "Server Name",
      "server_name_placeholder": "My Awesome Server",
      "server_type": "Server Type",
      "server_version": "Version",
      "server_port": "Port",
      "ram_allocation": "RAM Allocation",
      "ram_min": "Minimum RAM",
      "ram_max": "Maximum RAM",
      "create_server": "Create Server",
      "creating_server": "Creating Server...",
      
      // Server Types
      "type_vanilla": "Vanilla",
      "type_vanilla_desc": "Pure Minecraft experience",
      "type_paper": "Paper",
      "type_paper_desc": "High performance with plugins",
      "type_fabric": "Fabric",
      "type_fabric_desc": "Lightweight modding",
      "type_forge": "Forge",
      "type_forge_desc": "Full modding support",
      
      // Server Panel
      "panel_console": "Console",
      "panel_settings": "Settings",
      "panel_mods": "Mods",
      "panel_plugins": "Plugins",
      "panel_worlds": "Worlds",
      "panel_identity": "Identity",
      
      // Console
      "console_title": "Server Console",
      "console_placeholder": "Type a command...",
      "console_send": "Send",
      "console_clear": "Clear",
      
      // Controls
      "control_start": "Start",
      "control_stop": "Stop",
      "control_restart": "Restart",
      "control_export": "Export Server",
      
      // EULA
      "eula_title": "Minecraft EULA",
      "eula_description": "You must accept the Minecraft End User License Agreement to run this server.",
      "eula_read": "Read EULA",
      "eula_accept": "I accept the EULA",
      "eula_decline": "Decline",
      
      // Properties
      "properties_title": "Server Properties",
      "properties_search": "Search properties...",
      "properties_saved": "Properties saved",
      
      // Mods
      "mods_title": "Mods",
      "mods_search": "Search mods...",
      "mods_installed": "Installed Mods",
      "mods_browse": "Browse Mods",
      "mods_no_installed": "No mods installed",
      "mods_install_success": "Mod installed successfully",
      
      // Plugins
      "plugins_title": "Plugins",
      "plugins_search": "Search plugins...",
      "plugins_installed": "Installed Plugins",
      "plugins_browse": "Browse Plugins",
      "plugins_no_installed": "No plugins installed",
      "plugins_install_success": "Plugin installed successfully",
      
      // Worlds
      "worlds_title": "Worlds",
      "worlds_current": "Current Worlds",
      "worlds_no_worlds": "No worlds found",
      "worlds_upload": "Upload World",
      "worlds_export": "Export",
      "worlds_delete": "Delete",
      
      // Identity
      "identity_title": "Server Identity",
      "identity_name": "Server Name",
      "identity_motd": "Message of the Day",
      "identity_icon": "Server Icon",
      "identity_icon_upload": "Upload Icon",
      "identity_icon_remove": "Remove Icon",
      "identity_preview": "Preview",
      
      // System
      "system_info": "System Information",
      "system_cpu": "CPU Usage",
      "system_memory": "Memory",
      "system_disk": "Disk Space",
      "system_java": "Java",
      "system_java_installed": "Java Installed",
      "system_java_not_installed": "Java Not Installed",
      
      // Errors
      "error_server_not_found": "Server not found",
      "error_eula_required": "EULA must be accepted first",
      "error_server_running": "Server is already running",
      "error_server_not_running": "Server is not running",
      "error_download_failed": "Failed to download server",
      "error_java_not_found": "Java not found! Please install Java 17+ to run Minecraft servers.",
      "error_java_download": "Download Java from: https://adoptium.net/",
      
      // Confirmations
      "confirm_delete_server": "Are you sure you want to delete this server? This action cannot be undone.",
      "confirm_delete_world": "Are you sure you want to delete this world?",
      "confirm_delete_mod": "Are you sure you want to remove this mod?",
    }
  },
  pt: {
    translation: {
      // Common
      "app_name": "MineHost Local",
      "loading": "Carregando...",
      "save": "Salvar",
      "cancel": "Cancelar",
      "delete": "Excluir",
      "confirm": "Confirmar",
      "error": "Erro",
      "success": "Sucesso",
      "warning": "Aviso",
      "close": "Fechar",
      "search": "Buscar",
      "install": "Instalar",
      "remove": "Remover",
      "export": "Exportar",
      "import": "Importar",
      "upload": "Enviar",
      "download": "Baixar",
      
      // Navigation
      "nav_dashboard": "Painel",
      "nav_create": "Criar Servidor",
      "nav_settings": "Configurações",
      
      // Dashboard
      "dashboard_title": "Seus Servidores",
      "dashboard_empty": "Nenhum servidor ainda",
      "dashboard_empty_desc": "Crie seu primeiro servidor Minecraft para começar",
      "dashboard_create_first": "Criar Primeiro Servidor",
      "server_running": "Rodando",
      "server_stopped": "Parado",
      "server_downloading": "Baixando",
      "server_error": "Erro",
      "players_online": "jogadores online",
      
      // Create Server
      "create_title": "Criar Novo Servidor",
      "create_step_type": "Tipo de Servidor",
      "create_step_version": "Versão",
      "create_step_config": "Configuração",
      "create_step_confirm": "Confirmar",
      "server_name": "Nome do Servidor",
      "server_name_placeholder": "Meu Servidor Incrível",
      "server_type": "Tipo de Servidor",
      "server_version": "Versão",
      "server_port": "Porta",
      "ram_allocation": "Alocação de RAM",
      "ram_min": "RAM Mínima",
      "ram_max": "RAM Máxima",
      "create_server": "Criar Servidor",
      "creating_server": "Criando Servidor...",
      
      // Server Types
      "type_vanilla": "Vanilla",
      "type_vanilla_desc": "Experiência Minecraft pura",
      "type_paper": "Paper",
      "type_paper_desc": "Alta performance com plugins",
      "type_fabric": "Fabric",
      "type_fabric_desc": "Modding leve",
      "type_forge": "Forge",
      "type_forge_desc": "Suporte completo a mods",
      
      // Server Panel
      "panel_console": "Console",
      "panel_settings": "Configurações",
      "panel_mods": "Mods",
      "panel_plugins": "Plugins",
      "panel_worlds": "Mundos",
      "panel_identity": "Identidade",
      
      // Console
      "console_title": "Console do Servidor",
      "console_placeholder": "Digite um comando...",
      "console_send": "Enviar",
      "console_clear": "Limpar",
      
      // Controls
      "control_start": "Iniciar",
      "control_stop": "Parar",
      "control_restart": "Reiniciar",
      "control_export": "Exportar Servidor",
      
      // EULA
      "eula_title": "EULA do Minecraft",
      "eula_description": "Você deve aceitar o Contrato de Licença de Usuário Final do Minecraft para executar este servidor.",
      "eula_read": "Ler EULA",
      "eula_accept": "Eu aceito o EULA",
      "eula_decline": "Recusar",
      
      // Properties
      "properties_title": "Propriedades do Servidor",
      "properties_search": "Buscar propriedades...",
      "properties_saved": "Propriedades salvas",
      
      // Mods
      "mods_title": "Mods",
      "mods_search": "Buscar mods...",
      "mods_installed": "Mods Instalados",
      "mods_browse": "Procurar Mods",
      "mods_no_installed": "Nenhum mod instalado",
      "mods_install_success": "Mod instalado com sucesso",
      
      // Plugins
      "plugins_title": "Plugins",
      "plugins_search": "Buscar plugins...",
      "plugins_installed": "Plugins Instalados",
      "plugins_browse": "Procurar Plugins",
      "plugins_no_installed": "Nenhum plugin instalado",
      "plugins_install_success": "Plugin instalado com sucesso",
      
      // Worlds
      "worlds_title": "Mundos",
      "worlds_current": "Mundos Atuais",
      "worlds_no_worlds": "Nenhum mundo encontrado",
      "worlds_upload": "Enviar Mundo",
      "worlds_export": "Exportar",
      "worlds_delete": "Excluir",
      
      // Identity
      "identity_title": "Identidade do Servidor",
      "identity_name": "Nome do Servidor",
      "identity_motd": "Mensagem do Dia",
      "identity_icon": "Ícone do Servidor",
      "identity_icon_upload": "Enviar Ícone",
      "identity_icon_remove": "Remover Ícone",
      "identity_preview": "Visualizar",
      
      // System
      "system_info": "Informações do Sistema",
      "system_cpu": "Uso de CPU",
      "system_memory": "Memória",
      "system_disk": "Espaço em Disco",
      "system_java": "Java",
      "system_java_installed": "Java Instalado",
      "system_java_not_installed": "Java Não Instalado",
      
      // Errors
      "error_server_not_found": "Servidor não encontrado",
      "error_eula_required": "EULA deve ser aceito primeiro",
      "error_server_running": "Servidor já está rodando",
      "error_server_not_running": "Servidor não está rodando",
      "error_download_failed": "Falha ao baixar servidor",
      "error_java_not_found": "Java não encontrado! Instale o Java 17+ para rodar servidores Minecraft.",
      "error_java_download": "Baixe o Java em: https://adoptium.net/",
      
      // Confirmations
      "confirm_delete_server": "Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.",
      "confirm_delete_world": "Tem certeza que deseja excluir este mundo?",
      "confirm_delete_mod": "Tem certeza que deseja remover este mod?",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'pt',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
