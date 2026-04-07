
'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, ShieldCheck, TrendingUp, Users, CheckCircle2, Info, Loader2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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

  const alicuota = circle.targetCapital / circle.totalInstallments;
  const subFee = alicuota * (circle.subscriptionFeeRate || 0);
  const adminFee = alicuota * (circle.administrativeFeeRate || 0);
  const insurance = circle.targetCapital * 0.0009;
  const totalMonthly = alicuota + subFee + adminFee + insurance;
  
  // CFT = ((Total Pagado - Capital) / Capital) * 100
  const totalPaidEstimate = totalMonthly * circle.totalInstallments;
  const cftAverage = ((totalPaidEstimate - circle.targetCapital) / circle.targetCapital) * 100;

  const handleSubscribe = () => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes estar registrado para unirte a un círculo.", variant: "destructive" });
      return;
    }
    if (!db) return;
    
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
    
    toast({ title: "¡Suscripción exitosa!", description: "Bienvenido al círculo de ahorro." });
    
    setTimeout(() => {
      router.push('/my-circles');
    }, 1500);
  };

  const formatCurrency = (val: number) => {
    if (!mounted) return `$0.00`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/explore">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Análisis de Plan Financiero</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold text-primary">{circle.name}</CardTitle>
                  <CardDescription className="text-lg">Capital Suscripto: {formatCurrency(circle.targetCapital)} USD</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold px-4 py-1">
                  Activo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Miembros</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">1/{circle.memberCapacity}</span>
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
                    <span className="text-xl font-bold">{formatCurrency(totalMonthly)}</span>
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
                      Costo Financiero Total (CFT) Promedio
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      Este es el costo total aproximado sobre el capital por gastos administrativos y seguros. 
                      Este porcentaje puede reducirse significativamente al licitar o adelantar cuotas.
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-4xl font-black text-primary">{cftAverage.toFixed(2)}%</div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estimado Anual</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Plan de Cuotas (Ejemplo Proyectado)</CardTitle>
              <CardDescription>Composición estimada de las primeras cuotas en USD.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Cuota</TableHead>
                    <TableHead className="font-bold">Vencimiento</TableHead>
                    <TableHead className="font-bold">Total Aproximado</TableHead>
                    <TableHead className="font-bold text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TableRow key={num} className="hover:bg-accent/10 transition-colors">
                      <TableCell className="font-bold">#{num}</TableCell>
                      <TableCell className="text-muted-foreground">Mes {num}</TableCell>
                      <TableCell className="font-bold text-primary">{formatCurrency(totalMonthly)}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs gap-1 font-bold h-7">
                                <Info className="h-3 w-3" />
                                Ver Desglose
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="p-4 space-y-2">
                              <div className="flex justify-between gap-8">
                                <span className="text-xs">Alícuota Pura:</span>
                                <span className="text-xs font-bold">{formatCurrency(alicuota)}</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                <span className="text-xs">Gastos Adm.:</span>
                                <span className="text-xs font-bold">{formatCurrency(subFee + adminFee)}</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                <span className="text-xs">Seguro Vida:</span>
                                <span className="text-xs font-bold">{formatCurrency(insurance)}</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary text-white sticky top-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                Suscripción USD
              </CardTitle>
              <CardDescription className="text-white/80">Ahorro colaborativo sin intereses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/10">
                  <span className="font-medium">Cuota Mensual</span>
                  <span className="font-bold text-lg">{formatCurrency(totalMonthly)}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/10">
                  <span className="font-medium">Capital Final</span>
                  <span className="font-bold text-lg">{formatCurrency(circle.targetCapital)}</span>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">Garantías Incluidas:</h4>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      Seguro de Vida (0.09%)
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      Respaldo Contractual
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      Capital Ajustable en USD
                    </div>
                 </div>
              </div>

              <Button 
                variant="secondary" 
                className="w-full h-14 text-lg font-bold shadow-lg hover:scale-[1.02] transition-transform"
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
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
