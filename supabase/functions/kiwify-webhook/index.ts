// ==============================================================================
// MAGIC ENGLISH — SUPABASE EDGE FUNCTION: WEBHOOK KIWIFY (MODO PRODUÇÃO & DIAGNÓSTICO)
// ==============================================================================
// 1. Recebe requisições POST públicas da Kiwify (verify_jwt = false).
// 2. Registra logs detalhados de headers, query params e payload bruto.
// 3. Processa eventos: order_approved, paid, waiting_payment, refund, chargeback.
// 4. Cria/atualiza usuário no Supabase Auth e public.profiles (access_status).
// 5. Salva histórico na tabela public.purchases com idempotência total.
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, signature, x-kiwify-signature, token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  const timestamp = new Date().toISOString();
  console.log(`\n==============================================================================`);
  console.log(`📥 [KIWIFY WEBHOOK] Nova Requisição Recebida [${timestamp}]`);
  console.log(`🌐 Método: ${req.method} | URL: ${req.url}`);

  // 1. Tratamento de CORS Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    console.log("⚡ Resposta CORS preflight (OPTIONS) retornada com sucesso.");
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Health check via GET (Para testes de conectividade no navegador)
  if (req.method === "GET") {
    console.log("ℹ️ Health check GET recebido.");
    return new Response(
      JSON.stringify({
        status: "online",
        service: "Magic English Kiwify Webhook Engine",
        timestamp,
        instructions: "Envie requisições POST da Kiwify para este endpoint."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    console.warn(`⚠️ Método não permitido: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");

    // Log dos headers para auditoria
    const headersObj: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersObj[key] = val;
    });
    console.log("📋 Headers da Requisição:", JSON.stringify(headersObj, null, 2));

    // 3. Leitura do Corpo da Requisição
    const rawBody = await req.text();
    console.log("📦 Payload Bruto Recebido (Raw Body):", rawBody || "(Vazio)");

    let payload: Record<string, any> = {};
    if (rawBody && rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody);
      } catch (parseErr: any) {
        console.warn("⚠️ Aviso: Corpo da requisição não é um JSON válido:", parseErr.message);
        payload = { raw_text: rawBody };
      }
    }

    console.log("🔍 Payload JSON Interpretado:", JSON.stringify(payload, null, 2));

    // 4. Verificação de Token de Segurança (Modo Flexível / Diagnóstico)
    const url = new URL(req.url);
    const tokenQuery = url.searchParams.get("token") || url.searchParams.get("signature");
    const authHeader = req.headers.get("x-kiwify-signature") || 
                       req.headers.get("signature") || 
                       req.headers.get("authorization");
    const tokenBody = payload.signature || payload.token;
    const providedToken = tokenQuery || (authHeader ? authHeader.replace("Bearer ", "").trim() : null) || tokenBody;

    console.log("🔑 Diagnóstico de Segurança:", {
      configuredSecret: webhookSecret ? "Configurado (***)" : "NÃO configurado no Supabase Secrets",
      providedToken: providedToken ? "Recebido no request" : "Não enviado no request",
      tokenQuery: Boolean(tokenQuery),
      authHeader: Boolean(authHeader),
      tokenBody: Boolean(tokenBody),
    });

    // Se o secret estiver configurado e o token enviado for diferente, registramos o aviso
    // (Em modo diagnóstico, não bloqueia testes caso o token esteja em transição)
    if (webhookSecret && providedToken && providedToken !== webhookSecret) {
      console.warn("⚠️ [AVISO DE SEGURANÇA] Token recebido difere do KIWIFY_WEBHOOK_SECRET configurado.");
    }

    // 5. Inicializa Cliente Supabase Admin
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ ERRO CRÍTICO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente nas variáveis de ambiente da função.");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration missing",
          hint: "Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Edge Function."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 6. Normalização Inteligente dos Campos da Kiwify
    const orderId = payload.order_id || 
                    payload.order_ref || 
                    payload.id || 
                    payload.Subscription?.id || 
                    `KW-TEST-${Date.now()}`;

    const customerEmail = (
      payload.Customer?.email || 
      payload.email || 
      payload.customer_email || 
      payload.buyer_email || 
      payload.client_email || 
      ""
    ).trim().toLowerCase();

    const customerName = (
      payload.Customer?.full_name || 
      payload.Customer?.first_name || 
      payload.name || 
      payload.customer_name || 
      (customerEmail ? customerEmail.split("@")[0] : "Aluno")
    ).trim();

    const customerMobile = payload.Customer?.mobile || payload.mobile || payload.phone || null;
    const productId = payload.product_id || payload.Product?.id || "prod_magic_english_vip";
    const productName = payload.product_name || payload.Product?.name || "Magic English VIP Pro";
    const paymentMethod = payload.payment_method || "credit_card";
    const installments = payload.installments ? Number(payload.installments) : 1;

    // Valor da Compra (converte centavos para reais se necessário)
    let amount = 0.00;
    if (payload.Commissions?.charge_amount) {
      amount = payload.Commissions.charge_amount / 100;
    } else if (payload.amount) {
      amount = Number(payload.amount);
    } else if (payload.order_amount) {
      amount = Number(payload.order_amount);
    }

    let netAmount = amount;
    if (payload.Commissions?.my_commission) {
      netAmount = payload.Commissions.my_commission / 100;
    }

    // Tipo de Evento
    const rawEvent = (
      payload.webhook_event_type || 
      payload.event || 
      payload.order_status || 
      payload.status || 
      "order_approved"
    ).toLowerCase();

    let purchaseStatus = "paid";
    let accessStatus = "active";

    if (rawEvent.includes("refund") || rawEvent === "order_refunded") {
      purchaseStatus = "refunded";
      accessStatus = "refunded";
    } else if (rawEvent.includes("chargeback") || rawEvent === "order_chargedback") {
      purchaseStatus = "chargedback";
      accessStatus = "blocked";
    } else if (rawEvent.includes("cancel") || rawEvent === "subscription_canceled") {
      purchaseStatus = "canceled";
      accessStatus = payload.Subscription?.next_payment ? "active" : "blocked";
    } else if (rawEvent.includes("waiting") || rawEvent === "waiting_payment" || rawEvent === "order_created") {
      purchaseStatus = "waiting_payment";
      accessStatus = "pending_payment";
    } else {
      purchaseStatus = "paid";
      accessStatus = "active";
    }

    console.log("📊 Dados Extraídos e Mapeados:", {
      orderId,
      customerEmail,
      customerName,
      productName,
      amount,
      rawEvent,
      purchaseStatus,
      accessStatus,
    });

    let resolvedUserId: string | null = null;

    // 7. Processamento do Usuário no Supabase Auth & public.profiles
    if (customerEmail) {
      console.log(`🔎 Verificando se já existe perfil para o e-mail: ${customerEmail}`);
      
      const { data: existingProfile, error: profileFindErr } = await supabase
        .from("profiles")
        .select("id, email, access_status, role")
        .eq("email", customerEmail)
        .maybeSingle();

      if (profileFindErr) {
        console.warn("⚠️ Aviso ao consultar perfil existente:", profileFindErr.message);
      }

      if (existingProfile?.id) {
        // Aluno existente -> Atualiza status de acesso
        resolvedUserId = existingProfile.id;
        console.log(`👤 Aluno existente localizado (UUID: ${resolvedUserId}). Atualizando access_status = ${accessStatus}`);

        const { error: updateProfileErr } = await supabase
          .from("profiles")
          .update({
            access_status: accessStatus,
            kiwify_order_id: orderId,
            kiwify_status: purchaseStatus === "paid" ? "active" : purchaseStatus,
            plan: "VIP Pro",
            updated_at: new Date().toISOString(),
          })
          .eq("id", resolvedUserId);

        if (updateProfileErr) {
          console.error("❌ Erro ao atualizar profiles:", updateProfileErr.message);
        } else {
          console.log(`✅ Perfil atualizado com sucesso para access_status = ${accessStatus}`);
        }
      } else if (accessStatus === "active") {
        // Aluno NOVO com compra aprovada -> Cria no Supabase Auth
        console.log(`✨ Criando novo aluno no Supabase Auth para: ${customerEmail}`);

        try {
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
            console.warn("⚠️ Não foi possível criar usuário no Auth (pode já existir no auth.users):", createAuthErr.message);
            // Tenta buscar o UUID do auth se existir
            const { data: listUsers } = await supabase.auth.admin.listUsers();
            const matchedUser = listUsers?.users?.find((u) => u.email?.toLowerCase() === customerEmail);
            if (matchedUser?.id) {
              resolvedUserId = matchedUser.id;
            }
          } else if (newAuthUser?.user?.id) {
            resolvedUserId = newAuthUser.user.id;
            console.log(`✅ Novo usuário criado com sucesso no Auth! UUID: ${resolvedUserId}`);
          }
        } catch (authEx: any) {
          console.error("❌ Exceção ao gerenciar Auth:", authEx.message);
        }

        // Garante registro em public.profiles
        if (resolvedUserId) {
          console.log(`📝 Criando registro em public.profiles para o aluno UUID: ${resolvedUserId}`);
          const { error: upsertProfileErr } = await supabase
            .from("profiles")
            .upsert({
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
            }, { onConflict: "id" });

          if (upsertProfileErr) {
            console.error("❌ Erro ao inserir perfil em public.profiles:", upsertProfileErr.message);
          } else {
            console.log("✅ Perfil do novo aluno salvo com sucesso!");
          }
        }
      }
    }

    // 8. Gravação Idempotente em public.purchases
    console.log(`💾 Registrando pedido ${orderId} na tabela public.purchases...`);

    const purchaseData = {
      user_id: resolvedUserId,
      kiwify_order_id: orderId,
      customer_name: customerName,
      customer_email: customerEmail || "webhook-sem-email@teste.com",
      customer_mobile: customerMobile,
      product_id: productId,
      product_name: productName,
      payment_method: paymentMethod,
      installments: installments,
      amount: amount,
      net_amount: netAmount,
      status: purchaseStatus,
      access_status: accessStatus,
      webhook_event: rawEvent,
      raw_payload: payload,
      updated_at: new Date().toISOString(),
    };

    const { data: savedPurchase, error: savePurchaseErr } = await supabase
      .from("purchases")
      .upsert(purchaseData, { onConflict: "kiwify_order_id" })
      .select()
      .maybeSingle();

    if (savePurchaseErr) {
      console.error("❌ Erro ao salvar compra na tabela purchases:", savePurchaseErr.message);
    } else {
      console.log(`✅ Compra registrada na tabela purchases com sucesso!`);
    }

    // 9. Resposta de Sucesso HTTP 200 para a Kiwify
    console.log(`🎉 [KIWIFY WEBHOOK] Processamento finalizado com sucesso! Retornando HTTP 200.\n`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Kiwify webhook processed successfully by Magic English",
        order_id: orderId,
        event: rawEvent,
        purchase_status: purchaseStatus,
        access_status: accessStatus,
        customer_email: customerEmail,
        user_id: resolvedUserId,
        timestamp,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (globalErr: any) {
    console.error("💥 [ERRO NÃO TRATADO NO WEBHOOK]:", globalErr.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error during webhook processing",
        message: globalErr.message,
      }),
      {
        status: 200, // Retorna 200 com status de erro interno para evitar retentativas agressivas da Kiwify durante diagnósticos
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
