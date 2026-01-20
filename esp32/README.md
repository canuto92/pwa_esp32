# ESP32 Firmware

Código para ESP32 con soporte BLE y WebSocket.

## Características

- ✅ Configuración WiFi vía Bluetooth Low Energy (BLE)
- ✅ Conexión WebSocket con SSL
- ✅ Control remoto de LED
- ✅ Envío de datos de sensores
- ✅ Reconexión automática

## Configuración

1. Edita `src/config.h`:
   - `WS_HOST`: Tu dominio de Railway
   - `DEVICE_SECRET`: Debe coincidir con el servidor
   - `DEVICE_ID`: ID único para tu ESP32

## Compilar y Subir

### Con PlatformIO CLI:

```bash
cd esp32
pio run -t upload
pio device monitor
```

### Con Arduino IDE:

1. Instala las librerías:
   - ArduinoJson
   - WebSockets by Markus Sattler

2. Copia el contenido de `src/` a tu sketch

3. Compila y sube

## Configurar WiFi vía BLE

### Con App nRF Connect (iOS/Android):

1. Descarga nRF Connect
2. Escanea y conecta a "ESP32_IoT"
3. Encuentra el servicio UUID: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
4. Escribe en la característica RX:

```json
{
  "command": "set_wifi",
  "ssid": "tu-red-wifi",
  "password": "tu-contraseña"
}
```

5. El ESP32 se conectará automáticamente

## Comandos Soportados

Desde el servidor vía WebSocket:

- `LED_ON`: Enciende el LED
- `LED_OFF`: Apaga el LED
- `GET_STATUS`: Solicita estado y datos de sensores

## Pinout

- LED: GPIO 2 (LED integrado)
- Sensor: GPIO 34 (ejemplo)

## Troubleshooting

### No se conecta a WiFi

- Verifica SSID y contraseña
- Revisa el monitor serial
- Usa BLE para reconfigurar

### No se conecta a WebSocket

- Verifica que WS_HOST sea correcto
- Comprueba que DEVICE_SECRET coincida con el servidor
- Revisa logs en Railway

### BLE no aparece

- Reinicia el ESP32
- Verifica que no esté conectado a WiFi (el BLE se activa si falla WiFi)
