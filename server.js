const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dummy data
let devices = [
  {
    id: 'radar_ankara_1',
    type: 'radar',
    serialNumber: 'RAD-001',
    city: 'Ankara',
    site: 'Ankara-Kolordu-1',
    hasFault: true,
    faults: [
      {
        id: 'fault_radar_1_1',
        title: 'Slip Ring Arızası',
        description: 'Slip ring bileşeninde aşınma tespit edildi',
        severity: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isResolved: false,
      },
      {
        id: 'fault_radar_1_2',
        title: 'Sıcaklık Uyarısı',
        description: 'Motor sıcaklığı normal değerlerin üzerinde',
        severity: 'medium',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        isResolved: false,
      },
    ],
    position: { lat: 39.9334, lng: 32.8597 },
  },
  // ... diğer cihazlar (aynı Flutter dummy verisi gibi eklenebilir)
];

// Tüm cihazları getir
app.get('/devices', (req, res) => {
  res.json(devices);
});

// Cihaza arıza ekle
app.post('/devices/:id/faults', (req, res) => {
  const device = devices.find((d) => d.id === req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const fault = req.body;
  device.faults.push(fault);
  device.hasFault = true;
  res.json(device);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});