from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import json
import asyncio
import subprocess
import signal
import shutil
import zipfile
import aiohttp
import aiofiles
import psutil
import xml.etree.ElementTree as ET
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Data directories
DATA_DIR = ROOT_DIR / 'data'
SERVERS_DIR = DATA_DIR / 'servers'
DOWNLOADS_DIR = DATA_DIR / 'downloads'
SETTINGS_FILE = DATA_DIR / 'settings.json'

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
SERVERS_DIR.mkdir(exist_ok=True)
DOWNLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="MineHost Local")
api_router = APIRouter(prefix="/api")

# Store running processes and websocket connections
running_servers: Dict[str, subprocess.Popen] = {}
server_logs: Dict[str, List[str]] = {}
websocket_connections: Dict[str, List[WebSocket]] = {}

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== Models ==============

class ServerCreate(BaseModel):
    name: str
    server_type: str  # vanilla, paper, fabric, forge
    version: str
    ram_min: int = 1024
    ram_max: int = 2048
    port: int = 25565

class ServerUpdate(BaseModel):
    name: Optional[str] = None
    ram_min: Optional[int] = None
    ram_max: Optional[int] = None
    motd: Optional[str] = None
    max_players: Optional[int] = None

class ServerProperties(BaseModel):
    properties: Dict[str, Any]

class ServerResponse(BaseModel):
    id: str
    name: str
    server_type: str
    version: str
    status: str
    port: int
    ram_min: int
    ram_max: int
    created_at: str
    last_started: Optional[str] = None
    players_online: int = 0
    public_ip: Optional[str] = None  # IP público do e4mc
    e4mc_enabled: bool = False  # Se e4mc está ativo
    max_players: int = 20

class EulaAccept(BaseModel):
    accepted: bool

class CommandInput(BaseModel):
    command: str

# ============== Helper Functions ==============

def get_servers_list() -> List[dict]:
    """Load all servers from JSON files"""
    servers = []
    for server_dir in SERVERS_DIR.iterdir():
        if server_dir.is_dir():
            config_file = server_dir / 'config.json'
            if config_file.exists():
                with open(config_file) as f:
                    server_data = json.load(f)
                    server_id = server_data['id']
                    server_data['status'] = 'running' if server_id in running_servers else 'stopped'
                    
                    # Adiciona campos faltantes com valores padrão
                    if 'players_online' not in server_data:
                        server_data['players_online'] = 0
                    if 'max_players' not in server_data:
                        server_data['max_players'] = 20
                    
                    # Adiciona informações do e4mc se disponível
                    server_data['e4mc_enabled'] = check_e4mc_installed(server_id)
                    if server_data['e4mc_enabled']:
                        server_data['public_ip'] = get_e4mc_public_ip(server_id)
                    else:
                        server_data['public_ip'] = None
                    
                    servers.append(server_data)
    return servers

def get_server_config(server_id: str) -> Optional[dict]:
    """Get server configuration"""
    config_file = SERVERS_DIR / server_id / 'config.json'
    if config_file.exists():
        with open(config_file) as f:
            return json.load(f)
    return None

def save_server_config(server_id: str, config: dict):
    """Save server configuration"""
    config_file = SERVERS_DIR / server_id / 'config.json'
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

