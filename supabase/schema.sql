-- ==============================================================================
-- MAGIC ENGLISH — SUPABASE (BANCO DE DADOS & AUTH) + GOOGLE DRIVE (ARQUIVOS)
-- ==============================================================================
-- Arquitetura Otimizada:
-- 1. Google Drive: Armazenamento principal de vídeos (MP4), áudios (MP3), PDFs e imagens.
-- 2. Supabase: PostgreSQL (metadados leves, relações SSOT, autenticação, progresso, XP e URLs do Drive).
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DEFINITION (COM SUPORTE A LINKS EXTERNOS DO GOOGLE DRIVE)
-- ==============================================================================

-- 2.1 PROFILES (Alunos e Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor')),
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  objective TEXT DEFAULT '✈️ Viajar',
  level TEXT DEFAULT 'Nível 1 • First Steps',
  level_number INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  daily_study_time TEXT DEFAULT '20 minutos',
  plan TEXT DEFAULT 'VIP Pro',
  is_onboarded BOOLEAN DEFAULT false,
  access_status TEXT DEFAULT 'pending_payment' CHECK (access_status IN ('active', 'pending_payment', 'blocked', 'refunded', 'trial')),
  subscription_expires_at TIMESTAMPTZ,
  kiwify_order_id TEXT,
  kiwify_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.2 MODULES (Módulos do Curso)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  banner_url TEXT NOT NULL, -- Link Google Drive / Imagem externa
  order_index INTEGER DEFAULT 1,
  lessons_count INTEGER DEFAULT 0,
  songs_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.3 LESSONS (Aulas em Vídeo)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_number TEXT NOT NULL,
  video_url TEXT,     -- Link de Vídeo Google Drive (ex: https://drive.google.com/file/d/ID/preview)
  thumbnail_url TEXT, -- Link de Thumbnail Google Drive (ex: https://drive.google.com/thumbnail?id=ID)
  duration TEXT NOT NULL DEFAULT '15 min',
  order_index INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.4 SONGS (Magic Songs SSOT)
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT DEFAULT 'Música de Fixação',
  cover_url TEXT NOT NULL, -- Link Capa Google Drive
  audio_url TEXT,          -- Link Áudio Google Drive (ex: https://drive.google.com/uc?export=download&id=ID)
  duration TEXT DEFAULT '3:20',
  bpm TEXT DEFAULT '108 BPM',
  level TEXT DEFAULT 'Iniciante',
  lyrics_en TEXT NOT NULL,
  lyrics_pt TEXT NOT NULL,
  timestamps JSONB DEFAULT '[]'::jsonb,
  pronunciation_guide JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.5 MATERIALS (Materiais e PDFs para Download)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Link PDF Google Drive (ex: https://drive.google.com/file/d/ID/view)
  file_type TEXT DEFAULT 'PDF',
  file_size TEXT DEFAULT '1.8 MB',
  category TEXT DEFAULT 'Resumo & Vocabulário',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.6 USER_PROGRESS (Progresso do Aluno nas Aulas)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- 2.7 SONG_MASTERY (5 Etapas do Método Musical)
CREATE TABLE IF NOT EXISTS public.song_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  step_video BOOLEAN DEFAULT false,
  step_song BOOLEAN DEFAULT false,
  step_reverse_translation BOOLEAN DEFAULT false,
  step_sing_along BOOLEAN DEFAULT false,
  step_final_challenge BOOLEAN DEFAULT false,
  mastery_percent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, song_id)
);

-- 2.8 REWARDS (Conquistas e Badges)
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_amount INTEGER DEFAULT 50,
  badge_icon TEXT DEFAULT '🏆',
  badge_category TEXT DEFAULT 'progresso',
  unlocked_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.9 RANKING (Classificação e Ligas)
CREATE TABLE IF NOT EXISTS public.ranking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  league TEXT DEFAULT 'Liga Bronze',
  weekly_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  position INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- 2.10 PURCHASES (Compras e Assinaturas Kiwify)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kiwify_order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_mobile TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  offer_id TEXT,
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'paid',
  access_status TEXT NOT NULL DEFAULT 'active' CHECK (access_status IN ('active', 'pending_payment', 'blocked', 'refunded', 'trial')),
  webhook_event TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 3.1 Profiles Policies
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3.2 Content Read Policies (Modules, Lessons, Songs, Materials)
CREATE POLICY "Modules viewable by authenticated users" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Lessons viewable by authenticated users" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Songs viewable by authenticated users" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Materials viewable by authenticated users" ON public.materials FOR SELECT USING (true);

-- 3.3 Content Write Policies (Admin Only)
CREATE POLICY "Admins manage modules" ON public.modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage songs" ON public.songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage materials" ON public.materials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3.4 User Progress Policies
CREATE POLICY "Users view and manage own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view and manage own song mastery" ON public.song_mastery FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own rewards" ON public.rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rewards" ON public.rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3.5 Ranking Policies
CREATE POLICY "Ranking viewable by all users" ON public.ranking FOR SELECT USING (true);
CREATE POLICY "Ranking updatable by authenticated user for self" ON public.ranking FOR ALL USING (auth.uid() = user_id);

-- 3.6 Purchases Policies (Kiwify Commercial Access)
CREATE POLICY "Students can view own purchases" ON public.purchases FOR SELECT TO authenticated USING (
  auth.uid() = user_id 
  OR customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins have full access to purchases" ON public.purchases FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ==============================================
-- 4. AUTOMATIC PROFILE TRIGGER ON AUTH.USERS INSERT
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role, xp, streak, level, level_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    0,
    0,
    'Nível 1 • First Steps',
    1
  );

  INSERT INTO public.ranking (user_id, league, weekly_xp, total_xp, position)
  VALUES (NEW.id, 'Liga Bronze', 0, 0, 99);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================
-- 5. INITIAL SEED DATA
-- ==============================================

-- Seed Modules
INSERT INTO public.modules (id, title, subtitle, description, banner_url, order_index, lessons_count, songs_count, status)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Inglês para Viagens', 'MÓDULO 01', 'Domine aeroporto, hotel, imigração e restaurantes com músicas práticas.', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80', 1, 6, 2, 'published'),
  ('a0000001-0000-0000-0000-000000000002', 'Conversação do Dia a Dia', 'MÓDULO 02', 'Expressões essenciais, cumprimentos e situações cotidianas reais.', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80', 2, 8, 3, 'published'),
  ('a0000001-0000-0000-0000-000000000003', 'Inglês para Negócios & Trabalho', 'MÓDULO 03', 'Reuniões internacionais, e-mails executivos e vocabulário corporativo.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', 3, 5, 2, 'published'),
  ('a0000001-0000-0000-0000-000000000004', 'Pronúncia Musical & Flow', 'MÓDULO 04', 'Conexão de sons e redução de sotaque através do ritmo.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80', 4, 7, 4, 'published')
ON CONFLICT (id) DO NOTHING;

-- Seed Lessons
INSERT INTO public.lessons (id, module_id, title, lesson_number, video_url, thumbnail_url, duration, order_index, description)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'No Aeroporto: Check-in, Embarque e Bagagem', 'Aula 01', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&auto=format&fit=crop&q=80', '14 minutos', 1, 'Aprenda tudo sobre despacho de malas, cartão de embarque e portão.'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Passando pela Imigração e Alfândega', 'Aula 02', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80', '18 minutos', 2, 'Como responder as perguntas do oficial de imigração com calma e clareza.'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'No Hotel: Check-in, Chaves e Serviços', 'Aula 03', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80', '16 minutos', 3, 'Diálogos de recepção de hotel, horários de café e resolução de problemas.')
ON CONFLICT (id) DO NOTHING;

-- Seed Songs
INSERT INTO public.songs (id, lesson_id, module_id, title, subtitle, category, cover_url, audio_url, duration, bpm, level, lyrics_en, lyrics_pt, timestamps)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Travel Time — Airport Edition', 'Inglês para Viagens • Aula 01', 'Música de Fixação', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80', 'https://actions.google.com/sounds/v1/ambiences/airport_terminal.ogg', '3:24', '108 BPM', 'Iniciante',
  'Where is the gate? I need to know.\nMy flight is ready, here we go!\nShow your passport, take your bag,\nLook at the board and read the tag.',
  'Onde fica o portão? Eu preciso saber.\nMeu voo está pronto, aqui vamos nós!\nMostre seu passaporte, pegue sua mala,\nOlhe para o painel e leia a etiqueta.',
  '[{"time": "0:04", "en": "Where is the gate? I need to know.", "pt": "Onde fica o portão? Eu preciso saber."}, {"time": "0:12", "en": "My flight is ready, here we go!", "pt": "Meu voo está pronto, aqui vamos nós!"}, {"time": "0:20", "en": "Show your passport, take your bag,", "pt": "Mostre seu passaporte, pegue sua mala,"}, {"time": "0:28", "en": "Look at the board and read the tag.", "pt": "Olhe para o painel e leia a etiqueta."}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Materials
INSERT INTO public.materials (id, lesson_id, name, file_url, file_type, file_size, category)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Resumo da Aula 01 — Vocabulário de Aeroporto.pdf', 'https://example.com/materials/aula-01-resumo.pdf', 'PDF', '2.4 MB', 'Resumo da Aula'),
  ('d0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'Letra & Guia de Pronúncia — Travel Time.pdf', 'https://example.com/materials/travel-time-guia.pdf', 'PDF', '1.6 MB', 'Letra da Música')
ON CONFLICT (id) DO NOTHING;
