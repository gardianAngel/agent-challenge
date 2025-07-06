import type { Protocol, RiskAssessment } from '@shared/schema';

/**
 * Risk level thresholds
 */
export const RISK_THRESHOLDS = {
  LOW: 40,
  MEDIUM: 60,
  HIGH: 80,
} as const;

/**
 * Risk level type
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Get risk level based on risk score
 */
export function getRiskLevel(riskScore: number): RiskLevel {
  if (riskScore >= RISK_THRESHOLDS.HIGH) return 'critical';
  if (riskScore >= RISK_THRESHOLDS.MEDIUM) return 'high';
  if (riskScore >= RISK_THRESHOLDS.LOW) return 'medium';
  return 'low';
}

/**
 * Get CSS color class for risk score
 */
export function getRiskColor(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  
  switch (level) {
    case 'critical':
      return 'text-risk-critical';
    case 'high':
      return 'text-risk-high';
    case 'medium':
      return 'text-risk-medium';
    case 'low':
      return 'text-risk-low';
    default:
      return 'text-slate-400';
  }
}

/**
 * Get background color class for risk level
 */
export function getRiskBgColor(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  
  switch (level) {
    case 'critical':
      return 'bg-risk-critical';
    case 'high':
      return 'bg-risk-high';
    case 'medium':
      return 'bg-risk-medium';
    case 'low':
      return 'bg-risk-low';
    default:
      return 'bg-slate-600';
  }
}

/**
 * Get border color class for risk level
 */
export function getRiskBorderColor(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  
  switch (level) {
    case 'critical':
      return 'border-risk-critical';
    case 'high':
      return 'border-risk-high';
    case 'medium':
      return 'border-risk-medium';
    case 'low':
      return 'border-risk-low';
    default:
      return 'border-slate-600';
  }
}

