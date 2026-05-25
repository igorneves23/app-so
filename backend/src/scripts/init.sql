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

-- ── Módulo de Checklist Operacional ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS checklist_templates (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'global', -- 'global' | 'categoria' | 'equipamento'
  categoria VARCHAR(100),
  equipamento_id INTEGER REFERENCES equipamentos(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklist_itens (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  pergunta VARCHAR(500) NOT NULL,
  descricao TEXT,
  obs_obrigatoria_em_nao BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verificacoes (
  id SERIAL PRIMARY KEY,
  equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES checklist_templates(id) ON DELETE SET NULL,
  usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'aprovado', -- 'aprovado' | 'alerta' | 'problema'
  observacao_geral TEXT,
  data_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verificacao_respostas (
  id SERIAL PRIMARY KEY,
  verificacao_id INTEGER NOT NULL REFERENCES verificacoes(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES checklist_itens(id) ON DELETE SET NULL,
  pergunta VARCHAR(500) NOT NULL,
  resposta VARCHAR(10) NOT NULL, -- 'sim' | 'nao' | 'na'
  observacao TEXT
);

CREATE TABLE IF NOT EXISTS verificacao_fotos (
  id SERIAL PRIMARY KEY,
  verificacao_id INTEGER NOT NULL REFERENCES verificacoes(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verificacoes_equipamento ON verificacoes(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_verificacoes_usuario ON verificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_verificacoes_data ON verificacoes(data_hora);
