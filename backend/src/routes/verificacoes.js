const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/verificacoes — submeter verificação (com até 5 fotos)
router.post('/', auth, upload.array('fotos', 5), async (req, res) => {
  const { equipamento_id, template_id, observacao_geral, respostas } = req.body;

  let parsedRespostas = [];
  try {
    parsedRespostas = typeof respostas === 'string' ? JSON.parse(respostas) : (respostas || []);
  } catch {
    return res.status(400).json({ error: 'respostas inválidas' });
  }

  // Calcular status automaticamente
  const temNao = parsedRespostas.some((r) => r.resposta === 'nao');
  const temObs =
    parsedRespostas.some((r) => r.observacao && r.observacao.trim()) ||
    (observacao_geral && observacao_geral.trim());
  const status = temNao ? 'problema' : temObs ? 'alerta' : 'aprovado';

  try {
    await db.query('BEGIN');

    const verif = await db.query(
      `INSERT INTO verificacoes (equipamento_id, template_id, usuario_id, status, observacao_geral)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [equipamento_id, template_id || null, req.user.id, status, observacao_geral || null]
    );
    const vid = verif.rows[0].id;

    for (const r of parsedRespostas) {
      await db.query(
        `INSERT INTO verificacao_respostas (verificacao_id, item_id, pergunta, resposta, observacao)
         VALUES ($1, $2, $3, $4, $5)`,
        [vid, r.item_id || null, r.pergunta, r.resposta, r.observacao || null]
      );
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.query('INSERT INTO verificacao_fotos (verificacao_id, url) VALUES ($1, $2)', [
          vid,
          `/uploads/${file.filename}`,
        ]);
      }
    }

    await db.query('COMMIT');
    res.status(201).json({ id: vid, status });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar verificação' });
  }
});

// GET /api/verificacoes — listar (admin vê todas; usuário vê as próprias)
router.get('/', auth, async (req, res) => {
  try {
    const { equipamento_id, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT v.*, u.nome AS usuario_nome,
             e.nome AS equipamento_nome, e.categoria AS equipamento_categoria,
             e.foto AS equipamento_foto,
             ct.nome AS template_nome,
             (SELECT COUNT(*) FROM verificacao_respostas WHERE verificacao_id = v.id)::int AS total_itens
      FROM verificacoes v
      JOIN users u ON u.id = v.usuario_id
      LEFT JOIN equipamentos e ON e.id = v.equipamento_id
      LEFT JOIN checklist_templates ct ON ct.id = v.template_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (req.user.tipo !== 'admin') {
      query += ` AND v.usuario_id = $${idx++}`;
      params.push(req.user.id);
    }
    if (equipamento_id) { query += ` AND v.equipamento_id = $${idx++}`; params.push(equipamento_id); }
    if (status) { query += ` AND v.status = $${idx++}`; params.push(status); }

    query += ` ORDER BY v.data_hora DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar verificações' });
  }
});

// GET /api/verificacoes/:id — detalhe completo com respostas e fotos
router.get('/:id', auth, async (req, res) => {
  try {
    const verif = await db.query(
      `SELECT v.*, u.nome AS usuario_nome, u.email AS usuario_email,
              e.nome AS equipamento_nome, e.categoria AS equipamento_categoria,
              e.foto AS equipamento_foto, e.localizacao AS equipamento_localizacao,
              e.codigo AS equipamento_codigo, e.id AS equip_id,
              ct.nome AS template_nome
       FROM verificacoes v
       JOIN users u ON u.id = v.usuario_id
       LEFT JOIN equipamentos e ON e.id = v.equipamento_id
       LEFT JOIN checklist_templates ct ON ct.id = v.template_id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (verif.rows.length === 0) return res.status(404).json({ error: 'Verificação não encontrada' });
    if (req.user.tipo !== 'admin' && verif.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const respostas = await db.query(
      'SELECT * FROM verificacao_respostas WHERE verificacao_id = $1 ORDER BY id',
      [req.params.id]
    );
    const fotos = await db.query(
      'SELECT * FROM verificacao_fotos WHERE verificacao_id = $1 ORDER BY id',
      [req.params.id]
    );

    res.json({ ...verif.rows[0], respostas: respostas.rows, fotos: fotos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar verificação' });
  }
});

module.exports = router;
