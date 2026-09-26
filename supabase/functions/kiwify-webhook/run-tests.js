/**
 * ==============================================================================
 * MAGIC ENGLISH — SUÍTE DE TESTES E2E KIWIFY WEBHOOK (FASE 3.4)
 * ==============================================================================
 * Valida todos os cenários de negócio, regras de acesso e segurança do webhook.
 * ==============================================================================
 */

// Simulador de processamento da Edge Function
function simulateKiwifyWebhookLogic(payload, configuredSecret, databaseState) {
  // 1. Validação de Segurança
  if (configuredSecret) {
    const providedToken = payload.signature || payload.token;
    if (!providedToken || providedToken !== configuredSecret) {
      return {
        status: 401,
        body: { error: 'Unauthorized: Invalid Kiwify Webhook Secret' }
      };
    }
  }

  // 2. Extração dos Dados
  const orderId = payload.order_id || payload.order_ref;
  if (!orderId) {
    return {
      status: 400,
      body: { error: 'Missing required field: order_id' }
    };
  }

  const customerEmail = (payload.Customer?.email || payload.email || '').trim().toLowerCase();
  const customerName = (payload.Customer?.full_name || payload.name || 'Aluno').trim();
  const eventType = (payload.webhook_event_type || payload.order_status || 'order_approved').toLowerCase();

  let purchaseStatus = 'paid';
  let accessStatus = 'active';

  if (eventType.includes('refund') || eventType === 'order_refunded') {
    purchaseStatus = 'refunded';
    accessStatus = 'refunded';
  } else if (eventType.includes('chargeback') || eventType === 'order_chargedback') {
    purchaseStatus = 'chargedback';
    accessStatus = 'blocked';
  } else if (eventType.includes('waiting') || eventType === 'waiting_payment') {
    purchaseStatus = 'waiting_payment';
    accessStatus = 'pending_payment';
  } else {
    purchaseStatus = 'paid';
    accessStatus = 'active';
  }

  // 3. Atualização no Banco (Simulação de profiles e purchases)
  let user = databaseState.profiles.find(p => p.email === customerEmail);
  if (!user && accessStatus === 'active') {
    user = {
      id: `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name: customerName,
      email: customerEmail,
      role: 'student',
      access_status: accessStatus,
      is_onboarded: false,
      plan: 'VIP Pro'
    };
    databaseState.profiles.push(user);
  } else if (user) {
    user.access_status = accessStatus;
  }

  // Idempotência em purchases: Busca por kiwify_order_id
  const existingPurchaseIndex = databaseState.purchases.findIndex(p => p.kiwify_order_id === orderId);
  const purchaseRecord = {
    id: existingPurchaseIndex >= 0 ? databaseState.purchases[existingPurchaseIndex].id : `pur-${Date.now()}`,
    user_id: user?.id || null,
    kiwify_order_id: orderId,
    customer_name: customerName,
    customer_email: customerEmail,
    amount: (payload.Commissions?.charge_amount || 29700) / 100,
    status: purchaseStatus,
    access_status: accessStatus,
    webhook_event: eventType,
    updated_at: new Date().toISOString()
  };

  if (existingPurchaseIndex >= 0) {
    databaseState.purchases[existingPurchaseIndex] = purchaseRecord;
  } else {
    databaseState.purchases.push(purchaseRecord);
  }

  return {
    status: 200,
    body: {
      success: true,
      order_id: orderId,
      purchase_status: purchaseStatus,
      access_status: accessStatus,
      user_id: user?.id || null
    }
  };
}

// Simulador de ProtectedRoute para validação de acesso
function evaluateProtectedRoute(user, requiredRole = 'student') {
  if (!user) return { canAccess: false, view: 'login' };
  if (user.role === 'admin') return { canAccess: true, view: 'admin' };
  if (user.role !== requiredRole) return { canAccess: false, view: 'login' };
  
  if (user.access_status !== 'active') {
    return {
      canAccess: false,
      view: 'AccessBlockedView',
      blockedReason: user.access_status
    };
  }

  return {
    canAccess: true,
    view: user.is_onboarded ? 'dashboard' : 'onboarding'
  };
}

// ==============================================================================
// EXECUÇÃO DA BATERIA DE TESTES
// ==============================================================================
const SECRET_TOKEN = 'magic_kiwify_secret_key_2026';
const databaseState = {
  profiles: [],
  purchases: []
};

console.log('\n==============================================================================');
console.log('🧪 MAGIC ENGLISH — BATERIA DE TESTES PONTA A PONTA (FASE 3.4)');
console.log('==============================================================================\n');

const testResults = [];

// TESTE 1: order_approved (Compra aprovada e liberação de acesso)
{
  const payload = {
    order_id: 'KW-TEST-001',
    order_status: 'paid',
    webhook_event_type: 'order_approved',
    Customer: {
      full_name: 'Bruna Lima',
      email: 'bruna.lima@teste.com'
    },
    Commissions: { charge_amount: 29700 },
    signature: SECRET_TOKEN
  };

  const res = simulateKiwifyWebhookLogic(payload, SECRET_TOKEN, databaseState);
  const user = databaseState.profiles.find(p => p.email === 'bruna.lima@teste.com');
  const purchase = databaseState.purchases.find(p => p.kiwify_order_id === 'KW-TEST-001');
  const accessCheck = evaluateProtectedRoute(user);

  const passed = res.status === 200 &&
                 purchase?.status === 'paid' &&
                 purchase?.access_status === 'active' &&
                 user?.access_status === 'active' &&
                 accessCheck.canAccess === true;

  testResults.push({
    test: '1. order_approved (Compra Aprovada & Acesso Liberado)',
    passed,
    details: {
      purchaseStatus: purchase?.status,
      profileAccessStatus: user?.access_status,
      frontendRouteView: accessCheck.view,
      canAccess: accessCheck.canAccess
    }
  });
}

// TESTE 2: pending_payment / waiting_payment (Boleto/Pix gerado)
{
  const payload = {
    order_id: 'KW-TEST-002',
    order_status: 'waiting_payment',
    webhook_event_type: 'waiting_payment',
    Customer: {
      full_name: 'Carlos Pix',
      email: 'carlos.pix@teste.com'
    },
    Commissions: { charge_amount: 29700 },
    signature: SECRET_TOKEN
  };

  const res = simulateKiwifyWebhookLogic(payload, SECRET_TOKEN, databaseState);
  const purchase = databaseState.purchases.find(p => p.kiwify_order_id === 'KW-TEST-002');
  
  // Simulando login de usuário com pending_payment
  const mockPendingUser = { role: 'student', access_status: 'pending_payment', is_onboarded: false };
  const accessCheck = evaluateProtectedRoute(mockPendingUser);

  const passed = res.status === 200 &&
                 purchase?.status === 'waiting_payment' &&
                 purchase?.access_status === 'pending_payment' &&
                 accessCheck.canAccess === false &&
                 accessCheck.view === 'AccessBlockedView' &&
                 accessCheck.blockedReason === 'pending_payment';

  testResults.push({
    test: '2. pending_payment (Aguardando Pagamento & AccessBlockedView)',
    passed,
    details: {
      purchaseStatus: purchase?.status,
      frontendRouteView: accessCheck.view,
      blockedReason: accessCheck.blockedReason,
      canAccess: accessCheck.canAccess
    }
  });
}

// TESTE 3: refund / order_refunded (Reembolso de compra e bloqueio)
{
  const payload = {
    order_id: 'KW-TEST-001', // Reembolsando a Bruna do Teste 1
    order_status: 'refunded',
    webhook_event_type: 'order_refunded',
    Customer: {
      full_name: 'Bruna Lima',
      email: 'bruna.lima@teste.com'
    },
    signature: SECRET_TOKEN
  };

  const res = simulateKiwifyWebhookLogic(payload, SECRET_TOKEN, databaseState);
  const user = databaseState.profiles.find(p => p.email === 'bruna.lima@teste.com');
  const purchase = databaseState.purchases.find(p => p.kiwify_order_id === 'KW-TEST-001');
  const accessCheck = evaluateProtectedRoute(user);

  const passed = res.status === 200 &&
                 purchase?.status === 'refunded' &&
                 purchase?.access_status === 'refunded' &&
                 user?.access_status === 'refunded' &&
                 accessCheck.canAccess === false &&
                 accessCheck.view === 'AccessBlockedView' &&
                 accessCheck.blockedReason === 'refunded';

  testResults.push({
    test: '3. refund (Reembolso & Bloqueio Instantâneo)',
    passed,
    details: {
      purchaseStatus: purchase?.status,
      profileAccessStatus: user?.access_status,
      frontendRouteView: accessCheck.view,
      blockedReason: accessCheck.blockedReason,
      canAccess: accessCheck.canAccess
    }
  });
}

// TESTE 4: chargeback (Contestação de pagamento)
{
  // Cria usuário prévio
  databaseState.profiles.push({
    id: 'usr-cb',
    name: 'Marcos Chargeback',
    email: 'marcos.cb@teste.com',
    role: 'student',
    access_status: 'active'
  });

  const payload = {
    order_id: 'KW-TEST-003',
    order_status: 'chargedback',
    webhook_event_type: 'order_chargedback',
    Customer: {
      full_name: 'Marcos Chargeback',
      email: 'marcos.cb@teste.com'
    },
    signature: SECRET_TOKEN
  };

  const res = simulateKiwifyWebhookLogic(payload, SECRET_TOKEN, databaseState);
  const user = databaseState.profiles.find(p => p.email === 'marcos.cb@teste.com');
  const purchase = databaseState.purchases.find(p => p.kiwify_order_id === 'KW-TEST-003');
  const accessCheck = evaluateProtectedRoute(user);

  const passed = res.status === 200 &&
                 purchase?.status === 'chargedback' &&
                 purchase?.access_status === 'blocked' &&
                 user?.access_status === 'blocked' &&
                 accessCheck.canAccess === false &&
                 accessCheck.view === 'AccessBlockedView' &&
                 accessCheck.blockedReason === 'blocked';

  testResults.push({
    test: '4. chargeback (Contestação & Bloqueio Administrativo)',
    passed,
    details: {
      purchaseStatus: purchase?.status,
      profileAccessStatus: user?.access_status,
      frontendRouteView: accessCheck.view,
      blockedReason: accessCheck.blockedReason,
      canAccess: accessCheck.canAccess
    }
  });
}

// TESTE 5: Idempotência (Mesmo order_id enviado duas vezes)
{
  const duplicatePayload = {
    order_id: 'KW-TEST-004',
    order_status: 'paid',
    webhook_event_type: 'order_approved',
    Customer: {
      full_name: 'Aluno Idempotente',
      email: 'aluno.idemp@teste.com'
    },
    signature: SECRET_TOKEN
  };

  const countBefore = databaseState.purchases.length;
  // Disparo 1
  simulateKiwifyWebhookLogic(duplicatePayload, SECRET_TOKEN, databaseState);
  const countAfterFirst = databaseState.purchases.length;
  // Disparo 2 (Reenvio idêntico)
  simulateKiwifyWebhookLogic(duplicatePayload, SECRET_TOKEN, databaseState);
  const countAfterSecond = databaseState.purchases.length;

  const matches = databaseState.purchases.filter(p => p.kiwify_order_id === 'KW-TEST-004');

  const passed = countAfterFirst === countBefore + 1 &&
                 countAfterSecond === countAfterFirst &&
                 matches.length === 1;

  testResults.push({
    test: '5. Idempotência (Prevenção de Duplicidade de Compras)',
    passed,
    details: {
      totalPurchasesMatchingOrderId: matches.length,
      isSingleRecord: matches.length === 1
    }
  });
}

// TESTE 6: Validação de Segurança (Tokens Ausentes e Inválidos)
{
  const unauthPayload = {
    order_id: 'KW-HACK-001',
    order_status: 'paid',
    webhook_event_type: 'order_approved',
    Customer: { email: 'hacker@teste.com' }
    // Sem signature
  };

  const wrongTokenPayload = {
    order_id: 'KW-HACK-002',
    order_status: 'paid',
    webhook_event_type: 'order_approved',
    Customer: { email: 'hacker@teste.com' },
    signature: 'wrong_secret_123'
  };

  const res1 = simulateKiwifyWebhookLogic(unauthPayload, SECRET_TOKEN, databaseState);
  const res2 = simulateKiwifyWebhookLogic(wrongTokenPayload, SECRET_TOKEN, databaseState);

  const passed = res1.status === 401 && res2.status === 401;

  testResults.push({
    test: '6. Segurança (Rejeição com 401 Unauthorized para Tokens Inválidos)',
    passed,
    details: {
      missingTokenStatusCode: res1.status,
      wrongTokenStatusCode: res2.status
    }
  });
}

// Exibe Resultados
testResults.forEach(r => {
  const icon = r.passed ? '✅' : '❌';
  console.log(`${icon} [${r.passed ? 'PASSOU' : 'FALHOU'}] ${r.test}`);
  console.log('   Detalhes:', JSON.stringify(r.details, null, 2));
  console.log('------------------------------------------------------------------------------');
});

const allPassed = testResults.every(r => r.passed);
console.log(`\n🎯 RESULTADO GERAL: ${allPassed ? 'TODOS OS TESTES FORAM APROVADOS (6/6)!' : 'HOUVE FALHAS NA SUÍTE.'}\n`);
