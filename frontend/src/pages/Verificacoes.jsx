import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, CheckCircle, AlertTriangle, XCircle,
  Package, ChevronRight, Loader2, Settings, Globe, Tag,
  Clock, PlayCircle, RefreshCw, Circle,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = new Date() - new Date(dateStr);
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 2)  return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffH < 24)   return `há ${diffH}h`;
  if (diffD === 1)  return 'há 1 dia';
  return `há ${diffD} dias`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

// ── Configs de status ─────────────────────────────────────────────────────────
const VERIF_STATUS = {
  aprovado: {
    label: 'Aprovado',
    Icon: CheckCircle,
    badge: 'bg-green-100 text-green-700',
    cardBorder: 'border-green-200',
    cardBg: 'bg-green-50/60',
    dot: 'bg-green-500',
  },
  alerta: {
    label: 'Com Alerta',
    Icon: AlertTriangle,
    badge: 'bg-amber-100 text-amber-700',
    cardBorder: 'border-amber-200',
    cardBg: 'bg-amber-50/60',
    dot: 'bg-amber-500',
  },
  problema: {
    label: 'Problema',
    Icon: XCircle,
    badge: 'bg-red-100 text-red-700',
    cardBorder: 'border-red-200',
    cardBg: 'bg-red-50/60',
    dot: 'bg-red-500',
  },
  pendente: {
    label: 'Pendente',
    Icon: Circle,
    badge: 'bg-gray-100 text-gray-500',
    cardBorder: 'border-gray-200',
    cardBg: 'bg-gray-50/40',
    dot: 'bg-gray-300',
  },
};

const TIPO_CONFIG = {
  global:      { label: 'Global',           Icon: Globe,    color: 'bg-blue-100 text-blue-700'     },
  categoria:   { label: 'Categoria',        Icon: Tag,      color: 'bg-purple-100 text-purple-700' },
  equipamento: { label: 'Equipamento',      Icon: Package,  color: 'bg-green-100 text-green-700'   },
};

