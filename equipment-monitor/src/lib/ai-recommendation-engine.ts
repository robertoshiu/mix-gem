import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';
import type {
  SpcMeasurement, SpcViolation, SpcParameter,
  AiRecommendation, AiRecommendationType, AiRecommendationSource,
  AiRecommendationEngineConfig, TrendDirection, ConfidenceSnapshot,
} from './mes-types';

interface TrendAnalysis {
  parameter: SpcParameter;
  slope: number;        // change per wafer in sigma units
  direction: TrendDirection;
  magnitude: number;    // 0-1 normalized severity
  rSquared: number;     // goodness of fit
}

interface AnalysisContext {
  measurements: SpcMeasurement[];
  violations: SpcViolation[];
  equipmentState: 'idle' | 'processing' | 'inhibited';
  waferNumber: number;
  activeFault: { type: string; parameter: SpcParameter } | null;
}

// Linear regression on parameter values
function computeTrend(
  measurements: SpcMeasurement[],
  parameter: SpcParameter,
): { slope: number; intercept: number; rSquared: number } {
  const n = measurements.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  const values = measurements.map((m) => m[parameter] as number);
  const xs = measurements.map((m) => m.waferNumber);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);
  const sumYY = values.reduce((sum, y) => sum + y * y, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: 0, rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const ssTot = sumYY - (sumY * sumY) / n;
  const ssRes = values.reduce((sum, y, i) => {
    const predicted = slope * xs[i] + intercept;
    return sum + (y - predicted) ** 2;
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

export function analyzeTrends(
  measurements: SpcMeasurement[],
  config: AiRecommendationEngineConfig,
): TrendAnalysis[] {
  if (measurements.length < config.minDataPoints) return [];

  const window = measurements.slice(-Math.min(15, measurements.length));

  return SPC_PARAM_KEYS.map((param) => {
    const { sigma } = SPC_PARAMETERS[param];
    const { slope, rSquared } = computeTrend(window, param);

    // Normalize slope to sigma units per wafer
    const slopeInSigma = slope / sigma;
    const absSlope = Math.abs(slopeInSigma);

    let direction: TrendDirection = 'stable';
    if (absSlope > config.driftThreshold) {
      direction = slopeInSigma > 0 ? 'degrading' : 'improving';
    }

    // Magnitude: 0-1 based on how severe the drift is (capped at 2σ)
    const magnitude = Math.min(1, absSlope / 2);

    return {
      parameter: param,
      slope: slopeInSigma,
      direction,
      magnitude,
      rSquared: Math.max(0, rSquared),
    };
  });
}

function mapViolationToRecommendation(
  violation: SpcViolation,
): { type: AiRecommendationType; source: AiRecommendationSource; title: string; description: string; baseConfidence: number } | null {
  const { parameter, rule, value, limit } = violation;
  const paramConfig = SPC_PARAMETERS[parameter];
  const paramLabel = paramConfig.label;
  const diff = Math.abs(value - limit).toFixed(2);

  switch (rule) {
    case 'rule_1':
      return {
        type: 'predictive-maintenance',
        source: 'spc-violation',
        title: `${paramLabel} excursion detected — ${parameter.toUpperCase()} ${value > limit ? 'exceeds UCL' : 'below LCL'}`,
        description: `Rule 1 violation: ${parameter.toUpperCase()} = ${value.toFixed(3)}${paramConfig.unit}, limit = ${limit.toFixed(3)}${paramConfig.unit} (Δ${diff}${paramConfig.unit}). Immediate equipment check recommended to prevent scrap.`,
        baseConfidence: 90,
      };
    case 'rule_2':
      return {
        type: 'production-optimization',
        source: 'spc-violation',
        title: `${paramLabel} drift trend detected on ${parameter.toUpperCase()}`,
        description: `Rule 2 violation: 7 consecutive measurements on same side of center line for ${parameter.toUpperCase()}. Process drift rate suggests recipe adjustment needed within 3 wafers.`,
        baseConfidence: 85,
      };
    case 'rule_5':
      return {
        type: 'quality',
        source: 'spc-violation',
        title: `${paramLabel} variance spike — ${parameter.toUpperCase()} approaching limit`,
        description: `Rule 5 violation: 2 of 3 consecutive measurements beyond ±2σ for ${parameter.toUpperCase()}. Variance increase of ${diff}${paramConfig.unit} indicates process instability.`,
        baseConfidence: 80,
      };
    default:
      return null;
  }
}

function mapTrendToRecommendation(
  trend: TrendAnalysis,
): { type: AiRecommendationType; source: AiRecommendationSource; title: string; description: string; baseConfidence: number } | null {
  const { parameter, direction, magnitude, slope } = trend;
  const paramConfig = SPC_PARAMETERS[parameter];
  const paramLabel = paramConfig.label;

  if (direction === 'stable' || magnitude < 0.15) return null;

  const isDegrading = direction === 'degrading';
  const slopeStr = Math.abs(slope).toFixed(3);

  // Map parameter-specific recommendations
  if (parameter === 'cd' || parameter === 'cdu') {
    return {
      type: 'quality',
      source: 'trend-drift',
      title: `${paramLabel} ${isDegrading ? 'degrading' : 'improving'} — ${parameter.toUpperCase()} trend detected`,
      description: `${paramLabel} is ${isDegrading ? 'drifting away from' : 'trending toward'} target at ${slopeStr}σ per wafer. ${isDegrading ? 'Compensation model recommends exposure dose adjustment.' : 'Process stabilization confirmed.'}`,
      baseConfidence: Math.round(70 + magnitude * 25),
    };
  }

  if (parameter === 'ovl_x' || parameter === 'ovl_y') {
    return {
      type: 'predictive-maintenance',
      source: 'trend-drift',
      title: `Overlay ${parameter === 'ovl_x' ? 'X' : 'Y'} ${isDegrading ? 'excursion' : 'recovery'} trend`,
      description: `Overlay ${parameter === 'ovl_x' ? 'X' : 'Y'} trending at ${slopeStr}σ per wafer. ${isDegrading ? 'Stage alignment calibration recommended within 5 wafers.' : 'Alignment drift correcting — monitor for stability.'}`,
      baseConfidence: Math.round(75 + magnitude * 20),
    };
  }

  if (parameter === 'ler') {
    return {
      type: 'energy',
      source: 'trend-drift',
      title: `LER ${isDegrading ? 'increase' : 'decrease'} detected — focus stability check`,
      description: `Line Edge Roughness trending at ${slopeStr}σ per wafer. ${isDegrading ? 'Focus degradation may indicate laser power fluctuation. Energy optimization can stabilize exposure.' : 'LER improving — current focus settings optimal.'}`,
      baseConfidence: Math.round(65 + magnitude * 30),
    };
  }

  return null;
}

function generateEquipmentRecommendations(
  ctx: AnalysisContext,
): Partial<AiRecommendation>[] {
  const recs: Partial<AiRecommendation>[] = [];

  if (ctx.equipmentState === 'inhibited') {
    recs.push({
      id: `ai-rec-inhibited-${Date.now()}`,
      type: 'scheduling',
      source: 'equipment-inhibited',
      title: 'Equipment inhibited — reschedule queued lots',
      description: `Equipment stopped due to SPC violation. ${ctx.waferNumber} wafers processed. Recommend rerouting pending lots to backup chamber to maintain throughput.`,
      confidence: 88,
      impact: 'Throughput loss: ~15 min | Reroute to LITHO-02',
      status: 'pending',
      createdAt: new Date(),
      confidenceHistory: [{ timestamp: new Date(), confidence: 88 }],
    });
  }

  if (ctx.activeFault) {
    const { type, parameter } = ctx.activeFault;
    const paramConfig = SPC_PARAMETERS[parameter];
    recs.push({
      id: `ai-rec-fault-${Date.now()}`,
      type: 'predictive-maintenance',
      source: 'spc-violation',
      title: `Active fault: ${type.replace(/_/g, ' ')} on ${parameter.toUpperCase()}`,
      description: `Fault injection detected: ${type.replace(/_/g, ' ')} affecting ${paramConfig.label}. Root cause analysis suggests ${type === 'sudden_shift' ? 'calibration offset' : type === 'gradual_drift' ? 'component wear' : 'environmental fluctuation'}.`,
      confidence: 92,
      impact: 'Immediate attention required | Check maintenance log',
      status: 'pending',
      createdAt: new Date(),
      relatedParameter: parameter,
      trendDirection: 'degrading',
      confidenceHistory: [{ timestamp: new Date(), confidence: 92 }],
    });
  }

  return recs;
}

function generateProcessOptimizationRecommendations(
  ctx: AnalysisContext,
): Partial<AiRecommendation>[] {
  const recs: Partial<AiRecommendation>[] = [];
  const processedCount = ctx.measurements.length;

  // Carbon reduction recommendation after significant processing
  if (processedCount > 10 && processedCount % 7 === 0) {
    recs.push({
      id: `ai-rec-carbon-${Date.now()}`,
      type: 'carbon-reduction',
      source: 'process-optimization',
      title: 'Batch complete — optimize energy for next cycle',
      description: `${processedCount} wafers processed. Energy profile shows 12% excess draw during exposure steps. Recommend scheduling next batch during solar peak (14:00-16:00) to reduce grid dependency.`,
      confidence: 78,
      impact: 'CO₂ reduction: 0.8t | Grid savings: $1,200/day',
      status: 'pending',
      createdAt: new Date(),
      confidenceHistory: [{ timestamp: new Date(), confidence: 78 }],
    });
  }

  // Production optimization when processing smoothly
  if (ctx.equipmentState === 'processing' && processedCount > 5 && processedCount % 5 === 0) {
    recs.push({
      id: `ai-rec-prod-${Date.now()}`,
      type: 'production-optimization',
      source: 'process-optimization',
      title: 'Throughput opportunity — batch next 3 lots',
      description: `Current lot processing smoothly with no violations for ${processedCount} wafers. Historical model suggests batching next 3 lots on same recipe reduces total queue time by 18%.`,
      confidence: 72,
      impact: 'Throughput: +18% | Queue reduction: 4 lots',
      status: 'pending',
      createdAt: new Date(),
      confidenceHistory: [{ timestamp: new Date(), confidence: 72 }],
    });
  }

  return recs;
}

export function shouldAnalyze(
  ctx: AnalysisContext,
  config: AiRecommendationEngineConfig,
  lastAnalysisTimestamp: number | null,
): boolean {
  if (ctx.measurements.length < config.minDataPoints) return false;
  if (lastAnalysisTimestamp) {
    const elapsed = Date.now() - lastAnalysisTimestamp;
    // At least 1 second between analyses
    if (elapsed < 1000) return false;
  }
  return true;
}

export function generateRecommendations(
  ctx: AnalysisContext,
  existingRecommendations: AiRecommendation[],
  config: AiRecommendationEngineConfig,
): AiRecommendation[] {
  const newRecs: AiRecommendation[] = [];
  const now = new Date();

  // 1. Analyze trends and generate recommendations
  const trends = analyzeTrends(ctx.measurements, config);
  for (const trend of trends) {
    const mapped = mapTrendToRecommendation(trend);
    if (!mapped) continue;

    // Check if we already have a pending recommendation for this parameter + type
    const dup = existingRecommendations.find(
      (r) => r.status === 'pending' && r.relatedParameter === trend.parameter && r.type === mapped.type
    );
    if (dup) {
      // Update confidence instead of creating duplicate
      continue;
    }

    const rec: AiRecommendation = {
      id: `ai-rec-trend-${trend.parameter}-${Date.now()}`,
      type: mapped.type,
      source: mapped.source,
      title: mapped.title,
      description: mapped.description,
      confidence: Math.min(99, mapped.baseConfidence),
      impact: `Trend magnitude: ${(trend.magnitude * 100).toFixed(0)}% | R² = ${trend.rSquared.toFixed(2)}`,
      status: 'pending',
      createdAt: now,
      relatedParameter: trend.parameter,
      trendDirection: trend.direction,
      confidenceHistory: [{ timestamp: now, confidence: Math.min(99, mapped.baseConfidence) }],
    };
    newRecs.push(rec);
  }

  // 2. Map violations to recommendations
  for (const violation of ctx.violations) {
    if (violation.acknowledged) continue;

    const mapped = mapViolationToRecommendation(violation);
    if (!mapped) continue;

    // Check for duplicate pending violation recommendations
    const dup = existingRecommendations.find(
      (r) => r.status === 'pending' && r.source === 'spc-violation' && r.relatedParameter === violation.parameter
    );
    if (dup) continue;

    const rec: AiRecommendation = {
      id: `ai-rec-viol-${violation.id}`,
      type: mapped.type,
      source: mapped.source,
      title: mapped.title,
      description: mapped.description,
      confidence: Math.min(99, mapped.baseConfidence),
      impact: `Wafer ${violation.waferNumber} | Rule ${violation.rule} | Value: ${violation.value.toFixed(3)}`,
      status: 'pending',
      createdAt: now,
      relatedParameter: violation.parameter,
      trendDirection: 'degrading',
      confidenceHistory: [{ timestamp: now, confidence: Math.min(99, mapped.baseConfidence) }],
    };
    newRecs.push(rec);
  }

  // 3. Equipment state recommendations
  const equipRecs = generateEquipmentRecommendations(ctx);
  for (const partial of equipRecs) {
    const dup = existingRecommendations.find(
      (r) => r.status === 'pending' && r.source === partial.source && r.type === partial.type
    );
    if (dup) continue;

    const rec: AiRecommendation = {
      id: partial.id || `ai-rec-equip-${Date.now()}`,
      type: partial.type!,
      source: partial.source!,
      title: partial.title!,
      description: partial.description!,
      confidence: partial.confidence as number,
      impact: partial.impact as string,
      status: 'pending',
      createdAt: now,
      relatedParameter: partial.relatedParameter,
      trendDirection: partial.trendDirection,
      confidenceHistory: partial.confidenceHistory as ConfidenceSnapshot[],
    };
    newRecs.push(rec);
  }

  // 4. Process optimization recommendations
  const optRecs = generateProcessOptimizationRecommendations(ctx);
  for (const partial of optRecs) {
    const dup = existingRecommendations.find(
      (r) => r.status === 'pending' && r.source === partial.source && r.title === partial.title
    );
    if (dup) continue;

    const rec: AiRecommendation = {
      id: partial.id || `ai-rec-opt-${Date.now()}`,
      type: partial.type!,
      source: partial.source!,
      title: partial.title!,
      description: partial.description!,
      confidence: partial.confidence as number,
      impact: partial.impact as string,
      status: 'pending',
      createdAt: now,
      confidenceHistory: partial.confidenceHistory as ConfidenceSnapshot[],
    };
    newRecs.push(rec);
  }

  // Limit to max recommendations
  const activeCount = existingRecommendations.filter((r) => r.status === 'pending').length;
  const slotsRemaining = Math.max(0, config.maxRecommendations - activeCount);

  return newRecs.slice(0, slotsRemaining);
}
