import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ClipboardList, BookOpen, MessageSquare, User, Bell, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/features/notifications/useNotifications';

const menuItems = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/portal/plans', icon: ClipboardList, label: 'Mis Planes' },
  { to: '/portal/journal', icon: BookOpen, label: 'Journal' },
  { to: '/portal/messages', icon: MessageSquare, label: 'Mensajes' },
  { to: '/portal/profile', icon: User, label: 'Perfil' },
];

export function PortalLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    localStorage.removeItem('veridia_patient_token');
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-text p-1">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="text-lg font-bold text-text">Veridia</h2>
        <div className="relative">
          <Bell size={20} className="text-text-2" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-surface border-r border-border flex flex-col md:min-h-screen`}>
        <div className="p-4 border-b border-border hidden md:block">
          <h2 className="text-lg font-bold text-text">Portal Paciente</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-text-2 hover:text-text hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
              {item.to === '/portal/messages' && unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-danger rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="secondary" className="w-full" onClick={handleLogout} icon={<LogOut size={16} />}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
