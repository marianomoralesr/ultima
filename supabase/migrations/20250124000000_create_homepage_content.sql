-- Create homepage_content table for CMS
CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read homepage content
CREATE POLICY "Anyone can read homepage content"
  ON homepage_content
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "Authenticated users can insert homepage content"
  ON homepage_content
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update homepage content"
  ON homepage_content
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_homepage_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homepage_content_updated_at
  BEFORE UPDATE ON homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_content_timestamp();

-- Insert default content
INSERT INTO homepage_content (section_key, content) VALUES
('hero', '{
  "badgeText": "Autos Seminuevos Certificados",
  "title": "Tu próximo auto seminuevo te está esperando",
  "description": "Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía y financiamiento disponible.",
  "desktopImageLeft": "https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp",
  "desktopImageRight": "https://r2.trefa.mx/Frame%2040%20(1).png",
  "mobileImage": "https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp",
  "primaryButtonText": "Ver Inventario",
  "primaryButtonLink": "/autos",
  "secondaryButtonText": "Conoce el Kit de Seguridad",
  "secondaryButtonLink": "/kit-trefa",
  "statsText": "Más de 5,000 autos vendidos y clientes satisfechos",
  "brandsText": "y 15 de las mejores marcas más..."
}'),
('inventory_hero', '{
  "title": "Encuentra tu próximo auto",
  "subtitle": "Explora nuestro inventario completo de seminuevos certificados",
  "buttonText": "Ver el inventario completo",
  "buttonLink": "/autos"
}'),
('carroceria_carousel', '{
  "title": "Explora por Tipo de Carrocería",
  "subtitle": "Encuentra el vehículo perfecto según tu estilo de vida. Desde SUVs familiares hasta Pick Ups robustas.",
  "items": [
    {
      "title": "SUV",
      "category": "Sport Utility Vehicle",
      "src": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=2071&auto=format&fit=crop",
      "description": "Espaciosos, versátiles y perfectos para la familia. Confort y seguridad en cada viaje.",
      "link": "/carroceria/suv"
    },
    {
      "title": "Sedan",
      "category": "Elegancia y Eficiencia",
      "src": "https://source.unsplash.com/Q63_3ioH2xg/2128x1600",
      "description": "Diseño sofisticado con excelente rendimiento de combustible. Ideal para el día a día.",
      "link": "/carroceria/sedan"
    },
    {
      "title": "Hatchback",
      "category": "Compacto y Práctico",
      "src": "https://m.atcdn.co.uk/vms/media/%7Bresize%7D/8b06e0fd21fc486389639a6084e1e3aa.jpg",
      "description": "Ágiles en la ciudad con amplio espacio de carga. El equilibrio perfecto.",
      "link": "/carroceria/hatchback"
    },
    {
      "title": "Pick Up",
      "category": "Fuerza y Capacidad",
      "src": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
      "description": "Robustas y capaces. Diseñadas para trabajo y aventura sin límites.",
      "link": "/carroceria/pick-up"
    }
  ]
}'),
('cta_cards', '{
  "cards": [
    {
      "type": "inventory",
      "title": "Conoce nuestro inventario",
      "description": "Autos seminuevos seleccionados cuidadosamente para ti.",
      "buttonText": "Ver inventario",
      "buttonLink": "/autos",
      "image": "https://cufm.mx/wp-content/uploads/2025/01/autos-trefa-.png"
    },
    {
      "type": "sell",
      "title": "¿Quieres vender tu auto?",
      "description": "Recibe una oferta por tu auto en un proceso rápido y transparente.",
      "buttonText": "Recibir una oferta",
      "buttonLink": "/vender-mi-auto",
      "image": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/klipartz.com.png"
    },
    {
      "type": "advisor",
      "title": "Hablar con un asesor",
      "description": "Obtén una asesoría personalizada de un experto de nuestro equipo.",
      "buttonText": "Iniciar Chat",
      "buttonLink": "https://wa.me/5218187049079",
      "image": "/images/fer-help.png"
    },
    {
      "type": "financing",
      "title": "Tramita tu crédito en línea",
      "description": "Nuevo portal de financiamiento con respuesta en 24 horas o menos.",
      "buttonText": "Ver autos elegibles",
      "buttonLink": "/escritorio/aplicacion",
      "image": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/financiamiento.png"
    }
  ]
}'),
('youtube_vsl', '{
  "title": "Conoce nuestra historia",
  "subtitle": "Descubre cómo TREFA se ha convertido en la agencia líder de autos seminuevos en el noreste de México",
  "videoId": "p-nMlle-xfw"
}'),
('testimonial', '{
  "image": "/images/testimonio.png",
  "alt": "Testimonio de cliente TREFA"
}')
ON CONFLICT (section_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_homepage_content_section_key ON homepage_content(section_key);

COMMENT ON TABLE homepage_content IS 'Stores editable content for the homepage CMS';
COMMENT ON COLUMN homepage_content.section_key IS 'Unique identifier for each homepage section';
COMMENT ON COLUMN homepage_content.content IS 'JSON content for the section';
