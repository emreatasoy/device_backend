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

function readData() {
  try {
    return JSON.parse(fs.readFileSync(devicesFile, 'utf-8'));
  } catch (e) {
    console.error('devices.json okunamadı veya bozuk:', e);
    return { devices: [], cities: [], forces: [] }; // veya uygun bir boş obje
  }
}

function writeDevices(devices) {
  const data = readData();
  data.devices = devices;
  fs.writeFileSync(devicesFile, JSON.stringify(data, null, 2));
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

app.get('/forces', (req, res) => {
  const data = readData();
  res.json(data.forces);
});

app.get('/devices', (req, res) => {
  const data = readData();
  // Eğer data bir dizi ise (eski format), sadece devices kısmını döndür
  // Eğer data bir obje ise (yeni format), devices dizisini döndür
  if (Array.isArray(data)) {
    res.json(data);
  } else {
    res.json(data.devices || []);
  }
});

app.get('/devices/:serialNumber', (req, res) => {
  const devices = readData().devices.find(d => d.serialNumber === req.params.serialNumber);
  if (devices) {
    res.json(devices);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/devices', (req, res) => {
  const devices = readData().devices;
  const newDevice = req.body;
  if (!newDevice.model || typeof newDevice.model !== 'string' || newDevice.model.trim() === '') {
    return res.status(400).json({ error: 'Model alanı zorunludur ve boş olamaz.' });
  }
  if (devices.some(d => d.serialNumber === newDevice.serialNumber)) {
    return res.status(409).json({ error: 'Bu seri numarası ile tanımlı cihaz zaten var.' });
  }
  devices.push(newDevice);
  writeDevices(devices);
  broadcastDeviceUpdate(newDevice.serialNumber);
  res.status(201).json(newDevice);
});

app.put('/devices/:serialNumber', (req, res) => {
  const devices = readData().devices;
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
  const devices = readData().devices;
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
  const devices = readData().devices;
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
  const devices = readData().devices;
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

// Dosya yönetimi arayüzü
app.get('/admin', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Device Monitor - Dosya Yönetimi</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .section h3 { margin-top: 0; color: #555; }
        textarea { width: 100%; height: 300px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; border-radius: 4px; padding: 10px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        button.danger { background: #dc3545; }
        button.danger:hover { background: #c82333; }
        .success { color: green; background: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { color: red; background: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .download-btn { background: #28a745; }
        .download-btn:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Device Monitor - Dosya Yönetimi</h1>
        
        <div class="section">
            <h3>📥 Mevcut devices.json İndir</h3>
            <button class="download-btn" onclick="downloadCurrentFile()">Dosyayı İndir</button>
            <button onclick="loadCurrentFile()">Dosyayı Yükle ve Göster</button>
        </div>

        <div class="section">
            <h3>📝 devices.json Düzenle</h3>
            <div id="message"></div>
            <textarea id="jsonEditor" placeholder="JSON içeriğini buraya yapıştırın..."></textarea>
            <br>
            <button onclick="saveFile()">💾 Dosyayı Kaydet</button>
            <button class="danger" onclick="resetFile()">🔄 Varsayılan Dosyaya Döndür</button>
        </div>

        <div class="section">
            <h3>📊 Sistem Durumu</h3>
            <button onclick="checkSystemStatus()">Durumu Kontrol Et</button>
            <div id="statusInfo"></div>
        </div>
    </div>

    <script>
        function showMessage(text, type = 'info') {
            const msgDiv = document.getElementById('message');
            msgDiv.innerHTML = '<div class="' + type + '">' + text + '</div>';
            setTimeout(() => msgDiv.innerHTML = '', 5000);
        }

        async function downloadCurrentFile() {
            try {
                const response = await fetch('/api/devices/download');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'devices.json';
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                showMessage('Dosya indirme hatası: ' + error.message, 'error');
            }
        }

        async function loadCurrentFile() {
            try {
                const response = await fetch('/api/devices/download');
                const content = await response.text();
                document.getElementById('jsonEditor').value = content;
                showMessage('Dosya başarıyla yüklendi!', 'success');
            } catch (error) {
                showMessage('Dosya yükleme hatası: ' + error.message, 'error');
            }
        }

        async function saveFile() {
            const content = document.getElementById('jsonEditor').value;
            if (!content.trim()) {
                showMessage('Lütfen JSON içeriği girin!', 'error');
                return;
            }

            try {
                // JSON geçerliliğini kontrol et
                JSON.parse(content);
                
                const response = await fetch('/api/devices/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: content })
                });

                if (response.ok) {
                    showMessage('Dosya başarıyla kaydedildi!', 'success');
                } else {
                    const error = await response.text();
                    showMessage('Kaydetme hatası: ' + error, 'error');
                }
            } catch (error) {
                showMessage('JSON geçersiz veya kaydetme hatası: ' + error.message, 'error');
            }
        }

        async function resetFile() {
            if (!confirm('Varsayılan devices.json dosyasına döndürmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                return;
            }

            try {
                const response = await fetch('/api/devices/reset', { method: 'POST' });
                if (response.ok) {
                    showMessage('Dosya varsayılan haline döndürüldü!', 'success');
                    loadCurrentFile();
                } else {
                    const error = await response.text();
                    showMessage('Sıfırlama hatası: ' + error, 'error');
                }
            } catch (error) {
                showMessage('Sıfırlama hatası: ' + error.message, 'error');
            }
        }

        async function checkSystemStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                const statusDiv = document.getElementById('statusInfo');
                
                let html = '<div class="info">';
                html += '<strong>Sistem Durumu:</strong><br>';
                html += '✅ Sunucu çalışıyor<br>';
                html += '📁 Dosya boyutu: ' + status.fileSize + ' bytes<br>';
                html += '📊 Cihaz sayısı: ' + status.deviceCount + '<br>';
                html += '🏙️ Şehir sayısı: ' + status.cityCount + '<br>';
                html += '⚔️ Kuvvet sayısı: ' + status.forceCount + '<br>';
                html += '🔗 WebSocket bağlantıları: ' + status.websocketConnections + '<br>';
                html += '</div>';
                
                statusDiv.innerHTML = html;
            } catch (error) {
                showMessage('Durum kontrolü hatası: ' + error.message, 'error');
            }
        }

        // Sayfa yüklendiğinde mevcut dosyayı göster
        window.onload = function() {
            loadCurrentFile();
        };
    </script>
</body>
</html>`;
  res.send(html);
});

app.delete('/devices/:serialNumber/faults/:faultId', (req, res) => {
  const devices = readData().devices;
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

app.get('/cities', (req, res) => {
  const data = readData();
  res.json(data.cities);
});

// Dosya yönetimi API endpoint'leri
app.get('/api/devices/download', (req, res) => {
  try {
    const content = fs.readFileSync(devicesFile, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="devices.json"');
    res.send(content);
  } catch (e) {
    res.status(500).json({ error: 'Dosya okunamadı: ' + e.message });
  }
});

app.post('/api/devices/upload', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'İçerik boş olamaz' });
    }

    // JSON geçerliliğini kontrol et
    const parsedData = JSON.parse(content);
    
    // Gerekli alanların varlığını kontrol et
    if (!parsedData.cities || !parsedData.forces || !parsedData.devices) {
      return res.status(400).json({ error: 'JSON dosyası cities, forces ve devices alanlarını içermelidir' });
    }

    // Dosyayı kaydet
    fs.writeFileSync(devicesFile, JSON.stringify(parsedData, null, 2));
    
    // WebSocket ile güncelleme bildir
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.json({ message: 'Dosya başarıyla güncellendi' });
  } catch (e) {
    res.status(400).json({ error: 'Geçersiz JSON: ' + e.message });
  }
});

app.post('/api/devices/reset', (req, res) => {
  try {
    // Varsayılan devices.json içeriği
    const defaultData = {
      "cities": [
        {
          "id": "ankara",
          "name": "Ankara",
          "cityCenter": { "lat": 39.9334, "lng": 32.8597 }
        },
        {
          "id": "corum",
          "name": "Çorum",
          "cityCenter": { "lat": 40.5499, "lng": 34.9537 }
        }
      ],
      "forces": [
        {
          "id": "hava_kuvvetleri",
          "name": "Hava Kuvvetleri",
          "cityIds": ["ankara", "corum"]
        },
        {
          "id": "kara_kuvvetleri",
          "name": "Kara Kuvvetleri",
          "cityIds": ["ankara", "corum"]
        }
      ],
      "devices": []
    };

    fs.writeFileSync(devicesFile, JSON.stringify(defaultData, null, 2));
    
    // WebSocket ile güncelleme bildir
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.json({ message: 'Dosya varsayılan haline döndürüldü' });
  } catch (e) {
    res.status(500).json({ error: 'Sıfırlama hatası: ' + e.message });
  }
});

app.get('/api/status', (req, res) => {
  try {
    const stats = fs.statSync(devicesFile);
    const data = readData();
    
    res.json({
      fileSize: stats.size,
      deviceCount: data.devices ? data.devices.length : 0,
      cityCount: data.cities ? data.cities.length : 0,
      forceCount: data.forces ? data.forces.length : 0,
      websocketConnections: wss.clients.size,
      lastModified: stats.mtime
    });
  } catch (e) {
    res.status(500).json({ error: 'Durum bilgisi alınamadı: ' + e.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`📁 Dosya yönetimi arayüzü: http://localhost:${PORT}/admin`);
}); 
