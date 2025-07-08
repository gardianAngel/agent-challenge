import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  TrendingUp, 
  Bell, 
  Activity, 
  Settings,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import type { AgentStatus, ChainStatus } from "@shared/schema";

interface SidebarProps {
  agentStatus?: AgentStatus[];
  chainStatus?: ChainStatus[];
}

export function Sidebar({ agentStatus = [], chainStatus = [] }: SidebarProps) {
  const [location] = useLocation();
  
  const activeAlerts = 3; // This would come from props in a real app

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-2 w-2 text-green-500" />;
      case 'syncing':
        return <Clock className="h-2 w-2 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-2 w-2 text-red-500" />;
      default:
        return <div className="h-2 w-2 bg-gray-500 rounded-full" />;
    }
  };

  const navigationItems = [
    {
      href: "/",
      icon: BarChart3,
      label: "Dashboard",
      active: location === "/" || location === "/dashboard"
    },
    {
      href: "/analytics",
      icon: TrendingUp,
      label: "Risk Analytics",
      active: location === "/analytics"
    },
    {
      href: "/alerts",
      icon: Bell,
      label: "Alerts",
      active: location === "/alerts",
      badge: activeAlerts > 0 ? activeAlerts : undefined
    },
    {
      href: "/protocols",
      icon: Shield,
      label: "Protocols",
      active: location === "/protocols"
    },
    {
      href: "/agents",
      icon: Activity,
      label: "Agents",
      active: location === "/agents"
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      active: location === "/settings"
    }
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col sidebar-gradient">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center glow-effect">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">DeFi Risk Oracle</h1>
            <p className="text-xs text-slate-400">Real-Time Risk Monitoring</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                item.active
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <IconComponent className={`h-5 w-5 ${
                item.active ? 'text-white' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Multi-Chain Status */}
      <div className="p-4 border-t border-slate-800">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Chain Status</h3>
        <div className="space-y-2">
          {chainStatus.length > 0 ? (
            chainStatus.map((chain) => (
              <div key={chain.id} className="flex items-center justify-between">
                <span className="text-sm text-white">{chain.chainName}</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(chain.status)}
                  <span className="text-xs text-slate-400 capitalize">
                    {chain.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Ethereum</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-2 w-2 text-green-500" />
                  <span className="text-xs text-slate-400">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Polygon</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-2 w-2 text-green-500" />
                  <span className="text-xs text-slate-400">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Arbitrum</span>
                <div className="flex items-center space-x-2">
                  <Clock className="h-2 w-2 text-yellow-500" />
                  <span className="text-xs text-slate-400">Syncing</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Agent Health Summary */}
      {agentStatus.length > 0 && (
        <div className="p-4 border-t border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Agent Health</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">System Status</span>
            <div className="flex items-center space-x-2">
              {agentStatus.filter(a => a.status === 'active').length === agentStatus.length ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-400">Healthy</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-yellow-400">
                    {agentStatus.filter(a => a.status === 'active').length}/{agentStatus.length}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Agent Status Progress */}
          <div className="mt-2">
            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  agentStatus.filter(a => a.status === 'active').length === agentStatus.length
                    ? 'bg-green-500'
                    : agentStatus.filter(a => a.status === 'active').length > agentStatus.length / 2
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ 
                  width: `${(agentStatus.filter(a => a.status === 'active').length / agentStatus.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
