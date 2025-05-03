
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DataSources from "./pages/DataSources";
import Datasets from "./pages/Datasets";
import Charts from "./pages/Charts";
import DashboardBuilder from "./pages/DashboardBuilder";
import DashboardView from "./pages/DashboardView";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/dashboards/create" element={<DashboardBuilder />} />
              <Route path="/dashboards/edit/:id" element={<DashboardBuilder />} />
              <Route path="/dashboards/:id" element={<DashboardView />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
