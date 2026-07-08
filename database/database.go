package database

import (
	"Financeiro/conta"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB // ← linha 14, aqui

func Conectar() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erro ao carregar .env")
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	var err2 error
	DB, err2 = sql.Open("postgres", dsn)
	if err2 != nil {
		log.Fatalf("Erro ao abrir a conexão: %v", err2)
	}

	err2 = DB.Ping()
	if err2 != nil {
		log.Fatalf("Erro ao conectar no banco: %v", err2)
	}

	fmt.Println("Conectado ao PostgreSQL com sucesso!")
}

// CriarUsuario insere um novo usuário no banco.
// A senha é armazenada como hash bcrypt.

func CriarUsuario(nome, cpf, email, senha string) error {

	// Gera o hash da senha — custo 10 é o padrão recomendado

	hash, err := bcrypt.GenerateFromPassword([]byte(senha), 10)
	if err != nil {
		return fmt.Errorf("erro ao gerar hash da senha: %v", err)
	}

	// Insere o usuário no banco

	_, err = DB.Exec(`
		INSERT INTO usuarios (nome, cpf, email, senha)
		VALUES ($1, $2, $3, $4)`,
		nome, cpf, email, string(hash),
	)
	if err != nil {
		return fmt.Errorf("erro ao criar usuário: %v", err)
	}

	return nil
}

// BuscarUsuario busca um usuário pelo email e verifica a senha.
// Retorna erro se o usuário não existir ou a senha estiver errada.

func BuscarUsuario(email, senha string) (*conta.ContaCorrente, error) {

	var hashSenha string
	var nome string

	// Aqui optei por alguns parametros qque buscam a senha armazenada

	err := DB.QueryRow(`SELECT nome, senha FROM usuarios WHERE email = $1`,
		email).Scan(&nome, &hashSenha)
	if err != nil {
		return nil, fmt.Errorf("Usuário não encontrado: %v", err)
	}

	// Compara a senha digitada com o hash armazenado
	err = bcrypt.CompareHashAndPassword([]byte(hashSenha), []byte(senha))
	if err != nil {
		return nil, fmt.Errorf("senha incorreta")
	}

	return &conta.ContaCorrente{Titular: nome}, nil

}

// CriarConta insere uma nova conta vinculada a um usuário.

func CriarConta(usuarioID, numeroAgencia, numeroConta int, tipo string) error {
	_, err := DB.Exec(`
		INSERT INTO contas (usuario_id, numero_agencia, numero_conta, tipo, saldo)
		VALUES ($1, $2, $3, $4, 0.00)`,
		usuarioID, numeroAgencia, numeroConta, tipo,
	)
	if err != nil {
		return fmt.Errorf("Erro ao criar conta: %v", err)
	}
	return nil
}

// BuscarConta busca uma conta pelo número e retorna um ContaCorrente preenchido.

func BuscarConta(numeroConta int) (*conta.ContaCorrente, error) {
	c := &conta.ContaCorrente{}

	err := DB.QueryRow(`
		SELECT u.nome, c.numero_agencia, c.numero_conta, c.saldo
		FROM contas c
		JOIN usuarios u ON u.id = c.usuario_id
		WHERE c.numero_conta = $1`,
		numeroConta,
	).Scan(&c.Titular, &c.NumeroAgencia, &c.NumeroConta, &c.Saldo)
	if err != nil {

		return nil, fmt.Errorf("conta não encontrada: %v", err)
	}

	return c, nil
}

// RegistrarDeposito insere um depósito no banco vinculado a uma conta.

func RegistrarDeposito(contaID int, valor, saldoApos float64) error {
	_, err := DB.Exec(`
		INSERT INTO depositos (conta_id, valor, saldo_apos)
		VALUES ($1, $2, $3)`,
		contaID, valor, saldoApos,
	)
	if err != nil {
		return fmt.Errorf("Erro ao registrar depósito: %v", err)
	}
	return nil
}

