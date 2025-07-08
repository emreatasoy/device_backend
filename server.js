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
const citiesFile = path.join(__dirname, 'cities.json');
const forcesFile = path.join(__dirname, 'forces.json');
const sitesFile = path.join(__dirname, 'sites.json');

function readDevices() {
  try {
    return JSON.parse(fs.readFileSync(devicesFile, 'utf-8'));
  } catch (e) {
    console.error('devices.json okunamadı veya bozuk:', e);
    return [];
  }
}

function readCities() {
  try {
    return JSON.parse(fs.readFileSync(citiesFile, 'utf-8'));
  } catch (e) {
    console.error('cities.json okunamadı veya bozuk:', e);
    return [];
  }
}

function readForces() {
  try {
    return JSON.parse(fs.readFileSync(forcesFile, 'utf-8'));
  } catch (e) {
    console.error('forces.json okunamadı veya bozuk:', e);
    return [];
  }
}

function readSites() {
  try {
    return JSON.parse(fs.readFileSync(sitesFile, 'utf-8'));
  } catch (e) {
    console.error('sites.json okunamadı veya bozuk:', e);
    return [];
  }
}

function writeDevices(devices) {
  fs.writeFileSync(devicesFile, JSON.stringify(devices, null, 2));
}

function writeCities(cities) {
  fs.writeFileSync(citiesFile, JSON.stringify(cities, null, 2));
}

function writeForces(forces) {
  fs.writeFileSync(forcesFile, JSON.stringify(forces, null, 2));
}

function writeSites(sites) {
  fs.writeFileSync(sitesFile, JSON.stringify(sites, null, 2));
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
  const forces = readForces();
  res.json(forces);
});

