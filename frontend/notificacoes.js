// ============================================
// notificacoes.js
// Gera notificações a partir das transações reais
// ============================================

const API_URL = "http://localhost:8080";
const CONTA_ID = 1;
const STORAGE_KEY = "atlas_notif_lidas";

// ============================================
// Utilitários
// ============================================

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataIso) {
  const data = new Date(dataIso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) {
    return `Hoje às ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (data.toDateString() === ontem.toDateString()) {
    return `Ontem às ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
    ` às ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// IDs de notificações já lidas (salvas no localStorage)
function getLidas() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setLidas(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// ============================================
// Gera notificações a partir das transações
// ============================================

function gerarNotificacoes(transacoes) {
  const notifs = [];

  // Notificação de sistema — sempre presente
  notifs.push({
    id: "sistema_boas_vindas",
    tipo: "sistema",
    icone: "★",
    titulo: "Bem-vindo ao Atlas",
    desc: "Sua conta está ativa e pronta para uso.",
    data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 dias atrás
  });

  // Gera uma notificação para cada transação
  transacoes.forEach((t, i) => {
    const isEntrada = ["Depósito", "Rendimento"].includes(t.tipo);
    let titulo = "";
    let desc = "";
    let icone = "";
    let tipo = isEntrada ? "entrada" : "saida";

    switch (t.tipo) {
      case "Depósito":
        titulo = "Depósito recebido";
        desc = `Um depósito de ${formatarMoeda(t.valor)} foi creditado na sua conta.`;
        icone = "↓";
        break;
      case "Saque":
        titulo = "Saque realizado";
        desc = `Saque de ${formatarMoeda(t.valor)} debitado da sua conta.`;
        icone = "↑";
        break;
      case "Transferência":
        titulo = "Transferência enviada";
        desc = `Transferência de ${formatarMoeda(t.valor)} realizada com sucesso.`;
        icone = "⇄";
        break;
      case "Rendimento":
        titulo = "Rendimento aplicado";
        desc = `Seu saldo rendeu ${formatarMoeda(t.valor)} neste período.`;
        icone = "%";
        tipo = "entrada";
        break;
      default:
        titulo = t.tipo;
        desc = `Operação de ${formatarMoeda(t.valor)} registrada.`;
        icone = "•";
    }

    notifs.push({
      id: `transacao_${i}`,
      tipo,
      icone,
      titulo,
      desc,
      data: t.criado_em,
    });
  });

  // Ordena do mais recente para o mais antigo
  return notifs.sort((a, b) => new Date(b.data) - new Date(a.data));
}

// ============================================
// Renderização
// ============================================

function renderizarNotificacoes(notifs) {
  const el = document.getElementById("notifLista");
  const lidas = getLidas();

  if (notifs.length === 0) {
    el.innerHTML = `
      <div class="notif-vazio">
        <span class="notif-vazio-icone">🔔</span>
        <p>Nenhuma notificação ainda.</p>
      </div>`;
    return;
  }

  const naoLidas = notifs.filter(n => !lidas.includes(n.id)).length;

  document.getElementById("badgeCount").textContent = naoLidas;
  document.getElementById("badgeCount").style.display = naoLidas === 0 ? "none" : "";
  document.getElementById("notifCount").textContent =
    naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}` : "Tudo em dia";

  el.innerHTML = notifs.map((n, i) => {
    const naoLida = !lidas.includes(n.id);
    return `
      <div class="notif-item ${naoLida ? "nao-lida" : ""}" style="animation-delay:${i * 0.03}s"
           onclick="marcarLida('${n.id}', this)">
        <div class="notif-icone ${n.tipo}">${n.icone}</div>
        <div style="flex:1">
          <p class="notif-titulo">${n.titulo}${naoLida ? '<span style="display:inline-block;width:7px;height:7px;background:var(--accent);border-radius:50%;margin-left:8px;vertical-align:middle"></span>' : ""}</p>
          <p class="notif-desc">${n.desc}</p>
          <p class="notif-data">${formatarData(n.data)}</p>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================
// Marcar como lida
// ============================================

function marcarLida(id, el) {
  const lidas = getLidas();
  if (!lidas.includes(id)) {
    lidas.push(id);
    setLidas(lidas);
    el.classList.remove("nao-lida");
    el.querySelector(".notif-titulo span")?.remove();

    // atualiza contador
    const total = document.querySelectorAll(".notif-item.nao-lida").length;
    document.getElementById("badgeCount").textContent = total;
    document.getElementById("badgeCount").style.display = total === 0 ? "none" : "";
    document.getElementById("notifCount").textContent =
      total > 0 ? `${total} não lida${total > 1 ? "s" : ""}` : "Tudo em dia";
  }
}

function marcarTodasLidas() {
  const ids = Array.from(document.querySelectorAll(".notif-item"))
    .map(el => el.getAttribute("onclick")?.match(/'([^']+)'/)?.[1])
    .filter(Boolean);

  setLidas(ids);
  document.querySelectorAll(".notif-item").forEach(el => {
    el.classList.remove("nao-lida");
    el.querySelector(".notif-titulo span")?.remove();
  });

  document.getElementById("badgeCount").style.display = "none";
  document.getElementById("notifCount").textContent = "Tudo em dia";
}

// ============================================
// Init
// ============================================

async function init() {
  try {
    const res = await fetch(`${API_URL}/extrato?conta_id=${CONTA_ID}`);
    const transacoes = await res.json() || [];
    const notifs = gerarNotificacoes(transacoes);
    renderizarNotificacoes(notifs);
  } catch {
    document.getElementById("notifLista").innerHTML =
      `<div class="notif-vazio"><p>Não foi possível carregar as notificações.</p></div>`;
  }
}

init();