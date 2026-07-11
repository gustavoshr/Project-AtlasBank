const API_URL = "http://localhost:8080";
 
// Elementos da tela
const elLista = document.getElementById("extratoLista");
const elLoading = document.getElementById("loadingState");
const elVazio = document.getElementById("vazioState");
const elErro = document.getElementById("erroState");
const elErroMensagem = document.getElementById("erroMensagem");
const elTotalEntradas = document.getElementById("totalEntradas");
const elTotalSaidas = document.getElementById("totalSaidas");
const elSaldoFinal = document.getElementById("saldoFinal");
const elDataAtual = document.getElementById("dataAtual");
const elContaSelect = document.getElementById("contaSelect");
const botoesFiltro = document.querySelectorAll(".filtro-btn");
const botaoTentarNovamente = document.getElementById("tentarNovamente");
 
// Guarda os dados do extrato já carregados, para filtrar sem buscar de novo

let extratoCompleto = [];
let filtroAtivo = "todos";
 

// Funções utilitárias

 
// Formata um número para o padrão monetário brasileiro

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
 
// Formata uma data ISO (vinda do banco) para "dd/mm/aaaa às HH:mm"

function formatarData(dataIso) {
  const data = new Date(dataIso);
  const dataFormatada = data.toLocaleDateString("pt-BR");
  const horaFormatada = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dataFormatada} às ${horaFormatada}`;
}
 
// Define se um tipo de transação é entrada ou saída de dinheiro

function direcaoDaTransacao(tipo) {
  const tiposEntrada = ["Depósito", "Rendimento"];
  return tiposEntrada.includes(tipo) ? "entrada" : "saida";
}

// Adicionei a função de sair

function sair() {
  localStorage.removeItem("atlas_usuario");
  window.location.href = "login.html";
}
 
// Escolhe um ícone simples por tipo de transação

function iconePorTipo(tipo) {
  const icones = {
    "Depósito": "↓",
    "Saque": "↑",
    "Transferência": "⇄",
    "Rendimento": "%",
  };
  return icones[tipo] || "•";
}
 
// Exibe a data de hoje no cabeçalho da página

function exibirDataAtual() {
  const hoje = new Date();
  const formatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  elDataAtual.textContent = formatada.charAt(0).toUpperCase() + formatada.slice(1);
}

// loading / vazio / erro / lista)

function mostrarApenas(estado) {
  const loading = document.getElementById("loadingState");

  // esconde tudo primeiro
  loading.style.display = "none";
  elVazio.style.display = "none";
  elErro.style.display = "none";
  elLista.style.display = "none";

  // mostra só o estado atual
  
  if (estado === "loading") {
    elLista.style.display = "flex";
    loading.style.display = "flex";
  } else if (estado === "lista") {
    elLista.style.display = "flex";
    loading.style.display = "none";
  } else if (estado === "vazio") {
    elVazio.style.display = "flex";
  } else if (estado === "erro") {
    elErro.style.display = "flex";
  }
}
 

// Renderização da lista

function renderizarExtrato(transacoes) {

// limpa a lista antes de desenhar de novo

  elLista.innerHTML = "";
 
  if (transacoes.length === 0) {
    mostrarApenas("vazio");
    return;
  }
 
  mostrarApenas("lista");
 
  transacoes.forEach((transacao, index) => {
    const direcao = direcaoDaTransacao(transacao.tipo);
    const sinal = direcao === "entrada" ? "+" : "−";
 
    const item = document.createElement("div");
    item.className = "extrato-item";
    item.style.animationDelay = `${index * 0.03}s`;
 
    item.innerHTML = `
      <div class="extrato-item-left">
        <div class="extrato-icone ${direcao}">${iconePorTipo(transacao.tipo)}</div>
        <div>
          <p class="extrato-tipo">${transacao.tipo}</p>
          <p class="extrato-data">${formatarData(transacao.criado_em)}</p>
        </div>
      </div>
      <span class="extrato-valor ${direcao}">${sinal} ${formatarMoeda(transacao.valor)}</span>
    `;
 
    elLista.appendChild(item);
  });
}
 
// Calcula e exibe os totais de entrada, saída e saldo final do período

function renderizarResumo(transacoes) {
  let entradas = 0;
  let saidas = 0;
 
  transacoes.forEach((t) => {
    if (direcaoDaTransacao(t.tipo) === "entrada") {
      entradas += t.valor;
    } else {
      saidas += t.valor;
    }
  });
 
  elTotalEntradas.textContent = formatarMoeda(entradas);
  elTotalSaidas.textContent = formatarMoeda(saidas);
  elSaldoFinal.textContent = formatarMoeda(entradas - saidas);
}

// busca extrato com o id real

async function carregarContaSelect() {
  const usuario = JSON.parse(localStorage.getItem("atlas_usuario") || "{}");
  const usuarioID = usuario.id || 1;

  try {
    const res = await fetch(`${API_URL}/contas/usuario?usuario_id=${usuarioID}`);
    const conta = await res.json();

    const select = document.getElementById("contaSelect");
    select.innerHTML = `<option value="${conta.id}">Agência ${conta.numero_agencia} · Conta ${conta.numero_conta}</option>`;

    await buscarExtrato();
  } catch {
    console.error("Erro ao carregar conta");
  }
}
 
// Aplica o filtro selecionado (todos / entrada / saida) sobre os dados já carregados

function aplicarFiltro() {
  let transacoesFiltradas = extratoCompleto;
 
  if (filtroAtivo !== "todos") {
    transacoesFiltradas = extratoCompleto.filter(
      (t) => direcaoDaTransacao(t.tipo) === filtroAtivo
    );
  }
 
  renderizarExtrato(transacoesFiltradas);
}
 

// Busca dos dados na API

 
async function buscarExtrato() {
  mostrarApenas("loading");
 
  const contaId = elContaSelect.value;
 
  try {
    const resposta = await fetch(`${API_URL}/extrato?conta_id=${contaId}`);
 
    if (!resposta.ok) {
      throw new Error(`A API respondeu com status ${resposta.status}`);
    }
 
    const dados = await resposta.json();
 
    // a API pode retornar null quando não há transações

    extratoCompleto = dados || [];
 
    renderizarResumo(extratoCompleto);
    aplicarFiltro();
  } catch (erro) {
    console.error("Erro ao buscar extrato:", erro);
    elErroMensagem.textContent =
      "Não foi possível carregar o extrato. Verifique se o servidor Go está rodando em localhost:8080.";
    mostrarApenas("erro");
  }
}
 

// Eventos
 
botoesFiltro.forEach((botao) => {
  botao.addEventListener("click", () => {
    botoesFiltro.forEach((b) => b.classList.remove("active"));
    botao.classList.add("active");
    filtroAtivo = botao.dataset.filtro;
    aplicarFiltro();
  });
});
 
botaoTentarNovamente.addEventListener("click", buscarExtrato);
elContaSelect.addEventListener("change", buscarExtrato);
 

// Inicialização

 
exibirDataAtual();
carregarContaSelect();