const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── Templates ──────────────────────────────────────────────────────────────

// GET /api/checklists/status — todos os templates ativos com última verificação (todos os usuários)
router.get('/status', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        ct.id, ct.nome, ct.descricao, ct.tipo, ct.categoria, ct.equipamento_id,
        eq.nome  AS equipamento_nome,
        (SELECT COUNT(*) FROM checklist_itens WHERE template_id = ct.id)::int AS total_itens,
        (SELECT v.status   FROM verificacoes v WHERE v.template_id = ct.id ORDER BY v.data_hora DESC LIMIT 1) AS ultima_status,
        (SELECT v.data_hora FROM verificacoes v WHERE v.template_id = ct.id ORDER BY v.data_hora DESC LIMIT 1) AS ultima_data,
        (SELECT u.nome FROM verificacoes v JOIN users u ON u.id = v.usuario_id WHERE v.template_id = ct.id ORDER BY v.data_hora DESC LIMIT 1) AS ultimo_usuario
      FROM checklist_templates ct
      LEFT JOIN equipamentos eq ON eq.id = ct.equipamento_id
      WHERE ct.ativo = true
      ORDER BY ct.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar status dos checklists' });
  }
});

// GET /api/checklists/templates
router.get('/templates', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ct.*,
             COUNT(ci.id)::int AS total_itens,
             e.nome AS equipamento_nome
      FROM checklist_templates ct
      LEFT JOIN checklist_itens ci ON ci.template_id = ct.id
      LEFT JOIN equipamentos e ON e.id = ct.equipamento_id
      GROUP BY ct.id, e.nome
      ORDER BY ct.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
});

