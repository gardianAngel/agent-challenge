import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useEffect } from 'react';
import type { 
  Protocol, 
  RiskAssessment, 
  Alert, 
  AgentStatus, 
  ChainStatus,
  WebSocketMessage 
} from '@shared/schema';

interface DashboardSummary {
  totalProtocols: number;
  totalTvl: number;
  avgRiskScore: number;
  activeAlerts: number;
  criticalAlerts: number;
  lastUpdated: Date;
}

interface UseRiskDataReturn {
  protocols: Protocol[] | undefined;
  riskAssessments: RiskAssessment[] | undefined;
  alerts: Alert[] | undefined;
  agentStatus: AgentStatus[] | undefined;
  chainStatus: ChainStatus[] | undefined;
  dashboardSummary: DashboardSummary | undefined;
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

export function useRiskData(): UseRiskDataReturn {
  const queryClient = useQueryClient();

  // Fetch protocols
  const {
    data: protocols,
    isLoading: protocolsLoading,
    error: protocolsError,
    refetch: refetchProtocols
  } = useQuery({
    queryKey: ['/api/protocols'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch risk assessments
  const {
    data: riskAssessments,
    isLoading: assessmentsLoading,
    error: assessmentsError,
    refetch: refetchAssessments
  } = useQuery({
    queryKey: ['/api/risk-assessments'],
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch alerts
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts?active=true');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch agent status
  const {
    data: agentStatus,
    isLoading: agentStatusLoading,
    error: agentStatusError,
    refetch: refetchAgentStatus
  } = useQuery({
    queryKey: ['/api/agents/status'],
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Fetch chain status
  const {
    data: chainStatus,
    isLoading: chainStatusLoading,
    error: chainStatusError,
    refetch: refetchChainStatus
  } = useQuery({
    queryKey: ['/api/chains/status'],
    staleTime: 30000,
    refetchInterval: 45000,
  });

  // Fetch dashboard summary
  const {
    data: dashboardSummary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // WebSocket integration for real-time updates
  const { lastMessage } = useWebSocket({
    onMessage: (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    },
    onConnect: () => {
      console.log('[useRiskData] WebSocket connected - refreshing data');
      refetchAll();
    }
  });

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'INITIAL_DATA':
        // Handle initial data load from WebSocket
        if (message.data.protocols) {
          queryClient.setQueryData(['/api/protocols'], message.data.protocols);
        }
        if (message.data.agentStatus) {
          queryClient.setQueryData(['/api/agents/status'], message.data.agentStatus);
        }
        if (message.data.chainStatus) {
          queryClient.setQueryData(['/api/chains/status'], message.data.chainStatus);
        }
        console.log('[useRiskData] Initial data received via WebSocket');
        break;

      case 'RISK_UPDATE':
        // Invalidate risk assessment queries
        queryClient.invalidateQueries({ queryKey: ['/api/risk-assessments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] });
        break;

      case 'PROTOCOL_UPDATE':
        // Invalidate protocol queries
        queryClient.invalidateQueries({ queryKey: ['/api/protocols'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] });
        break;

      case 'ALERT':
        // Invalidate alerts queries
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] });
        break;

      case 'AGENT_STATUS':
        // Update agent and chain status
        queryClient.invalidateQueries({ queryKey: ['/api/agents/status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/chains/status'] });
        
        // Update with fresh data if available
        if (message.data.agentStatus) {
          queryClient.setQueryData(['/api/agents/status'], message.data.agentStatus);
        }
        if (message.data.chainStatus) {
          queryClient.setQueryData(['/api/chains/status'], message.data.chainStatus);
        }
        break;

      case 'CHAIN_STATUS':
        queryClient.invalidateQueries({ queryKey: ['/api/chains/status'] });
        break;

      default:
        console.log('[useRiskData] Unknown WebSocket message type:', message.type);
    }
  };

  const refetchAll = () => {
    refetchProtocols();
    refetchAssessments();
    refetchAlerts();
    refetchAgentStatus();
    refetchChainStatus();
    refetchSummary();
  };

  // Handle data updates when WebSocket messages arrive
  useEffect(() => {
    if (lastMessage) {
      // Add a small delay to allow backend to process updates
      const timeoutId = setTimeout(() => {
        // Selectively refresh based on message type to avoid excessive requests
        switch (lastMessage.type) {
          case 'RISK_UPDATE':
            refetchAssessments();
            refetchSummary();
            break;
          case 'PROTOCOL_UPDATE':
            refetchProtocols();
            refetchSummary();
            break;
          case 'ALERT':
            refetchAlerts();
            refetchSummary();
            break;
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [lastMessage, refetchAssessments, refetchProtocols, refetchAlerts, refetchSummary]);

  const isLoading = protocolsLoading || 
                   assessmentsLoading || 
                   alertsLoading || 
                   agentStatusLoading || 
                   chainStatusLoading || 
                   summaryLoading;

  const error = protocolsError || 
                assessmentsError || 
                alertsError || 
                agentStatusError || 
                chainStatusError || 
                summaryError;

  return {
    protocols,
    riskAssessments,
    alerts,
    agentStatus,
    chainStatus,
    dashboardSummary,
    isLoading,
    error,
    refetch: refetchAll
  };
}

// Hook for fetching specific protocol risk data
export function useProtocolRisk(protocolId: number) {
  return useQuery({
    queryKey: ['/api/protocols', protocolId, 'risk'],
    queryFn: async () => {
      const response = await fetch(`/api/protocols/${protocolId}/risk`);
      if (!response.ok) {
        throw new Error('Failed to fetch protocol risk');
      }
      return response.json();
    },
    enabled: !!protocolId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// Hook for fetching risk trend data
export function useRiskTrend(protocolId: number, hours: number = 24) {
  return useQuery({
    queryKey: ['/api/protocols', protocolId, 'risk', 'trend', { hours }],
    queryFn: async () => {
      const response = await fetch(`/api/protocols/${protocolId}/risk/trend?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk trend');
      }
      return response.json();
    },
    enabled: !!protocolId,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
  });
}

// Hook for managing alerts (mark as read, dismiss)
export function useAlertActions() {
  const queryClient = useQueryClient();

  const markAsRead = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to mark alert as read');
      }
      
      // Invalidate alerts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      
      return response.json();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  };

  const dismissAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to dismiss alert');
      }
      
      // Invalidate alerts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      
      return response.json();
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  };

  return {
    markAsRead,
    dismissAlert
  };
}
