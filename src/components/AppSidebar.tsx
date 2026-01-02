import { MessageSquare, Settings, LogOut, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/pacs', icon: Settings, label: 'PACS Configuration' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-foreground">MedChat</h1>
              <p className="text-xs text-muted-foreground">PACS System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive(item.to)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform duration-200",
              isActive(item.to) && "scale-110"
            )} />
            {!isCollapsed && (
              <span className="font-medium animate-fade-in">{item.label}</span>
            )}
            {isActive(item.to) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50",
          isCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
