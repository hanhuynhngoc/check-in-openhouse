const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static('public'));

// ─── JSON "database" ──────────────────────────────────────────────────────────
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const init = { event_name: 'Open House 2026', guests: [], nextId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateToken() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `EVT-${part()}-${part()}`;
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const db = loadDB();
  const total = db.guests.length;
  const checked = db.guests.filter(g => g.checked_in).length;
  res.json({ total, checked, pending: total - checked, event_name: db.event_name });
});

app.get('/api/guests', (req, res) => {
  const db = loadDB();
  res.json(db.guests);
});

app.post('/api/settings', (req, res) => {
  const db = loadDB();
  if (req.body.event_name) db.event_name = req.body.event_name;
  saveDB(db);
  res.json({ success: true });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Khong co file' });
  try {
    const content = req.file.buffer.toString('utf-8').replace(/\r/g, '');
    let rows = [];
    try {
      const parsed = parse(content, { columns: true, skip_empty_lines: true, trim: true });
      rows = parsed.map(r => {
        const name = r['name'] || r['Name'] || r['Ho ten'] || r['ho ten'] ||
                     r['full_name'] || r['HoTen'] || Object.values(r)[0] || '';
        const info = r['info'] || r['Info'] || r['Phong ban'] || r['phong_ban'] ||
                     r['department'] || r['Department'] || Object.values(r)[1] || '';
        return { name: name.trim(), info: info.trim() };
      });
    } catch (e) {
      rows = content.split('\n')
        .map(l => l.trim()).filter(l => l.length > 0)
        .map(l => { const p = l.split(','); return { name: p[0].trim(), info: (p[1]||'').trim() }; });
    }

    const db = loadDB();
    let inserted = 0;
    for (const row of rows) {
      if (!row.name) continue;
      const token = generateToken();
      db.guests.push({ id: db.nextId++, name: row.name, info: row.info, token, checked_in: false, checked_at: null });
      inserted++;
    }
    saveDB(db);
    res.json({ success: true, inserted, total: rows.length });
  } catch (e) {
    res.status(400).json({ error: 'File error: ' + e.message });
  }
});

app.post('/api/guests', (req, res) => {
  const { name, info } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is missing' });
  const db = loadDB();
  const token = generateToken();
  db.guests.push({ id: db.nextId++, name: name.trim(), info: (info||'').trim(), token, checked_in: false, checked_at: null });
  saveDB(db);
  res.json({ success: true, token });
});

app.delete('/api/guests/:id', (req, res) => {
  const db = loadDB();
  db.guests = db.guests.filter(g => g.id !== parseInt(req.params.id));
  saveDB(db);
  res.json({ success: true });
});

app.get('/api/qr/:token', async (req, res) => {
  const db = loadDB();
  const guest = db.guests.find(g => g.token === req.params.token);
  if (!guest) return res.status(404).json({ error: 'Not found' });
  const qr = await QRCode.toDataURL(req.params.token, { width: 300, margin: 2 });
  res.json({ qr, guest });
});

app.post('/api/checkin', (req, res) => {
  const { token } = req.body;
  if (!token) return res.json({ status: 'invalid', message: 'Token missing' });

  const db = loadDB();
  const guest = db.guests.find(g => g.token === token);

  if (!guest) return res.json({ status: 'invalid', message: 'QR is invalid' });

  if (guest.checked_in) {
    return res.json({
      status: 'duplicate',
      message: 'This QR has been used',
      guest: { name: guest.name, info: guest.info, checked_at: guest.checked_at }
    });
  }

  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
  guest.checked_in = true;
  guest.checked_at = now;
  saveDB(db);

  res.json({ status: 'ok', message: 'Checked-in successfully!', guest: { name: guest.name, info: guest.info, checked_at: now } });
});

app.post('/api/reset-checkins', (req, res) => {
  const db = loadDB();
  db.guests.forEach(g => { g.checked_in = false; g.checked_at = null; });
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/reset-all', (req, res) => {
  const db = loadDB();
  db.guests = [];
  db.nextId = 1;
  saveDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});
