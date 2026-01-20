const WebSocket = require('ws');
const { verifyToken } = require('./middleware/auth');

let wss;
const devices = new Map(); // deviceId -> WebSocket
const clients = new Map(); // clientId -> WebSocket

function initWebSocket(server) {
  wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
    
    let clientId = null;
    let deviceId = null;
    let isDevice = false;

    // Heartbeat para mantener conexión viva (importante en Railway)
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // Autenticación inicial
        if (data.type === 'auth') {
          if (data.role === 'device') {
            // Autenticar ESP32
            if (verifyDeviceToken(data.token)) {
              deviceId = data.deviceId;
              isDevice = true;
              devices.set(deviceId, ws);
              ws.send(JSON.stringify({ 
                type: 'auth_success', 
                role: 'device',
                deviceId: deviceId
              }));
              console.log(`✅ Device ${deviceId} authenticated`);
              
              // Notificar a todos los clientes
              broadcastToClients({
                type: 'device_online',
                deviceId: deviceId
              });
            } else {
              console.log('❌ Device authentication failed');
              ws.close(1008, 'Authentication failed');
            }
          } else {
            // Autenticar cliente (PWA)
            const user = await verifyToken(data.token);
            if (user) {
              clientId = user.id;
              clients.set(clientId, ws);
              ws.send(JSON.stringify({ 
                type: 'auth_success', 
                role: 'client',
                userId: clientId,
                devices: Array.from(devices.keys())
              }));
              console.log(`✅ Client ${clientId} authenticated`);
            } else {
              console.log('❌ Client authentication failed');
              ws.close(1008, 'Authentication failed');
            }
          }
          return;
        }

        // Mensajes de dispositivo → cliente
        if (isDevice && data.type === 'sensor_data') {
          console.log(`📊 Sensor data from ${deviceId}:`, data.payload);
          broadcastToClients({
            type: 'sensor_update',
            deviceId: deviceId,
            data: data.payload,
            timestamp: Date.now()
          });
        }

        // Mensajes de cliente → dispositivo
        if (!isDevice && data.type === 'command') {
          const targetDevice = devices.get(data.deviceId);
          if (targetDevice && targetDevice.readyState === WebSocket.OPEN) {
            console.log(`📤 Sending command to ${data.deviceId}:`, data.action);
            targetDevice.send(JSON.stringify({
              type: 'command',
              action: data.action,
              payload: data.payload
            }));
            ws.send(JSON.stringify({ 
              type: 'command_sent', 
              success: true,
              deviceId: data.deviceId,
              action: data.action
            }));
          } else {
            console.log(`❌ Device ${data.deviceId} not connected`);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Device not connected',
              deviceId: data.deviceId
            }));
          }
        }

        // Ping/Pong para mantener conexión
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }

      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      if (isDevice && deviceId) {
        devices.delete(deviceId);
        console.log(`❌ Device ${deviceId} disconnected`);
        broadcastToClients({ 
          type: 'device_offline', 
          deviceId 
        });
      } else if (clientId) {
        clients.delete(clientId);
        console.log(`❌ Client ${clientId} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Ping interval para mantener conexiones vivas (importante en Railway)
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log('Terminating inactive connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Cada 30 segundos

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log('✅ WebSocket server initialized');
}

function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;
  
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
      sentCount++;
    }
  });
  
  if (sentCount > 0) {
    console.log(`📢 Broadcast to ${sentCount} client(s):`, message.type);
  }
}

function verifyDeviceToken(token) {
  // Implementa validación del token del ESP32
  const validToken = token === process.env.DEVICE_SECRET;
  if (!validToken) {
    console.log('Invalid device token received');
  }
  return validToken;
}

function getConnectedDevices() {
  return Array.from(devices.keys());
}

function getConnectedClients() {
  return clients.size;
}

module.exports = { 
  initWebSocket,
  getConnectedDevices,
  getConnectedClients
};
