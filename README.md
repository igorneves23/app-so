# Sistema de Controle de Equipamentos via QR Code
**Igreja Presbiteriana de Curitiba** — `so.targineves.cloud`

Sistema web responsivo para controle de retirada e devolução de equipamentos via QR Code, acessível pelo navegador do celular sem necessidade de aplicativo nativo.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Banco | PostgreSQL 15 |
| QR Scanner | html5-qrcode |
| Containers | Docker + Docker Compose |

---

## Acesso padrão (primeiro deploy)

| Campo | Valor |
|-------|-------|
| Email | `admin@igreja.com` |
| Senha | `admin123` |
| Tipo | Administrador |

> **Troque a senha imediatamente após o primeiro login.**

---

## Desenvolvimento local

### Pré-requisitos
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL (via Docker ou local)

### 1. Clonar e configurar

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 2. Subir banco de dados

```bash
docker compose up postgres -d
```

### 3. Backend

```bash
cd backend
npm install
# Crie backend/.env com:
# DATABASE_URL=postgresql://admin:senha123@localhost:5432/inventario
# JWT_SECRET=sua_chave_secreta
# APP_URL=http://localhost:5173
# PORT=3001
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5173
```

---

## Deploy com Docker Compose

### Deploy completo

```bash
# 1. Clonar o projeto no servidor
git clone <repo> && cd app-so

# 2. Criar .env com valores de produção
cp .env.example .env
nano .env  # Edite JWT_SECRET, APP_URL, senhas

# 3. Subir tudo
docker compose up -d --build

# 4. Verificar logs
docker compose logs -f
```

O sistema ficará disponível na porta 80.

---

## Deploy no EasyPanel (Hostinger VPS)

### Passo a passo

1. **Criar projeto** no EasyPanel → Nome: `Sistema de Equipamentos`

2. **Adicionar serviço** → Docker Compose → colar conteúdo do `docker-compose.yml`

3. **Configurar variáveis de ambiente:**
   ```env
   APP_URL=https://so.targineves.cloud
   JWT_SECRET=gere_com_openssl_rand_base64_32
   DB_USER=admin
   DB_PASSWORD=senha_segura
   DB_NAME=inventario
   ```

4. **Configurar domínio:** `so.targineves.cloud` → apontar para o serviço `frontend` porta 80

5. **Ativar SSL:** Let's Encrypt automático via EasyPanel

6. **Deploy:** Clique em Build → Deploy

---

## Estrutura do projeto

```
app-so/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point Express
│   │   ├── database.js       # Pool PostgreSQL
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT middleware
│   │   │   └── upload.js     # Multer (imagens)
│   │   ├── routes/
│   │   │   ├── auth.js       # Login / me
│   │   │   ├── users.js      # CRUD usuários (admin)
│   │   │   ├── equipamentos.js # CRUD equipamentos + QR
│   │   │   ├── movimentacoes.js # Retirada / devolução
│   │   │   └── relatorios.js # Relatórios + export CSV
│   │   └── scripts/
│   │       └── init.sql      # Schema do banco
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Rotas
│   │   ├── api/axios.js      # Cliente HTTP
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx    # Sidebar + bottom nav
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusBadge.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Scanner.jsx       # QR Code scanner
│   │       ├── EquipamentoView.jsx # Retirar / devolver
│   │       ├── EquipamentoForm.jsx # Cadastrar / editar
│   │       ├── Equipamentos.jsx  # Listagem (admin)
│   │       ├── Usuarios.jsx      # Gestão usuários (admin)
│   │       ├── Historico.jsx     # Movimentações
│   │       └── Relatorios.jsx    # Gráficos + export CSV
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## API — Endpoints principais

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuário atual |

### Equipamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/equipamentos` | Listar (filtros: status, categoria, search) |
| POST | `/api/equipamentos` | Criar (admin) |
| GET | `/api/equipamentos/:id` | Detalhes + última movimentação |
| PUT | `/api/equipamentos/:id` | Atualizar (admin) |
| DELETE | `/api/equipamentos/:id` | Excluir (admin) |
| GET | `/api/equipamentos/:id/qrcode` | Gerar QR Code |
| GET | `/api/equipamentos/:id/historico` | Histórico do equipamento |

### Movimentações
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/movimentacoes/retirar` | Registrar retirada |
| POST | `/api/movimentacoes/devolver` | Registrar devolução |
| GET | `/api/movimentacoes` | Histórico (admin: todos, user: próprios) |

### Relatórios (admin)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/relatorios/resumo` | Cards de estatísticas |
| GET | `/api/relatorios/mais-usados` | Top equipamentos |
| GET | `/api/relatorios/equipamentos-fora` | Em campo agora |
| GET | `/api/relatorios/por-usuario` | Uso por usuário |
| GET | `/api/relatorios/export-csv` | Download CSV |

---

## Fluxo do QR Code

1. Admin cadastra equipamento → sistema gera URL única: `https://so.targineves.cloud/equipamento/123`
2. Admin abre a página do equipamento → clica em **Ver QR** → faz download da imagem
3. Imprime e fixa no equipamento
4. Usuário aponta câmera do celular para o QR → abre no browser → faz login → **Retirar / Devolver**
5. Ou: usuário abre o app → **Escanear** → câmera built-in lê o QR → redireciona automaticamente

---

## Funcionalidades futuras planejadas

- [ ] PWA (instalável no celular)
- [ ] Notificações push / WhatsApp
- [ ] Aprovação de retirada por admin
- [ ] Assinatura digital na retirada
- [ ] Controle de manutenção
- [ ] Multi-unidades
- [ ] Export PDF de relatórios
