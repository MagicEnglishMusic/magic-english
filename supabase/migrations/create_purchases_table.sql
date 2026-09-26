-- ==============================================================================
-- MAGIC ENGLISH — MIGRATION: ESTRUTURA COMERCIAL KIWIFY (FASE 3.1)
-- ==============================================================================
-- Descrição:
-- 1. Cria a tabela public.purchases para rastreamento de pedidos e auditoria Kiwify.
-- 2. Adiciona colunas de controle de acesso (access_status e subscription_expires_at) na tabela public.profiles.
-- 3. Configura índices de alta performance e políticas de segurança RLS (Row Level Security).
-- ==============================================================================

-- 1. EXTENSÃO UUID (Garante disponibilidade)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. ATUALIZAÇÃO DA TABELA PROFILES (STATUS DE ACESSO & RECORRÊNCIA)
-- ==============================================================================
DO $$ 
BEGIN
  -- Adiciona access_status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'access_status'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN access_status TEXT DEFAULT 'pending_payment' 
    CHECK (access_status IN ('active', 'pending_payment', 'blocked', 'refunded', 'trial'));
  END IF;

  -- Adiciona subscription_expires_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Atualiza perfis existentes para status ativo se já possuem plano VIP
UPDATE public.profiles 
SET access_status = 'active' 
WHERE access_status IS NULL OR (role = 'admin') OR (kiwify_status = 'active');

-- ==============================================================================
-- 3. CRIAÇÃO DA TABELA PURCHASES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kiwify_order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_mobile TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  offer_id TEXT,
  payment_method TEXT, -- 'pix', 'credit_card', 'boleto'
  installments INTEGER DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'refunded', 'chargedback', 'canceled', 'waiting_payment'
  access_status TEXT NOT NULL DEFAULT 'active' CHECK (access_status IN ('active', 'pending_payment', 'blocked', 'refunded', 'trial')),
  webhook_event TEXT, -- 'order_approved', 'refund', 'chargeback', 'subscription_canceled', etc.
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 4. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_purchases_customer_email ON public.purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_kiwify_order_id ON public.purchases(kiwify_order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_access_status ON public.purchases(access_status);
CREATE INDEX IF NOT EXISTS idx_profiles_access_status ON public.profiles(access_status);

-- ==============================================================================
-- 5. TRIGGER DE ATUALIZAÇÃO AUTOMÁTICA DO updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purchases_updated_at ON public.purchases;
CREATE TRIGGER trigger_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 6.1 Política para Alunos: Visualizar apenas suas próprias compras
DROP POLICY IF EXISTS "Students can view own purchases" ON public.purchases;
CREATE POLICY "Students can view own purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- 6.2 Política para Administradores: Acesso total (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins have full access to purchases" ON public.purchases;
CREATE POLICY "Admins have full access to purchases"
  ON public.purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 6.3 Concessão de permissões básicas para roles do Supabase
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
