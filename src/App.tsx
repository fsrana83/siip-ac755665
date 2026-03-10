import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Quotations from "@/pages/Quotations";
import Clients from "@/pages/Clients";
import Proposals from "@/pages/Proposals";
import Policies from "@/pages/Policies";
import Claims from "@/pages/Claims";
import Reinsurance from "@/pages/Reinsurance";
import CreditControl from "@/pages/CreditControl";
import Accounting from "@/pages/Accounting";
import VATReports from "@/pages/VATReports";
import Reports from "@/pages/Reports";
import Medical from "@/pages/Medical";
import Admin from "@/pages/Admin";
import Developer from "@/pages/Developer";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/reinsurance" element={<Reinsurance />} />
        <Route path="/credit-control" element={<CreditControl />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/vat" element={<VATReports />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/medical" element={<Medical />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ConfigProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </ConfigProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
