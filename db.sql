CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    device_id VARCHAR(100),
    last_ip VARCHAR(50),
    role VARCHAR(20) DEFAULT 'student'
);

CREATE TABLE streams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    video_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
