import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Eye,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Alert } from "@shared/schema";

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead?: (alertId: number) => void;
  onDismiss?: (alertId: number) => void;
  showActions?: boolean;
}

export function AlertCard({ 
  alert, 
  onMarkAsRead, 
  onDismiss, 
  showActions = false 
}: AlertCardProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-800';
      case 'high':
        return 'border-red-700';
      case 'medium':
        return 'border-yellow-700';
      case 'low':
        return 'border-blue-700';
      case 'info':
        return 'border-blue-700';
      default:
        return 'border-gray-700';
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-900/20';
      case 'high':
        return 'bg-red-900/15';
      case 'medium':
        return 'bg-yellow-900/20';
      case 'low':
        return 'bg-blue-900/20';
      case 'info':
        return 'bg-blue-900/20';
      default:
        return 'bg-gray-900/20';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return 'text-red-400';
    if (severity >= 60) return 'text-red-300';
    if (severity >= 40) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getTimeAgo = (timestamp: Date) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 hover:border-opacity-80 ${getAlertBorderColor(alert.type)} ${getAlertBgColor(alert.type)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon(alert.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-medium ${
                  alert.type === 'critical' ? 'text-red-400' :
                  alert.type === 'high' ? 'text-red-300' :
                  alert.type === 'medium' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {alert.title}
                </p>
                {!alert.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {alert.message}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getSeverityColor(alert.severity)} border-current`}
              >
                {alert.severity}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{getTimeAgo(alert.timestamp)}</span>
            </div>
            
            {showActions && (
              <div className="flex items-center space-x-1">
                {!alert.isRead && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(alert.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(alert.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Additional metadata */}
          {alert.metadata?.protocolName && (
            <div className="mt-2 text-xs text-slate-400">
              Protocol: <span className="text-white">{alert.metadata.protocolName}</span>
            </div>
          )}
          
          {alert.metadata?.actualValue !== undefined && alert.metadata?.threshold !== undefined && (
            <div className="mt-1 text-xs text-slate-400">
              Value: <span className="text-white">{alert.metadata.actualValue}</span> 
              {' '}(threshold: {alert.metadata.threshold})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
