const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  console.log('mysql2 not available');
}

try { require('dotenv').config(); } catch (e) { }

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'masakali_secret_2024';
const CLOVER_MENU_URL = 'https://www.clover.com/oloservice/v1/merchants/P62BGGNV7NPE1/menu?orderType=PICKUP';
const IP_API_BASE_URL = 'http://ip-api.com/json';

// =====================================================
// Middleware
// =====================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Serve logo files
app.use('/logo', express.static(path.join(__dirname, 'logo')));

// =====================================================
// Database Connection
// =====================================================
let db = null;

async function initDB() {
  if (!mysql) return;
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'sv63.ifastnet12.org',
      user: process.env.DB_USER || 'masakali_kiran',
      password: process.env.DB_PASS || 'K143iran',
      database: process.env.DB_NAME || 'masakali_california',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 10,
    });
    const [rows] = await db.query('SELECT 1');
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'branch_admin', 'staff') DEFAULT 'staff',
        restaurant_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS geolocation_latitude DECIMAL(10, 8) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS geolocation_longitude DECIMAL(11, 8) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS geolocation_accuracy_meters DECIMAL(10, 2) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS geolocation_captured_at DATETIME NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS geolocation_source VARCHAR(50) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS request_ip VARCHAR(45) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS request_user_agent TEXT NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS request_browser VARCHAR(120) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS request_os VARCHAR(120) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS request_device_type VARCHAR(30) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_lookup_status VARCHAR(20) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_lookup_message VARCHAR(255) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_country VARCHAR(100) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_region VARCHAR(100) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_city VARCHAR(100) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_zip VARCHAR(20) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_latitude DECIMAL(10, 8) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_longitude DECIMAL(11, 8) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_timezone VARCHAR(80) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_isp VARCHAR(150) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_org VARCHAR(150) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_as VARCHAR(150) NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_mobile BOOLEAN NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_proxy BOOLEAN NULL');
      await db.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ip_hosting BOOLEAN NULL');

      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS request_ip VARCHAR(45) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS request_user_agent TEXT NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS request_browser VARCHAR(120) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS request_os VARCHAR(120) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS request_device_type VARCHAR(30) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_lookup_status VARCHAR(20) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_lookup_message VARCHAR(255) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_country VARCHAR(100) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_region VARCHAR(100) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_city VARCHAR(100) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_zip VARCHAR(20) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_latitude DECIMAL(10, 8) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_longitude DECIMAL(11, 8) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_timezone VARCHAR(80) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_isp VARCHAR(150) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_org VARCHAR(150) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_as VARCHAR(150) NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_mobile BOOLEAN NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_proxy BOOLEAN NULL');
      await db.query('ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS ip_hosting BOOLEAN NULL');

      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS request_ip VARCHAR(45) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS request_user_agent TEXT NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS request_browser VARCHAR(120) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS request_os VARCHAR(120) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS request_device_type VARCHAR(30) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_lookup_status VARCHAR(20) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_lookup_message VARCHAR(255) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_country VARCHAR(100) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_region VARCHAR(100) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_city VARCHAR(100) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_zip VARCHAR(20) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_latitude DECIMAL(10, 8) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_longitude DECIMAL(11, 8) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_timezone VARCHAR(80) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_isp VARCHAR(150) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_org VARCHAR(150) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_as VARCHAR(150) NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_mobile BOOLEAN NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_proxy BOOLEAN NULL');
      await db.query('ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS ip_hosting BOOLEAN NULL');
    } catch (migrationErr) {
      console.log('Reservation geolocation columns migration skipped:', migrationErr.message);
    }
    console.log('✓ MySQL database connected');
  } catch (err) {
    console.log('✗ Database not available, using mock data:', err.message);
    db = null;
  }
}

