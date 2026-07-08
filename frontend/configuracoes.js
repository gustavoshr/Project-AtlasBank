// ============================================
// configuracoes.js
// ============================================

const API_URL = "http://localhost:8080";
const USUARIO_ID = 1;
const CONTA_ID = 1;

// ============================================
// Traduções
// ============================================

const i18n = {
  pt: {
    titulo: "Configurações",
    subtitulo: "Gerencie sua conta e preferências",
    dadosPessoais: "Dados pessoais",
    dadosPessoaisSub: "Atualize seu nome, email e senha",
    nome: "Nome",
    email: "Email",
    novaSenha: "Nova senha",
    novaSenhaSub: "(deixe em branco para não alterar)",
    salvar: "Salvar alterações",
    salvando: "Salvando…",
    preferencias: "Preferências",
    preferenciaSub: "Idioma e notificações",
    idioma: "Idioma",
    idiomaSub: "Idioma da interface",
    temaEscuro: "Tema escuro",
    temaEscuroSub: "Interface em modo escuro",
    notifTrans: "Notificações de transações",
    notifTransSub: "Alertas ao realizar operações",
    dadosConta: "Dados da conta",
    dadosContaSub: "Informações bancárias",
    agencia: "Agência",
    numeroConta: "Número da conta",
    tipo: "Tipo",
    saldoAtual: "Saldo atual",
    corrente: "Corrente",
    sucessoSalvar: "Dados atualizados com sucesso!",
    erroNomeEmail: "Nome e email são obrigatórios.",
  },
  en: {
    titulo: "Settings",
    subtitulo: "Manage your account and preferences",
    dadosPessoais: "Personal data",
    dadosPessoaisSub: "Update your name, email and password",
    nome: "Name",
    email: "Email",
    novaSenha: "New password",
    novaSenhaSub: "(leave blank to keep current)",
    salvar: "Save changes",
    salvando: "Saving…",
    preferencias: "Preferences",
    preferenciaSub: "Language and notifications",
    idioma: "Language",
    idiomaSub: "Interface language",
    temaEscuro: "Dark theme",
    temaEscuroSub: "Dark mode interface",
    notifTrans: "Transaction notifications",
    notifTransSub: "Alerts when performing operations",
    dadosConta: "Account data",
    dadosContaSub: "Banking information",
    agencia: "Branch",
    numeroConta: "Account number",
    tipo: "Type",
    saldoAtual: "Current balance",
    corrente: "Checking",
    sucessoSalvar: "Data updated successfully!",
    erroNomeEmail: "Name and email are required.",
  }
};

function getLang() {
  const prefs = JSON.parse(localStorage.getItem("atlas_prefs") || "{}");
  return prefs.idioma || "pt";
}

function aplicarIdioma() {
  const lang = getLang();
  const t = i18n[lang];

  document.querySelector("h1").textContent = t.titulo;
  document.querySelector(".page-subtitle").textContent = t.subtitulo;

  const titulos = document.querySelectorAll(".config-section-title");
  const subs = document.querySelectorAll(".config-section-sub");
  titulos[0].textContent = t.dadosPessoais;
  subs[0].textContent = t.dadosPessoaisSub;
  titulos[1].textContent = t.preferencias;
  subs[1].textContent = t.preferenciaSub;
  titulos[2].textContent = t.dadosConta;
  subs[2].textContent = t.dadosContaSub;

  document.querySelectorAll(".form-label")[0].textContent = t.nome;
  document.querySelectorAll(".form-label")[1].textContent = t.email;
  document.querySelectorAll(".form-label")[2].innerHTML =
    `${t.novaSenha} <span style="color:var(--text-secondary)">${t.novaSenhaSub}</span>`;
  document.getElementById("btnSalvarPessoal").textContent = t.salvar;

  const prefLabels = document.querySelectorAll(".pref-label");
  const prefSubs = document.querySelectorAll(".pref-sub");
  prefLabels[0].textContent = t.idioma;
  prefSubs[0].textContent = t.idiomaSub;
  prefLabels[1].textContent = t.temaEscuro;
  prefSubs[1].textContent = t.temaEscuroSub;
  prefLabels[2].textContent = t.notifTrans;
  prefSubs[2].textContent = t.notifTransSub;

  const dadoLabels = document.querySelectorAll(".dado-label");
  dadoLabels[0].textContent = t.agencia;
  dadoLabels[1].textContent = t.numeroConta;
  dadoLabels[2].textContent = t.tipo;
  dadoLabels[3].textContent = t.saldoAtual;

  const dadoTipo = document.getElementById("dadoTipo");
  if (dadoTipo) dadoTipo.textContent = t.corrente;

  document.getElementById("idiomaSelect").value = lang;
}

