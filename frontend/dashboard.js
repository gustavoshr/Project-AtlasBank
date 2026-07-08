// ============================================
// dashboard.js
// ============================================

const API_URL = "http://localhost:8080";
const CONTA_ID = 1; // conta padrão por enquanto

// ============================================
// Utilitários
// ============================================

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarMoedaSemSimbolo(valor) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(dataIso) {
  const data = new Date(dataIso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) {
    return `Hoje, ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (data.toDateString() === ontem.toDateString()) {
    return `Ontem, ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${data.toLocaleDateString("pt-BR")}, ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function direcao(tipo) {
  return ["Depósito", "Rendimento"].includes(tipo) ? "entrada" : "saida";
}

function icone(tipo) {
  const mapa = { "Depósito": "↓", "Saque": "↑", "Transferência": "⇄", "Rendimento": "%" };
  return mapa[tipo] || "•";
}

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ============================================
// Cabeçalho
// ============================================

async function inicializarCabecalho() {
  // busca nome real do usuário
  let nomeUsuario = "Gustavo";
  try {
    const res = await fetch(`${API_URL}/usuarios/buscar?id=1`);
    const dados = await res.json();
    nomeUsuario = dados.nome.split(" ")[0]; // só o primeiro nome
  } catch {}

  // detecta se é novo usuário (sem transações ainda)
  const primeiroAcesso = !localStorage.getItem("atlas_primeiro_acesso");
  let saudacao = "";

  if (primeiroAcesso) {
    saudacao = `Bem-vindo ao Atlas, ${nomeUsuario}! 🎉`;
    localStorage.setItem("atlas_primeiro_acesso", "true");
  } else {
    saudacao = `${saudacaoPorHora()}, ${nomeUsuario} 👋`;
  }

  document.getElementById("saudacao").textContent = saudacao;
  document.getElementById("nomeUsuario").textContent = nomeUsuario;

  // iniciais do avatar
  const iniciais = nomeUsuario.slice(0, 2).toUpperCase();
  const avatar = document.getElementById("avatarIniciais");
  if (avatar) avatar.textContent = iniciais;

  const hoje = new Date();
  const formatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  document.getElementById("dataAtual").textContent =
    formatada.charAt(0).toUpperCase() + formatada.slice(1);
}

// ============================================
// Carrega extrato e popula o dashboard
// ============================================

async function carregarDashboard() {
  try {
    const res = await fetch(`${API_URL}/extrato?conta_id=${CONTA_ID}`);
    const dados = await res.json();
    const transacoes = dados || [];

    calcularSaldo(transacoes);
    renderizarTransacoes(transacoes.slice(0, 5));
    renderizarCategorias(transacoes);

  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
    document.getElementById("transacoesList").innerHTML =
      `<p style="padding:20px 18px; color:var(--text-secondary); font-size:0.85rem;">
        Não foi possível carregar os dados. Verifique se o servidor está rodando.
      </p>`;
  }
}

// ============================================
// Cálculo de saldo e métricas
// ============================================

function calcularSaldo(transacoes) {
  let saldo = 0;
  let entradas = 0;
  let saidas = 0;
  let rendimento = 0;

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  transacoes.forEach((t) => {
    const dir = direcao(t.tipo);
    if (dir === "entrada") {
      saldo += t.valor;
      const data = new Date(t.criado_em);
      if (data >= inicioMes) entradas += t.valor;
      if (t.tipo === "Rendimento") rendimento += t.valor;
    } else {
      saldo -= t.valor;
      const data = new Date(t.criado_em);
      if (data >= inicioMes) saidas += t.valor;
    }
  });

  // anima o saldo
  animarNumero("saldoValor", saldo);

  document.getElementById("entradasMes").textContent = `+ ${formatarMoeda(entradas)}`;
  document.getElementById("saidasMes").textContent = `− ${formatarMoeda(saidas)}`;
  document.getElementById("totalRendimento").textContent = formatarMoeda(rendimento);
}

// Animação de contagem do saldo
function animarNumero(elId, valorFinal) {
  const el = document.getElementById(elId);
  const duracao = 900;
  const inicio = performance.now();

  function tick(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const eased = 1 - Math.pow(1 - progresso, 3); // ease out cubic
    const valorAtual = valorFinal * eased;
    el.textContent = formatarMoedaSemSimbolo(valorAtual);
    if (progresso < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ============================================
// Últimas transações
// ============================================

function renderizarTransacoes(transacoes) {
  const el = document.getElementById("transacoesList");

  if (transacoes.length === 0) {
    el.innerHTML = `<p style="padding:20px 18px; color:var(--text-secondary); font-size:0.85rem;">Nenhuma transação encontrada.</p>`;
    return;
  }

  el.innerHTML = transacoes.map((t, i) => {
    const dir = direcao(t.tipo);
    const sinal = dir === "entrada" ? "+" : "−";
    return `
      <div class="transacao-item" style="animation-delay:${i * 0.04}s">
        <div class="transacao-left">
          <div class="transacao-icone ${dir}">${icone(t.tipo)}</div>
          <div>
            <p class="transacao-tipo">${t.tipo}</p>
            <p class="transacao-data">${formatarData(t.criado_em)}</p>
          </div>
        </div>
        <span class="transacao-valor ${dir}">${sinal} ${formatarMoeda(t.valor)}</span>
      </div>
    `;
  }).join("");
}

// ============================================
// Gastos por categoria (calculado das transações)
// ============================================

function renderizarCategorias(transacoes) {
  // agrupa saídas por tipo
  const grupos = {};
  let totalSaidas = 0;

  transacoes.forEach((t) => {
    if (direcao(t.tipo) === "saida") {
      grupos[t.tipo] = (grupos[t.tipo] || 0) + t.valor;
      totalSaidas += t.valor;
    }
  });

  const cores = {
    "Saque": "#00D4AA",
    "Transferência": "#6C63FF",
  };

  const el = document.getElementById("categoriasList");

  if (totalSaidas === 0) {
    el.innerHTML = `<p style="padding:16px 18px; color:var(--text-secondary); font-size:0.82rem;">Nenhuma saída registrada.</p>`;
    return;
  }

  el.innerHTML = Object.entries(grupos)
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, valor]) => {
      const pct = Math.round((valor / totalSaidas) * 100);
      const cor = cores[tipo] || "#F5A623";
      return `
        <div class="categoria-item">
          <div class="categoria-row">
            <span class="categoria-nome">
              <span class="categoria-dot" style="background:${cor}"></span>
              ${tipo}
            </span>
            <span class="categoria-pct">${pct}%</span>
          </div>
          <div class="categoria-barra-wrap">
            <div class="categoria-barra" style="width:${pct}%; background:${cor}"></div>
          </div>
        </div>
      `;
    }).join("");
}

// ============================================
// Init
// ============================================

inicializarCabecalho();
carregarDashboard();