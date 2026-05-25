import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Loader2, Package, ClipboardCheck, Camera, X,
  CheckCircle, AlertTriangle, XCircle, Check, Minus, ScanLine,
  MessageSquare,
} from 'lucide-react';

const STATUS_CONFIG = {
  aprovado: {
    label: 'Aprovado!',
    sublabel: 'Equipamento verificado e funcionando corretamente',
    Icon: CheckCircle,
    iconColor: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    ringColor: 'bg-green-100',
  },
  alerta: {
    label: 'Com Observações',
    sublabel: 'Equipamento funcionando, mas com pontos de atenção',
    Icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ringColor: 'bg-amber-100',
  },
  problema: {
    label: 'Problema Identificado',
    sublabel: 'Equipamento com falha — requer atenção imediata',
    Icon: XCircle,
    iconColor: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ringColor: 'bg-red-100',
  },
};

export default function ChecklistVerificacao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equip, setEquip] = useState(null);
  const [template, setTemplate] = useState(null);
  const [noTemplate, setNoTemplate] = useState(false);
  const [loading, setLoading] = useState(true);

  const [respostas, setRespostas] = useState([]);
  const [obsOpen, setObsOpen] = useState([]);
  const [obsGeral, setObsGeral] = useState('');
  const [fotos, setFotos] = useState([]);
  const [fotoPreviews, setFotoPreviews] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const [equipRes, tmplRes] = await Promise.allSettled([
        api.get(`/equipamentos/${id}`),
        api.get(`/checklists/para/${id}`),
      ]);
      if (equipRes.status === 'fulfilled') {
        setEquip(equipRes.value.data);
      } else {
        toast.error('Equipamento não encontrado');
        navigate('/dashboard');
        return;
      }
      if (tmplRes.status === 'fulfilled') {
        const tmpl = tmplRes.value.data;
        setTemplate(tmpl);
        setRespostas(tmpl.itens.map((item) => ({
          item_id: item.id,
          pergunta: item.pergunta,
          resposta: null,
          observacao: '',
        })));
        setObsOpen(new Array(tmpl.itens.length).fill(false));
      } else {
        setNoTemplate(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function setResposta(idx, campo, valor) {
    setRespostas((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [campo]: valor };
      return next;
    });
    // Auto-abrir obs quando responde "não"
    if (campo === 'resposta' && valor === 'nao') {
      setObsOpen((prev) => prev.map((v, i) => (i === idx ? true : v)));
    }
  }

  function toggleObs(idx) {
    setObsOpen((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  function addFotos(e) {
    const files = Array.from(e.target.files);
    const disponivel = 5 - fotos.length;
    const novas = files.slice(0, disponivel);
    setFotos((prev) => [...prev, ...novas]);
    setFotoPreviews((prev) => [...prev, ...novas.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function removeFoto(idx) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
    setFotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    for (let i = 0; i < respostas.length; i++) {
      const r = respostas[i];
      if (!r.resposta) return `Selecione uma resposta para o item ${i + 1}`;
      if (
        r.resposta === 'nao' &&
        template.itens[i].obs_obrigatoria_em_nao &&
        !r.observacao.trim()
      ) {
        return `Item ${i + 1}: observação obrigatória ao responder "Não"`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    const erro = validate();
    if (erro) { toast.error(erro); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('equipamento_id', equip.id);
      if (template) fd.append('template_id', template.id);
      fd.append('observacao_geral', obsGeral);
      fd.append('respostas', JSON.stringify(respostas));
      fotos.forEach((f) => fd.append('fotos', f));
      const res = await api.post('/verificacoes', fd);
      setResultado(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar verificação');
    } finally {
      setSubmitting(false);
    }
  }

  const respondidos = respostas.filter((r) => r.resposta !== null).length;
  const total = respostas.length;
  const progresso = total > 0 ? Math.round((respondidos / total) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Tela de resultado ────────────────────────────────────────────────────
  if (resultado) {
    const cfg = STATUS_CONFIG[resultado.status] || STATUS_CONFIG.aprovado;
    const StatusIcon = cfg.Icon;
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className={`card p-6 ${cfg.bg} border ${cfg.border} flex flex-col items-center text-center gap-4`}>
          <div className={`w-20 h-20 rounded-full ${cfg.ringColor} flex items-center justify-center`}>
            <StatusIcon size={44} className={cfg.iconColor} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{cfg.label}</h2>
            <p className="text-sm text-gray-600 mt-1">{cfg.sublabel}</p>
          </div>
          <p className="font-semibold text-gray-800">{equip?.nome}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            <span>·</span>
            <span>{respondidos}/{total} itens</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to={`/verificacoes/${resultado.id}`} className="btn-secondary justify-center text-sm">
            <ClipboardCheck size={16} /> Ver Relatório
          </Link>
          <button onClick={() => navigate('/scanner')} className="btn-primary justify-center text-sm">
            <ScanLine size={16} /> Escanear outro
          </button>
        </div>
        <Link to={`/equipamento/${id}`} className="btn-secondary w-full justify-center text-sm">
          <ChevronLeft size={16} /> Voltar ao equipamento
        </Link>
      </div>
    );
  }

  // ── Sem template ─────────────────────────────────────────────────────────
  if (noTemplate) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="card p-8 text-center space-y-3">
          <ClipboardCheck size={52} className="mx-auto text-gray-300" />
          <h2 className="font-bold text-gray-700 text-lg">Nenhum checklist configurado</h2>
          <p className="text-sm text-gray-500">
            Não há um checklist vinculado a este equipamento ou à sua categoria.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Um administrador pode criar templates em:<br />
            <strong>Verificações → Gerenciar Checklists</strong>
          </p>
        </div>
      </div>
    );
  }

  // ── Formulário principal ─────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Voltar
      </button>

      {/* Equipment info */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          {equip?.foto ? (
            <img src={equip.foto} alt={equip.nome} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Package size={24} className="text-blue-400" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">{equip?.nome}</h1>
            {equip?.categoria && <p className="text-xs text-gray-500 mt-0.5">{equip.categoria}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <ClipboardCheck size={13} className="text-blue-500" />
              <p className="text-xs text-blue-600 font-medium">{template?.nome}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="card p-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span className="font-medium">{respondidos}/{total} itens respondidos</span>
          <span className={`font-bold ${progresso === 100 ? 'text-green-600' : 'text-blue-600'}`}>{progresso}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progresso === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {template?.itens.map((item, idx) => {
          const resp = respostas[idx];
          const isNao = resp?.resposta === 'nao';
          const obsObrig = isNao && item.obs_obrigatoria_em_nao;
          const showObs = obsOpen[idx];

          return (
            <div
              key={item.id}
              className={`card p-4 transition-colors ${
                isNao ? 'border-red-200 bg-red-50/40' :
                resp?.resposta === 'sim' ? 'border-green-200 bg-green-50/40' :
                resp?.resposta === 'na' ? 'border-gray-300' : ''
              }`}
            >
              {/* Número + pergunta */}
              <div className="flex gap-3 mb-3">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                  resp?.resposta === 'sim' ? 'bg-green-100 text-green-700' :
                  resp?.resposta === 'nao' ? 'bg-red-100 text-red-700' :
                  resp?.resposta === 'na'  ? 'bg-gray-200 text-gray-500' :
                  'bg-gray-100 text-gray-400'
                }`}>{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.pergunta}</p>
                  {item.descricao && <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>}
                </div>
              </div>

              {/* Botões sim/não/n.a. */}
              <div className="flex gap-2 ml-9">
                {[
                  { val: 'sim', label: 'Sim',  Icon: Check,  active: 'bg-green-600 text-white border-green-600', hover: 'hover:border-green-400' },
                  { val: 'nao', label: 'Não',  Icon: X,      active: 'bg-red-600 text-white border-red-600',     hover: 'hover:border-red-400' },
                  { val: 'na',  label: 'N/A',  Icon: Minus,  active: 'bg-gray-500 text-white border-gray-500',   hover: 'hover:border-gray-400' },
                ].map(({ val, label, Icon: Ico, active, hover }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setResposta(idx, 'resposta', val)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                      resp?.resposta === val ? active : `border-gray-200 text-gray-500 ${hover}`
                    }`}
                  >
                    <Ico size={13} /> {label}
                  </button>
                ))}

                {/* Botão para obs opcional (não-nao) */}
                {resp?.resposta && resp.resposta !== 'nao' && (
                  <button
                    type="button"
                    onClick={() => toggleObs(idx)}
                    className={`ml-auto p-1.5 rounded-lg transition-colors ${
                      showObs || resp.observacao
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Adicionar observação"
                  >
                    <MessageSquare size={15} />
                  </button>
                )}
              </div>

              {/* Observação */}
              {(isNao || showObs) && (
                <textarea
                  className={`input resize-none mt-3 text-sm ${
                    obsObrig && !resp.observacao.trim() ? 'border-red-400 bg-red-50' : ''
                  }`}
                  rows={2}
                  placeholder={obsObrig ? 'Observação obrigatória *' : 'Observação (opcional)'}
                  value={resp?.observacao || ''}
                  onChange={(e) => setResposta(idx, 'observacao', e.target.value)}
                />
              )}
              {obsObrig && !resp.observacao.trim() && (
                <p className="text-xs text-red-500 mt-1 ml-0">⚠ Descreva o problema encontrado</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Fotos */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Camera size={16} className="text-gray-500" /> Fotos do equipamento
          </h3>
          <span className="text-xs text-gray-400">{fotos.length}/5</span>
        </div>
        {fotoPreviews.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {fotoPreviews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} className="w-20 h-20 object-cover rounded-lg border border-gray-200" alt="" />
                <button
                  type="button"
                  onClick={() => removeFoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        {fotos.length < 5 && (
          <label className="btn-secondary cursor-pointer text-sm inline-flex">
            <Camera size={15} /> Adicionar foto
            <input type="file" accept="image/*" multiple className="hidden" onChange={addFotos} />
          </label>
        )}
        <p className="text-xs text-gray-400">Opcional · até 5 fotos</p>
      </div>

      {/* Observação geral */}
      <div className="card p-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">Observação Geral</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Observações adicionais sobre o estado geral do equipamento..."
          value={obsGeral}
          onChange={(e) => setObsGeral(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || respondidos < total}
        className={`btn-primary w-full py-3.5 text-base ${respondidos < total ? 'opacity-60' : ''}`}
      >
        {submitting ? (
          <><Loader2 size={16} className="animate-spin" /> Salvando verificação...</>
        ) : (
          <><ClipboardCheck size={18} /> Confirmar Verificação ({respondidos}/{total})</>
        )}
      </button>
      {respondidos < total && (
        <p className="text-center text-xs text-gray-400 -mt-2">
          Responda todos os {total} itens para confirmar
        </p>
      )}
    </div>
  );
}
