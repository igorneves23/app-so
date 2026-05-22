const express = require('express');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search, status, categoria } = req.query;
    let query = 'SELECT * FROM equipamentos WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (nome ILIKE $${idx} OR codigo ILIKE $${idx} OR patrimonio ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (status) { query += ` AND status = $${idx++}`; params.push(status); }
    if (categoria) { query += ` AND categoria = $${idx++}`; params.push(categoria); }

    query += ' ORDER BY nome';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar equipamentos' });
  }
});

router.get('/categorias', auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT DISTINCT categoria FROM equipamentos WHERE categoria IS NOT NULL AND categoria <> '' ORDER BY categoria"
    );
    res.json(result.rows.map((r) => r.categoria));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipamentos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });

    const equip = result.rows[0];
    const last = await db.query(
      `SELECT m.*, u.nome AS usuario_nome
       FROM movimentacoes m
       JOIN users u ON u.id = m.usuario_id
       WHERE m.equipamento_id = $1
       ORDER BY m.data_hora DESC LIMIT 1`,
      [equip.id]
    );
    equip.ultima_movimentacao = last.rows[0] || null;
    res.json(equip);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar equipamento' });
  }
});

router.get('/:id/qrcode', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome FROM equipamentos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });

    const appUrl = process.env.APP_URL || 'http://localhost';
    const url = `${appUrl}/equipamento/${req.params.id}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    res.json({ qr: qrDataUrl, url });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

router.get('/:id/historico', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await db.query(
      `SELECT m.*, u.nome AS usuario_nome
       FROM movimentacoes m
       JOIN users u ON u.id = m.usuario_id
       WHERE m.equipamento_id = $1
       ORDER BY m.data_hora DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

router.post(
  '/',
  auth,
  adminOnly,
  upload.single('foto'),
  [
    body('nome').notEmpty().withMessage('Nome obrigatório'),
    body('status').optional().isIn(['disponivel', 'retirado', 'manutencao']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, categoria, codigo, patrimonio, localizacao, descricao, status = 'disponivel' } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const result = await db.query(
        `INSERT INTO equipamentos (nome, categoria, codigo, patrimonio, localizacao, descricao, status, foto)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [nome, categoria || null, codigo || null, patrimonio || null, localizacao || null, descricao || null, status, foto]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Código já cadastrado' });
      res.status(500).json({ error: 'Erro ao criar equipamento' });
    }
  }
);

router.put('/:id', auth, adminOnly, upload.single('foto'), async (req, res) => {
  const { nome, categoria, codigo, patrimonio, localizacao, descricao, status } = req.body;
  try {
    const fields = [];
    const params = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); params.push(nome); }
    if (categoria !== undefined) { fields.push(`categoria = $${idx++}`); params.push(categoria); }
    if (codigo !== undefined) { fields.push(`codigo = $${idx++}`); params.push(codigo); }
    if (patrimonio !== undefined) { fields.push(`patrimonio = $${idx++}`); params.push(patrimonio); }
    if (localizacao !== undefined) { fields.push(`localizacao = $${idx++}`); params.push(localizacao); }
    if (descricao !== undefined) { fields.push(`descricao = $${idx++}`); params.push(descricao); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); params.push(status); }
    if (req.file) { fields.push(`foto = $${idx++}`); params.push(`/uploads/${req.file.filename}`); }

    if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.params.id);

    const result = await db.query(
      `UPDATE equipamentos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Código já cadastrado' });
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM equipamentos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json({ message: 'Equipamento excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir equipamento' });
  }
});

module.exports = router;
