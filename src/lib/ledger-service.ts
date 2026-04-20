import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

export type TransactionType = 
  | 'InstallmentPayment' 
  | 'AdvancePayment' 
  | 'PenaltyFee' 
  | 'SubscriptionFee' 
  | 'AdministrativeAdjustment'
  | 'PenaltyFundDistribution'
  | 'AdelantoCuotas'
  | 'AdjudicationAllocation';

interface TransactionMetadata {
  description: string;
  installmentNumber?: number;
  circleId: string;
  performedBy: string;
  [key: string]: any;
}

/**
 * Records a transaction for a specific membership and updates the membership's capitalPaid.
 */
export async function recordMemberTransaction(
  db: any,
  userId: string,
  membershipId: string,
  type: TransactionType,
  amount: number,
  metadata: TransactionMetadata
) {
  if (!db) return;

  const transactionsRef = collection(db, 'users', userId, 'saving_circle_memberships', membershipId, 'transactions');
  
  // 1. Add entry to the ledger
  const transactionDoc = await addDoc(transactionsRef, {
    type,
    amount, // Pure capital portion
    metadata,
    createdAt: serverTimestamp(),
  });

  // 2. Update the main membership document (capitalPaid)
  const membershipRef = doc(db, 'users', userId, 'saving_circle_memberships', membershipId);
  await updateDoc(membershipRef, {
    paidInstallmentsCount: increment(metadata.qty || 0),
    capitalPaid: increment(amount),
    outstandingCapitalBalance: type === 'AdjudicationAllocation' ? increment(0) : increment(-amount), // Adjudication allocation doesn't reduce debt, it marks the prize
    lastTransactionId: transactionDoc.id,
    updatedAt: serverTimestamp()
  });

  // 3. Update the shadow copy in the circle for admin visibility
  const circleMemberRef = doc(db, 'saving_circles', metadata.circleId, 'members', userId);
  await updateDoc(circleMemberRef, {
    paidInstallmentsCount: increment(metadata.qty || 0),
    capitalPaid: increment(amount),
    updatedAt: serverTimestamp()
  });

  return transactionDoc.id;
}

/**
 * Records a movement in the circle's penalty fund pool.
 */
export async function recordPenaltyFundMovement(
  db: any,
  circleId: string,
  amount: number,
  type: 'PenaltyIn' | 'DistributionOut',
  reason: string
) {
  if (!db) return;

  const ledgerRef = collection(db, 'saving_circles', circleId, 'penalty_ledger');
  
  await addDoc(ledgerRef, {
    amount,
    type,
    reason,
    createdAt: serverTimestamp()
  });

  const circleRef = doc(db, 'saving_circles', circleId);
  await updateDoc(circleRef, {
    accumulatedPenaltyFund: increment(amount)
  });
}
