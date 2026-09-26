/**
 * ==============================================================================
 * MAGIC ENGLISH — SUÍTE DE TESTES LOCAIS DO WEBHOOK KIWIFY (FASE 3.2)
 * ==============================================================================
 * Executa simulações de payloads da Kiwify para validar:
 * 1. order_approved (Compra aprovada e criação de usuário)
 * 2. order_refunded / refund (Reembolso de compra e bloqueio)
 * 3. chargeback (Contestação de pagamento)
 * 4. subscription_canceled (Cancelamento de assinatura)
 * 5. Idempotência (Mesmo order_id enviado duas vezes sem duplicidade)
 * 6. Segurança (Rejeição de requisição com token inválido)
 * ==============================================================================
 */

// Exemplos de Payloads Oficiais Kiwify
export const MOCK_PAYLOADS = {
  // Teste 1: Compra Aprovada (Novo Aluno)
  orderApprovedNewStudent: {
    order_id: "kw-test-approved-001",
    order_ref: "KW-98421",
    order_status: "paid",
    webhook_event_type: "order_approved",
    product_id: "prod_magic_english_vip_anual",
    product_name: "Magic English VIP Pro — Acesso Completo",
    payment_method: "credit_card",
    installments: 12,
    created_at: new Date().toISOString(),
    Customer: {
      full_name: "Lucas Aluno Teste",
      first_name: "Lucas",
      email: "lucas.teste@magicenglish.com",
      mobile: "+5511987654321"
    },
    Commissions: {
      charge_amount: 29700, // R$ 297,00 em centavos
      my_commission: 26730  // R$ 267,30 em centavos
    },
    signature: "test_secret_token_123"
  },

  // Teste 2: Reembolso de Compra
  orderRefunded: {
    order_id: "kw-test-approved-001",
    order_ref: "KW-98421",
    order_status: "refunded",
    webhook_event_type: "order_refunded",
    product_id: "prod_magic_english_vip_anual",
    product_name: "Magic English VIP Pro — Acesso Completo",
    Customer: {
      full_name: "Lucas Aluno Teste",
      email: "lucas.teste@magicenglish.com"
    },
    signature: "test_secret_token_123"
  },

  // Teste 3: Chargeback
  orderChargeback: {
    order_id: "kw-test-chargeback-002",
    order_ref: "KW-77412",
    order_status: "chargedback",
    webhook_event_type: "order_chargedback",
    product_id: "prod_magic_english_vip_anual",
    product_name: "Magic English VIP Pro",
    Customer: {
      full_name: "Carlos Chargeback",
      email: "carlos.chargeback@teste.com"
    },
    Commissions: {
      charge_amount: 29700
    },
    signature: "test_secret_token_123"
  },

  // Teste 4: Cancelamento de Assinatura Recorrente
  subscriptionCanceled: {
    order_id: "kw-test-sub-003",
    order_status: "canceled",
    webhook_event_type: "subscription_canceled",
    product_id: "prod_magic_english_mensal",
    product_name: "Magic English VIP Mensal",
    Customer: {
      full_name: "Ana Recorrente",
      email: "ana.recorrente@teste.com"
    },
    Subscription: {
      id: "sub_984215",
      status: "canceled",
      next_payment: "2026-10-26"
    },
    signature: "test_secret_token_123"
  },

  // Teste 5: Token Inválido (Segurança)
  invalidTokenPayload: {
    order_id: "kw-test-hack-004",
    order_status: "paid",
    webhook_event_type: "order_approved",
    Customer: {
      full_name: "Hacker Attempt",
      email: "hacker@teste.com"
    },
    signature: "wrong_token_hacker"
  }
};

/**
 * Utilitário para enviar requisição de teste para a Edge Function local ou remota
 */
export async function sendTestWebhook(targetUrl, payload, secretToken = null) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (secretToken) {
    headers["x-kiwify-signature"] = secretToken;
  }

  console.log(`\n🚀 Enviando teste para ${targetUrl}...`);
  console.log(`📦 Evento: ${payload.webhook_event_type || payload.order_status} | Pedido: ${payload.order_id}`);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const responseData = await res.json();
    console.log(`Status HTTP: ${res.status}`);
    console.log(`Resposta:`, responseData);
    return { status: res.status, data: responseData };
  } catch (err) {
    console.error(`❌ Erro ao enviar webhook:`, err.message);
    return { error: err.message };
  }
}

// Execução se chamado diretamente via Node/Deno
if (typeof process !== "undefined" && process.argv && process.argv[1]?.endsWith("test-payloads.js")) {
  const targetUrl = process.env.KIWIFY_WEBHOOK_URL || "http://localhost:54321/functions/v1/kiwify-webhook";
  console.log("=== Magic English: Suíte de Payloads Kiwify Carregada ===");
  console.log("Target:", targetUrl);
}
