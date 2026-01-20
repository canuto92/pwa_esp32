const express = require('express');
const router = express.Router();
const { getConnectedDevices, getConnectedClients } = require('../websocket');

router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime(),
    connections: {
      devices: getConnectedDevices().length,
      clients: getConnectedClients()
    }
  });
});

module.exports = router;
