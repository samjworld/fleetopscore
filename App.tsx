
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { socketManager } from './services/socket.ts';
import { API_BASE_URL } from './constants.ts';
import { usePermissions } from './hooks/usePermissions.ts';

const Dashboard = lazy(() => import('./pages/Dashboard.tsx').then(m => ({ default: m.Dashboard })));
const Vehicles = lazy(() => import('./pages/Vehicles.tsx').then(m => ({ default: m.Vehicles })));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail.tsx').then(m => ({ default: m.VehicleDetail })));
const LiveMap = lazy(() => import('./pages/LiveMap.tsx').then(m => ({ default: m.LiveMap })));
const Sites = lazy(() => import('./pages/Sites.tsx').then(m => ({ default: m.Sites })));
const Jobs = lazy(() => import('./pages/Jobs.tsx').then(m => ({ default: m.Jobs })));
const Shifts = lazy(() => import('./pages/Shifts.tsx').then(m => ({ default: m.Shifts })));
const Alerts = lazy(() => import('./pages/Alerts.tsx').then(m => ({ default: m.Alerts })));
const Maintenance = lazy(() => import('./pages/Maintenance.tsx').then(m => ({ default: m.Maintenance })));
const FuelPage = lazy(() => import('./pages/Fuel.tsx').then(m => ({ default: m.FuelPage })));
const Devices = lazy(() => import('./pages/Devices.tsx').then(m => ({ default: m.Devices })));
const Inventory = lazy(() => import('./pages/Inventory.tsx').then(m => ({ default: m.Inventory })));
const Users = lazy(() => import('./pages/Users.tsx').then(m => ({ default: m.Users })));
const AdminSettings = lazy(() => import('./pages/AdminSettings.tsx').then(m => ({ default: m.AdminSettings })));
const UserSettings = lazy(() => import('./pages/UserSettings.tsx').then(m => ({ default: m.UserSettings })));
const TeamChat = lazy(() => import('./pages/TeamChat.tsx').then(m => ({ default: m.TeamChat })));
const UtilizationLogs = lazy(() => import('./pages/UtilizationLogs.tsx').then(m => ({ default: m.UtilizationLogs })));
const UtilizationReport = lazy(() => import('./pages/UtilizationReport.tsx').then(m => ({ default: m.UtilizationReport })));
const Login = lazy(() => import('./pages/Login.tsx').then(m => ({ default: m.Login })));
const Landing = lazy(() => import('./pages/Landing.tsx').then(m => ({ default: m.Landing })));

import { Menu, Loader2, ShieldAlert, Truck } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ConfigProvider } from './contexts/ConfigContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ModuleId } from './types.ts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { 
      staleTime: 30000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchInterval: 60000,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) return false;
        return failureCount < 3;
      },
    },
  },
});

const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="relative">
      <div className="w-20 h-20 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-2xl shadow-blue-500/10 animate-pulse">
        <Truck size={36} />
      </div>
      <div className="absolute -inset-2 border-2 border-blue-600 border-t-transparent rounded-[2.5rem] animate-spin"></div>
    </div>
    <div className="mt-8 text-center">
        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] mb-2">Syncing Terminal</p>
    </div>
  </div>
);

const PrivateRoute = ({ children }: React.PropsWithChildren) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token') || '';
      socketManager.connect(token);
    } else {
      socketManager.disconnect();
    }
  }, [isAuthenticated]);

  if (isLoading) {
      return <PageLoader />;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const ModuleGuard = ({ moduleId, children }: React.PropsWithChildren<{ moduleId: ModuleId }>) => {
  const { canAccess, isAuthenticated } = usePermissions();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  const isAllowed = canAccess(moduleId);
  
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-3xl flex items-center justify-center text-red-600 mb-8 border-2 border-dashed border-red-200 dark:border-red-900/30">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">Unauthorized Access</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 max-w-sm font-medium leading-relaxed italic">
          Your organizational node lacks the required security clearance for the <span className="text-red-500 font-bold">#{moduleId.toUpperCase()}</span> module.
        </p>
        <Link to="/app" className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all">Return to Mission Control</Link>
      </div>
    );
  }
  return <>{children}</>;
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 z-40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 md:hidden"><Menu size={20} /></button>
            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest truncate leading-none mb-0">FleetOps Core</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{user?.name}</span>
                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{user?.role?.replace('_', ' ')}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-lg border-2 border-white dark:border-slate-800">
                {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto w-full">
                <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <ConfigProvider>
            <ThemeProvider>
                <Router>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                          <Route index element={<ModuleGuard moduleId="dashboard"><Dashboard /></ModuleGuard>} />
                          <Route path="map" element={<ModuleGuard moduleId="map"><LiveMap /></ModuleGuard>} />
                          <Route path="sites" element={<ModuleGuard moduleId="sites"><Sites /></ModuleGuard>} />
                          <Route path="chat" element={<ModuleGuard moduleId="team_chat"><TeamChat /></ModuleGuard>} />
                          <Route path="shifts" element={<ModuleGuard moduleId="shifts"><Shifts /></ModuleGuard>} />
                          <Route path="utilization-report" element={<ModuleGuard moduleId="utilization_report"><UtilizationReport /></ModuleGuard>} />
                          <Route path="jobs" element={<ModuleGuard moduleId="jobs"><Jobs /></ModuleGuard>} />
                          <Route path="vehicles" element={<ModuleGuard moduleId="vehicles"><Vehicles /></ModuleGuard>} />
                          <Route path="vehicles/:id" element={<ModuleGuard moduleId="vehicles"><VehicleDetail /></ModuleGuard>} />
                          <Route path="utilization" element={<ModuleGuard moduleId="utilization_logs"><UtilizationLogs /></ModuleGuard>} />
                          <Route path="alerts" element={<ModuleGuard moduleId="alerts"><Alerts /></ModuleGuard>} />
                          <Route path="maintenance" element={<ModuleGuard moduleId="maintenance"><Maintenance /></ModuleGuard>} />
                          <Route path="fuel" element={<ModuleGuard moduleId="fuel"><FuelPage /></ModuleGuard>} />
                          <Route path="devices" element={<ModuleGuard moduleId="devices"><Devices /></ModuleGuard>} />
                          <Route path="inventory" element={<ModuleGuard moduleId="inventory"><Inventory /></ModuleGuard>} />
                          <Route path="users" element={<ModuleGuard moduleId="users"><Users /></ModuleGuard>} />
                          <Route path="user-settings" element={<UserSettings />} />
                          <Route path="settings" element={<ModuleGuard moduleId="settings"><AdminSettings /></ModuleGuard>} />
                          <Route path="*" element={<Navigate to="/app" />} />
                      </Route>
                  </Routes>
                </Suspense>
                </Router>
                <Toaster position="top-right" />
            </ThemeProvider>
            </ConfigProvider>
        </AuthProvider>
        </QueryClientProvider>
    </ErrorBoundary>
  );
}
