package api

import (
	"fmt"
	"net/http"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func IniciarServidor() {

	// handler global para preflight OPTIONS

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
	})

	http.HandleFunc("/usuarios", corsMiddleware(CriarUsuarioHandler))
	http.HandleFunc("/login", corsMiddleware(LoginHandler))
	http.HandleFunc("/contas", corsMiddleware(CriarContaHandler))
	http.HandleFunc("/contas/buscar", corsMiddleware(BuscarContaHandler))
	http.HandleFunc("/depositos", corsMiddleware(DepositoHandler))
	http.HandleFunc("/saques", corsMiddleware(SaqueHandler))
	http.HandleFunc("/transferencias", corsMiddleware(TransferenciaHandler))
	http.HandleFunc("/extrato", corsMiddleware(ExtratoHandler))
	http.HandleFunc("/usuarios/buscar", corsMiddleware(BuscarUsuarioHandler))
	http.HandleFunc("/usuarios/atualizar", corsMiddleware(AtualizarUsuarioHandler))
	http.HandleFunc("/contas/usuario", corsMiddleware(BuscarContaUsuarioHandler))

	fmt.Println("Servidor rodanndo em http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
