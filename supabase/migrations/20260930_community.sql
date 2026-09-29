-- ==============================================================================
-- MIGRATION: 20260930_community.sql
-- TABELAS, RLS, TRIGGERS E FUNÇÕES RPC SEGURAS PARA A COMUNIDADE MAGIC ENGLISH
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES GLOBAIS (APP_SETTINGS)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Seed da chave 'community'
INSERT INTO public.app_settings (key, value)
VALUES (
  'community',
  '{"is_posting_enabled": true, "status": "active", "maintenance_message": "O mural da comunidade está em manutenção temporária."}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- RLS para app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App settings are readable by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "App settings are readable by authenticated users" ON public.app_settings;
CREATE POLICY "App settings are readable by authenticated users" 
  ON public.app_settings FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
CREATE POLICY "Admins can update app settings" 
  ON public.app_settings FOR ALL 
  TO authenticated
  USING (
    public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );


-- 2. TABELA DE POSTS DA COMUNIDADE (COMMUNITY_POSTS)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  author_avatar TEXT,
  author_level TEXT,
  author_streak INTEGER DEFAULT 0,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'achievement',
  group_id TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  comments_list JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. TABELA NORMALIZADA DE CURTIDAS (COMMUNITY_LIKES)
CREATE TABLE IF NOT EXISTS public.community_likes (
  post_id TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  PRIMARY KEY (post_id, user_id)
);

-- RLS para community_likes
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own likes or admin can read all" ON public.community_likes;
CREATE POLICY "Users can read own likes or admin can read all"
  ON public.community_likes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );

DROP POLICY IF EXISTS "No direct insert on likes" ON public.community_likes;
DROP POLICY IF EXISTS "No direct update on likes" ON public.community_likes;
DROP POLICY IF EXISTS "No direct delete on likes" ON public.community_likes;


-- RLS para community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community posts are readable by everyone" ON public.community_posts;
DROP POLICY IF EXISTS "Community posts are readable by authenticated users" ON public.community_posts;
CREATE POLICY "Community posts are readable by authenticated users" 
  ON public.community_posts FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts" 
  ON public.community_posts FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.is_admin()
      OR COALESCE((SELECT (value->>'is_posting_enabled')::boolean FROM public.app_settings WHERE key = 'community'), true) = true
    )
  );

DROP POLICY IF EXISTS "Users can update own posts or admin can moderate" ON public.community_posts;
CREATE POLICY "Users can update own posts or admin can moderate" 
  ON public.community_posts FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );

DROP POLICY IF EXISTS "Users can delete own posts or admin can moderate" ON public.community_posts;
CREATE POLICY "Users can delete own posts or admin can moderate" 
  ON public.community_posts FOR DELETE 
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role'
  );


-- 4. TRIGGERS DE INTEGRIDADE EM COMMUNITY_POSTS

