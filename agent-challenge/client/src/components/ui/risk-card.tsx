import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getRiskLevel, getRiskColor } from "@/lib/riskUtils";
import { AlertTriangle, TrendingUp, TrendingDown, Shield, CheckCircle } from "lucide-react";
import type { Protocol, RiskAssessment } from "@shared/schema";

interface RiskCardProps {
  protocol: Protocol;
  riskAssessment?: RiskAssessment;
}

export function RiskCard({ protocol, riskAssessment }: RiskCardProps) {
  const riskScore = riskAssessment?.overallRisk || 0;
  const riskLevel = getRiskLevel(riskScore);
  const riskColor = getRiskColor(riskScore);

  const getProtocolIcon = (category: string) => {
    switch (category) {
      case 'lending':
        return <Shield className="h-6 w-6 text-white" />;
      case 'dex':
        return <TrendingUp className="h-6 w-6 text-white" />;
      case 'yield':
        return <TrendingDown className="h-6 w-6 text-white" />;
      default:
        return <Shield className="h-6 w-6 text-white" />;
    }
  };

  const getIconColor = (category: string) => {
    switch (category) {
      case 'lending':
        return 'bg-green-600';
      case 'dex':
        return 'bg-blue-600';
      case 'yield':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRiskIndicators = () => {
    const indicators = [];
    
    if (protocol.utilization > 0.9) {
      indicators.push({
        icon: AlertTriangle,
        text: `High utilization (${(protocol.utilization * 100).toFixed(1)}%)`,
        color: 'text-red-400'
      });
    }
    
    if (protocol.metadata?.upgradesPending) {
      indicators.push({
        icon: AlertTriangle,
        text: 'Contract upgrade pending',
        color: 'text-yellow-400'
      });
    }
    
    if (protocol.metadata?.audited) {
      indicators.push({
        icon: CheckCircle,
        text: 'Recently audited',
        color: 'text-blue-400'
      });
    }
    
    if (protocol.metadata?.timelock) {
      indicators.push({
        icon: Shield,
        text: 'Timelock active',
        color: 'text-green-400'
      });
    }

    if (protocol.utilization < 0.5) {
      indicators.push({
        icon: CheckCircle,
        text: `Healthy liquidity (${(protocol.utilization * 100).toFixed(1)}%)`,
        color: 'text-green-400'
      });
    }
    
    return indicators;
  };

  const indicators = getRiskIndicators();

  return (
    <Card className="protocol-card bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(protocol.category)}`}>
              {getProtocolIcon(protocol.category)}
            </div>
            <div>
              <h4 className="font-medium text-white">{protocol.name}</h4>
              <p className="text-sm text-slate-400">
                TVL: {formatCurrency(protocol.tvl)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-slate-400">Risk Score</p>
              <p className={`text-lg font-bold ${riskColor}`}>
                {riskScore.toFixed(0)}
              </p>
            </div>
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  riskLevel === 'low' ? 'risk-gradient-low' :
                  riskLevel === 'medium' ? 'risk-gradient-medium' :
                  riskLevel === 'high' ? 'risk-gradient-high' :
                  'risk-gradient-critical'
                }`}
                style={{ width: `${Math.min(100, riskScore)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Risk Level Badge */}
        <div className="mt-3 mb-3">
          <Badge 
            variant="outline" 
            className={`${
              riskLevel === 'low' ? 'border-green-500 text-green-400' :
              riskLevel === 'medium' ? 'border-yellow-500 text-yellow-400' :
              riskLevel === 'high' ? 'border-red-500 text-red-400' :
              'border-red-600 text-red-300'
            } bg-transparent`}
          >
            {riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        {/* Risk Indicators */}
        {indicators.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {indicators.slice(0, 2).map((indicator, index) => {
              const IconComponent = indicator.icon;
              return (
                <span key={index} className={indicator.color}>
                  <IconComponent className="inline h-4 w-4 mr-1" />
                  {indicator.text}
                </span>
              );
            })}
          </div>
        )}

        {/* Risk Factors Progress */}
        {riskAssessment && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-slate-400 mb-2">Risk Breakdown</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Smart Contract:</span>
                <Progress 
                  value={riskAssessment.smartContractRisk} 
                  className="h-1 mt-1"
                  indicatorClassName={`${
                    riskAssessment.smartContractRisk > 70 ? 'bg-red-500' :
                    riskAssessment.smartContractRisk > 40 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                />
              </div>
              <div>
                <span className="text-slate-400">Market:</span>
                <Progress 
                  value={riskAssessment.marketRisk} 
                  className="h-1 mt-1"
                  indicatorClassName={`${
                    riskAssessment.marketRisk > 70 ? 'bg-red-500' :
                    riskAssessment.marketRisk > 40 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
