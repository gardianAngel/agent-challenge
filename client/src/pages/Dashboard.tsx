import { useEffect, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { RiskCard } from "@/components/ui/risk-card";
import { AgentStatus } from "@/components/ui/agent-status";
import { AlertCard } from "@/components/ui/alert-card";
import { RiskChart } from "@/components/ui/risk-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRiskData } from "@/hooks/useRiskData";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatCurrency, getRiskLevel, getRiskColor } from "@/lib/riskUtils";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Activity,
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { 
    protocols, 
    riskAssessments, 
    alerts, 
    agentStatus, 
    chainStatus, 
    dashboardSummary,
    isLoading,
    refetch
  } = useRiskData();
  
  const { isConnected, connectionStatus } = useWebSocket();

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <div className="w-64 bg-slate-900 border-r border-slate-800">
          <div className="p-6">
            <div className="w-full h-8 bg-slate-800 rounded shimmer"></div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="w-full h-16 bg-slate-800 rounded shimmer"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="w-full h-96 bg-slate-900 rounded-xl border border-slate-800 shimmer"></div>
            </div>
            <div className="w-full h-96 bg-slate-900 rounded-xl border border-slate-800 shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Sidebar agentStatus={agentStatus} chainStatus={chainStatus} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Risk Dashboard</h2>
              <p className="text-slate-400">Real-time DeFi protocol risk monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-slate-400">{isConnected ? 'Live' : 'Disconnected'}</span>
              </div>
              
              {/* Last Updated */}
              <span className="text-sm text-slate-400">
                Updated {getTimeAgo(lastUpdated)}
              </span>
              
              {/* Refresh Button */}
              <button 
                onClick={handleRefresh}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Protocols Monitored</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardSummary?.totalProtocols || protocols?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Average Risk Score</p>
                    <p className={`text-2xl font-bold ${getRiskColor(dashboardSummary?.avgRiskScore || 0)}`}>
                      {dashboardSummary?.avgRiskScore?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Active Alerts</p>
                    <p className="text-2xl font-bold text-red-500">
                      {dashboardSummary?.activeAlerts || alerts?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">TVL Monitored</p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCurrency(dashboardSummary?.totalTvl || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Protocol Risk Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Protocol Risk Cards */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Protocol Risk Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {protocols?.map((protocol) => {
                      const assessment = riskAssessments?.find(a => a.protocolId === protocol.id);
                      return (
                        <RiskCard
                          key={protocol.id}
                          protocol={protocol}
                          riskAssessment={assessment}
                        />
                      );
                    })}
                    
                    {(!protocols || protocols.length === 0) && (
                      <div className="text-center py-8 text-slate-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No protocols being monitored</p>
                        <p className="text-sm">Add protocols to start risk monitoring</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Trend Chart */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Risk Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskChart 
                    protocols={protocols || []} 
                    riskAssessments={riskAssessments || []}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar Content */}
            <div className="space-y-6">
              {/* Agent Status */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Agent Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <AgentStatus agents={agentStatus || []} />
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts?.slice(0, 5).map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                    
                    {(!alerts || alerts.length === 0) && (
                      <div className="text-center py-8 text-slate-400">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active alerts</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factor Breakdown */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Risk Factor Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Smart Contract Risk', value: 25, color: 'bg-red-500' },
                      { name: 'Market Risk', value: 20, color: 'bg-yellow-500' },
                      { name: 'Governance Risk', value: 15, color: 'bg-blue-500' },
                      { name: 'Technical Risk', value: 15, color: 'bg-purple-500' },
                      { name: 'Social Risk', value: 15, color: 'bg-green-500' },
                      { name: 'Counterparty Risk', value: 10, color: 'bg-orange-500' }
                    ].map((factor) => (
                      <div key={factor.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">{factor.name}</span>
                          <span className="text-sm text-white">{factor.value}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${factor.color}`}
                            style={{ width: `${factor.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
