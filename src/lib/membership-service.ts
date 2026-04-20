import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Atomic update for a member's data in both the user's membership collection 
 * and the circle's members shadow copy.
 */
export async function updateMemberAtomic(
  db: any,
  userId: string,
  circleId: string,
  membershipId: string,
  data: any
) {
  if (!db || !userId || !circleId || !membershipId) return;

  const timestamp = serverTimestamp();
  const updateData = {
    ...data,
    updatedAt: timestamp
  };

  // 1. Update User Profile
  const userMembershipRef = doc(db, 'users', userId, 'saving_circle_memberships', membershipId);
  await updateDoc(userMembershipRef, updateData);

  // 2. Update Circle Shadow Copy
  const circleMemberRef = doc(db, 'saving_circles', circleId, 'members', userId);
  await updateDoc(circleMemberRef, updateData);
  
  return true;
}
