-- ==============================================================================
-- MIGRATION: CORREÇÃO DA LIGA PADRÃO E RECÁLCULO DOS REGISTROS EXISTENTES
-- ==============================================================================
-- 1. Corrige o trigger handle_new_user() para inserir novos alunos na Liga Bronze.
-- 2. Altera o valor padrão da coluna league na tabela public.ranking para 'Liga Bronze'.
-- 3. Atualiza os registros existentes com base no XP real acumulado de cada aluno.
-- ==============================================================================

-- 1. Atualizar o Default da Coluna na Tabela Ranking
ALTER TABLE public.ranking ALTER COLUMN league SET DEFAULT 'Liga Bronze';

-- 2. Atualizar a Função Trigger para Novos Cadastros
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

-- 3. Recalcular e Corrigir os Registros Existentes no Banco de Dados
-- Regras de XP por Liga (preservando XP e progresso real):
-- - Liga Magic: XP >= 15000
-- - Liga Diamante: XP >= 8000
-- - Liga Ouro: XP >= 4000
-- - Liga Prata: XP >= 1500
-- - Liga Bronze: XP < 1500 (padrão de entrada)

UPDATE public.ranking
SET league = CASE
  WHEN COALESCE(total_xp, weekly_xp, 0) >= 15000 THEN 'Liga Magic'
  WHEN COALESCE(total_xp, weekly_xp, 0) >= 8000  THEN 'Liga Diamante'
  WHEN COALESCE(total_xp, weekly_xp, 0) >= 4000  THEN 'Liga Ouro'
  WHEN COALESCE(total_xp, weekly_xp, 0) >= 1500  THEN 'Liga Prata'
  ELSE 'Liga Bronze'
END,
updated_at = TIMEZONE('utc', NOW())
WHERE league = '💎 Liga Diamante' OR league IS NULL OR COALESCE(total_xp, weekly_xp, 0) < 8000;
