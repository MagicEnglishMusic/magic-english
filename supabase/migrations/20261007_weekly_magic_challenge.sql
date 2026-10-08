-- ==============================================================================
-- MIGRATION INCREMENTAL: 20261007_weekly_magic_challenge.sql
-- DESAFIO MAGIC DA SEMANA: SEED APP_SETTINGS + TABELA HISTÓRICO + PATCH GRANT_XP
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASSO 1: CONFIGURAÇÃO DO DESAFIO ATIVO (APP_SETTINGS)
-- ------------------------------------------------------------------------------
INSERT INTO public.app_settings (key, value)
VALUES (
  'weekly_challenge',
  jsonb_build_object(
    'id', 'chal-2026-w41',
    'week_key', '2026-W41',
    'title', 'Domine a Travel Song',
    'description', 'Complete as 3 etapas essenciais de fixação musical desta semana e desbloqueie o Badge Exclusivo de Viagem!',
    'song_id', 'song-travel-01',
    'lesson_id', 'les-01',
    'xp_reward', 300,
    'badge_id', 'badge-traveler-ready',
    'badge_title', 'Master Traveler',
    'badge_icon', '✈️',
    'is_active', true,
    'auto_rotate', true,
    'start_date', '2026-10-05',
    'end_date', '2026-10-11',
    'steps', jsonb_build_array(
      jsonb_build_object('id', 'step-1', 'type', 'LESSON', 'label', 'Assistir a Aula 01 (No Aeroporto)', 'target_id', 'les-01', 'required', true),
      jsonb_build_object('id', 'step-2', 'type', 'PRACTICE', 'label', 'Fazer Prática Musical da música', 'target_id', 'song-travel-01', 'required', true),
      jsonb_build_object('id', 'step-3', 'type', 'PRONUNCIATION', 'label', 'Treinar pronúncia com nota > 80%', 'target_id', 'song-travel-01', 'min_score', 80, 'required', true)
    )
  )
)
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- PASSO 2: TABELA DE FILA E HISTÓRICO DE DESAFIOS (COM created_by PARA AUDITORIA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_magic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key TEXT NOT NULL,
  queue_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'archived'
  title TEXT NOT NULL,
  description TEXT,
  song_id TEXT REFERENCES public.songs(id) ON DELETE SET NULL,
  lesson_id TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 300,
  badge_id TEXT,
  badge_title TEXT,
  badge_icon TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.weekly_magic_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Weekly history readable by authenticated" ON public.weekly_magic_history;
CREATE POLICY "Weekly history readable by authenticated" 
  ON public.weekly_magic_history FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Weekly history manageable by admin" ON public.weekly_magic_history;
CREATE POLICY "Weekly history manageable by admin" 
  ON public.weekly_magic_history FOR ALL 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- PASSO 3: PATCH INCREMENTAL DO RPC GRANT_XP
-- Preserva 100% do código existente de produção e adiciona somente o case:
-- WHEN 'weekly_magic_challenge'
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_xp(p_source TEXT, p_ref TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_rules JSONB;
  v_challenge JSONB;
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

  -- 4. Validação Específica por Fonte (Regras Homologadas em Produção)
  CASE p_source
    -- [PRESERVADO] 4.1 Desafio Diário (Trava por data de São Paulo)
    WHEN 'daily_challenge' THEN
      v_today_sp := to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
      IF v_clean_ref <> v_today_sp AND v_clean_ref NOT LIKE (v_today_sp || ':%') THEN
        RAISE EXCEPTION 'Referência do desafio diário deve ser a data atual de São Paulo (%) ou no formato "%:id". Recebido: %', v_today_sp, v_today_sp, v_clean_ref;
      END IF;
      v_rule_val := v_rules->>'daily_challenge';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 25 END;

    -- [PRESERVADO] 4.2 Treino de Pronúncia por Verso ('<song_id>:<indice>')
    WHEN 'pronunciation_item' THEN
      v_song_id := split_part(v_clean_ref, ':', 1);
      v_verse_idx_str := split_part(v_clean_ref, ':', 2);
      IF v_song_id IS NULL OR LENGTH(v_song_id) = 0 OR v_verse_idx_str IS NULL OR v_verse_idx_str !~ '^\d+$' THEN
        RAISE EXCEPTION 'Referência de pronúncia inválida: %', v_clean_ref;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id::text = v_song_id) THEN
        RAISE EXCEPTION 'Música "%" não encontrada.', v_song_id;
      END IF;
      v_rule_val := v_rules->>'pronunciation_item';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 20 END;

    -- [PRESERVADO] 4.3 Prática Musical Completa
    WHEN 'practice_complete' THEN
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id::text = v_clean_ref) THEN
        RAISE EXCEPTION 'Música "%" não encontrada.', v_clean_ref;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.song_mastery WHERE user_id = v_user_id AND song_id::text = v_clean_ref) THEN
        RAISE EXCEPTION 'Progresso da música % não encontrado.', v_clean_ref;
      END IF;
      v_rule_val := v_rules->>'practice_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 75 END;

    -- [PRESERVADO] 4.4 Maestria Musical Completa (100% ou 5 steps)
    WHEN 'song_mastery' THEN
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id::text = v_clean_ref) THEN
        RAISE EXCEPTION 'Música "%" não encontrada.', v_clean_ref;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.song_mastery 
         WHERE user_id = v_user_id 
           AND song_id::text = v_clean_ref 
           AND (mastery_percent = 100 OR (step_video = true AND step_song = true AND step_reverse_translation = true AND step_sing_along = true AND step_final_challenge = true))
      ) THEN
        RAISE EXCEPTION 'A música % ainda não atingiu 100%% de domínio.', v_clean_ref;
      END IF;
      v_rule_val := v_rules->>'song_mastery';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 100 END;

    -- [PRESERVADO] 4.5 Conclusão de Aula
    WHEN 'lesson_complete' THEN
      IF NOT EXISTS (SELECT 1 FROM public.user_progress WHERE user_id = v_user_id AND lesson_id::text = v_clean_ref AND completed = true) THEN
        RAISE EXCEPTION 'A aula % ainda não foi marcada como concluída.', v_clean_ref;
      END IF;
      v_rule_val := v_rules->>'lesson_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 100 END;

    -- [PRESERVADO] 4.6 Resgate de XP da Música
    WHEN 'song_claim' THEN
      IF NOT EXISTS (SELECT 1 FROM public.song_mastery WHERE user_id = v_user_id AND song_id::text = v_clean_ref AND xp_claimed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'O resgate de XP da música % não foi registrado.', v_clean_ref;
      END IF;
      v_rule_val := v_rules->>'song_claim';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 50 END;

    -- [PRESERVADO] 4.7 Conclusão de Pronúncia IA
    WHEN 'pronunciation_complete' THEN
      v_rule_val := v_rules->>'pronunciation_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 20 END;

    -- [PRESERVADO] 4.8 Resgate de Conquista / Badge ('badge_claim')
    WHEN 'badge_claim' THEN
      v_amount := CASE v_clean_ref
        WHEN 'badge-first-song' THEN 50
        WHEN 'badge-first-step' THEN 30
        WHEN 'badge-perfect-week' THEN 100
        WHEN 'badge-voice-evolution' THEN 150
        WHEN 'badge-music-master' THEN 300
        WHEN 'badge-module-complete' THEN 200
        WHEN 'badge-traveler-ready' THEN 500
        ELSE 50
      END;

    -- [NOVO INCREMENTO CIRÚRGICO] 4.9 Desafio Magic da Semana
    WHEN 'weekly_magic_challenge' THEN
      -- 1. Checa se o Desafio Semanal está ativo em app_settings
      SELECT value INTO v_challenge FROM public.app_settings WHERE key = 'weekly_challenge';
      IF v_challenge IS NULL OR (v_challenge->>'is_active')::boolean IS NOT TRUE THEN
        RAISE EXCEPTION 'Nenhum Desafio Magic da Semana ativo no momento.';
      END IF;

      -- 2. Busca valor de XP em xp_rules (definido no painel Gamificação & XP)
      v_rule_val := COALESCE(
        v_rules->>'weekly_magic_challenge',
        v_rules->>'WEEKLY_MAGIC_CHALLENGE',
        v_challenge->>'xp_reward'
      );

      -- 3. Define montante de XP com fallback padrão de 300
      v_amount := CASE 
        WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER 
        ELSE 300 
      END;

    ELSE
      RAISE EXCEPTION 'Origem de XP desconhecida: %', p_source;
  END CASE;

  -- 5. Inserção Atômica e Idempotente no Histórico (xp_events)
  INSERT INTO public.xp_events (user_id, source, ref, amount)
  VALUES (v_user_id, p_source, v_clean_ref, v_amount)
  ON CONFLICT (user_id, source, ref) DO NOTHING
  RETURNING id INTO v_event_id;

  -- Se já foi concedido anteriormente, retorna sem duplicar
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
      'message', 'Recompensa deste desafio semanal já foi resgatada anteriormente.'
    );
  END IF;

  -- 6. Atualização Atômica de XP em profiles (Bypass do trigger via app.xp_rpc)
  PERFORM set_config('app.xp_rpc', '1', true);

  UPDATE public.profiles
     SET xp = COALESCE(xp, 0) + v_amount,
         updated_at = now()
   WHERE id = v_user_id
  RETURNING xp INTO v_new_xp;

  -- 7. Atualização do Nível do Aluno (Fórmula Oficial)
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

-- ------------------------------------------------------------------------------
-- PASSO 4: PERMISSÕES DE EXECUÇÃO
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.grant_xp(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_xp(TEXT, TEXT) TO authenticated;
