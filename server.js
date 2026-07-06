const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bizlogicx-dev-secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, default: 'Operator' },
  createdAt: { type: Date, default: Date.now }
});

const shipmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingDate: String,
  direction: String,
  originCountry: String,
  originPort: String,
  destCountry: String,
  destPort: String,
  shipperName: String,
  consignee: String,
  nature: String,
  transportMode: String,
  carrier: String,
  service: String,
  hawb: String,
  mawb: String,
  invoiceNo: String,
  invoiceDate: String,
  invoiceTotalValue: String,
  invoiceCurrency: String,
  exchangeRate: String,
  remarks: String,
  packages: [{ type: Object }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Shipment = mongoose.model('Shipment', shipmentSchema);

function createToken(user) {
  return jwt.sign({ id: user._id, username: user.username, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });
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

app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Biz LogicX API is running' }));

app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password are required' });
  }

  try {
    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ ok: false, message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      passwordHash,
      fullName: fullName?.trim() || 'Operator'
    });

    const token = createToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ ok: true, user: { id: user._id, username: user.username, fullName: user.fullName }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ ok: true, user: { id: user._id, username: user.username, fullName: user.fullName }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to log in' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    res.json({ ok: true, user: { id: user._id, username: user.username, fullName: user.fullName } });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Unable to load profile' });
  }
});

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
    const shipment = await Shipment.create({
      userId: req.user.id,
      ...req.body,
      packages: req.body.packages || []
    });
    res.status(201).json({ ok: true, shipment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Unable to save shipment' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      const memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log('Using in-memory MongoDB for local development');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Biz LogicX portal running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  }
}

start();
