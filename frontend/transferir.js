
// transferir.js


const API_URL = "http://localhost:8080";

// ID da conta destino encontrada pela busca
let contaDestinoID = null;

// Elementos
const elData = document.getElementById("dataAtual");
const elOrigemSelect = document.getElementById("contaOrigemSelect");
const elSaldo = document.getElementById("saldoDisponivel");
const elInputNumeroConta = document.getElementById("inputNumeroConta");
const elTitularCard = document.getElementById("titularCard");
const elTitularAvatar = document.getElementById("titularAvatar");
const elTitularNome = document.getElementById("titularNome");
const elTitularNaoEncontrado = document.getElementById("titularNaoEncontrado");
const elInputValor = document.getElementById("inputValor");
const elBtnSubmit = document.getElementById("btnSubmit");
const elFeedback = document.getElementById("feedback");


// Utilitários


function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function exibirFeedback(mensagem, tipo) {
  elFeedback.textContent = mensagem;
  elFeedback.className = `feedback ${tipo}`;
  setTimeout(() => { elFeedback.className = "feedback"; }, 4000);
}

function setDataAtual() {
  const hoje = new Date();
  const formatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  elData.textContent = formatada.charAt(0).toUpperCase() + formatada.slice(1);
}


// Busca saldo da conta origem


async function buscarSaldo() {
  const contaId = elOrigemSelect.value;
  try {
    const res = await fetch(`${API_URL}/extrato?conta_id=${contaId}`);
    const dados = await res.json();
    let saldo = 0;
    (dados || []).forEach((t) => {
      const entradas = ["Depósito", "Rendimento"];
      if (entradas.includes(t.tipo)) saldo += t.valor;
      else saldo -= t.valor;
    });
    elSaldo.textContent = formatarMoeda(saldo);
  } catch {
    elSaldo.textContent = "—";
  }
}


// Busca conta destino pelo número


async function buscarContaDestino() {
  const numeroConta = elInputNumeroConta.value.trim();

  // reseta estado anterior
  elTitularCard.classList.remove("visivel");
  elTitularNaoEncontrado.classList.remove("visivel");
  elBtnSubmit.disabled = true;
  contaDestinoID = null;

  if (!numeroConta) {
    exibirFeedback("Informe o número da conta destino.", "erro");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/contas/buscar?numero_conta=${numeroConta}`);

    if (!res.ok) {
      elTitularNaoEncontrado.classList.add("visivel");
      return;
    }

    const dados = await res.json();

    // exibe o card do titular encontrado

    contaDestinoID = dados.id;
    elTitularNome.textContent = dados.titular;
    elTitularAvatar.textContent = iniciais(dados.titular);
    elTitularCard.classList.add("visivel");

    // habilita o botão de transferir
    elBtnSubmit.disabled = false;

  } catch {
    elTitularNaoEncontrado.classList.add("visivel");
  }
}

// Adicionei a função de sair
function sair() {
  localStorage.removeItem("atlas_usuario");
  window.location.href = "login.html";
}

async function carregarContaOrigem() {
  const usuario = JSON.parse(localStorage.getItem("atlas_usuario") || "{}");
  const usuarioID = usuario.id || 1;

  try {
    const res = await fetch(`${API_URL}/contas/usuario?usuario_id=${usuarioID}`);
    const conta = await res.json();

    // atualiza o select com os dados reais

    const select = document.getElementById("contaOrigemSelect");
    select.innerHTML = `<option value="${conta.id}">Agência ${conta.numero_agencia} · Conta ${conta.numero_conta}</option>`;

    // atualiza o saldo

    buscarSaldo();
  } catch {
    console.error("Erro ao carregar conta de origem");
  }
}

// Executar transferência

async function executarTransferencia() {
  const valor = parseFloat(elInputValor.value);
  const contaOrigemID = parseInt(elOrigemSelect.value);

  if (!contaDestinoID) {
    exibirFeedback("Busque a conta destino antes de transferir.", "erro");
    return;
  }

  if (!valor || valor <= 0) {
    exibirFeedback("Informe um valor válido.", "erro");
    return;
  }

  if (contaOrigemID === contaDestinoID) {
    exibirFeedback("Conta de origem e destino não podem ser iguais.", "erro");
    return;
  }

  elBtnSubmit.disabled = true;
  elBtnSubmit.textContent = "Processando…";

  try {
    const res = await fetch(`${API_URL}/transferencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conta_origem_id: contaOrigemID,
        conta_destino_id: contaDestinoID,
        valor,
      }),
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    exibirFeedback(
      `Transferência de ${formatarMoeda(valor)} para ${elTitularNome.textContent} realizada com sucesso!`,
      "sucesso"
    );

    // limpa formulário
    elInputValor.value = "";
    elInputNumeroConta.value = "";
    elTitularCard.classList.remove("visivel");
    contaDestinoID = null;
    elBtnSubmit.disabled = true;
    buscarSaldo();

  } catch (err) {
    exibirFeedback(err.message || "Erro ao realizar transferência.", "erro");
  } finally {
    elBtnSubmit.textContent = "Transferir agora";
    if (contaDestinoID) elBtnSubmit.disabled = false;
  }
}

// Busca conta destino ao pressionar Enter no campo
elInputNumeroConta.addEventListener("keydown", (e) => {
  if (e.key === "Enter") buscarContaDestino();
});


// Inicialização

setDataAtual();
carregarContaOrigem();
elOrigemSelect.addEventListener("change", buscarSaldo);