import { jsPDF } from "jspdf";
import { formatNumber } from "./utils";

const LOGO_URL = "/branding/logo-pdf.png";

/**
 * Carga una imagen desde una URL y la devuelve como base64
 */
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject("Failed to get canvas context");
      }
    };
    img.onerror = (e) => reject(e);
  });
};

/**
 * Genera un PDF del recibo de pago de una cuota.
 */
export const generateReceiptPDF = async (data: {
  userName: string;
  circleName: string;
  installmentNum: number;
  amount: number;
  date: string;
  paymentId?: string;
}) => {
  const doc = new jsPDF();
  
  // Header Text
  const headerTextY = 20;
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204);
  doc.text("CÍRCULO DE AHORRO S.A.S.", 105, headerTextY, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Av. Rivadavia 5920, CABA | CUIT: 30-71888999-1", 105, headerTextY + 7, { align: "center" });
  
  doc.setDrawColor(200);
  doc.line(20, headerTextY + 12, 190, headerTextY + 12);
  
  // Receipt Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text("RECIBO DE CUOTA", 105, headerTextY + 30, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Nro. Control: ${data.paymentId || Math.random().toString(36).substr(2, 9).toUpperCase()}`, 105, headerTextY + 38, { align: "center" });

  // Details
  const startY = headerTextY + 60;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de suscripción:", 20, startY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Suscriptor: ${data.userName}`, 30, startY + 10);
  doc.text(`Plan / Círculo: ${data.circleName}`, 30, startY + 20);
  doc.text(`Cuota Nro: ${data.installmentNum}`, 30, startY + 30);
  doc.text(`Fecha de Pago: ${data.date}`, 30, startY + 40);
  
  // Amount
  doc.setDrawColor(0, 102, 204);
  doc.setFillColor(245, 247, 250);
  doc.rect(20, startY + 60, 170, 20, "F");
  
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL ABONADO: $${formatNumber(data.amount)} USD`, 105, startY + 73, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerY = 280;
  doc.text("Este comprobante tiene validez legal como duplicado digital.", 105, footerY, { align: "center" });
  doc.text("Generado automáticamente por la plataforma Círculo de Ahorro.", 105, footerY + 5, { align: "center" });

  doc.save(`Recibo_Cuota_${data.installmentNum}_${data.circleName.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Genera un PDF del contrato de adhesión.
 */
export const generateContractPDF = async (data: {
  userName: string;
  userDni?: string;
  userEmail?: string;
  userPhone?: string;
  circleName: string;
  circleCapital: number;
  installments: number;
  date: string;
  circleId?: string;
}) => {
  const doc = new jsPDF();
  
  // Header
  const contractHeaderY = 20;
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRATO DE ADHESIÓN", 105, contractHeaderY, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Grupo: ${data.circleName} | ID: ${data.circleId || 'N/A'}`, 105, contractHeaderY + 8, { align: "center" });
  doc.text(`Fecha de firma: ${data.date}`, 105, contractHeaderY + 13, { align: "center" });
  
  doc.setDrawColor(200);
  doc.line(20, contractHeaderY + 20, 190, contractHeaderY + 20);

  // Intro Partes
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("PRIMERA: PARTES", 20, contractHeaderY + 30);
  
  doc.setFont("helvetica", "normal");
  const intro = `De una parte, CÍRCULO DE AHORRO S.A.S., CUIT 30-71888999-1, con domicilio en Av. Rivadavia 5920, Caballito, CABA, en adelante 'LA ADMINISTRADORA'. De otra parte, ${data.userName}${data.userDni ? `, DNI/CUIT ${data.userDni}` : ''}${data.userEmail ? `, con correo electrónico ${data.userEmail}` : ''}, en adelante 'EL SUSCRIPTOR'.`;
  
  const splitIntro = doc.splitTextToSize(intro, 170);
  doc.text(splitIntro, 20, contractHeaderY + 37);

  // Plan Details
  const planY = contractHeaderY + 37 + (splitIntro.length * 6) + 10;
  doc.setFont("helvetica", "bold");
  doc.text("SEGUNDA: OBJETO Y CONDICIONES DEL PLAN", 20, planY);
  
  doc.setFont("helvetica", "normal");
  const objeto = `El objeto es la adhesión de EL SUSCRIPTOR al grupo de ahorro denominado "${data.circleName}", con un capital suscrito de $${formatNumber(data.circleCapital)} USD, mediante el pago de ${data.installments} cuotas periódicas mensuales.`;
  
  const splitObjeto = doc.splitTextToSize(objeto, 170);
  doc.text(splitObjeto, 20, planY + 7);

  // Claúsulas Relevantes (Resumen para el PDF)
  const clausesY = planY + 7 + (splitObjeto.length * 6) + 10;
  doc.setFont("helvetica", "bold");
  doc.text("TERCERA: RESUMEN DE OBLIGACIONES", 20, clausesY);
  
  doc.setFont("helvetica", "normal");
  const resumen = `El suscriptor se obliga al pago puntual de las cuotas. La adjudicación se realizará por sorteo o licitación. El suscriptor adjudicado deberá constituir las garantías requeridas para la entrega del capital. Todos los valores se expresan en USD.`;
  
  const splitResumen = doc.splitTextToSize(resumen, 170);
  doc.text(splitResumen, 20, clausesY + 7);

  // Firma
  const firmaY = clausesY + 7 + (splitResumen.length * 6) + 40;
  doc.line(20, firmaY, 90, firmaY);
  doc.line(120, firmaY, 190, firmaY);
  
  doc.setFontSize(8);
  doc.text("Firma de LA ADMINISTRADORA", 55, firmaY + 5, { align: "center" });
  doc.text(`Firma de EL SUSCRIPTOR: ${data.userName}`, 155, firmaY + 5, { align: "center" });

  doc.save(`Contrato_Adhesion_${data.circleName.replace(/\s+/g, '_')}_${data.userName.replace(/\s+/g, '_')}.pdf`);
};

