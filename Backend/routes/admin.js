const router                    = require('express').Router();
const { User, Vehicle, Booking, ActivityLog }= require('../models');
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
      .populate('user', 'name email phone')
      .populate({
        path: 'vehicle',
        select: 'name icon city type vendor',
        populate: { path: 'vendor', select: 'name email phone' }
      })
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
        vendor_name:  b.vehicle?.vendor?.name || '—',
        vendor_email: b.vehicle?.vendor?.email || '—',
        vendor_phone: b.vehicle?.vendor?.phone || '—',
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
        status:     u.status,
        created_at: u.createdAt,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/admin/users/:id/block ───────────────────────────────────────────
router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot block an admin' });
    
    user.status = 'blocked';
    await user.save();
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'Blocked User',
      details: `Blocked user ID: ${user._id} (${user.email})`
    });

    res.json({ message: 'User blocked successfully', user: { id: user._id, status: user.status } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/admin/users/:id/unblock ─────────────────────────────────────────
router.put('/users/:id/unblock', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.status = 'active';
    await user.save();
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'Unblocked User',
      details: `Unblocked user ID: ${user._id} (${user.email})`
    });

    res.json({ message: 'User unblocked successfully', user: { id: user._id, status: user.status } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/activity ──────────────────────────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json({
      activity: logs.map(l => ({
        id:         l._id,
        user_name:  l.user?.name || 'Guest',
        email:      l.user?.email || '—',
        role:       l.user?.role || '—',
        action:     l.action,
        details:    l.details,
        created_at: l.createdAt,
      }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
