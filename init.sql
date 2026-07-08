-- Tabela de usuários
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    cpf         VARCHAR(14)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    senha       VARCHAR(255) NOT NULL, -- hash bcrypt
    criado_em   TIMESTAMP DEFAULT NOW()
);

-- Tabela de contas (um usuário pode ter várias)
CREATE TABLE contas (
    id              SERIAL PRIMARY KEY,
    usuario_id      INT NOT NULL REFERENCES usuarios(id),
    numero_agencia  INT NOT NULL,
    numero_conta    INT NOT NULL UNIQUE,
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('corrente', 'poupanca')),
    saldo           NUMERIC(15,2) DEFAULT 0.00,
    criado_em       TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações gerais (saques, rendimentos)
CREATE TABLE transacoes (
    id          SERIAL PRIMARY KEY,
    conta_id    INT NOT NULL REFERENCES contas(id),
    tipo        VARCHAR(20) NOT NULL, -- 'saque', 'rendimento'
    valor       NUMERIC(15,2) NOT NULL,
    saldo_apos  NUMERIC(15,2) NOT NULL,
    criado_em   TIMESTAMP DEFAULT NOW()
);

-- Tabela de depósitos
CREATE TABLE depositos (
    id          SERIAL PRIMARY KEY,
    conta_id    INT NOT NULL REFERENCES contas(id),
    valor       NUMERIC(15,2) NOT NULL,
    saldo_apos  NUMERIC(15,2) NOT NULL,
    criado_em   TIMESTAMP DEFAULT NOW()
);

-- Tabela de transferências
CREATE TABLE transferencias (
    id                  SERIAL PRIMARY KEY,
    conta_origem_id     INT NOT NULL REFERENCES contas(id),
    conta_destino_id    INT NOT NULL REFERENCES contas(id),
    valor               NUMERIC(15,2) NOT NULL,
    criado_em           TIMESTAMP DEFAULT NOW()
);