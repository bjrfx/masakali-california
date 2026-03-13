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

// =====================================================
// Middleware
// =====================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'masakali_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
    const [rows] = await db.query('SELECT 1');
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

const mockCategories = [
  { id: 1, name: 'Starters', slug: 'starters', sort_order: 1 },
  { id: 2, name: 'Vegetarian Curries', slug: 'veg-curries', sort_order: 2 },
  { id: 3, name: 'Non-Veg Curries', slug: 'nonveg-curries', sort_order: 3 },
  { id: 4, name: 'Tandoori', slug: 'tandoori', sort_order: 4 },
  { id: 5, name: 'Indo-Chinese', slug: 'indo-chinese', sort_order: 5 },
  { id: 6, name: 'Biryani', slug: 'biryani', sort_order: 6 },
  { id: 7, name: 'Breads', slug: 'breads', sort_order: 7 },
  { id: 8, name: 'Desserts', slug: 'desserts', sort_order: 8 },
  { id: 9, name: 'Drinks', slug: 'drinks', sort_order: 9 },
];

const mockMenuItems = [
  { id: 1, name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes and peas', price: 7.99, category_id: 1, is_vegetarian: true, spice_level: 'medium', is_featured: true },
  { id: 2, name: 'Chicken Tikka', description: 'Tender chicken marinated in yogurt and spices, grilled in tandoor', price: 15.99, category_id: 1, is_vegetarian: false, spice_level: 'medium', is_featured: true },
  { id: 3, name: 'Paneer Pakora', description: 'Golden fried cottage cheese fritters with mint chutney', price: 12.99, category_id: 1, is_vegetarian: true, spice_level: 'mild', is_featured: false },
  { id: 4, name: 'Onion Bhaji', description: 'Crispy onion fritters seasoned with herbs and spices', price: 8.99, category_id: 1, is_vegetarian: true, spice_level: 'mild' },
  { id: 5, name: 'Fish Amritsari', description: 'Crispy battered fish fillets with tamarind sauce', price: 14.99, category_id: 1, is_vegetarian: false, spice_level: 'medium' },
  { id: 6, name: 'Paneer Butter Masala', description: 'Cottage cheese in rich creamy tomato sauce', price: 16.99, category_id: 2, is_vegetarian: true, spice_level: 'mild', is_featured: true },
  { id: 7, name: 'Dal Makhani', description: 'Slow-cooked black lentils in creamy butter sauce', price: 14.99, category_id: 2, is_vegetarian: true, spice_level: 'mild', is_featured: true },
  { id: 8, name: 'Palak Paneer', description: 'Cottage cheese cubes in smooth spinach gravy', price: 15.99, category_id: 2, is_vegetarian: true, spice_level: 'mild' },
  { id: 9, name: 'Chana Masala', description: 'Chickpeas in aromatic spiced tomato gravy', price: 13.99, category_id: 2, is_vegetarian: true, spice_level: 'medium' },
  { id: 10, name: 'Malai Kofta', description: 'Cottage cheese and potato dumplings in creamy sauce', price: 16.99, category_id: 2, is_vegetarian: true, spice_level: 'mild' },
  { id: 11, name: 'Aloo Gobi', description: 'Potato and cauliflower tempered with cumin and turmeric', price: 13.99, category_id: 2, is_vegetarian: true, spice_level: 'mild' },
  { id: 12, name: 'Butter Chicken', description: 'Tender chicken in rich buttery tomato cream sauce', price: 17.99, category_id: 3, is_vegetarian: false, spice_level: 'mild', is_featured: true },
  { id: 13, name: 'Lamb Rogan Josh', description: 'Slow-cooked lamb in aromatic Kashmiri spices', price: 19.99, category_id: 3, is_vegetarian: false, spice_level: 'medium', is_featured: true },
  { id: 14, name: 'Chicken Vindaloo', description: 'Fiery Goan-style chicken curry with potatoes', price: 17.99, category_id: 3, is_vegetarian: false, spice_level: 'extra_hot' },
  { id: 15, name: 'Goat Curry', description: 'Traditional goat curry slow-cooked with whole spices', price: 19.99, category_id: 3, is_vegetarian: false, spice_level: 'medium' },
  { id: 16, name: 'Prawn Masala', description: 'Jumbo prawns in a spiced onion-tomato gravy', price: 21.99, category_id: 3, is_vegetarian: false, spice_level: 'medium' },
  { id: 17, name: 'Tandoori Chicken', description: 'Half chicken marinated overnight, roasted in clay oven', price: 18.99, category_id: 4, is_vegetarian: false, spice_level: 'medium', is_featured: true },
  { id: 18, name: 'Seekh Kebab', description: 'Minced lamb skewers with herbs, grilled in tandoor', price: 16.99, category_id: 4, is_vegetarian: false, spice_level: 'medium' },
  { id: 19, name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled with bell peppers', price: 15.99, category_id: 4, is_vegetarian: true, spice_level: 'mild' },
  { id: 20, name: 'Lamb Chops', description: 'Premium lamb chops marinated in royal spice blend', price: 24.99, category_id: 4, is_vegetarian: false, spice_level: 'medium', is_featured: true },
  { id: 21, name: 'Chilli Chicken', description: 'Indo-Chinese style chicken with peppers and soy', price: 16.99, category_id: 5, is_vegetarian: false, spice_level: 'hot' },
  { id: 22, name: 'Hakka Noodles', description: 'Stir-fried noodles with vegetables and Indo-Chinese sauces', price: 14.99, category_id: 5, is_vegetarian: true, spice_level: 'medium' },
  { id: 23, name: 'Manchurian', description: 'Vegetable dumplings in tangy Manchurian sauce', price: 13.99, category_id: 5, is_vegetarian: true, spice_level: 'medium' },
  { id: 24, name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken', price: 18.99, category_id: 6, is_vegetarian: false, spice_level: 'medium', is_featured: true },
  { id: 25, name: 'Lamb Biryani', description: 'Aromatic basmati rice with tender spiced lamb', price: 20.99, category_id: 6, is_vegetarian: false, spice_level: 'medium', is_featured: true },
  { id: 26, name: 'Vegetable Biryani', description: 'Fragrant rice with seasonal vegetables and saffron', price: 15.99, category_id: 6, is_vegetarian: true, spice_level: 'mild' },
  { id: 27, name: 'Goat Biryani', description: 'Traditional Hyderabadi-style goat biryani', price: 21.99, category_id: 6, is_vegetarian: false, spice_level: 'medium' },
  { id: 28, name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', price: 3.49, category_id: 7, is_vegetarian: true, spice_level: 'mild' },
  { id: 29, name: 'Garlic Naan', description: 'Naan topped with fresh garlic and cilantro', price: 3.99, category_id: 7, is_vegetarian: true, spice_level: 'mild', is_featured: true },
  { id: 30, name: 'Peshawari Naan', description: 'Sweet naan stuffed with nuts and raisins', price: 4.99, category_id: 7, is_vegetarian: true, spice_level: 'mild' },
  { id: 31, name: 'Tandoori Roti', description: 'Whole wheat bread baked in tandoor', price: 2.99, category_id: 7, is_vegetarian: true, spice_level: 'mild' },
  { id: 32, name: 'Cheese Naan', description: 'Naan stuffed with melted mozzarella cheese', price: 4.99, category_id: 7, is_vegetarian: true, spice_level: 'mild' },
  { id: 33, name: 'Gulab Jamun', description: 'Warm milk dumplings soaked in rose-scented syrup', price: 6.99, category_id: 8, is_vegetarian: true, spice_level: 'mild', is_featured: true },
  { id: 34, name: 'Rasmalai', description: 'Soft cottage cheese patties in saffron cream', price: 7.99, category_id: 8, is_vegetarian: true, spice_level: 'mild' },
  { id: 35, name: 'Kheer', description: 'Traditional Indian rice pudding with nuts', price: 6.99, category_id: 8, is_vegetarian: true, spice_level: 'mild' },
  { id: 36, name: 'Mango Lassi', description: 'Sweet yogurt smoothie with Alphonso mango', price: 5.99, category_id: 9, is_vegetarian: true, spice_level: 'mild', is_featured: true },
  { id: 37, name: 'Masala Chai', description: 'Spiced Indian tea with cardamom and ginger', price: 3.99, category_id: 9, is_vegetarian: true, spice_level: 'mild' },
  { id: 38, name: 'Sweet Lassi', description: 'Traditional sweet yogurt drink', price: 4.99, category_id: 9, is_vegetarian: true, spice_level: 'mild' },
];

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
  // Demo login: admin@masakali.ca / admin123
  if (email === 'admin@masakali.ca' && password === 'admin123') {
    const token = jwt.sign({ id: 1, email, role: 'super_admin', name: 'Super Admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, admin: { id: 1, name: 'Super Admin', email, role: 'super_admin' } });
  }
  if (db) {
    try {
      const [admins] = await db.query('SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]);
      if (admins.length && await bcrypt.compare(password, admins[0].password_hash)) {
        const admin = admins[0];
        const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role, name: admin.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
      }
    } catch (err) { console.error(err); }
  }
  res.status(401).json({ error: 'Invalid credentials' });
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
  res.json(mockCategories);
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
  let items = [...mockMenuItems];
  if (category) items = items.filter(i => i.category_id === parseInt(category));
  if (featured === 'true') items = items.filter(i => i.is_featured);
  items = items.map(i => ({ ...i, category_name: mockCategories.find(c => c.id === i.category_id)?.name }));
  res.json(items);
});

app.get('/api/menu/:id', async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
      if (rows.length) return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  const item = mockMenuItems.find(i => i.id === parseInt(req.params.id));
  item ? res.json(item) : res.status(404).json({ error: 'Not found' });
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
  const newItem = { id: mockMenuItems.length + 1, name, description, price: parseFloat(price), category_id: parseInt(category_id), is_vegetarian: is_vegetarian || false, spice_level: spice_level || 'medium', is_featured: is_featured || false };
  mockMenuItems.push(newItem);
  res.json(newItem);
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
  const idx = mockMenuItems.findIndex(i => i.id === parseInt(req.params.id));
  if (idx !== -1) {
    mockMenuItems[idx] = { ...mockMenuItems[idx], name, description, price: parseFloat(price), category_id: parseInt(category_id), is_vegetarian, spice_level, is_featured };
    return res.json(mockMenuItems[idx]);
  }
  res.status(404).json({ error: 'Not found' });
});

app.delete('/api/menu/:id', authMiddleware, async (req, res) => {
  if (db) {
    try {
      await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
      return res.json({ success: true });
    } catch (err) { console.error(err); }
  }
  const idx = mockMenuItems.findIndex(i => i.id === parseInt(req.params.id));
  if (idx !== -1) { mockMenuItems.splice(idx, 1); return res.json({ success: true }); }
  res.status(404).json({ error: 'Not found' });
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
  const { restaurant_id, name, email, phone, date, time, persons, special_requests } = req.body;
  const confirmation_code = 'MAS-' + String(Date.now()).slice(-6);

  if (db) {
    try {
      const [result] = await db.query(
        'INSERT INTO reservations (restaurant_id, name, email, phone, date, time, persons, special_requests, confirmation_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [restaurant_id, name, email, phone, date, time, persons, special_requests || null, confirmation_code, 'confirmed']
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
  if (db) {
    try {
      const [result] = await db.query(
        'INSERT INTO catering_requests (name, email, phone, event_date, guests, event_location, event_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone, event_date, guests, event_location, event_type, notes]
      );
      const [rows] = await db.query('SELECT * FROM catering_requests WHERE id = ?', [result.insertId]);
      return res.json(rows[0]);
    } catch (err) { console.error(err); }
  }
  const newRequest = { id: nextCateringId++, name, email, phone, event_date, guests: parseInt(guests), event_location, event_type, notes, status: 'new', created_at: new Date().toISOString() };
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
  if (db) {
    try {
      const [result] = await db.query(
        'INSERT INTO contact_inquiries (name, email, phone, subject, message, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, subject, message, restaurant_id || null]
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
  res.json({
    totalReservations: mockReservations.length,
    confirmedReservations: mockReservations.filter(r => r.status === 'confirmed').length,
    todayReservations: mockReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length,
    totalCateringRequests: mockCateringRequests.length,
    totalMenuItems: mockMenuItems.length,
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
