
-- Create table for editable site content
CREATE TABLE public.site_content (
    key TEXT PRIMARY KEY,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access, so visitors can see the content
CREATE POLICY "Public can read site content"
ON public.site_content
FOR SELECT
USING (true);

-- Allow admins to manage (create, update, delete) the content
CREATE POLICY "Admins can manage site content"
ON public.site_content
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Function to automatically update the 'updated_at' timestamp on change
CREATE OR REPLACE FUNCTION public.update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function before an update
CREATE TRIGGER set_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_site_content_updated_at();

-- Populate the table with the current hardcoded text from the "History" section
INSERT INTO public.site_content (key, content) VALUES
('history_title', 'Nossa História'),
('history_subtitle', 'Mais de 10 anos de história pedalando juntos pelas ruas de Manaus'),
('history_event_title', '2013 - O Início'),
('history_main_title', 'Como Tudo Começou'),
('history_p1', 'Em 2013, um pequeno grupo de entusiastas da bicicleta se reuniu com uma visão: transformar as noites de Manaus em um espaço de comunidade, saúde e exploração urbana. O primeiro passeio contou com apenas 15 ciclistas, mas a energia era contagiante.'),
('history_p2', 'Usando coletes improvisados e lanternas básicas, o grupo percorreu 8km pelo centro da cidade, descobrindo uma Manaus diferente - mais silenciosa, mais íntima e cheia de possibilidades.'),
('history_p3', 'Hoje, mais de uma década depois, o Bike Night Amazonas cresceu para centenas de participantes regulares, mas mantém o mesmo espírito inclusivo e a paixão por unir pessoas através do ciclismo noturno.');
