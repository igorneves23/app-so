import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, Users as UsersIcon, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const emptyForm = { nome: '', email: '', senha: '', tipo: 'usuario', ativo: true };

export default function Usuarios() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    try {
      const res = await api.get('/users', { params: search ? { search } : {} });
      setUsers(res.data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowPass(false);
    setModal('create');
  }

  function openEdit(u) {
    setForm({ nome: u.nome, email: u.email, senha: '', tipo: u.tipo, ativo: u.ativo });
    setEditId(u.id);
    setShowPass(false);
    setModal('edit');
  }

  async function handleSave() {
    if (!form.nome || !form.email) return toast.error('Nome e email são obrigatórios');
    if (modal === 'create' && form.senha.length < 6) return toast.error('Senha mínima de 6 caracteres');
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/users', form);
        toast.success('Usuário criado!');
      } else {
        const payload = { nome: form.nome, email: form.email, tipo: form.tipo, ativo: form.ativo };
        if (form.senha) payload.senha = form.senha;
        await api.put(`/users/${editId}`, payload);
        toast.success('Usuário atualizado!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/users/${id}`);
      toast.success('Usuário excluído');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir');
    }
  }

  async function toggleAtivo(u) {
    try {
      await api.put(`/users/${u.id}`, { ativo: !u.ativo });
      toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado');
      load();
    } catch {
      toast.error('Erro ao atualizar');
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-3">
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar usuário..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-sm">{u.nome.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 text-sm truncate">{u.nome}</p>
                  <span className={`badge text-xs ${u.tipo === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.tipo}
                  </span>
                  {!u.ativo && <span className="badge bg-red-100 text-red-600">inativo</span>}
                </div>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                  <Pencil size={15} />
                </button>
                {u.id !== me?.id && (
                  <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Novo Usuário' : 'Editar Usuário'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha {modal === 'edit' && <span className="text-gray-400 font-normal">(deixe em branco para manter)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder={modal === 'create' ? 'Mínimo 6 caracteres' : '••••••'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="usuario">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {modal === 'edit' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Usuário ativo</span>
              </label>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-600 mb-5">Tem certeza que deseja excluir este usuário?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