// =====================================================
// Mock Data (fallback when no DB)
// =====================================================
const mockRestaurants = [
  { id: 1, name: 'Masakali Indian Cuisine – Wellington', slug: 'wellington', brand: 'Masakali Indian Cuisine', address: '1111 Wellington St. W', city: 'Ottawa', province_state: 'Ontario', country: 'Canada', phone: '(613) 792-9777', email: 'wellington@masakali.ca', website: 'https://masakaliottawa.ca', is_active: true },
  { id: 2, name: 'Masakali Indian Cuisine – Stittsville', slug: 'stittsville', brand: 'Masakali Indian Cuisine', address: '5507 Hazeldean Rd Unit C3-1', city: 'Stittsville', province_state: 'Ontario', country: 'Canada', phone: '(613) 878-3939', email: 'stittsville@masakali.ca', website: 'https://masakaliottawa.ca', is_active: true },
  { id: 3, name: 'Masakali Indian Cuisine – Montreal', slug: 'montreal', brand: 'Masakali Indian Cuisine', address: '1015 Sherbrooke St W', city: 'Montreal', province_state: 'Quebec', country: 'Canada', phone: '(514) 228-6777', email: 'montreal@masakali.ca', website: 'https://masakalimontreal.ca', is_active: true },
  { id: 4, name: 'RangDe Indian Cuisine', slug: 'rangde', brand: 'RangDe Indian Cuisine', address: '700 March Rd Unit H', city: 'Kanata', province_state: 'Ontario', country: 'Canada', phone: '(613) 595-0777', email: 'info@rangdeottawa.com', website: 'https://rangdeottawa.com', is_active: true },
  { id: 5, name: 'Masakali Indian Resto Bar', slug: 'restobar', brand: 'Masakali Restobar', address: '97 Clarence St.', city: 'Ottawa', province_state: 'Ontario', country: 'Canada', phone: '(613) 789-6777', email: 'info@masakalirestrobar.ca', website: 'https://masakalirestrobar.ca', is_active: true },
  { id: 6, name: 'Masakali Indian Cuisine – California', slug: 'california', brand: 'Masakali Indian Cuisine', address: '10310 S De Anza Blvd', city: 'Cupertino', province_state: 'California', country: 'USA', phone: '', email: 'contact@masakalicalifornia.com', website: 'https://masakalicalifornia.com', is_active: true },
];

function normalizeSpiceLevel(value) {
  const normalized = String(value || '').toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'mild' || normalized === 'medium' || normalized === 'hot' || normalized === 'extra_hot') {
    return normalized;
  }
  return 'medium';
}

function numericId(value, fallbackSeed) {
  const raw = String(value ?? '').trim();
  if (/^\d+$/.test(raw)) return Number(raw);

  const source = raw || String(fallbackSeed || '0');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) + 1;
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value);
  return [];
}

function parseReservationGeolocation(geolocation) {
  if (!geolocation || typeof geolocation !== 'object') return null;

  const latitude = Number(geolocation.latitude);
  const longitude = Number(geolocation.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const accuracy = Number(geolocation.accuracy);
  const capturedAtRaw = geolocation.captured_at || geolocation.capturedAt;
  const capturedAtDate = capturedAtRaw ? new Date(capturedAtRaw) : null;

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? Math.max(accuracy, 0) : null,
    captured_at: capturedAtDate && !Number.isNaN(capturedAtDate.getTime())
      ? capturedAtDate.toISOString().slice(0, 19).replace('T', ' ')
      : null,
    source: String(geolocation.source || 'browser_geolocation').slice(0, 50),
  };
}

function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfIp = req.headers['cf-connecting-ip'];
  const remoteIp = req.socket?.remoteAddress;
  const candidate = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]
    || (Array.isArray(realIp) ? realIp[0] : realIp)
    || (Array.isArray(cfIp) ? cfIp[0] : cfIp)
    || remoteIp
    || req.ip
    || '';

  const cleaned = String(candidate).trim().replace(/^::ffff:/, '');
  return cleaned || null;
}

