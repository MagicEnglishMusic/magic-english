// ==============================================================================
// MAGIC ENGLISH — SUPABASE EDGE FUNCTION: WEBHOOK KIWIFY (FASE 3.2)
// ==============================================================================
// Processa eventos de compra, reembolso, cancelamento e chargeback da Kiwify.
// Sincroniza public.purchases e public.profiles com o Supabase Auth.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, signature, x-kiwify-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface KiwifyPayload {
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  webhook_event_type?: string;
  event?: string;
  product_id?: string;
  product_name?: string;
  offer_id?: string;
  payment_method?: string;
  installments?: number;
  created_at?: string;
  Customer?: {
    full_name?: string;
    first_name?: string;
    email?: string;
    mobile?: string;
  };
  Commissions?: {
    charge_amount?: number;
    my_commission?: number;
  };
  Subscription?: {
    id?: string;
    status?: string;
    next_payment?: string;
  };
  // Fallbacks for flat payloads
  email?: string;
  name?: string;
  mobile?: string;
  token?: string;
  signature?: string;
  [key: string]: any;
}

serve(async (req: Request) => {
  // 1. Tratamento de CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Only POST is accepted." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Erro de Configuração: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializa o cliente com privilégios de Service Role (ignora RLS com segurança no backend)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Parse do Payload Kiwify
    const rawText = await req.text();
    let payload: KiwifyPayload = {};
    try {
      payload = JSON.parse(rawText);
    } catch (_err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📥 [Kiwify Webhook] Evento recebido:`, {
      event_type: payload.webhook_event_type || payload.event || payload.order_status,
      order_id: payload.order_id || payload.order_ref,
      email: payload.Customer?.email || payload.email,
    });

    // 3. Validação de Segurança (Token / Assinatura Kiwify)
    if (webhookSecret) {
      const url = new URL(req.url);
      const tokenQuery = url.searchParams.get("token") || url.searchParams.get("signature");
      const authHeader = req.headers.get("x-kiwify-signature") || 
                         req.headers.get("signature") || 
                         req.headers.get("authorization");
      const tokenBody = payload.signature || payload.token;

      const providedToken = tokenQuery || (authHeader ? authHeader.replace("Bearer ", "").trim() : null) || tokenBody;

      if (!providedToken || providedToken !== webhookSecret) {
        console.warn("⚠️ [Kiwify Webhook] Acesso não autorizado: Token inválido ou ausente.");
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid Kiwify Webhook Secret" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 4. Normalização dos Dados do Pedido
    const orderId = payload.order_id || payload.order_ref;
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerEmail = (payload.Customer?.email || payload.email || "").trim().toLowerCase();
    const customerName = (payload.Customer?.full_name || payload.Customer?.first_name || payload.name || "Aluno").trim();
    const customerMobile = payload.Customer?.mobile || payload.mobile || null;
    const productId = payload.product_id || "prod_magic_english_vip";
    const productName = payload.product_name || "Magic English VIP Pro";
    const offerId = payload.offer_id || null;
    const paymentMethod = payload.payment_method || "credit_card";
    const installments = payload.installments ? Number(payload.installments) : 1;
    
    // Valor em reais (Kiwify envia em centavos ou valor float)
    let amount = 0.00;
    if (payload.Commissions?.charge_amount) {
      amount = payload.Commissions.charge_amount / 100;
    } else if (payload.amount) {
      amount = Number(payload.amount);
    }

    let netAmount = amount;
    if (payload.Commissions?.my_commission) {
      netAmount = payload.Commissions.my_commission / 100;
    }

    // Determina o tipo de evento
    const eventType = (
      payload.webhook_event_type || 
      payload.event || 
      payload.order_status || 
      "order_approved"
    ).toLowerCase();

    // 5. Mapeamento de Status da Compra e de Acesso
    let purchaseStatus = "paid";
    let accessStatus = "active";

    if (eventType.includes("refund") || eventType === "order_refunded") {
      purchaseStatus = "refunded";
      accessStatus = "refunded";
    } else if (eventType.includes("chargeback") || eventType === "order_chargedback") {
      purchaseStatus = "chargedback";
      accessStatus = "blocked";
    } else if (eventType.includes("cancel") || eventType === "subscription_canceled") {
      purchaseStatus = "canceled";
      // Mantém acesso até subscription_expires_at se houver
      accessStatus = payload.Subscription?.next_payment ? "active" : "blocked";
    } else if (eventType.includes("waiting") || eventType === "order_created" || eventType === "waiting_payment") {
      purchaseStatus = "waiting_payment";
      accessStatus = "pending_payment";
    } else {
      // order_approved, paid, etc.
      purchaseStatus = "paid";
      accessStatus = "active";
    }

    // Data de expiração para assinaturas recorrentes
    let subscriptionExpiresAt: string | null = null;
    if (payload.Subscription?.next_payment) {
      subscriptionExpiresAt = new Date(payload.Subscription.next_payment).toISOString();
    }

    // 6. Gerenciamento do Usuário no Supabase Auth & Profiles
    let resolvedUserId: string | null = null;

    if (customerEmail) {
      // Busca usuário existente pelo email
      const { data: existingProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, access_status, role")
        .eq("email", customerEmail)
        .maybeSingle();

      if (profileErr) {
        console.warn("⚠️ Aviso ao buscar perfil existente:", profileErr.message);
      }

      if (existingProfile?.id) {
        // Usuário já cadastrado -> Atualiza status de acesso
        resolvedUserId = existingProfile.id;
        console.log(`👤 Usuário existente encontrado (${resolvedUserId}). Atualizando access_status = ${accessStatus}`);

        const updateData: Record<string, any> = {
          access_status: accessStatus,
          kiwify_order_id: orderId,
          kiwify_status: purchaseStatus === "paid" ? "active" : purchaseStatus,
          plan: "VIP Pro",
          updated_at: new Date().toISOString(),
        };

        if (subscriptionExpiresAt) {
          updateData.subscription_expires_at = subscriptionExpiresAt;
        }

        const { error: updateProfileErr } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", resolvedUserId);

        if (updateProfileErr) {
          console.error("❌ Erro ao atualizar perfil existente:", updateProfileErr.message);
        }
      } else if (accessStatus === "active") {
        // Usuário NOVO com compra aprovada -> Cria no Supabase Auth
        console.log(`✨ Criando novo usuário no Supabase Auth para: ${customerEmail}`);
        
        try {
          // Cria usuário sem senha obrigatória no Auth (aluno definirá senha no primeiro acesso via invite/reset)
          const { data: newAuthUser, error: createAuthErr } = await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: {
              name: customerName,
              role: "student",
              is_onboarded: false,
              kiwify_order_id: orderId,
            },
          });

          if (createAuthErr) {
            console.warn("⚠️ Não foi possível criar no Auth (possível conta existente):", createAuthErr.message);
          } else if (newAuthUser?.user?.id) {
            resolvedUserId = newAuthUser.user.id;
            console.log(`✅ Novo usuário criado com UUID: ${resolvedUserId}`);

            // Envia link para o aluno definir a senha inicial com segurança
            const { error: inviteErr } = await supabase.auth.admin.generateLink({
              type: "recovery",
              email: customerEmail,
            });

            if (inviteErr) {
              console.warn("⚠️ Aviso ao gerar link de primeiro acesso:", inviteErr.message);
            }
          }
        } catch (authException: any) {
          console.error("❌ Exceção ao criar usuário no Auth:", authException.message);
        }

        // Garante registro ou atualização em public.profiles
        if (resolvedUserId) {
          const profilePayload: Record<string, any> = {
            id: resolvedUserId,
            name: customerName,
            email: customerEmail,
            role: "student",
            plan: "VIP Pro",
            access_status: "active",
            is_onboarded: false,
            kiwify_order_id: orderId,
            kiwify_status: "active",
            xp: 0,
            streak: 0,
            level: "Nível 1 • First Steps",
            level_number: 1,
            updated_at: new Date().toISOString(),
          };

          if (subscriptionExpiresAt) {
            profilePayload.subscription_expires_at = subscriptionExpiresAt;
          }

          const { error: upsertProfileErr } = await supabase
            .from("profiles")
            .upsert(profilePayload, { onConflict: "id" });

          if (upsertProfileErr) {
            console.error("❌ Erro no upsert do perfil novo:", upsertProfileErr.message);
          }
        }
      }
    }

    // 7. Registro Idempotente na Tabela public.purchases
    console.log(`💾 Registrando compra ${orderId} na tabela public.purchases...`);

    const purchaseRecord = {
      user_id: resolvedUserId,
      kiwify_order_id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_mobile: customerMobile,
      product_id: productId,
      product_name: productName,
      offer_id: offerId,
      payment_method: paymentMethod,
      installments: installments,
      amount: amount,
      net_amount: netAmount,
      status: purchaseStatus,
      access_status: accessStatus,
      webhook_event: eventType,
      raw_payload: payload,
      updated_at: new Date().toISOString(),
    };

    const { data: savedPurchase, error: purchaseError } = await supabase
      .from("purchases")
      .upsert(purchaseRecord, { onConflict: "kiwify_order_id" })
      .select()
      .single();

    if (purchaseError) {
      console.error("❌ Erro ao salvar compra na tabela purchases:", purchaseError.message);
      return new Response(
        JSON.stringify({ error: "Failed to persist purchase", details: purchaseError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎉 [Kiwify Webhook] Processamento concluído com sucesso:`, {
      order_id: orderId,
      status: purchaseStatus,
      access_status: accessStatus,
      user_id: resolvedUserId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        order_id: orderId,
        purchase_status: purchaseStatus,
        access_status: accessStatus,
        user_id: resolvedUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 [Kiwify Webhook] Exceção crítica não tratada:", err.message);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