-- 4.1 Trigger BEFORE INSERT: Preenche dados do autor, zera contadores e valida tipos reais
CREATE OR REPLACE FUNCTION public.handle_community_post_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    NEW.user_id := auth.uid();
    
    SELECT name, avatar_url, level, streak
      INTO v_profile
      FROM public.profiles
     WHERE id = auth.uid();

    NEW.author_name := COALESCE(v_profile.name, 'Aluno Magic');
    NEW.author_avatar := COALESCE(v_profile.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80');
    NEW.author_level := COALESCE(v_profile.level, 'Nível 1 • First Steps');
    NEW.author_streak := COALESCE(v_profile.streak, 0);
    NEW.likes_count := 0;
    NEW.comments_count := 0;
    NEW.comments_list := '[]'::jsonb;
    NEW.created_at := now();

    -- Validação do tipo de post contra a lista real utilizada no aplicativo
    IF NEW.type NOT IN ('achievement', 'streak', 'module_completed', 'song_mastered') THEN
      NEW.type := 'achievement';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_post_before_insert ON public.community_posts;
CREATE TRIGGER trg_community_post_before_insert
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_community_post_insert();


-- 4.2 Trigger BEFORE UPDATE: Impede alteração de autoria e contadores fora das RPCs
CREATE OR REPLACE FUNCTION public.handle_community_post_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() OR current_setting('app.community_rpc', true) = '1' THEN
    RETURN NEW;
  END IF;

  -- Para alunos editando o próprio post: só pode alterar title e content
  NEW.user_id := OLD.user_id;
  NEW.author_name := OLD.author_name;
  NEW.author_avatar := OLD.author_avatar;
  NEW.author_level := OLD.author_level;
  NEW.author_streak := OLD.author_streak;
  NEW.likes_count := OLD.likes_count;
  NEW.comments_count := OLD.comments_count;
  NEW.comments_list := OLD.comments_list;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_post_before_update ON public.community_posts;
CREATE TRIGGER trg_community_post_before_update
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_community_post_update();


-- 5. FUNÇÕES RPC (SECURITY DEFINER)

-- 5.1 toggle_post_like (Resiliente a duplo clique)
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_liked BOOLEAN;
  v_count INTEGER;
  v_deleted_count INTEGER;
  v_is_enabled BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- Verifica se a comunidade está aberta para interações
  IF NOT public.is_admin() THEN
    SELECT COALESCE((value->>'is_posting_enabled')::boolean, true)
      INTO v_is_enabled
      FROM public.app_settings 
     WHERE key = 'community';

    IF v_is_enabled = false THEN
      RAISE EXCEPTION 'A comunidade está temporariamente em manutenção para novas interações.';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.community_posts WHERE id = p_post_id) THEN
    RAISE EXCEPTION 'Publicação não encontrada.';
  END IF;

  -- Tenta remover a curtida existente de forma atômica
  WITH deleted AS (
    DELETE FROM public.community_likes 
     WHERE post_id = p_post_id AND user_id = v_user_id
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  IF v_deleted_count > 0 THEN
    v_liked := false;
  ELSE
    -- Não existia -> insere com proteção ON CONFLICT
    INSERT INTO public.community_likes (post_id, user_id) 
    VALUES (p_post_id, v_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    v_liked := true;
  END IF;

  SELECT count(*) INTO v_count FROM public.community_likes WHERE post_id = p_post_id;

  PERFORM set_config('app.community_rpc', '1', true);
  UPDATE public.community_posts 
     SET likes_count = v_count 
   WHERE id = p_post_id;

  RETURN jsonb_build_object('liked', v_liked, 'likes_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_post_like(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_post_like(TEXT) TO authenticated;


-- 5.2 add_post_comment (Bloqueio FOR UPDATE na linha do post)
CREATE OR REPLACE FUNCTION public.add_post_comment(p_post_id TEXT, p_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clean_text TEXT;
  v_profile RECORD;
  v_comment JSONB;
  v_comment_id TEXT;
  v_current_list JSONB;
  v_new_list JSONB;
  v_is_enabled BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- Verifica se a comunidade está aberta para interações
  IF NOT public.is_admin() THEN
    SELECT COALESCE((value->>'is_posting_enabled')::boolean, true)
      INTO v_is_enabled
      FROM public.app_settings 
     WHERE key = 'community';

    IF v_is_enabled = false THEN
      RAISE EXCEPTION 'A comunidade está temporariamente em manutenção para novos comentários.';
    END IF;
  END IF;

  v_clean_text := TRIM(p_text);
  IF LENGTH(v_clean_text) < 1 OR LENGTH(v_clean_text) > 1000 THEN
    RAISE EXCEPTION 'O comentário deve ter entre 1 e 1000 caracteres.';
  END IF;

  -- Bloqueia a linha da publicação para evitar concorrência na lista de comentários
  SELECT COALESCE(comments_list, '[]'::jsonb) 
    INTO v_current_list 
    FROM public.community_posts 
   WHERE id = p_post_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publicação não encontrada.';
  END IF;

  SELECT name, avatar_url INTO v_profile FROM public.profiles WHERE id = v_user_id;
  
  -- Geração de UUID v4 para o identificador do comentário
  v_comment_id := 'comm-' || gen_random_uuid()::text;
  
  v_comment := jsonb_build_object(
    'id', v_comment_id,
    'user_id', v_user_id,
    'author', COALESCE(v_profile.name, 'Aluno Magic'),
    'avatar', COALESCE(v_profile.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'),
    'text', v_clean_text,
    'time', 'Agora mesmo',
    'created_at', now()
  );

  v_new_list := v_current_list || jsonb_build_array(v_comment);

  PERFORM set_config('app.community_rpc', '1', true);
  UPDATE public.community_posts
     SET comments_list = v_new_list,
         comments_count = jsonb_array_length(v_new_list)
   WHERE id = p_post_id;

  RETURN v_comment;
END;
$$;

REVOKE ALL ON FUNCTION public.add_post_comment(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_post_comment(TEXT, TEXT) TO authenticated;


-- 5.3 delete_post_comment (Bloqueio FOR UPDATE na linha do post)
CREATE OR REPLACE FUNCTION public.delete_post_comment(p_post_id TEXT, p_comment_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_post_user_id UUID;
  v_current_list JSONB;
  v_new_list JSONB := '[]'::jsonb;
  v_item JSONB;
  v_deleted BOOLEAN := false;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_is_admin := public.is_admin();

  -- Bloqueio FOR UPDATE na linha do post
  SELECT user_id, COALESCE(comments_list, '[]'::jsonb)
    INTO v_post_user_id, v_current_list
    FROM public.community_posts
   WHERE id = p_post_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publicação não encontrada.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_current_list)
  LOOP
    IF v_item->>'id' = p_comment_id THEN
      IF (v_item->>'user_id')::text = v_user_id::text OR v_post_user_id = v_user_id OR v_is_admin THEN
        v_deleted := true;
      ELSE
        RAISE EXCEPTION 'Você não tem permissão para excluir este comentário.';
      END IF;
    ELSE
      v_new_list := v_new_list || jsonb_build_array(v_item);
    END IF;
  END LOOP;

  IF NOT v_deleted THEN
    RAISE EXCEPTION 'Comentário não encontrado.';
  END IF;

  PERFORM set_config('app.community_rpc', '1', true);
  UPDATE public.community_posts
     SET comments_list = v_new_list,
         comments_count = jsonb_array_length(v_new_list)
   WHERE id = p_post_id;

  RETURN jsonb_build_object('success', true, 'comments_count', jsonb_array_length(v_new_list));
END;
$$;

REVOKE ALL ON FUNCTION public.delete_post_comment(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_post_comment(TEXT, TEXT) TO authenticated;


-- 6. HABILITAÇÃO DO REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
  END IF;
END $$;