app.get('/sites', (req, res) => {
  const sites = readSites();
  res.json(sites);
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
  
  // Zorunlu alanları kontrol et
  if (!newDevice.model || typeof newDevice.model !== 'string' || newDevice.model.trim() === '') {
    return res.status(400).json({ error: 'Model alanı zorunludur ve boş olamaz.' });
  }
  
  if (!newDevice.force || typeof newDevice.force !== 'string' || newDevice.force.trim() === '') {
    return res.status(400).json({ error: 'Force alanı zorunludur ve boş olamaz.' });
  }
  
  if (!newDevice.city || typeof newDevice.city !== 'string' || newDevice.city.trim() === '') {
    return res.status(400).json({ error: 'City alanı zorunludur ve boş olamaz.' });
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
            <h3>📥 Mevcut Dosyaları İndir</h3>
            <button class="download-btn" onclick="downloadCurrentFile('devices')">devices.json İndir</button>
            <button class="download-btn" onclick="downloadCurrentFile('cities')">cities.json İndir</button>
            <button class="download-btn" onclick="downloadCurrentFile('forces')">forces.json İndir</button>
            <button class="download-btn" onclick="downloadCurrentFile('sites')">sites.json İndir</button>
        </div>

        <div class="section">
            <h3>📝 Dosya Düzenle</h3>
            <div>
                <button onclick="loadCurrentFile('devices')">devices.json Yükle</button>
                <button onclick="loadCurrentFile('cities')">cities.json Yükle</button>
                <button onclick="loadCurrentFile('forces')">forces.json Yükle</button>
                <button onclick="loadCurrentFile('sites')">sites.json Yükle</button>
            </div>
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

        let currentFileType = 'devices';

        async function downloadCurrentFile(fileType = 'devices') {
            try {
                const response = await fetch(\`/api/\${fileType}/download\`);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`\${fileType}.json\`;
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                showMessage('Dosya indirme hatası: ' + error.message, 'error');
            }
        }

        async function loadCurrentFile(fileType = 'devices') {
            try {
                currentFileType = fileType;
                const response = await fetch(\`/api/\${fileType}/download\`);
                const content = await response.text();
                document.getElementById('jsonEditor').value = content;
                showMessage(\`\${fileType}.json dosyası başarıyla yüklendi!\`, 'success');
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
                
                const response = await fetch(\`/api/\${currentFileType}/upload\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: content })
                });

                if (response.ok) {
                    showMessage(\`\${currentFileType}.json dosyası başarıyla kaydedildi!\`, 'success');
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
                html += '📁 Devices dosya boyutu: ' + status.devicesFileSize + ' bytes<br>';
                html += '📁 Cities dosya boyutu: ' + status.citiesFileSize + ' bytes<br>';
                html += '📁 Forces dosya boyutu: ' + status.forcesFileSize + ' bytes<br>';
                html += '📁 Sites dosya boyutu: ' + status.sitesFileSize + ' bytes<br>';
                html += '📊 Cihaz sayısı: ' + status.deviceCount + '<br>';
                html += '🏙️ Şehir sayısı: ' + status.cityCount + '<br>';
                html += '⚔️ Kuvvet sayısı: ' + status.forceCount + '<br>';
                html += '🏢 Site sayısı: ' + status.siteCount + '<br>';
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

app.get('/cities', (req, res) => {
  const cities = readCities();
  res.json(cities);
});

// Dosya yönetimi API endpoint'leri - Cities
app.get('/api/cities/download', (req, res) => {
  try {
    const content = fs.readFileSync(citiesFile, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cities.json"');
    res.send(content);
  } catch (e) {
    res.status(500).json({ error: 'Dosya okunamadı: ' + e.message });
  }
});

app.post('/api/cities/upload', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'İçerik boş olamaz' });
    }

    const parsedData = JSON.parse(content);
    fs.writeFileSync(citiesFile, JSON.stringify(parsedData, null, 2));
    
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

// Dosya yönetimi API endpoint'leri - Forces
app.get('/api/forces/download', (req, res) => {
  try {
    const content = fs.readFileSync(forcesFile, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="forces.json"');
    res.send(content);
  } catch (e) {
    res.status(500).json({ error: 'Dosya okunamadı: ' + e.message });
  }
});

app.post('/api/forces/upload', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'İçerik boş olamaz' });
    }

    const parsedData = JSON.parse(content);
    fs.writeFileSync(forcesFile, JSON.stringify(parsedData, null, 2));
    
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

// Dosya yönetimi API endpoint'leri - Sites
app.get('/api/sites/download', (req, res) => {
  try {
    const content = fs.readFileSync(sitesFile, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="sites.json"');
    res.send(content);
  } catch (e) {
    res.status(500).json({ error: 'Dosya okunamadı: ' + e.message });
  }
});

app.post('/api/sites/upload', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'İçerik boş olamaz' });
    }

    const parsedData = JSON.parse(content);
    fs.writeFileSync(sitesFile, JSON.stringify(parsedData, null, 2));
    
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
    const defaultDevices = [];

    fs.writeFileSync(devicesFile, JSON.stringify(defaultDevices, null, 2));
    
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
    const devicesStats = fs.statSync(devicesFile);
    const citiesStats = fs.statSync(citiesFile);
    const forcesStats = fs.statSync(forcesFile);
    const sitesStats = fs.statSync(sitesFile);
    
    const devices = readDevices();
    const cities = readCities();
    const forces = readForces();
    const sites = readSites();
    
    res.json({
      devicesFileSize: devicesStats.size,
      citiesFileSize: citiesStats.size,
      forcesFileSize: forcesStats.size,
      sitesFileSize: sitesStats.size,
      deviceCount: devices.length,
      cityCount: cities.length,
      forceCount: forces.length,
      siteCount: sites.length,
      websocketConnections: wss.clients.size,
      lastModified: devicesStats.mtime
    });
  } catch (e) {
    res.status(500).json({ error: 'Durum bilgisi alınamadı: ' + e.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`📁 Dosya yönetimi arayüzü: http://localhost:${PORT}/admin`);
}); 
