const router     = require('express').Router();
const { Vehicle, ActivityLog }= require('../models');
const { requireAdmin, requireAdminOrVendor, requireAuth } = require('./middleware');
const multer     = require('multer');
const path       = require('path');

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ─── GET /api/vehicles/vendor/my-vehicles ──────────────────────────────────────
router.get('/vendor/my-vehicles', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Vendor access required' });
    const vehicles = await Vehicle.find({ vendor: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ vehicles: vehicles.map(v => ({ ...v, id: v._id })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/vehicles ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { city, type, fuel, minPrice, maxPrice, sort } = req.query;
    const filter = { available: true };
    if (city)     filter.city  = city;
    if (type)     filter.type  = type;
    if (fuel)     filter.fuel  = fuel;
    if (minPrice || maxPrice) {
      filter.price_day = {};
      if (minPrice) filter.price_day.$gte = Number(minPrice);
      if (maxPrice) filter.price_day.$lte = Number(maxPrice);
    }
    let sortOpt = { name: 1 };
    if (sort === 'price_asc')  sortOpt = { price_day: 1 };
    if (sort === 'price_desc') sortOpt = { price_day: -1 };

    const vehicles = await Vehicle.find(filter).sort(sortOpt).lean();
    // Map _id → id for frontend compatibility
    res.json({ vehicles: vehicles.map(v => ({ ...v, id: v._id })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/vehicles/cities — MUST be before /:id ──────────────────────────
router.get('/cities', async (req, res) => {
  try {
    const cities = await Vehicle.distinct('city');
    res.json({ cities: cities.sort() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/vehicles/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle: { ...vehicle, id: vehicle._id } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/vehicles (admin & vendor) ──────────────────────────────────────
router.post('/', requireAdminOrVendor, upload.single('image'), async (req, res) => {
  try {
    const { name, type, city, icon, price_day, seats, fuel, transmission, description } = req.body;
    if (!name || !type || !city || !price_day)
      return res.status(400).json({ error: 'name, type, city, price_day are required' });
    
    const vendorId = req.user.role === 'vendor' ? req.user.id : null;
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const vehicle = await Vehicle.create({ name, type, city, icon: icon || '🚗', image_url: imageUrl, price_day, seats: seats || null, fuel: fuel || 'Petrol', transmission: transmission || 'Manual', description: description || '', available: true, vendor: vendorId });
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'Added Vehicle',
      details: `${name} in ${city} (₹${price_day}/day)`
    });

    res.status(201).json({ vehicle: { ...vehicle.toObject(), id: vehicle._id } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/vehicles/:id (admin & vendor) ───────────────────────────────────
router.put('/:id', requireAdminOrVendor, upload.single('image'), async (req, res) => {
  try {
    const { name, type, city, icon, price_day, seats, fuel, transmission, description, available } = req.body;
    
    // Check ownership if vendor
    const existing = await Vehicle.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vehicle not found' });
    if (req.user.role === 'vendor' && existing.vendor?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own vehicles' });
    }

    const updates = {};
    if (name !== undefined)         updates.name = name;
    if (type !== undefined)         updates.type = type;
    if (city !== undefined)         updates.city = city;
    if (icon !== undefined)         updates.icon = icon;
    if (price_day !== undefined)    updates.price_day = price_day;
    if (seats !== undefined)        updates.seats = seats;
    if (fuel !== undefined)         updates.fuel = fuel;
    if (transmission !== undefined) updates.transmission = transmission;
    if (description !== undefined)  updates.description = description;
    if (available !== undefined)    updates.available = Boolean(available);
    
    if (req.file) {
      updates.image_url = `/uploads/${req.file.filename}`;
    }
    
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true });

    await ActivityLog.create({
      user: req.user.id,
      action: 'Updated Vehicle',
      details: `Updated details for ${vehicle.name}`
    });

    res.json({ vehicle: { ...vehicle.toObject(), id: vehicle._id } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/vehicles/:id (admin & vendor) ────────────────────────────────
router.delete('/:id', requireAdminOrVendor, async (req, res) => {
  try {
    const existing = await Vehicle.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vehicle not found' });
    if (req.user.role === 'vendor' && existing.vendor?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own vehicles' });
    }
    
    await Vehicle.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user.id,
      action: 'Deleted Vehicle',
      details: `Deleted vehicle: ${existing.name}`
    });

    res.json({ message: 'Vehicle deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
