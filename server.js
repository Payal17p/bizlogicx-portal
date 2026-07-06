const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bizlogicx-dev-secret-key-2024';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────── MONGOOSE SCHEMAS ───────────────────────

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, default: 'Operator' },
  company: { type: String, default: 'Biz LogicX' },
  email: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const shipmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipmentId: String,
  
  // Booking & Direction
  bookingDate: String,
  direction: { type: String, enum: ['export', 'import'], default: 'export' },
  
  // Origin & Destination
  originCountry: String,
  originPort: String,
  destCountry: String,
  destPort: String,
  
  // Client & Billing
  billTo: String,
  shipperName: String,
  shipperCode: String,
  consignee: String,
  consigneeCode: String,
  
  // Cargo Details
  nature: String,
  transportMode: { type: String, enum: ['air', 'sea'], default: 'air' },
  carrier: String,
  service: String,
  
  // Waybill Numbers
  hawb: String,
  mawb: String,
  
  // Invoice Details
  invoiceNo: String,
  invoiceDate: String,
  invoiceTotalValue: String,
  invoiceCurrency: String,
  exchangeRate: String,
  
  // Packages
  packages: [{
    type: { type: String },
    weight: Number,
    length: Number,
    width: Number,
    height: Number,
    unit: String,
    description: String,
    hsCode: String,
    unitPrice: Number,
    quantity: Number
  }],
  
  // Revenue Heads (Sales)
  revenueHeads: [{
    category: String,
    head: String,
    sac: String,
    quantity: Number,
    rate: Number,
    currency: String,
    exchangeRate: Number,
    amount: Number
  }],
  
  // Purchase Items (Costs)
  purchaseItems: [{
    vendor: String,
    description: String,
    quantity: Number,
    rate: Number,
    currency: String,
    exchangeRate: Number,
    amount: Number
  }],
  
  // Financial Totals
  totalRevenue: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  marginPercent: { type: Number, default: 0 },
  
  // Status
  status: { type: String, enum: ['draft', 'submitted', 'completed'], default: 'draft' },
  remarks: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Shipment = mongoose.model('Shipment', shipmentSchema);

// ─────────────────────── MIDDLEWARE ───────────────────────

function createToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function authMiddleware(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ ok: false, message: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }
}

// ─────────────────────── ROUTES ───────────────────────

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Biz LogicX API running' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullName, email, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password required' });
  }
  try {
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Username already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      fullName: fullName || 'Operator',
      email,
      phone
    });
    const token = createToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.status(201).json({
      ok: true,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password required' });
  }
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }
    const token = createToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({
      ok: true,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    res.json({
      ok: true,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to load profile' });
  }
});

// Dashboard Route
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.user.id }).lean();
    
    const totalShipments = shipments.length;
    const airFreight = shipments.filter(s => s.transportMode === 'air').length;
    const oceanFreight = shipments.filter(s => s.transportMode === 'sea').length;
    const exports = shipments.filter(s => s.direction === 'export').length;
    
    const totalRevenue = shipments.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const totalCost = shipments.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    
    res.json({
      ok: true,
      dashboard: {
        totalShipments,
        airFreight,
        oceanFreight,
        exports,
        totalRevenue,
        totalCost,
        totalProfit,
        recentShipments: shipments.slice(0, 10).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to load dashboard' });
  }
});

// Shipment Routes
app.get('/api/shipments', authMiddleware, async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, shipments });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to fetch shipments' });
  }
});

app.post('/api/shipments', authMiddleware, async (req, res) => {
  try {
    const shipmentId = 'BLX-' + Date.now().toString(36).toUpperCase();
    
    // Calculate totals
    const revenueHeads = req.body.revenueHeads || [];
    const purchaseItems = req.body.purchaseItems || [];
    
    let totalRevenue = 0;
    revenueHeads.forEach(item => {
      totalRevenue += item.amount || 0;
    });
    
    let totalCost = 0;
    purchaseItems.forEach(item => {
      totalCost += item.amount || 0;
    });
    
    const profit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;
    
    const shipment = await Shipment.create({
      userId: req.user.id,
      shipmentId,
      ...req.body,
      totalRevenue,
      totalCost,
      profit,
      marginPercent
    });
    
    res.status(201).json({ ok: true, shipment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to save shipment' });
  }
});

app.get('/api/shipments/:id', authMiddleware, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean();
    if (!shipment) {
      return res.status(404).json({ ok: false, message: 'Shipment not found' });
    }
    res.json({ ok: true, shipment });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to fetch shipment' });
  }
});

app.put('/api/shipments/:id', authMiddleware, async (req, res) => {
  try {
    const revenueHeads = req.body.revenueHeads || [];
    const purchaseItems = req.body.purchaseItems || [];
    
    let totalRevenue = 0;
    revenueHeads.forEach(item => {
      totalRevenue += item.amount || 0;
    });
    
    let totalCost = 0;
    purchaseItems.forEach(item => {
      totalCost += item.amount || 0;
    });
    
    const profit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;
    
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        ...req.body,
        totalRevenue,
        totalCost,
        profit,
        marginPercent,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!shipment) {
      return res.status(404).json({ ok: false, message: 'Shipment not found' });
    }
    res.json({ ok: true, shipment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to update shipment' });
  }
});

app.delete('/api/shipments/:id', authMiddleware, async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!shipment) {
      return res.status(404).json({ ok: false, message: 'Shipment not found' });
    }
    res.json({ ok: true, message: 'Shipment deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to delete shipment' });
  }
});

// Download CSV
app.get('/api/shipments/:id/download', authMiddleware, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean();
    
    if (!shipment) {
      return res.status(404).json({ ok: false, message: 'Shipment not found' });
    }
    
    let csv = 'Biz LogicX - Shipment Details\n\n';
    csv += `Shipment ID,${shipment.shipmentId}\n`;
    csv += `Shipper,${shipment.shipperName}\n`;
    csv += `Consignee,${shipment.consignee}\n`;
    csv += `Booking Date,${shipment.bookingDate}\n`;
    csv += `Transport Mode,${shipment.transportMode}\n`;
    csv += `Carrier,${shipment.carrier}\n\n`;
    
    csv += 'Revenue Details\n';
    csv += 'Category,Head,Quantity,Rate,Amount\n';
    (shipment.revenueHeads || []).forEach(item => {
      csv += `${item.category},${item.head},${item.quantity},${item.rate},${item.amount}\n`;
    });
    csv += `Total Revenue,,,,${shipment.totalRevenue}\n\n`;
    
    csv += 'Cost Details\n';
    csv += 'Vendor,Description,Quantity,Rate,Amount\n';
    (shipment.purchaseItems || []).forEach(item => {
      csv += `${item.vendor},${item.description},${item.quantity},${item.rate},${item.amount}\n`;
    });
    csv += `Total Cost,,,,${shipment.totalCost}\n\n`;
    
    csv += `Profit,${shipment.profit}\n`;
    csv += `Margin %,${shipment.marginPercent}%\n`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=shipment-${shipment.shipmentId}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to download shipment' });
  }
});

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────── SERVER START ───────────────────────

async function start() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      const memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log('✓ Using in-memory MongoDB for local development');
    }

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`\n🚀 Biz LogicX Portal running on http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

start();
