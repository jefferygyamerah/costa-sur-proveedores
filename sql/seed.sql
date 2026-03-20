-- Seed data — migrated from Villa Valencia proveedores page
-- Run AFTER schema.sql

-- Insert providers (all approved since they're already verified)
INSERT INTO providers (id, name, category, service, phone, email, status) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Raul Moreno', 'aires', 'Limpieza, reparacion e instalacion de aires acondicionados', '6588-7198', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000002', 'Cheffy Le Cheff', 'catering', 'Catering, comida y equipo para fiestas', '269-1220', 'Ventas@cheffylecheff.com', 'approved'),
  ('a0000001-0000-0000-0000-000000000003', 'Hector Canate', 'jardineria', 'Jardineria', '6461-7563', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000004', 'Antonio', 'linea-blanca', 'Lavadoras, secadoras — reparacion y mantenimiento', '6983-8544', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000005', 'Dario Hernandez', 'plomeria', 'Plomeria', '6634-4065', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000006', 'Marcos Sanchez', 'general', 'Trabajos generales: pintura, techo, albanileria', '6484-6335', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000007', 'Felix', 'aires', 'Aires acondicionados — instalacion y mantenimiento', '6813-4069', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000008', 'Alexis Angulo', 'fumigacion', 'Fumigacion', '6320-3154', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000009', 'Norbing Mercado', 'jardineria', 'Jardineria', '6580-2214', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000010', 'Carlos Yanez', 'techo', 'Techo y canales de techo', '6487-0098', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000011', 'W&A Engineering Solutions', 'solar', 'Instalacion y mantenimiento de paneles solares', '6998-5838', NULL, 'approved'),
  ('a0000001-0000-0000-0000-000000000012', 'Vidrios y Aluminio Mega', 'vidrios', 'Ventanas y vidrios', '6415-8511', NULL, 'approved');

-- Recommendations (one per provider, from Villa Valencia)
INSERT INTO recommendations (provider_id, community, house_number, status) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'villa-valencia', '98', 'approved'),
  ('a0000001-0000-0000-0000-000000000002', 'villa-valencia', '60', 'approved'),
  ('a0000001-0000-0000-0000-000000000003', 'villa-valencia', '98', 'approved'),
  ('a0000001-0000-0000-0000-000000000004', 'villa-valencia', '98', 'approved'),
  ('a0000001-0000-0000-0000-000000000005', 'villa-valencia', '104', 'approved'),
  ('a0000001-0000-0000-0000-000000000006', 'villa-valencia', '104', 'approved'),
  ('a0000001-0000-0000-0000-000000000007', 'villa-valencia', '104', 'approved'),
  ('a0000001-0000-0000-0000-000000000008', 'villa-valencia', '104', 'approved'),
  ('a0000001-0000-0000-0000-000000000009', 'villa-valencia', '104', 'approved'),
  ('a0000001-0000-0000-0000-000000000010', 'villa-valencia', '104', 'approved'),
  ('a0000001-0000-0000-0000-000000000011', 'villa-valencia', '66', 'approved'),
  ('a0000001-0000-0000-0000-000000000012', 'villa-valencia', '89', 'approved');
