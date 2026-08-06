const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const { connectDB }= require('./db');
const { seedDB }   = require('./seed');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Serve Static Frontend ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin',    require('./routes/admin'));

// ─── SPA Catch-all ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Boot: Connect MongoDB → Seed → Listen ────────────────────────────────────
(async () => {
  await connectDB();
  await seedDB();
  app.listen(PORT, () => {
    console.log(`\n🚗  RENT RIDE backend running at http://localhost:${PORT}`);
    console.log(`📦  Database: MongoDB → rentride`);
    console.log(`📁  Serving frontend from ../Frontend`);
    console.log(`🔑  Admin login: admin@rentride.com / admin@123\n`);
  });
})();
