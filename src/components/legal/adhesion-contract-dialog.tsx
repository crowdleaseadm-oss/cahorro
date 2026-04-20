'use client';

import React from 'react';
import { 
  FileSignature, 
  ShieldCheck, 
  Scale, 
  ChevronRight, 
  ScrollText,
  AlertCircle,
  FileText,
  CheckCircle2,
  Calendar,
  Download
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import { generateContractPDF } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

interface AdhesionContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  circleName: string;
  circle?: any;
  userProfile?: any;
  isSubmitting?: boolean;
  readOnly?: boolean;
  title?: string;
}

export function AdhesionContractDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  circleName,
  circle,
  userProfile,
  isSubmitting,
  readOnly = false,
  title = "Contrato de Adhesión"
}: AdhesionContractDialogProps) {
  const [accepted, setAccepted] = React.useState(readOnly);
  const [hasReadToBottom, setHasReadToBottom] = React.useState(readOnly);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || readOnly || hasReadToBottom) return;

    // Pequeño timeout para asegurar que el ref del scroll está listo
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setHasReadToBottom(true);
          }
        },
        { 
          root: scrollRef.current,
          threshold: 0.1 
        }
      );

      if (bottomRef.current) {
        observer.observe(bottomRef.current);
      }

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [open, readOnly, hasReadToBottom]);
  
  const formatDate = (date?: any) => {
    if (!date) return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
        {/* Header Section */}
        <DialogHeader className="p-6 pb-3 bg-primary text-primary-foreground relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Scale className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileSignature className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tight">{title}</DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/70 text-[11px] font-medium">
              {readOnly ? 'Vista de Documento' : `Grupo: ${circleName}`}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Legend / Warning */}
        {!readOnly && (
          <div className="bg-orange-50 border-b border-orange-100 p-3 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 text-center">
              Por favor, verifica que todos tus datos personales y los del plan sean correctos antes de continuar.
            </span>
          </div>
        )}

        {/* Content Section (Scrollable Area) */}
        <div ref={scrollRef} className="flex-1 p-6 md:p-8 overflow-y-auto bg-white custom-scrollbar selection:bg-primary selection:text-white">
          <div className="space-y-6 text-[13px] text-muted-foreground leading-relaxed antialiased">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="font-black text-[10px] uppercase tracking-widest text-primary">Version 2026.04.13</span>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60">
                <Calendar className="h-3 w-3" /> {formatDate()}
              </div>
            </div>

            <section className="space-y-6">
              {/* Summary Box */}
              <div className="p-4 bg-muted/30 rounded-2xl border border-dashed text-[11px] space-y-2">
                <h5 className="font-black text-primary uppercase tracking-wider">Resumen de Adhesión</h5>
                <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                  <div>
                    <span className="block opacity-60 uppercase text-[9px] font-bold">ID Grupo</span>
                    <span className="font-bold text-foreground font-mono">{circle?.id || 'PENDIENTE'}</span>
                  </div>
                  <div>
                    <span className="block opacity-60 uppercase text-[9px] font-bold">Capital Plan</span>
                    <span className="font-bold text-foreground">{formatCurrency(circle?.targetCapital || 0)}</span>
                  </div>
                  <div>
                    <span className="block opacity-60 uppercase text-[9px] font-bold">Plazo</span>
                    <span className="font-bold text-foreground">{circle?.totalInstallments || 0} Meses</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2 italic underline decoration-primary/30">
                  <span className="text-primary NOT-ITALIC">COMPONENTES DE CUOTAS:</span> CÓMO SE CALCULAN
                </h4>
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border text-[11px] leading-snug">
                  <div>
                    <p className="font-black text-primary uppercase mb-1 drop-shadow-sm">A) CONCEPTOS ORDINARIOS</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><b>ALÍCUOTA PURA:</b> Representa el capital neto a ahorrar. Se calcula como el CAPITAL TOTAL dividido por la CANTIDAD DE CUOTAS del plan.</li>
                      <li><b>GASTOS ADMINISTRATIVOS:</b> Corresponde al {circle?.administrativeFeeRate || 10}% (+ IVA) calculado sobre el valor de la ALÍCUOTA PURA de cada mes.</li>
                      <li><b>SEGURO DE VIDA:</b> Tasa del {formatNumber(circle?.lifeInsuranceRate || 0.09)}% calculada sobre el SALDO DE CAPITAL PURO que resta pagar al momento de la liquidación de la cuota.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-black text-primary uppercase mb-1 drop-shadow-sm">B) CONCEPTOS EXTRAORDINARIOS</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><b>DERECHO DE SUSCRIPCIÓN:</b> Equivale al {circle?.subscriptionFeeRate || 3}% (+ IVA) del CAPITAL SUSCRIPTO. Este monto se prorratea y cobra exclusivamente durante el PRIMER 20% del PLAZO del plan.</li>
                      <li><b>INTERÉS POR MORA:</b> En caso de incumplimiento, se aplicará un recargo del {circle?.moraRate || 3}% (+ IVA) calculado sobre el valor de la cuota incumplida.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">POSIBLES DEDUCCIONES</span> DEL CAPITAL ADJUDICADO
                </h4>
                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 text-[11px] leading-snug">
                  <p className="mb-2">Al momento de la adjudicación, LA ADMINISTRADORA podrá deducir del capital a entregar:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li><b>SALDO DE DERECHO DE SUSCRIPCIÓN:</b> En caso de adjudicación temprana (antes del 20% del plazo), se deducirá el remanente no pagado del derecho de suscripción (+ IVA).</li>
                    <li><b>COMISIÓN POR LICITACIÓN PLUS:</b> Si el suscriptor resultó ganador mediante esta modalidad, se deducirá la comisión pactada del {circle?.bidCommissionRate || 3}% (+ IVA).</li>
                    <li><b>PENALIZACIONES:</b> Cualquier cargo por incumplimientos previos o infracciones a las normas de conducta del grupo.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">PRIMERA:</span> PARTES
                </h4>
                <p>
                  De una parte, <b>CÍRCULO DE AHORRO S.A.S.</b>, CUIT 30-71888999-1, con domicilio en Av. Rivadavia 5920, Caballito, CABA, en adelante 'LA ADMINISTRADORA'. De otra parte, <b>{userProfile?.displayName || 'EL SUSCRIPTOR'}</b>, 
                  {userProfile?.dni ? ` DNI/CUIT ${userProfile.dni},` : ''} 
                  {userProfile?.email ? ` con correo electrónico ${userProfile.email},` : ''} 
                  {userProfile?.phoneNumber ? ` teléfono ${userProfile.phoneNumber},` : ''} 
                  en adelante 'EL SUSCRIPTOR'. EL SUSCRIPTOR declara bajo juramento que toda la información y datos personales proporcionados en el formulario de registro y/o verificación son veraces, exactos y completos, asumiendo total responsabilidad por su falsedad u omisión, y deslindando a LA ADMINISTRADORA de cualquier responsabilidad que pudiera surgir a raíz de ello. Ambas partes celebran el presente Contrato de Adhesión a un Sistema de Ahorro Colectivo.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">SEGUNDA:</span> OBJETO
                </h4>
                <p>
                  El objeto es la adhesión de EL SUSCRIPTOR al grupo de ahorro denominado <b>"{circle?.name || circleName}"</b>, identificado internamente con el código de grupo <b>#{circle?.id || 'PENDIENTE'}</b>, administrado por LA ADMINISTRADORA, con el fin de obtener una suma de dinero equivalente al 'Valor Móvil' del capital suscrito de <b>{formatCurrency(circle?.targetCapital || 0)}</b>, mediante el pago de <b>{circle?.totalInstallments || 0} cuotas</b> periódicas y la adjudicación por sorteo o licitación.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">TERCERA:</span> FUNCIONAMIENTO DEL SISTEMA
                </h4>
                <p>
                  EL SUSCRIPTOR se integra a un grupo con un número determinado de miembros, un plazo y un capital definidos. Para confirmar su adhesión, EL SUSCRIPTOR abonará la primera cuota al momento de unirse. El grupo se considerará 'Activo' una vez que el último miembro se haya unido y abonado su primera cuota. A partir de la fecha de activación del grupo, la segunda cuota se generará con vencimiento el día 5 o 20 del mes siguiente o subsiguiente respectivamente, contando con 30 días de gracia desde la activación del grupo, y las cuotas subsiguientes vencerán en la misma fecha de cada mes, con actos de adjudicación al quinto día del vencimiento de cuota. Mensualmente, abonará una cuota compuesta por los conceptos ORDINARIOS y EXTRAORDINARIOS detallados en la cláusula de componentes de cuotas. EL SUSCRIPTOR declara bajo juramento gozar de buena salud, y que tiene pleno conocimiento de que el seguro de vida contratado en forma colectiva por LA ADMINISTRADORA no cubre siniestros ocurridos a consecuencia de enfermedades preexistentes a la fecha de suscripción del presente contrato.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">CUARTA:</span> ACTO DE ADJUDICACIÓN
                </h4>
                <p>
                  Mensualmente se realizan dos adjudicaciones: una por sorteo y otra por licitación. En la licitación, que se realiza como una subasta, la oferta mínima es de una (1) cuota pura y la máxima es la totalidad de las cuotas puras futuras pendientes de pago. Existen dos modalidades de licitación: a) Licitación Común: EL SUSCRIPTOR oferta integrar capital de su propio patrimonio. b) Licitación Plus: EL SUSCRIPTOR oferta un monto que, en caso de resultar ganador, será retenido del capital a adjudicar, aplicándose una comisión de retención del 3% (+IVA) sobre el monto ofertado. En ambas modalidades, resultará ganador el suscriptor que haya realizado la oferta más alta al finalizar el período de la subasta.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">QUINTA:</span> DERECHOS Y OBLIGACIONES DE LA ADMINISTRADORA
                </h4>
                <p>
                  LA ADMINISTRADORA se obliga a: a) Gestionar los fondos de los grupos de manera diligente y transparente. b) Realizar mensualmente los actos de adjudicación. c) Entregar los capitales a los suscriptores adjudicados en los plazos estipulados, previa constitución de las garantías correspondientes.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">SEXTA:</span> DERECHOS Y OBLIGACIONES DEL SUSCRIPTOR
                </h4>
                <p>
                  EL SUSCRIPTOR se obliga a: a) Pagar puntualmente las cuotas mensuales. b) En caso de ser adjudicado, constituir las garantías requeridas por LA ADMINISTRADORA y continuar pagando las cuotas restantes. EL SUSCRIPTOR tiene derecho a: c) Participar de los actos de adjudicación si su cuota está al día. d) Solicitar la baja voluntaria del plan.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">SÉPTIMA:</span> GARANTÍAS DE ADJUDICACIÓN
                </h4>
                <p>
                  Al momento de resultar adjudicado y previo a la entrega del capital, EL SUSCRIPTOR deberá constituir una garantía a satisfacción de LA ADMINISTRADORA para asegurar el pago de las cuotas restantes. La garantía será determinada por LA ADMINISTRADORA en función del análisis de riesgo crediticio del suscriptor. Las opciones de garantía, presentadas de forma inclusiva y flexible, son: a) la contratación de un Seguro de Caución por Saldo Deudor con aseguradoras integradas a la plataforma, cuyo costo podrá ser descontado del capital a recibir, b) la presentación de una garantía propietaria de un inmueble, o c) la demostración de ingresos fehacientes (como recibos de sueldo) que, a exclusivo criterio de LA ADMINISTRADORA, demuestren solvencia suficiente para cubrir el saldo pendiente.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">OCTAVA:</span> FINALIZACIÓN DEL CONTRATO, INCUMPLIMIENTO Y BAJA
                </h4>
                <p>
                  El contrato finalizará de pleno derecho al vencimiento del plazo del grupo. La falta de pago de dos (2) o más cuotas facultará a LA ADMINISTRADORA a declarar la rescisión. La 'Baja Voluntaria' implica la devolución del capital puro aportado al final del ciclo del grupo, con las penalidades correspondientes. Si el grupo no se ha activado transcurridos 60 (sesenta) días desde la adhesión de EL SUSCRIPTOR, éste tendrá derecho a solicitar la 'Cancelación por Demora', recibiendo el reintegro total e inmediato de la primera cuota abonada.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">NOVENA:</span> MONEDA Y TIPO DE CAMBIO
                </h4>
                <p>
                  Todos los valores, capitales, cuotas y transacciones expresados en la plataforma se denominan en Dólares Estadounidenses (USD). Cualquier pago, liquidación o transferencia que deba realizarse en Pesos Argentinos (ARS) se convertirá utilizando la cotización de la pasarela de pago utilizada.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">DÉCIMA:</span> GESTIÓN DE FONDOS TRANSITORIOS
                </h4>
                <p>
                  Los fondos recaudados que se encuentren a la espera de ser adjudicados podrán ser colocados transitoriamente en activos de alta liquidez y bajo riesgo (Fondos Money Market) con el único fin de solventar gastos comunes del grupo, tales como primas de seguros de vida o gastos bancarios, optimizando la cuota final del suscriptor, o bien a generar un fondo a sortear entre los miembros bajos las condiciones estipuladas en cada grupo. Los rendimientos generados se aplicarán íntegramente a este concepto de compensación.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">UNDÉCIMA:</span> LIMITACIÓN DE RESPONSABILIDAD Y CONTINGENCIA
                </h4>
                <p>
                  LA ADMINISTRADORA no será responsable por daños, perjuicios o pérdidas sufridas por EL SUSCRIPTOR causados por fallas en el sistema, en el servidor o en Internet, que sean ajenas a su control. Tampoco será responsable por cualquier virus que pudiera infectar el equipo de EL SUSCRIPTOR. En caso de una falla general del sistema confirmada por LA ADMINISTRADORA que afecte plazos críticos (ej. pago de subastas, aceptación de adjudicaciones), dichos plazos serán extendidos automáticamente por 24 horas a partir del restablecimiento del servicio, sin penalidad para el usuario.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">DUODÉCIMA:</span> CONFIDENCIALIDAD Y USO DE LA CUENTA
                </h4>
                <p>
                  EL SUSCRIPTOR es el único responsable de la confidencialidad de su contraseña y del uso de su cuenta, y exime de responsabilidad a LA ADMINISTRADORA por el acceso no autorizado o uso indebido de la misma por parte de terceros.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">DECIMOTERCERA:</span> JURISDICCIÓN
                </h4>
                <p>
                  Para cualquier controversia que pudiera surgir de la interpretación o ejecución del presente contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero o jurisdicción.
                </p>
              </div>

              <div>
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">DECIMOCUARTA:</span> ACEPTACIÓN
                </h4>
                <p>
                  EL SUSCRIPTOR, al hacer clic en el botón 'Confirmar y Unirme' o acción equivalente en la plataforma y habiendo tildado la casilla de aceptación, manifiesta su consentimiento y aceptación expresa, incondicional e irrevocable de todos y cada uno de los términos y condiciones establecidos en el presente Contrato de Adhesión, perfeccionándose el vínculo contractual entre las partes.
                </p>
              </div>

              <div className="pb-10">
                <h4 className="font-black text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">DECIMOQUINFA:</span> ANEXO DE BENEFICIOS
                </h4>
                <p>
                  LA ADMINISTRADORA podrá ofrecer programas de beneficios y recompensas a los suscriptores. Los términos, condiciones, vigencia y funcionamiento de dichos programas se detallarán en la sección 'Beneficios' de la plataforma, la cual se considera un anexo al presente contrato. LA ADMINISTRADORA se reserva el derecho de modificar o discontinuar dichos programas, comunicándolo de forma fehaciente. La participación en los mismos es opcional y está sujeta al cumplimiento de las bases y condiciones específicas de cada uno.
                </p>
              </div>

              {/* Elemento para detectar fin del scroll */}
              <div ref={bottomRef} className="h-10 w-full flex items-center justify-center border-t border-dashed mt-8 pt-6">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-tighter bg-white px-4 ring-1 ring-primary/20 rounded-full py-1 shadow-sm">
                  <CheckCircle2 className={cn("h-4 w-4 transition-colors duration-500", hasReadToBottom ? "text-primary" : "text-slate-200")} />
                  {hasReadToBottom ? " Lectura Completada Exitosamente" : " Desplazarse para finalizar lectura"}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Section (Action) */}
        {!readOnly ? (
          <DialogFooter className="p-6 border-t bg-muted/30 shrink-0">
            <div className="flex flex-col w-full gap-4">
              <div className={cn(
                "flex items-start gap-4 p-3 bg-white rounded-xl border transition-all duration-500",
                !hasReadToBottom && !readOnly ? "opacity-40 grayscale" : "opacity-100 shadow-xl border-primary shadow-primary/5"
              )}>
                <Checkbox 
                  id="contract-acceptance" 
                  checked={accepted} 
                  disabled={!hasReadToBottom && !readOnly}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
                  className="mt-1 h-5 w-5 rounded-md border-primary data-[state=checked]:bg-primary"
                />
                <div className="space-y-0.5">
                  <label 
                    htmlFor="contract-acceptance" 
                    className={cn(
                      "text-sm font-black text-foreground leading-none",
                      hasReadToBottom || readOnly ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                  >
                    Confirmó que leí el contrato y acepto todos los términos y condiciones.
                  </label>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">
                    {hasReadToBottom || readOnly 
                      ? "Acción obligatoria para la unión al grupo." 
                      : "Debes desplazarte hasta el final del documento para habilitar."}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-[2] h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 bg-primary hover:bg-primary/90"
                  disabled={!accepted || isSubmitting}
                  onClick={onConfirm}
                >
                  {isSubmitting ? "Procesando Adhesión..." : "Confirmar y Unirme al Grupo"}
                  {!isSubmitting && <ShieldCheck className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </DialogFooter>
        ) : (
          <DialogFooter className="p-6 border-t bg-muted/30 shrink-0 flex flex-row gap-3">
            <Button 
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold text-sm border-primary text-primary"
              onClick={async () => {
                toast({ title: "Generando PDF...", description: "Tu descarga comenzará en breve." });
                await generateContractPDF({
                  userName: userProfile?.displayName || userProfile?.email || 'Usuario',
                  userDni: userProfile?.dni || userProfile?.cuit,
                  userEmail: userProfile?.email,
                  circleName: circle?.name || circleName,
                  circleCapital: circle?.targetCapital || 0,
                  installments: circle?.totalInstallments || 60,
                  date: formatDate(),
                  circleId: circle?.id
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" /> Descargar PDF
            </Button>
            <Button 
              className="flex-[2] h-11 rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
              onClick={() => onOpenChange(false)}
            >
              Cerrar Vista Previa
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
