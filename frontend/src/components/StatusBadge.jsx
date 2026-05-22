const config = {
  disponivel: { label: 'Disponível', cls: 'bg-green-100 text-green-800' },
  retirado: { label: 'Retirado', cls: 'bg-red-100 text-red-800' },
  manutencao: { label: 'Manutenção', cls: 'bg-amber-100 text-amber-800' },
};

export default function StatusBadge({ status }) {
  const { label, cls } = config[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
  return <span className={`badge ${cls}`}>{label}</span>;
}
