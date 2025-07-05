const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

const devicesFile = path.join(__dirname, 'devices.json');

function readDevices() {
  return JSON.parse(fs.readFileSync(devicesFile, 'utf-8'));
}
function writeDevices(devices) {
  fs.writeFileSync(devicesFile, JSON.stringify(devices, null, 2));
}

app.use(cors());
app.use(express.json());

// WebSocket bağlantılarını saklas
wss.on('connection', function connection(ws) {
  console.log('Bir istemci WebSocket ile bağlandı');
});

// Bir cihaz güncellendiğinde sadece o cihazın id'sini yayınla
function broadcastDeviceUpdate(deviceSerialNumber) {
  console.log('WebSocket event gönderiliyor:', deviceSerialNumber);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'device_update', deviceSerialNumber }));
    }
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Device Monitoring API is running!' });
});

app.get('/devices', (req, res) => {
  const devices = readDevices();
  res.json(devices);
});

app.get('/devices/:serialNumber', (req, res) => {
  const devices = readDevices();
  const device = devices.find(d => d.serialNumber === req.params.serialNumber);
  if (device) {
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/devices', (req, res) => {
  const devices = readDevices();
  const newDevice = req.body;
  if (devices.some(d => d.serialNumber === newDevice.serialNumber)) {
    return res.status(409).json({ error: 'Bu seri numarası ile tanımlı cihaz zaten var.' });
  }
  devices.push(newDevice);
  writeDevices(devices);
  broadcastDeviceUpdate(newDevice.serialNumber);
  res.status(201).json(newDevice);
});

app.put('/devices/:serialNumber', (req, res) => {
  const devices = readDevices();
  const index = devices.findIndex(d => d.serialNumber === req.params.serialNumber);
  if (index !== -1) {
    devices[index] = { ...devices[index], ...req.body };
    writeDevices(devices);
    res.json(devices[index]);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.delete('/devices/:serialNumber', (req, res) => {
  const devices = readDevices();
  const index = devices.findIndex(d => d.serialNumber === req.params.serialNumber);
  if (index !== -1) {
    const deletedDevice = devices[index];
    devices.splice(index, 1);
    writeDevices(devices);
    broadcastDeviceUpdate(deletedDevice.serialNumber);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

// Fault management endpoints
app.post('/devices/:serialNumber/faults', (req, res) => {
  const devices = readDevices();
  const device = devices.find(d => d.serialNumber === req.params.serialNumber);
  if (device) {
    const newFault = {
      id: `fault_${Date.now()}`,
      ...req.body,
      timestamp: new Date().toISOString(),
      isResolved: false
    };
    device.faults.push(newFault);
    device.hasFault = true;
    writeDevices(devices);
    res.status(201).json(newFault);
    broadcastDeviceUpdate(device.serialNumber);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.put('/devices/:serialNumber/faults/:faultId', (req, res) => {
  const devices = readDevices();
  const device = devices.find(d => d.serialNumber === req.params.serialNumber);
  if (device) {
    const fault = device.faults.find(f => f.id === req.params.faultId);
    if (fault) {
      Object.assign(fault, req.body);
      device.hasFault = device.faults.some(f => !f.isResolved);
      writeDevices(devices);
      res.json(fault);
      broadcastDeviceUpdate(device.serialNumber);
    } else {
      res.status(404).json({ error: 'Fault not found' });
    }
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.delete('/devices/:serialNumber/faults/:faultId', (req, res) => {
  const devices = readDevices();
  const device = devices.find(d => d.serialNumber === req.params.serialNumber);
  if (device) {
    const faultIndex = device.faults.findIndex(f => f.id === req.params.faultId);
    if (faultIndex !== -1) {
      device.faults.splice(faultIndex, 1);
      device.hasFault = device.faults.some(f => !f.isResolved);
      writeDevices(devices);
      res.status(204).send();
      broadcastDeviceUpdate(device.serialNumber);
    } else {
      res.status(404).json({ error: 'Fault not found' });
    }
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
