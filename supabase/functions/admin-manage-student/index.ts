// ==============================================================================
// MAGIC ENGLISH — SUPABASE EDGE FUNCTION: ADMIN MANAGE STUDENT
// ==============================================================================
// 1. Criação e gestão segura de alunos pelo Administrador sem deslogar o painel.
// 2. Valida se o usuário chamador (JWT no header Authorization) possui role = 'admin'.
// 3. Utiliza supabaseAdmin (Service Role) para criar conta no Supabase Auth e public.profiles.
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  const timestamp = new Date().toISOString();

  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Health check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "online", service: "Admin Student Management Engine", timestamp }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta (chaves ausentes)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 3. Validação de Autenticação do Administrador
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado: Token JWT de autenticação não fornecido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user: callerUser }, error: callerAuthError } = await supabaseAdmin.auth.getUser(token);

    if (callerAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada. Faça login novamente como Administrador." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o usuário solicitante é admin em public.profiles
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, email")
      .eq("id", callerUser.id)
      .single();

    const isCallerAdmin = callerProfile?.role === "admin" || 
                          callerUser.user_metadata?.role === "admin" || 
                          callerUser.email === "magicenglishmusic@gmail.com";

    if (!isCallerAdmin) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: Apenas administradores podem cadastrar ou gerenciar alunos." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Processamento do Payload
    const body = await req.json();
    const action = body.action || "create";

    if (action === "create") {
      const { name, email, password, plan, access_status, kiwify_order_id } = body;

      if (!email || !name) {
        return new Response(
          JSON.stringify({ error: "Nome e e-mail são obrigatórios para cadastrar um aluno." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(name).trim();
      const cleanPassword = password ? String(password).trim() : `Magic${Math.floor(100000 + Math.random() * 900000)}!`;
      const cleanPlan = plan ? String(plan).trim() : "VIP Pro";
      const cleanStatus = access_status ? String(access_status).trim().toLowerCase() : "active";
      const cleanOrderId = kiwify_order_id ? String(kiwify_order_id).trim() : `MANUAL-${Date.now()}`;

      let userId = null;

      // 4.1 Criar usuário no Supabase Auth
      const { data: authCreateData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          name: cleanName,
          role: "student",
          plan: cleanPlan
        }
      });

      if (authCreateError) {
        // Se usuário já existe no Auth, busca o ID para vincular o perfil
        if (authCreateError.message?.toLowerCase().includes("already registered") || authCreateError.message?.toLowerCase().includes("already exists")) {
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const existing = (userList?.users || []).find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (existing) {
            userId = existing.id;
          } else {
            return new Response(
              JSON.stringify({ error: `E-mail já cadastrado: ${authCreateError.message}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: `Erro ao criar usuário no Auth: ${authCreateError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (authCreateData?.user) {
        userId = authCreateData.user.id;
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Falha ao resolver identificador do usuário." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4.2 Upsert no perfil public.profiles
      const profilePayload = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: "student",
        plan: cleanPlan,
        access_status: cleanStatus,
        kiwify_order_id: cleanOrderId,
        updated_at: new Date().toISOString()
      };

      const { data: savedProfile, error: saveProfileError } = await supabaseAdmin
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" })
        .select()
        .single();

      if (saveProfileError) {
        console.warn("Aviso ao salvar profile:", saveProfileError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Aluno cadastrado com sucesso!",
          data: {
            id: userId,
            name: cleanName,
            email: cleanEmail,
            plan: cleanPlan,
            status: cleanStatus,
            temporaryPassword: cleanPassword,
            kiwifyOrderId: cleanOrderId
          }
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_status") {
      const { user_id, access_status, plan, is_suspended } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório para atualizar status." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (access_status !== undefined) updatePayload.access_status = access_status;
      if (plan !== undefined) updatePayload.plan = plan;
      if (is_suspended !== undefined) updatePayload.is_suspended = Boolean(is_suspended);

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("id", user_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Erro ao atualizar perfil: ${updateError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Status do aluno atualizado com sucesso!",
          data: updated
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Ação "${action}" não reconhecida.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Erro interno no processamento do admin-manage-student:", err);
    return new Response(
      JSON.stringify({ error: `Erro interno do servidor: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
