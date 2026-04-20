/**
 * Utilities for group closure and penalty fund distribution.
 */

export interface CompliantMember {
  id: string;
  userId: string;
  userName: string;
  adjudicationDate: string;
  adjudicationOrder?: number;
  perfectBehavior: boolean;
}

/**
 * Calculates the distribution of the penalty fund among compliant members.
 * Formula: Linear Weighting based on adjudication order.
 * Weight for member i = i
 * Total Sum S = N(N+1)/2
 * Share = Fund * (i / S)
 */
export function calculatePenaltyDistribution(fund: number, members: CompliantMember[]) {
  if (!members || members.length === 0 || fund <= 0) return [];

  // 1. Filter only compliant members (redundant check for safety)
  const compliant = members.filter(m => m.perfectBehavior);
  
  // 2. Sort by adjudication date (earliest first = index 1)
  // We want the person who won first to have index 1, and last to have index N.
  const sorted = [...compliant].sort((a, b) => {
    return new Date(a.adjudicationDate).getTime() - new Date(b.adjudicationDate).getTime();
  });

  const N = sorted.length;
  const totalWeight = (N * (N + 1)) / 2;

  return sorted.map((member, index) => {
    const orderIndex = index + 1; // 1-based index
    const weight = orderIndex;
    const share = (fund * weight) / totalWeight;
    
    return {
      ...member,
      distributionIndex: orderIndex,
      weight,
      percentage: (weight / totalWeight) * 100,
      shareAmount: share
    };
  });
}
