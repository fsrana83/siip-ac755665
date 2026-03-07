import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
          <h2 className="text-sm font-display font-semibold text-foreground">
            SmartIdeas — Individual Life Policy Premium Calculator
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user?.fullName}</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
              {user?.role}
            </span>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
