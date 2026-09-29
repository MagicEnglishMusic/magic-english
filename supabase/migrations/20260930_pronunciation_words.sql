-- ==============================================================================
-- MIGRATION: 20260930_pronunciation_words.sql
-- TABELA DE TERMOS E VOCABULÁRIOS AVULSOS PARA O LABORATÓRIO DE PRONÚNCIA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pronunciation_words (
  id TEXT PRIMARY KEY DEFAULT ('voc-' || floor(extract(epoch from now()) * 1000)::text),
  word TEXT NOT NULL,
  phonetic TEXT,
  translation TEXT,
  song TEXT,
  tip TEXT,
  score INTEGER DEFAULT 95,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.pronunciation_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pronunciation words are readable by authenticated users" ON public.pronunciation_words;
CREATE POLICY "Pronunciation words are readable by authenticated users"
  ON public.pronunciation_words FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage pronunciation words" ON public.pronunciation_words;
CREATE POLICY "Admins can manage pronunciation words"
  ON public.pronunciation_words FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );
