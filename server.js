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

// Koşullu logging utility
const isDevelopment = process.env.NODE_ENV !== 'production';
const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  success: (message, ...args) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  warning: (message, ...args) => {
    if (isDevelopment) {
      console.log(`⚠️ ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.log(`❌ ${message}`, ...args); // Hatalar her zaman loglanır
  },
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`🐛 ${message}`, ...args);
    }
  },
  websocket: (message, ...args) => {
    if (isDevelopment) {
      console.log(`🔌 ${message}`, ...args);
    }
  },
  api: (message, ...args) => {
    if (isDevelopment) {
      console.log(`🌐 ${message}`, ...args);
    }
  },
  file: (message, ...args) => {
    if (isDevelopment) {
      console.log(`📁 ${message}`, ...args);
    }
  }
};

const devicesFile = path.join(__dirname, 'devices.json');
const citiesFile = path.join(__dirname, 'cities.json');
const forcesFile = path.join(__dirname, 'forces.json');
const sitesFile = path.join(__dirname, 'sites.json');
const deviceTypesFile = path.join(__dirname, 'device_types.json');

// Dosya yollarını logla
logger.file('Dosya yolları:');
logger.file('   - Devices:', devicesFile);
logger.file('   - Cities:', citiesFile);
logger.file('   - Forces:', forcesFile);
logger.file('   - Sites:', sitesFile);
logger.file('   - DeviceTypes:', deviceTypesFile);

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
    logger.file('Cities dosyası okunuyor:', citiesFile);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(citiesFile)) {
      logger.warning('Cities dosyası bulunamadı, boş array döndürülüyor');
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(citiesFile, 'utf-8'));
    logger.success('Cities dosyası okundu, veri sayısı:', data.length);
    return data;
  } catch (e) {
    logger.error('cities.json okunamadı veya bozuk:', e);
    return [];
  }
}

function readForces() {
  try {
    console.log('📖 Forces dosyası okunuyor:', forcesFile);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(forcesFile)) {
      console.log('⚠️ Forces dosyası bulunamadı, boş array döndürülüyor');
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(forcesFile, 'utf-8'));
    console.log('✅ Forces dosyası okundu, veri sayısı:', data.length);
    return data;
  } catch (e) {
    console.error('❌ forces.json okunamadı veya bozuk:', e);
    return [];
  }
}

function readSites() {
  try {
    console.log('📖 Sites dosyası okunuyor:', sitesFile);
    const data = JSON.parse(fs.readFileSync(sitesFile, 'utf-8'));
    console.log('✅ Sites dosyası okundu, veri sayısı:', data.length);
    return data;
  } catch (e) {
    console.error('❌ sites.json okunamadı veya bozuk:', e);
    return [];
  }
}

function readDeviceTypes() {
  try {
    return JSON.parse(fs.readFileSync(deviceTypesFile, 'utf-8'));
  } catch (e) {
    console.error('device_types.json okunamadı veya bozuk:', e);
    return [];
  }
}

function writeDevices(devices) {
  fs.writeFileSync(devicesFile, JSON.stringify(devices, null, 2));
}

function writeCities(cities) {
  try {
    console.log('💾 Cities dosyası yazılıyor:', citiesFile);
    console.log('📝 Yazılacak veri:', JSON.stringify(cities, null, 2));
    
    // Dosya yazma izinlerini kontrol et
    const dir = path.dirname(citiesFile);
    if (!fs.existsSync(dir)) {
      console.log('📁 Dizin oluşturuluyor:', dir);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(citiesFile, JSON.stringify(cities, null, 2));
    console.log('✅ Cities dosyası başarıyla yazıldı');
    
    // Dosyanın gerçekten yazıldığını kontrol et
    if (fs.existsSync(citiesFile)) {
      const stats = fs.statSync(citiesFile);
      console.log('📊 Dosya boyutu:', stats.size, 'bytes');
    }
  } catch (e) {
    console.error('❌ Cities dosyası yazma hatası:', e);
    throw e;
  }
}

function writeForces(forces) {
  try {
    console.log('💾 Forces dosyası yazılıyor:', forcesFile);
    console.log('📝 Yazılacak veri:', JSON.stringify(forces, null, 2));
    
    // Dosya yazma izinlerini kontrol et
    const dir = path.dirname(forcesFile);
    if (!fs.existsSync(dir)) {
      console.log('📁 Dizin oluşturuluyor:', dir);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(forcesFile, JSON.stringify(forces, null, 2));
    console.log('✅ Forces dosyası başarıyla yazıldı');
    
    // Dosyanın gerçekten yazıldığını kontrol et
    if (fs.existsSync(forcesFile)) {
      const stats = fs.statSync(forcesFile);
      console.log('📊 Dosya boyutu:', stats.size, 'bytes');
    }
  } catch (e) {
    console.error('❌ Forces dosyası yazma hatası:', e);
    throw e;
  }
}

function writeSites(sites) {
  try {
    console.log('💾 Sites dosyası yazılıyor:', sitesFile);
    console.log('📝 Yazılacak veri:', JSON.stringify(sites, null, 2));
    fs.writeFileSync(sitesFile, JSON.stringify(sites, null, 2));
    console.log('✅ Sites dosyası başarıyla yazıldı');
  } catch (e) {
    console.error('❌ Sites dosyası yazma hatası:', e);
    throw e;
  }
}

function writeDeviceTypes(deviceTypes) {
  fs.writeFileSync(deviceTypesFile, JSON.stringify(deviceTypes, null, 2));
}

app.use(cors());
app.use(express.json());

// WebSocket bağlantılarını saklas
wss.on('connection', function connection(ws) {
  logger.websocket('Bir istemci WebSocket ile bağlandı');
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

// Kuvvet ekleme endpoint'i
app.post('/forces', (req, res) => {
  try {
    const forces = readForces();
    const { name, cityIds } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Kuvvet adı zorunludur ve boş olamaz.' });
    }

    if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
      return res.status(400).json({ error: 'En az bir şehir seçilmelidir.' });
    }

    // Benzersiz ID oluştur (FORCE_001, FORCE_002, ...)
    let newId;
    let counter = 1;
    do {
      newId = `FORCE_${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (forces.some(force => force.id === newId));

    const newForce = {
      id: newId,
      name: name.trim(),
      cityIds: cityIds
    };

    forces.push(newForce);
    writeForces(forces);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.status(201).json(newForce);
  } catch (e) {
    res.status(500).json({ error: 'Kuvvet eklenirken hata oluştu: ' + e.message });
  }
});

// Kuvvet güncelleme endpoint'i
app.put('/forces/:id', (req, res) => {
  try {
    const forces = readForces();
    const { name, cityIds } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Kuvvet adı zorunludur ve boş olamaz.' });
    }

    if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
      return res.status(400).json({ error: 'En az bir şehir seçilmelidir.' });
    }

    const forceIndex = forces.findIndex(force => force.id === req.params.id);
    if (forceIndex === -1) {
      return res.status(404).json({ error: 'Kuvvet bulunamadı.' });
    }

    forces[forceIndex].name = name.trim();
    forces[forceIndex].cityIds = cityIds;
    writeForces(forces);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.json(forces[forceIndex]);
  } catch (e) {
    res.status(500).json({ error: 'Kuvvet güncellenirken hata oluştu: ' + e.message });
  }
});

