require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const equipamentoRoutes = require('./routes/equipamentos');
const movimentacaoRoutes = require('./routes/movimentacoes');
const relatorioRoutes = require('./routes/relatorios');
const checklistRoutes = require('./routes/checklists');
const verificacaoRoutes = require('./routes/verificacoes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipamentos', equipamentoRoutes);
app.use('/api/movimentacoes', movimentacaoRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/verificacoes', verificacaoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;

async function ensureAdminExists() {
  try {
    const result = await db.query("SELECT id FROM users WHERE tipo = 'admin' LIMIT 1");
    if (result.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.query(
        "INSERT INTO users (nome, email, senha, tipo) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
        ['Administrador', 'admin@igreja.com', hash, 'admin']
      );
      console.log('Admin padrão criado: admin@igreja.com / admin123');
    }
  } catch (err) {
    console.error('Erro ao verificar admin:', err.message);
  }
}

async function runMigrations() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS checklist_templates (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        descricao TEXT,
        tipo VARCHAR(20) NOT NULL DEFAULT 'global',
        categoria VARCHAR(100),
        equipamento_id INTEGER REFERENCES equipamentos(id) ON DELETE CASCADE,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS checklist_itens (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
        ordem INTEGER NOT NULL DEFAULT 0,
        pergunta VARCHAR(500) NOT NULL,
        descricao TEXT,
        obs_obrigatoria_em_nao BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS verificacoes (
        id SERIAL PRIMARY KEY,
        equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
        template_id INTEGER REFERENCES checklist_templates(id) ON DELETE SET NULL,
        usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'aprovado',
        observacao_geral TEXT,
        data_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS verificacao_respostas (
        id SERIAL PRIMARY KEY,
        verificacao_id INTEGER NOT NULL REFERENCES verificacoes(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES checklist_itens(id) ON DELETE SET NULL,
        pergunta VARCHAR(500) NOT NULL,
        resposta VARCHAR(10) NOT NULL,
        observacao TEXT
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS verificacao_fotos (
        id SERIAL PRIMARY KEY,
        verificacao_id INTEGER NOT NULL REFERENCES verificacoes(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_verificacoes_equipamento ON verificacoes(equipamento_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_verificacoes_usuario ON verificacoes(usuario_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_verificacoes_data ON verificacoes(data_hora)');

    // Torna equipamento_id opcional (verificações sem equipamento específico)
    await db.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'verificacoes'
            AND column_name = 'equipamento_id'
            AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE verificacoes ALTER COLUMN equipamento_id DROP NOT NULL;
        END IF;
      END $$
    `);

    console.log('Migrações do módulo checklist executadas');
  } catch (err) {
    console.error('Erro nas migrações:', err.message);
  }
}

async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      console.log('Banco de dados conectado');
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('Falha ao conectar ao banco:', err.message);
        process.exit(1);
      }
      console.log(`Aguardando banco... (${retries} tentativas restantes)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  await runMigrations();
  await ensureAdminExists();

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

start();
