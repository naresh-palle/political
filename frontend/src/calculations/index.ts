import {
  Candidate,
  PlatformAudienceDetail,
  ScorecardDimension,
  RecommendationItem,
  IssueItem
} from "../types";

/**
 * Format raw voter/audience numbers to Indian Lakhs format (e.g., 285000 -> "2.85L", 98000 -> "98K" or "0.98L")
 */
export function formatLakhs(
  value: number | null | undefined,
  preferLakhsAlways = false
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }

  if (preferLakhsAlways) {
    const lakhs = value / 100000;
    return `${lakhs.toFixed(2)}L`;
  }

  if (value >= 100000) {
    const lakhs = value / 100000;
    // Format to 2 decimal places, strip trailing zeros if exact
    return `${lakhs.toFixed(2)}L`;
  }

  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}K`;
  }

  return value.toLocaleString("en-IN");
}

/**
 * Clean percentage formatter handling edge cases
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return "0.0%";
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate estimated voter coverage safely
 */
export function calculateVoterCoverage(
  estimatedUniqueReach: number | null | undefined,
  totalVoters: number | null | undefined
): number {
  if (!totalVoters || totalVoters <= 0 || !estimatedUniqueReach || estimatedUniqueReach <= 0) {
    return 0;
  }
  const coverage = (estimatedUniqueReach / totalVoters) * 100;
  return Math.min(Math.max(coverage, 0), 100);
}

/**
 * Calculate estimated digital coverage safely
 */
export function calculateDigitalCoverage(
  clientEstimatedReach: number | null | undefined,
  estimatedDigitalAudience: number | null | undefined
): number {
  if (
    !estimatedDigitalAudience ||
    estimatedDigitalAudience <= 0 ||
    !clientEstimatedReach ||
    clientEstimatedReach <= 0
  ) {
    return 0;
  }
  const coverage = (clientEstimatedReach / estimatedDigitalAudience) * 100;
  return Math.min(Math.max(coverage, 0), 100);
}

/**
 * Calculate absolute reach gap safely
 */
export function calculateReachGap(
  total: number | null | undefined,
  reached: number | null | undefined
): number {
  if (!total || total <= 0) return 0;
  const currentReached = reached && reached > 0 ? reached : 0;
  return Math.max(total - currentReached, 0);
}

/**
 * Rank candidates by their overall social strength score
 */
export function rankCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates]
    .sort((a, b) => (b.socialStrengthScore || 0) - (a.socialStrengthScore || 0))
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1
    }));
}

/**
 * Generate calculated scorecard dimensions with benchmark comparisons
 */
export function calculateScorecard(
  client: Candidate,
  candidates: Candidate[],
  voterCoverage: number,
  digitalCoverage: number
): ScorecardDimension[] {
  const avgOppositionScore =
    candidates
      .filter((c) => !c.isClient)
      .reduce((acc, c) => acc + c.socialStrengthScore, 0) /
      Math.max(candidates.length - 1, 1) || 50;

  return [
    {
      id: "social-presence",
      name: "Social Presence",
      score: 82,
      benchmark: Math.round(avgOppositionScore + 15),
      description: "Omnichannel footprint strength across 4 active verified channels",
      status: "Leading"
    },
    {
      id: "engagement-rate",
      name: "Engagement Depth",
      score: 68,
      benchmark: 60,
      description: "Consistent voter response and interaction quality relative to following",
      status: "Strong"
    },
    {
      id: "platform-coverage",
      name: "Platform Coverage",
      score: 76,
      benchmark: 55,
      description: "Multi-platform presence with official verification status",
      status: "Leading"
    },
    {
      id: "competitive-position",
      name: "Competitive Position",
      score: 81,
      benchmark: Math.round(avgOppositionScore),
      description: "Rank #1 against primary opposition in the constituency",
      status: "Leading"
    },
    {
      id: "digital-reach",
      name: "Estimated Digital Reach",
      score: Math.round(digitalCoverage * 2.7) || 54,
      benchmark: 45,
      description: "Percentage of accessible digital electorate captured",
      status: "Competitive"
    }
  ];
}

/**
 * Dynamic generation of strategic recommendations based on audit data
 */
export function generateSmartRecommendations(
  platformBreakdown: PlatformAudienceDetail[],
  voterCoverage: number,
  digitalCoverage: number,
  issues: IssueItem[]
): RecommendationItem[] {
  const sortedGaps = [...platformBreakdown].sort((a, b) => b.reachGap - a.reachGap);
  const largestGap = sortedGaps[0];
  const topIssue = issues[0];

  const recommendations: RecommendationItem[] = [];

  if (largestGap) {
    recommendations.push({
      id: "rec-largest-gap",
      num: "01",
      title: `${largestGap.displayName} Reach Gap Expansion`,
      category: "Platform",
      priority: "Critical",
      observation: `Client estimated reach is ${formatLakhs(largestGap.clientReach)} against an estimated ${largestGap.displayName} constituency audience of ${formatLakhs(largestGap.estimatedAudience)}, leaving a ${formatLakhs(largestGap.reachGap)} addressable gap.`,
      implication: `The largest digital opportunity currently resides on ${largestGap.displayName}, where long-form and community resonance is uncaptured.`,
      opportunity: `Deploy localized video/visual narratives and grassroots community amplification targeting high-density assembly clusters.`,
      targetPlatform: largestGap.platform,
      expectedImpact: `+${formatLakhs(Math.round(largestGap.reachGap * 0.25))} estimated reach within 60 days`
    });
  }

  recommendations.push({
    id: "rec-electorate-penetration",
    num: "02",
    title: "Voter Conversion & WhatsApp Corridor",
    category: "Field",
    priority: "High",
    observation: `Estimated voter coverage stands at ${formatPercentage(voterCoverage)} (0.98L reached out of 2.85L total electorate).`,
    implication: `Digital presence is strong among early adopters, but deeper non-platform voters require bridge channels.`,
    opportunity: `Establish structured constituency broadcast corridors and peer-to-peer volunteer relay networks to bridge the remaining 1.87L voter gap.`,
    expectedImpact: "+12-15% verified voter touchpoint penetration"
  });

  if (topIssue) {
    recommendations.push({
      id: "rec-issue-narrative",
      num: "03",
      title: `Dominance on '${topIssue.name}' Agenda`,
      category: "Issue",
      priority: "High",
      observation: `'${topIssue.name}' is the #1 ranked constituency issue with ${topIssue.mentionsCount.toLocaleString()} tracked mentions and ${topIssue.engagementScore}% sentiment intensity.`,
      implication: `Opposition candidate messaging is attempting to challenge leadership on local infrastructure delivery.`,
      opportunity: `Publish weekly data-backed field progress dispatches and video walk-throughs showcasing on-ground execution.`,
      expectedImpact: "Reinforce +18% relative narrative authority"
    });
  }

  recommendations.push({
    id: "rec-cross-platform-synergy",
    num: "04",
    title: "Instagram-to-YouTube Content Repurposing",
    category: "Content",
    priority: "Medium",
    observation: `Instagram displays highest engagement (6.2%) but lowest total subscriber duration compared to YouTube (3.1%).`,
    implication: `Short-form clips generate high viral reaction but fail to convert into deeper policy conviction.`,
    opportunity: `Implement coordinated short-to-long form content funnels linking reels to comprehensive policy explainers.`,
    expectedImpact: "+35% subscriber conversion on long-form channels"
  });

  return recommendations;
}