// Kuvvet silme endpoint'i
app.delete('/forces/:id', (req, res) => {
  try {
    console.log('🗑️ Force silme isteği alındı:', req.params.id);
    const forces = readForces();
    const devices = readDevices();
    const forceIndex = forces.findIndex(force => force.id === req.params.id);
    
    console.log('📊 Mevcut force sayısı:', forces.length);
    console.log('📊 Mevcut device sayısı:', devices.length);
    
    if (forceIndex === -1) {
      console.log('❌ Force bulunamadı:', req.params.id);
      return res.status(404).json({ error: 'Kuvvet bulunamadı.' });
    }

    console.log('✅ Force bulundu:', forces[forceIndex].name);

    // Bu kuvveti kullanan cihazları kontrol et
    const devicesUsingForce = devices.filter(device => device.force === req.params.id);
    console.log('🔍 Bu force\'u kullanan device sayısı:', devicesUsingForce.length);
    
    if (devicesUsingForce.length > 0) {
      console.log('❌ Force silinemez, kullanılıyor');
      return res.status(400).json({ 
        error: 'Bu kuvvet silinemez çünkü kullanılıyor.',
        details: {
          message: `Bu kuvvet ${devicesUsingForce.length} cihaz tarafından kullanılıyor. Önce bu cihazları silin veya başka bir kuvvete taşıyın.`,
          deviceCount: devicesUsingForce.length,
          deviceSerials: devicesUsingForce.map(d => d.serialNumber)
        }
      });
    }

    const deletedForce = forces[forceIndex];
    console.log('🗑️ Force siliniyor:', deletedForce.name);
    forces.splice(forceIndex, 1);
    writeForces(forces);
    
    console.log('✅ Force başarıyla silindi');
    console.log('📊 Yeni force sayısı:', forces.length);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.status(204).send();
  } catch (e) {
    console.error('❌ Force silme hatası:', e);
    res.status(500).json({ error: 'Kuvvet silinirken hata oluştu: ' + e.message });
  }
});

