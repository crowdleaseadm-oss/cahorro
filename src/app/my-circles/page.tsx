
'use client';

import { useState, useEffect } from 'react';
import { PiggyBank, ArrowRight, Target, Calendar, DollarSign, Activity, Gavel, Loader2, Info, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, where, documentId } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function MyCirclesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isBidding, setIsBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState(1);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const membershipsRef = useMemoFirebase(() => (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), [db, user]);
  const { data: memberships, isLoading: membershipsLoading } = useCollection(membershipsRef);

  const circleIds = memberships?.map(m => m.savingCircleId) || [];
  const circlesQuery = useMemoFirebase(() => {
    if (!db || circleIds.length === 0) return null;
    return query(collection(db, 'saving_circles'), where(documentId(), 'in', circleIds));
  }, [db, circleIds.join(',')]);
  const { data: circles, isLoading: circlesLoading } = useCollection(circlesQuery);

  const formatNumber = (num: number) => {
    if (!mounted) return num.toString();
    return num.toLocaleString();
  };

  const calculateNextInstallmentDate = (joiningDateStr: string) => {
    const joinDate = new Date(joiningDateStr);
    const minDateForSecond = new Date(joinDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    let next10th = new Date(joinDate.getFullYear(), joinDate.getMonth(), 10);
    while (next10th < minDateForSecond) {
      next10th.setMonth(next10th.getMonth() + 1);
    }
    return next10th;
  };

  const handlePlaceBid = () => {
    if (!db || !user || !selectedMembership) return;
    setIsBidding(true);

    const bidData = {
      userId: user.uid,
      userName: user.displayName || user.email,
      savingCircleId: selectedMembership.savingCircleId,
      membershipId: selectedMembership.id,
      installmentsOffered: Number(bidAmount),
      amountInUsd: Number(bidAmount) * (selectedMembership.capitalPaid / (selectedMembership.paidInstallmentsCount || 1) || 2000), 
      bidDate: new Date().toISOString(),
      status: 'Pending',
      createdAt: serverTimestamp(),
    };

    const bidsCol = collection(db, 'saving_circles', selectedMembership.savingCircleId, 'bids');
    addDocumentNonBlocking(bidsCol, bidData);
    
    setTimeout(() => {
      setIsBidding(false);
      setSelectedMembership(null);
    }, 800);
  };

  if (membershipsLoading || (circleIds.length > 0 && circlesLoading)) return (
    <div className="p-10 text-center flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p>Cargando tus suscripciones...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PiggyBank className="h-8 w-8 text-primary" />
            Mis Círculos
          </h1>
          <p className="text-muted-foreground mt-1">Gestión de tus suscripciones y adjudicaciones en USD.</p>
        </div>
      </div>

      {(!memberships || memberships.length === 0) ? (
        <Card className="border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center p-16 text-center rounded-3xl">
          <Activity className="h-16 w-16 text-muted-foreground mb-6 opacity-20" />
          <h3 className="text-xl font-bold">Sin suscripciones activas</h3>
          <p className="text-muted-foreground mb-8 max-w-md">Únete a un círculo para comenzar tu plan de ahorro programado.</p>
          <Button asChild size="lg" className="rounded-xl shadow-lg">
            <Link href="/explore">Explorar Círculos</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8">
          {memberships.map((membership) => {
            const circle = circles?.find(c => c.id === membership.savingCircleId);
            const isCircleActive = circle && (circle.currentMemberCount || 0) >= circle.memberCapacity;
            const nextPayDate = isCircleActive ? calculateNextInstallmentDate(membership.joiningDate) : null;
            const progress = circle ? ((circle.currentMemberCount || 0) / circle.memberCapacity) * 100 : 0;

            return (
              <Card key={membership.id} className="border-none shadow-md overflow-hidden bg-white rounded-3xl">
                <div className="grid md:grid-cols-12">
                  <div className="md:col-span-4 bg-accent/30 p-8 flex flex-col justify-between border-r border-border">
                    <div className="space-y-6">
                      <Badge className={`${isCircleActive ? 'bg-green-600' : 'bg-orange-500'} text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-widest`}>
                        {isCircleActive ? 'Grupo Activo' : 'En Formación'}
                      </Badge>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground leading-tight">{membership.savingCircleName}</h2>
                        <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-tighter">ID Círculo: {membership.savingCircleId}</p>
                      </div>
                    </div>
                    {!isCircleActive && (
                      <div className="mt-12 space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span>Completitud del Grupo</span>
                          <span className="text-primary">{circle?.currentMemberCount || 0} / {circle?.memberCapacity || '--'}</span>
                        </div>
                        <Progress value={progress} className="h-2.5 bg-white" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-8 p-8 flex flex-col justify-between">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          Próximo Pago
                          {!isCircleActive && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">Inicia al completarse el grupo.</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                        <div className={`flex items-center gap-2 font-bold text-xl ${isCircleActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          <Clock className="h-5 w-5" />
                          {nextPayDate ? nextPayDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Pendiente'}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cuotas Pagas</span>
                        <div className="flex items-center gap-2 font-bold text-xl">
                          <Target className="h-5 w-5 text-primary" />
                          {membership.paidInstallmentsCount} / {circle?.totalInstallments || '--'}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Adjudicación</span>
                        <div>
                          <Badge variant="outline" className={membership.adjudicationStatus === 'Adjudicated' ? "bg-green-50 text-green-700 border-green-200" : "bg-secondary/20 text-secondary-foreground border-none"}>
                            {membership.adjudicationStatus === 'Adjudicated' ? '¡ADJUDICADO!' : 'PENDIENTE'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border/60">
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {isCircleActive 
                          ? "El círculo está en curso. Puedes participar en los sorteos y licitaciones mensuales."
                          : "El círculo se activará automáticamente cuando se completen todas las vacantes."}
                      </p>
                      <div className="flex gap-3 w-full sm:w-auto">
                        {isCircleActive && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex-1 sm:flex-none border-primary/20 text-primary gap-2 hover:bg-primary/5 rounded-xl" onClick={() => setSelectedMembership(membership)}>
                                <Gavel className="h-4 w-4" />
                                Licitación
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Oferta de Licitación</DialogTitle>
                                <DialogDescription>
                                  Ofrece adelantar cuotas para obtener el capital antes. El monto es Alícuota Pura x Cuotas.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-6 space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="installments">Cantidad de Cuotas a Adelantar</Label>
                                  <Input 
                                    id="installments" 
                                    type="number" 
                                    min="1" 
                                    value={bidAmount} 
                                    onChange={(e) => setBidAmount(Number(e.target.value))} 
                                    className="text-lg font-bold"
                                  />
                                </div>
                                <div className="bg-accent/30 p-4 rounded-xl flex justify-between items-center">
                                  <span className="text-sm font-medium text-muted-foreground">Monto Total Oferta (USD):</span>
                                  <span className="text-xl font-bold text-primary">${formatNumber(bidAmount * (circle?.installmentValue || 0))}</span>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handlePlaceBid} disabled={isBidding} className="w-full sm:w-auto rounded-xl">
                                  {isBidding ? 'Enviando...' : 'Confirmar Oferta'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button asChild className="flex-1 sm:flex-none gap-2 rounded-xl shadow-lg shadow-primary/20">
                          <Link href={`/explore/${membership.savingCircleId}`}>
                            Ver Plan
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
