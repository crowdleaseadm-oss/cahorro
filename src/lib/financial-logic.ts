/**
 * Centralized Financial Logic for Círculo de Ahorro
 * Standard formulas for all calculations across the platform.
 */

export const IVA_RATE = 1.21;

export interface FinancialRates {
  administrativeFeeRate: number; // e.g. 10 for 10%
  subscriptionFeeRate: number;   // e.g. 3 for 3%
  lifeInsuranceRate: number;     // e.g. 0.09 for 0.09%
  moraRate: number;              // e.g. 3 for 3%
  bidCommissionRate: number;     // e.g. 3 for 3%
  adminVatApplied?: boolean;
  subscriptionVatApplied?: boolean;
  lifeInsuranceVatApplied?: boolean;
}

/**
 * Calculates the pure capital portion of an installment.
 */
export function calculatePureAlicuota(targetCapital: number, totalInstallments: number): number {
  if (!totalInstallments || totalInstallments <= 0) return 0;
  return targetCapital / totalInstallments;
}

/**
 * Calculates the monthly administrative fee.
 */
export function calculateAdminFee(alicuota: number, rate: number, applyVAT: boolean = true): number {
  const coefficient = rate / 100;
  const base = alicuota * coefficient;
  return applyVAT ? base * IVA_RATE : base;
}

/**
 * Calculates the monthly life insurance.
 * Calculated over the remaining pure capital balance.
 * Can be calculated by paid installments or by providing the balance directly.
 */
export function calculateLifeInsurance(targetCapital: number, alicuota: number, paidInstallmentsOrBalance: number, rate: number, applyVAT: boolean = false, isDirectBalance: boolean = false): number {
  const remainingCapital = isDirectBalance 
    ? paidInstallmentsOrBalance 
    : Math.max(0, targetCapital - (alicuota * paidInstallmentsOrBalance));
    
  const coefficient = rate / 100;
  const base = remainingCapital * coefficient;
  return applyVAT ? base * IVA_RATE : base;
}

/**
 * Simplified life insurance for average calculation (projections)
 * We assume the average balance is (Total + 0) / 2
 */
export function calculateAverageLifeInsurance(targetCapital: number, rate: number, applyVAT: boolean = false): number {
  const averageCapital = targetCapital / 2;
  const coefficient = rate / 100;
  const base = averageCapital * coefficient;
  return applyVAT ? base * IVA_RATE : base;
}

/**
 * Centralized Arrears Detection
 * Returns whether a member is in arrears and the debt amount.
 */
export function checkMemberArrears(member: any, circle: any) {
  if (!member || !circle) return { isInArrears: false, debtAmount: 0, monthsInArrears: 0 };
  
  const installmentValue = circle.installmentValue || 0;
  if (installmentValue <= 0) return { isInArrears: false, debtAmount: 0, monthsInArrears: 0 };

  const monthsElapsed = calculateMonthsElapsed(member.joiningDate);
  const expectedInstallments = Math.min(circle.totalInstallments, monthsElapsed);
  const expectedCapital = expectedInstallments * calculatePureAlicuota(circle.targetCapital, circle.totalInstallments);
  
  const capitalPaid = member.capitalPaid || 0;
  const debtAmount = expectedCapital - capitalPaid;

  return {
    isInArrears: debtAmount > 0.01, // Use small epsilon for float precision
    debtAmount: debtAmount > 0 ? debtAmount : 0,
    monthsInArrears: debtAmount > 0 ? Math.ceil(debtAmount / calculatePureAlicuota(circle.targetCapital, circle.totalInstallments)) : 0
  };
}

/**
 * Calculates months elapsed since a joining date (inclusive of current month)
 */
export function calculateMonthsElapsed(joiningDateStr: string) {
  if (!joiningDateStr) return 1;
  const joiningDate = new Date(joiningDateStr);
  const now = new Date();
  
  const yearsDiff = now.getFullYear() - joiningDate.getFullYear();
  const monthsDiff = now.getMonth() - joiningDate.getMonth();
  
  return (yearsDiff * 12) + monthsDiff + 1;
}

/**
 * Returns the closing day (10 or 25) based on the group's due day (5 or 20)
 */
export function getGroupClosingDay(dueDay: number) {
  return dueDay === 5 ? 10 : 25;
}

/**
 * Formats a currency value for display (replaces utils.ts duplication)
 */
export function formatCurrencyDRY(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates the subscription fee (total or monthly prorated).
 */
export function calculateSubscriptionFee(targetCapital: number, rate: number, applyVAT: boolean = true): number {
  const coefficient = rate / 100;
  const base = targetCapital * coefficient;
  return applyVAT ? base * IVA_RATE : base;
}

/**
 * Calculates the interest surcharge for late payment.
 */
export function calculateMoraInterest(installmentValue: number, rate: number = 3, applyVAT: boolean = true): number {
  const coefficient = rate / 100;
  const base = installmentValue * coefficient; // Calculated over the total installment value?
  // Usually calculated over the DEBT portion only, but here we use the installment as base.
  return applyVAT ? base * IVA_RATE : base;
}

/**
 * Componentes Recurrentes: Alícuota + (Adm + IVA) + Seguro de Vida
 */
export function calculateTotalRecurrentInstallment(circle: any, paidCount: number = 0): number {
  const alicuota = calculatePureAlicuota(circle.targetCapital, circle.totalInstallments);
  const admin = calculateAdminFee(alicuota, circle.administrativeFeeRate || 10, circle.adminVatApplied ?? true);
  const insurance = calculateLifeInsurance(
    circle.targetCapital, 
    alicuota, 
    paidCount, 
    circle.lifeInsuranceRate || 0.09, 
    circle.lifeInsuranceVatApplied ?? false
  );
  return alicuota + admin + insurance;
}

/**
 * Componentes No Recurrentes: (Suscripción + IVA) + (Mora + IVA)
 */
export function calculateNonRecurrentTotal(circle: any, isMora: boolean = false, debtAmount: number = 0): number {
  let total = 0;
  
  // Suscripción se cobra en el primer 20% del plan (esta lógica suele estar en el extractor)
  // Aquí devolvemos el total si se solicita.
  
  if (isMora && debtAmount > 0) {
    total += calculateMoraInterest(debtAmount, circle.moraRate || 3, true);
  }
  
  return total;
}