app.get('/sites', (req, res) => {
  const sites = readSites();
  res.json(sites);
});

// Sites CRUD Operations
app.post('/sites', (req, res) => {
  try {
    const sites = readSites();
    const newSite = req.body;

    // Zorunlu alanları kontrol et
    if (!newSite.name || typeof newSite.name !== 'string' || newSite.name.trim() === '') {
      return res.status(400).json({ error: 'Name alanı zorunludur ve boş olamaz.' });
    }

    if (!newSite.cityId || typeof newSite.cityId !== 'string' || newSite.cityId.trim() === '') {
      return res.status(400).json({ error: 'CityId alanı zorunludur ve boş olamaz.' });
    }

    if (!newSite.forceId || typeof newSite.forceId !== 'string' || newSite.forceId.trim() === '') {
      return res.status(400).json({ error: 'ForceId alanı zorunludur ve boş olamaz.' });
    }

    if (!newSite.position || !newSite.position.lat || !newSite.position.lng) {
      return res.status(400).json({ error: 'Position alanı zorunludur ve lat/lng değerleri gerekli.' });
    }

    // ID oluştur
    const newId = `site_${Date.now()}`;
    newSite.id = newId;

    sites.push(newSite);
    writeSites(sites);
    
    // WebSocket ile güncelleme gönder
    console.log('🔔 WebSocket event gönderiliyor: file_updated');
    console.log('📡 Bağlı client sayısı:', wss.clients.size);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        console.log('✅ Client\'a event gönderiliyor');
        client.send(JSON.stringify({ type: 'file_updated' }));
      } else {
        console.log('❌ Client bağlı değil, state:', client.readyState);
      }
    });

    res.status(201).json(newSite);
  } catch (e) {
    console.error('Site eklenirken hata oluştu:', e);
    res.status(500).json({ error: 'Site eklenirken hata oluştu: ' + e.message });
  }
});

app.put('/sites/:id', (req, res) => {
  try {
    const sites = readSites();
    const index = sites.findIndex(s => s.id === req.params.id);
    
    if (index !== -1) {
      const updatedSite = { ...sites[index], ...req.body };
      
      // Zorunlu alanları kontrol et
      if (!updatedSite.name || typeof updatedSite.name !== 'string' || updatedSite.name.trim() === '') {
        return res.status(400).json({ error: 'Name alanı zorunludur ve boş olamaz.' });
      }

      if (!updatedSite.cityId || typeof updatedSite.cityId !== 'string' || updatedSite.cityId.trim() === '') {
        return res.status(400).json({ error: 'CityId alanı zorunludur ve boş olamaz.' });
      }

      if (!updatedSite.forceId || typeof updatedSite.forceId !== 'string' || updatedSite.forceId.trim() === '') {
        return res.status(400).json({ error: 'ForceId alanı zorunludur ve boş olamaz.' });
      }

      if (!updatedSite.position || !updatedSite.position.lat || !updatedSite.position.lng) {
        return res.status(400).json({ error: 'Position alanı zorunludur ve lat/lng değerleri gerekli.' });
      }

      sites[index] = updatedSite;
      writeSites(sites);
      
      // WebSocket ile güncelleme gönder
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'file_updated' }));
        }
      });

      res.json(updatedSite);
    } else {
      res.status(404).json({ error: 'Site bulunamadı' });
    }
  } catch (e) {
    console.error('Site güncellenirken hata oluştu:', e);
    res.status(500).json({ error: 'Site güncellenirken hata oluştu: ' + e.message });
  }
});

