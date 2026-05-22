const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, nome, email, tipo, ativo, created_at FROM users';
    const params = [];
    if (search) {
      query += ' WHERE nome ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY nome';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nome, email, tipo, ativo, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.post(
  '/',
  [
    body('nome').notEmpty().withMessage('Nome obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('tipo').isIn(['admin', 'usuario']).withMessage('Tipo inválido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, email, senha, tipo } = req.body;
    try {
      const hash = await bcrypt.hash(senha, 10);
      const result = await db.query(
        'INSERT INTO users (nome, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, tipo',
        [nome, email, hash, tipo]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
);

router.put(
  '/:id',
  [
    body('nome').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('tipo').optional().isIn(['admin', 'usuario']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, email, senha, tipo, ativo } = req.body;
    try {
      const fields = [];
      const params = [];
      let idx = 1;

      if (nome !== undefined) { fields.push(`nome = $${idx++}`); params.push(nome); }
      if (email !== undefined) { fields.push(`email = $${idx++}`); params.push(email); }
      if (tipo !== undefined) { fields.push(`tipo = $${idx++}`); params.push(tipo); }
      if (ativo !== undefined) { fields.push(`ativo = $${idx++}`); params.push(ativo); }
      if (senha) {
        const hash = await bcrypt.hash(senha, 10);
        fields.push(`senha = $${idx++}`);
        params.push(hash);
      }

      if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(req.params.id);

      const result = await db.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, nome, email, tipo, ativo`,
        params
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' });
  }
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

module.exports = router;
