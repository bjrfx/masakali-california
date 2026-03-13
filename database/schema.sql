-- =====================================================
-- Masakali Restaurant Group - Database Schema
-- =====================================================

CREATE DATABASE IF NOT EXISTS masakali_db;
USE masakali_db;

-- =====================================================
-- Restaurants Table
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  brand VARCHAR(100) NOT NULL DEFAULT 'Masakali Indian Cuisine',
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province_state VARCHAR(100),
  country VARCHAR(100) NOT NULL DEFAULT 'Canada',
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  google_maps_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSON,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- Menu Categories Table
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Menu Items Table
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id INT NOT NULL,
  image_url VARCHAR(500),
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  spice_level ENUM('mild', 'medium', 'hot', 'extra_hot') DEFAULT 'medium',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

-- =====================================================
-- Menu Item Branch Availability
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_item_branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  branch_price DECIMAL(10, 2),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_item_branch (menu_item_id, restaurant_id)
);

-- =====================================================
-- Reservations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  persons INT NOT NULL,
  special_requests TEXT,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
  confirmation_code VARCHAR(20) UNIQUE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- =====================================================
-- Catering Requests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS catering_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  event_date DATE NOT NULL,
  guests INT NOT NULL,
  event_location VARCHAR(500),
  event_type VARCHAR(100),
  budget_range VARCHAR(50),
  notes TEXT,
  status ENUM('new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- Contact Inquiries Table
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  restaurant_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- =====================================================
-- Admins Table
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'branch_admin', 'staff') DEFAULT 'staff',
  restaurant_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- =====================================================
-- Seed Data: Restaurants
-- =====================================================
INSERT INTO restaurants (name, slug, brand, address, city, province_state, country, phone, email, website) VALUES
('Masakali Indian Cuisine - Wellington', 'wellington', 'Masakali Indian Cuisine', 'Wellington Street', 'Ottawa', 'Ontario', 'Canada', '(613) 555-0101', 'wellington@masakali.ca', 'https://masakaliottawa.ca'),
('Masakali Indian Cuisine - Stittsville', 'stittsville', 'Masakali Indian Cuisine', 'Stittsville Main St', 'Ottawa', 'Ontario', 'Canada', '(613) 555-0102', 'stittsville@masakali.ca', 'https://masakaliottawa.ca'),
('Masakali Indian Cuisine - Montreal', 'montreal', 'Masakali Indian Cuisine', 'Downtown Montreal', 'Montreal', 'Quebec', 'Canada', '(514) 555-0103', 'montreal@masakali.ca', NULL),
('RangDe Indian Cuisine', 'rangde', 'RangDe Indian Cuisine', '700 March Rd', 'Ottawa', 'Ontario', 'Canada', '(613) 555-0104', 'info@rangdeottawa.ca', 'https://rangdeottawa.ca'),
('Masakali Restobar', 'restobar', 'Masakali Restobar', 'Byward Market', 'Ottawa', 'Ontario', 'Canada', '(613) 555-0105', 'info@masakalirestrobar.ca', 'https://masakalirestrobar.ca'),
('Masakali Indian Cuisine - California', 'california', 'Masakali Indian Cuisine', 'California', 'Los Angeles', 'California', 'USA', '(310) 555-0106', 'california@masakali.ca', NULL);

-- =====================================================
-- Seed Data: Menu Categories
-- =====================================================
INSERT INTO menu_categories (name, slug, sort_order) VALUES
('Starters', 'starters', 1),
('Vegetarian Curries', 'veg-curries', 2),
('Non-Veg Curries', 'nonveg-curries', 3),
('Tandoori', 'tandoori', 4),
('Indo-Chinese', 'indo-chinese', 5),
('Biryani', 'biryani', 6),
('Breads', 'breads', 7),
('Desserts', 'desserts', 8),
('Drinks', 'drinks', 9);

-- =====================================================
-- Seed Data: Menu Items
-- =====================================================
INSERT INTO menu_items (name, description, price, category_id, is_vegetarian, spice_level, is_featured) VALUES
('Samosa (2 pcs)', 'Crispy pastry filled with spiced potatoes and peas', 7.99, 1, TRUE, 'medium', TRUE),
('Chicken Tikka', 'Tender chicken marinated in yogurt and spices, grilled in tandoor', 15.99, 1, FALSE, 'medium', TRUE),
('Paneer Pakora', 'Golden fried cottage cheese fritters with mint chutney', 12.99, 1, TRUE, 'mild', FALSE),
('Onion Bhaji', 'Crispy onion fritters seasoned with herbs and spices', 8.99, 1, TRUE, 'mild', FALSE),
('Fish Amritsari', 'Crispy battered fish fillets with tamarind sauce', 14.99, 1, FALSE, 'medium', FALSE),

