
'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, ShieldCheck, TrendingUp, Users, CheckCircle2, Info, Loader2, DollarSign, Calendar, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

export default function CirclePlanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle, isLoading: circleLoading } = useDoc(circleRef);

  if (circleLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground">Cargando detalles del plan...</p>
    </div>
  );

  if (!circle) return (
    <div className="p-20 text-center space-y-4">
       <h1 className="text-2xl font-bold text-destructive">Plan no encontrado</h1>
       <p className="text-muted-foreground">El círculo que buscas no existe o ha sido removido.</p>
       <Button asChild variant="outline"><Link href="/explore">Volver a Explorar</Link></Button>
    </div>
  );

  // Cálculos financieros base
  const alicuota = circle.targetCapital / circle.totalInstallments;
  const adminFeeRate = circle.administrativeFeeRate || 0.02;
  const insuranceRate = 0.0009;

  // Lógica de Derecho de Suscripción (3% prorrateado en el primer 20% de cuotas)
  const totalSubFee = circle.targetCapital * 0.03;
  const installmentsWithSubFee = Math.ceil(circle.totalInstallments * 0.20);
  const proratedSubFee = totalSubFee / installmentsWithSubFee;

  // Gastos fijos mensuales
  const adminFeeTotal = alicuota * adminFeeRate;
  const insuranceTotal = circle.targetCapital * insuranceRate;
  const baseMonthly = alicuota + adminFeeTotal + insuranceTotal;
  
  // CFT Proyectado
  const totalPaidEstimate = (baseMonthly * circle.totalInstallments) + totalSubFee;
  const cftAverage = ((totalPaidEstimate - circle.targetCapital) / circle.targetCapital) * 100;

  const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;

  const handleSubscribe = () => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes estar registrado para unirte a un círculo.", variant: "destructive" });
      return;
    }
    if (!db) return;
    if (isFull) {
      toast({ title: "Círculo Completo", description: "Este grupo ya ha alcanzado su capacidad máxima.", variant: "destructive" });
      return;
    }
    
    setIsSubscribing(true);

    const membershipData = {
      userId: user.uid,
      savingCircleId: circle.id,
      savingCircleName: circle.name,
      savingCircleAdminUserId: circle.adminUserId,
      joiningDate: new Date().toISOString(),
      status: 'Active',
      paidInstallmentsCount: 0,
      capitalPaid: 0,
      outstandingCapitalBalance: circle.targetCapital,
      adjudicationStatus: 'Pending',
      createdAt: serverTimestamp(),
    };

    const membershipsCol = collection(db, 'users', user.uid, 'saving_circle_memberships');
    addDocumentNonBlocking(membershipsCol, membershipData);
    
    const circleDocRef = doc(db, 'saving_circles', circle.id);
    updateDocumentNonBlocking(circleDocRef, { currentMemberCount: increment(1) });

    toast({ title: "¡Suscripción exitosa!", description: "Bienvenido al círculo de ahorro." });
    
    setTimeout(() => {
      router.push('/my-circles');
    }, 1500);
  };

  const formatCurrency = (val: number) => {
    if (!mounted) return `$0.00`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Generar datos de las cuotas con prorrateo
  const installments = Array.from({ length: circle.totalInstallments }, (_, i) => {
    const num = i + 1;
    // Aplicar prorrateo solo si está dentro del primer 20%
    const currentSubFee = num <= installmentsWithSubFee ? proratedSubFee : 0;
    const currentTotal = baseMonthly + currentSubFee;
    return { num, currentSubFee, currentTotal };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/explore">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Detalle del Plan Financiero</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className={`h-2 w-full ${isFull ? 'bg-orange-500' : 'bg-primary'}`} />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold text-primary">{circle.name}</CardTitle>
                  <CardDescription className="text-lg">Capital Suscripto: {formatCurrency(circle.targetCapital)} USD</CardDescription>
                </div>
                <Badge className={`${isFull ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} border-none font-bold px-4 py-1`}>
                  {isFull ? 'ACTIVO (Completo)' : 'ABIERTO'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Miembros</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">{circle.currentMemberCount || 0}/{circle.memberCapacity}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Plazo</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">{circle.totalInstallments} meses</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Cuota Promedio</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">{formatCurrency(totalPaidEstimate / circle.totalInstallments)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Adjudicaciones</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">{circle.drawMethodCount} + {circle.bidMethodCount}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-accent/30 rounded-3xl border border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-primary text-lg">
                      <Calculator className="h-5 w-5" />
                      Costo Financiero Total (CFT)
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      El Derecho de Suscripción (3%) se prorratea en las primeras {installmentsWithSubFee} cuotas del plan.
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-4xl font-black text-primary">{cftAverage.toFixed(2)}%</div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total del Plan</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Proyección de {circle.totalInstallments} Cuotas</CardTitle>
              <CardDescription>Planificación detallada de aportes mensuales en USD.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full pr-4">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="font-bold">Cuota</TableHead>
                      <TableHead className="font-bold">Vencimiento</TableHead>
                      <TableHead className="font-bold">Total Mensual</TableHead>
                      <TableHead className="font-bold text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst) => (
                      <TableRow key={inst.num} className="hover:bg-accent/10 transition-colors">
                        <TableCell className="font-bold">#{inst.num}</TableCell>
                        <TableCell className="text-muted-foreground">Mes {inst.num}</TableCell>
                        <TableCell className="font-bold text-primary">{formatCurrency(inst.currentTotal)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs gap-1 font-bold h-7 hover:bg-primary/10 text-primary">
                                <Info className="h-3 w-3" />
                                Ver Desglose
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-primary">Desglose de Cuota #{inst.num}</DialogTitle>
                                <DialogDescription>Composición detallada del aporte mensual.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                                  <span className="text-sm font-medium">Alícuota Pura (Capital)</span>
                                  <span className="font-bold">{formatCurrency(alicuota)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                                  <span className="text-sm font-medium">Gastos Administrativos</span>
                                  <span className="font-bold">{formatCurrency(adminFeeTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                                  <span className="text-sm font-medium">Seguro de Vida (0.09%)</span>
                                  <span className="font-bold">{formatCurrency(insuranceTotal)}</span>
                                </div>
                                {inst.currentSubFee > 0 && (
                                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-primary">Derecho de Suscripción</span>
                                      <span className="text-[10px] text-primary/70">Prorrateo cuota {inst.num} de {installmentsWithSubFee}</span>
                                    </div>
                                    <span className="font-bold text-primary">{formatCurrency(inst.currentSubFee)}</span>
                                  </div>
                                )}
                                <div className="border-t pt-4 flex justify-between items-center">
                                  <span className="text-lg font-bold">Total a Pagar</span>
                                  <span className="text-2xl font-black text-primary">{formatCurrency(inst.currentTotal)}</span>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary text-white sticky top-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                Suscripción USD
              </CardTitle>
              <CardDescription className="text-white/80">Ahorro colaborativo sin intereses bancarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/10">
                  <span className="font-medium">Cuota Promedio</span>
                  <span className="font-bold text-lg">{formatCurrency(totalPaidEstimate / circle.totalInstallments)}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/10">
                  <span className="font-medium">Capital Final</span>
                  <span className="font-bold text-lg">{formatCurrency(circle.targetCapital)}</span>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">Condición Derecho Suscripción:</h4>
                 <div className="bg-white/10 p-3 rounded-xl">
                    <p className="text-xs leading-relaxed">
                      El 3% del capital total ({formatCurrency(totalSubFee)}) se divide en las primeras {installmentsWithSubFee} cuotas ({formatCurrency(proratedSubFee)} adicionales c/u).
                    </p>
                 </div>
              </div>

              <Button 
                variant="secondary" 
                className="w-full h-14 text-lg font-bold shadow-lg hover:scale-[1.02] transition-transform"
                onClick={handleSubscribe}
                disabled={isSubscribing || isFull}
              >
                {isSubscribing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isFull ? (
                  'Círculo Completo'
                ) : (
                  'Suscribirme Ahora'
                )}
              </Button>
              <p className="text-[10px] text-center text-white/60">Al suscribirse acepta los términos y condiciones del círculo.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
