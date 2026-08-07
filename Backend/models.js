const mongoose = require('mongoose');

// ─── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, default: null },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
  status:    { type: String, enum: ['active', 'blocked'], default: 'active' },
}, { timestamps: true });

// ─── Vehicle ───────────────────────────────────────────────────────────────────
const vehicleSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  type:         { type: String, enum: ['Car', 'Bike', 'Scooter'], required: true },
  city:         { type: String, required: true },
  icon:         { type: String, default: '🚗' },
  image_url:    { type: String, default: null },
  price_day:    { type: Number, required: true, min: 1 },
  seats:        { type: Number, default: null },
  fuel:         { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'CNG'], default: 'Petrol' },
  transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  description:  { type: String, default: '' },
  available:    { type: Boolean, default: true },
  vendor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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
    enum: ['pending_dispatch', 'awaiting_payment', 'pending', 'confirmed', 'cancelled'],
    default: 'pending_dispatch',
  },
  assigned_vendor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  razorpay_order_id:   { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
  // ── City Ride fields ──────────────────────────────────────────────────────
  ride_type:           { type: String, enum: ['daily', 'city_ride'], default: 'daily' },
  pickup_address:      { type: String, default: null },
  drop_address:        { type: String, default: null },
  distance_km:         { type: Number, default: null },
}, { timestamps: true });

// ─── Activity Log ──────────────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:  { type: String, required: true },
  details: { type: String, default: '' },
}, { timestamps: true });

const User       = mongoose.model('User', userSchema);
const Vehicle    = mongoose.model('Vehicle', vehicleSchema);
const Booking    = mongoose.model('Booking', bookingSchema);
const ActivityLog= mongoose.model('ActivityLog', activityLogSchema);

module.exports = { User, Vehicle, Booking, ActivityLog };