function StatusBadgeVerif({ status }) {
  const cfg = VERIF_STATUS[status] || VERIF_STATUS.pendente;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ── Card de template com status ────────────────────────────────────────────────
function TemplateCard({ t }) {
  const hasVerif = !!t.ultima_status;
  const today    = isToday(t.ultima_data);
  const status   = hasVerif ? t.ultima_status : 'pendente';
  const cfg      = VERIF_STATUS[status] || VERIF_STATUS.pendente;
  const tipoCfg  = TIPO_CONFIG[t.tipo] || TIPO_CONFIG.global;
  const TipoIcon = tipoCfg.Icon;

  return (
    <div className={`card p-4 border ${cfg.cardBorder} ${cfg.cardBg} transition-all`}>
      <div className="flex items-start gap-3">
        {/* Ícone de status */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          status === 'aprovado' ? 'bg-green-100' :
          status === 'alerta'   ? 'bg-amber-100' :
          status === 'problema' ? 'bg-red-100'   : 'bg-gray-100'
        }`}>
          <cfg.Icon size={20} className={
            status === 'aprovado' ? 'text-green-600' :
            status === 'alerta'   ? 'text-amber-600' :
            status === 'problema' ? 'text-red-600'   : 'text-gray-400'
          } />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-tight text-sm">{t.nome}</h3>
            <StatusBadgeVerif status={status} />
          </div>

          {/* Tipo badge */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${tipoCfg.color}`}>
            <TipoIcon size={9} />
            {tipoCfg.label}
            {t.tipo === 'categoria'   && t.categoria       && `: ${t.categoria}`}
            {t.tipo === 'equipamento' && t.equipamento_nome && `: ${t.equipamento_nome}`}
          </span>

          {/* Última verificação */}
          <div className="mt-2">
            {hasVerif ? (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={11} />
                {t.ultimo_usuario} · {timeAgo(t.ultima_data)}
                {today && (
                  <span className="ml-1 bg-green-100 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    hoje
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={11} /> Ainda não verificado
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botão verificar */}
      <Link
        to={`/checklist/fill/${t.id}`}
        className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
          status === 'problema'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : status === 'aprovado' && today
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {status === 'aprovado' && today ? (
          <><RefreshCw size={14} /> Verificar novamente</>
        ) : (
          <><PlayCircle size={16} /> Verificar agora</>
        )}
      </Link>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Verificacoes() {
  const { isAdmin } = useAuth();

  const [templates, setTemplates]       = useState([]);
  const [verificacoes, setVerificacoes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [tmplRes, verifRes] = await Promise.allSettled([
        api.get('/checklists/status'),
        api.get('/verificacoes', { params: { limit: 30 } }),
      ]);
      if (tmplRes.status === 'fulfilled')  setTemplates(tmplRes.value.data);
      if (verifRes.status === 'fulfilled') setVerificacoes(verifRes.value.data);
    } catch {
      toast.error('Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  // Filtrar templates por status
  const filteredTemplates = templates.filter((t) => {
    if (!statusFilter) return true;
    const s = t.ultima_status || 'pendente';
    return s === statusFilter;
  });

  // Filtrar histórico por status
  const filteredVerif = verificacoes.filter((v) =>
    !statusFilter || v.status === statusFilter
  );

  // Contadores para os filtros
  const counts = {
    pendente: templates.filter((t) => !t.ultima_status).length,
    aprovado: templates.filter((t) => t.ultima_status === 'aprovado').length,
    alerta:   templates.filter((t) => t.ultima_status === 'alerta').length,
    problema: templates.filter((t) => t.ultima_status === 'problema').length,
  };

  // Agrupar templates por tipo/categoria para exibição
  const grouped = filteredTemplates.reduce((acc, t) => {
    const key =
      t.tipo === 'categoria'   ? `Categoria: ${t.categoria || 'Geral'}` :
      t.tipo === 'equipamento' ? `Equipamento: ${t.equipamento_nome || 'Específico'}` :
      'Global';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort();

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verificações</h1>
          <p className="text-xs text-gray-500 mt-0.5">Status dos checklists operacionais</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/checklist/templates" className="btn-secondary text-sm py-2 px-3">
              <Settings size={15} /> Checklists
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* ── Filtros de status ── */}
          {templates.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { val: '',         label: 'Todos',     count: templates.length, color: 'bg-gray-600' },
                { val: 'pendente', label: 'Pendentes', count: counts.pendente,  color: 'bg-gray-400' },
                { val: 'aprovado', label: 'Aprovados', count: counts.aprovado,  color: 'bg-green-600' },
                { val: 'alerta',   label: 'Alertas',   count: counts.alerta,    color: 'bg-amber-500' },
                { val: 'problema', label: 'Problemas', count: counts.problema,  color: 'bg-red-600' },
              ].filter(f => f.val === '' || f.count > 0).map(({ val, label, count, color }) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                    statusFilter === val
                      ? `${color} text-white border-transparent`
                      : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] px-1 rounded-full ${
                    statusFilter === val ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Checklists por categoria ── */}
          {templates.length === 0 ? (
            <div className="card p-10 text-center space-y-3">
              <ClipboardCheck size={48} className="mx-auto text-gray-300" />
              <p className="text-gray-500 font-medium">Nenhum checklist configurado</p>
              <p className="text-xs text-gray-400">
                {isAdmin
                  ? 'Crie templates em "Checklists" para começar'
                  : 'Aguarde o administrador configurar os checklists'}
              </p>
              {isAdmin && (
                <Link to="/checklist/templates" className="btn-primary inline-flex text-sm mt-2">
                  <Settings size={15} /> Configurar Checklists
                </Link>
              )}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <p>Nenhum checklist com este status</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupKeys.map((groupKey) => (
                <section key={groupKey}>
                  {/* Cabeçalho do grupo */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {groupKey}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {grouped[groupKey].map((t) => (
                      <TemplateCard key={t.id} t={t} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* ── Histórico recente ── */}
          {filteredVerif.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Histórico Recente
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="card divide-y divide-gray-100 overflow-hidden">
                {filteredVerif.slice(0, 15).map((v) => {
                  const cfg = VERIF_STATUS[v.status] || VERIF_STATUS.pendente;
                  const Icon = cfg.Icon;
                  return (
                    <Link
                      key={v.id}
                      to={`/verificacoes/${v.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {v.equipamento_foto ? (
                        <img src={v.equipamento_foto} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{v.equipamento_nome}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {v.usuario_nome} · {timeAgo(v.data_hora)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sem histórico ainda (mas com templates) */}
          {filteredVerif.length === 0 && templates.length > 0 && !statusFilter && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">Nenhuma verificação realizada ainda · Use os botões acima para começar</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
