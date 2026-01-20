# Arquitectura del Sistema

## Diagrama General

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │   BLE   │              │  WiFi   │             │
│  Teléfono   │◄───────►│    ESP32     │◄───────►│   Router    │
│             │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                        │
                               │                        │
                               │    WebSocket (WSS)     │
                               │                        │
                               ▼                        ▼
                        ┌──────────────────────────────────┐
                        │                                  │
                        │     Railway (Node.js Server)     │
                        │                                  │
                        │  ┌────────────┐  ┌────────────┐ │
                        │  │ WebSocket  │  │    PWA     │ │
                        │  │  Handler   │  │  (Static)  │ │
                        │  └────────────┘  └────────────┘ │
                        │                                  │
                        └──────────────────────────────────┘
                                       │
                                       │ HTTPS
                                       ▼
                            ┌─────────────────────┐
                            │                     │
                            │  PWA (Navegador)    │
                            │  iOS/Android/PC     │
                            │                     │
                            └─────────────────────┘
```

## Flujo de Configuración Inicial

1. **ESP32 arranca sin WiFi configurado**
   - Activa modo BLE
   - Espera conexión

2. **Usuario conecta vía Teléfono**
   - Abre app BLE (nRF Connect)
   - Conecta a "ESP32_IoT"
   - Envía credenciales WiFi

3. **ESP32 recibe credenciales**
   - Desactiva BLE
   - Conecta a WiFi
   - Conecta a servidor WebSocket

## Flujo de Comunicación Normal

### ESP32 → Servidor

```
ESP32: {"type": "auth", "role": "device", "deviceId": "ESP32_001", "token": "secret"}
Server: {"type": "auth_success", "role": "device"}

[Cada 5 segundos]
ESP32: {"type": "sensor_data", "payload": {"temperature": 25.3, "humidity": 60.5}}
Server: [Broadcast to clients]
```

### Cliente PWA → ESP32

```
Client: {"type": "command", "deviceId": "ESP32_001", "action": "LED_ON"}
Server: [Forward to ESP32]
ESP32: [Ejecuta comando]
Server: {"type": "command_sent", "success": true}
```

## Componentes del Sistema

### 1. ESP32 (Firmware C++)

**Responsabilidades:**
- Gestión de BLE para configuración
- Conexión WiFi
- Cliente WebSocket
- Control de hardware (LEDs, sensores)
- Envío periódico de datos

**Librerías:**
- `WiFi.h`: Conexión WiFi
- `WebSocketsClient.h`: Cliente WebSocket
- `ArduinoJson.h`: Serialización JSON
- `BLEDevice.h`: Bluetooth Low Energy

### 2. Servidor Node.js (Railway)

**Responsabilidades:**
- Servidor HTTP/HTTPS para PWA
- Servidor WebSocket
- Autenticación JWT
- Routing de mensajes
- Rate limiting
- Gestión de conexiones

**Estructura:**
```
server/
├── src/
│   ├── index.js           # Entry point, Express setup
│   ├── websocket.js       # WebSocket logic
│   ├── routes/
│   │   ├── api.js        # REST endpoints
│   │   └── health.js     # Health check
│   ├── middleware/
│   │   ├── auth.js       # JWT authentication
│   │   └── rateLimit.js  # Rate limiting
│   └── services/
│       ├── deviceManager.js   # Device management
│       └── notifications.js   # Push/WhatsApp
└── public/               # PWA static files
```

### 3. PWA (Progressive Web App)

**Responsabilidades:**
- UI para control de dispositivos
- Cliente WebSocket
- Gestión de estado
- Service Worker para offline
- Notificaciones push

**Archivos:**
```
public/
├── index.html        # UI principal
├── manifest.json     # PWA manifest
├── sw.js            # Service Worker
├── css/
│   └── styles.css   # Estilos
└── js/
    └── app.js       # Lógica de aplicación
```

## Protocolos de Comunicación

### WebSocket Protocol

Todos los mensajes son JSON con estructura:

```json
{
  "type": "message_type",
  "payload": { ... }
}
```

**Tipos de mensaje:**

#### Autenticación
```json
{
  "type": "auth",
  "role": "device|client",
  "token": "jwt_or_device_secret",
  "deviceId": "ESP32_001"  // Solo para devices
}
```

#### Datos de Sensores
```json
{
  "type": "sensor_data",
  "payload": {
    "temperature": 25.3,
    "humidity": 60.5,
    "led_state": true
  }
}
```

#### Comandos
```json
{
  "type": "command",
  "deviceId": "ESP32_001",
  "action": "LED_ON|LED_OFF|GET_STATUS",
  "payload": {}
}
```

#### Heartbeat
```json
{
  "type": "ping"
}
```

### BLE Protocol

UUID de servicio: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`

**Características:**
- RX (write): `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
- TX (notify): `6e400003-b5a3-f393-e0a9-e50e24dcca9e`

**Comando WiFi:**
```json
{
  "command": "set_wifi",
  "ssid": "Mi_Red",
  "password": "contraseña"
}
```

## Seguridad

### 1. Transporte
- HTTPS/WSS en producción (Railway)
- Certificados SSL automáticos

### 2. Autenticación
- JWT para clientes PWA
- Secret compartido para ESP32
- Tokens en headers/mensajes WebSocket

### 3. Autorización
- Rate limiting (100 req/15min)
- CORS configurado
- Helmet.js para headers de seguridad

### 4. Validación
- JSON schema validation
- Sanitización de inputs
- Timeout en conexiones

## Escalabilidad

### Horizontal Scaling

Para múltiples instancias del servidor:

1. **Redis para pub/sub**
   ```javascript
   // WebSocket broadcasts via Redis
   redis.publish('device_updates', message);
   ```

2. **Load Balancer**
   - Railway Pro soporta múltiples replicas
   - Sticky sessions para WebSocket

### Base de Datos

Para persistencia (opcional):

```
PostgreSQL/MongoDB
├── users
├── devices
├── sensor_history
└── notifications
```

## Monitoreo

### Métricas Clave

1. **Server Health**
   - Uptime
   - Memory/CPU usage
   - Active connections

2. **WebSocket**
   - Connected devices
   - Connected clients
   - Message throughput

3. **Errors**
   - Connection failures
   - Authentication failures
   - Message parse errors

### Logs

Estructura de logs:
```
[timestamp] [level] [component] message
```

Ejemplo:
```
[2025-01-19T10:30:00Z] [INFO] [WebSocket] Device ESP32_001 connected
[2025-01-19T10:30:05Z] [ERROR] [Auth] Invalid token from 192.168.1.100
```

## Extensiones Futuras

### 1. Base de Datos
- PostgreSQL para persistencia
- Histórico de sensores
- Gestión de usuarios

### 2. Notificaciones
- Web Push API
- WhatsApp via Twilio
- Email alerts

### 3. Múltiples Dispositivos
- Grupos de dispositivos
- Escenas/automatizaciones
- Scheduling

### 4. Analytics
- Grafana dashboard
- Prometheus metrics
- Alerting rules

### 5. Mobile Apps
- React Native
- Flutter
- Expo

## Consideraciones de Producción

### Performance
- WebSocket connection pooling
- Message batching
- Compression

### Reliability
- Reconnection logic (ESP32 y PWA)
- Message queue para offline
- Health checks

### Maintenance
- Rolling updates
- Blue-green deployment
- Backup strategy
