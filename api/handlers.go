package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"Financeiro/database"
)

// CriarUsuarioHandler recebe os dados via POST e cria um novo usuário

func CriarUsuarioHandler(w http.ResponseWriter, r *http.Request) {

	// Só aceita método POST

	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Nome  string `json:"nome"`
		CPF   string `json:"cpf"`
		Email string `json:"email"`
		Senha string `json:"senha"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusInternalServerError)
		return
	}

	// Validações de entrada

	if len(body.Nome) < 3 {
		http.Error(w, "Nome deve ter no mínimo 3 caracteres", http.StatusBadRequest)
		return
	}

	if len(body.Senha) < 6 {
		http.Error(w, "Senha deve ter no mínimo 6 caracteres", http.StatusBadRequest)
		return
	}

	if !strings.Contains(body.Email, "@") {
		http.Error(w, "Email inválido", http.StatusBadRequest)
		return
	}

	//Nessa etapa do meu projeto, tera o metodo abaixo chamando a função do Banco

	err = database.CriarUsuario(body.Nome, body.CPF, body.Email, body.Senha)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//Retorno dizendo se foi sucesso ou não

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Usuário criado com sucesso!",
	})
}

// LoginHandler autentica um usuário pelo email e senha

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email string `json:"email"`
		Senha string `json:"senha"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	conta, err := database.BuscarUsuario(body.Email, body.Senha)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Busca o ID do usuário pelo email
	var usuarioID int
	err = database.DB.QueryRow(`SELECT id FROM usuarios WHERE email = $1`, body.Email).Scan(&usuarioID)
	if err != nil {
		usuarioID = 0
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"mensagem": "Login realizado com sucesso!",
		"titular":  conta.Titular,
		"id":       usuarioID,
	})
}

func CriarContaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		UsuarioID     int    `json:"usuario_id"`
		NumeroAgencia int    `json:"numero_agencia"`
		NumeroConta   int    `json:"numero_conta"`
		Tipo          string `json:"tipo"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	// Validações — antes de chamar o banco
	if body.UsuarioID <= 0 {
		http.Error(w, "usuario_id inválido", http.StatusBadRequest)
		return
	}
	if body.Tipo != "corrente" && body.Tipo != "poupanca" {
		http.Error(w, "Tipo deve ser 'corrente' ou 'poupanca'", http.StatusBadRequest)
		return
	}

	err = database.CriarConta(body.UsuarioID, body.NumeroAgencia, body.NumeroConta, body.Tipo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Conta criada com sucesso!",
	})
}

// DepositoHandler realiza um depósito em uma conta

func DepositoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		ContaID int     `json:"conta_id"`
		Valor   float64 `json:"valor"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	if body.Valor <= 0 {
		http.Error(w, "Valor deve ser maior que zero", http.StatusBadRequest)
		return
	}

	err = database.RegistrarDeposito(body.ContaID, body.Valor, body.Valor)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Depósito realizado com sucesso!",
	})
}

// saqueHandler realiza um saque em uma conta

func SaqueHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		ContaID int     `json:"conta_id"`
		Valor   float64 `json:"valor"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	if body.Valor <= 0 {
		http.Error(w, "Valor deve ser maior que zero", http.StatusBadRequest)
		return
	}

	err = database.RegistrarTransacao(body.ContaID, "Saque", body.Valor, 0)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Saque realizado com sucesso!",
	})
}

// TransferenciaHandler realiza uma transferência entre contas

func TransferenciaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		ContaOrigemID  int     `json:"conta_origem_id"`
		ContaDestinoID int     `json:"conta_destino_id"`
		Valor          float64 `json:"valor"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	if body.Valor <= 0 {
		http.Error(w, "Valor deve ser maior que zero", http.StatusBadRequest)
		return
	}

	err = database.RegistrarTransferencia(body.ContaOrigemID, body.ContaDestinoID, body.Valor)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Transferência realizada com sucesso!",
	})
}

// ExtratoHandler retorna o extrato de uma conta

func ExtratoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// pega o conta_id da query string: /extrato?conta_id=1

	contaIDStr := r.URL.Query().Get("conta_id")
	if contaIDStr == "" {
		http.Error(w, "conta_id não informado", http.StatusBadRequest)
		return
	}

	// converte string para int

	contaID, err := strconv.Atoi(contaIDStr)
	if err != nil {
		http.Error(w, "conta_id inválido", http.StatusBadRequest)
		return
	}

	extrato, err := database.BuscarExtrato(contaID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(extrato)
}

// Metodo que busca uma conta pelo número

func BuscarContaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	numeroContaStr := r.URL.Query().Get("numero_conta")
	if numeroContaStr == "" {
		http.Error(w, "numero_conta não informado", http.StatusBadRequest)
		return
	}

	numeroConta, err := strconv.Atoi(numeroContaStr)
	if err != nil {
		http.Error(w, "numero_conta inválido", http.StatusBadRequest)
		return
	}

	id, titular, err := database.BuscarContaPorNumero(numeroConta)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      id,
		"titular": titular,
	})
}

// BuscarUsuarioHandler retorna dados do usuário pelo ID

func BuscarUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id não informado", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id inválido", http.StatusBadRequest)
		return
	}

	nome, email, err := database.BuscarUsuarioPorID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"nome":  nome,
		"email": email,
	})
}

// AtualizarUsuarioHandler atualiza nome, email e senha

func AtualizarUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		ID    int    `json:"id"`
		Nome  string `json:"nome"`
		Email string `json:"email"`
		Senha string `json:"senha"`
	}

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	err = database.AtualizarUsuario(body.ID, body.Nome, body.Email, body.Senha)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Dados atualizados com sucesso!",
	})
}

// BuscarContaUsuarioHandler retorna a conta do usuário logado

func BuscarContaUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	usuarioIDStr := r.URL.Query().Get("usuario_id")
	if usuarioIDStr == "" {
		http.Error(w, "usuario_id não informado", http.StatusBadRequest)
		return
	}

	usuarioID, err := strconv.Atoi(usuarioIDStr)
	if err != nil {
		http.Error(w, "usuario_id inválido", http.StatusBadRequest)
		return
	}

	id, agencia, numeroConta, tipo, err := database.BuscarContaPorUsuario(usuarioID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":             id,
		"numero_agencia": agencia,
		"numero_conta":   numeroConta,
		"tipo":           tipo,
	})
}
