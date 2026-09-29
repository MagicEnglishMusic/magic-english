-- ==============================================================================
-- MIGRATION: 20260930_xp_lock.sql
-- TRAVA DEFINITIVA DE SEGURANÇA DE XP, NÍVEL E RANKING NO SUPABASE
-- (EXECUTAR SOMENTE APÓS O CÓDIGO NOVO ESTAR EM OPERAÇÃO)
-- ==============================================================================

-- 1. EXTENSÃO DO TRIGGER DE PROTEÇÃO EM PROFILES
-- Mantém a mesma semântica da função protect_profile_role com RAISE EXCEPTION
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permite se for chamado pelo backend/service_role, auth.uid() nulo, administrador ou RPC autorizada
  IF auth.uid() IS NULL 
     OR (auth.jwt() ->> 'role') = 'service_role' 
     OR public.is_admin() 
     OR current_setting('app.xp_rpc', true) = '1' THEN
    RETURN NEW;
  END IF;

  -- Para alunos comuns, bloqueia qualquer tentativa de alterar campos sensíveis
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: role';
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: plan';
  END IF;

  IF NEW.access_status IS DISTINCT FROM OLD.access_status THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: access_status';
  END IF;

  IF NEW.kiwify_order_id IS DISTINCT FROM OLD.kiwify_order_id THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: kiwify_order_id';
  END IF;

  IF NEW.kiwify_status IS DISTINCT FROM OLD.kiwify_status THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: kiwify_status';
  END IF;

  IF NEW.xp IS DISTINCT FROM OLD.xp THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: xp';
  END IF;

  IF NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: level';
  END IF;

  IF NEW.level_number IS DISTINCT FROM OLD.level_number THEN
    RAISE EXCEPTION 'Alteracao de campo protegido nao permitida: level_number';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();


-- 2. BLOQUEIO DE ESCRITA DE ALUNOS NA TABELA RANKING (APENAS LEITURA PARA ALUNOS)
ALTER TABLE public.ranking ENABLE ROW LEVEL SECURITY;

-- Limpeza defensiva das políticas existentes
DROP POLICY IF EXISTS "Anyone can view ranking" ON public.ranking;
DROP POLICY IF EXISTS "Users can update own ranking" ON public.ranking;
DROP POLICY IF EXISTS "Ranking is readable by everyone" ON public.ranking;
DROP POLICY IF EXISTS "No direct student write on ranking" ON public.ranking;
DROP POLICY IF EXISTS "Admins and service role can update ranking" ON public.ranking;
DROP POLICY IF EXISTS "ranking_read_policy" ON public.ranking;
DROP POLICY IF EXISTS "ranking_admin_policy" ON public.ranking;

-- Leitura pública para todos os usuários autenticados
CREATE POLICY "Ranking is readable by everyone"
  ON public.ranking FOR SELECT
  TO authenticated
  USING (true);

-- Escrita restrita a administradores e service role (alunos só pontuam via grant_xp)
CREATE POLICY "Admins and service role can update ranking"
  ON public.ranking FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );


-- 3. REMOÇÃO DA CONSTRAINT DUPLICADA EM SONG_MASTERY
ALTER TABLE public.song_mastery
  DROP CONSTRAINT IF EXISTS song_mastery_user_song_unique;


-- 4. CONSULTA DE CONFERÊNCIA DE POLÍTICAS RLS ATIVAS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'ranking', 'xp_events', 'community_posts', 'community_likes')
ORDER BY tablename, policyname;