app.delete('/sites/:id', (req, res) => {
  try {
    const sites = readSites();
    const index = sites.findIndex(s => s.id === req.params.id);
    
    if (index !== -1) {
      const deletedSite = sites[index];
      sites.splice(index, 1);
      writeSites(sites);
      
      // WebSocket ile güncelleme gönder
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'file_updated' }));
        }
      });

      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Site bulunamadı' });
    }
  } catch (e) {
    console.error('Site silinirken hata oluştu:', e);
    res.status(500).json({ error: 'Site silinirken hata oluştu: ' + e.message });
  }
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
  logger.api('Cihaz ekleme isteği alındı');
  logger.debug('Gelen veri:', JSON.stringify(req.body, null, 2));
  
  const devices = readDevices();
  const newDevice = req.body;

  // Zorunlu alanları kontrol et
  console.log('🔍 Validasyon kontrolleri başlıyor...');
  
  if (!newDevice.typeModelId || typeof newDevice.typeModelId !== 'string' || newDevice.typeModelId.trim() === '') {
    console.log('❌ typeModelId hatası:', newDevice.typeModelId);
    return res.status(400).json({ error: 'typeModelId alanı zorunludur ve boş olamaz.' });
  }

  if (!newDevice.force || typeof newDevice.force !== 'string' || newDevice.force.trim() === '') {
    console.log('❌ force hatası:', newDevice.force);
    return res.status(400).json({ error: 'Force alanı zorunludur ve boş olamaz.' });
  }

  if (!newDevice.city || typeof newDevice.city !== 'string' || newDevice.city.trim() === '') {
    console.log('❌ city hatası:', newDevice.city);
    return res.status(400).json({ error: 'City alanı zorunludur ve boş olamaz.' });
  }

  if (devices.some(d => d.serialNumber === newDevice.serialNumber)) {
    console.log('❌ Seri numarası zaten var:', newDevice.serialNumber);
    return res.status(409).json({ error: 'Bu seri numarası ile tanımlı cihaz zaten var.' });
  }

  console.log('✅ Validasyon kontrolleri geçildi');
  console.log('💾 Cihaz ekleniyor...');
  
  devices.push(newDevice);
  writeDevices(devices);
  broadcastDeviceUpdate(newDevice.serialNumber);
  
  // Filtrelerin güncellenmesi için file_updated event'i gönder
  console.log('🔔 Cihaz eklendi, file_updated event gönderiliyor');
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'file_updated' }));
    }
  });
  
  console.log('✅ Cihaz başarıyla eklendi:', newDevice.serialNumber);
  res.status(201).json(newDevice);
});

app.put('/devices/:serialNumber', (req, res) => {
  const devices = readDevices();
  const index = devices.findIndex(d => d.serialNumber === req.params.serialNumber);
  if (index !== -1) {
    // type/model yerine typeModelId kontrolü
    if (req.body.typeModelId !== undefined) {
      if (!req.body.typeModelId || typeof req.body.typeModelId !== 'string' || req.body.typeModelId.trim() === '') {
        return res.status(400).json({ error: 'typeModelId alanı zorunludur ve boş olamaz.' });
      }
    }
    devices[index] = { ...devices[index], ...req.body };
    writeDevices(devices);
    
    // Filtrelerin güncellenmesi için file_updated event'i gönder
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });
    
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
    
    // Filtrelerin güncellenmesi için file_updated event'i gönder
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });
    
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
    
    // Filtrelerin güncellenmesi için file_updated event'i gönder
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });
    
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
      
      // Filtrelerin güncellenmesi için file_updated event'i gönder
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'file_updated' }));
        }
      });
      
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