// ============================================
// Carregar dados do usuário
// ============================================

async function carregarUsuario() {
  try {
    const res = await fetch(`${API_URL}/usuarios/buscar?id=${USUARIO_ID}`);
    const dados = await res.json();
    document.getElementById("inputNome").value = dados.nome;
    document.getElementById("inputEmail").value = dados.email;
    document.getElementById("nomeUsuario").textContent = dados.nome;
    const iniciais = dados.nome.split(" ").slice(0, 2).map(p => p[0].toUpperCase()).join("");
    document.getElementById("avatarIniciais").textContent = iniciais;
  } catch {
    console.error("Erro ao carregar usuário");
  }
}

// ============================================
// Carregar dados da conta
// ============================================

async function carregarConta() {
  try {
    const res = await fetch(`${API_URL}/extrato?conta_id=${CONTA_ID}`);
    const transacoes = await res.json() || [];
    let saldo = 0;
    transacoes.forEach(t => {
      if (["Depósito", "Rendimento"].includes(t.tipo)) saldo += t.valor;
      else saldo -= t.valor;
    });
    document.getElementById("dadoAgencia").textContent = "123";
    document.getElementById("dadoConta").textContent = "456";
    document.getElementById("dadoSaldo").textContent = saldo.toLocaleString("pt-BR", {
      style: "currency", currency: "BRL"
    });
  } catch {
    console.error("Erro ao carregar conta");
  }
}

// ============================================
// Salvar dados pessoais
// ============================================

async function salvarDadosPessoais() {
  const lang = getLang();
  const t = i18n[lang];
  const nome = document.getElementById("inputNome").value.trim();
  const email = document.getElementById("inputEmail").value.trim();
  const senha = document.getElementById("inputSenha").value;
  const feedback = document.getElementById("feedbackPessoal");
  const btn = document.getElementById("btnSalvarPessoal");

  if (!nome || !email) {
    feedback.textContent = t.erroNomeEmail;
    feedback.className = "feedback erro";
    return;
  }

  btn.disabled = true;
  btn.textContent = t.salvando;

  try {
    const res = await fetch(`${API_URL}/usuarios/atualizar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: USUARIO_ID, nome, email, senha }),
    });
    if (!res.ok) throw new Error(await res.text());
    feedback.textContent = t.sucessoSalvar;
    feedback.className = "feedback sucesso";
    document.getElementById("inputSenha").value = "";
    document.getElementById("nomeUsuario").textContent = nome;
    setTimeout(() => { feedback.className = "feedback"; }, 4000);
  } catch (err) {
    feedback.textContent = err.message || "Erro ao salvar.";
    feedback.className = "feedback erro";
  } finally {
    btn.disabled = false;
    btn.textContent = t.salvar;
  }
}

// ============================================
// Preferências
// ============================================

function carregarPreferencias() {
  const prefs = JSON.parse(localStorage.getItem("atlas_prefs") || "{}");
  if (prefs.idioma) document.getElementById("idiomaSelect").value = prefs.idioma;
  if (prefs.notif !== undefined) document.getElementById("notifToggle").checked = prefs.notif;
}

function salvarPreferencias() {
  const prefs = {
    idioma: document.getElementById("idiomaSelect").value,
    notif: document.getElementById("notifToggle").checked,
  };
  localStorage.setItem("atlas_prefs", JSON.stringify(prefs));
  aplicarIdioma();
}

// ============================================
// Init
// ============================================

carregarUsuario();
carregarConta();
carregarPreferencias();
aplicarIdioma();