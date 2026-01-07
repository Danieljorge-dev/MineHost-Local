const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const os = require('os');

// Detectar se está em desenvolvimento
const isDev = !(__dirname.includes('/tmp') || __dirname.includes('/opt') || __dirname.includes('/usr'));

console.log(`Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`__dirname: ${__dirname}`);

let mainWindow;
let backendProcess;

const BACKEND_URL = 'http://localhost:5000';
const BACKEND_PORT = 5000;

// Função para checar se backend está pronto
async function isBackendReady() {
  try {
    await axios.get(`${BACKEND_URL}/api/servers`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Encontrar caminho do Python
function findPythonExecutable() {
  const candidates = [
    // Em desenvolvimento
    isDev ? path.join(__dirname, '..', '..', 'venv', 'bin', 'python') : null,
    // Em produção AppImage/DEB - procura na raiz do projeto
    '/home/djbug/Downloads/Server-MineCriator-main/venv/bin/python',
    // Em instalação DEB padrão
    '/opt/minecriaor/venv/bin/python',
    // Home do usuário
    path.join(os.homedir(), '.minecriaor', 'venv', 'bin', 'python'),
    // Python3 do sistema (fallback)
    'python3'
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      console.log(`✓ Python encontrado: ${candidate}`);
      return candidate;
    }
  }
  
  console.log('⚠ Python não encontrado nos locais padrão, tentando "python3"');
  return 'python3';
}

// Encontrar diretório do backend
function findBackendDirectory() {
  const candidates = [
    // Em desenvolvimento
    isDev ? path.join(__dirname, '..', '..') : null,
    // Em produção - raiz do projeto original
    '/home/djbug/Downloads/Server-MineCriator-main',
    // Em instalação DEB
    '/opt/minecriaor',
    // Home do usuário
    path.join(os.homedir(), '.minecriaor')
  ];

  for (const candidate of candidates) {
    if (candidate) {
      const serverPath = path.join(candidate, 'backend', 'server.py');
      const launcherPath = path.join(candidate, 'backend', 'launcher.py');
      if (fs.existsSync(serverPath) && fs.existsSync(launcherPath)) {
        console.log(`✓ Backend encontrado: ${candidate}`);
        return candidate;
      }
    }
  }
  
  return null;
}

// Iniciar backend
async function startBackend() {
  console.log('');
  console.log('🚀 Iniciando backend...');
  
  const pythonExe = findPythonExecutable();
  const backendDir = findBackendDirectory();
  
  if (!backendDir) {
    console.error('❌ Diretório do backend não encontrado!');
    dialog.showErrorBox(
      'Erro ao iniciar Backend',
      'Diretório do backend não foi encontrado.\n\nPor favor, verifique se a instalação está correta.'
    );
    return false;
  }

  try {
    console.log(`Python: ${pythonExe}`);
    console.log(`Backend dir: ${backendDir}`);
    
    // Usar o launcher.py
    const launcherPath = path.join(backendDir, 'backend', 'launcher.py');
    
    backendProcess = spawn(pythonExe, [launcherPath], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      shell: false
    });

    if (!backendProcess) {
      throw new Error('Falha ao iniciar processo');
    }

    console.log(`✓ Backend iniciado (PID: ${backendProcess.pid})`);

    // Capturar logs do backend
    backendProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[BACKEND] ${message}`);
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[BACKEND ERR] ${message}`);
      }
    });

    backendProcess.on('error', (err) => {
      console.error(`Erro no backend: ${err.message}`);
    });

    // Aguardar backend ficar pronto
    console.log('   Aguardando backend ficar pronto...');
    for (let attempts = 0; attempts < 60; attempts++) {
      if (await isBackendReady()) {
        console.log('✓ Backend pronto!');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.error('⚠ Backend não respondeu em tempo');
    return false;

  } catch (error) {
    console.error(`Erro ao iniciar backend: ${error.message}`);
    dialog.showErrorBox(
      'Erro ao iniciar Backend',
      `Não foi possível iniciar o backend:\n\n${error.message}`
    );
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    // Em produção, carregar arquivo HTML
    const possiblePaths = [
      path.join(__dirname, 'build', 'index.html'),
      path.join(__dirname, '..', 'build', 'index.html'),
      path.join(process.resourcesPath, 'build', 'index.html'),
    ];
    
    let htmlPath = null;
    console.log('Procurando index.html em:');
    for (const p of possiblePaths) {
      console.log(`  Tentando: ${p}`);
      if (fs.existsSync(p)) {
        htmlPath = p;
        console.log(`  ✓ ENCONTRADO!`);
        break;
      }
    }
    
    if (!htmlPath) {
      console.error('⚠ index.html não encontrado!');
      htmlPath = possiblePaths[0];
    }
    
    startUrl = `file://${htmlPath}`;
    console.log(`Carregando: ${startUrl}`);
  }
  
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', async () => {
  console.log('');
  console.log('════════════════════════════════════');
  console.log('  🚀 MineCriator Server Manager');
  console.log('════════════════════════════════════');
  
  const backendStarted = await startBackend();
  
  if (!backendStarted) {
    console.warn('⚠️  Backend não iniciou, mas continuando...');
  }
  
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

module.exports = { BACKEND_URL };
