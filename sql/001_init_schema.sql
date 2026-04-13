CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  isbooked INT DEFAULT 0
);

INSERT INTO seats (isbooked)
SELECT 0
FROM generate_series(1, 20)
WHERE NOT EXISTS (SELECT 1 FROM seats);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  movie_id VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_holds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  movie_id VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booking_per_seat_movie
ON bookings (seat_id, movie_id)
WHERE status = 'booked';

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_hold_per_seat_movie
ON seat_holds (seat_id, movie_id, status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_seat_holds_expires_at
ON seat_holds (expires_at);
