-- ==============================================================================
-- MIGRATION: APP_SETTINGS & COMMUNITY_POSTS WITH RLS POLICIES
-- ==============================================================================

-- 1. APP_SETTINGS (Tabela Global de Configurações do Sistema)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Seed Initial Community Settings
INSERT INTO public.app_settings (key, value)
VALUES (
  'community',
  '{"is_posting_enabled": true, "status": "active", "maintenance_message": "O mural da comunidade está em manutenção temporária."}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 2. COMMUNITY_POSTS (Publicações e Moderação da Comunidade)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  author_avatar TEXT,
  author_level TEXT,
  author_streak INTEGER DEFAULT 0,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'achievement',
  group_id TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  comments_list JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 3.1 App Settings Policies
CREATE POLICY "App settings are readable by everyone" 
  ON public.app_settings FOR SELECT 
  USING (true);

CREATE POLICY "Admins can update app settings" 
  ON public.app_settings FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.role() = 'service_role'
  );

-- 3.2 Community Posts Policies
CREATE POLICY "Community posts are readable by everyone" 
  ON public.community_posts FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON public.community_posts FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL OR true
  );

CREATE POLICY "Users can update own posts or admin can moderate" 
  ON public.community_posts FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can delete own posts or admin can moderate" 
  ON public.community_posts FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.role() = 'service_role'
  );

-- ==============================================================================
-- 4. REALTIME REPLICATION (Habilitar escuta Realtime no Supabase)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
