const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dummy data - Ankara ve Çorum için 5'er radar ve 5'er jammer
const devices = [
  // Ankara Radarlar
  {
    id: 'radar_ankara_1',
    type: 'radar',
    serialNumber: 'RAD-001',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9334, lng: 32.8597 },
    hasFault: true,
    faults: [
      {
        id: 'fault_radar_1_1',
        title: 'Slip Ring Arızası',
        description: 'Slip ring bileşeninde aşınma tespit edildi',
        severity: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isResolved: false
      },
      {
        id: 'fault_radar_1_2',
        title: 'Sıcaklık Uyarısı',
        description: 'Motor sıcaklığı normal değerlerin üzerinde',
        severity: 'medium',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        isResolved: false
      }
    ]
  },
  {
    id: 'radar_ankara_2',
    type: 'radar',
    serialNumber: 'RAD-002',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9208, lng: 32.8541 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_ankara_3',
    type: 'radar',
    serialNumber: 'RAD-003',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9454, lng: 32.8597 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_ankara_4',
    type: 'radar',
    serialNumber: 'RAD-004',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9208, lng: 32.8700 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_ankara_5',
    type: 'radar',
    serialNumber: 'RAD-005',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9454, lng: 32.8700 },
    hasFault: false,
    faults: []
  },
  
  // Ankara Jammerlar
  {
    id: 'jammer_ankara_1',
    type: 'jammer',
    serialNumber: 'JAM-001',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9334, lng: 32.8497 },
    hasFault: true,
    faults: [
      {
        id: 'fault_jammer_1_1',
        title: 'Güç Kaynağı Sorunu',
        description: 'Güç kaynağı voltajı düşük seviyede',
        severity: 'high',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isResolved: false
      },
      {
        id: 'fault_jammer_1_2',
        title: 'Anten Bağlantı Hatası',
        description: 'Anten kablosu gevşek bağlantı',
        severity: 'medium',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isResolved: false
      }
    ]
  },
  {
    id: 'jammer_ankara_2',
    type: 'jammer',
    serialNumber: 'JAM-002',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9208, lng: 32.8441 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_ankara_3',
    type: 'jammer',
    serialNumber: 'JAM-003',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9454, lng: 32.8497 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_ankara_4',
    type: 'jammer',
    serialNumber: 'JAM-004',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9208, lng: 32.8600 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_ankara_5',
    type: 'jammer',
    serialNumber: 'JAM-005',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    position: { lat: 39.9454, lng: 32.8600 },
    hasFault: false,
    faults: []
  },
  
  // Çorum Radarlar
  {
    id: 'radar_corum_1',
    type: 'radar',
    serialNumber: 'RAD-006',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5499, lng: 34.9537 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_corum_2',
    type: 'radar',
    serialNumber: 'RAD-007',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5400, lng: 34.9437 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_corum_3',
    type: 'radar',
    serialNumber: 'RAD-008',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5599, lng: 34.9637 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_corum_4',
    type: 'radar',
    serialNumber: 'RAD-009',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5400, lng: 34.9537 },
    hasFault: false,
    faults: []
  },
  {
    id: 'radar_corum_5',
    type: 'radar',
    serialNumber: 'RAD-010',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5599, lng: 34.9437 },
    hasFault: false,
    faults: []
  },
  
  // Çorum Jammerlar
  {
    id: 'jammer_corum_1',
    type: 'jammer',
    serialNumber: 'JAM-006',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5499, lng: 34.9437 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_corum_2',
    type: 'jammer',
    serialNumber: 'JAM-007',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5400, lng: 34.9337 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_corum_3',
    type: 'jammer',
    serialNumber: 'JAM-008',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5599, lng: 34.9537 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_corum_4',
    type: 'jammer',
    serialNumber: 'JAM-009',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5400, lng: 34.9437 },
    hasFault: false,
    faults: []
  },
  {
    id: 'jammer_corum_5',
    type: 'jammer',
    serialNumber: 'JAM-010',
    city: 'Çorum',
    site: 'Çorum-Tabur-1',
    position: { lat: 40.5599, lng: 34.9337 },
    hasFault: false,
    faults: []
  }
];

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Device Monitoring API is running!' });
});

app.get('/devices', (req, res) => {
  res.json(devices);
});

app.get('/devices/:id', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (device) {
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/devices', (req, res) => {
  const newDevice = {
    id: `device_${Date.now()}`,
    ...req.body
  };
  devices.push(newDevice);
  res.status(201).json(newDevice);
});

app.put('/devices/:id', (req, res) => {
  const index = devices.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    devices[index] = { ...devices[index], ...req.body };
    res.json(devices[index]);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.delete('/devices/:id', (req, res) => {
  const index = devices.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    devices.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

// Fault management endpoints
app.post('/devices/:id/faults', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (device) {
    const newFault = {
      id: `fault_${Date.now()}`,
      ...req.body,
      timestamp: new Date().toISOString(),
      isResolved: false
    };
    device.faults.push(newFault);
    device.hasFault = true;
    res.status(201).json(newFault);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.put('/devices/:id/faults/:faultId', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (device) {
    const fault = device.faults.find(f => f.id === req.params.faultId);
    if (fault) {
      Object.assign(fault, req.body);
      device.hasFault = device.faults.some(f => !f.isResolved);
      res.json(fault);
    } else {
      res.status(404).json({ error: 'Fault not found' });
    }
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 