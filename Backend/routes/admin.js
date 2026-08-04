const router                    = require('express').Router();
const { User, Vehicle, Booking }= require('../models');
const { requireAdmin }          = require('./middleware');

router.use(requireAdmin);

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalVehicles, totalBookings, pendingBookings, confirmedBookings, revenueAgg] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Vehicle.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$total_price' } } },
      ]),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    res.json({ totalUsers, totalVehicles, totalBookings, pendingBookings, confirmedBookings, totalRevenue });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user',    'name email phone')
      .populate('vehicle', 'name icon city type')
      .sort({ createdAt: -1 });
    res.json({
      bookings: bookings.map(b => ({
        id:           b._id,
        user_name:    b.user?.name  || '—',
        email:        b.user?.email || '—',
        phone:        b.user?.phone || '—',
        vehicle_name: b.vehicle?.name || '—',
        icon:         b.vehicle?.icon || '🚗',
        city:         b.vehicle?.city || '—',
        type:         b.vehicle?.type || '—',
        start_date:   b.start_date,
        end_date:     b.end_date,
        total_price:  b.total_price,
        status:       b.status,
        created_at:   b.createdAt,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/admin/bookings/:id/status ──────────────────────────────────────
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled', 'awaiting_payment'].includes(status))
      return res.status(400).json({ error: 'status must be pending, confirmed, cancelled, or awaiting_payment' });
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: `Booking ${status}`, booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      users: users.map(u => ({
        id:         u._id,
        name:       u.name,
        email:      u.email,
        phone:      u.phone,
        role:       u.role,
        created_at: u.createdAt,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
