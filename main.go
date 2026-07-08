package main

import (
	"Financeiro/API"
	"Financeiro/conta"
	"Financeiro/database"
	"fmt"
)

func main() {

	database.Conectar()
	api.IniciarServidor()

	database.Conectar()

	ContaCliente := conta.ContaCorrente{
		Titular:       "Usuario",
		NumeroAgencia: 123,
		NumeroConta:   456,
		Saldo:         1000.00,
	}

	fmt.Println(ContaCliente.Saldo)
	status, saldo := ContaCliente.Depositar(200.00)
	fmt.Println(status)
	fmt.Println(saldo)

	fmt.Println(ContaCliente.ConsultarSaldo())
	ContaCliente.ExibirExtrato()

	fmt.Println(ContaCliente.AplicarRendimento(0.5))
	ContaCliente.ExibirExtrato()

}
