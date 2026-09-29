-- ==============================================================================
-- MIGRATION: 20260930_song_challenge_progress.sql
-- ADICIONA COLUNA CHALLENGE_INDEX NA TABELA SONG_MASTERY PARA RETOMADA DE VERSO
-- ==============================================================================

ALTER TABLE public.song_mastery 
  ADD COLUMN IF NOT EXISTS challenge_index INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.song_mastery.challenge_index IS 'Índice do último verso alcançado ou aprovado na Etapa 4 (Cantar Sem Apoio)';
