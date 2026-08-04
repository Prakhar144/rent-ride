const mongoose = require('mongoose');

// ─── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, default: null },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// ─── Vehicle ───────────────────────────────────────────────────────────────────
const vehicleSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  type:         { type: String, enum: ['Car', 'Bike', 'Scooter'], required: true },
  city:         { type: String, required: true },
  icon:         { type: String, default: '🚗' },
  price_day:    { type: Number, required: true, min: 1 },
  seats:        { type: Number, default: null },
  fuel:         { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'CNG'], default: 'Petrol' },
  transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  description:  { type: String, default: '' },
  available:    { type: Boolean, default: true },
}, { timestamps: true });

// ─── Booking ───────────────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  user:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle:             { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  start_date:          { type: String, required: true },   // YYYY-MM-DD
  end_date:            { type: String, required: true },
  total_price:         { type: Number, required: true },
  status: {
    type: String,
    enum: ['awaiting_payment', 'pending', 'confirmed', 'cancelled'],
    default: 'awaiting_payment',
  },
  razorpay_order_id:   { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
}, { timestamps: true });

const User    = mongoose.model('User',    userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { User, Vehicle, Booking };
