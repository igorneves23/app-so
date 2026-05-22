-- Sistema de Controle de Equipamentos - Schema inicial

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'usuario',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipamentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  codigo VARCHAR(100) UNIQUE,
  patrimonio VARCHAR(100),
  localizacao VARCHAR(255),
  descricao TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'disponivel',
  foto VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id SERIAL PRIMARY KEY,
  equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  observacao TEXT,
  data_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_equipamento ON movimentacoes(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario ON movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes(data_hora);

-- O usuário admin padrão é criado automaticamente pelo backend na primeira inicialização.
-- Credenciais: admin@igreja.com / admin123
