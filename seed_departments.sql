-- Seed data for Colombian departments
-- Run this if sys_departments table is empty

INSERT IGNORE INTO sys_departments (code, name, country_code) VALUES
('05', 'Antioquia', 'CO'),
('08', 'Atlántico', 'CO'),
('11', 'Bogotá D.C.', 'CO'),
('13', 'Bolívar', 'CO'),
('15', 'Boyacá', 'CO'),
('17', 'Caldas', 'CO'),
('18', 'Caquetá', 'CO'),
('19', 'Cauca', 'CO'),
('20', 'Cesar', 'CO'),
('23', 'Córdoba', 'CO'),
('25', 'Cundinamarca', 'CO'),
('27', 'Chocó', 'CO'),
('41', 'Huila', 'CO'),
('44', 'La Guajira', 'CO'),
('47', 'Magdalena', 'CO'),
('50', 'Meta', 'CO'),
('52', 'Nariño', 'CO'),
('54', 'Norte de Santander', 'CO'),
('63', 'Quindío', 'CO'),
('66', 'Risaralda', 'CO'),
('68', 'Santander', 'CO'),
('70', 'Sucre', 'CO'),
('73', 'Tolima', 'CO'),
('76', 'Valle del Cauca', 'CO'),
('81', 'Arauca', 'CO'),
('85', 'Casanare', 'CO'),
('86', 'Putumayo', 'CO'),
('88', 'San Andrés y Providencia', 'CO'),
('91', 'Amazonas', 'CO'),
('94', 'Guainía', 'CO'),
('95', 'Guaviare', 'CO'),
('97', 'Vaupés', 'CO'),
('99', 'Vichada', 'CO');

-- Verify
SELECT COUNT(*) as total_departments FROM sys_departments WHERE country_code = 'CO';