// GET /api/checklists/template-info/:id — info pública do template + equipamentos aplicáveis (não admin)
router.get('/template-info/:id', auth, async (req, res) => {
  try {
    const tmpl = await db.query(
      `SELECT id, nome, descricao, tipo, categoria, equipamento_id
       FROM checklist_templates WHERE id = $1 AND ativo = true`,
      [req.params.id]
    );
    if (tmpl.rows.length === 0) return res.status(404).json({ error: 'Template não encontrado ou inativo' });
    const { tipo, categoria, equipamento_id: eqId } = tmpl.rows[0];

    let equipamentos = [];
    if (tipo === 'equipamento' && eqId) {
      const r = await db.query(
        'SELECT id, nome, categoria, foto, status, localizacao, codigo FROM equipamentos WHERE id = $1',
        [eqId]
      );
      equipamentos = r.rows;
    } else if (tipo === 'categoria' && categoria) {
      const r = await db.query(
        'SELECT id, nome, categoria, foto, status, localizacao, codigo FROM equipamentos WHERE categoria = $1 ORDER BY nome',
        [categoria]
      );
      equipamentos = r.rows;
    } else {
      const r = await db.query(
        'SELECT id, nome, categoria, foto, status, localizacao, codigo FROM equipamentos ORDER BY nome'
      );
      equipamentos = r.rows;
    }
    const itens = await db.query(
      'SELECT * FROM checklist_itens WHERE template_id = $1 ORDER BY ordem, id',
      [req.params.id]
    );
    res.json({ ...tmpl.rows[0], equipamentos, itens: itens.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar template' });
  }
});

// GET /api/checklists/para/:equipamento_id — template aplicável (prioridade: equipamento > categoria > global)
router.get('/para/:equipamento_id', auth, async (req, res) => {
  try {
    const equip = await db.query('SELECT id, categoria FROM equipamentos WHERE id = $1', [req.params.equipamento_id]);
    if (equip.rows.length === 0) return res.status(404).json({ error: 'Equipamento não encontrado' });
    const { id: equipId, categoria } = equip.rows[0];

    let templateId = null;

    // 1. Específico do equipamento
    let r = await db.query(
      'SELECT id FROM checklist_templates WHERE tipo = $1 AND equipamento_id = $2 AND ativo = true LIMIT 1',
      ['equipamento', equipId]
    );
    if (r.rows.length > 0) templateId = r.rows[0].id;

    // 2. Por categoria
    if (!templateId && categoria) {
      r = await db.query(
        'SELECT id FROM checklist_templates WHERE tipo = $1 AND categoria = $2 AND ativo = true LIMIT 1',
        ['categoria', categoria]
      );
      if (r.rows.length > 0) templateId = r.rows[0].id;
    }

    // 3. Global
    if (!templateId) {
      r = await db.query(
        'SELECT id FROM checklist_templates WHERE tipo = $1 AND ativo = true ORDER BY id LIMIT 1',
        ['global']
      );
      if (r.rows.length > 0) templateId = r.rows[0].id;
    }

    if (!templateId) return res.status(404).json({ error: 'Nenhum checklist configurado' });

    const tmpl = await db.query('SELECT * FROM checklist_templates WHERE id = $1', [templateId]);
    const itens = await db.query(
      'SELECT * FROM checklist_itens WHERE template_id = $1 ORDER BY ordem, id',
      [templateId]
    );
    res.json({ ...tmpl.rows[0], itens: itens.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar checklist' });
  }
});

// GET /api/checklists/templates/:id
router.get('/templates/:id', auth, adminOnly, async (req, res) => {
  try {
    const tmpl = await db.query('SELECT * FROM checklist_templates WHERE id = $1', [req.params.id]);
    if (tmpl.rows.length === 0) return res.status(404).json({ error: 'Template não encontrado' });
    const itens = await db.query(
      'SELECT * FROM checklist_itens WHERE template_id = $1 ORDER BY ordem, id',
      [req.params.id]
    );
    res.json({ ...tmpl.rows[0], itens: itens.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar template' });
  }
});

// POST /api/checklists/templates
router.post('/templates', auth, adminOnly, async (req, res) => {
  const { nome, descricao, tipo = 'global', categoria, equipamento_id, itens = [] } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
  try {
    const tmpl = await db.query(
      `INSERT INTO checklist_templates (nome, descricao, tipo, categoria, equipamento_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, descricao || null, tipo, categoria || null, equipamento_id || null]
    );
    const tid = tmpl.rows[0].id;
    for (let i = 0; i < itens.length; i++) {
      await db.query(
        `INSERT INTO checklist_itens (template_id, ordem, pergunta, descricao, obs_obrigatoria_em_nao)
         VALUES ($1, $2, $3, $4, $5)`,
        [tid, i, itens[i].pergunta, itens[i].descricao || null, itens[i].obs_obrigatoria_em_nao !== false]
      );
    }
    const result = await db.query('SELECT * FROM checklist_itens WHERE template_id = $1 ORDER BY ordem', [tid]);
    res.status(201).json({ ...tmpl.rows[0], itens: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// PUT /api/checklists/templates/:id
router.put('/templates/:id', auth, adminOnly, async (req, res) => {
  const { nome, descricao, tipo, categoria, equipamento_id, ativo, itens } = req.body;
  try {
    const tmpl = await db.query(
      `UPDATE checklist_templates
       SET nome = COALESCE($1, nome), descricao = $2, tipo = COALESCE($3, tipo),
           categoria = $4, equipamento_id = $5, ativo = COALESCE($6, ativo)
       WHERE id = $7 RETURNING *`,
      [nome, descricao ?? null, tipo, categoria ?? null, equipamento_id ?? null, ativo, req.params.id]
    );
    if (tmpl.rows.length === 0) return res.status(404).json({ error: 'Template não encontrado' });

    if (itens !== undefined) {
      await db.query('DELETE FROM checklist_itens WHERE template_id = $1', [req.params.id]);
      for (let i = 0; i < itens.length; i++) {
        await db.query(
          `INSERT INTO checklist_itens (template_id, ordem, pergunta, descricao, obs_obrigatoria_em_nao)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.params.id, i, itens[i].pergunta, itens[i].descricao || null, itens[i].obs_obrigatoria_em_nao !== false]
        );
      }
    }
    const result = await db.query('SELECT * FROM checklist_itens WHERE template_id = $1 ORDER BY ordem', [req.params.id]);
    res.json({ ...tmpl.rows[0], itens: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// DELETE /api/checklists/templates/:id
router.delete('/templates/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM checklist_templates WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template não encontrado' });
    res.json({ message: 'Template excluído' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir template' });
  }
});

module.exports = router;
