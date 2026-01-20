#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration (se configurará vía BLE)
#define WIFI_SSID ""
#define WIFI_PASSWORD ""

// WebSocket Server Configuration
#define WS_HOST "your-project.up.railway.app"
#define WS_PORT 443
#define WS_PATH "/ws"
#define USE_SSL true

// Device Configuration
#define DEVICE_ID "ESP32_001"
#define DEVICE_SECRET "change-this-to-match-server-secret"

// BLE Configuration
#define BLE_DEVICE_NAME "ESP32_IoT"
#define BLE_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHAR_UUID_RX "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define BLE_CHAR_UUID_TX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// Pin Configuration
#define LED_PIN 2  // Built-in LED
#define SENSOR_PIN 34  // Analog sensor

// Timing Configuration
#define SENSOR_READ_INTERVAL 5000  // 5 seconds
#define RECONNECT_INTERVAL 5000    // 5 seconds

#endif
