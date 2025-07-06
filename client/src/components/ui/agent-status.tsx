import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import type { AgentStatus } from "@shared/schema";

interface AgentStatusProps {
  agents: AgentStatus[];
}

export function AgentStatus({ agents }: AgentStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'syncing':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'offline':
        return <XCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <XCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'syncing':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'offline':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'outline';
      case 'syncing':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'offline':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getLastHeartbeatText = (lastHeartbeat: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(lastHeartbeat).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  const getHealthPercentage = (status: string, lastHeartbeat: Date) => {
    if (status === 'offline' || status === 'error') return 0;
    if (status === 'syncing') return 60;
    
    const now = new Date();
    const diff = now.getTime() - new Date(lastHeartbeat).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 100;
    if (minutes < 5) return 80;
    if (minutes < 15) return 60;
    return 30;
  };

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No agent status available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agents.map((agent) => {
        const healthPercentage = getHealthPercentage(agent.status, agent.lastHeartbeat);
        
        return (
          <div
            key={agent.id}
            className={`agent-status ${agent.status === 'active' ? 'active' : ''} flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 transition-all duration-200 hover:border-slate-600`}
          >
            <div className="flex items-center space-x-3 flex-1">
              {getStatusIcon(agent.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{agent.agentName}</span>
                  <Badge 
                    variant={getStatusBadgeVariant(agent.status)}
                    className={`text-xs ${getStatusColor(agent.status)} border-current`}
                  >
                    {agent.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Last heartbeat: {getLastHeartbeatText(agent.lastHeartbeat)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {healthPercentage}%
                  </span>
                </div>
                <Progress 
                  value={healthPercentage} 
                  className="h-1 mt-1"
                  indicatorClassName={`${
                    healthPercentage > 80 ? 'bg-green-500' :
                    healthPercentage > 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Overall Health Summary */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">System Health</span>
          <div className="flex items-center space-x-2">
            <span className={`${
              agents.filter(a => a.status === 'active').length / agents.length > 0.8 ? 'text-green-400' :
              agents.filter(a => a.status === 'active').length / agents.length > 0.5 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {agents.filter(a => a.status === 'active').length}/{agents.length} Active
            </span>
            {agents.filter(a => a.status === 'active').length === agents.length && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        <Progress 
          value={(agents.filter(a => a.status === 'active').length / agents.length) * 100} 
          className="h-2 mt-2"
          indicatorClassName={`${
            agents.filter(a => a.status === 'active').length / agents.length > 0.8 ? 'bg-green-500' :
            agents.filter(a => a.status === 'active').length / agents.length > 0.5 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
        />
      </div>
    </div>
  );
}
