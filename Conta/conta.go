package conta

import (
	"fmt"
)

type Transacao struct {
	Tipo  string // "Depósito", "Saque", "Transferência"
	Valor float64
	Saldo float64 // saldo após a operação
}

type ContaCorrente struct {
	Titular       string
	TitularCPF    string
	NumeroAgencia int
	NumeroConta   int
	Saldo         float64
	Extrato       []Transacao
}

// Sacar debita um valor da conta.
// Usa ponteiro (*ContaCorrente) para modificar o saldo real, não uma cópia.

func (c *ContaCorrente) Sacar(valorSaque float64) string {
	podeSacar := valorSaque > 0 && valorSaque <= c.Saldo
	if podeSacar {
		c.Saldo -= valorSaque

		c.Extrato = append(c.Extrato, Transacao{
			Tipo:  "Saque",
			Valor: valorSaque,
			Saldo: c.Saldo,
		})
		return "Saque realizado com sucesso!"
	} else {
		return "Saldo insuficiente!"
	}

}

// Depositar adiciona um valor à conta.
// Retorna a mensagem de status e o saldo atualizado.

func (c *ContaCorrente) Depositar(valorDeposito float64) (string, float64) {
	if valorDeposito > 0 {
		c.Saldo += valorDeposito

		c.Extrato = append(c.Extrato, Transacao{
			Tipo:  "Depósito",
			Valor: valorDeposito,
			Saldo: c.Saldo,
		})
		return "Deposito realizado com sucesso!", c.Saldo
	}
	return "Valor de depósito invalido", c.Saldo
}

// Transferir move um valor desta conta para a conta destino.
// contaDestino é um ponteiro para que o saldo dela seja alterado de verdade.

func (c *ContaCorrente) Transferir(contaDestino *ContaCorrente, valorTransferencia float64) string {
	if valorTransferencia <= 0 {
		return "Valor de transferência inválido"
	}
	if valorTransferencia > c.Saldo {
		return "Saldo insuficiente para transferência"
	}

	c.Saldo -= valorTransferencia
	c.Extrato = append(c.Extrato, Transacao{
		Tipo:  "Transferência",
		Valor: valorTransferencia,
		Saldo: c.Saldo,
	})
	contaDestino.Saldo += valorTransferencia

	return fmt.Sprintf("Transferência de R$ %.2f realizada com sucesso!", valorTransferencia)
}

// ExibirExtrato percorre o slice Extrato e exibe todas as transações realizadas.

func (c *ContaCorrente) ExibirExtrato() {
	fmt.Println("========== EXTRATO ==========")
	fmt.Printf("Titular: %s | Conta: %d\n", c.Titular, c.NumeroConta)
	fmt.Println("=============================")

	for i, t := range c.Extrato {
		fmt.Printf("#%d | %s | Valor: R$ %.2f | Saldo após: R$ %.2f\n",
			i+1,
			t.Tipo,
			t.Valor,
			t.Saldo,
		)
	}

	fmt.Println("=============================")
	fmt.Printf("Saldo atual: R$ %.2f\n", c.Saldo)
}

func (c *ContaCorrente) ConsultarSaldo() string {
	return fmt.Sprintf(
		"Titular: %s | Agência: %d | Conta: %d | Saldo: R$ %.2f",
		c.Titular,
		c.NumeroAgencia,
		c.NumeroConta,
		c.Saldo,
	)
}

// AplicarRendimento aplica uma taxa de rendimento percentual sobre o saldo.
// Ex: taxa 0.5 = 0.5% de rendimento

func (c *ContaCorrente) AplicarRendimento(taxa float64) string {
	if taxa <= 0 {
		return "Taxa de rendimento inválida"
	}

	// Calcula o valor do rendimento
	// Ex: saldo 1000 * (0.5 / 100) = 5.00

	rendimento := c.Saldo * (taxa / 100)

	c.Saldo += rendimento

	c.Extrato = append(c.Extrato, Transacao{
		Tipo:  "Rendimento",
		Valor: rendimento,
		Saldo: c.Saldo,
	})

	return fmt.Sprintf("Rendimento de R$ %.2f aplicado! Nova taxa: %.2f%%", rendimento, taxa)

}