/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(1)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`;
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Calculate risk change trend
 */
export function getRiskTrend(currentRisk: number, previousRisk: number): 'improving' | 'stable' | 'deteriorating' {
  const change = currentRisk - previousRisk;
  
  if (change > 5) return 'deteriorating';
  if (change < -5) return 'improving';
  return 'stable';
}

/**
 * Get trend icon and color
 */
export function getTrendIndicator(trend: 'improving' | 'stable' | 'deteriorating'): {
  color: string;
  icon: string;
  label: string;
} {
  switch (trend) {
    case 'improving':
      return {
        color: 'text-green-400',
        icon: 'trending-down',
        label: 'Improving'
      };
    case 'deteriorating':
      return {
        color: 'text-red-400',
        icon: 'trending-up',
        label: 'Deteriorating'
      };
    default:
      return {
        color: 'text-slate-400',
        icon: 'minus',
        label: 'Stable'
      };
  }
}

/**
 * Calculate protocol health score based on multiple factors
 */
export function calculateHealthScore(protocol: Protocol, riskAssessment?: RiskAssessment): number {
  let score = 100;

  // Penalize high utilization
  if (protocol.utilization > 0.9) score -= 30;
  else if (protocol.utilization > 0.8) score -= 15;
  else if (protocol.utilization > 0.7) score -= 5;

  // Penalize low TVL (relative to category)
  if (protocol.tvl < 100000000) score -= 15; // < $100M
  else if (protocol.tvl < 500000000) score -= 8; // < $500M

  // Factor in overall risk score
  if (riskAssessment) {
    const riskPenalty = Math.max(0, (riskAssessment.overallRisk - 50) / 2);
    score -= riskPenalty;
  }

  // Bonus for positive factors
  const metadata = protocol.metadata || {};
  if (metadata.audited) score += 5;
  if (metadata.timelock) score += 5;
  if (protocol.utilization < 0.5) score += 10; // Good liquidity

  // Time-based penalty for stale data
  const daysSinceUpdate = (Date.now() - new Date(protocol.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 1) score -= Math.min(20, daysSinceUpdate * 5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get health status based on health score
 */
export function getHealthStatus(healthScore: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  label: string;
} {
  if (healthScore >= 90) {
    return { level: 'excellent', color: 'text-green-400', label: 'Excellent' };
  }
  if (healthScore >= 70) {
    return { level: 'good', color: 'text-green-300', label: 'Good' };
  }
  if (healthScore >= 50) {
    return { level: 'fair', color: 'text-yellow-400', label: 'Fair' };
  }
  return { level: 'poor', color: 'text-red-400', label: 'Poor' };
}

/**
 * Calculate portfolio risk distribution
 */
export function calculateRiskDistribution(riskAssessments: RiskAssessment[]): {
  smartContract: number;
  market: number;
  governance: number;
  technical: number;
  social: number;
  counterparty: number;
} {
  if (riskAssessments.length === 0) {
    return {
      smartContract: 0,
      market: 0,
      governance: 0,
      technical: 0,
      social: 0,
      counterparty: 0
    };
  }

  const totals = riskAssessments.reduce(
    (acc, assessment) => ({
      smartContract: acc.smartContract + assessment.smartContractRisk,
      market: acc.market + assessment.marketRisk,
      governance: acc.governance + assessment.governanceRisk,
      technical: acc.technical + assessment.technicalRisk,
      social: acc.social + assessment.socialRisk,
      counterparty: acc.counterparty + assessment.counterpartyRisk
    }),
    {
      smartContract: 0,
      market: 0,
      governance: 0,
      technical: 0,
      social: 0,
      counterparty: 0
    }
  );

  const count = riskAssessments.length;
  
  return {
    smartContract: Math.round(totals.smartContract / count),
    market: Math.round(totals.market / count),
    governance: Math.round(totals.governance / count),
    technical: Math.round(totals.technical / count),
    social: Math.round(totals.social / count),
    counterparty: Math.round(totals.counterparty / count)
  };
}

/**
 * Get severity label and color for alert severity
 */
export function getAlertSeverity(severity: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (severity >= 80) {
    return {
      label: 'Critical',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20'
    };
  }
  if (severity >= 60) {
    return {
      label: 'High',
      color: 'text-red-300',
      bgColor: 'bg-red-900/15'
    };
  }
  if (severity >= 40) {
    return {
      label: 'Medium',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20'
    };
  }
  return {
    label: 'Low',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  };
}

/**
 * Calculate Value at Risk (VaR) for a portfolio
 */
export function calculateVaR(
  prices: number[],
  confidence: number = 0.95
): {
  var: number;
  expectedShortfall: number;
} {
  if (prices.length < 2) {
    return { var: 0, expectedShortfall: 0 };
  }

  // Calculate returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  // Sort returns
  returns.sort((a, b) => a - b);

  // Calculate VaR
  const varIndex = Math.floor(returns.length * (1 - confidence));
  const var95 = Math.abs(returns[varIndex] || 0) * 100;

  // Calculate Expected Shortfall (average of returns below VaR)
  const tailReturns = returns.slice(0, varIndex);
  const expectedShortfall = tailReturns.length > 0
    ? Math.abs(tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length) * 100
    : 0;

  return {
    var: var95,
    expectedShortfall
  };
}

/**
 * Time-based utility functions
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

/**
 * Validate risk score range
 */
export function validateRiskScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate risk score color gradient
 */
export function getRiskGradientStyle(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  
  switch (level) {
    case 'critical':
      return 'linear-gradient(135deg, hsl(0, 65%, 51%) 0%, hsl(0, 65%, 41%) 100%)';
    case 'high':
      return 'linear-gradient(135deg, hsl(0, 84%, 60%) 0%, hsl(0, 84%, 50%) 100%)';
    case 'medium':
      return 'linear-gradient(135deg, hsl(45, 93%, 47%) 0%, hsl(45, 93%, 40%) 100%)';
    case 'low':
      return 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 69%, 31%) 100%)';
    default:
      return 'linear-gradient(135deg, hsl(215, 16%, 29%) 0%, hsl(215, 21%, 21%) 100%)';
  }
}
