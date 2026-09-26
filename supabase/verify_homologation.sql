-- ==============================================================================
-- MAGIC ENGLISH — SCRIPT DE AUDITORIA & HOMOLOGAÇÃO KIWIFY REAL (FASE 3.6)
-- ==============================================================================
-- Execute estas consultas no Supabase SQL Editor após realizar uma compra ou reembolso na Kiwify
-- ==============================================================================

-- 1. CONSULTAR ÚLTIMAS COMPRAS REGISTRADAS (TABELA PURCHASES)
SELECT 
  id,
  kiwify_order_id,
  customer_name,
  customer_email,
  product_name,
  amount,
  status AS purchase_status,
  access_status,
  webhook_event,
  created_at
FROM public.purchases
ORDER BY created_at DESC
LIMIT 10;

-- 2. CONSULTAR PERFIL DO ALUNO DE HOMOLOGAÇÃO (TABELA PROFILES)
-- Substitua 'aluno.homologacao@magicenglish.com' pelo email usado no checkout
SELECT 
  id AS profile_id,
  name,
  email,
  role,
  access_status,
  is_onboarded,
  plan,
  kiwify_order_id,
  created_at,
  updated_at
FROM public.profiles
WHERE email ILIKE '%teste%' OR email ILIKE '%homologacao%'
ORDER BY updated_at DESC;

-- 3. CONSULTAR CONTA NO SUPABASE AUTH (TABELA AUTH.USERS)
SELECT 
  id AS auth_user_id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'name' AS meta_name,
  raw_user_meta_data->>'role' AS meta_role,
  raw_user_meta_data->>'is_onboarded' AS meta_onboarded,
  created_at
FROM auth.users
WHERE email ILIKE '%teste%' OR email ILIKE '%homologacao%'
ORDER BY created_at DESC;

-- 4. VALIDAÇÃO DE INTEGRIDADE (COMPRA X PERFIL)
SELECT 
  p.kiwify_order_id,
  p.customer_email,
  p.status AS purchase_status,
  p.access_status AS purchase_access,
  prof.access_status AS profile_access,
  prof.is_onboarded,
  CASE 
    WHEN p.access_status = prof.access_status THEN '✅ Sincronizado'
    ELSE '❌ Divergente'
  END AS sync_validation
FROM public.purchases p
LEFT JOIN public.profiles prof ON p.customer_email = prof.email
ORDER BY p.created_at DESC
LIMIT 5;
