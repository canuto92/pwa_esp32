# Guía de Inicio Rápido

## 🚀 En 5 Minutos

### 1. Clonar Repositorio

```bash
git clone https://github.com/tuusuario/pwa_esp32.git
cd pwa_esp32
```

### 2. Configurar Servidor

```bash
cd server
npm install
cp .env.example .env
```

Edita `.env`:
```env
JWT_SECRET=tu-secret-aqui
DEVICE_SECRET=otro-secret-aqui
```

### 3. Ejecutar Servidor Localmente

```bash
npm start
```

Abre: `http://localhost:3000`

### 4. Configurar ESP32

Edita `esp32/src/config.h`:

```cpp
#define WS_HOST "localhost"  // o tu dominio Railway
#define WS_PORT 3000         // o 443 para Railway
#define USE_SSL false        // true para Railway
#define DEVICE_SECRET "mismo-del-servidor"
```

### 5. Subir a ESP32

```bash
cd esp32
pio run -t upload
pio device monitor
```

### 6. Probar

1. ESP32 arranca y busca WiFi
2. Si no tiene WiFi configurado, activa BLE
3. Usa nRF Connect para configurar WiFi
4. ESP32 se conecta al servidor
5. Abre PWA y controla el dispositivo

---

## 📱 Configurar WiFi via BLE

### Con nRF Connect (iOS/Android)

1. **Descargar app**: [nRF Connect](https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-mobile)

2. **Escanear y Conectar**:
   - Abre nRF Connect
   - Busca "ESP32_IoT"
   - Conectar

3. **Enviar Configuración**:
   - Busca servicio UUID: `4fafc201...`
   - Selecciona característica RX (write)
   - Escribe (JSON):

```json
{
  "command": "set_wifi",
  "ssid": "TuRedWiFi",
  "password": "TuContraseña"
}
```

4. **Verificar**:
   - ESP32 se conectará automáticamente
   - Verás en Serial Monitor: "WiFi Connected!"

---

## 🌐 Deploy a Railway

### Quick Deploy

```bash
cd server
npm install -g @railway/cli
railway login
railway init
railway up
```

### Configurar Variables

En Railway Dashboard → Variables:

```
NODE_ENV=production
JWT_SECRET=genera_uno_fuerte
DEVICE_SECRET=genera_otro_fuerte
ALLOWED_ORIGINS=https://tu-proyecto.up.railway.app
```

### Obtener URL

```bash
railway domain
```

Copia la URL y úsala en ESP32:

```cpp
#define WS_HOST "tu-proyecto.up.railway.app"
#define WS_PORT 443
#define USE_SSL true
```

---

## 🧪 Testing

### Test Local

```bash
# Terminal 1: Servidor
cd server
npm start

# Terminal 2: ESP32
cd esp32
pio device monitor

# Navegador: http://localhost:3000
```

### Test Comandos

En la PWA:
1. Login (user: cualquiera, pass: cualquiera)
2. Selecciona dispositivo ESP32_001
3. Click "Encender LED" → LED del ESP32 se enciende
4. Click "Estado" → Ves datos de temperatura y humedad

---

## 🐛 Troubleshooting

### ESP32 no conecta a WiFi

**Problema**: "WiFi Connection Failed!"

**Solución**:
1. Verifica SSID y contraseña en BLE
2. Asegúrate que la red sea 2.4GHz (ESP32 no soporta 5GHz)
3. Intenta con otra red

### ESP32 no conecta a WebSocket

**Problema**: "WebSocket Disconnected"

**Solución**:
1. Verifica `WS_HOST` en config.h
2. Verifica que `DEVICE_SECRET` coincida con servidor
3. Si usas Railway, debe ser WSS (puerto 443)
4. Revisa logs del servidor: `railway logs`

### PWA no carga

**Problema**: Error 404 o página en blanco

**Solución**:
1. Verifica que el servidor esté corriendo
2. Limpia caché del navegador
3. Abre DevTools → Console para ver errores
4. Verifica que `/public` tenga todos los archivos

### WebSocket no conecta desde PWA

**Problema**: "WebSocket error" en consola

**Solución**:
1. Verifica protocolo: `ws://` para local, `wss://` para producción
2. Revisa CORS en servidor
3. Abre DevTools → Network → WS para ver detalles

---

## 📖 Próximos Pasos

### Personalizar

1. **Cambiar credenciales**:
   - Genera JWT_SECRET y DEVICE_SECRET fuertes
   - Actualiza en servidor y ESP32

2. **Agregar sensores**:
   - Conecta DHT22, BME280, etc.
   - Lee valores en `sendSensorData()`
   - Actualiza payload JSON

3. **Agregar actuadores**:
   - Conecta relés, servos, etc.
   - Agrega casos en `handleWebSocketMessage()`
   - Crea botones en PWA

### Mejorar

1. **Base de datos**:
   - Agrega PostgreSQL o MongoDB
   - Guarda histórico de sensores
   - Implementa autenticación real

2. **Notificaciones**:
   - Configura Twilio para WhatsApp
   - Implementa Web Push
   - Agrega alertas automáticas

3. **UI/UX**:
   - Personaliza estilos CSS
   - Agrega gráficos con Chart.js
   - Implementa temas dark/light

---

## 🔗 Enlaces Útiles

- [Documentación Railway](https://docs.railway.app)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [nRF Connect](https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-mobile)

---

## 💡 Tips

- **Desarrollo**: Usa `nodemon` para auto-reload del servidor
- **Debugging**: Usa Serial Monitor para ESP32, DevTools para PWA
- **Seguridad**: Nunca commitees secrets en Git
- **Performance**: Ajusta `SENSOR_READ_INTERVAL` según necesites
- **Reliability**: Implementa manejo de errores robusto

---

## ❓ ¿Necesitas Ayuda?

1. Revisa la [documentación completa](./docs/)
2. Abre un [Issue en GitHub](https://github.com/tuusuario/pwa_esp32/issues)
3. Revisa logs: `railway logs` o Serial Monitor
