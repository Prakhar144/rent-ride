const router = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { Booking, Vehicle } = require('../models');
const { requireAuth } = require('./middleware');

const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TCgHI0c0V67Zzf';
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'F0rwq6yOfXKaPypwyIlmZrwI';



const razorpay = new Razorpay({
  key_id: RZP_KEY_ID,
  key_secret: RZP_KEY_SECRET,
});

// Helper: extract a readable message from Razorpay error objects
function rzpErrMsg(err) {
  if (err && err.error && err.error.description) return err.error.description;
  if (err && err.message) return err.message;
  try { return JSON.stringify(err); } catch { return 'Razorpay error'; }
}

// ─── POST /api/payments/create-order ─────────────────────────────────────────
// Creates a Razorpay order + a booking record with status "awaiting_payment"
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.body;

    if (!vehicle_id || !start_date || !end_date)
      return res.status(400).json({ error: 'vehicle_id, start_date and end_date are required' });

    // Validate vehicle
    const vehicle = await Vehicle.findOne({ _id: vehicle_id, available: true });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found or unavailable' });

    const s = new Date(start_date), e = new Date(end_date);
    if (e <= s) return res.status(400).json({ error: 'end_date must be after start_date' });

    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    const total_price = days * vehicle.price_day;

    // Check for conflicting confirmed bookings
    const conflict = await Booking.findOne({
      vehicle: vehicle_id,
      status: 'confirmed',
      end_date: { $gt: start_date },
      start_date: { $lt: end_date },
    });
    if (conflict) return res.status(409).json({ error: 'Vehicle already booked for these dates' });

    // Create Razorpay order (amount in paise = price × 100)
    const rzpOrder = await razorpay.orders.create({
      amount: total_price * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        vehicle: vehicle.name,
        city: vehicle.city,
        start_date,
        end_date,
      },
    });

    // Save booking with awaiting_payment status
    const booking = await Booking.create({
      user: req.user.id,
      vehicle: vehicle_id,
      start_date,
      end_date,
      total_price,
      status: 'awaiting_payment',
      razorpay_order_id: rzpOrder.id,
    });

    res.json({
      key: RZP_KEY_ID,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      booking_id: booking._id,
      vehicle: {
        name: vehicle.name,
        icon: vehicle.icon,
        city: vehicle.city,
      },
      days,
      total_price,
    });
  } catch (err) {
    const msg = rzpErrMsg(err);
    console.error('[Payment/create-order]', msg);
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/payments/verify ────────────────────────────────────────────────
// Verifies Razorpay signature and confirms the booking
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id)
      return res.status(400).json({ error: 'Missing payment verification fields' });

    // ── HMAC-SHA256 signature verification ────────────────────────────────────
    const expectedSig = crypto
      .createHmac('sha256', RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ error: 'Invalid payment signature — possible tampering' });

    // ── Confirm booking ───────────────────────────────────────────────────────
    const booking = await Booking.findOneAndUpdate(
      { _id: booking_id, user: req.user.id, razorpay_order_id },
      { status: 'confirmed', razorpay_payment_id },
      { new: true }
    ).populate('vehicle', 'name icon city type price_day');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.json({
      message: 'Payment verified. Booking confirmed!',
      booking: {
        id: booking._id,
        vehicle_name: booking.vehicle?.name,
        icon: booking.vehicle?.icon,
        city: booking.vehicle?.city,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_price: booking.total_price,
        status: booking.status,
        payment_id: booking.razorpay_payment_id,
      },
    });
  } catch (err) {
    const msg = rzpErrMsg(err);
    console.error('[Payment/verify]', msg);
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/payments/retry-order/:bookingId ───────────────────────────────
// Creates a fresh Razorpay order for an existing awaiting_payment booking
// (previous order may have expired)
router.post('/retry-order/:bookingId', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user.id,
      status: 'awaiting_payment',
    }).populate('vehicle', 'name icon city price_day');

    if (!booking) return res.status(404).json({ error: 'Booking not found or already paid/cancelled' });

    const vehicle = booking.vehicle;
    const s = new Date(booking.start_date), e = new Date(booking.end_date);
    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));

    // Create a fresh Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: booking.total_price * 100,
      currency: 'INR',
      receipt: `rty_${booking._id}`,
      notes: { vehicle: vehicle.name, start_date: booking.start_date, end_date: booking.end_date },
    });

    // Update the booking with new order id
    booking.razorpay_order_id = rzpOrder.id;
    await booking.save();

    res.json({
      key: RZP_KEY_ID,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      booking_id: booking._id,
      vehicle: { name: vehicle.name, icon: vehicle.icon, city: vehicle.city },
      days,
      total_price: booking.total_price,
    });
  } catch (err) {
    const msg = rzpErrMsg(err);
    console.error('[Payment/retry-order]', msg);
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/payments/cancel-order ─────────────────────────────────────────
// Called when user closes Razorpay modal without paying
router.post('/cancel-order', requireAuth, async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (booking_id) {
      await Booking.findOneAndUpdate(
        { _id: booking_id, user: req.user.id, status: 'awaiting_payment' },
        { status: 'cancelled' }
      );
    }
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