('Paneer Butter Masala', 'Cottage cheese in rich creamy tomato sauce', 16.99, 2, TRUE, 'mild', TRUE),
('Dal Makhani', 'Slow-cooked black lentils in creamy butter sauce', 14.99, 2, TRUE, 'mild', TRUE),
('Palak Paneer', 'Cottage cheese cubes in smooth spinach gravy', 15.99, 2, TRUE, 'mild', FALSE),
('Chana Masala', 'Chickpeas cooked in aromatic spiced tomato gravy', 13.99, 2, TRUE, 'medium', FALSE),
('Malai Kofta', 'Cottage cheese and potato dumplings in creamy sauce', 16.99, 2, TRUE, 'mild', FALSE),
('Aloo Gobi', 'Potato and cauliflower tempered with cumin and turmeric', 13.99, 2, TRUE, 'mild', FALSE),

('Butter Chicken', 'Tender chicken in rich buttery tomato cream sauce', 17.99, 3, FALSE, 'mild', TRUE),
('Lamb Rogan Josh', 'Slow-cooked lamb in aromatic Kashmiri spices', 19.99, 3, FALSE, 'medium', TRUE),
('Chicken Vindaloo', 'Fiery Goan-style chicken curry with potatoes', 17.99, 3, FALSE, 'extra_hot', FALSE),
('Goat Curry', 'Traditional goat curry slow-cooked with whole spices', 19.99, 3, FALSE, 'medium', FALSE),
('Prawn Masala', 'Jumbo prawns in a spiced onion-tomato gravy', 21.99, 3, FALSE, 'medium', FALSE),

('Tandoori Chicken', 'Half chicken marinated overnight, roasted in clay oven', 18.99, 4, FALSE, 'medium', TRUE),
('Seekh Kebab', 'Minced lamb skewers with herbs, grilled in tandoor', 16.99, 4, FALSE, 'medium', FALSE),
('Paneer Tikka', 'Marinated cottage cheese grilled with bell peppers', 15.99, 4, TRUE, 'mild', FALSE),
('Lamb Chops', 'Premium lamb chops marinated in royal spice blend', 24.99, 4, FALSE, 'medium', TRUE),

('Chilli Chicken', 'Indo-Chinese style chicken with peppers and soy', 16.99, 5, FALSE, 'hot', FALSE),
('Hakka Noodles', 'Stir-fried noodles with vegetables and Indo-Chinese sauces', 14.99, 5, TRUE, 'medium', FALSE),
('Manchurian', 'Vegetable dumplings in tangy Manchurian sauce', 13.99, 5, TRUE, 'medium', FALSE),

('Chicken Biryani', 'Fragrant basmati rice layered with spiced chicken', 18.99, 6, FALSE, 'medium', TRUE),
('Lamb Biryani', 'Aromatic basmati rice with tender spiced lamb', 20.99, 6, FALSE, 'medium', TRUE),
('Vegetable Biryani', 'Fragrant rice with seasonal vegetables and saffron', 15.99, 6, TRUE, 'mild', FALSE),
('Goat Biryani', 'Traditional Hyderabadi-style goat biryani', 21.99, 6, FALSE, 'medium', FALSE),

('Butter Naan', 'Soft leavened bread brushed with butter', 3.49, 7, TRUE, 'mild', FALSE),
('Garlic Naan', 'Naan topped with fresh garlic and cilantro', 3.99, 7, TRUE, 'mild', TRUE),
('Peshawari Naan', 'Sweet naan stuffed with nuts and raisins', 4.99, 7, TRUE, 'mild', FALSE),
('Tandoori Roti', 'Whole wheat bread baked in tandoor', 2.99, 7, TRUE, 'mild', FALSE),
('Cheese Naan', 'Naan stuffed with melted mozzarella cheese', 4.99, 7, TRUE, 'mild', FALSE),

('Gulab Jamun', 'Warm milk dumplings soaked in rose-scented syrup', 6.99, 8, TRUE, 'mild', TRUE),
('Rasmalai', 'Soft cottage cheese patties in saffron cream', 7.99, 8, TRUE, 'mild', FALSE),
('Kheer', 'Traditional Indian rice pudding with nuts', 6.99, 8, TRUE, 'mild', FALSE),

('Mango Lassi', 'Sweet yogurt smoothie with Alphonso mango', 5.99, 9, TRUE, 'mild', TRUE),
('Masala Chai', 'Spiced Indian tea with cardamom and ginger', 3.99, 9, TRUE, 'mild', FALSE),
('Sweet Lassi', 'Traditional sweet yogurt drink', 4.99, 9, TRUE, 'mild', FALSE);

-- =====================================================
-- Seed Data: Default Admin
-- Password: admin123 (bcrypt hash)
-- =====================================================
INSERT INTO admins (name, email, password_hash, role) VALUES
('Super Admin', 'admin@masakali.ca', '$2a$10$xVqYLGwEGZ0YF0v0F.qXOeHkVgJHvJcVCy.mHkGrSb5JZFX7qXbCi', 'super_admin');
