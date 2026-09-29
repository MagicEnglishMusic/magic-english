-- ==============================================================================
-- MIGRATION: 20260930_xp_server.sql
-- TABELA XP_EVENTS E FUNÇÃO GRANT_XP (CONCESSÃO DE XP ATÔMICA E SEGURA NO SERVIDOR)
-- ==============================================================================

-- 1. TABELA DE EVENTOS DE XP (HISTÓRICO IMUTÁVEL COM TRAVA ÚNICA POR ATIVIDADE)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  ref TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT xp_events_user_source_ref_unique UNIQUE (user_id, source, ref)
);

-- RLS para xp_events
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own xp events or admin can read all" ON public.xp_events;
CREATE POLICY "Users can read own xp events or admin can read all"
  ON public.xp_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );

DROP POLICY IF EXISTS "No direct insert on xp_events" ON public.xp_events;
DROP POLICY IF EXISTS "No direct update on xp_events" ON public.xp_events;
DROP POLICY IF EXISTS "No direct delete on xp_events" ON public.xp_events;


-- 2. FUNÇÃO GRANT_XP (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.grant_xp(p_source TEXT, p_ref TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_rules JSONB;
  v_amount INTEGER;
  v_event_id UUID;
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_new_level_number INTEGER;
  v_new_level_title TEXT;
  v_clean_ref TEXT;
  v_song_id TEXT;
  v_verse_idx_str TEXT;
  v_today_sp TEXT;
  v_rule_val TEXT;
BEGIN
  -- 1. Validação de Autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- 2. Validação Rígida de Parâmetros de Entrada
  v_clean_ref := TRIM(p_ref);
  IF v_clean_ref IS NULL OR LENGTH(v_clean_ref) = 0 OR LENGTH(v_clean_ref) > 100 THEN
    RAISE EXCEPTION 'Referência inválida (p_ref nulo, vazio ou maior que 100 caracteres).';
  END IF;

  -- 3. Carregamento de Regras Dinâmicas (app_settings -> xp_rules)
  SELECT value INTO v_rules FROM public.app_settings WHERE key = 'xp_rules';

  -- 4. Validação Específica por Fonte (com checagem de pré-condições reais no banco)
  CASE p_source
    -- 4.1 Desafio Diário (Trava por data de São Paulo)
    WHEN 'daily_challenge' THEN
      v_today_sp := to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
      IF v_clean_ref <> v_today_sp AND v_clean_ref NOT LIKE (v_today_sp || ':%') THEN
        RAISE EXCEPTION 'Referência do desafio diário deve ser a data atual de São Paulo (%) ou no formato "%:id". Recebido: %', v_today_sp, v_today_sp, v_clean_ref;
      END IF;
      
      v_rule_val := v_rules->>'daily_challenge';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 25 END;

    -- 4.2 Treino de Pronúncia por Verso ('<song_id>:<indice>')
    WHEN 'pronunciation_item' THEN
      v_song_id := split_part(v_clean_ref, ':', 1);
      v_verse_idx_str := split_part(v_clean_ref, ':', 2);

      IF v_song_id IS NULL OR LENGTH(v_song_id) = 0 OR v_verse_idx_str IS NULL OR v_verse_idx_str !~ '^\d+$' THEN
        RAISE EXCEPTION 'Referência de pronúncia inválida. Formato esperado: "<song_id>:<indice_verso>". Recebido: %', v_clean_ref;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = v_song_id) THEN
        RAISE EXCEPTION 'Música "%" não encontrada na base de dados.', v_song_id;
      END IF;

      v_rule_val := v_rules->>'pronunciation_item';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 20 END;

    -- 4.3 Prática Musical Completa
    WHEN 'practice_complete' THEN
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = v_clean_ref) THEN
        RAISE EXCEPTION 'Música "%" não encontrada.', v_clean_ref;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.song_mastery 
         WHERE user_id = v_user_id 
           AND song_id = v_clean_ref
      ) THEN
        RAISE EXCEPTION 'O usuário ainda não possui registro de progresso para a música %.', v_clean_ref;
      END IF;

      v_rule_val := v_rules->>'practice_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 75 END;

    -- 4.4 Maestria Musical Completa (100% ou 5 steps concluídos)
    WHEN 'song_mastery' THEN
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = v_clean_ref) THEN
        RAISE EXCEPTION 'Música "%" não encontrada.', v_clean_ref;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.song_mastery 
         WHERE user_id = v_user_id 
           AND song_id = v_clean_ref 
           AND (
             mastery_percent = 100 
             OR (step_video = true AND step_song = true AND step_reverse_translation = true AND step_sing_along = true AND step_final_challenge = true)
           )
      ) THEN
        RAISE EXCEPTION 'A música % ainda não atingiu 100%% de domínio no progresso do aluno.', v_clean_ref;
      END IF;

      v_rule_val := v_rules->>'song_mastery';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 100 END;

    -- 4.5 Conclusão de Aula
    WHEN 'lesson_complete' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.user_progress 
         WHERE user_id = v_user_id 
           AND lesson_id::text = v_clean_ref 
           AND completed = true
      ) THEN
        RAISE EXCEPTION 'A aula % ainda não foi marcada como concluída no progresso do usuário.', v_clean_ref;
      END IF;

      v_rule_val := v_rules->>'lesson_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 100 END;

    -- 4.6 Resgate de XP da Música (Quiz / Desafio)
    WHEN 'song_claim' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.song_mastery 
         WHERE user_id = v_user_id 
           AND song_id = v_clean_ref 
           AND xp_claimed_at IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'O resgate de XP da música % ainda não foi registrado no banco.', v_clean_ref;
      END IF;

      v_rule_val := v_rules->>'song_claim';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 50 END;

    ELSE
      RAISE EXCEPTION 'Origem de XP desconhecida: %', p_source;
  END CASE;

  -- 5. Inserção Atômica e Idempotente no Histórico (xp_events)
  INSERT INTO public.xp_events (user_id, source, ref, amount)
  VALUES (v_user_id, p_source, v_clean_ref, v_amount)
  ON CONFLICT (user_id, source, ref) DO NOTHING
  RETURNING id INTO v_event_id;

  -- Se já foi concedido anteriormente, retorna sem duplicar pontuação
  IF v_event_id IS NULL THEN
    SELECT COALESCE(xp, 0), level, level_number 
      INTO v_current_xp, v_new_level_title, v_new_level_number
      FROM public.profiles 
     WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'granted', false,
      'amount', 0,
      'total_xp', COALESCE(v_current_xp, 0),
      'level', COALESCE(v_new_level_title, 'Nível 1 • First Steps'),
      'level_number', COALESCE(v_new_level_number, 1),
      'message', 'XP desta atividade já foi resgatado anteriormente.'
    );
  END IF;

  -- 6. Atualização Atômica de XP em public.profiles (Eliminação de Race Condition)
  -- Habilita flag de sessão para bypass do trigger de proteção
  PERFORM set_config('app.xp_rpc', '1', true);

  UPDATE public.profiles
     SET xp = COALESCE(xp, 0) + v_amount,
         updated_at = now()
   WHERE id = v_user_id
  RETURNING xp INTO v_new_xp;

  -- 7. Cálculo Idêntico de Nível (Baseado em LEVELS_CONFIG do gamificationData.js)
  v_new_level_number := CASE 
    WHEN v_new_xp >= 15000 THEN 6
    WHEN v_new_xp >= 10000 THEN 5
    WHEN v_new_xp >= 6000 THEN 4
    WHEN v_new_xp >= 3000 THEN 3
    WHEN v_new_xp >= 1000 THEN 2
    ELSE 1
  END;

  v_new_level_title := CASE 
    WHEN v_new_xp >= 15000 THEN 'Nível 6 • Magic Fluent'
    WHEN v_new_xp >= 10000 THEN 'Nível 5 • English Explorer'
    WHEN v_new_xp >= 6000 THEN 'Nível 4 • Confident Speaker'
    WHEN v_new_xp >= 3000 THEN 'Nível 3 • Conversation Builder'
    WHEN v_new_xp >= 1000 THEN 'Nível 2 • Music Learner'
    ELSE 'Nível 1 • First Steps'
  END;

  UPDATE public.profiles
     SET level = v_new_level_title,
         level_number = v_new_level_number
   WHERE id = v_user_id;

  -- 8. Atualização Defensiva da Tabela Ranking
  BEGIN
    INSERT INTO public.ranking (user_id, total_xp, weekly_xp, updated_at)
    VALUES (v_user_id, v_new_xp, v_amount, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_xp = v_new_xp,
      weekly_xp = COALESCE(ranking.weekly_xp, 0) + v_amount,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Não aborta a concessão de XP caso o schema da tabela ranking tenha colunas adicionais
    RAISE WARNING 'Aviso ao sincronizar ranking para user %: %', v_user_id, SQLERRM;
  END;

  -- 9. Retorno com Sucesso
  RETURN jsonb_build_object(
    'granted', true,
    'amount', v_amount,
    'total_xp', v_new_xp,
    'level', v_new_level_title,
    'level_number', v_new_level_number
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_xp(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_xp(TEXT, TEXT) TO authenticated;
