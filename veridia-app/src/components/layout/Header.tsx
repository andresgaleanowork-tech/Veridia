import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LogOut, Bell, Search, Menu, ChevronDown, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';

interface HeaderProps {
  mobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

export function Header({ mobileSidebarOpen, onToggleMobileSidebar }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  }, [navigate]);

  return (
      <header
        aria-label="Header"
        role="banner"
        className={`h-16 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-all duration-300 ml-0 md:ml-[var(--sidebar-width)]`}
      >
        {/* Left side - Mobile menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile menu button */}
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors"
            aria-label={mobileSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div role="search" className="flex items-center gap-3 flex-1 max-w-md md:max-w-lg">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                aria-label="Buscar pacientes, recetas..."
                placeholder="Buscar pacientes, recetas..."
                className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors" aria-label="Buscar">
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserMenuOpen(false);
              }}
              aria-label="Notificaciones"
              aria-expanded={notificationsOpen}
              className="relative p-2 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 z-20 w-80 bg-surface border border-border rounded-xl shadow-lg animate-slide-in">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text">Notificaciones</h3>
                  <button className="text-xs text-primary hover:underline">Ver todas</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 text-sm text-text-3">No hay notificaciones nuevas</div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
              }}
              aria-label="Menú de usuario"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-3 p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Avatar
                src={user?.avatar}
                fallback={user?.initials || user?.name?.slice(0, 2).toUpperCase() || 'U'}
                size="md"
              />
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-text">{user?.name}</div>
                <div className="text-[11px] text-text-3 capitalize">{user?.role}</div>
              </div>
              <ChevronDown size={16} className="text-text-3 hidden md:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-surface border border-border rounded-xl shadow-lg animate-slide-in">
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User size={16} />
                    Perfil
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings size={16} />
                    Configuración
                  </button>
                  <hr className="my-2 border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }