import { updateMemberAtomic } from '@/lib/membership-service';
import { recordPenaltyFundMovement } from '@/lib/ledger-service';
import { calculateMoraInterest, checkMemberArrears, getGroupClosingDay } from '@/lib/financial-logic';
import { collection, getDocs, addDoc } from 'firebase/firestore';

interface ClosingResult {
  processedMembers: number;
  penaltiesApplied: number;
  forcedWithdrawals: number;
  suretyBondsExecuted: number;
}

export async function processMonthEndClosing(db: any, circles: any[]): Promise<ClosingResult> {
  const result: ClosingResult = {
    processedMembers: 0,
    penaltiesApplied: 0,
    forcedWithdrawals: 0,
    suretyBondsExecuted: 0,
  };

  const now = new Date();
  const currentDay = now.getDate();

  for (const circle of circles) {
    if (circle.status !== 'Active') continue;

    const dueDay = circle.installmentDueDay || 5;
    const closingDay = getGroupClosingDay(dueDay);
    const moraRate = circle.moraRate || 3;

    // Solo procesar si hoy es día de cierre para este grupo (o después)
    if (currentDay < closingDay) continue;

    const membersSnap = await getDocs(collection(db, 'saving_circles', circle.id, 'members'));

    let accumulatedPenaltyForCircle = 0;

    for (const memberDoc of membersSnap.docs) {
      const member = memberDoc.data();
      if (member.status !== 'Active') continue;

      result.processedMembers++;

      // 1. Verificar Mora usando el motor centralizado
      const { isInArrears, debtAmount, monthsInArrears } = checkMemberArrears(member, circle);

      if (isInArrears) {
        // SOCIO EN MORA
        const isAdjudicated = member.adjudicationStatus === 'Adjudicated';
        
        // Perder conducta ideal
        if (member.perfectBehavior !== false) {
           await updateMemberAtomic(db, member.userId, circle.id, member.id, { perfectBehavior: false });
        }

        // 2. Aplicar Recargo Mora (Configurable + IVA)
        const penaltyFee = calculateMoraInterest(debtAmount, moraRate, true);
        accumulatedPenaltyForCircle += penaltyFee;
        
        // 3. Reglas de Baja/Seguro
        if (isAdjudicated && monthsInArrears >= 1) {
          // EJECUTAR SEGURO DE CAUCIÓN
          result.suretyBondsExecuted++;
          const logMsg = `[CIERRE] Ejecución de Seguro de Caución por mora en socio adjudicado (${monthsInArrears} mes/es). Deuda: ${debtAmount.toFixed(2)}`;
          await logActivity(db, member, logMsg, 'SuretyBondExecution');
        } else if (!isAdjudicated && monthsInArrears >= 2) {
          // BAJA FORZOSA
          result.forcedWithdrawals++;
          const updateData = { status: 'ForcedWithdrawal', lastClosureNote: 'Baja automática por 2 meses de mora.' };
          await updateMemberAtomic(db, member.userId, circle.id, member.id, updateData);
          await logActivity(db, member, updateData.lastClosureNote, 'ForcedWithdrawal');
        }

        result.penaltiesApplied++;
      }
    }

    // Actualizar el acumulado de penalidades en el círculo usando el Ledger
    if (accumulatedPenaltyForCircle > 0) {
      await recordPenaltyFundMovement(
        db,
        circle.id, 
        accumulatedPenaltyForCircle, 
        'PenaltyIn', 
        `Cierre Mensual - Mora acumulada de miembros (${now.toLocaleDateString()})`
      );
    }
  }

  return result;
}

async function logActivity(db: any, member: any, reason: string, type: string) {
  if (!member.userId || !member.id) return;
  const logRef = collection(db, 'users', member.userId, 'saving_circle_memberships', member.id, 'logs');
  await addDoc(logRef, {
    type,
    reason,
    createdAt: new Date().toISOString()
  });
}
