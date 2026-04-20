'use client';

import { useState } from 'react';
import { doc, collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings2, 
  History, 
  DollarSign, 
  UserMinus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft 
} from 'lucide-react';
import { formatNumber, formatCurrency, cn } from "@/lib/utils";
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCollection, useMemoFirebase } from '@/firebase';

interface MemberManagementDialogProps {
  member: any;
  circleId: string;
  db: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberManagementDialog({ member, circleId, db, open, onOpenChange }: MemberManagementDialogProps) {
  const [activeTab, setActiveTab] = useState('finance');
  const [newBalance, setNewBalance] = useState(member?.capitalPaid?.toString() || '0');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consultar historial de logs del miembro
  const logsQuery = useMemoFirebase(() => {
    if (!db || !member) return null;
    return collection(db, 'users', member.userId, 'saving_circle_memberships', member.id, 'logs');
  }, [db, member]);

  const { data: logs } = useCollection(logsQuery);

  const handleUpdateBalance = async () => {
    if (!reason.trim()) {
      toast({ title: "Motivo Requerido", description: "Debe explicar por qué está ajustando el saldo.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const adjustment = parseFloat(newBalance) - member.capitalPaid;
      
      // 1. Actualizar saldos en usuario y círculo
      const userMembershipRef = doc(db, 'users', member.userId, 'saving_circle_memberships', member.id);
      const circleMemberRef = doc(db, 'saving_circles', circleId, 'members', member.userId);
      
      const updateData = { capitalPaid: parseFloat(newBalance) };
      updateDocumentNonBlocking(userMembershipRef, updateData);
      updateDocumentNonBlocking(circleMemberRef, updateData);

      // 1b. Actualizar Fondo Común del Círculo (Acumulativo)
      const circleRef = doc(db, 'saving_circles', circleId);
      updateDocumentNonBlocking(circleRef, { accumulatedCommonFund: increment(adjustment) });

      // 2. Registrar log
      await addDoc(collection(db, 'users', member.userId, 'saving_circle_memberships', member.id, 'logs'), {
        type: 'BalanceAdjustment',
        amountBefore: member.capitalPaid,
        amountAfter: parseFloat(newBalance),
        adjustment,
        reason,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      });

      toast({ title: "Saldo Actualizado", description: "El cambio ha sido registrado en el historial del socio." });
      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el saldo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessWithdrawal = async (action: 'approve' | 'deny' | 'force') => {
    setIsSubmitting(true);
    try {
      const userMembershipRef = doc(db, 'users', member.userId, 'saving_circle_memberships', member.id);
      const circleMemberRef = doc(db, 'saving_circles', circleId, 'members', member.userId);
      
      let newStatus = 'Active';
      let message = "";

      if (action === 'approve') {
        newStatus = 'Withdrawn';
        message = "Baja confirmada exitosamente.";
      } else if (action === 'deny') {
        newStatus = 'Active';
        message = "Solicitud de baja rechazada.";
      } else if (action === 'force') {
        newStatus = 'WithdrawalRequested';
        message = "Baja iniciada por la administración.";
      }

      const updateData = { status: newStatus };
      updateDocumentNonBlocking(userMembershipRef, updateData);
      updateDocumentNonBlocking(circleMemberRef, updateData);

      // Log
      await addDoc(collection(db, 'users', member.userId, 'saving_circle_memberships', member.id, 'logs'), {
        type: 'StatusChange',
        statusBefore: member.status,
        statusAfter: newStatus,
        reason: action === 'deny' ? "Baja rechazada por la administración" : "Estado actualizado por admin",
        createdAt: new Date().toISOString()
      });

      toast({ title: "Estado Actualizado", description: message });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo procesar la acción.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  const isWithdrawalPending = member.status === 'WithdrawalRequested';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Settings2 className="h-6 w-6 text-primary" />
                  Gestión de Socio
                </DialogTitle>
                <DialogDescription className="mt-1 font-medium">
                  ID: <span className="font-mono text-primary">{member.userId.slice(-8).toUpperCase()}</span> • Círculo: {circleId}
                </DialogDescription>
              </div>
              <Badge variant={member.status === 'Active' ? 'default' : isWithdrawalPending ? 'outline' : 'secondary'} className={isWithdrawalPending ? 'bg-orange-100 text-orange-700 border-none' : ''}>
                {member.status === 'Active' ? 'ACTIVO' : isWithdrawalPending ? 'BAJA SOLICITADA' : member.status}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid grid-cols-3 bg-muted/20 p-1 rounded-xl">
              <TabsTrigger value="finance" className="rounded-lg gap-2"><DollarSign className="h-4 w-4" /> Finanzas</TabsTrigger>
              <TabsTrigger value="withdrawal" className="rounded-lg gap-2"><UserMinus className="h-4 w-4" /> Bajas</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg gap-2"><History className="h-4 w-4" /> Historial</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px] p-6">
            <TabsContent value="finance" className="mt-0 space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capital Pagado Actual</Label>
                  <div className="text-3xl font-black text-foreground">{formatCurrency(member.capitalPaid)}</div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase">
                    <History className="h-4 w-4" /> Ajuste Manual de Saldo
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">NUEVO SALDO TOTAL</Label>
                    <Input 
                      type="number" 
                      value={newBalance} 
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="text-lg font-bold h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">MOTIVO DEL AJUSTE (OBLIGATORIO)</Label>
                    <Textarea 
                      placeholder="Ej: Corrección por error en transferencia bancaria..." 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="rounded-xl resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground italic">* Este motivo será visible para el socio en su historial.</p>
                  </div>
                  <Button onClick={handleUpdateBalance} disabled={isSubmitting} className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Guardar Ajuste de Saldo
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="withdrawal" className="mt-0 space-y-6">
              {isWithdrawalPending ? (
                <Card className="bg-orange-50 border-orange-100 p-6 rounded-2xl">
                  <div className="flex gap-4">
                    <AlertTriangle className="h-8 w-8 text-orange-600 shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-bold text-orange-900">Solicitud de Baja Pendiente</h4>
                      <p className="text-sm text-orange-800/70 leading-relaxed">
                        El socio ha solicitado retirarse del grupo. Su acceso a pagos y licitaciones está actualmente bloqueado.
                      </p>
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => handleProcessWithdrawal('deny')}>
                          Rechazar Baja
                        </Button>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200" onClick={() => handleProcessWithdrawal('approve')}>
                          Confirmar Baja Definitiva
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : member.status === 'Withdrawn' ? (
                <div className="p-12 text-center space-y-4">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-muted-foreground font-medium italic">Este socio ya ha sido dado de baja del círculo.</p>
                  <Button variant="outline" size="sm" onClick={() => handleProcessWithdrawal('deny')}>Restaurar Socio (Reactivar)</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-muted/30 p-6 rounded-2xl border flex gap-4">
                    <Info className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Si el socio desea retirarse pero no ha enviado la solicitud formal, usted puede iniciar el proceso de baja administrativa. Esto bloqueará su acceso inmediatamente.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleProcessWithdrawal('force')}>
                    Iniciar Baja Administrativa
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-4">
              <div className="space-y-4">
                {!logs || logs.length === 0 ? (
                  <div className="p-20 text-center text-muted-foreground italic">No hay registros de actividad para este socio.</div>
                ) : (
                  logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((log: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border bg-muted/5 flex flex-col gap-2 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-widest px-2 py-0">
                          {log.type === 'BalanceAdjustment' ? 'Ajuste de Saldo' : 'Cambio de Estado'}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.createdAt), "d MMM, HH:mm", { locale: es })}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-foreground">{log.reason}</p>
                      {log.type === 'BalanceAdjustment' && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{formatCurrency(log.amountBefore)}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-black text-primary">{formatCurrency(log.amountAfter)}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 bg-muted/10 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cerrar Panel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