function isPrivateIp(ip) {
  if (!ip) return true;
  const value = String(ip).toLowerCase();
  if (value === '::1' || value === '127.0.0.1' || value === 'localhost') return true;
  if (value.startsWith('10.') || value.startsWith('192.168.') || value.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return true;
  if (value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')) return true;
  return false;
}

function parseUserAgent(ua) {
  const source = String(ua || '').toLowerCase();

  let browser = 'Unknown';
  if (source.includes('edg/')) browser = 'Edge';
  else if (source.includes('opr/') || source.includes('opera')) browser = 'Opera';
  else if (source.includes('chrome/')) browser = 'Chrome';
  else if (source.includes('safari/') && !source.includes('chrome/')) browser = 'Safari';
  else if (source.includes('firefox/')) browser = 'Firefox';

  let os = 'Unknown';
  if (source.includes('windows nt')) os = 'Windows';
  else if (source.includes('mac os x')) os = 'macOS';
  else if (source.includes('android')) os = 'Android';
  else if (source.includes('iphone') || source.includes('ipad') || source.includes('ios')) os = 'iOS';
  else if (source.includes('linux')) os = 'Linux';

  let deviceType = 'desktop';
  if (source.includes('ipad') || source.includes('tablet')) deviceType = 'tablet';
  else if (source.includes('mobile') || source.includes('iphone') || source.includes('android')) deviceType = 'mobile';
  if (source.includes('bot') || source.includes('crawler') || source.includes('spider')) deviceType = 'bot';

  return { browser, os, deviceType };
}

async function lookupIpDetails(ip) {
  if (!ip || isPrivateIp(ip)) {
    return {
      ip_lookup_status: 'skipped',
      ip_lookup_message: 'private_or_missing_ip',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const fields = 'status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting';
    const url = `${IP_API_BASE_URL}/${encodeURIComponent(ip)}?fields=${fields}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return {
        ip_lookup_status: 'error',
        ip_lookup_message: `http_${response.status}`,
      };
    }

    const payload = await response.json();
    return {
      ip_lookup_status: payload.status || 'error',
      ip_lookup_message: payload.message || null,
      ip_country: payload.country || null,
      ip_region: payload.regionName || null,
      ip_city: payload.city || null,
      ip_zip: payload.zip || null,
      ip_latitude: Number.isFinite(Number(payload.lat)) ? Number(payload.lat) : null,
      ip_longitude: Number.isFinite(Number(payload.lon)) ? Number(payload.lon) : null,
      ip_timezone: payload.timezone || null,
      ip_isp: payload.isp || null,
      ip_org: payload.org || null,
      ip_as: payload.as || null,
      ip_mobile: typeof payload.mobile === 'boolean' ? payload.mobile : null,
      ip_proxy: typeof payload.proxy === 'boolean' ? payload.proxy : null,
      ip_hosting: typeof payload.hosting === 'boolean' ? payload.hosting : null,
    };
  } catch (err) {
    return {
      ip_lookup_status: 'error',
      ip_lookup_message: err.name === 'AbortError' ? 'timeout' : 'lookup_failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function collectRequestContext(req) {
  const requestIp = extractClientIp(req);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 1000);
  const ua = parseUserAgent(userAgent);
  const ipDetails = await lookupIpDetails(requestIp);

  return {
    request_ip: requestIp,
    request_user_agent: userAgent || null,
    request_browser: ua.browser,
    request_os: ua.os,
    request_device_type: ua.deviceType,
    ...ipDetails,
  };
}

function getCloverImageUrl(item) {
  const primaryImage = Array.isArray(item.images) ? item.images[0] : null;
  const source = primaryImage?.source || item.imageUrl || item.image_url || '';
  if (!source) return null;

  if (source.startsWith('http://') || source.startsWith('https://')) return source;
  if (source.startsWith('//')) return `https:${source}`;
  return source;
}

async function fetchCloverMenuData() {
  const response = await fetch(CLOVER_MENU_URL);
  if (!response.ok) {
    throw new Error(`Clover menu fetch failed with status ${response.status}`);
  }

  const raw = await response.json();
  const rawCategories = toArray(raw.categories);
  const rawItems = toArray(raw.items);
  const rawItemById = new Map(rawItems.map(item => [String(item.id), item]));

  const normalizedCategories = rawCategories
    .map((category, index) => ({
      id: numericId(category.id, `cat-${index}`),
      name: category.name || 'Menu',
      slug: String(category.name || 'menu').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      sort_order: Number(category.sortOrder ?? category.sort_order ?? index + 1),
      source_id: String(category.id),
      item_ids: Array.isArray(category.items) ? category.items.map(String) : [],
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const categoryIdMap = new Map(normalizedCategories.map(category => [category.source_id, category.id]));
  const normalizedItems = [];

  normalizedCategories.forEach((category) => {
    category.item_ids.forEach((itemId, itemIndex) => {
      const item = rawItemById.get(itemId);
      if (!item || item.available === false) return;

      normalizedItems.push({
        id: numericId(item.id, `item-${category.id}-${itemIndex}`),
        source_id: String(item.id),
        name: item.name || 'Menu Item',
        description: item.description || '',
        price: Number(item.price || 0) / 100,
        image_url: getCloverImageUrl(item),
        images: toArray(item.images),
        category_id: category.id,
        category_name: category.name,
        is_vegetarian: Boolean(item.isVegetarian ?? item.vegetarian ?? item.is_vegeterian),
        spice_level: normalizeSpiceLevel(item.spiceLevel || item.spice_level),
        is_featured: Boolean(item.isFeatured ?? item.featured),
      });
    });
  });

  rawItems.forEach((item, index) => {
    const alreadyIncluded = normalizedItems.some(normalized => normalized.source_id === String(item.id));
    if (alreadyIncluded || item.available === false) return;

    const itemCategorySourceId = String(item.categoryId || item.category_id || '');
    const categoryId = categoryIdMap.get(itemCategorySourceId) || normalizedCategories[0]?.id || 1;
    const categoryName = normalizedCategories.find(category => category.id === categoryId)?.name || 'Menu';

    normalizedItems.push({
      id: numericId(item.id, `item-fallback-${index}`),
      source_id: String(item.id),
      name: item.name || 'Menu Item',
      description: item.description || '',
      price: Number(item.price || 0) / 100,
      image_url: getCloverImageUrl(item),
      images: toArray(item.images),
      category_id: categoryId,
      category_name: categoryName,
      is_vegetarian: Boolean(item.isVegetarian ?? item.vegetarian ?? item.is_vegeterian),
      spice_level: normalizeSpiceLevel(item.spiceLevel || item.spice_level),
      is_featured: Boolean(item.isFeatured ?? item.featured),
    });
  });

  return {
    categories: normalizedCategories.map(({ source_id, item_ids, ...category }) => category),
    items: normalizedItems,
  };
}

let mockReservations = [
  { id: 1, restaurant_id: 1, name: 'John Smith', email: 'john@example.com', phone: '613-555-1234', date: '2026-03-10', time: '19:00', persons: 4, special_requests: 'Window seat please', status: 'confirmed', confirmation_code: 'MAS-001', created_at: '2026-03-05T10:00:00' },
  { id: 2, restaurant_id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '613-555-5678', date: '2026-03-10', time: '20:00', persons: 2, status: 'pending', confirmation_code: 'MAS-002', created_at: '2026-03-05T12:00:00' },
  { id: 3, restaurant_id: 5, name: 'Mike Chen', email: 'mike@example.com', phone: '613-555-9012', date: '2026-03-11', time: '18:30', persons: 6, special_requests: 'Birthday celebration', status: 'confirmed', confirmation_code: 'MAS-003', created_at: '2026-03-06T09:00:00' },
  { id: 4, restaurant_id: 1, name: 'Priya Patel', email: 'priya@example.com', phone: '613-555-3456', date: '2026-03-12', time: '19:30', persons: 3, status: 'confirmed', confirmation_code: 'MAS-004', created_at: '2026-03-06T14:00:00' },
  { id: 5, restaurant_id: 4, name: 'David Wilson', email: 'david@example.com', phone: '613-555-7890', date: '2026-03-08', time: '20:00', persons: 8, special_requests: 'Anniversary dinner', status: 'completed', confirmation_code: 'MAS-005', created_at: '2026-03-04T11:00:00' },
  { id: 6, restaurant_id: 2, name: 'Emily Brown', email: 'emily@example.com', phone: '613-555-2345', date: '2026-03-09', time: '18:00', persons: 2, status: 'cancelled', confirmation_code: 'MAS-006', created_at: '2026-03-04T16:00:00' },
  { id: 7, restaurant_id: 3, name: 'Raj Sharma', email: 'raj@example.com', phone: '514-555-6789', date: '2026-03-13', time: '19:00', persons: 5, status: 'pending', confirmation_code: 'MAS-007', created_at: '2026-03-07T08:00:00' },
  { id: 8, restaurant_id: 6, name: 'Lisa Anderson', email: 'lisa@example.com', phone: '310-555-0123', date: '2026-03-14', time: '20:30', persons: 4, status: 'confirmed', confirmation_code: 'MAS-008', created_at: '2026-03-07T10:00:00' },
];

let mockCateringRequests = [
  { id: 1, name: 'Corporate Events Inc', email: 'events@corp.com', phone: '613-555-1111', event_date: '2026-04-15', guests: 100, event_location: 'Ottawa Convention Center', event_type: 'Corporate', notes: 'Full Indian buffet needed', status: 'quoted', created_at: '2026-03-01T10:00:00' },
  { id: 2, name: 'Anita Desai', email: 'anita@example.com', phone: '613-555-2222', event_date: '2026-05-20', guests: 200, event_location: 'Hilton Garden Inn', event_type: 'Wedding', notes: 'Vegetarian and non-vegetarian options', status: 'new', created_at: '2026-03-05T14:00:00' },
];

let nextReservationId = 9;
let nextCateringId = 3;

// =====================================================
// Email Transporter
// =====================================================
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.masakalirestrobar.ca',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || 'admin@masakalirestrobar.ca',
      pass: process.env.EMAIL_PASS || '',
    },
  });
} catch (e) {
  console.log('Email transporter not configured');
}

async function sendReservationEmail(reservation, restaurant) {
  if (!transporter || !process.env.EMAIL_PASS) {
    console.log('Email skipped (not configured). Reservation:', reservation.confirmation_code);
    return;
  }
  try {
    // Customer confirmation
    await transporter.sendMail({
      from: '"Masakali Indian Cuisine" <admin@masakalirestrobar.ca>',
      to: reservation.email,
      subject: `Reservation Confirmed - ${reservation.confirmation_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; color: #fff; padding: 30px;">
          <h1 style="color: #d4a843; text-align: center;">Masakali Indian Cuisine</h1>
          <h2 style="text-align: center;">Reservation Confirmation</h2>
          <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Confirmation Code:</strong> ${reservation.confirmation_code}</p>
            <p><strong>Name:</strong> ${reservation.name}</p>
            <p><strong>Restaurant:</strong> ${restaurant.name}</p>
            <p><strong>Date:</strong> ${reservation.date}</p>
            <p><strong>Time:</strong> ${reservation.time}</p>
            <p><strong>Guests:</strong> ${reservation.persons}</p>
            ${reservation.special_requests ? `<p><strong>Special Requests:</strong> ${reservation.special_requests}</p>` : ''}
          </div>
          <p style="text-align: center; color: #888;">Thank you for choosing Masakali Indian Cuisine!</p>
        </div>
      `,
    });

    // Admin notification
    await transporter.sendMail({
      from: '"Masakali System" <admin@masakalirestrobar.ca>',
      to: process.env.ADMIN_EMAIL || 'masakalirestrobar@gmail.com',
      subject: 'New Reservation Alert',
      text: `New reservation:\nName: ${reservation.name}\nPhone: ${reservation.phone}\nBranch: ${restaurant.name}\nDate: ${reservation.date}\nTime: ${reservation.time}\nGuests: ${reservation.persons}\nCode: ${reservation.confirmation_code}`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

// =====================================================
// Auth Middleware
// =====================================================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// =====================================================
// API Routes
// =====================================================

// --- Auth ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!db) {
    return res.status(503).json({ error: 'Database not connected. Login requires MySQL.' });
  }

  try {
    const [admins] = await db.query('SELECT * FROM admins WHERE email = ? AND is_active = 1 LIMIT 1', [email]);
    if (!admins.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Unable to authenticate at the moment' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ admin: req.admin });
});

// --- Restaurants ---
app.get('/api/restaurants', async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM restaurants WHERE is_active = 1 ORDER BY id');
      return res.json(rows);
    } catch (err) { console.error(err); }
  }
  res.json(mockRestaurants);
});

app.get('/api/restaurants/:slug', async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM restaurants WHERE slug = ?', [req.params.slug]);
      if (rows.length) return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  const r = mockRestaurants.find(r => r.slug === req.params.slug);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});

// --- Menu ---
app.get('/api/categories', async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM menu_categories WHERE is_active = 1 ORDER BY sort_order');
      return res.json(rows);
    } catch (err) { console.error(err); }
  }
  try {
    const cloverMenu = await fetchCloverMenuData();
    return res.json(cloverMenu.categories);
  } catch (err) {
    console.error('Clover categories fetch failed:', err.message);
    return res.status(502).json({ error: 'Failed to fetch categories from Clover' });
  }
});

app.get('/api/menu', async (req, res) => {
  const { category, branch, featured } = req.query;
  if (db) {
    try {
      let query = 'SELECT mi.*, mc.name as category_name FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.id WHERE mi.is_active = 1';
      const params = [];
      if (category) { query += ' AND mi.category_id = ?'; params.push(category); }
      if (featured === 'true') { query += ' AND mi.is_featured = 1'; }
      query += ' ORDER BY mc.sort_order, mi.name';
      const [rows] = await db.query(query, params);
      return res.json(rows);
    } catch (err) { console.error(err); }
  }

  try {
    const cloverMenu = await fetchCloverMenuData();
    let items = [...cloverMenu.items];

    if (category) {
      const categoryId = parseInt(category, 10);
      items = items.filter(item => item.category_id === categoryId);
    }
    if (featured === 'true') items = items.filter(item => item.is_featured);

    return res.json(items);
  } catch (err) {
    console.error('Clover menu fetch failed:', err.message);
    return res.status(502).json({ error: 'Failed to fetch menu from Clover' });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
      if (rows.length) return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }

  try {
    const cloverMenu = await fetchCloverMenuData();
    const id = parseInt(req.params.id, 10);
    const item = cloverMenu.items.find(menuItem => menuItem.id === id);
    return item ? res.json(item) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Clover menu item fetch failed:', err.message);
    return res.status(502).json({ error: 'Failed to fetch menu item from Clover' });
  }
});

app.post('/api/menu', authMiddleware, async (req, res) => {
  const { name, description, price, category_id, is_vegetarian, spice_level, is_featured } = req.body;
  if (db) {
    try {
      const [result] = await db.query(
        'INSERT INTO menu_items (name, description, price, category_id, is_vegetarian, spice_level, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, category_id, is_vegetarian || false, spice_level || 'medium', is_featured || false]
      );
      const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
      return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  return res.status(503).json({ error: 'Menu is managed by Clover in this environment (read-only).' });
});

app.put('/api/menu/:id', authMiddleware, async (req, res) => {
  const { name, description, price, category_id, is_vegetarian, spice_level, is_featured } = req.body;
  if (db) {
    try {
      await db.query(
        'UPDATE menu_items SET name=?, description=?, price=?, category_id=?, is_vegetarian=?, spice_level=?, is_featured=? WHERE id=?',
        [name, description, price, category_id, is_vegetarian, spice_level, is_featured, req.params.id]
      );
      const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
      return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  return res.status(503).json({ error: 'Menu is managed by Clover in this environment (read-only).' });
});

app.delete('/api/menu/:id', authMiddleware, async (req, res) => {
  if (db) {
    try {
      await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
      return res.json({ success: true });
    } catch (err) { console.error(err); }
  }
  return res.status(503).json({ error: 'Menu is managed by Clover in this environment (read-only).' });
});

// --- Reservations ---
app.get('/api/reservations', authMiddleware, async (req, res) => {
  const { branch, date, status } = req.query;
  if (db) {
    try {
      let query = 'SELECT r.*, rest.name as restaurant_name FROM reservations r JOIN restaurants rest ON r.restaurant_id = rest.id WHERE 1=1';
      const params = [];
      if (branch) { query += ' AND r.restaurant_id = ?'; params.push(branch); }
      if (date) { query += ' AND r.date = ?'; params.push(date); }
      if (status) { query += ' AND r.status = ?'; params.push(status); }
      query += ' ORDER BY r.date DESC, r.time DESC';
      const [rows] = await db.query(query, params);
      return res.json(rows);
    } catch (err) { console.error(err); }
  }
  let reservations = [...mockReservations];
  if (branch) reservations = reservations.filter(r => r.restaurant_id === parseInt(branch));
  if (date) reservations = reservations.filter(r => r.date === date);
  if (status) reservations = reservations.filter(r => r.status === status);
  reservations = reservations.map(r => ({ ...r, restaurant_name: mockRestaurants.find(rest => rest.id === r.restaurant_id)?.name }));
  res.json(reservations);
});

app.post('/api/reservations', async (req, res) => {
  const { restaurant_id, name, email, phone, date, time, persons, special_requests, geolocation } = req.body;
  const parsedGeolocation = parseReservationGeolocation(geolocation);
  const requestContext = await collectRequestContext(req);
  const confirmation_code = 'MAS-' + String(Date.now()).slice(-6);

  if (db) {
    try {
      const [result] = await db.query(
        `INSERT INTO reservations (
          restaurant_id,
          name,
          email,
          phone,
          date,
          time,
          persons,
          special_requests,
          geolocation_latitude,
          geolocation_longitude,
          geolocation_accuracy_meters,
          geolocation_captured_at,
          geolocation_source,
          request_ip,
          request_user_agent,
          request_browser,
          request_os,
          request_device_type,
          ip_lookup_status,
          ip_lookup_message,
          ip_country,
          ip_region,
          ip_city,
          ip_zip,
          ip_latitude,
          ip_longitude,
          ip_timezone,
          ip_isp,
          ip_org,
          ip_as,
          ip_mobile,
          ip_proxy,
          ip_hosting,
          confirmation_code,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          restaurant_id,
          name,
          email,
          phone,
          date,
          time,
          persons,
          special_requests || null,
          parsedGeolocation?.latitude || null,
          parsedGeolocation?.longitude || null,
          parsedGeolocation?.accuracy || null,
          parsedGeolocation?.captured_at || null,
          parsedGeolocation?.source || null,
          requestContext.request_ip,
          requestContext.request_user_agent,
          requestContext.request_browser,
          requestContext.request_os,
          requestContext.request_device_type,
          requestContext.ip_lookup_status,
          requestContext.ip_lookup_message,
          requestContext.ip_country,
          requestContext.ip_region,
          requestContext.ip_city,
          requestContext.ip_zip,
          requestContext.ip_latitude,
          requestContext.ip_longitude,
          requestContext.ip_timezone,
          requestContext.ip_isp,
          requestContext.ip_org,
          requestContext.ip_as,
          requestContext.ip_mobile,
          requestContext.ip_proxy,
          requestContext.ip_hosting,
          confirmation_code,
          'confirmed',
        ]
      );
      const [rows] = await db.query('SELECT * FROM reservations WHERE id = ?', [result.insertId]);
      const [restaurants] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restaurants.length) sendReservationEmail(rows[0], restaurants[0]);
      return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }

  const newReservation = {
    id: nextReservationId++,
    restaurant_id: parseInt(restaurant_id),
    name, email, phone, date, time,
    persons: parseInt(persons),
    special_requests: special_requests || null,
    geolocation_latitude: parsedGeolocation?.latitude || null,
    geolocation_longitude: parsedGeolocation?.longitude || null,
    geolocation_accuracy_meters: parsedGeolocation?.accuracy || null,
    geolocation_captured_at: parsedGeolocation?.captured_at || null,
    geolocation_source: parsedGeolocation?.source || null,
    ...requestContext,
    status: 'confirmed',
    confirmation_code,
    created_at: new Date().toISOString(),
  };
  mockReservations.push(newReservation);
  const restaurant = mockRestaurants.find(r => r.id === parseInt(restaurant_id));
  sendReservationEmail(newReservation, restaurant);
  res.json(newReservation);
});

app.put('/api/reservations/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (db) {
    try {
      await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id]);
      const [rows] = await db.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
      return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  const idx = mockReservations.findIndex(r => r.id === parseInt(req.params.id));
  if (idx !== -1) {
    mockReservations[idx] = { ...mockReservations[idx], ...req.body };
    return res.json(mockReservations[idx]);
  }
  res.status(404).json({ error: 'Not found' });
});

