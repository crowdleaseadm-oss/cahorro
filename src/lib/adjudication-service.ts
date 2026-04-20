import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateMemberAtomic } from './membership-service';
import { recordMemberTransaction } from './ledger-service';

/**
 * Moves a member to the validation review period (48hs).
 * Used by both Bids and Draws.
 */
export async function initiateWinnerValidation(
  db: any,
  userId: string,
  circleId: string,
  membershipId: string,
  method: 'Bid' | 'Draw' | 'Chronological',
  period?: string
) {
  const timestamp = new Date().toISOString();
  const updateData = {
    adjudicationStatus: 'WinnerPendingConfirmation',
    adjudicationMethod: method,
    adjudicationDate: period || timestamp,
    confirmationStartedAt: timestamp
  };

  await updateMemberAtomic(db, userId, circleId, membershipId, updateData);

  // Log the initiation
  const logRef = collection(db, 'users', userId, 'saving_circle_memberships', membershipId, 'logs');
  await addDoc(logRef, {
    type: 'WinnerPendingConfirmation',
    reason: `Iniciado periodo de validación administrativa por ${method === 'Bid' ? 'Licitación' : 'Sorteo'}.`,
    method,
    period,
    createdAt: timestamp
  });

  return true;
}

/**
 * Finalizes the adjudication process after the validation period.
 * Records the transaction in the Ledger and updates the final status.
 */
export async function finalizeAdjudication(
  db: any,
  userId: string,
  circleId: string,
  membershipId: string,
  adminUserId: string = 'admin'
) {
  const timestamp = new Date().toISOString();
  
  // 1. Get Circle Data for Ledger recording
  const circleSnap = await getDoc(doc(db, 'saving_circles', circleId));
  if (!circleSnap.exists()) throw new Error("Circle not found");
  const circle = circleSnap.data();

  // 2. Get Membership Data for Method info
  const membershipSnap = await getDoc(doc(db, 'users', userId, 'saving_circle_memberships', membershipId));
  if (!membershipSnap.exists()) throw new Error("Membership not found");
  const membership = membershipSnap.data();

  // 3. Update Status to Adjudicated
  const finalUpdate = {
    adjudicationStatus: 'Adjudicated',
    adjudicationConfirmedAt: timestamp
  };

  await updateMemberAtomic(db, userId, circleId, membershipId, finalUpdate);

  // 4. Record in Ledger (Capital Allocation)
  await recordMemberTransaction(
    db,
    userId,
    membershipId,
    'AdjudicationAllocation',
    circle.targetCapital,
    {
      description: `Adjudicación oficial confirmada (${membership.adjudicationMethod}). Asignación de capital.`,
      circleId: circleId,
      performedBy: adminUserId
    }
  );

  // 5. Final Log
  const logRef = collection(db, 'users', userId, 'saving_circle_memberships', membershipId, 'logs');
  await addDoc(logRef, {
    type: 'Adjudicated',
    reason: 'Adjudicación oficial firmada. Validación administrativa completada exitosamente.',
    createdAt: timestamp
  });

  return true;
}
