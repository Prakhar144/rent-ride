const router             = require('express').Router();
const { Booking, Vehicle, ActivityLog }= require('../models');
const { requireAuth }    = require('./middleware');

// ─── POST /api/bookings ───────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, ride_type, pickup_address, drop_address, distance_km } = req.body;
    if (!vehicle_id || !start_date || !end_date)
      return res.status(400).json({ error: 'vehicle_id, start_date, end_date are required' });

    const vehicle = await Vehicle.findOne({ _id: vehicle_id, available: true });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found or unavailable' });

    const s = new Date(start_date), e = new Date(end_date);
    if (e <= s) return res.status(400).json({ error: 'end_date must be after start_date' });

    const days        = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    const total_price = days * vehicle.price_day;

    // Check date conflicts with confirmed bookings
    const conflict = await Booking.findOne({
      vehicle: vehicle_id,
      status: 'confirmed',
      end_date:   { $gt: start_date },
      start_date: { $lt: end_date },
    });
    if (conflict) return res.status(409).json({ error: 'Vehicle already booked for these dates' });

    const booking = await Booking.create({
      user: req.user.id,
      vehicle: vehicle_id,
      start_date,
      end_date,
      total_price,
      ride_type:      ride_type      || 'daily',
      pickup_address: pickup_address || null,
      drop_address:   drop_address   || null,
      distance_km:    distance_km    || null,
    });

    // Populate for response
    await booking.populate('vehicle', 'name icon city type price_day');

    await ActivityLog.create({
      user: req.user.id,
      action: 'Created Booking',
      details: `Booked ${booking.vehicle.name} from ${start_date} to ${end_date}`
    });

    res.status(201).json({ booking: flattenBooking(booking) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/bookings/dispatch-requests ──────────────────────────────────────
router.get('/dispatch-requests', requireAuth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can view dispatch requests' });
  try {
    const bookings = await Booking.find({ status: 'pending_dispatch' })
      .populate('vehicle', 'name icon city type price_day image_url')
      .sort({ createdAt: -1 });
    res.json({ requests: bookings.map(flattenBooking) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/bookings/:id/accept ──────────────────────────────────────────
router.post('/:id/accept', requireAuth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can accept requests' });
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending_dispatch') return res.status(400).json({ error: 'Booking already accepted or cancelled' });
    
    booking.status = 'awaiting_payment';
    booking.assigned_vendor = req.user.id;
    await booking.save();
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'Accepted Ride',
      details: `Accepted dispatch request for booking ID: ${booking._id}`
    });
    
    await booking.populate('vehicle', 'name icon city type price_day image_url');
    res.json({ message: 'Ride accepted successfully', booking: flattenBooking(booking) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/bookings/mine ───────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('vehicle', 'name icon city type price_day')
      .sort({ createdAt: -1 });
    res.json({ bookings: bookings.map(flattenBooking) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/bookings/:id (cancel) ───────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });
    booking.status = 'cancelled';
    await booking.save();
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'Cancelled Booking',
      details: `Cancelled booking ID: ${booking._id}`
    });

    res.json({ message: 'Booking cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Helper: flatten populated booking for frontend ───────────────────────────
function flattenBooking(b) {
  const obj = b.toObject ? b.toObject() : b;
  const v   = obj.vehicle || {};
  return {
    id:             obj._id,
    user_id:        obj.user,
    vehicle_id:     v._id || obj.vehicle,
    vehicle_name:   v.name  || '',
    icon:           v.icon  || '🚗',
    city:           v.city  || '',
    type:           v.type  || '',
    price_day:      v.price_day || 0,
    start_date:     obj.start_date,
    end_date:       obj.end_date,
    total_price:    obj.total_price,
    status:         obj.status,
    ride_type:      obj.ride_type || 'daily',
    pickup_address: obj.pickup_address || null,
    drop_address:   obj.drop_address   || null,
    distance_km:    obj.distance_km    || null,
    assigned_vendor:obj.assigned_vendor|| null,
    created_at:     obj.createdAt,
  };
}

module.exports = router;
