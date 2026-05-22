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

  await ensureAdminExists();

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

start();
