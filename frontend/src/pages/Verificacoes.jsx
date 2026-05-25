import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ClipboardList, Settings, Loader2, Globe, Tag, Package,
  ChevronRight, Plus,
} from 'lucide-react';

const TIPO_CONFIG = {
  global:      { label: 'Global',      Icon: Globe,   color: 'bg-blue-100 text-blue-700'     },
  categoria:   { label: 'Categoria',   Icon: Tag,     color: 'bg-purple-100 text-purple-700' },
  equipamento: { label: 'Equipamento', Icon: Package, color: 'bg-green-100 text-green-700'   },
};

export default function Verificacoes() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/checklists/status');
      const data = res.data;
      setTemplates(data);

      // Se só existe 1 checklist, vai direto para ele
      if (data.length === 1) {
        navigate(`/checklist/fill/${data[0].id}`, { replace: true });
      }
    } catch {
      toast.error('Erro ao carregar checklists');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Checklists</h1>
          <p className="text-xs text-gray-500 mt-0.5">Selecione para iniciar uma verificação</p>
        </div>
        {isAdmin && (
          <Link to="/checklist/templates" className="btn-secondary text-sm py-2 px-3">
            <Settings size={15} /> Gerenciar
          </Link>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <ClipboardList size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhum checklist configurado</p>
          <p className="text-xs text-gray-400">
            {isAdmin
              ? 'Crie templates em "Gerenciar" para começar'
              : 'Aguarde o administrador configurar os checklists'}
          </p>
          {isAdmin && (
            <Link to="/checklist/templates/novo" className="btn-primary inline-flex text-sm mt-2">
              <Plus size={15} /> Criar checklist
            </Link>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {templates.map((t) => {
            const cfg    = TIPO_CONFIG[t.tipo] || TIPO_CONFIG.global;
            const CfgIcon = cfg.Icon;
            return (
              <Link
                key={t.id}
                to={`/checklist/fill/${t.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                {/* Ícone */}
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <ClipboardList size={22} className="text-blue-500" />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{t.nome}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                      <CfgIcon size={9} />
                      {cfg.label}
                      {t.tipo === 'categoria'   && t.categoria       && `: ${t.categoria}`}
                      {t.tipo === 'equipamento' && t.equipamento_nome && `: ${t.equipamento_nome}`}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.total_itens} {t.total_itens === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
