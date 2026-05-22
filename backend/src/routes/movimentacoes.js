const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/retirar', auth, async (req, res) => {
  const { equipamento_id, observacao } = req.body;
  if (!equipamento_id) return res.status(400).json({ error: 'ID do equipamento obrigatório' });

  try {
    const equip = await db.query('SELECT * FROM equipamentos WHERE id = $1', [equipamento_id]);
    if (equip.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (equip.rows[0].status !== 'disponivel') {
      return res.status(409).json({ error: `Equipamento não está disponível (status: ${equip.rows[0].status})` });
    }

    await db.query('BEGIN');
    await db.query("UPDATE equipamentos SET status = 'retirado', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [
      equipamento_id,
    ]);
    const mov = await db.query(
      "INSERT INTO movimentacoes (equipamento_id, usuario_id, tipo, observacao) VALUES ($1, $2, 'retirada', $3) RETURNING *",
      [equipamento_id, req.user.id, observacao || null]
    );
    await db.query('COMMIT');

    res.status(201).json({
      movimentacao: mov.rows[0],
      equipamento: { ...equip.rows[0], status: 'retirado' },
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar retirada' });
  }
});

router.post('/devolver', auth, async (req, res) => {
  const { equipamento_id, observacao } = req.body;
  if (!equipamento_id) return res.status(400).json({ error: 'ID do equipamento obrigatório' });

  try {
    const equip = await db.query('SELECT * FROM equipamentos WHERE id = $1', [equipamento_id]);
    if (equip.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (equip.rows[0].status !== 'retirado') {
      return res.status(409).json({ error: `Equipamento não está retirado (status: ${equip.rows[0].status})` });
    }

    await db.query('BEGIN');
    await db.query("UPDATE equipamentos SET status = 'disponivel', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [
      equipamento_id,
    ]);
    const mov = await db.query(
      "INSERT INTO movimentacoes (equipamento_id, usuario_id, tipo, observacao) VALUES ($1, $2, 'devolucao', $3) RETURNING *",
      [equipamento_id, req.user.id, observacao || null]
    );
    await db.query('COMMIT');

    res.status(201).json({
      movimentacao: mov.rows[0],
      equipamento: { ...equip.rows[0], status: 'disponivel' },
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: 'Erro ao registrar devolução' });
  }
});

router.get('/pendentes', auth, async (req, res) => {
  try {
    let query = `
      SELECT e.*,
             m.data_hora AS retirado_em,
             m.observacao AS obs_retirada,
             u.nome AS usuario_nome,
             u.id AS usuario_id
      FROM equipamentos e
      JOIN movimentacoes m ON m.id = (
        SELECT id FROM movimentacoes
        WHERE equipamento_id = e.id
        ORDER BY data_hora DESC
        LIMIT 1
      )
      JOIN users u ON u.id = m.usuario_id
      WHERE e.status = 'retirado'
        AND m.tipo = 'retirada'
    `;
    const params = [];

    if (req.user.tipo !== 'admin') {
      query += ` AND m.usuario_id = $1`;
      params.push(req.user.id);
    }

    query += ` ORDER BY m.data_hora ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pendências' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, usuario_id, equipamento_id, tipo } = req.query;

    let query = `
      SELECT m.*,
             u.nome AS usuario_nome, u.email AS usuario_email,
             e.nome AS equipamento_nome, e.categoria AS equipamento_categoria
      FROM movimentacoes m
      JOIN users u ON u.id = m.usuario_id
      JOIN equipamentos e ON e.id = m.equipamento_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    // Usuários comuns só veem as próprias movimentações
    if (req.user.tipo !== 'admin') {
      query += ` AND m.usuario_id = $${idx++}`;
      params.push(req.user.id);
    } else if (usuario_id) {
      query += ` AND m.usuario_id = $${idx++}`;
      params.push(usuario_id);
    }

    if (equipamento_id) { query += ` AND m.equipamento_id = $${idx++}`; params.push(equipamento_id); }
    if (tipo) { query += ` AND m.tipo = $${idx++}`; params.push(tipo); }

    query += ` ORDER BY m.data_hora DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar movimentações' });
  }
});

module.exports = router;
