import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { departments, departmentIcons } from '../utils/helpers';
import type { Department } from '../types';
import {
  LayoutDashboard,
  Users,
  Activity,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  ClipboardList,
  Clock,
  X,
  Home,
  Wallet,
  User,
  Menu,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    activeDepartment,
    setActiveDepartment,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useStore();
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const closeMobile = () => setMobileSidebarOpen(false);

  const isActive = (path: string) => location.pathname === path;
  const isDeptActive = (dept: Department) => location.pathname === '/tasks' && activeDepartment === dept;

  const businessModules = [
    { path: '/finance', label: 'Finance', icon: '💰' },
    { path: '/product-kits', label: 'Product Kits', icon: '🎁' },
    { path: '/crystals', label: 'Crystals & Products', icon: '💎' },
    { path: '/products', label: 'Products', icon: '🛍️' },
    { path: '/vendors', label: 'Vendors', icon: '🤝' },
    { path: '/weekly-focus', label: 'Weekly Focus', icon: '📅' },
    { path: '/decisions', label: 'Decision Log', icon: '📝' },
    { path: '/goals', label: 'Goals & OKRs', icon: '🎯' },
    { path: '/resources', label: 'Resource Vault', icon: '📁' },
  ];

  const navItem = (path: string, label: string, icon: React.ReactNode, onClick?: () => void) => (
    <button
      onClick={() => { onClick?.(); navigate(path); closeMobile(); }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
        ${isActive(path) && !activeDepartment
          ? 'bg-indigo-600 text-white'
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
        }
        ${sidebarCollapsed ? 'md:justify-center' : ''}`}
      title={sidebarCollapsed ? label : undefined}
    >
      {icon}
      <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>{label}</span>
    </button>
  );

  const sidebarContent = (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-zinc-100 z-40 flex flex-col transition-all duration-200
        ${sidebarCollapsed ? 'md:w-[60px]' : 'md:w-[250px]'}
        w-[270px]
        ${mobileSidebarOpen ? 'flex' : 'hidden md:flex'}`}
    >
      <div className={`flex items-center h-14 px-4 ${sidebarCollapsed ? 'md:justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">T</div>
          <span className={`font-semibold text-zinc-900 tracking-tight ${sidebarCollapsed ? 'md:hidden' : ''}`}>TIRTAM</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-semibold uppercase tracking-wider ${sidebarCollapsed ? 'md:hidden' : ''}`}>OS</span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400"
        >
          <X size={18} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:block p-1 rounded-md hover:bg-zinc-100 text-zinc-400 absolute -right-3 top-4 bg-white border border-zinc-200 shadow-sm z-50"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 px-3 mb-2 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Overview</p>

        {isAdmin && navItem('/', 'Founder Dashboard', <LayoutDashboard size={18} />, () => setActiveDepartment(null))}
        {navItem('/employee', 'My Dashboard', <Users size={18} />, () => setActiveDepartment(null))}
        {navItem('/activity', 'Activity Feed', <Activity size={18} />, () => setActiveDepartment(null))}
        {navItem('/search', 'Search Tasks', <Search size={18} />, () => setActiveDepartment(null))}
        {isAdmin && navItem('/whatsapp', 'WhatsApp Bot', <MessageSquare size={18} />, () => setActiveDepartment(null))}

        {/* Tasks Section */}
        <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 px-3 mt-5 mb-2 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Tasks</p>
        {sidebarCollapsed && <div className="hidden md:block border-t border-zinc-100 my-3" />}

        <button
          onClick={() => { setActiveDepartment(null); navigate('/tasks'); closeMobile(); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
            ${isActive('/tasks') && !activeDepartment
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
            }
            ${sidebarCollapsed ? 'md:justify-center' : ''}`}
          title={sidebarCollapsed ? 'All Tasks' : undefined}
        >
          <ClipboardList size={18} />
          <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>All Tasks</span>
        </button>

        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => { setActiveDepartment(dept); navigate('/tasks'); closeMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
              ${isDeptActive(dept)
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }
              ${sidebarCollapsed ? 'md:justify-center' : ''}`}
            title={sidebarCollapsed ? dept : undefined}
          >
            <span className="text-base flex-shrink-0">{departmentIcons[dept]}</span>
            <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>{dept}</span>
          </button>
        ))}

        {/* Departments Section (Business Modules) */}
        <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 px-3 mt-5 mb-2 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Departments</p>
        {sidebarCollapsed && <div className="hidden md:block border-t border-zinc-100 my-3" />}

        {businessModules.map((mod) => (
          <button
            key={mod.path}
            onClick={() => { setActiveDepartment(null); navigate(mod.path); closeMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
              ${isActive(mod.path)
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }
              ${sidebarCollapsed ? 'md:justify-center' : ''}`}
            title={sidebarCollapsed ? mod.label : undefined}
          >
            <span className="text-base flex-shrink-0">{mod.icon}</span>
            <span className={`flex-1 flex items-center justify-between ${sidebarCollapsed ? 'md:hidden' : ''}`}>
              <span className="truncate">{mod.label}</span>
              <span className="flex items-center gap-0.5 text-[9px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                <Clock size={8} /> Soon
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-zinc-100">
        <div className={`flex items-center gap-2.5 px-1 ${sidebarCollapsed ? 'md:flex-col md:px-0' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {profile?.avatar || 'U'}
          </div>
          <div className={`flex-1 min-w-0 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
            <p className="text-[12px] font-semibold text-zinc-900 truncate">{profile?.name || 'User'}</p>
            <p className="text-[10px] text-zinc-400 truncate">{profile?.role || 'Member'}</p>
          </div>
          <button
            onClick={() => { signOut(); navigate('/login'); closeMobile(); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  const bottomNavItems = [
    { label: 'Home', icon: Home, path: isAdmin ? '/' : '/employee', exact: true },
    { label: 'Tasks', icon: ClipboardList, path: '/tasks', exact: false },
    { label: 'Finance', icon: Wallet, path: '/finance', exact: false },
    { label: 'Me', icon: User, path: '/employee', exact: true },
  ];

  const isBottomNavActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={closeMobile}
        />
      )}
      {sidebarContent}

      {/* Mobile bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-zinc-100 flex items-center justify-around py-1 md:hidden">
        {bottomNavItems.map(({ label, icon: Icon, path, exact }) => {
          const active = isBottomNavActive(path, exact);
          return (
            <button
              key={path}
              onClick={() => { setActiveDepartment(null); navigate(path); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <Menu size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
