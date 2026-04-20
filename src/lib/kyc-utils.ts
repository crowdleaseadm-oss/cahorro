/**
 * Validates an Argentine CUIT/CUIL number.
 * Format: 11 digits (no dashes)
 */
export function isValidCUIT(cuit: string): boolean {
  if (!cuit || cuit.length !== 11) return false;
  if (!/^\d+$/.test(cuit)) return false;

  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cuit[i]) * factors[i];
  }

  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) checkDigit = 9;

  return parseInt(cuit[10]) === checkDigit;
}

export function formatCUIT(cuit: string): string {
  if (!cuit || cuit.length !== 11) return cuit;
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}

export const KYC_STATUS_LABELS: Record<string, string> = {
  not_started: 'Pendiente de Verificación',
  pending: 'En Revisión',
  verified: 'Identidad Verificada',
  rejected: 'Identidad Rechazada'
};

export const KYC_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  pending: 'bg-orange-100 text-orange-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

/**
 * Validates an Argentine CBU/CVU (22 digits).
 */
export function isValidCBU(cbu: string): boolean {
  if (!cbu || cbu.length !== 22 || !/^\d+$/.test(cbu)) return false;

  const validateDigit = (part: string, checkDigit: number) => {
    const factors = part.length === 7 ? [7, 1, 3, 9, 7, 1, 3] : [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
    let sum = 0;
    for (let i = 0; i < part.length; i++) {
      sum += parseInt(part[i]) * factors[i];
    }
    const calculated = (10 - (sum % 10)) % 10;
    return calculated === checkDigit;
  };

  const part1 = cbu.slice(0, 7);
  const check1 = parseInt(cbu[7]);
  const part2 = cbu.slice(8, 21);
  const check2 = parseInt(cbu[21]);

  return validateDigit(part1, check1) && validateDigit(part2, check2);
}

export function formatCBU(cbu: string): string {
  if (!cbu || cbu.length !== 22) return cbu;
  return `${cbu.slice(0, 8)} ${cbu.slice(8, 22)}`;
}

export const BANK_NAMES: Record<string, string> = {
  '007': 'Banco Galicia',
  '011': 'Banco Nación',
  '014': 'Banco Provincia',
  '015': 'ICBC',
  '016': 'Citibank',
  '017': 'BBVA',
  '020': 'Banco de la Provincia de Córdoba',
  '027': 'Banco Supervielle',
  '029': 'Banco Ciudad',
  '034': 'Banco Patagonia',
  '044': 'Banco Hipotecario',
  '045': 'Banco San Juan',
  '065': 'Banco Municipal',
  '072': 'Banco Santander',
  '083': 'Banco Chubut',
  '086': 'Banco de Santa Cruz',
  '191': 'Banco Credicoop',
  '259': 'Banco Itaú',
  '262': 'Banco Comafi',
  '285': 'Banco Macro',
  '299': 'Banco Comafi',
  '301': 'Banco de Corrientes',
  '305': 'Banco de Formosa',
  '309': 'Banco de La Pampa',
  '311': 'Banco de Chaco',
  '315': 'Banco de Tierra del Fuego',
  '319': 'Banco de Tucumán',
  '321': 'Banco de Santiago del Estero',
  '322': 'Banco de Salta',
  '340': 'Banco BICA',
  '384': 'Wilobank',
  '386': 'Banco de Neuquén',
  '389': 'Banco de Santa Fe',
  '411': 'Brubank',
  '415': 'Openbank',
  '000': 'CVU de Billetera Virtual'
};

export function getBankName(cbu: string): string {
  if (!cbu || cbu.length < 3) return 'Entidad Desconocida';
  const prefix = cbu.slice(0, 3);
  
  // Si comienza con 000, es probable que sea un CVU de billetera virtual no bancaria
  if (prefix === '000') return 'Virtual / Fintech';
  
  return BANK_NAMES[prefix] || 'Banco Privado / Otro';
}
