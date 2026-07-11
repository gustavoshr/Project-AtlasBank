🏦 Atlas

Banco digital completo desenvolvido em Go como parte da minha jornada de aprendizado na linguagem. O projeto simula as operações de uma instituição financeira real, com cadastro de usuários, contas correntes, depósitos, saques, transferências e extrato de movimentações, unindo backend em Go, banco de dados PostgreSQL e frontend em HTML, CSS e JavaScript puro.

O projeto nasceu com o nome fin.anceiro e passou por um rebrand ao longo do desenvolvimento, virando Atlas. A ideia é seguir evoluindo com novas telas, incluindo futuramente uma seção de investimentos.

---

🎯 Objetivo

Este projeto foi desenvolvido com o propósito de aprender Go na prática, aplicando conceitos reais como:

- Organização de código em pacotes
- Criação de API REST com a biblioteca padrão net/http
- Integração com banco de dados PostgreSQL
- Variáveis de ambiente com .env
- Containerização com Docker
- Hash de senhas com bcrypt
- Middleware de CORS
- Comunicação entre backend e frontend via JSON

---

🚀 Funcionalidades

✅ Cadastro e login de usuários

✅ Criação automática de conta corrente no cadastro

✅ Depósitos e saques

✅ Transferências entre contas

✅ Extrato de movimentações

✅ Central de notificações

✅ Configurações de conta, com suporte a português e inglês

✅ Senhas protegidas com hash bcrypt

---

🛠️ Tecnologias utilizadas

| Tecnologia | Uso |
|------------|-----|
| Go | Linguagem principal, API REST |
| PostgreSQL | Banco de dados |
| Docker | Container do banco de dados |
| bcrypt | Hash de senhas |
| godotenv | Leitura de variáveis de ambiente |
| lib/pq | Driver PostgreSQL para Go |
| HTML, CSS, JS | Frontend da aplicação |

---

📁 Estrutura do projeto

```
Atlas/
|-- api/
|   |-- api.go              (Roteamento das requisicoes)
|   |-- handlers.go         (Handlers de cada rota da API)
|
|-- Conta/
|   |-- conta.go             (Logica de negocio das operacoes bancarias)
|
|-- database/
|   |-- database.go          (Conexao com o PostgreSQL)
|
|-- frontend/
|   |-- index.html            (Dashboard)
|   |-- login.html            (Login e cadastro)
|   |-- extrato.html          (Extrato de movimentacoes)
|   |-- movimentar.html       (Deposito e saque)
|   |-- transferir.html       (Transferencia entre contas)
|   |-- notificacoes.html     (Central de notificacoes)
|   |-- configuracoes.html    (Configuracoes de conta)
|   |-- style.css             (Estilo geral da aplicacao)
|   |-- arquivos .js          (Um arquivo JS para cada tela)
|
|-- main.go                  (Ponto de entrada da aplicacao)
|-- docker-compose.yml        (Configuracao do container PostgreSQL)
|-- init.sql                  (Script de criacao das tabelas)
|-- .env                      (Variaveis de ambiente, nao vai ao Git)
|-- .env.example               (Modelo de variaveis de ambiente)
|-- go.mod
|-- go.sum
```

---

⚙️ Como rodar o projeto

Pré-requisitos

- Go 1.21+
- Docker

1. Clone o repositório

```
git clone https://github.com/gustavoshr/Project-AtlasBank.git
cd Project-AtlasBank
```

2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas informações:

```
cp .env.example .env
```

Edite o .env:

```
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=suasenha
DB_NAME=atlas
```

3. Suba o banco de dados com Docker

```
docker compose up -d
```

4. Crie as tabelas no banco

O script init.sql já cria as tabelas automaticamente na primeira vez que o container sobe. Caso precise rodar manualmente, conecte ao banco e execute o conteúdo do arquivo init.sql.

5. Instale as dependências

```
go mod tidy
```

6. Rode a aplicação

```
go run main.go
```

7. Abra o frontend

Utilize um servidor local, como a extensão Live Server do VS Code, apontando para a pasta frontend, e acesse pelo navegador.

---

🔌 Rotas da API

| Rota | Descrição |
|------|-----------|
| /usuarios | Cadastro e busca de usuários |
| /login | Autenticação de usuário |
| /contas | Criação e consulta de contas |
| /contas/buscar | Busca de conta específica |
| /contas/usuario | Busca de conta por usuário |
| /depositos | Registro de depósitos |
| /saques | Registro de saques |
| /transferencias | Transferências entre contas |
| /extrato | Consulta do extrato de movimentações |
| /usuarios/buscar | Busca de dados do usuário |
| /usuarios/atualizar | Atualização de dados do usuário |

---

🔒 Segurança

- Senhas armazenadas com hash bcrypt, nunca em texto puro
- Credenciais do banco mantidas apenas no .env, fora do controle de versão
- CORS configurado para restringir origens permitidas
- Proteção contra SQL Injection com uso de placeholders nas queries
- Validações no backend para nome, senha, email e valores de transação

---

📌 Observações

- Cada usuário cadastrado gera automaticamente uma conta corrente, com número calculado a partir do ID do usuário
- O arquivo .env nunca deve ser commitado, ele já está no .gitignore
- A porta padrão do container é 5433, para evitar conflito com instalações locais do PostgreSQL

---

📚 O que aprendi construindo o Atlas

Esse foi meu principal projeto de estudo em Go até aqui. Aprendi a estruturar uma API REST em pacotes organizados, a trabalhar com o pacote database/sql para executar queries e escanear resultados, a implementar autenticação com hash de senha, e a lidar com desafios reais de desenvolvimento, como configuração de CORS, tratamento de erros e organização de rotas.

---

🔮 Próximos passos

- Testes automatizados com go test
- Autenticação via JWT
- Seção de investimentos, com simulação de rendimento e acompanhamento de carteira

---

Feito por Gustavo Bispo — Analista de Sistemas em transição para desenvolvimento backend com foco em Go.

GitHub • Linkedin
