-- ==============================================================================
-- ROLLBACK: 20261007_weekly_magic_challenge_rollback.sql
-- DESFAZER MIGRATION DO DESAFIO MAGIC DA SEMANA (SEM USO DE CASCADE)
-- ==============================================================================

-- 1. REMOVER TABELA DE FILA E HISTÓRICO (SEM CASCADE)
DROP TABLE IF EXISTS public.weekly_magic_history;

-- 2. REMOVER CONFIGURAÇÃO DE DESAFIO ATIVO DE APP_SETTINGS
DELETE FROM public.app_settings WHERE key = 'weekly_challenge';

-- 3. RESTAURAR RPC GRANT_XP PARA A VERSÃO ANTERIOR (SEM weekly_magic_challenge)
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_clean_ref := TRIM(p_ref);
  IF v_clean_ref IS NULL OR LENGTH(v_clean_ref) = 0 OR LENGTH(v_clean_ref) > 100 THEN
    RAISE EXCEPTION 'Referência inválida.';
  END IF;

  SELECT value INTO v_rules FROM public.app_settings WHERE key = 'xp_rules';

  CASE p_source
    WHEN 'daily_challenge' THEN
      v_today_sp := to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
      IF v_clean_ref <> v_today_sp AND v_clean_ref NOT LIKE (v_today_sp || ':%') THEN
        RAISE EXCEPTION 'Referência inválida: %', v_clean_ref;
      END IF;
      v_rule_val := v_rules->>'daily_challenge';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 25 END;

    WHEN 'pronunciation_item' THEN
      v_song_id := split_part(v_clean_ref, ':', 1);
      v_verse_idx_str := split_part(v_clean_ref, ':', 2);
      IF v_song_id IS NULL OR LENGTH(v_song_id) = 0 OR v_verse_idx_str IS NULL OR v_verse_idx_str !~ '^\d+$' THEN
        RAISE EXCEPTION 'Referência de pronúncia inválida: %', v_clean_ref;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = v_song_id) THEN
        RAISE EXCEPTION 'Música não encontrada.';
      END IF;
      v_rule_val := v_rules->>'pronunciation_item';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 20 END;

    WHEN 'practice_complete' THEN
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = v_clean_ref) THEN
        RAISE EXCEPTION 'Música não encontrada.';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.song_mastery WHERE user_id = v_user_id AND song_id = v_clean_ref) THEN
        RAISE EXCEPTION 'Progresso da música não encontrado.';
      END IF;
      v_rule_val := v_rules->>'practice_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 75 END;

    WHEN 'song_mastery' THEN
      IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = v_clean_ref) THEN
        RAISE EXCEPTION 'Música não encontrada.';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.song_mastery 
         WHERE user_id = v_user_id 
           AND song_id = v_clean_ref 
           AND (mastery_percent = 100 OR (step_video = true AND step_song = true AND step_reverse_translation = true AND step_sing_along = true AND step_final_challenge = true))
      ) THEN
        RAISE EXCEPTION 'Música ainda não dominada.';
      END IF;
      v_rule_val := v_rules->>'song_mastery';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 100 END;

    WHEN 'lesson_complete' THEN
      IF NOT EXISTS (SELECT 1 FROM public.user_progress WHERE user_id = v_user_id AND lesson_id::text = v_clean_ref AND completed = true) THEN
        RAISE EXCEPTION 'Aula ainda não concluída.';
      END IF;
      v_rule_val := v_rules->>'lesson_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 100 END;

    WHEN 'song_claim' THEN
      IF NOT EXISTS (SELECT 1 FROM public.song_mastery WHERE user_id = v_user_id AND song_id = v_clean_ref AND xp_claimed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Resgate de XP da música não registrado.';
      END IF;
      v_rule_val := v_rules->>'song_claim';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 50 END;

    WHEN 'pronunciation_complete' THEN
      v_rule_val := v_rules->>'pronunciation_complete';
      v_amount := CASE WHEN v_rule_val ~ '^\d+$' AND v_rule_val::INTEGER >= 0 THEN v_rule_val::INTEGER ELSE 20 END;

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

    ELSE
      RAISE EXCEPTION 'Origem de XP desconhecida: %', p_source;
  END CASE;

  INSERT INTO public.xp_events (user_id, source, ref, amount)
  VALUES (v_user_id, p_source, v_clean_ref, v_amount)
  ON CONFLICT (user_id, source, ref) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    SELECT COALESCE(xp, 0), level, level_number INTO v_current_xp, v_new_level_title, v_new_level_number
      FROM public.profiles WHERE id = v_user_id;

    RETURN jsonb_build_object('granted', false, 'amount', 0, 'total_xp', COALESCE(v_current_xp, 0), 'level', COALESCE(v_new_level_title, 'Nível 1 • First Steps'), 'level_number', COALESCE(v_new_level_number, 1));
  END IF;

  PERFORM set_config('app.xp_rpc', '1', true);

  UPDATE public.profiles
     SET xp = COALESCE(xp, 0) + v_amount, updated_at = now()
   WHERE id = v_user_id
  RETURNING xp INTO v_new_xp;

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
     SET level = v_new_level_title, level_number = v_new_level_number
   WHERE id = v_user_id;

  BEGIN
    INSERT INTO public.ranking (user_id, total_xp, weekly_xp, updated_at)
    VALUES (v_user_id, v_new_xp, v_amount, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET total_xp = v_new_xp, weekly_xp = COALESCE(ranking.weekly_xp, 0) + v_amount, updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Ranking sync: %', SQLERRM;
  END;

  RETURN jsonb_build_object('granted', true, 'amount', v_amount, 'total_xp', v_new_xp, 'level', v_new_level_title, 'level_number', v_new_level_number);
END;
$$;
