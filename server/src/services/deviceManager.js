// Servicio de gestión de dispositivos ESP32
// En una app real, conectarías esto a una base de datos

class DeviceManager {
  constructor() {
    this.devices = new Map();
  }

  registerDevice(deviceId, deviceInfo) {
    this.devices.set(deviceId, {
      id: deviceId,
      ...deviceInfo,
      registeredAt: Date.now(),
      lastSeen: Date.now()
    });
    
    console.log(`📱 Device registered: ${deviceId}`);
    return this.devices.get(deviceId);
  }

  updateDeviceStatus(deviceId, status) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = Date.now();
      device.status = status;
      this.devices.set(deviceId, device);
    }
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getAllDevices() {
    return Array.from(this.devices.values());
  }

  removeDevice(deviceId) {
    this.devices.delete(deviceId);
    console.log(`🗑️ Device removed: ${deviceId}`);
  }
}

module.exports = new DeviceManager();
