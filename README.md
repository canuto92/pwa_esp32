<<<<<<< HEAD
# 🌐 PWA + ESP32 IoT Project

Sistema IoT completo con ESP32, PWA instalable y servidor Node.js en Railway.

## 📋 Stack Tecnológico

- **Hardware**: ESP32 (Arduino/PlatformIO)
- **Conectividad**: Bluetooth Low Energy (BLE) + WiFi
- **Frontend**: PWA instalable (Vanilla JS)
- **Backend**: Node.js + Express + WebSocket
- **Deploy**: Railway (plan gratuito)

## 🏗️ Arquitectura

```
ESP32 → (BLE) → PWA configura WiFi → ESP32 conecta a cloud → WebSocket ↔ Control remoto
```

## ✨ Features

- ✅ Configuración WiFi vía Bluetooth (iOS + Android)
- ✅ WebSocket para control en tiempo real
- ✅ PWA instalable sin tiendas de apps
- ✅ Push notifications (Android full, iOS limitado)
- ✅ Alternativa WhatsApp con Twilio para alertas
- ✅ Seguridad: HTTPS, JWT, rate limiting
- ✅ Deployment sencillo en Railway

## 🚀 Quick Start

### 1. Servidor (Railway)

```bash
cd server
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm start
```

### 2. ESP32

```bash
cd esp32
# Abre con Arduino IDE o PlatformIO
# Configura WiFi credentials en config.h
# Sube el código al ESP32
```

### 3. PWA

La PWA se sirve automáticamente desde el servidor en `/` y es instalable desde el navegador.

## 📦 Estructura del Proyecto

```
pwa_esp32/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.js       # Entry point
│   │   ├── websocket.js   # WebSocket logic
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, rate limit
│   │   └── services/      # Business logic
│   ├── public/            # PWA estática
│   └── package.json
├── esp32/                 # Código Arduino/PlatformIO
│   ├── src/
│   └── platformio.ini
├── docs/                  # Documentación
└── README.md
```

## 🔧 Deployment en Railway

1. Crea cuenta en [Railway](https://railway.app)
2. Instala Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   ```
3. Deploy:
   ```bash
   cd server
   railway init
   railway up
   ```
4. Configura variables de entorno en el dashboard
5. Obtén tu URL: `railway domain`

## 🔐 Seguridad

- HTTPS obligatorio en producción
- JWT para autenticación
- Rate limiting en API
- Validación de tokens en WebSocket
- CORS configurado
- Helmet.js para headers de seguridad

## 📱 Instalación PWA

1. Abre la URL en Chrome/Safari
2. Toca el botón "Compartir" (iOS) o menú (Android)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo! Ahora funciona como app nativa

## 🔌 Conexión ESP32

El ESP32 se conecta vía WebSocket a Railway usando SSL:

```cpp
wss://tu-proyecto.up.railway.app/ws
```

## 📄 Licencia

MIT

## 👨‍💻 Autor

Tu nombre aquí

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un issue o PR.
=======
# pwa_esp32
manejo en ppwa un esp32
>>>>>>> 216faf499263c47d560c25223d95f22e430f365c
