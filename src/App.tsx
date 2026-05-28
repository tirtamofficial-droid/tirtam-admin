import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AuthProvider, useAuth } from './lib/auth';
import { useSupabaseData } from './hooks/useSupabaseData';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskModal from './components/TaskModal';
import FounderDashboard from './pages/FounderDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import DepartmentPage from './pages/DepartmentPage';
import ActivityFeed from './pages/ActivityFeed';
import SearchPage from './pages/SearchPage';
import WhatsAppPage from './pages/WhatsAppPage';
import LoginPage from './pages/LoginPage';
import ComingSoonPage from './pages/ComingSoonPage';
import FinancePage from './pages/FinancePage';

// Clean up old localStorage keys from previous versions
localStorage.removeItem('tirtam-store');

function AuthenticatedApp() {
  const { sidebarCollapsed, dataLoaded } = useStore();
  const { isAdmin } = useAuth();
  useSupabaseData();

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">T</span>
          </div>
          <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-zinc-400">Loading data from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      <TaskModal />
      <main
        className={`pt-[57px] pb-16 md:pb-0 min-h-screen transition-all duration-200
          pl-0 ${sidebarCollapsed ? 'md:pl-[60px]' : 'md:pl-[250px]'}`}
      >
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={isAdmin ? <FounderDashboard /> : <Navigate to="/employee" />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/tasks" element={<DepartmentPage />} />
            <Route path="/activity" element={<ActivityFeed />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/whatsapp" element={isAdmin ? <WhatsAppPage /> : <Navigate to="/employee" />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/product-kits" element={<ComingSoonPage title="Product Kits" description="Define what goes into each kit — products, crystals, packaging, and pricing. Plan your kit offerings here." icon="🎁" />} />
            <Route path="/crystals" element={<ComingSoonPage title="Crystals & Products" description="Decide what kinds of crystals and spiritual products Tirtam will carry. Catalog your collection here." icon="💎" />} />
            <Route path="/products" element={<ComingSoonPage title="Products" description="Full catalog of all products Tirtam will sell — prices, SKUs, descriptions, and availability." icon="🛍️" />} />
            <Route path="/vendors" element={<ComingSoonPage title="Vendors" description="Manage your vendor relationships, sourcing contacts, pricing negotiations, and procurement pipeline." icon="🤝" />} />
            <Route path="/weekly-focus" element={<ComingSoonPage title="Weekly Focus" description="Every Monday, surface the top 3 priorities per department. Keep the team aligned on what matters most this week." icon="📅" />} />
            <Route path="/decisions" element={<ComingSoonPage title="Decision Log" description="Record key company decisions — what was decided, who made the call, and why. Never lose context on important choices." icon="📝" />} />
            <Route path="/goals" element={<ComingSoonPage title="Goals & OKRs" description="Set company-level objectives and track progress against them. Tie tasks to goals for full execution visibility." icon="🎯" />} />
            <Route path="/resources" element={<ComingSoonPage title="Resource Vault" description="One place for contracts, brand kit, vendor documents, legal files, and important links. Everything your team needs, always findable." icon="📁" />} />
            <Route path="/department" element={<Navigate to="/tasks" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  const { profile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={profile ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={profile ? <AuthenticatedApp /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
