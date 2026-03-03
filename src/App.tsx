import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Bills from './pages/Bills';
import BillDetail from './pages/BillDetail';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center selection:bg-primary selection:text-primary-foreground w-full">
        <Toaster />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes directly connected to Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/bills/:id" element={<BillDetail />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
