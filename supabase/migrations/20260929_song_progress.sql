-- ==============================================================================
-- MIGRATION: 20260929_song_progress.sql
-- TABELAS: song_mastery, user_progress, materials
-- ==============================================================================
-- Instruções de Execução:
-- 1. Abra o Supabase Dashboard -> SQL Editor
-- 2. Cole este script completo e clique em "RUN"
-- ==============================================================================

-- 1. SONG_MASTERY: Adicionar coluna xp_claimed_at e garantir UNIQUE(user_id, song_id)
DO $$
BEGIN
  -- Adiciona coluna xp_claimed_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'song_mastery' 
      AND column_name = 'xp_claimed_at'
  ) THEN
    ALTER TABLE public.song_mastery ADD COLUMN xp_claimed_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Garante a constraint UNIQUE(user_id, song_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'song_mastery_user_id_song_id_key'
  ) THEN
    ALTER TABLE public.song_mastery ADD CONSTRAINT song_mastery_user_id_song_id_key UNIQUE (user_id, song_id);
  END IF;
END $$;

-- RLS Policies para song_mastery (Aluno acessa e atualiza apenas suas próprias linhas)
ALTER TABLE public.song_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own song mastery" ON public.song_mastery;
CREATE POLICY "Users can view own song mastery" ON public.song_mastery
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own song mastery" ON public.song_mastery;
CREATE POLICY "Users can insert own song mastery" ON public.song_mastery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own song mastery" ON public.song_mastery;
CREATE POLICY "Users can update own song mastery" ON public.song_mastery
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to song mastery" ON public.song_mastery;
CREATE POLICY "Admins have full access to song mastery" ON public.song_mastery
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 2. USER_PROGRESS: Adicionar coluna steps jsonb e garantir RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_progress' 
      AND column_name = 'steps'
  ) THEN
    ALTER TABLE public.user_progress ADD COLUMN steps JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Garante a constraint UNIQUE(user_id, lesson_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_progress_user_id_lesson_id_key'
  ) THEN
    ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
  END IF;
END $$;

-- RLS Policies para user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to user progress" ON public.user_progress;
CREATE POLICY "Admins have full access to user progress" ON public.user_progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 3. MATERIALS: Adicionar coluna module_id (nullable) referenciando modules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'module_id'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL;
  END IF;
END $$;
