#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "config.h"

// Global objects
WebSocketsClient webSocket;
BLEServer* pServer = NULL;
BLECharacteristic* pTxCharacteristic;
bool deviceConnected = false;
bool bleConfigMode = false;

// WiFi credentials (will be set via BLE)
String wifiSSID = WIFI_SSID;
String wifiPassword = WIFI_PASSWORD;

// Timing
unsigned long lastSensorRead = 0;

// BLE Callbacks
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        Serial.println("BLE Client Connected");
    }

    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        Serial.println("BLE Client Disconnected");
        // Restart advertising
        BLEDevice::startAdvertising();
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string rxValue = pCharacteristic->getValue();
        
        if (rxValue.length() > 0) {
            Serial.print("Received via BLE: ");
            Serial.println(rxValue.c_str());
            
            // Parse JSON command
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, rxValue.c_str());
            
            if (!error) {
                const char* cmd = doc["command"];
                
                if (strcmp(cmd, "set_wifi") == 0) {
                    wifiSSID = doc["ssid"].as<String>();
                    wifiPassword = doc["password"].as<String>();
                    
                    Serial.println("WiFi credentials received");
                    
                    // Send confirmation
                    StaticJsonDocument<128> response;
                    response["status"] = "ok";
                    response["message"] = "WiFi configured";
                    
                    String output;
                    serializeJson(response, output);
                    pTxCharacteristic->setValue(output.c_str());
                    pTxCharacteristic->notify();
                    
                    // Exit BLE mode and connect to WiFi
                    bleConfigMode = false;
                    delay(1000);
                    connectWiFi();
                }
            }
        }
    }
};

void initBLE() {
    Serial.println("Initializing BLE...");
    
    BLEDevice::init(BLE_DEVICE_NAME);
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    
    BLEService *pService = pServer->createService(BLE_SERVICE_UUID);
    
    // TX Characteristic
    pTxCharacteristic = pService->createCharacteristic(
        BLE_CHAR_UUID_TX,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pTxCharacteristic->addDescriptor(new BLE2902());
    
    // RX Characteristic
    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
        BLE_CHAR_UUID_RX,
        BLECharacteristic::PROPERTY_WRITE
    );
    pRxCharacteristic->setCallbacks(new MyCallbacks());
    
    pService->start();
    
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    
    BLEDevice::startAdvertising();
    Serial.println("BLE started, waiting for connections...");
}

void connectWiFi() {
    if (wifiSSID.length() == 0) {
        Serial.println("WiFi credentials not set, entering BLE config mode");
        bleConfigMode = true;
        initBLE();
        return;
    }
    
    Serial.print("Connecting to WiFi: ");
    Serial.println(wifiSSID);
    
    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        connectWebSocket();
    } else {
        Serial.println("\nWiFi Connection Failed!");
        Serial.println("Entering BLE config mode");
        bleConfigMode = true;
        initBLE();
    }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("WebSocket Disconnected");
            break;
            
        case WStype_CONNECTED:
            Serial.println("WebSocket Connected");
            
            // Authenticate
            {
                StaticJsonDocument<256> doc;
                doc["type"] = "auth";
                doc["role"] = "device";
                doc["deviceId"] = DEVICE_ID;
                doc["token"] = DEVICE_SECRET;
                
                String output;
                serializeJson(doc, output);
                webSocket.sendTXT(output);
            }
            break;
            
        case WStype_TEXT:
            Serial.printf("Received: %s\n", payload);
            handleWebSocketMessage((char*)payload);
            break;
            
        case WStype_ERROR:
            Serial.println("WebSocket Error");
            break;
    }
}

void handleWebSocketMessage(char* payload) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
        return;
    }
    
    const char* type = doc["type"];
    
    if (strcmp(type, "auth_success") == 0) {
        Serial.println("Authentication successful!");
    }
    else if (strcmp(type, "command") == 0) {
        const char* action = doc["action"];
        Serial.print("Command received: ");
        Serial.println(action);
        
        if (strcmp(action, "LED_ON") == 0) {
            digitalWrite(LED_PIN, HIGH);
            Serial.println("LED turned ON");
        }
        else if (strcmp(action, "LED_OFF") == 0) {
            digitalWrite(LED_PIN, LOW);
            Serial.println("LED turned OFF");
        }
        else if (strcmp(action, "GET_STATUS") == 0) {
            sendSensorData();
        }
    }
}

void connectWebSocket() {
    Serial.println("Connecting to WebSocket...");
    
    #if USE_SSL
        webSocket.beginSSL(WS_HOST, WS_PORT, WS_PATH);
    #else
        webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
    #endif
    
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(RECONNECT_INTERVAL);
}

void sendSensorData() {
    // Read sensor (example: random values)
    float temperature = random(200, 300) / 10.0;
    float humidity = random(400, 800) / 10.0;
    
    StaticJsonDocument<256> doc;
    doc["type"] = "sensor_data";
    doc["payload"]["temperature"] = temperature;
    doc["payload"]["humidity"] = humidity;
    doc["payload"]["led_state"] = digitalRead(LED_PIN);
    
    String output;
    serializeJson(doc, output);
    
    Serial.print("Sending sensor data: ");
    Serial.println(output);
    
    webSocket.sendTXT(output);
}

void setup() {
    Serial.begin(115200);
    Serial.println("\n\nESP32 IoT Starting...");
    
    // Initialize LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    
    // Connect to WiFi
    connectWiFi();
}

void loop() {
    // BLE Mode
    if (bleConfigMode) {
        // Just wait for BLE configuration
        delay(100);
        return;
    }
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected, reconnecting...");
        connectWiFi();
        delay(5000);
        return;
    }
    
    // WebSocket loop
    webSocket.loop();
    
    // Send sensor data periodically
    if (millis() - lastSensorRead > SENSOR_READ_INTERVAL) {
        if (webSocket.isConnected()) {
            sendSensorData();
        }
        lastSensorRead = millis();
    }
}
