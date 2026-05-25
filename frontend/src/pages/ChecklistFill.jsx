import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Loader2, ClipboardCheck, Package, Search, Globe, Tag,
  ChevronRight, MapPin, Hash, AlertCircle,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const TIPO_LABEL = {
  global:      { label: 'Global',          Icon: Globe,    color: 'bg-blue-100 text-blue-700'     },
  categoria:   { label: 'Por Categoria',   Icon: Tag,      color: 'bg-purple-100 text-purple-700' },
  equipamento: { label: 'Por Equipamento', Icon: Package,  color: 'bg-green-100 text-green-700'   },
};

export default function ChecklistFill() {
  const { id } = useParams();          // template id
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const res = await api.get(`/checklists/template-info/${id}`);
      const data = res.data;
      setTemplate(data);
      setEquipamentos(data.equipamentos || []);

      // Se tipo='equipamento' e só tem 1 item: redireciona automaticamente
      if (data.tipo === 'equipamento' && data.equipamentos?.length === 1) {
        navigate(`/equipamento/${data.equipamentos[0].id}/verificar`, { replace: true });
        return;
      }
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else toast.error('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(equip) {
    navigate(`/equipamento/${equip.id}/verificar`);
  }

  const filtered = equipamentos.filter((e) =>
    !search.trim() ||
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    (e.categoria && e.categoria.toLowerCase().includes(search.toLowerCase())) ||
    (e.codigo && e.codigo.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Não encontrado ───────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8 space-y-4">
        <div className="card p-8 text-center space-y-3">
          <AlertCircle size={52} className="mx-auto text-gray-300" />
          <h2 className="font-bold text-gray-700 text-lg">Formulário não encontrado</h2>
          <p className="text-sm text-gray-500">
            Este checklist pode ter sido desativado ou excluído pelo administrador.
          </p>
        </div>
      </div>
    );
  }

  const tipoCfg = TIPO_LABEL[template?.tipo] || TIPO_LABEL.global;
  const TipoIcon = tipoCfg.Icon;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ClipboardCheck size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">{template?.nome}</h1>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${tipoCfg.color}`}>
              <TipoIcon size={11} />
              {tipoCfg.label}
              {template?.tipo === 'categoria' && template.categoria && `: ${template.categoria}`}
            </span>
            {template?.descricao && (
              <p className="text-sm text-gray-500 mt-1.5">{template.descricao}</p>
            )}
          </div>
        </div>
      </div>

      {/* Instrução */}
      <div className="px-1">
        <h2 className="font-semibold text-gray-700 text-sm">
          Selecione o equipamento a ser verificado:
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Toque no equipamento para abrir o formulário de verificação
        </p>
      </div>

      {/* Search — só mostra se tiver muitos equipamentos */}
      {equipamentos.length > 6 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar equipamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Lista de equipamentos */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            {search ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento disponível'}
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {filtered.map((equip) => (
            <button
              key={equip.id}
              onClick={() => handleSelect(equip)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 active:bg-blue-100 transition-colors text-left"
            >
              {/* Foto */}
              {equip.foto ? (
                <img
                  src={equip.foto}
                  alt={equip.nome}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-gray-400" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm leading-tight">{equip.nome}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {equip.categoria && (
                    <span className="text-xs text-gray-500">{equip.categoria}</span>
                  )}
                  {equip.codigo && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Hash size={10} /> {equip.codigo}
                    </span>
                  )}
                  {equip.localizacao && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <MapPin size={10} /> {equip.localizacao}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <StatusBadge status={equip.status} />
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-2">
        {filtered.length} equipamento{filtered.length !== 1 ? 's' : ''} disponível{filtered.length !== 1 ? 'is' : ''}
      </p>
    </div>
  );
}
