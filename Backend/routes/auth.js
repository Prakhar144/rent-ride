const router  = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { User, ActivityLog } = require('../models');

const JWT_SECRET  = process.env.JWT_SECRET || 'rideindia_secret_2026';
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, isVendor } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = bcrypt.hashSync(password, 10);
    const role   = isVendor ? 'vendor' : 'user';
    const user   = await User.create({ name, email, phone: phone || null, password: hashed, role });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);
    
    await ActivityLog.create({
      user: user._id,
      action: 'User Registered',
      details: `Role: ${role}, Name: ${name}`
    });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password' });

    if (user.status === 'blocked')
      return res.status(403).json({ error: 'Your account has been blocked by an administrator.' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);
    
    await ActivityLog.create({
      user: user._id,
      action: 'User Logged In',
      details: 'Successful login'
    });

    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status === 'blocked') return res.status(403).json({ error: 'Your account has been blocked.' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, created_at: user.createdAt } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
