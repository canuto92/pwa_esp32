const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');
const { getConnectedDevices } = require('../websocket');

// Ruta de login (demo - implementa tu lógica real)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // DEMO: Implementa autenticación real aquí
  if (username && password) {
    const token = jwt.sign(
      { id: username, username: username },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      token,
      user: { id: username, username }
    });
  } else {
    res.status(401).json({ 
      success: false,
      message: 'Invalid credentials' 
    });
  }
});

// Obtener dispositivos conectados
router.get('/devices', authMiddleware, (req, res) => {
  const devices = getConnectedDevices();
  res.json({ 
    success: true,
    devices: devices.map(id => ({
      id,
      status: 'online',
      lastSeen: Date.now()
    }))
  });
});

// Registrar nuevo dispositivo
router.post('/devices/register', authMiddleware, (req, res) => {
  const { deviceId, name } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ 
      success: false,
      message: 'deviceId is required' 
    });
  }
  
  // Aquí guardarías en una base de datos
  res.json({ 
    success: true,
    device: {
      id: deviceId,
      name: name || `Device ${deviceId}`,
      token: process.env.DEVICE_SECRET
    }
  });
});

// Endpoint para notificaciones (webhook)
router.post('/notify', (req, res) => {
  const { deviceId, message, type } = req.body;
  
  console.log(`📬 Notification from ${deviceId}:`, message);
  
  // Aquí implementarías envío de notificaciones push o WhatsApp
  
  res.json({ 
    success: true,
    message: 'Notification received'
  });
});

module.exports = router;
