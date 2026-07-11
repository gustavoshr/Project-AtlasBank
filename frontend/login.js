
// login.js


const API_URL = "http://localhost:8080";


// Alternar entre Login e Cadastro


function alternar(modo) {
  const painelLogin = document.getElementById("painelLogin");
  const painelCadastro = document.getElementById("painelCadastro");
  const btnLogin = document.getElementById("btnLogin");
  const btnCadastro = document.getElementById("btnCadastro");

  if (modo === "login") {
    painelLogin.classList.add("active");
    painelCadastro.classList.remove("active");
    btnLogin.classList.add("active");
    btnCadastro.classList.remove("active");
  } else {
    painelCadastro.classList.add("active");
    painelLogin.classList.remove("active");
    btnCadastro.classList.add("active");
    btnLogin.classList.remove("active");
  }

  // limpa feedbacks
  document.getElementById("feedbackLogin").className = "feedback";
  document.getElementById("feedbackCadastro").className = "feedback";
}


// Utilitários


function exibirFeedback(id, mensagem, tipo) {
  const el = document.getElementById(id);
  el.textContent = mensagem;
  el.className = `feedback ${tipo}`;
}

function mascararCPF(input) {
  let v = input.value.replace(/\D/g, "");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  input.value = v;
}


// Login


async function fazerLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const btn = document.getElementById("btnEntrar");

  if (!email || !senha) {
    exibirFeedback("feedbackLogin", "Preencha email e senha.", "erro");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Entrando…";

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro.includes("senha incorreta") ? "Senha incorreta." : "Usuário não encontrado.");
    }

    const dados = await res.json();

      localStorage.setItem("atlas_usuario", JSON.stringify({
      id: dados.id,
      nome: dados.titular,
      email,
    }));

    // salva sessão simples no localStorage
    localStorage.setItem("atlas_usuario", JSON.stringify({
      nome: dados.titular,
      email,
    }));

    // redireciona para o dashboard
    window.location.href = "index.html";

  } catch (err) {
    exibirFeedback("feedbackLogin", err.message || "Erro ao fazer login.", "erro");
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar na conta";
  }
}


// Cadastro


async function fazerCadastro() {
  const nome = document.getElementById("cadNome").value.trim();
  const cpf = document.getElementById("cadCPF").value.trim();
  const email = document.getElementById("cadEmail").value.trim();
  const senha = document.getElementById("cadSenha").value;
  const btn = document.getElementById("btnCriar");

  if (!nome || !cpf || !email || !senha) {
    exibirFeedback("feedbackCadastro", "Preencha todos os campos.", "erro");
    return;
  }

  if (senha.length < 6) {
    exibirFeedback("feedbackCadastro", "A senha deve ter no mínimo 6 caracteres.", "erro");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Criando conta…";

  try {
    const res = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cpf, email, senha }),
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro.includes("duplicate") ? "Email ou CPF já cadastrado." : "Erro ao criar conta.");
    }

    exibirFeedback("feedbackCadastro", "Conta criada com sucesso! Redirecionando…", "sucesso");

    // salva sessão e redireciona
    localStorage.setItem("atlas_usuario", JSON.stringify({ nome, email }));
    localStorage.removeItem("atlas_primeiro_acesso"); // força mensagem de boas-vindas

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    exibirFeedback("feedbackCadastro", err.message || "Erro ao criar conta.", "erro");
  } finally {
    btn.disabled = false;
    btn.textContent = "Criar conta";
  }
}


// Máscara CPF


document.getElementById("cadCPF").addEventListener("input", function () {
  mascararCPF(this);
});


// Enter para submeter


document.getElementById("loginSenha").addEventListener("keydown", e => {
  if (e.key === "Enter") fazerLogin();
});

document.getElementById("cadSenha").addEventListener("keydown", e => {
  if (e.key === "Enter") fazerCadastro();
});


// Verifica se já está logado


if (localStorage.getItem("atlas_usuario")) {
  window.location.href = "index.html";
}