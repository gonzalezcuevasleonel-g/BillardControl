import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  TableProperties,
  ShoppingCart,
  Package,
  Calculator,
  LogOut,
  Menu,
  X,
  Users,
  Circle,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tables', label: 'Mesas', icon: TableProperties },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart },
  { path: '/inventory', label: 'Inventario', icon: Package },
  { path: '/cash-register', label: 'Caja', icon: Calculator },

];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser, currentUserRoleId } = useApp();

  const getRoleLabel = (roleId: number | null) => {
    switch (roleId) {
      case 1:
        return 'Administrador';
      case 2:
        return 'Empleado';
      default:
        return 'Usuario';
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const AnimatedLogo = ({ size = "normal" }: { size?: "normal" | "small" }) => (
    <div className={`flex items-center gap-3 ${size === 'small' ? 'scale-75 origin-left' : ''}`}>
      <motion.div 
        whileHover={{ 
          scale: 1.1,
          rotate: [0, -10, 10, -5, 5, 0],
          x: [0, -5, 5, -2, 2, 0],
          y: [0, 5, -5, 2, -2, 0]
        }}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 300,
          damping: 10
        }}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 relative cursor-pointer group"
      >
        <Circle className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors" strokeWidth={2.5} />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-green-500/20 blur-md"
        />
      </motion.div>
      <div>
        <h1 className="text-xl font-bold text-white leading-none">
          Billar<span className="text-green-400">Control</span>
        </h1>
        <p className="text-[10px] text-zinc-500 mt-0.5">Sistema de Gestión</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 hidden lg:flex flex-col">
        {/* Logo */}
        <Link to="/dashboard" className="p-6 border-b border-zinc-800 block hover:opacity-80 transition-opacity">
          <AnimatedLogo />
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}

          {currentUserRoleId === 1 && (
            <Link to="/users">
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${location.pathname === '/users'
                    ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }
                `}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Usuarios</span>
              </motion.div>
            </Link>
          )}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser}</p>
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentUserRoleId === 1 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                    : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                }`}
              >
                <Shield className={`w-2.5 h-2.5 ${currentUserRoleId === 1 ? 'fill-purple-400/20' : ''}`} />
                {currentUserRoleId === 1 ? 'Administrador' : 'Empleado'}
              </motion.div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard">
            <AnimatedLogo size="small" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border-t border-zinc-800"
          >
            {/* Mobile User Profile */}
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <span className="text-white font-bold">{currentUser?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{currentUser}</p>
                  <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentUserRoleId === 1 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                      : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                  }`}>
                    <Shield className={`w-2.5 h-2.5 ${currentUserRoleId === 1 ? 'fill-purple-400/20' : ''}`} />
                    {currentUserRoleId === 1 ? 'Administrador' : 'Empleado'}
                  </div>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        ${isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-zinc-400 hover:bg-zinc-800'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              {currentUserRoleId === 1 && (
                <Link
                  to="/users"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      ${location.pathname === '/users'
                        ? 'bg-green-500/20 text-green-400'
                        : 'text-zinc-400 hover:bg-zinc-800'
                      }
                    `}
                  >
                    <Users className="w-5 h-5" />
                    <span>Usuarios</span>
                  </div>
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