// Şehir ekleme endpoint'i
app.post('/cities', (req, res) => {
  try {
    const cities = readCities();
    const { name, cityCenter } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Şehir adı zorunludur ve boş olamaz.' });
    }

    // Benzersiz ID oluştur (CITY_001, CITY_002, ...)
    let newId;
    let counter = 1;
    do {
      newId = `CITY_${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (cities.some(city => city.id === newId));

    const newCity = {
      id: newId,
      name: name.trim(),
      cityCenter: cityCenter || { lat: 0, lng: 0 } // Varsayılan koordinatlar
    };

    cities.push(newCity);
    writeCities(cities);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.status(201).json(newCity);
  } catch (e) {
    res.status(500).json({ error: 'Şehir eklenirken hata oluştu: ' + e.message });
  }
});

// Şehir güncelleme endpoint'i
app.put('/cities/:id', (req, res) => {
  try {
    const cities = readCities();
    const { name, cityCenter } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Şehir adı zorunludur ve boş olamaz.' });
    }

    const cityIndex = cities.findIndex(city => city.id === req.params.id);
    if (cityIndex === -1) {
      return res.status(404).json({ error: 'Şehir bulunamadı.' });
    }

    cities[cityIndex].name = name.trim();
    if (cityCenter) {
      cities[cityIndex].cityCenter = cityCenter;
    }
    writeCities(cities);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.json(cities[cityIndex]);
  } catch (e) {
    res.status(500).json({ error: 'Şehir güncellenirken hata oluştu: ' + e.message });
  }
});

// Şehir silme endpoint'i
app.delete('/cities/:id', (req, res) => {
  try {
    const cities = readCities();
    const devices = readDevices();
    const cityIndex = cities.findIndex(city => city.id === req.params.id);
    
    if (cityIndex === -1) {
      return res.status(404).json({ error: 'Şehir bulunamadı.' });
    }

    // Bu şehri kullanan cihazları kontrol et
    const devicesUsingCity = devices.filter(device => device.city.id === req.params.id);
    if (devicesUsingCity.length > 0) {
      return res.status(400).json({ 
        error: 'Bu şehir silinemez çünkü kullanılıyor.',
        details: {
          message: `Bu şehir ${devicesUsingCity.length} cihaz tarafından kullanılıyor. Önce bu cihazları silin veya başka bir şehre taşıyın.`,
          deviceCount: devicesUsingCity.length,
          deviceSerials: devicesUsingCity.map(d => d.serialNumber)
        }
      });
    }

    // Bu şehri kullanan kuvvetleri kontrol et
    const forces = readForces();
    const forcesUsingCity = forces.filter(force => force.cityIds && force.cityIds.includes(req.params.id));
    if (forcesUsingCity.length > 0) {
      return res.status(400).json({ 
        error: 'Bu şehir silinemez çünkü kuvvetler tarafından kullanılıyor.',
        details: {
          message: `Bu şehir ${forcesUsingCity.length} kuvvet tarafından kullanılıyor. Önce bu kuvvetlerden şehri kaldırın.`,
          forceCount: forcesUsingCity.length,
          forceNames: forcesUsingCity.map(f => f.name)
        }
      });
    }

    const deletedCity = cities[cityIndex];
    cities.splice(cityIndex, 1);
    writeCities(cities);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Şehir silinirken hata oluştu: ' + e.message });
  }
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

app.get('/device-types', (req, res) => {
  const deviceTypes = readDeviceTypes();
  res.json(deviceTypes);
});

app.post('/device-types', (req, res) => {
  try {
    const deviceTypes = readDeviceTypes();
    const { model, type } = req.body;
    
    if (!model || typeof model !== 'string' || model.trim() === '') {
      return res.status(400).json({ error: 'Model adı zorunludur ve boş olamaz.' });
    }

    if (!type || !['radar', 'jammer'].includes(type)) {
      return res.status(400).json({ error: 'Tip radar veya jammer olmalıdır.' });
    }

    // Benzersiz ID oluştur (TYPE_001, TYPE_002, ...)
    let newId;
    let counter = 1;
    do {
      newId = `TYPE_${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (deviceTypes.some(dt => dt.id === newId));

    const newDeviceType = {
      id: newId,
      model: model.trim(),
      type: type
    };

    deviceTypes.push(newDeviceType);
    writeDeviceTypes(deviceTypes);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.status(201).json(newDeviceType);
  } catch (e) {
    res.status(500).json({ error: 'Cihaz tipi eklenirken hata oluştu: ' + e.message });
  }
});

app.put('/device-types/:id', (req, res) => {
  try {
    const deviceTypes = readDeviceTypes();
    const { model, type } = req.body;
    const deviceType = deviceTypes.find(dt => dt.id === req.params.id);
    
    if (!deviceType) {
      return res.status(404).json({ error: 'Cihaz tipi bulunamadı.' });
    }

    if (!model || typeof model !== 'string' || model.trim() === '') {
      return res.status(400).json({ error: 'Model adı zorunludur ve boş olamaz.' });
    }

    if (!type || !['radar', 'jammer'].includes(type)) {
      return res.status(400).json({ error: 'Tip radar veya jammer olmalıdır.' });
    }

    deviceType.model = model.trim();
    deviceType.type = type;
    
    writeDeviceTypes(deviceTypes);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.json(deviceType);
  } catch (e) {
    res.status(500).json({ error: 'Cihaz tipi güncellenirken hata oluştu: ' + e.message });
  }
});

app.delete('/device-types/:id', (req, res) => {
  try {
    const deviceTypes = readDeviceTypes();
    const devices = readDevices();
    const deviceTypeIndex = deviceTypes.findIndex(dt => dt.id === req.params.id);
    
    if (deviceTypeIndex === -1) {
      return res.status(404).json({ error: 'Cihaz tipi bulunamadı.' });
    }

    // Bu cihaz tipini kullanan cihazları kontrol et
    const devicesUsingType = devices.filter(device => device.typeModelId === req.params.id);
    if (devicesUsingType.length > 0) {
      return res.status(400).json({ 
        error: 'Bu cihaz tipi silinemez çünkü kullanılıyor.',
        details: {
          message: `Bu cihaz tipi ${devicesUsingType.length} cihaz tarafından kullanılıyor. Önce bu cihazları silin veya başka bir cihaz tipine taşıyın.`,
          deviceCount: devicesUsingType.length,
          deviceSerials: devicesUsingType.map(d => d.serialNumber)
        }
      });
    }

    deviceTypes.splice(deviceTypeIndex, 1);
    writeDeviceTypes(deviceTypes);
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'file_updated' }));
      }
    });

    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Cihaz tipi silinirken hata oluştu: ' + e.message });
  }
});