def get_server_properties(server_id: str) -> Dict[str, str]:
    """Parse server.properties file"""
    props_file = SERVERS_DIR / server_id / 'server.properties'
    properties = {}
    if props_file.exists():
        with open(props_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    properties[key.strip()] = value.strip()
    return properties

def save_server_properties(server_id: str, properties: Dict[str, str]):
    """Save server.properties file"""
    props_file = SERVERS_DIR / server_id / 'server.properties'
    with open(props_file, 'w') as f:
        f.write("# Minecraft server properties\n")
        f.write(f"# Generated by MineHost Local\n")
        for key, value in properties.items():
            f.write(f"{key}={value}\n")

def get_e4mc_public_ip(server_id: str) -> Optional[str]:
    """
    Extrai o IP público do e4mc dos logs do servidor
    O e4mc imprime a URL pública em mensagens como:
    [e4mc] Your server is now publicly available at: example.e4mc.link:12345
    """
    logs_file = SERVERS_DIR / server_id / 'logs' / 'latest.log'
    
    if not logs_file.exists():
        return None
    
    try:
        with open(logs_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                # Procura por padrões do e4mc
                if 'e4mc' in line.lower() and ('publicly available' in line or '.e4mc' in line):
                    # Tenta extrair o endereço
                    if '.e4mc' in line:
                        start = line.find('e4mc')
                        start = line.rfind(' ', 0, start) + 1 if start != -1 else -1
                        if start > 0:
                            end = line.find(' ', start)
                            if end == -1:
                                end = line.find('\n', start)
                            ip_part = line[start:end if end != -1 else None].strip()
                            if '.e4mc' in ip_part:
                                return ip_part
    except Exception as e:
        logger.warning(f"Failed to read e4mc IP from logs: {e}")
    
    return None

def check_e4mc_installed(server_id: str) -> bool:
    """Verifica se a mod e4mc está instalada no servidor"""
    mods_dir = SERVERS_DIR / server_id / 'mods'
    if not mods_dir.exists():
        return False
    
    # Procura por qualquer JAR do e4mc
    for mod_file in mods_dir.glob('*e4mc*.jar'):
        return True
    
    return False

# ============== Mod Dependencies Helper ==============

def extract_mod_dependencies(jar_path: Path) -> List[Dict[str, Any]]:
    """Extract mod dependencies from fabric.mod.json or mcmod.info"""
    dependencies = []
    
    try:
        with zipfile.ZipFile(jar_path, 'r') as jar:
            # Try fabric.mod.json first
            if 'fabric.mod.json' in jar.namelist():
                fabric_data = json.loads(jar.read('fabric.mod.json'))
                for dep in fabric_data.get('depends', {}).keys():
                    if dep not in ['fabricloader', 'java', 'minecraft']:
                        dependencies.append({
                            'name': dep,
                            'type': 'fabric',
                            'required': True
                        })
            
            # Try forge mcmod.info
            if 'mcmod.info' in jar.namelist():
                try:
                    forge_data = json.loads(jar.read('mcmod.info'))
                    mod_info = forge_data[0] if isinstance(forge_data, list) else forge_data
                    for dep in mod_info.get('dependencies', []):
                        if isinstance(dep, dict) and dep.get('modid'):
                            dependencies.append({
                                'name': dep['modid'],
                                'type': 'forge',
                                'required': dep.get('mandatory', True)
                            })
                except (json.JSONDecodeError, IndexError):
                    pass
    except Exception as e:
        logger.warning(f"Failed to extract dependencies from {jar_path}: {e}")
    
    return dependencies

def get_mod_metadata(jar_path: Path) -> Dict[str, Any]:
    """Extract metadata from mod JAR file"""
    metadata = {
        'filename': jar_path.name,
        'size': jar_path.stat().st_size,
        'dependencies': [],
        'mod_name': None,
        'mod_version': None
    }
    
    try:
        with zipfile.ZipFile(jar_path, 'r') as jar:
            # Fabric mod
            if 'fabric.mod.json' in jar.namelist():
                fabric_data = json.loads(jar.read('fabric.mod.json'))
                metadata['mod_name'] = fabric_data.get('name', jar_path.stem)
                metadata['mod_version'] = fabric_data.get('version', 'unknown')
                metadata['dependencies'] = extract_mod_dependencies(jar_path)
            
            # Forge mod
            elif 'mcmod.info' in jar.namelist():
                try:
                    forge_data = json.loads(jar.read('mcmod.info'))
                    mod_info = forge_data[0] if isinstance(forge_data, list) else forge_data
                    metadata['mod_name'] = mod_info.get('name', jar_path.stem)
                    metadata['mod_version'] = mod_info.get('version', 'unknown')
                    metadata['dependencies'] = extract_mod_dependencies(jar_path)
                except:
                    metadata['mod_name'] = jar_path.stem
            else:
                metadata['mod_name'] = jar_path.stem
    except Exception as e:
        logger.warning(f"Failed to extract metadata from {jar_path}: {e}")
        metadata['mod_name'] = jar_path.stem
    
    return metadata

# ============== Version APIs ==============

async def fetch_vanilla_versions() -> List[dict]:
    """Fetch vanilla Minecraft versions from Mojang API"""
    async with aiohttp.ClientSession() as session:
        async with session.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json') as resp:
            if resp.status == 200:
                data = await resp.json()
                versions = []
                for v in data.get('versions', []):
                    if v['type'] in ['release', 'snapshot']:
                        versions.append({
                            'id': v['id'],
                            'type': v['type'],
                            'url': v['url'],
                            'releaseTime': v['releaseTime']
                        })
                return versions[:50]  # Limit to recent versions
    return []

async def fetch_paper_versions() -> List[dict]:
    """Fetch Paper versions from PaperMC API"""
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.papermc.io/v2/projects/paper') as resp:
            if resp.status == 200:
                data = await resp.json()
                versions = []
                for v in reversed(data.get('versions', [])[-30:]):
                    versions.append({
                        'id': v,
                        'type': 'release'
                    })
                return versions
    return []

async def fetch_fabric_versions() -> List[dict]:
    """Fetch Fabric versions"""
    async with aiohttp.ClientSession() as session:
        async with session.get('https://meta.fabricmc.net/v2/versions/game') as resp:
            if resp.status == 200:
                data = await resp.json()
                versions = []
                for v in data[:30]:
                    versions.append({
                        'id': v['version'],
                        'type': 'release' if v.get('stable', False) else 'snapshot'
                    })
                return versions
    return []

async def fetch_forge_versions() -> List[dict]:
    """Fetch Forge versions from Forge files API"""
    async with aiohttp.ClientSession() as session:
        async with session.get('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json') as resp:
            if resp.status == 200:
                data = await resp.json()
                versions = []
                promos = data.get('promos', {})
                seen = set()
                for key in promos:
                    mc_version = key.replace('-latest', '').replace('-recommended', '')
                    if mc_version not in seen and not key.endswith('-latest'):
                        seen.add(mc_version)
                        versions.append({
                            'id': mc_version,
                            'type': 'release',
                            'forge_version': promos.get(key)
                        })
                return list(reversed(versions))[:30]
    return []

# ============== Download Server JAR ==============

async def download_vanilla_jar(version: str, dest_path: Path) -> bool:
    """Download vanilla server JAR"""
    async with aiohttp.ClientSession() as session:
        # Get version manifest
        async with session.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json') as resp:
            if resp.status != 200:
                return False
            data = await resp.json()
        
        # Find version URL
        version_url = None
        for v in data['versions']:
            if v['id'] == version:
                version_url = v['url']
                break
        
        if not version_url:
            return False
        
        # Get version details
        async with session.get(version_url) as resp:
            if resp.status != 200:
                return False
            version_data = await resp.json()
        
        server_url = version_data.get('downloads', {}).get('server', {}).get('url')
        if not server_url:
            return False
        
        # Download JAR
        async with session.get(server_url) as resp:
            if resp.status == 200:
                async with aiofiles.open(dest_path, 'wb') as f:
                    await f.write(await resp.read())
                return True
    return False

async def download_paper_jar(version: str, dest_path: Path) -> bool:
    """Download Paper server JAR"""
    async with aiohttp.ClientSession() as session:
        # Get latest build
        async with session.get(f'https://api.papermc.io/v2/projects/paper/versions/{version}') as resp:
            if resp.status != 200:
                return False
            data = await resp.json()
        
        builds = data.get('builds', [])
        if not builds:
            return False
        
        latest_build = max(builds)
        
        # Get build details
        async with session.get(f'https://api.papermc.io/v2/projects/paper/versions/{version}/builds/{latest_build}') as resp:
            if resp.status != 200:
                return False
            build_data = await resp.json()
        
        download_name = build_data.get('downloads', {}).get('application', {}).get('name')
        if not download_name:
            return False
        
        download_url = f'https://api.papermc.io/v2/projects/paper/versions/{version}/builds/{latest_build}/downloads/{download_name}'
        
        async with session.get(download_url) as resp:
            if resp.status == 200:
                async with aiofiles.open(dest_path, 'wb') as f:
                    await f.write(await resp.read())
                return True
    return False

async def download_fabric_jar(version: str, dest_path: Path) -> bool:
    """Download Fabric server JAR"""
    async with aiohttp.ClientSession() as session:
        # Get latest loader version
        async with session.get('https://meta.fabricmc.net/v2/versions/loader') as resp:
            if resp.status != 200:
                return False
            loaders = await resp.json()
        
        if not loaders:
            return False
        
        loader_version = loaders[0]['version']
        
        # Get latest installer version
        async with session.get('https://meta.fabricmc.net/v2/versions/installer') as resp:
            if resp.status != 200:
                return False
            installers = await resp.json()
        
        if not installers:
            return False
        
        installer_version = installers[0]['version']
        
        # Download server launcher JAR
        download_url = f'https://meta.fabricmc.net/v2/versions/loader/{version}/{loader_version}/{installer_version}/server/jar'
        
        async with session.get(download_url) as resp:
            if resp.status == 200:
                async with aiofiles.open(dest_path, 'wb') as f:
                    await f.write(await resp.read())
                return True
    return False

async def download_forge_jar(version: str, dest_path: Path) -> bool:
    """Download Forge server JAR - Returns installer"""
    async with aiohttp.ClientSession() as session:
        # Get promotion data
        async with session.get('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json') as resp:
            if resp.status != 200:
                return False
            data = await resp.json()
        
        promos = data.get('promos', {})
        forge_version = promos.get(f'{version}-recommended') or promos.get(f'{version}-latest')
        
        if not forge_version:
            return False
        
        # Download installer
        full_version = f'{version}-{forge_version}'
        download_url = f'https://maven.minecraftforge.net/net/minecraftforge/forge/{full_version}/forge-{full_version}-installer.jar'
        
        async with session.get(download_url) as resp:
            if resp.status == 200:
                installer_path = dest_path.parent / 'forge-installer.jar'
                async with aiofiles.open(installer_path, 'wb') as f:
                    await f.write(await resp.read())
                return True
    return False

# ============== API Routes ==============

@api_router.get("/")
async def root():
    return {"message": "MineHost Local API", "version": "1.0.0"}

@api_router.get("/versions/{server_type}")
async def get_versions(server_type: str):
    """Get available versions for a server type"""
    if server_type == 'vanilla':
        versions = await fetch_vanilla_versions()
    elif server_type == 'paper':
        versions = await fetch_paper_versions()
    elif server_type == 'fabric':
        versions = await fetch_fabric_versions()
    elif server_type == 'forge':
        versions = await fetch_forge_versions()
    else:
        raise HTTPException(status_code=400, detail="Invalid server type")
    
    return {"versions": versions}

@api_router.get("/servers", response_model=List[ServerResponse])
async def list_servers():
    """List all servers"""
    servers = get_servers_list()
    return servers

@api_router.post("/servers", response_model=ServerResponse)
async def create_server(server: ServerCreate, background_tasks: BackgroundTasks):
    """Create a new server"""
    server_id = str(uuid.uuid4())[:8]
    server_path = SERVERS_DIR / server_id
    server_path.mkdir(exist_ok=True)
    
    # Create config
    config = {
        "id": server_id,
        "name": server.name,
        "server_type": server.server_type,
        "version": server.version,
        "status": "downloading",
        "port": server.port,
        "ram_min": server.ram_min,
        "ram_max": server.ram_max,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_started": None,
        "players_online": 0,
        "max_players": 20,
        "eula_accepted": False
    }
    save_server_config(server_id, config)
    
    # Download server JAR in background
    async def download_and_setup():
        jar_path = server_path / 'server.jar'
        success = False
        
        try:
            if server.server_type == 'vanilla':
                success = await download_vanilla_jar(server.version, jar_path)
            elif server.server_type == 'paper':
                success = await download_paper_jar(server.version, jar_path)
            elif server.server_type == 'fabric':
                success = await download_fabric_jar(server.version, jar_path)
            elif server.server_type == 'forge':
                success = await download_forge_jar(server.version, jar_path)
            
            if success:
                # Create default server.properties
                default_props = {
                    "server-port": str(server.port),
                    "motd": f"A {server.name} Server",
                    "max-players": "20",
                    "difficulty": "normal",
                    "gamemode": "survival",
                    "level-name": "world",
                    "enable-command-block": "false",
                    "spawn-protection": "16",
                    "view-distance": "10",
                    "simulation-distance": "10",
                    "online-mode": "false",
                    "white-list": "false",
                    "pvp": "true",
                    "spawn-animals": "true",
                    "spawn-monsters": "true",
                    "spawn-npcs": "true",
                    "allow-flight": "false",
                    "level-type": "minecraft:normal",
                    "enforce-secure-profile": "false"
                }
                save_server_properties(server_id, default_props)
                
                # Create start scripts
                start_sh = server_path / 'start.sh'
                start_bat = server_path / 'start.bat'
                
                with open(start_sh, 'w') as f:
                    f.write(f'#!/bin/bash\njava -Xms{server.ram_min}M -Xmx{server.ram_max}M -jar server.jar nogui\n')
                os.chmod(start_sh, 0o755)
                
                with open(start_bat, 'w') as f:
                    f.write(f'@echo off\njava -Xms{server.ram_min}M -Xmx{server.ram_max}M -jar server.jar nogui\npause\n')
                
                config['status'] = 'stopped'
            else:
                config['status'] = 'error'
            
            save_server_config(server_id, config)
        except Exception as e:
            logger.error(f"Error setting up server: {e}")
            config['status'] = 'error'
            save_server_config(server_id, config)
    
    background_tasks.add_task(download_and_setup)
    
    return config

@api_router.get("/servers/{server_id}")
async def get_server(server_id: str):
    """Get server details"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    config['status'] = 'running' if server_id in running_servers else config.get('status', 'stopped')
    
    # Adiciona informações do e4mc
    config['e4mc_enabled'] = check_e4mc_installed(server_id)
    if config['e4mc_enabled']:
        config['public_ip'] = get_e4mc_public_ip(server_id)
    else:
        config['public_ip'] = None
    
    return config

@api_router.put("/servers/{server_id}")
async def update_server(server_id: str, update: ServerUpdate):
    """Update server configuration"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if update.name:
        config['name'] = update.name
    if update.ram_min:
        config['ram_min'] = update.ram_min
    if update.ram_max:
        config['ram_max'] = update.ram_max
    
    # Update server.properties if needed
    if update.motd or update.max_players:
        props = get_server_properties(server_id)
        if update.motd:
            props['motd'] = update.motd
        if update.max_players:
            props['max-players'] = str(update.max_players)
            config['max_players'] = update.max_players
        save_server_properties(server_id, props)
    
    save_server_config(server_id, config)
    return config

@api_router.delete("/servers/{server_id}")
async def delete_server(server_id: str):
    """Delete a server"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Stop if running
    if server_id in running_servers:
        await stop_server(server_id)
    
    # Delete directory
    server_path = SERVERS_DIR / server_id
    shutil.rmtree(server_path, ignore_errors=True)
    
    return {"message": "Server deleted"}

@api_router.get("/servers/{server_id}/properties")
async def get_properties(server_id: str):
    """Get server.properties"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    properties = get_server_properties(server_id)
    return {"properties": properties}

@api_router.put("/servers/{server_id}/properties")
async def update_properties(server_id: str, data: ServerProperties):
    """Update server.properties"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    save_server_properties(server_id, data.properties)
    
    # Update config with relevant properties
    if 'max-players' in data.properties:
        config['max_players'] = int(data.properties['max-players'])
    if 'server-port' in data.properties:
        config['port'] = int(data.properties['server-port'])
    save_server_config(server_id, config)
    
    return {"message": "Properties updated"}

@api_router.post("/servers/{server_id}/eula")
async def accept_eula(server_id: str, eula: EulaAccept):
    """Accept EULA"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    eula_file = server_path / 'eula.txt'
    
    with open(eula_file, 'w') as f:
        f.write(f"# EULA accepted via MineHost Local\n")
        f.write(f"# {datetime.now(timezone.utc).isoformat()}\n")
        f.write(f"eula={'true' if eula.accepted else 'false'}\n")
    
    config['eula_accepted'] = eula.accepted
    save_server_config(server_id, config)
    
    return {"message": "EULA status updated", "accepted": eula.accepted}

@api_router.post("/servers/{server_id}/start")
async def start_server(server_id: str):
    """Start the server"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if server_id in running_servers:
        raise HTTPException(status_code=400, detail="Server already running")
    
    if not config.get('eula_accepted'):
        raise HTTPException(status_code=400, detail="EULA must be accepted first")
    
    # Check if Java is installed
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, text=True, timeout=10)
    except FileNotFoundError:
        raise HTTPException(
            status_code=400, 
            detail="Java not found! Please install Java 17+ to run Minecraft servers. Download from: https://adoptium.net/"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error checking Java: {str(e)}")
    
    server_path = SERVERS_DIR / server_id
    jar_path = server_path / 'server.jar'
    
    if not jar_path.exists():
        raise HTTPException(status_code=400, detail="Server JAR not found. The download may still be in progress.")
    
    # Build Java command with optimized flags
    java_cmd = [
        'java',
        f'-Xms{config["ram_min"]}M',
        f'-Xmx{config["ram_max"]}M',
        '-XX:+UseG1GC',
        '-XX:+ParallelRefProcEnabled',
        '-XX:MaxGCPauseMillis=200',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+DisableExplicitGC',
        '-XX:+AlwaysPreTouch',
        '-XX:G1NewSizePercent=30',
        '-XX:G1MaxNewSizePercent=40',
        '-XX:G1HeapRegionSize=8M',
        '-XX:G1ReservePercent=20',
        '-XX:G1HeapWastePercent=5',
        '-XX:G1MixedGCCountTarget=4',
        '-XX:InitiatingHeapOccupancyPercent=15',
        '-XX:G1MixedGCLiveThresholdPercent=90',
        '-XX:G1RSetUpdatingPauseTimePercent=5',
        '-XX:SurvivorRatio=32',
        '-XX:+PerfDisableSharedMem',
        '-XX:MaxTenuringThreshold=1',
        '-Dusing.aikars.flags=https://mcflags.emc.gs',
        '-Daikars.new.flags=true',
        '-jar', 'server.jar',
        'nogui'
    ]
    
    # Start process
    try:
        process = subprocess.Popen(
            java_cmd,
            cwd=server_path,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        running_servers[server_id] = process
        server_logs[server_id] = []
        
        # Start log reader task
        asyncio.create_task(read_server_logs(server_id, process))
        
        config['status'] = 'running'
        config['last_started'] = datetime.now(timezone.utc).isoformat()
        save_server_config(server_id, config)
        
        return {"message": "Server started", "pid": process.pid}
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def read_server_logs(server_id: str, process: subprocess.Popen):
    """Read logs from server process"""
    try:
        while True:
            if process.poll() is not None:
                break
            
            line = await asyncio.to_thread(process.stdout.readline)
            if line:
                log_entry = {
                    "time": datetime.now(timezone.utc).isoformat(),
                    "message": line.strip()
                }
                
                if server_id not in server_logs:
                    server_logs[server_id] = []
                
                server_logs[server_id].append(log_entry)
                
                # Keep only last 1000 lines
                if len(server_logs[server_id]) > 1000:
                    server_logs[server_id] = server_logs[server_id][-1000:]
                
                # Broadcast to websockets
                if server_id in websocket_connections:
                    for ws in websocket_connections[server_id]:
                        try:
                            await ws.send_json(log_entry)
                        except:
                            pass
    except Exception as e:
        logger.error(f"Error reading logs: {e}")
    finally:
        # Cleanup when process ends
        if server_id in running_servers:
            del running_servers[server_id]
        
        config = get_server_config(server_id)
        if config:
            config['status'] = 'stopped'
            save_server_config(server_id, config)

@api_router.post("/servers/{server_id}/stop")
async def stop_server(server_id: str):
    """Stop the server"""
    if server_id not in running_servers:
        raise HTTPException(status_code=400, detail="Server not running")
    
    process = running_servers[server_id]
    
    try:
        # Send stop command
        process.stdin.write("stop\n")
        process.stdin.flush()
        
        # Wait for graceful shutdown
        try:
            process.wait(timeout=30)
        except subprocess.TimeoutExpired:
            process.terminate()
            process.wait(timeout=10)
    except Exception as e:
        logger.error(f"Error stopping server: {e}")
        process.kill()
    
    if server_id in running_servers:
        del running_servers[server_id]
    
    config = get_server_config(server_id)
    if config:
        config['status'] = 'stopped'
        save_server_config(server_id, config)
    
    return {"message": "Server stopped"}

@api_router.post("/servers/{server_id}/restart")
async def restart_server(server_id: str):
    """Restart the server"""
    if server_id in running_servers:
        await stop_server(server_id)
        await asyncio.sleep(2)
    
    return await start_server(server_id)

@api_router.post("/servers/{server_id}/command")
async def send_command(server_id: str, cmd: CommandInput):
    """Send command to server"""
    if server_id not in running_servers:
        raise HTTPException(status_code=400, detail="Server not running")
    
    process = running_servers[server_id]
    
    try:
        process.stdin.write(f"{cmd.command}\n")
        process.stdin.flush()
        return {"message": "Command sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/servers/{server_id}/logs")
async def get_logs(server_id: str, lines: int = 100):
    """Get recent server logs"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    logs = server_logs.get(server_id, [])
    return {"logs": logs[-lines:]}

@api_router.websocket("/ws/servers/{server_id}/logs")
async def websocket_logs(websocket: WebSocket, server_id: str):
    """WebSocket for live logs"""
    await websocket.accept()
    
    if server_id not in websocket_connections:
        websocket_connections[server_id] = []
    
    websocket_connections[server_id].append(websocket)
    
    try:
        # Send existing logs
        for log in server_logs.get(server_id, [])[-100:]:
            await websocket.send_json(log)
        
        # Keep connection alive
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        if server_id in websocket_connections:
            websocket_connections[server_id].remove(websocket)

# ============== Mods/Plugins API (Modrinth) ==============

@api_router.get("/mods/search")
async def search_mods(query: str, loader: str = "fabric", version: str = "", limit: int = 20):
    """Search mods on Modrinth"""
    facets = [
        [f'project_type:mod'],
        [f'categories:{loader}']
    ]
    
    if version:
        facets.append([f'versions:{version}'])
    
    params = {
        'query': query,
        'limit': limit,
        'facets': json.dumps(facets)
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.modrinth.com/v2/search', params=params) as resp:
            if resp.status == 200:
                data = await resp.json()
                return {"mods": data.get('hits', [])}
    
    return {"mods": []}

@api_router.get("/mods/{mod_id}")
async def get_mod_details(mod_id: str):
    """Get mod details from Modrinth"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://api.modrinth.com/v2/project/{mod_id}') as resp:
            if resp.status == 200:
                return await resp.json()
    
    raise HTTPException(status_code=404, detail="Mod not found")

@api_router.get("/mods/{mod_id}/versions")
async def get_mod_versions(mod_id: str, loader: str = "", game_version: str = ""):
    """Get mod versions from Modrinth"""
    params = {}
    if loader:
        params['loaders'] = json.dumps([loader])
    if game_version:
        params['game_versions'] = json.dumps([game_version])
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://api.modrinth.com/v2/project/{mod_id}/version', params=params) as resp:
            if resp.status == 200:
                return {"versions": await resp.json()}
    
    return {"versions": []}

@api_router.post("/servers/{server_id}/mods")
async def install_mod(server_id: str, mod_id: str, version_id: str):
    """Install a mod to the server with automatic dependency installation"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    mods_path = server_path / 'mods'
    mods_path.mkdir(exist_ok=True)
    
    installed_mods = []
    
    async def download_and_install_mod(mid: str, vid: str, is_dependency: bool = False) -> Optional[str]:
        """Download and install a single mod"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f'https://api.modrinth.com/v2/version/{vid}') as resp:
                if resp.status != 200:
                    return None
                version_data = await resp.json()
            
            # Download primary file
            files = version_data.get('files', [])
            primary_file = next((f for f in files if f.get('primary')), files[0] if files else None)
            
            if not primary_file:
                return None
            
            download_url = primary_file['url']
            filename = primary_file['filename']
            file_path = mods_path / filename
            
            # Skip if already installed
            if file_path.exists():
                return filename
            
            async with session.get(download_url) as resp:
                if resp.status == 200:
                    async with aiofiles.open(file_path, 'wb') as f:
                        await f.write(await resp.read())
                    return filename
        
        return None
    
    # Install main mod
    filename = await download_and_install_mod(mod_id, version_id)
    if filename:
        installed_mods.append({"name": filename, "is_dependency": False})
        
        # Extract dependencies from the installed mod
        jar_path = mods_path / filename
        dependencies = extract_mod_dependencies(jar_path)
        
        # Try to install dependencies
        if dependencies:
            for dep in dependencies:
                if dep['required']:  # Only install required dependencies
                    try:
                        # Search for dependency on Modrinth
                        params = {
                            'query': dep['name'],
                            'limit': 1,
                            'facets': json.dumps([
                                ['project_type:mod'],
                                ['categories:' + config.get('server_type', 'fabric')]
                            ])
                        }
                        async with aiohttp.ClientSession() as session:
                            async with session.get('https://api.modrinth.com/v2/search', params=params) as resp:
                                if resp.status == 200:
                                    data = await resp.json()
                                    hits = data.get('hits', [])
                                    if hits:
                                        dep_mod = hits[0]
                                        # Get compatible version
                                        dep_versions_params = {
                                            'loaders': json.dumps([config.get('server_type', 'fabric')]),
                                            'game_versions': json.dumps([config.get('version', '')])
                                        }
                                        async with session.get(f"https://api.modrinth.com/v2/project/{dep_mod['project_id']}/version", 
                                                             params=dep_versions_params) as vresp:
                                            if vresp.status == 200:
                                                versions = await vresp.json()
                                                if versions:
                                                    dep_filename = await download_and_install_mod(dep_mod['project_id'], versions[0]['id'], True)
                                                    if dep_filename:
                                                        installed_mods.append({"name": dep_filename, "is_dependency": True})
                    except Exception as e:
                        logger.warning(f"Failed to install dependency {dep['name']}: {e}")
    
    return {"message": "Mod(s) installed", "installed": installed_mods}

@api_router.get("/servers/{server_id}/mods")
async def list_installed_mods(server_id: str):
    """List installed mods with metadata"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    mods_path = server_path / 'mods'
    
    mods = []
    if mods_path.exists():
        for mod_file in mods_path.iterdir():
            if mod_file.suffix == '.jar':
                metadata = get_mod_metadata(mod_file)
                mods.append(metadata)
    
    return {"mods": mods}

@api_router.delete("/servers/{server_id}/mods/{filename}")
async def remove_mod(server_id: str, filename: str):
    """Remove an installed mod"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    mod_path = SERVERS_DIR / server_id / 'mods' / filename
    
    if mod_path.exists():
        mod_path.unlink()
        return {"message": "Mod removed"}
    
    raise HTTPException(status_code=404, detail="Mod not found")

# ============== Plugins API (For Paper/Spigot) ==============

@api_router.get("/plugins/search")
async def search_plugins(query: str, limit: int = 20):
    """Search plugins on Modrinth (plugin type)"""
    facets = [
        ['project_type:plugin'],
        ['categories:paper', 'categories:spigot', 'categories:bukkit']
    ]
    
    params = {
        'query': query,
        'limit': limit,
        'facets': json.dumps(facets)
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.modrinth.com/v2/search', params=params) as resp:
            if resp.status == 200:
                data = await resp.json()
                return {"plugins": data.get('hits', [])}
    
    return {"plugins": []}

@api_router.post("/servers/{server_id}/plugins")
async def install_plugin(server_id: str, plugin_id: str, version_id: str):
    """Install a plugin to the server"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if config['server_type'] not in ['paper', 'spigot', 'bukkit']:
        raise HTTPException(status_code=400, detail="Plugins only supported on Paper/Spigot servers")
    
    server_path = SERVERS_DIR / server_id
    plugins_path = server_path / 'plugins'
    plugins_path.mkdir(exist_ok=True)
    
    # Get version info
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://api.modrinth.com/v2/version/{version_id}') as resp:
            if resp.status != 200:
                raise HTTPException(status_code=404, detail="Version not found")
            version_data = await resp.json()
        
        files = version_data.get('files', [])
        primary_file = next((f for f in files if f.get('primary')), files[0] if files else None)
        
        if not primary_file:
            raise HTTPException(status_code=404, detail="No downloadable file found")
        
        download_url = primary_file['url']
        filename = primary_file['filename']
        
        async with session.get(download_url) as resp:
            if resp.status == 200:
                file_path = plugins_path / filename
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(await resp.read())
    
    return {"message": "Plugin installed", "filename": filename}

@api_router.get("/servers/{server_id}/plugins")
async def list_installed_plugins(server_id: str):
    """List installed plugins"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    plugins_path = server_path / 'plugins'
    
    plugins = []
    if plugins_path.exists():
        for plugin_file in plugins_path.iterdir():
            if plugin_file.suffix == '.jar':
                plugins.append({
                    "filename": plugin_file.name,
                    "size": plugin_file.stat().st_size
                })
    
    return {"plugins": plugins}

# ============== World Management ==============

@api_router.get("/servers/{server_id}/worlds")
async def list_worlds(server_id: str):
    """List worlds in server"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    worlds = []
    
    # Check for world directories
    for item in server_path.iterdir():
        if item.is_dir():
            level_dat = item / 'level.dat'
            if level_dat.exists():
                worlds.append({
                    "name": item.name,
                    "size": sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                })
    
    return {"worlds": worlds}

@api_router.post("/servers/{server_id}/worlds/upload")
async def upload_world(server_id: str, file: UploadFile = File(...)):
    """Upload a world"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    temp_zip = server_path / 'temp_world.zip'
    
    # Save uploaded file
    async with aiofiles.open(temp_zip, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Extract
    try:
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            # Find the world folder name
            names = zip_ref.namelist()
            root_dir = names[0].split('/')[0] if names else 'world'
            zip_ref.extractall(server_path)
    finally:
        temp_zip.unlink(missing_ok=True)
    
    return {"message": "World uploaded", "name": root_dir}

@api_router.get("/servers/{server_id}/worlds/{world_name}/export")
async def export_world(server_id: str, world_name: str):
    """Export a world as ZIP"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    world_path = SERVERS_DIR / server_id / world_name
    
    if not world_path.exists():
        raise HTTPException(status_code=404, detail="World not found")
    
    # Create ZIP
    zip_path = SERVERS_DIR / server_id / f'{world_name}.zip'
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in world_path.rglob('*'):
            if file_path.is_file():
                arcname = f"{world_name}/{file_path.relative_to(world_path)}"
                zipf.write(file_path, arcname)
    
    return FileResponse(
        zip_path,
        media_type='application/zip',
        filename=f'{world_name}.zip'
    )

@api_router.delete("/servers/{server_id}/worlds/{world_name}")
async def delete_world(server_id: str, world_name: str):
    """Delete a world"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    world_path = SERVERS_DIR / server_id / world_name
    
    if not world_path.exists():
        raise HTTPException(status_code=404, detail="World not found")
    
    shutil.rmtree(world_path)
    
    return {"message": "World deleted"}

# ============== Export/Import Server ==============

@api_router.get("/servers/{server_id}/export")
async def export_server(server_id: str):
    """Export entire server as ZIP"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    export_name = f"{config['name'].replace(' ', '_')}_{server_id}"
    zip_path = DATA_DIR / f'{export_name}.zip'
    
    # Files/folders to exclude
    exclude_patterns = {'.lock', 'session.lock', 'logs', 'crash-reports', '.cache'}
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in server_path.rglob('*'):
            if file_path.is_file():
                # Check exclusions
                if any(ex in str(file_path) for ex in exclude_patterns):
                    continue
                
                arcname = f"{export_name}/{file_path.relative_to(server_path)}"
                zipf.write(file_path, arcname)
    
    return FileResponse(
        zip_path,
        media_type='application/zip',
        filename=f'{export_name}.zip',
        background=BackgroundTasks()
    )

@api_router.post("/servers/import")
async def import_server(file: UploadFile = File(...)):
    """Import a server from ZIP"""
    server_id = str(uuid.uuid4())[:8]
    server_path = SERVERS_DIR / server_id
    server_path.mkdir(exist_ok=True)
    
    temp_zip = server_path / 'import.zip'
    
    # Save uploaded file
    async with aiofiles.open(temp_zip, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Extract
    try:
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            # Extract to temp dir first
            temp_extract = server_path / 'temp_extract'
            zip_ref.extractall(temp_extract)
            
            # Move contents from nested folder if exists
            items = list(temp_extract.iterdir())
            if len(items) == 1 and items[0].is_dir():
                for item in items[0].iterdir():
                    shutil.move(str(item), str(server_path))
                shutil.rmtree(temp_extract)
            else:
                for item in items:
                    shutil.move(str(item), str(server_path))
                temp_extract.rmdir()
    finally:
        temp_zip.unlink(missing_ok=True)
    
    # Try to load existing config or create new one
    config_file = server_path / 'config.json'
    if config_file.exists():
        with open(config_file) as f:
            config = json.load(f)
        config['id'] = server_id
    else:
        # Create new config
        config = {
            "id": server_id,
            "name": "Imported Server",
            "server_type": "vanilla",
            "version": "unknown",
            "status": "stopped",
            "port": 25565,
            "ram_min": 1024,
            "ram_max": 2048,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_started": None,
            "players_online": 0,
            "max_players": 20,
            "eula_accepted": False
        }
        
        # Check for eula.txt
        eula_file = server_path / 'eula.txt'
        if eula_file.exists():
            with open(eula_file) as f:
                content = f.read()
                config['eula_accepted'] = 'eula=true' in content.lower()
    
    save_server_config(server_id, config)
    
    return {"message": "Server imported", "server_id": server_id}

# ============== Icon Management ==============

@api_router.post("/servers/{server_id}/icon")
async def upload_icon(server_id: str, file: UploadFile = File(...)):
    """Upload server icon"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server_path = SERVERS_DIR / server_id
    icon_path = server_path / 'server-icon.png'
    
    async with aiofiles.open(icon_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {"message": "Icon uploaded"}

@api_router.get("/servers/{server_id}/icon")
async def get_icon(server_id: str):
    """Get server icon"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    icon_path = SERVERS_DIR / server_id / 'server-icon.png'
    
    if not icon_path.exists():
        raise HTTPException(status_code=404, detail="Icon not found")
    
    return FileResponse(icon_path, media_type='image/png')

@api_router.delete("/servers/{server_id}/icon")
async def delete_icon(server_id: str):
    """Delete server icon"""
    config = get_server_config(server_id)
    if not config:
        raise HTTPException(status_code=404, detail="Server not found")
    
    icon_path = SERVERS_DIR / server_id / 'server-icon.png'
    
    if icon_path.exists():
        icon_path.unlink()
    
    return {"message": "Icon deleted"}

# ============== System Info ==============

@api_router.get("/system/info")
async def get_system_info():
    """Get system information"""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_percent": cpu_percent,
        "memory": {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent
        },
        "disk": {
            "total": disk.total,
            "free": disk.free,
            "percent": disk.percent
        },
        "running_servers": len(running_servers)
    }

@api_router.get("/system/java")
async def check_java():
    """Check Java installation"""
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, text=True)
        version_output = result.stderr or result.stdout
        return {"installed": True, "version": version_output.split('\n')[0]}
    except FileNotFoundError:
        return {"installed": False, "version": None}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    for server_id in list(running_servers.keys()):
        try:
            await stop_server(server_id)
        except:
            pass
