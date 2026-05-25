import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  QrCode,
  Package,
  Users,
  History,
  BarChart3,
  LogOut,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';

const navUser = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Início'       },
  { to: '/scanner',      icon: QrCode,          label: 'Escanear'     },
  { to: '/verificacoes', icon: ClipboardCheck,  label: 'Verificações' },
  { to: '/historico',    icon: History,         label: 'Histórico'    },
];

const navAdmin = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Início'       },
  { to: '/scanner',      icon: QrCode,          label: 'Escanear'     },
  { to: '/verificacoes', icon: ClipboardCheck,  label: 'Verificações' },
  { to: '/equipamentos', icon: Package,         label: 'Equipamentos' },
  { to: '/usuarios',     icon: Users,           label: 'Usuários'     },
  { to: '/historico',    icon: History,         label: 'Histórico'    },
  { to: '/relatorios',   icon: BarChart3,       label: 'Relatórios'   },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const nav = isAdmin ? navAdmin : navUser;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function isActive(to) {
    if (to === '/dashboard') return location.pathname === to;
    // checklist pages under /verificacoes
    if (to === '/verificacoes') {
      return location.pathname.startsWith('/verificacoes') || location.pathname.startsWith('/checklist');
    }
    return location.pathname.startsWith(to);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Package size={22} className="opacity-90" />
          <span className="font-bold text-base tracking-tight">Equipamentos IPC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80 hidden sm:block">{user?.nome}</span>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-blue-600 transition" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-4 gap-1 shrink-0">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
          <div className="mt-auto mx-2 px-3 py-2 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <p className="text-xs font-semibold text-blue-600 capitalize">{user?.tipo}</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-4">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30 shadow-lg">
        {nav.slice(0, 5).map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-blue-700' : 'text-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
