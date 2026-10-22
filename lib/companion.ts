import { PersonalBaseline, RiskScores, TelemetryData } from '@/types/aeris'
import { generateEdgeAiResponse } from './edge-ai-companion'

export function generateCompanionResponse(
  query: string,
  telemetry: TelemetryData,
  risks: RiskScores,
  baseline: PersonalBaseline
): string {
  const edgeResult = generateEdgeAiResponse(query, telemetry, risks, baseline)
  return edgeResult.response
}

export { generateEdgeAiResponse }