app.delete('/api/reservations/:id', authMiddleware, async (req, res) => {
  if (db) {
    try {
      await db.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
      return res.json({ success: true });
    } catch (err) { console.error(err); }
  }
  const idx = mockReservations.findIndex(r => r.id === parseInt(req.params.id));
  if (idx !== -1) { mockReservations.splice(idx, 1); return res.json({ success: true }); }
  res.status(404).json({ error: 'Not found' });
});

// --- Catering ---
app.post('/api/catering', async (req, res) => {
  const { name, email, phone, event_date, guests, event_location, event_type, notes } = req.body;
  const requestContext = await collectRequestContext(req);
  if (db) {
    try {
      const [result] = await db.query(
        `INSERT INTO catering_requests (
          name,
          email,
          phone,
          event_date,
          guests,
          event_location,
          event_type,
          notes,
          request_ip,
          request_user_agent,
          request_browser,
          request_os,
          request_device_type,
          ip_lookup_status,
          ip_lookup_message,
          ip_country,
          ip_region,
          ip_city,
          ip_zip,
          ip_latitude,
          ip_longitude,
          ip_timezone,
          ip_isp,
          ip_org,
          ip_as,
          ip_mobile,
          ip_proxy,
          ip_hosting
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          email,
          phone,
          event_date,
          guests,
          event_location,
          event_type,
          notes,
          requestContext.request_ip,
          requestContext.request_user_agent,
          requestContext.request_browser,
          requestContext.request_os,
          requestContext.request_device_type,
          requestContext.ip_lookup_status,
          requestContext.ip_lookup_message,
          requestContext.ip_country,
          requestContext.ip_region,
          requestContext.ip_city,
          requestContext.ip_zip,
          requestContext.ip_latitude,
          requestContext.ip_longitude,
          requestContext.ip_timezone,
          requestContext.ip_isp,
          requestContext.ip_org,
          requestContext.ip_as,
          requestContext.ip_mobile,
          requestContext.ip_proxy,
          requestContext.ip_hosting,
        ]
      );
      const [rows] = await db.query('SELECT * FROM catering_requests WHERE id = ?', [result.insertId]);
      return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  const newRequest = {
    id: nextCateringId++,
    name,
    email,
    phone,
    event_date,
    guests: parseInt(guests),
    event_location,
    event_type,
    notes,
    ...requestContext,
    status: 'new',
    created_at: new Date().toISOString(),
  };
  mockCateringRequests.push(newRequest);
  res.json(newRequest);
});

app.get('/api/catering', authMiddleware, async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM catering_requests ORDER BY created_at DESC');
      return res.json(rows);
    } catch (err) { console.error(err); }
  }
  res.json(mockCateringRequests);
});

// --- Contact ---
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, subject, message, restaurant_id } = req.body;
  const requestContext = await collectRequestContext(req);
  if (db) {
    try {
      const [result] = await db.query(
        `INSERT INTO contact_inquiries (
          name,
          email,
          phone,
          subject,
          message,
          restaurant_id,
          request_ip,
          request_user_agent,
          request_browser,
          request_os,
          request_device_type,
          ip_lookup_status,
          ip_lookup_message,
          ip_country,
          ip_region,
          ip_city,
          ip_zip,
          ip_latitude,
          ip_longitude,
          ip_timezone,
          ip_isp,
          ip_org,
          ip_as,
          ip_mobile,
          ip_proxy,
          ip_hosting
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          email,
          phone,
          subject,
          message,
          restaurant_id || null,
          requestContext.request_ip,
          requestContext.request_user_agent,
          requestContext.request_browser,
          requestContext.request_os,
          requestContext.request_device_type,
          requestContext.ip_lookup_status,
          requestContext.ip_lookup_message,
          requestContext.ip_country,
          requestContext.ip_region,
          requestContext.ip_city,
          requestContext.ip_zip,
          requestContext.ip_latitude,
          requestContext.ip_longitude,
          requestContext.ip_timezone,
          requestContext.ip_isp,
          requestContext.ip_org,
          requestContext.ip_as,
          requestContext.ip_mobile,
          requestContext.ip_proxy,
          requestContext.ip_hosting,
        ]
      );
      return res.json({ success: true, id: result.insertId });
    } catch (err) { console.error(err); }
  }
  res.json({ success: true, message: 'Inquiry received' });
});

