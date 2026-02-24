-- 005_geo_coordinates.sql - Add latitude/longitude for city-level map
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude REAL;
