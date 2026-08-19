import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ClipboardList, BookOpen, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const menuItems = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/plans', icon: ClipboardList, label: 'Mis Planes' },
  { to: '/portal/journal', icon: BookOpen, label: 'Journal' },
  { to: '/portal/messages', icon: MessageSquare, label: 'Mensajes' },
  { to: '/portal/profile', icon: User, label: 'Perfil' },
];

export function PortalLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('veridia_patient_token');
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">Portal Paciente</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-2 hover:text-text hover:bg-white/5'}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="secondary" className="w-full" onClick={handleLogout} icon={<LogOut size={16} />}>
            Cerrar sesión
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