// --- Analytics ---
app.get('/api/analytics/overview', authMiddleware, async (req, res) => {
  if (db) {
    try {
      const [totalRes] = await db.query('SELECT COUNT(*) as count FROM reservations');
      const [confirmedRes] = await db.query("SELECT COUNT(*) as count FROM reservations WHERE status = 'confirmed'");
      const [todayRes] = await db.query("SELECT COUNT(*) as count FROM reservations WHERE date = CURDATE()");
      const [totalCatering] = await db.query('SELECT COUNT(*) as count FROM catering_requests');
      const [totalMenuItems] = await db.query('SELECT COUNT(*) as count FROM menu_items WHERE is_active = 1');
      const [branchStats] = await db.query('SELECT r.name, COUNT(res.id) as count FROM restaurants r LEFT JOIN reservations res ON r.id = res.restaurant_id GROUP BY r.id, r.name');
      return res.json({
        totalReservations: totalRes[0].count,
        confirmedReservations: confirmedRes[0].count,
        todayReservations: todayRes[0].count,
        totalCateringRequests: totalCatering[0].count,
        totalMenuItems: totalMenuItems[0].count,
        branchStats,
      });
    } catch (err) { console.error(err); }
  }
  // Mock analytics
  const branchStats = mockRestaurants.map(r => ({
    name: r.name.replace('Masakali Indian Cuisine – ', '').replace('Masakali ', ''),
    count: mockReservations.filter(res => res.restaurant_id === r.id).length,
  }));
  let totalMenuItems = 0;
  try {
    const cloverMenu = await fetchCloverMenuData();
    totalMenuItems = cloverMenu.items.length;
  } catch (err) {
    console.error('Clover menu count fetch failed:', err.message);
  }

  res.json({
    totalReservations: mockReservations.length,
    confirmedReservations: mockReservations.filter(r => r.status === 'confirmed').length,
    todayReservations: mockReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length,
    totalCateringRequests: mockCateringRequests.length,
    totalMenuItems,
    branchStats,
    peakDays: [
      { day: 'Friday', reservations: 45 },
      { day: 'Saturday', reservations: 62 },
      { day: 'Sunday', reservations: 38 },
      { day: 'Thursday', reservations: 28 },
      { day: 'Wednesday', reservations: 20 },
      { day: 'Tuesday', reservations: 15 },
      { day: 'Monday', reservations: 12 },
    ],
    groupSizeDistribution: [
      { size: '1-2', count: 35 },
      { size: '3-4', count: 45 },
      { size: '5-6', count: 25 },
      { size: '7-8', count: 12 },
      { size: '9+', count: 5 },
    ],
    monthlyTrend: [
      { month: 'Oct', reservations: 120 },
      { month: 'Nov', reservations: 145 },
      { month: 'Dec', reservations: 190 },
      { month: 'Jan', reservations: 135 },
      { month: 'Feb', reservations: 155 },
      { month: 'Mar', reservations: 170 },
    ],
    revenueEstimate: {
      avgSpendPerGuest: 45,
      totalGuests: 850,
      estimatedRevenue: 38250,
      monthlyGrowth: 12.5,
    },
    recommendations: [
      { type: 'promotion', text: 'Run promotions on Monday & Tuesday to increase weekday traffic by an estimated 30%.' },
      { type: 'staffing', text: 'Increase staffing on Friday & Saturday evenings — peak reservation hours are 7:00–9:00 PM.' },
      { type: 'expansion', text: 'Montreal and California branches show high demand growth — consider expanding seating capacity.' },
      { type: 'menu', text: 'Butter Chicken and Biryani are top sellers. Consider creating combo deals around these items.' },
      { type: 'catering', text: 'Catering requests spike in April–June. Prepare catering packages for wedding season.' },
    ],
  });
});

// =====================================================
// SPA Catch-All (must be last)
// =====================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// =====================================================
// Start Server
// =====================================================
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🍛 Masakali Restaurant Group Server`);
    console.log(`   Running on port ${PORT}`);
    console.log(`   Database: ${db ? 'MySQL Connected' : 'Mock Data Mode'}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
});
