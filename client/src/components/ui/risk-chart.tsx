import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Protocol, RiskAssessment } from "@shared/schema";

interface RiskChartProps {
  protocols: Protocol[];
  riskAssessments: RiskAssessment[];
  height?: number;
}

interface ChartDataPoint {
  time: string;
  overallRisk: number;
  highRiskProtocols: number;
  protocols: { name: string; risk: number }[];
}

export function RiskChart({ protocols, riskAssessments, height = 300 }: RiskChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'overallRisk' | 'highRiskProtocols'>('overallRisk');

  // Generate mock historical data for demonstration
  useEffect(() => {
    const generateChartData = () => {
      const data: ChartDataPoint[] = [];
      const now = new Date();
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const timeString = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        // Calculate current average risk
        const avgRisk = riskAssessments.length > 0 
          ? riskAssessments.reduce((sum, a) => sum + a.overallRisk, 0) / riskAssessments.length 
          : 40;
        
        // Add some variation for historical data
        const variation = (Math.random() - 0.5) * 20;
        const overallRisk = Math.max(0, Math.min(100, avgRisk + variation));
        const highRiskProtocols = Math.floor(Math.random() * 5);
        
        const protocolRisks = protocols.slice(0, 3).map(p => {
          const assessment = riskAssessments.find(a => a.protocolId === p.id);
          const baseRisk = assessment?.overallRisk || 40;
          return {
            name: p.name,
            risk: Math.max(0, Math.min(100, baseRisk + (Math.random() - 0.5) * 15))
          };
        });
        
        data.push({
          time: timeString,
          overallRisk,
          highRiskProtocols,
          protocols: protocolRisks
        });
      }
      
      setChartData(data);
    };

    generateChartData();
    
    // Update data every 30 seconds
    const interval = setInterval(generateChartData, 30000);
    return () => clearInterval(interval);
  }, [protocols, riskAssessments]);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = '#0f172a'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const timeInterval = Math.max(1, Math.floor(chartData.length / 6));
    for (let i = 0; i < chartData.length; i += timeInterval) {
      const x = padding.left + (chartWidth / (chartData.length - 1)) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }

    // Draw overall risk line
    if (selectedMetric === 'overallRisk') {
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      chartData.forEach((point, index) => {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * index;
        const y = padding.top + chartHeight - (point.overallRisk / 100) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();

      // Draw area under curve
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      chartData.forEach((point, index) => {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * index;
        const y = padding.top + chartHeight - (point.overallRisk / 100) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Draw high risk protocols line
    if (selectedMetric === 'highRiskProtocols') {
      ctx.strokeStyle = '#ef4444'; // red-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const maxHighRisk = Math.max(...chartData.map(d => d.highRiskProtocols), 1);
      
      chartData.forEach((point, index) => {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * index;
        const y = padding.top + chartHeight - (point.highRiskProtocols / maxHighRisk) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }

    // Draw protocol lines
    const colors = ['#10b981', '#f59e0b', '#8b5cf6']; // green, yellow, purple
    chartData[0]?.protocols.forEach((_, protocolIndex) => {
      ctx.strokeStyle = colors[protocolIndex] || '#6b7280';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      chartData.forEach((point, index) => {
        const protocolRisk = point.protocols[protocolIndex]?.risk || 0;
        const x = padding.left + (chartWidth / (chartData.length - 1)) * index;
        const y = padding.top + chartHeight - (protocolRisk / 100) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw labels
    ctx.fillStyle = '#94a3b8'; // slate-500
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels (time)
    chartData.forEach((point, index) => {
      if (index % timeInterval === 0) {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * index;
        ctx.fillText(point.time, x, height - 10);
      }
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      const value = selectedMetric === 'overallRisk' 
        ? (100 - (i * 20)).toString()
        : (Math.max(...chartData.map(d => d.highRiskProtocols), 1) * (5 - i) / 5).toFixed(0);
      ctx.fillText(value, padding.left - 10, y + 4);
    }

  }, [chartData, selectedMetric]);

  const currentData = chartData[chartData.length - 1];
  const previousData = chartData[chartData.length - 2];
  
  const getTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <div className="w-full h-2 bg-slate-800 rounded shimmer mb-4"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedMetric('overallRisk')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedMetric === 'overallRisk'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Overall Risk
          </button>
          <button
            onClick={() => setSelectedMetric('highRiskProtocols')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedMetric === 'highRiskProtocols'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            High Risk Count
          </button>
        </div>

        {/* Current Values */}
        {currentData && previousData && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Current</div>
              <div className="flex items-center space-x-1">
                <span className="text-lg font-semibold text-white">
                  {selectedMetric === 'overallRisk' 
                    ? currentData.overallRisk.toFixed(1)
                    : currentData.highRiskProtocols
                  }
                </span>
                {getTrendIcon(getTrend(
                  selectedMetric === 'overallRisk' ? currentData.overallRisk : currentData.highRiskProtocols,
                  selectedMetric === 'overallRisk' ? previousData.overallRisk : previousData.highRiskProtocols
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full border border-slate-800 rounded-lg"
          style={{ height: `${height}px` }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded ${
            selectedMetric === 'overallRisk' ? 'bg-blue-500' : 'bg-red-500'
          }`}></div>
          <span className="text-slate-400">
            {selectedMetric === 'overallRisk' ? 'Average Risk Score' : 'High Risk Protocols'}
          </span>
        </div>
        
        {currentData?.protocols.map((protocol, index) => {
          const colors = ['bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
          return (
            <div key={protocol.name} className="flex items-center space-x-2">
              <div className={`w-3 h-1 ${colors[index] || 'bg-gray-500'}`}></div>
              <span className="text-slate-400 text-xs">{protocol.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
