-- =========================================
-- HARCAMA TAKİP UYGULAMASI VERİTABANI ŞEMASI
-- =========================================

-- Eski tabloları temizle (geliştirme için)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========== USERS TABLOSU ==========
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== CATEGORIES TABLOSU ==========
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(20),
    color VARCHAR(20)
);

-- ========== EXPENSES TABLOSU ==========
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255),
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== VARSAYILAN KATEGORİLER ==========
INSERT INTO categories (name, icon, color) VALUES
    ('Market', 'cart', '#4CAF50'),
    ('Yemek', 'food', '#FF9800'),
    ('Fatura', 'bill', '#F44336'),
    ('Alisveris', 'shop', '#9C27B0'),
    ('Ulasim', 'car', '#2196F3'),
    ('Eglence', 'fun', '#E91E63'),
    ('Saglik', 'health', '#00BCD4'),
    ('Egitim', 'edu', '#795548'),
    ('Diger', 'other', '#607D8B');

-- ========== İNDEKSLER (performans için) ==========
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);