// RegistrarTransacao insere uma transação (saque, rendimento) no banco.

func RegistrarTransacao(contaID int, tipo string, valor, saldoApos float64) error {
	_, err := DB.Exec(`
		INSERT INTO transacoes (conta_id, tipo, valor, saldo_apos)
		VALUES ($1, $2, $3, $4)`,
		contaID, tipo, valor, saldoApos,
	)
	if err != nil {
		return fmt.Errorf("erro ao registrar transação: %v", err)
	}
	return nil
}

// RegistrarTransferencia insere uma transferência entre duas contas no banco.

func RegistrarTransferencia(contaOrigemID, contaDestinoID int, valor float64) error {
	_, err := DB.Exec(`
		INSERT INTO transferencias (conta_origem_id, conta_destino_id, valor)
		VALUES ($1, $2, $3)`,
		contaOrigemID, contaDestinoID, valor,
	)
	if err != nil {
		return fmt.Errorf("erro ao registrar transferência: %v", err)
	}
	return nil
}

func BuscarExtrato(contaID int) ([]map[string]interface{}, error) {
	rows, err := DB.Query(`
		SELECT 'Depósito' as tipo, valor, saldo_apos, criado_em FROM depositos WHERE conta_id = $1
		UNION ALL
		SELECT tipo, valor, saldo_apos, criado_em FROM transacoes WHERE conta_id = $1
		UNION ALL
		SELECT 'Transferência' as tipo, valor, 0 as saldo_apos, criado_em FROM transferencias WHERE conta_origem_id = $1
		ORDER BY criado_em DESC`,
		contaID,
	)

	if err != nil {
		return nil, fmt.Errorf("Erro ao buscar extrato: %v", err)

	}
	defer rows.Close()

	var extrato []map[string]interface{}
	for rows.Next() {
		var tipo string
		var valor, saldoApos float64
		var criadoEm string

		rows.Scan(&tipo, &valor, &saldoApos, &criadoEm)

		extrato = append(extrato, map[string]interface{}{

			"tipo":       tipo,
			"valor":      valor,
			"saldo_apos": saldoApos,
			"criado_em":  criadoEm,
		})
	}
	return extrato, nil
}

func BuscarContaPorNumero(numeroConta int) (int, string, error) {
	var id int
	var titular string

	err := DB.QueryRow(`
		SELECT c.id, u.nome
		FROM contas c
		JOIN usuarios u ON u.id = c.usuario_id
		WHERE c.numero_conta = $1`,
		numeroConta,
	).Scan(&id, &titular)

	if err != nil {
		return 0, "", fmt.Errorf("Conta não encontrada")
	}

	return id, titular, nil
}

// Implementei uma função que pega os usurios pelo ID
func BuscarUsuarioPorID(id int) (string, string, error) {
	var nome, email string
	err := DB.QueryRow(`
		SELECT nome, email FROM usuarios WHERE id = $1`, id,
	).Scan(&nome, &email)
	if err != nil {
		return "", "", fmt.Errorf("usuário não encontrado")
	}
	return nome, email, nil
}

// Atualização de nome e email dos usuarios
func AtualizarUsuario(id int, nome, email, novaSenha string) error {
	var err error

	if novaSenha != "" {
		//Atualização com uma senha nova
		hash, errHash := bcrypt.GenerateFromPassword([]byte(novaSenha), 10)
		if errHash != nil {
			return fmt.Errorf("Erro ao gerar hash: %v", errHash)
		}
		_, err = DB.Exec(`
			UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4`,
			nome, email, string(hash), id,
		)
	} else {

		//Atualização sem mudar a senha
		// atualiza sem mudar a senha
		_, err = DB.Exec(`
			UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3`,
			nome, email, id,
		)
	}

	if err != nil {
		return fmt.Errorf("erro ao atualizar usuário: %v", err)
	}
	return nil
}
