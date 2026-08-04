const router     = require('express').Router();
const { Vehicle }= require('../models');
const { requireAdmin } = require('./middleware');

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

// ─── POST /api/vehicles (admin) ───────────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, type, city, icon, price_day, seats, fuel, transmission, description } = req.body;
    if (!name || !type || !city || !price_day)
      return res.status(400).json({ error: 'name, type, city, price_day are required' });
    const vehicle = await Vehicle.create({ name, type, city, icon: icon || '🚗', price_day, seats: seats || null, fuel: fuel || 'Petrol', transmission: transmission || 'Manual', description: description || '', available: true });
    res.status(201).json({ vehicle: { ...vehicle.toObject(), id: vehicle._id } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/vehicles/:id (admin) ───────────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, type, city, icon, price_day, seats, fuel, transmission, description, available } = req.body;
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
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle: { ...vehicle.toObject(), id: vehicle._id } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/vehicles/:id (admin) ────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
