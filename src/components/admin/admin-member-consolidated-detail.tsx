'use client';

import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Trophy, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

import { formatCurrency } from "@/lib/utils";
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';

interface MemberConsolidatedDetailProps {
  member: any;
  circle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: 'profile' | 'adjudication' | 'financial';
}

export function AdminMemberConsolidatedDetail({ 
  member, 
  circle, 
  open, 
  onOpenChange,
  initialView = 'profile' 
}: MemberConsolidatedDetailProps) {
  const db = useFirestore();
  const [view, setView] = useState(initialView);

  // Nuevo: Cargar perfil de usuario completo (para ver nombre real, etc.)
  const fullProfileRef = useMemoFirebase(() => (db && member?.userId && open ? doc(db, 'users', member.userId) : null), [db, member?.userId, open]);
  const { data: fullProfile, isLoading: loadingProfile } = useDoc(fullProfileRef);
  
  const displayName = fullProfile?.displayName || member?.userName || "Socio";
  const userSerialId = fullProfile?.documentId || member?.documentId || member?.userId?.slice(-8).toUpperCase() || "N/A";

  // Sync view with initialView when dialog opens
  useMemo(() => {
    if (open) setView(initialView);
  }, [open, initialView]);

  // Basic Mora Calculation Logic
  // Months elapsed since joining (approximation based on months since joiningDate)
  const monthsElapsed = useMemo(() => {
    if (!member?.joiningDate) return 0;
    const start = new Date(member.joiningDate);
    const now = new Date();
    return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  }, [member?.joiningDate]);

  if (!member || !circle) return null;

  const quotaValue = circle.installmentValue || 0;
  const expectedPaidByNow = Math.min(circle.totalInstallments, monthsElapsed) * quotaValue;
  const isInArrears = member.capitalPaid < expectedPaidByNow;
  const arrearsAmount = Math.max(0, expectedPaidByNow - member.capitalPaid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        
        {/* Header con navegación contextual */}
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {view === 'profile' && <User className="h-6 w-6 text-primary" />}
                {view === 'adjudication' && <Trophy className="h-6 w-6 text-primary" />}
                {view === 'financial' && <TrendingDown className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {view === 'profile' && "Perfil del Socio"}
                  {view === 'adjudication' && "Detalles de Adjudicación"}
                  {view === 'financial' && "Situación Financiera"}
                </DialogTitle>
                <DialogDescription>
                  {displayName} • Plan {circle.name}
                </DialogDescription>
              </div>
            </div>
            <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
              {member.status === 'Active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
                variant={view === 'profile' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setView('profile')}
                className="rounded-full h-8 text-xs font-bold"
            >Perfil</Button>
            <Button 
                variant={view === 'adjudication' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setView('adjudication')}
                className="rounded-full h-8 text-xs font-bold"
            >Adjudicación</Button>
            <Button 
                variant={view === 'financial' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setView('financial')}
                className="rounded-full h-8 text-xs font-bold"
            >Finanzas</Button>
          </div>
        </div>

        <div className="p-8">
          {/* VISTA: PERFIL GENERAL */}
          {view === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30 border-none">
                  <CardContent className="pt-6">
                    <div className="text-xs font-bold text-muted-foreground uppercase mb-1">ID Público (N°)</div>
                    <div className="font-mono text-sm text-primary font-black uppercase tracking-widest">{userSerialId}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-none">
                  <CardContent className="pt-6">
                    <div className="text-xs font-bold text-muted-foreground uppercase mb-1">N° Orden</div>
                    <div className="text-2xl font-black text-primary">{member.orderNumber?.toString().padStart(2, '0') || '--'}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Fecha de Ingreso:</span>
                  <span>{member.joiningDate ? new Date(member.joiningDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Estado del Plan:</span>
                  <Badge variant="outline">{member.status}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: ADJUDICACIÓN */}
          {view === 'adjudication' && (
            <div className="space-y-6">
              {member.adjudicationStatus === 'Adjudicated' ? (
                <>
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col items-center text-center">
                    <Trophy className="h-12 w-12 text-green-600 mb-2" />
                    <h3 className="text-lg font-bold text-green-900">Bien adjudicado</h3>
                    <p className="text-sm text-green-700">El socio ya cuenta con el capital acreditado.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Fecha Ganadora</Label>
                        <div className="flex items-center gap-2 font-bold">
                            <Calendar className="h-4 w-4 text-primary" />
                            {member.adjudicationDate ? new Date(member.adjudicationDate).toLocaleDateString() : 'Desconocida'}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Modalidad</Label>
                        <div className="flex items-center gap-2 font-bold italic">
                            {member.adjudicationMethod === 'Draw' ? "Sorteo Mensual" : "Licitación"}
                        </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="pt-2 text-center">
                    <div className="text-4xl font-black text-primary">{formatCurrency(circle.targetCapital)}</div>
                  </div>
                </>
              ) : member.adjudicationStatus === 'WinnerPendingConfirmation' ? (
                <div className="py-12 text-center space-y-4">
                   <Clock className="h-12 w-12 text-orange-400 mx-auto animate-pulse" />
                   <h3 className="text-xl font-bold">Pendiente de Confirmación</h3>
                   <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    El sistema ha seleccionado a este socio como ganador. Un administrador debe validar la situación en las próximas 48hs.
                   </p>
                   <div className="flex justify-center gap-3">
                      <Button variant="outline" size="sm">Historial de Ofertas</Button>
                      <Button size="sm">Confirmar Ahora</Button>
                   </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4 bg-muted/20 rounded-3xl">
                   <Trophy className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                   <p className="text-muted-foreground font-bold italic">Aún no ha sido adjudicado</p>
                   <p className="text-xs text-muted-foreground">Este socio sigue participando en sorteos y licitaciones.</p>
                </div>
              )}
            </div>
          )}

          {/* VISTA: FINANCIERA (MORA) */}
          {view === 'financial' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Resumen de Pagos</h3>
                  <p className="text-sm text-muted-foreground">Estado actual de suscripción</p>
                </div>
                {isInArrears ? (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none flex gap-1 items-center px-4 py-1">
                    <AlertCircle className="h-3 w-3" />
                    En Mora
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none flex gap-1 items-center px-4 py-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Al día
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none bg-primary/5">
                  <CardContent className="pt-4 text-center">
                    <div className="text-[10px] font-bold text-primary uppercase">Pagado</div>
                    <div className="text-base font-bold">{formatCurrency(member.capitalPaid)}</div>
                  </CardContent>
                </Card>
                <Card className="border-none bg-orange-50">
                   <CardContent className="pt-4 text-center">
                    <div className="text-[10px] font-bold text-orange-700 uppercase">Mora</div>
                    <div className="text-base font-bold text-orange-700">{formatCurrency(arrearsAmount)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Cronograma de Cuotas</h4>
                  {!member.status === 'Active' && <Badge className="text-[8px] bg-blue-50 text-blue-600 border-none">Estimado por formación</Badge>}
                </div>
                
                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableBody>
                      {Array.from({ length: 5 }, (_, i) => {
                        const num = (Math.floor(member.capitalPaid / quotaValue)) + i + 1;
                        if (num > circle.totalInstallments) return null;
                        
                        // Lógica de fecha similar a las otras vistas
                        const baseDate = member.status === 'Active' && member.joiningDate 
                          ? new Date(member.joiningDate) 
                          : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
                        
                        const minDateForFirst = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                        let candidate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                        
                        while (true) {
                            if (candidate.getDate() < 5) candidate.setDate(5);
                            else if (candidate.getDate() < 20) candidate.setDate(20);
                            else {
                                candidate.setMonth(candidate.getMonth() + 1);
                                candidate.setDate(5);
                            }
                            if (candidate.getTime() >= minDateForFirst.getTime()) break;
                        }
                        const finalDate = new Date(candidate);
                        finalDate.setMonth(finalDate.getMonth() + (num - 1));

                        return (
                          <TableRow key={num} className={i === 0 ? "bg-primary/5" : ""}>
                            <TableCell className="py-2 font-bold text-xs whitespace-nowrap">Cuota #{num}</TableCell>
                            <TableCell className="py-2 text-xs text-muted-foreground">
                              {finalDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </TableCell>
                            <TableCell className="py-2 text-right font-bold text-xs">{formatCurrency(quotaValue)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Cuotas cubiertas</span>
                  <span className="font-bold">{Math.floor(member.capitalPaid / quotaValue)} de {circle.totalInstallments}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500" 
                    style={{ width: `${(member.capitalPaid / circle.targetCapital) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                    * El cálculo de mora y fechas es proyectado según condiciones de reglamento.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cerrar Detalle</Button>
          {view === 'financial' && (
            <Button className="rounded-xl font-bold shadow-lg shadow-primary/20">Registrar Pago Manual</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

