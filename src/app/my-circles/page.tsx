
'use client';

import { useState } from 'react';
import { PiggyBank, ArrowRight, Target, Calendar, DollarSign, Activity, Gavel, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function MyCirclesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isBidding, setIsBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState(1);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);

  const membershipsRef = useMemoFirebase(() => (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), [db, user]);
  const { data: memberships, isLoading } = useCollection(membershipsRef);

  const handlePlaceBid = () => {
    if (!db || !user || !selectedMembership) return;
    setIsBidding(true);

    const bidData = {
      userId: user.uid,
      userName: user.displayName || user.email,
      savingCircleId: selectedMembership.savingCircleId,
      membershipId: selectedMembership.id,
      installmentsOffered: Number(bidAmount),
      // Alicuota is calculated on the server or provided by membership for MVP
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

  if (isLoading) return <div className="p-10 text-center flex flex-col items-center gap-4">
    <Loader2 className="h-10 w-10 text-primary animate-spin" />
    <p>Cargando tus suscripciones...</p>
  </div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PiggyBank className="h-8 w-8 text-primary" />
            Mis Círculos
          </h1>
          <p className="text-muted-foreground mt-1">Saldos de capital y adjudicaciones en USD.</p>
        </div>
      </div>

      {(!memberships || memberships.length === 0) ? (
        <Card className="border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center p-16 text-center rounded-3xl">
          <Activity className="h-16 w-16 text-muted-foreground mb-6 opacity-20" />
          <h3 className="text-xl font-bold">Sin suscripciones activas</h3>
          <p className="text-muted-foreground mb-8 max-w-md">Únete a un círculo para comenzar tu plan de ahorro programado sin intereses bancarios.</p>
          <Button asChild size="lg" className="rounded-xl shadow-lg">
            <Link href="/explore">Explorar Círculos</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8">
          {memberships.map((membership) => {
            const progress = (membership.paidInstallmentsCount / (membership.paidInstallmentsCount + (membership.outstandingCapitalBalance / (membership.capitalPaid / (membership.paidInstallmentsCount || 1) || 1)))) * 100 || 0;
            return (
              <Card key={membership.id} className="border-none shadow-md overflow-hidden bg-white rounded-3xl">
                <div className="grid md:grid-cols-12">
                  <div className="md:col-span-4 bg-accent/30 p-8 flex flex-col justify-between border-r border-border">
                    <div className="space-y-6">
                      <Badge className="bg-primary text-white border-none px-3 py-1 text-xs font-bold">{membership.status}</Badge>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground leading-tight">{membership.savingCircleName}</h2>
                        <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-tighter">ID: {membership.id}</p>
                      </div>
                    </div>
                    <div className="mt-12 space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Progreso de Capital</span>
                        <span className="text-primary">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5 bg-white" />
                    </div>
                  </div>

                  <div className="md:col-span-8 p-8 flex flex-col justify-between">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capital Integrado</span>
                        <div className="flex items-center gap-2 font-bold text-xl">
                          <Target className="h-5 w-5 text-primary" />
                          ${membership.capitalPaid.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saldo Pendiente</span>
                        <div className="flex items-center gap-2 font-bold text-xl text-primary">
                          <DollarSign className="h-5 w-5" />
                          ${membership.outstandingCapitalBalance.toLocaleString()}
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
                      <div className="flex items-center gap-4">
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-muted-foreground uppercase">Cuotas Pagas</span>
                           <span className="font-bold text-lg">{membership.paidInstallmentsCount} meses</span>
                         </div>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
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
                                <span className="text-xl font-bold text-primary">${(bidAmount * 2083.33).toLocaleString()}</span>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handlePlaceBid} disabled={isBidding} className="w-full sm:w-auto rounded-xl">
                                {isBidding ? 'Enviando...' : 'Confirmar Oferta'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
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
