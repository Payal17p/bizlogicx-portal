const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'bizlogicx-dev-secret-key-2024';
const WHATSAPP_SUPPORT_NUMBER = String(process.env.WHATSAPP_SUPPORT_NUMBER || '').replace(/\D/g, '');
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE).toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Biz LogicX <no-reply@bizlogicx.com>';
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────── MONGOOSE SCHEMAS ───────────────────────

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, default: 'Operator' },
  company: { type: String, default: 'Biz LogicX' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  resetToken: String,
  resetTokenExpiry: Date,
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

const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 30 * 24 * 60 * 60 * 1000
};

const clearCookieOptions = {
  httpOnly: true,
  sameSite: cookieOptions.sameSite,
  secure: cookieOptions.secure
};

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[a-z0-9._-]{3,30}$/.test(username);
}

function isStrongEnoughPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidPhone(phone) {
  return /^\+?[0-9]{10,15}$/.test(phone);
}

function getRequestBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getEmailTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

function calculateShipmentTotals(revenueHeads = [], purchaseItems = []) {
  const totalRevenue = revenueHeads.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalCost = purchaseItems.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const profit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? Number(((profit / totalRevenue) * 100).toFixed(2)) : 0;

  return { totalRevenue, totalCost, profit, marginPercent };
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(values) {
  return values.map(escapeCsv).join(',') + '\n';
}

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
  const username = normalizeText(req.body.username).toLowerCase();
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;
  const fullName = normalizeText(req.body.fullName);
  const phone = normalizeText(req.body.phone);

  if (!username || !email || !password || !fullName || !phone) {
    return res.status(400).json({ ok: false, message: 'Full name, email, username, mobile number and password are required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Enter a valid email address' });
  }
  if (!isValidUsername(username)) {
    return res.status(400).json({ ok: false, message: 'Username must be 3-30 characters and use only letters, numbers, dot, underscore or hyphen' });
  }
  if (!isStrongEnoughPassword(password)) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ ok: false, message: 'Enter a valid mobile number with 10 to 15 digits' });
  }
  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(409).json({ ok: false, message: `${field} already exists` });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash,
      fullName,
      email,
      phone
    });
    res.status(201).json({
      ok: true,
      message: 'Registration successful. Please login to continue.',
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email, phone: user.phone }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Account';
      return res.status(409).json({ ok: false, message: `${field} already exists` });
    }
    res.status(500).json({ ok: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = normalizeText(req.body.username).toLowerCase();
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username/email and password are required' });
  }
  try {
    const user = await User.findOne({
      $or: [{ username }, { email: normalizeEmail(username) }]
    });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid username/email or password' });
    }
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, message: 'Invalid username/email or password' });
    }
    const token = createToken(user);
    res.cookie('token', token, cookieOptions);
    res.json({
      ok: true,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email, phone: user.phone },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Login failed. Please try again.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', clearCookieOptions);
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      res.clearCookie('token', clearCookieOptions);
      return res.status(401).json({ ok: false, message: 'User not found' });
    }
    res.json({
      ok: true,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to load profile' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    return res.status(400).json({ ok: false, message: 'Email required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Email not found' });
    }

    const resetToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    const resetLink = `${getRequestBaseUrl(req)}/?resetToken=${encodeURIComponent(resetToken)}`;

    await User.findByIdAndUpdate(user._id, { resetToken, resetTokenExpiry });

    const transporter = getEmailTransporter();
    let emailSent = false;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: 'Biz LogicX Password Reset',
          text: `Hi ${user.fullName || user.username},\n\nWe received a request to reset your Biz LogicX password. Click the link below to reset it:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nBiz LogicX Support`,
          html: `
            <p>Hi ${user.fullName || user.username},</p>
            <p>We received a request to reset your Biz LogicX password.</p>
            <p><a href="${resetLink}">Click here to reset your password</a></p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Thanks,<br/>Biz LogicX Support</p>
          `
        });
        emailSent = true;
      } catch (mailError) {
        console.error('Password reset email send failed:', mailError);
      }
    }

    const response = {
      ok: true,
      message: emailSent
        ? 'Password reset instructions have been sent to your email.'
        : 'Password reset link is ready. Use the provided link to continue.',
      resetLink,
      token: isProduction ? undefined : resetToken,
      emailSent
    };

    if (!emailSent) {
      const whatsappMessage = encodeURIComponent(`Biz LogicX password reset request for ${email}. Reset link: ${resetLink}`);
      response.whatsappLink = WHATSAPP_SUPPORT_NUMBER
        ? `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${whatsappMessage}`
        : `https://wa.me/?text=${whatsappMessage}`;
    }

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to process request' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ ok: false, message: 'Reset token and new password required' });
  }
  if (!isStrongEnoughPassword(newPassword)) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters' });
  }
  try {
    const user = await User.findOne({ 
      resetToken,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ ok: false, message: 'Invalid or expired reset token' });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { 
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null
    });
    
    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to reset password' });
  }
});

// Dashboard Route
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    
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
        recentShipments: shipments.slice(0, 10)
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
    
    const revenueHeads = req.body.revenueHeads || [];
    const purchaseItems = req.body.purchaseItems || [];
    const totals = calculateShipmentTotals(revenueHeads, purchaseItems);
    
    const shipment = await Shipment.create({
      userId: req.user.id,
      shipmentId,
      ...req.body,
      ...totals
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
    const totals = calculateShipmentTotals(revenueHeads, purchaseItems);
    
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        ...req.body,
        ...totals,
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
    csv += csvRow(['Shipment ID', shipment.shipmentId]);
    csv += csvRow(['Shipper', shipment.shipperName]);
    csv += csvRow(['Consignee', shipment.consignee]);
    csv += csvRow(['Booking Date', shipment.bookingDate]);
    csv += csvRow(['Transport Mode', shipment.transportMode]);
    csv += csvRow(['Carrier', shipment.carrier]);
    csv += '\n';
    
    csv += 'Revenue Details\n';
    csv += 'Category,Head,Quantity,Rate,Amount\n';
    (shipment.revenueHeads || []).forEach(item => {
      csv += csvRow([item.category, item.head, item.quantity, item.rate, item.amount]);
    });
    csv += csvRow(['Total Revenue', '', '', '', shipment.totalRevenue]) + '\n';
    
    csv += 'Cost Details\n';
    csv += 'Vendor,Description,Quantity,Rate,Amount\n';
    (shipment.purchaseItems || []).forEach(item => {
      csv += csvRow([item.vendor, item.description, item.quantity, item.rate, item.amount]);
    });
    csv += csvRow(['Total Cost', '', '', '', shipment.totalCost]) + '\n';
    
    csv += csvRow(['Profit', shipment.profit]);
    csv += csvRow(['Margin %', `${shipment.marginPercent}%`]);
    
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
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required. Add it to .env locally and to Render environment variables.');
    }

    if (isProduction && JWT_SECRET === 'bizlogicx-dev-secret-key-2024') {
      throw new Error('JWT_SECRET must be set in production.');
    }

    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || undefined,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✓ Connected to MongoDB');

    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 Biz LogicX Portal running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

start();
