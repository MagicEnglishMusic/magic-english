-- ==============================================================================
-- MAGIC ENGLISH — REMOÇÃO SEGURA DE USUÁRIO DE TESTE
-- Execute este script no SQL Editor do Supabase Dashboard
-- ==============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Localizar o UUID do usuário pelo e-mail
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'ivinabrunadesa@gmail.com';

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id 
    FROM public.profiles 
    WHERE email = 'ivinabrunadesa@gmail.com';
  END IF;

  IF v_user_id IS NOT NULL THEN
    -- 2. Limpeza de tabelas filhas / gamificação / progresso
    DELETE FROM public.user_progress WHERE user_id = v_user_id;
    DELETE FROM public.song_mastery WHERE user_id = v_user_id;
    DELETE FROM public.rewards WHERE user_id = v_user_id;
    DELETE FROM public.ranking WHERE user_id = v_user_id;
    
    -- 3. Limpeza do perfil público
    DELETE FROM public.profiles WHERE id = v_user_id OR email = 'ivinabrunadesa@gmail.com';
    
    -- 4. Limpeza da autenticação Supabase
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário ivinabrunadesa@gmail.com (UUID: %) foi removido com sucesso.', v_user_id;
  ELSE
    RAISE NOTICE 'Nenhum registro encontrado para ivinabrunadesa@gmail.com.';
  END IF;
END $$;

-- ==============================================================================
-- 5. VALIDAÇÃO PÓS-EXCLUSÃO (Verificação de 0 registros)
-- ==============================================================================
SELECT 'auth.users' AS tabela, COUNT(*) AS registros_restantes FROM auth.users WHERE email = 'ivinabrunadesa@gmail.com'
UNION ALL
SELECT 'profiles' AS tabela, COUNT(*) AS registros_restantes FROM public.profiles WHERE email = 'ivinabrunadesa@gmail.com';
