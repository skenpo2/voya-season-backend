import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Admin } from '../models/Admin.model';
import { Car } from '../models/Car.model';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@voya.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      return;
    }

    // Create admin
    await Admin.create({
      name: 'Super Admin',
      email: 'hello@voyaapp.co',
      password: 'hello@voyaadmin2453#!$$',
      role: 'super_admin',
    });

    console.log('✅ Admin created successfully');
    console.log('📧 Email: admin@voya.com');
    console.log('🔑 Password: admin123456');
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  }
};

const seedCars = async () => {
  try {
    // Clear existing cars
    await Car.deleteMany({});
    console.log('🗑️  Cleared existing cars');

    const cars = [
      // SEDANS
      {
        name: 'Tesla Model 3',
        price: 45000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
          'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&q=80',
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Electric',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 5.0,
        trips: 47,
        available: true,
        status: 'available',
        amenities: [
          'Autopilot',
          'Premium Sound System',
          'Glass Roof',
          'USB-C Charging',
        ],
      },
      {
        name: 'Mercedes-Benz E-Class',
        price: 38000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.9,
        trips: 62,
        available: true,
        status: 'available',
        amenities: ['Leather Seats', 'Sunroof', 'Navigation', 'Heated Seats'],
      },
      {
        name: 'BMW 5 Series',
        price: 36000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
          'https://images.unsplash.com/photo-1556189250-72ba954e6700?w=800&q=80',
          'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Diesel',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.8,
        trips: 38,
        available: true,
        status: 'available',
        amenities: [
          'Sport Package',
          'Premium Audio',
          'Adaptive Cruise',
          'Wireless Charging',
        ],
      },
      {
        name: 'Audi A6',
        price: 34000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80',
          'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=800&q=80',
          'https://images.unsplash.com/photo-1610768764270-790fbec18178?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.7,
        trips: 29,
        available: true,
        status: 'available',
        amenities: [
          'Virtual Cockpit',
          'Matrix LED',
          'Bang & Olufsen',
          'Massage Seats',
        ],
      },
      {
        name: 'Toyota Camry',
        price: 25000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
          'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80',
          'https://images.unsplash.com/photo-1627454820516-2af4cbc96c33?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Hybrid',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.9,
        trips: 84,
        available: true,
        status: 'available',
        amenities: [
          'Hybrid System',
          'Safety Sense',
          'Apple CarPlay',
          'Lane Assist',
        ],
      },
      {
        name: 'Honda Accord',
        price: 24000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80',
          'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80',
          'https://images.unsplash.com/photo-1606220588913-b3aad584509c?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2023,
          transmission: 'Auto',
        },
        rating: 4.8,
        trips: 71,
        available: true,
        status: 'available',
        amenities: [
          'Honda Sensing',
          'Wireless Android Auto',
          'Power Seats',
          'Dual Climate',
        ],
      },
      {
        name: 'Lexus ES',
        price: 32000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Hybrid',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 5.0,
        trips: 42,
        available: true,
        status: 'available',
        amenities: [
          'Mark Levinson Audio',
          'Panoramic Roof',
          'Ventilated Seats',
          'HUD',
        ],
      },
      {
        name: 'Genesis G80',
        price: 35000,
        type: 'Sedan',
        images: [
          'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.9,
        trips: 23,
        available: true,
        status: 'available',
        amenities: [
          'Luxury Interior',
          '360 Camera',
          'Highway Assist',
          'Premium Leather',
        ],
      },

      // SUVs
      {
        name: 'Range Rover Sport',
        price: 55000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800&q=80',
          'https://images.unsplash.com/photo-1609520505218-742124c37459?w=800&q=80',
          'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
        ],
        features: {
          seats: 7,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2025,
          transmission: 'Auto',
        },
        rating: 5.0,
        trips: 31,
        available: true,
        status: 'available',
        amenities: [
          'Terrain Response',
          'Air Suspension',
          'Meridian Sound',
          'Pivi Pro',
        ],
      },
      {
        name: 'BMW X5',
        price: 48000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
          'https://images.unsplash.com/photo-1556189250-72ba954e6700?w=800&q=80',
          'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
        ],
        features: {
          seats: 7,
          fuel: 'Diesel',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.9,
        trips: 56,
        available: true,
        status: 'available',
        amenities: [
          'M Sport Package',
          'Panoramic Roof',
          'Harman Kardon',
          'Gesture Control',
        ],
      },
      {
        name: 'Mercedes-Benz GLE',
        price: 52000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
        ],
        features: {
          seats: 7,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.8,
        trips: 44,
        available: true,
        status: 'available',
        amenities: [
          'MBUX System',
          'Air Body Control',
          '3rd Row',
          'Burmester Audio',
        ],
      },
      {
        name: 'Audi Q7',
        price: 46000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80',
          'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=800&q=80',
          'https://images.unsplash.com/photo-1610768764270-790fbec18178?w=800&q=80',
        ],
        features: {
          seats: 7,
          fuel: 'Diesel',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.7,
        trips: 39,
        available: true,
        status: 'available',
        amenities: [
          'Quattro AWD',
          'Virtual Cockpit Plus',
          'Matrix LED',
          'Adaptive Air',
        ],
      },
      {
        name: 'Lexus RX',
        price: 44000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1570303478954-27145d84e595?w=800&q=80',
        ],
        features: {
          seats: 7,
          fuel: 'Hybrid',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 5.0,
        trips: 51,
        available: true,
        status: 'available',
        amenities: [
          'Lexus Safety System+',
          'Mark Levinson',
          'Panoramic View',
          'HUD',
        ],
      },
      {
        name: 'Porsche Cayenne',
        price: 58000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80',
          'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=80',
          'https://images.unsplash.com/photo-1611859328053-3720520535c9?w=800&q=80',
        ],
        features: {
          seats: 5,
          fuel: 'Petrol',
          duration: '12 hours',
          year: 2025,
          transmission: 'Auto',
        },
        rating: 5.0,
        trips: 27,
        available: true,
        status: 'available',
        amenities: [
          'Sport Chrono',
          'PASM',
          'Bose Surround',
          'Active Suspension',
        ],
      },
      {
        name: 'Volvo XC90',
        price: 42000,
        type: 'SUV',
        images: [
          'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800&q=80',
        ],
        features: {
          seats: 7,
          fuel: 'Hybrid',
          duration: '12 hours',
          year: 2024,
          transmission: 'Auto',
        },
        rating: 4.9,
        trips: 48,
        available: true,
        status: 'available',
        amenities: [
          'City Safety',
          'Pilot Assist',
          'Bowers & Wilkins',
          'Air Suspension',
        ],
      },
    ];

    await Car.insertMany(cars);
    console.log(`✅ Successfully seeded ${cars.length} cars`);
    console.log(`   - ${cars.filter((c) => c.type === 'Sedan').length} Sedans`);
    console.log(`   - ${cars.filter((c) => c.type === 'SUV').length} SUVs`);
  } catch (error) {
    console.error('❌ Error seeding cars:', error);
    throw error;
  }
};

const seed = async () => {
  try {
    console.log('🌱 Starting seed process...\n');

    // Connect to database
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/voya-rental';
    await mongoose.connect(mongoURI);
    console.log('✅ Database connected\n');

    // Seed admin
    console.log('👤 Seeding admin...');
    await seedAdmin();
    console.log('');

    // Seed cars
    console.log('🚗 Seeding cars...');
    await seedCars();
    console.log('');

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  }
};

// Run seed
seed();
