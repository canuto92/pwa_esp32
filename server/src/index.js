require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const { initWebSocket } = require('./websocket');
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');
const rateLimitMiddleware = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(compression());
app.use(express.json());
app.use(rateLimitMiddleware);

// Servir PWA
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

// Catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar WebSocket
initWebSocket(server);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 PWA available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
