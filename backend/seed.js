/**
 * Seed file — populates the database with sample users and properties.
 *
 * Usage:
 *   node seed.js          → clears existing data then inserts seed data
 *   node seed.js --clear  → only clears seed data (no insert)
 *
 * Credentials after seeding:
 *   admin@realestate.com   / Admin@123
 *   seller1@example.com    / Seller@123
 *   seller2@example.com    / Seller@123
 *   buyer1@example.com     / Buyer@123
 *   buyer2@example.com     / Buyer@123
 *   buyer3@example.com     / Buyer@123
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Property from './models/Property.js';
import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/RealEstate';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hash = async (plain) => bcrypt.hash(plain, 10);

// Placeholder image URLs (publicly accessible, no auth required)
const IMG = {
  house1:  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  house2:  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  house3:  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  apt1:    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  apt2:    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  condo1:  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  condo2:  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  land1:   'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
  comm1:   'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
  comm2:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const buildUsers = async () => [
  {
    name: 'Abebe Girma',
    email: 'admin@realestate.com',
    password: await hash('Admin@123'),
    role: 'admin',
    phoneNumber: '+251-911-000-001',
    profileImage: '',
  },
  {
    name: 'Tigist Haile',
    email: 'seller1@example.com',
    password: await hash('Seller@123'),
    role: 'seller',
    phoneNumber: '+251-911-100-001',
    bankAccount: {
      bankName: 'Commercial Bank of Ethiopia',
      accountHolderName: 'Tigist Haile',
      accountNumber: '1000123456789',
      routingNumber: 'CBE001',
      instructions: 'Use property title as transfer reference.',
    },
  },
  {
    name: 'Dawit Bekele',
    email: 'seller2@example.com',
    password: await hash('Seller@123'),
    role: 'seller',
    phoneNumber: '+251-911-100-002',
    bankAccount: {
      bankName: 'Awash Bank',
      accountHolderName: 'Dawit Bekele',
      accountNumber: '0132456789012',
      routingNumber: 'AWB002',
      instructions: 'Contact seller after transfer for confirmation.',
    },
  },
  {
    name: 'Selam Tesfaye',
    email: 'buyer1@example.com',
    password: await hash('Buyer@123'),
    role: 'buyer',
    phoneNumber: '+251-911-200-001',
  },
  {
    name: 'Yonas Alemu',
    email: 'buyer2@example.com',
    password: await hash('Buyer@123'),
    role: 'buyer',
    phoneNumber: '+251-911-200-002',
  },
  {
    name: 'Meron Tadesse',
    email: 'buyer3@example.com',
    password: await hash('Buyer@123'),
    role: 'buyer',
    phoneNumber: '+251-911-200-003',
  },
];

const buildProperties = (seller1Id, seller2Id) => [
  // ── Tigist's listings ─────────────────────────────────────────────────────
  {
    title: 'Modern Family Home in Tabor',
    description:
      'A beautifully designed 4-bedroom family home located in the Tabor area of Hawassa. Features an open-plan kitchen, spacious living areas, a private garden, and a double garage. Close to Tabor Hill and local schools.',
    price: 450000,
    type: 'house',
    status: 'Available',
    location: {
      address: 'Tabor Kebele 04',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0621, lng: 38.4764 },
    },
    features: {
      bedrooms: 4,
      bathrooms: 3,
      area: 280,
      parking: true,
      furnished: false,
    },
    amenities: ['Garden', 'Garage', 'Security', 'Generator'],
    images: [IMG.house1, IMG.house2],
    owner: seller1Id,
  },
  {
    title: 'Luxury Apartment — Haile Resort Area',
    description:
      'High-floor luxury apartment with panoramic views of Lake Hawassa. Fully furnished with premium finishes, 24/7 security, gym access, and rooftop terrace. Ideal for professionals or expats working in Hawassa.',
    price: 320000,
    type: 'apartment',
    status: 'Available',
    location: {
      address: 'Haile Resort Road, Kebele 06',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0523, lng: 38.4812 },
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      parking: true,
      furnished: true,
    },
    amenities: ['Lake View', 'Gym', 'Rooftop', 'Security', 'Concierge'],
    images: [IMG.apt1, IMG.apt2],
    owner: seller1Id,
  },
  {
    title: 'Cozy Studio Apartment — Referral Hospital Area',
    description:
      'Compact and well-maintained studio apartment near Hawassa University Referral Hospital. Perfect for a medical professional or student. Close to public transport and local markets.',
    price: 75000,
    type: 'apartment',
    status: 'Available',
    location: {
      address: 'Referral Hospital Road, Kebele 03',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0589, lng: 38.4701 },
    },
    features: {
      bedrooms: 1,
      bathrooms: 1,
      area: 55,
      parking: false,
      furnished: true,
    },
    amenities: ['Security', 'Water Tank'],
    images: [IMG.apt2],
    owner: seller1Id,
  },
  {
    title: 'Commercial Office Space — Piazza Hawassa',
    description:
      'Prime commercial office space on the 3rd floor of a modern building in Hawassa Piazza. Open-plan layout suitable for up to 25 staff. Includes 2 meeting rooms and a reception area. High foot traffic location.',
    price: 600000,
    type: 'commercial',
    status: 'Available',
    location: {
      address: 'Piazza, Kebele 01',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0631, lng: 38.4778 },
    },
    features: {
      bedrooms: 0,
      bathrooms: 2,
      area: 420,
      parking: true,
      furnished: false,
    },
    amenities: ['Elevator', 'Generator', 'Security', 'Parking'],
    images: [IMG.comm1, IMG.comm2],
    owner: seller1Id,
  },
  {
    title: 'Residential Land Plot — Addis Ketema',
    description:
      'Flat residential land plot in the developing Addis Ketema sub-city of Hawassa. All utilities available at the boundary. Title deed ready for transfer. Ideal for building a family home.',
    price: 180000,
    type: 'land',
    status: 'Available',
    location: {
      address: 'Addis Ketema, Kebele 09, Plot 22',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0712, lng: 38.4634 },
    },
    features: {
      bedrooms: 0,
      bathrooms: 0,
      area: 500,
      parking: false,
      furnished: false,
    },
    amenities: ['Title Deed', 'Road Access', 'Electricity', 'Water'],
    images: [IMG.land1],
    owner: seller1Id,
  },

  // ── Dawit's listings ──────────────────────────────────────────────────────
  {
    title: 'Elegant Villa — Millennium Area',
    description:
      'Stunning 5-bedroom villa near the Hawassa Millennium Park. Features a large garden, landscaped compound, staff quarters, and a 2-car garage. Gated with 24/7 security and lake breeze views.',
    price: 950000,
    type: 'house',
    status: 'Available',
    location: {
      address: 'Millennium Park Road, Kebele 05',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0498, lng: 38.4856 },
    },
    features: {
      bedrooms: 5,
      bathrooms: 4,
      area: 520,
      parking: true,
      furnished: true,
    },
    amenities: ['Garden', 'Staff Quarters', 'Garage', 'Security', 'Generator', 'Lake View'],
    images: [IMG.house2, IMG.house3],
    owner: seller2Id,
  },
  {
    title: 'Modern Condo — Hawassa University Area',
    description:
      'Contemporary 2-bedroom condo in a newly built complex near Hawassa University main campus. Open-plan living, modern kitchen, balcony. Building has underground parking and 24/7 security.',
    price: 210000,
    type: 'condo',
    status: 'Available',
    location: {
      address: 'University Road, Kebele 07',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0556, lng: 38.4923 },
    },
    features: {
      bedrooms: 2,
      bathrooms: 2,
      area: 120,
      parking: true,
      furnished: false,
    },
    amenities: ['Balcony', 'Underground Parking', 'Security', 'Water Tank'],
    images: [IMG.condo1, IMG.condo2],
    owner: seller2Id,
  },
  {
    title: 'Townhouse — Misrak (East) Hawassa',
    description:
      'Spacious 3-bedroom townhouse in the Misrak sub-city of Hawassa. Two floors, private courtyard, and a rooftop terrace with views toward the Bale Mountains. Quiet neighbourhood with easy ring-road access.',
    price: 290000,
    type: 'house',
    status: 'Available',
    location: {
      address: 'Misrak Sub-city, Kebele 11',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0445, lng: 38.5023 },
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 200,
      parking: true,
      furnished: false,
    },
    amenities: ['Rooftop Terrace', 'Courtyard', 'Security'],
    images: [IMG.house3, IMG.house1],
    owner: seller2Id,
  },
  {
    title: 'Retail Shop Space — Hawassa Commercial Centre',
    description:
      'Ground-floor retail space in the busy Hawassa Commercial Centre near the main bus station. High foot traffic, large display windows, and a storage room at the back. Suitable for a boutique, café, or pharmacy.',
    price: 380000,
    type: 'commercial',
    status: 'Available',
    location: {
      address: 'Commercial Centre, Kebele 02',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0645, lng: 38.4745 },
    },
    features: {
      bedrooms: 0,
      bathrooms: 1,
      area: 90,
      parking: false,
      furnished: false,
    },
    amenities: ['Display Windows', 'Storage Room', 'High Foot Traffic'],
    images: [IMG.comm2],
    owner: seller2Id,
  },
  {
    title: 'Furnished Apartment — Hawassa Lake Shore',
    description:
      'Fully furnished 2-bedroom apartment just minutes from the Hawassa Lake promenade. Modern appliances, fast internet, dedicated parking, and stunning lake views from the balcony. Available for long-term rental or purchase.',
    price: 155000,
    type: 'apartment',
    status: 'Available',
    location: {
      address: 'Lake Shore Road, Kebele 08',
      city: 'Hawassa',
      state: 'Sidama',
      zipCode: '1700',
      coordinates: { lat: 7.0512, lng: 38.4789 },
    },
    features: {
      bedrooms: 2,
      bathrooms: 1,
      area: 95,
      parking: true,
      furnished: true,
    },
    amenities: ['Lake View', 'Internet', 'Security', 'Parking', 'Water Tank'],
    images: [IMG.apt1, IMG.condo2],
    owner: seller2Id,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  const clearOnly = process.argv.includes('--clear');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing seed data
    await User.deleteMany({});
    await Property.deleteMany({});
    console.log('🗑️  Cleared existing users and properties');

    if (clearOnly) {
      console.log('✅ Clear complete. Exiting.');
      process.exit(0);
    }

    // Insert users
    const userData = await buildUsers();
    const users = await User.insertMany(userData);

    const admin   = users.find(u => u.role === 'admin');
    const seller1 = users.find(u => u.email === 'seller1@example.com');
    const seller2 = users.find(u => u.email === 'seller2@example.com');

    console.log(`👤 Inserted ${users.length} users`);

    // Insert properties
    const propertyData = buildProperties(seller1._id, seller2._id);
    const properties = await Property.insertMany(propertyData);
    console.log(`🏠 Inserted ${properties.length} properties`);

    console.log('\n─────────────────────────────────────────');
    console.log('🎉 Seed complete! Login credentials:');
    console.log('─────────────────────────────────────────');
    console.log('  Admin   → admin@realestate.com    / Admin@123  (Abebe Girma)');
    console.log('  Seller1 → seller1@example.com     / Seller@123 (Tigist Haile)');
    console.log('  Seller2 → seller2@example.com     / Seller@123 (Dawit Bekele)');
    console.log('  Buyer1  → buyer1@example.com      / Buyer@123  (Selam Tesfaye)');
    console.log('  Buyer2  → buyer2@example.com      / Buyer@123  (Yonas Alemu)');
    console.log('  Buyer3  → buyer3@example.com      / Buyer@123  (Meron Tadesse)');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
