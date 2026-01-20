// Global state
let ws = null;
let token = localStorage.getItem('token');
let selectedDevice = null;
let reconnectInterval = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const devicesList = document.getElementById('devicesList');
const deviceSelect = document.getElementById('deviceSelect');
const statusIndicator = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');
const logElement = document.getElementById('log');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showMainApp();
    connectWebSocket();
  } else {
    showLogin();
  }

  loginForm.addEventListener('submit', handleLogin);
  deviceSelect.addEventListener('change', handleDeviceSelect);
});

// Login
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      token = data.token;
      localStorage.setItem('token', token);
      addLog('✅ Login exitoso');
      showMainApp();
      connectWebSocket();
    } else {
      alert('Credenciales inválidas');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Error al iniciar sesión');
  }
}

// Logout
function logout() {
  token = null;
  localStorage.removeItem('token');
  if (ws) {
    ws.close();
  }
  showLogin();
  addLog('🚪 Sesión cerrada');
}

// UI Management
function showLogin() {
  loginSection.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

function showMainApp() {
  loginSection.classList.add('hidden');
  mainApp.classList.remove('hidden');
}

// WebSocket Connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;

  addLog('🔌 Conectando a WebSocket...');
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    addLog('✅ WebSocket conectado');
    updateConnectionStatus(true);
    
    // Authenticate
    ws.send(JSON.stringify({
      type: 'auth',
      role: 'client',
      token: token
    }));

    // Clear reconnect interval if exists
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  ws.onclose = () => {
    addLog('❌ WebSocket desconectado');
    updateConnectionStatus(false);
    
    // Attempt to reconnect every 5 seconds
    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        addLog('🔄 Intentando reconectar...');
        connectWebSocket();
      }, 5000);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    addLog('❌ Error de conexión');
  };
}

// Handle WebSocket Messages
function handleWebSocketMessage(message) {
  console.log('Received:', message);

  switch (message.type) {
    case 'auth_success':
      addLog('✅ Autenticación exitosa');
      if (message.devices) {
        updateDevicesList(message.devices);
      }
      break;

    case 'device_online':
      addLog(`📱 Dispositivo ${message.deviceId} conectado`);
      addDeviceToList(message.deviceId);
      break;

    case 'device_offline':
      addLog(`📴 Dispositivo ${message.deviceId} desconectado`);
      removeDeviceFromList(message.deviceId);
      break;

    case 'sensor_update':
      addLog(`📊 Datos del sensor recibidos`);
      updateSensorData(message.data);
      break;

    case 'command_sent':
      if (message.success) {
        addLog(`✅ Comando enviado: ${message.action}`);
      }
      break;

    case 'error':
      addLog(`❌ Error: ${message.message}`);
      break;

    case 'pong':
      // Heartbeat response
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

// Update Devices List
function updateDevicesList(devices) {
  devicesList.innerHTML = '';
  deviceSelect.innerHTML = '<option value="">Selecciona un dispositivo</option>';

  if (devices.length === 0) {
    devicesList.innerHTML = '<p class="text-muted">No hay dispositivos conectados</p>';
    return;
  }

  devices.forEach(deviceId => {
    addDeviceToList(deviceId);
  });
}

function addDeviceToList(deviceId) {
  // Add to devices list display
  const existingDevice = document.querySelector(`[data-device-id="${deviceId}"]`);
  if (!existingDevice) {
    const deviceItem = document.createElement('div');
    deviceItem.className = 'device-item';
    deviceItem.dataset.deviceId = deviceId;
    deviceItem.innerHTML = `
      <span><strong>📱 ${deviceId}</strong></span>
      <span class="device-status online">Online</span>
    `;
    
    if (devicesList.querySelector('.text-muted')) {
      devicesList.innerHTML = '';
    }
    devicesList.appendChild(deviceItem);

    // Add to select
    const option = document.createElement('option');
    option.value = deviceId;
    option.textContent = deviceId;
    deviceSelect.appendChild(option);
  }
}

function removeDeviceFromList(deviceId) {
  const deviceItem = document.querySelector(`[data-device-id="${deviceId}"]`);
  if (deviceItem) {
    deviceItem.remove();
  }

  const option = deviceSelect.querySelector(`option[value="${deviceId}"]`);
  if (option) {
    option.remove();
  }

  if (devicesList.children.length === 0) {
    devicesList.innerHTML = '<p class="text-muted">No hay dispositivos conectados</p>';
  }
}

// Device Selection
function handleDeviceSelect(e) {
  selectedDevice = e.target.value;
  if (selectedDevice) {
    addLog(`📱 Dispositivo seleccionado: ${selectedDevice}`);
  }
}

// Send Command
function sendCommand(action, payload = {}) {
  if (!selectedDevice) {
    alert('Por favor selecciona un dispositivo');
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('WebSocket no conectado');
    return;
  }

  const command = {
    type: 'command',
    deviceId: selectedDevice,
    action: action,
    payload: payload
  };

  ws.send(JSON.stringify(command));
  addLog(`📤 Enviando comando: ${action}`);
}

// Update Sensor Data
function updateSensorData(data) {
  if (data.temperature !== undefined) {
    document.getElementById('temperature').textContent = `${data.temperature}°C`;
  }
  
  if (data.humidity !== undefined) {
    document.getElementById('humidity').textContent = `${data.humidity}%`;
  }

  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Connection Status
function updateConnectionStatus(connected) {
  if (connected) {
    statusIndicator.classList.add('connected');
    statusIndicator.classList.remove('disconnected');
    statusText.textContent = 'Conectado';
  } else {
    statusIndicator.classList.remove('connected');
    statusIndicator.classList.add('disconnected');
    statusText.textContent = 'Desconectado';
  }
}

// Logging
function addLog(message) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-time">[${time}]</span> ${message}
  `;
  
  logElement.insertBefore(entry, logElement.firstChild);
  
  // Keep only last 50 entries
  while (logElement.children.length > 50) {
    logElement.removeChild(logElement.lastChild);
  }
}

// Keep connection alive
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000); // Every 30 seconds

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
