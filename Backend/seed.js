const bcrypt = require('bcryptjs');
const { User, Vehicle } = require('./models');

async function seedDB() {
  // ── Seed admin if no users exist ──────────────────────────────────────────
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const adminPw = bcrypt.hashSync('admin@123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@rentride.com',
      phone: '9999999999',
      password: adminPw,
      role: 'admin',
    });
    console.log('[Seed] Admin user created: admin@rentride.com / admin@123');
  }

  // ── Seed vehicles if none exist ───────────────────────────────────────────
  const vehicleCount = await Vehicle.countDocuments();
  if (vehicleCount === 0) {
    console.log('[Seed] Seeding vehicles...');
    await Vehicle.insertMany([

      // ── Lucknow ─────────────────────────────────────────────────────────
      { name: 'Honda Activa 6G', type: 'Scooter', city: 'Lucknow', icon: '🛵', price_day: 400, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Most popular scooter for smooth Lucknow city rides.' },
      { name: 'Hero Splendor+', type: 'Bike', city: 'Lucknow', icon: '🏍️', price_day: 450, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: "India's most reliable commuter — perfect for daily city trips." },
      { name: 'Royal Enfield Bullet 350', type: 'Bike', city: 'Lucknow', icon: '🏍️', price_day: 1100, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Classic cruiser for heritage Lucknow tours.' },
      { name: 'Maruti Swift', type: 'Car', city: 'Lucknow', icon: '🚗', price_day: 1400, seats: 5, fuel: 'Petrol', transmission: 'Manual', description: 'Compact hatchback great for city and highway.' },
      { name: 'Hyundai Creta', type: 'Car', city: 'Lucknow', icon: '🚗', price_day: 2400, seats: 5, fuel: 'Petrol', transmission: 'Automatic', description: 'Premium SUV with spacious cabin and modern tech.' },
      { name: 'TVS Jupiter', type: 'Scooter', city: 'Lucknow', icon: '🛵', price_day: 380, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Comfortable family scooter — great mileage.' },

      // ── Delhi ─────────────────────────────────────────────────────────
      { name: 'Maruti Swift', type: 'Car', city: 'Delhi', icon: '🚗', price_day: 1500, seats: 5, fuel: 'Petrol', transmission: 'Manual', description: 'Compact hatchback perfect for city drives.' },
      { name: 'Royal Enfield Classic 350', type: 'Bike', city: 'Delhi', icon: '🏍️', price_day: 900, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Iconic cruiser for long heritage highway rides.' },
      { name: 'Honda Activa 6G', type: 'Scooter', city: 'Delhi', icon: '🛵', price_day: 400, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Best-selling scooter, smooth city commuter.' },
      { name: 'Tata Nexon EV', type: 'Car', city: 'Delhi', icon: '🚗', price_day: 2200, seats: 5, fuel: 'Electric', transmission: 'Automatic', description: 'Zero-emission compact SUV — eco-friendly city rides.' },

      // ── Mumbai ────────────────────────────────────────────────────────
      { name: 'Hyundai i20', type: 'Car', city: 'Mumbai', icon: '🚗', price_day: 1800, seats: 5, fuel: 'Petrol', transmission: 'Manual', description: 'Premium hatchback with a sporty feel.' },
      { name: 'Honda Activa', type: 'Scooter', city: 'Mumbai', icon: '🛵', price_day: 450, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Reliable scooter for Mumbai traffic.' },
      { name: 'Tata Nexon EV', type: 'Car', city: 'Mumbai', icon: '🚗', price_day: 2200, seats: 5, fuel: 'Electric', transmission: 'Automatic', description: 'Eco-friendly compact SUV, zero emissions.' },
      { name: 'Bajaj Pulsar 150', type: 'Bike', city: 'Mumbai', icon: '🏍️', price_day: 700, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Stylish commuter bike for Mumbai streets.' },

      // ── Bangalore ─────────────────────────────────────────────────────
      { name: 'KTM Duke 390', type: 'Bike', city: 'Bangalore', icon: '🏍️', price_day: 1200, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'High-performance naked streetfighter.' },
      { name: 'Toyota Innova', type: 'Car', city: 'Bangalore', icon: '🚗', price_day: 2800, seats: 7, fuel: 'Diesel', transmission: 'Manual', description: 'Spacious MPV, great for family trips.' },
      { name: 'TVS NTORQ 125', type: 'Scooter', city: 'Bangalore', icon: '🛵', price_day: 480, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Sporty scooter with smart Bluetooth connectivity.' },

      // ── Chennai ───────────────────────────────────────────────────────
      { name: 'TVS Jupiter', type: 'Scooter', city: 'Chennai', icon: '🛵', price_day: 380, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Comfortable family scooter.' },
      { name: 'Hyundai Creta', type: 'Car', city: 'Chennai', icon: '🚗', price_day: 2500, seats: 5, fuel: 'Petrol', transmission: 'Automatic', description: 'Popular mid-size SUV with premium interior.' },
      { name: 'Bajaj Dominar 400', type: 'Bike', city: 'Chennai', icon: '🏍️', price_day: 950, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Powerful tourer for highway adventures.' },

      // ── Hyderabad ─────────────────────────────────────────────────────
      { name: 'Bajaj Pulsar NS200', type: 'Bike', city: 'Hyderabad', icon: '🏍️', price_day: 750, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Sporty naked street bike.' },
      { name: 'Maruti Baleno', type: 'Car', city: 'Hyderabad', icon: '🚗', price_day: 1700, seats: 5, fuel: 'Petrol', transmission: 'Manual', description: 'Sleek premium hatchback.' },
      { name: 'Ola S1 Pro', type: 'Scooter', city: 'Hyderabad', icon: '🛵', price_day: 600, seats: 2, fuel: 'Electric', transmission: 'Automatic', description: 'Electric scooter — zero fuel costs.' },

      // ── Kolkata ───────────────────────────────────────────────────────
      { name: 'Honda Dio', type: 'Scooter', city: 'Kolkata', icon: '🛵', price_day: 420, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Trendy scooter for city errands.' },
      { name: 'Tata Nexon', type: 'Car', city: 'Kolkata', icon: '🚗', price_day: 2000, seats: 5, fuel: 'Petrol', transmission: 'Manual', description: 'Compact SUV with bold styling.' },

      // ── Pune ──────────────────────────────────────────────────────────
      { name: 'Yamaha FZ-S', type: 'Bike', city: 'Pune', icon: '🏍️', price_day: 650, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Stylish commuter with V2 engine.' },
      { name: 'Mahindra XUV300', type: 'Car', city: 'Pune', icon: '🚗', price_day: 2200, seats: 5, fuel: 'Petrol', transmission: 'Manual', description: 'Feature-loaded compact SUV.' },

      // ── Goa ───────────────────────────────────────────────────────────
      { name: 'Activa 6G Goa Edition', type: 'Scooter', city: 'Goa', icon: '🛵', price_day: 500, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Perfect beach-hopping companion.' },
      { name: 'Jeep Compass', type: 'Car', city: 'Goa', icon: '🚗', price_day: 3500, seats: 5, fuel: 'Diesel', transmission: 'Automatic', description: 'Adventure SUV for Goa hill roads.' },
      { name: 'Royal Enfield Meteor 350', type: 'Bike', city: 'Goa', icon: '🏍️', price_day: 1000, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Laid-back cruiser for coastal Goa roads.' },

      // ── Jaipur ────────────────────────────────────────────────────────
      { name: 'Royal Enfield Meteor 350', type: 'Bike', city: 'Jaipur', icon: '🏍️', price_day: 1000, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: 'Relaxed cruiser for Rajasthan highways.' },
      { name: 'Swift Dzire', type: 'Car', city: 'Jaipur', icon: '🚗', price_day: 1600, seats: 5, fuel: 'CNG', transmission: 'Manual', description: 'Economy sedan, great fuel efficiency.' },
      { name: 'Honda Activa 6G', type: 'Scooter', city: 'Jaipur', icon: '🛵', price_day: 380, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Easy city rides around Pink City.' },

      // ── Ahmedabad ─────────────────────────────────────────────────────
      { name: 'Hero Splendor+', type: 'Bike', city: 'Ahmedabad', icon: '🏍️', price_day: 500, seats: 2, fuel: 'Petrol', transmission: 'Manual', description: "India's most popular commuter bike." },
      { name: 'Kia Seltos', type: 'Car', city: 'Ahmedabad', icon: '🚗', price_day: 2300, seats: 5, fuel: 'Petrol', transmission: 'Automatic', description: 'Tech-loaded compact SUV with panoramic roof.' },
      { name: 'TVS NTORQ 125', type: 'Scooter', city: 'Ahmedabad', icon: '🛵', price_day: 450, seats: 2, fuel: 'Petrol', transmission: 'Automatic', description: 'Sporty and connected scooter.' },

    ]);
    console.log('[Seed] 35 vehicles seeded across 11 cities (incl. Lucknow).');
  }
}

module.exports = { seedDB };
