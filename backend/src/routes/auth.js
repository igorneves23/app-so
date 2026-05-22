const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').notEmpty().withMessage('Senha obrigatória'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, senha } = req.body;
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1 AND ativo = true', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(senha, user.senha);
      if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

      const token = jwt.sign(
        { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
);

router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nome, email, tipo, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

module.exports = router;
