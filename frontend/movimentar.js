
// movimentar.js — Depósito e Saque

const API_URL = "http://localhost:8080";

// Modo atual: "deposito" ou "saque"
let modoAtivo = "deposito";

// Elementos
const elTitulo = document.getElementById("tituloTela");
const elBtnDeposito = document.getElementById("btnDeposito");
const elBtnSaque = document.getElementById("btnSaque");
const elLabelValor = document.getElementById("labelValor");
const elInputValor = document.getElementById("inputValor");
const elBtnSubmit = document.getElementById("btnSubmit");
const elFeedback = document.getElementById("feedback");
const elSaldo = document.getElementById("saldoDisponivel");
const elContaSelect = document.getElementById("contaSelect");
const elData = document.getElementById("dataAtual");

// Utilitários

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function exibirFeedback(mensagem, tipo) {
  elFeedback.textContent = mensagem;
  elFeedback.className = `feedback ${tipo}`;

  // some depois de 4 segundos
  setTimeout(() => {
    elFeedback.className = "feedback";
  }, 4000);
}

function setDataAtual() {
  const hoje = new Date();
  const formatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  elData.textContent = formatada.charAt(0).toUpperCase() + formatada.slice(1);
}

// Alternar entre Depósito e Saque

function alternarModo(modo) {
  modoAtivo = modo;

  if (modo === "deposito") {
    elTitulo.textContent = "Depósito";
    elBtnDeposito.className = "toggle-btn active-deposito";
    elBtnSaque.className = "toggle-btn";
    elLabelValor.textContent = "Valor do depósito";
    elInputValor.className = "form-input";
    elBtnSubmit.textContent = "Confirmar depósito";
    elBtnSubmit.className = "btn-submit btn-deposito";
  } else {
    elTitulo.textContent = "Saque";
    elBtnDeposito.className = "toggle-btn";
    elBtnSaque.className = "toggle-btn active-saque";
    elLabelValor.textContent = "Valor do saque";
    elInputValor.className = "form-input saque-focus";
    elBtnSubmit.textContent = "Confirmar saque";
    elBtnSubmit.className = "btn-submit btn-saque";
  }

  // limpa valor e feedback ao trocar
  elInputValor.value = "";
  elFeedback.className = "feedback";
}

// Busca saldo da conta selecionada

async function buscarSaldo() {
  const contaId = elContaSelect.value;
  try {
    const res = await fetch(`${API_URL}/extrato?conta_id=${contaId}`);
    const dados = await res.json();

    // soma entradas e subtrai saídas para calcular saldo
    let saldo = 0;
    (dados || []).forEach((t) => {
      const entradas = ["Depósito", "Rendimento"];
      if (entradas.includes(t.tipo)) {
        saldo += t.valor;
      } else {
        saldo -= t.valor;
      }
    });

    elSaldo.textContent = formatarMoeda(saldo);
  } catch {
    elSaldo.textContent = "—";
  }
}

// Executar operação

async function executar() {
  const valor = parseFloat(elInputValor.value);
  const contaId = parseInt(elContaSelect.value);

  if (!valor || valor <= 0) {
    exibirFeedback("Informe um valor válido.", "erro");
    return;
  }

  elBtnSubmit.disabled = true;
  elBtnSubmit.textContent = "Processando…";

  try {
    const rota = modoAtivo === "deposito" ? "/depositos" : "/saques";

    const res = await fetch(`${API_URL}${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conta_id: contaId, valor }),
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    const acao = modoAtivo === "deposito" ? "Depósito" : "Saque";
    exibirFeedback(`${acao} de ${formatarMoeda(valor)} realizado com sucesso!`, "sucesso");
    elInputValor.value = "";
    buscarSaldo(); // atualiza o saldo após a operação
  } catch (err) {
    exibirFeedback(err.message || "Erro ao processar operação.", "erro");
  } finally {
    elBtnSubmit.disabled = false;
    alternarModo(modoAtivo); // restaura o texto do botão
  }
}

// Inicialização

setDataAtual();
buscarSaldo();
elContaSelect.addEventListener("change", buscarSaldo);