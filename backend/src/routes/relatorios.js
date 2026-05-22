const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

router.get('/resumo', async (req, res) => {
  try {
    const [total, disponiveis, retirados, manutencao, usuarios, movMes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM equipamentos'),
      db.query("SELECT COUNT(*) FROM equipamentos WHERE status = 'disponivel'"),
      db.query("SELECT COUNT(*) FROM equipamentos WHERE status = 'retirado'"),
      db.query("SELECT COUNT(*) FROM equipamentos WHERE status = 'manutencao'"),
      db.query('SELECT COUNT(*) FROM users WHERE ativo = true'),
      db.query("SELECT COUNT(*) FROM movimentacoes WHERE data_hora >= date_trunc('month', CURRENT_DATE)"),
    ]);

    res.json({
      total_equipamentos: parseInt(total.rows[0].count),
      disponiveis: parseInt(disponiveis.rows[0].count),
      retirados: parseInt(retirados.rows[0].count),
      manutencao: parseInt(manutencao.rows[0].count),
      total_usuarios: parseInt(usuarios.rows[0].count),
      movimentacoes_mes: parseInt(movMes.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar resumo' });
  }
});

router.get('/mais-usados', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await db.query(
      `SELECT e.id, e.nome, e.categoria, COUNT(m.id) AS total_movimentacoes
       FROM equipamentos e
       LEFT JOIN movimentacoes m ON m.equipamento_id = e.id
       GROUP BY e.id, e.nome, e.categoria
       ORDER BY total_movimentacoes DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

router.get('/equipamentos-fora', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*,
              u.nome AS retirado_por,
              m.data_hora AS retirado_em
       FROM equipamentos e
       JOIN movimentacoes m ON m.equipamento_id = e.id
       JOIN users u ON u.id = m.usuario_id
       WHERE e.status = 'retirado'
         AND m.id = (
           SELECT id FROM movimentacoes
           WHERE equipamento_id = e.id
           ORDER BY data_hora DESC LIMIT 1
         )
       ORDER BY m.data_hora`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

router.get('/por-usuario', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nome, u.email,
              COUNT(m.id) AS total,
              COUNT(CASE WHEN m.tipo = 'retirada' THEN 1 END) AS retiradas,
              COUNT(CASE WHEN m.tipo = 'devolucao' THEN 1 END) AS devolucoes,
              MAX(m.data_hora) AS ultima_movimentacao
       FROM users u
       LEFT JOIN movimentacoes m ON m.usuario_id = u.id
       GROUP BY u.id, u.nome, u.email
       ORDER BY total DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

router.get('/historico-geral', async (req, res) => {
  try {
    const { inicio, fim, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT m.*,
             u.nome AS usuario_nome,
             e.nome AS equipamento_nome, e.categoria
      FROM movimentacoes m
      JOIN users u ON u.id = m.usuario_id
      JOIN equipamentos e ON e.id = m.equipamento_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (inicio) { query += ` AND m.data_hora >= $${idx++}`; params.push(inicio); }
    if (fim) { query += ` AND m.data_hora <= $${idx++}`; params.push(fim + ' 23:59:59'); }

    query += ` ORDER BY m.data_hora DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar histórico' });
  }
});

router.get('/export-csv', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    let query = `
      SELECT
        m.data_hora,
        m.tipo,
        u.nome AS usuario,
        u.email,
        e.nome AS equipamento,
        e.categoria,
        e.codigo,
        m.observacao
      FROM movimentacoes m
      JOIN users u ON u.id = m.usuario_id
      JOIN equipamentos e ON e.id = m.equipamento_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (inicio) { query += ` AND m.data_hora >= $${idx++}`; params.push(inicio); }
    if (fim) { query += ` AND m.data_hora <= $${idx++}`; params.push(fim + ' 23:59:59'); }
    query += ' ORDER BY m.data_hora DESC';

    const result = await db.query(query, params);

    const header = 'Data/Hora,Tipo,Usuário,Email,Equipamento,Categoria,Código,Observação';
    const rows = result.rows.map((r) =>
      [
        new Date(r.data_hora).toLocaleString('pt-BR'),
        r.tipo === 'retirada' ? 'Retirada' : 'Devolução',
        r.usuario,
        r.email,
        r.equipamento,
        r.categoria || '',
        r.codigo || '',
        (r.observacao || '').replace(/,/g, ';'),
      ].join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="historico.csv"');
    res.send('﻿' + [header, ...rows].join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar CSV' });
  }
});

module.exports = router;