// İkame radar ekleme
app.post('/devices/:serialNumber/replacement', (req, res) => {
  const devices = readDevices();
  const device = devices.find(d => d.serialNumber === req.params.serialNumber);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  // Sadece radarlar için izin ver
  if (!device.typeModelId || !device.typeModelId.startsWith('radar_')) {
    return res.status(400).json({ error: 'Sadece radar cihazları için ikame radar eklenebilir.' });
  }
  const { serialNumber, endDate, relatedFaultId } = req.body;
  if (!serialNumber || !endDate || !relatedFaultId) {
    return res.status(400).json({ error: 'serialNumber, endDate ve relatedFaultId zorunludur.' });
  }
  device.replacementRadar = { serialNumber, endDate, relatedFaultId };
  writeDevices(devices);
  broadcastDeviceUpdate(device.serialNumber);
  res.json(device);
});

// İkame radar kaldırma
app.delete('/devices/:serialNumber/replacement', (req, res) => {
  const devices = readDevices();
  const device = devices.find(d => d.serialNumber === req.params.serialNumber);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  if (!device.typeModelId || !device.typeModelId.startsWith('radar_')) {
    return res.status(400).json({ error: 'Sadece radar cihazları için ikame radar kaldırılabilir.' });
  }
  device.replacementRadar = null;
  writeDevices(devices);
  broadcastDeviceUpdate(device.serialNumber);
  res.json(device);
});

server.listen(PORT, () => {
  logger.success(`Server is running on port ${PORT}`);
  logger.info(`Dosya yönetimi arayüzü: http://localhost:${PORT}/admin`);
}); 
