-- Fix inconsistent vehicles in inventario_cache
-- This script identifies and fixes vehicles that should be marked as sold/historico

-- First, let's see what we need to fix
-- Vehicles that are marked as vendido=true but still have ordenstatus='Comprado'
SELECT
  id,
  record_id,
  ordencompra,
  title,
  ordenstatus,
  vendido,
  separado,
  updated_at
FROM inventario_cache
WHERE vendido = true AND ordenstatus = 'Comprado'
ORDER BY updated_at DESC;

-- Update all vehicles that are vendido=true but still marked as Comprado
-- Set them to Historico status
UPDATE inventario_cache
SET
  ordenstatus = 'Historico',
  updated_at = NOW()
WHERE vendido = true
  AND ordenstatus != 'Historico';

-- Also check for vehicles with ordenstatus that should imply vendido=true
UPDATE inventario_cache
SET
  vendido = true,
  updated_at = NOW()
WHERE ordenstatus IN ('Historico', 'Vendido')
  AND vendido = false;

-- Show summary of what was fixed
SELECT
  'Fixed Records' as status,
  COUNT(*) as count
FROM inventario_cache
WHERE ordenstatus = 'Historico' AND vendido = true;

-- Show currently active vehicles (should only show Comprado vehicles)
SELECT
  ordenstatus,
  vendido,
  COUNT(*) as count
FROM inventario_cache
GROUP BY ordenstatus, vendido
ORDER BY ordenstatus, vendido;
