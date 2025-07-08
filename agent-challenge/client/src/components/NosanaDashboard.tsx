import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/ui/navigation';
import { Cpu, Zap, DollarSign, Clock, Users, Gauge } from 'lucide-react';
import { formatCurrency } from '@/lib/riskUtils';

interface NosanaNode {
  id: string;
  status: 'online' | 'offline' | 'busy';
  gpuModel: string;
  region: string;
  computeUnits: number;
  pricePerHour: number;
  uptime: number;
  jobsCompleted: number;
}

interface NosanaJob {
  id: string;
  type: 'risk_analysis' | 'sentiment_analysis' | 'market_prediction';
  status: 'pending' | 'running' | 'completed' | 'failed';
  nodeId: string;
  startTime: string;
  duration?: number;
  cost: number;
  result?: any;
}

interface NosanaMetrics {
  totalNodes: number;
  activeNodes: number;
  totalJobs: number;
  completedJobs: number;
  totalCostSaved: number;
  averageJobTime: number;
  networkHealthScore: number;
}

interface NosanaStatus {
  metrics: NosanaMetrics;
  nodes: NosanaNode[];
  recentJobs: NosanaJob[];
}

export function NosanaDashboard() {
  const [selectedJobType, setSelectedJobType] = useState<'risk_analysis' | 'sentiment_analysis' | 'market_prediction'>('risk_analysis');

  // Fetch Nosana network status
  const { 
    data: nosanaStatus, 
    isLoading, 
    error,
    refetch 
  } = useQuery<NosanaStatus>({
    queryKey: ['/api/nosana/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000,
  });

  // Submit a job to Nosana network
  const submitJob = async (type: string, data: any) => {
    try {
      const response = await fetch('/api/nosana/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Job submitted:', result);
        // Refresh status after submission
        setTimeout(() => refetch(), 1000);
      }
    } catch (error) {
      console.error('Error submitting job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getJobStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      running: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    return (
      <Badge className={`${colors[status as keyof typeof colors]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Nosana Network</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-8 bg-slate-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !nosanaStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Nosana Network</h2>
        </div>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-slate-400">Unable to connect to Nosana network</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, nodes, recentJobs } = nosanaStatus;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navigation />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Nosana Network</h2>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Decentralized GPU Compute
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${metrics.networkHealthScore > 80 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span className="text-sm text-slate-400">
            Network Health: {metrics.networkHealthScore.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Nodes</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.activeNodes}/{metrics.totalNodes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Jobs Completed</p>
                <p className="text-2xl font-bold text-white">{metrics.completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Cost Saved</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(metrics.totalCostSaved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Job Time</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.averageJobTime.toFixed(1)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Submission */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Submit AI Job</CardTitle>
          <CardDescription>
            Deploy AI risk analysis to the decentralized Nosana GPU network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            {(['risk_analysis', 'sentiment_analysis', 'market_prediction'] as const).map((type) => (
              <Button
                key={type}
                variant={selectedJobType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedJobType(type)}
                className={selectedJobType === type ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={() => submitJob(selectedJobType, { protocol: 'Aave V3', timestamp: Date.now() })}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Cpu className="mr-2 h-4 w-4" />
            Deploy to Nosana Network
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Nodes */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">GPU Nodes</CardTitle>
            <CardDescription>
              Decentralized compute nodes in the Nosana network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nodes.slice(0, 6).map((node) => (
              <div key={node.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>
                  <div>
                    <p className="text-sm font-medium text-white">{node.gpuModel}</p>
                    <p className="text-xs text-slate-400">{node.region}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Uptime</p>
                    <p className="text-sm text-white">{node.uptime.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Price/hr</p>
                    <p className="text-sm text-white">${node.pricePerHour.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Jobs</CardTitle>
            <CardDescription>
              AI jobs processed on the Nosana network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentJobs.slice(0, 6).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white">
                      {job.type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </p>
                    {getJobStatusBadge(job.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Node: {job.nodeId}
                  </p>
                  {job.duration && (
                    <p className="text-xs text-slate-400">
                      Duration: {(job.duration / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-white">${job.cost.toFixed(4)}</p>
                  {job.result?.costSavings && (
                    <p className="text-xs text-green-400">
                      Saved ${job.result.costSavings.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Cost Analysis</CardTitle>
          <CardDescription>
            Comparison with traditional cloud GPU services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Nosana Network</p>
              <p className="text-2xl font-bold text-green-400">
                ${(nodes.reduce((sum, node) => sum + node.pricePerHour, 0) / nodes.length).toFixed(2)}/hr
              </p>
              <p className="text-xs text-slate-400">Average GPU price</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Traditional Cloud</p>
              <p className="text-2xl font-bold text-red-400">
                ${((nodes.reduce((sum, node) => sum + node.pricePerHour, 0) / nodes.length) * 3).toFixed(2)}/hr
              </p>
              <p className="text-xs text-slate-400">AWS/GCP equivalent</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Savings</p>
              <p className="text-2xl font-bold text-blue-400">67%</p>
              <p className="text-xs text-slate-400">Cost reduction</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Network Efficiency</span>
              <span className="text-white">{metrics.networkHealthScore.toFixed(0)}%</span>
            </div>
            <Progress 
              value={metrics.networkHealthScore} 
              className="h-2 bg-slate-700"
            />
          </div>
        </CardContent>
      </Card>
          </div>
        </div>
      </div>
    </div>
  );
}