'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, ShieldCheck, TrendingUp, Users, Info, Loader2, DollarSign, Calendar, Lock, Unlock, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, increment, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

export default function CirclePlanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle, isLoading: circleLoading } = useDoc(circleRef);

  // Verificar si el usuario ya es miembro
  const membershipQuery = useMemoFirebase(() => {
    if (!db || !user || !params.id) return null;
    return query(
      collection(db, 'users', user.uid, 'saving_circle_memberships'),
      where('savingCircleId', '==', params.id as string)
    );
  }, [db, user, params.id]);

  const { data: existingMemberships, isLoading: membershipCheckLoading } = useCollection(membershipQuery);
  const isAlreadyMember = existingMemberships && existingMemberships.length > 0;

  useEffect(() => {
    if (circle && circle.isPrivate) {
      setIsLocked(true);
    }
  }, [circle]);

  const handleUnlock = () => {
    if (passwordInput === circle?.password) {
      setIsLocked(false);
      toast({ title: "Acceso Concedido", description: "Ahora puede ver los detalles del plan." });
    } else {
      toast({ title: "Error", description: "Contraseña incorrecta.", variant: "destructive" });
    }
  };

  if (circleLoading || (user && membershipCheckLoading)) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
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

  if (isLocked) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
        <div className="p-6 bg-orange-100 rounded-full">
          <Lock className="h-12 w-12 text-orange-600" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Círculo Privado</h1>
          <p className="text-muted-foreground">Este grupo requiere una contraseña de acceso para ver su proyección financiera.</p>
        </div>
        <div className="w-full space-y-4">
          <Input 
            type="password" 
            placeholder="Ingrese la contraseña" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className="text-center h-12 text-lg"
          />
          <Button onClick={handleUnlock} className="w-full h-12 text-lg font-bold gap-2">
            <Unlock className="h-5 w-5" />
            Desbloquear Plan
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/explore">Volver a Explorar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const capitalTotal = circle.targetCapital;
  const totalCuotas = circle.totalInstallments;
  const adminRate = circle.administrativeFeeRate || 0.10;
  const subRate = circle.subscriptionFeeRate || 0.03;
  const lifeInsRate = circle.lifeInsuranceRate || 0.0009;

  const alicuotaPura = capitalTotal / totalCuotas;
  const adminFeeMensual = alicuotaPura * adminRate;
  const totalSubFee = capitalTotal * subRate;
  const installmentsWithSubFee = Math.ceil(totalCuotas * 0.20);
  const proratedSubFee = totalSubFee / installmentsWithSubFee;

  const installments = Array.from({ length: totalCuotas }, (_, i) => {
    const num = i + 1;
    const totalAlicuotasPagasAnterior = alicuotaPura * i;
    const saldoCapitalPuro = capitalTotal - totalAlicuotasPagasAnterior;
    const currentInsurance = saldoCapitalPuro * lifeInsRate;
    const currentSubFee = num <= installmentsWithSubFee ? proratedSubFee : 0;
    const currentTotal = alicuotaPura + adminFeeMensual + currentInsurance + currentSubFee;
    
    return { 
      num, 
      alicuotaPura,
      adminFeeMensual,
      currentInsurance,
      currentSubFee, 
      currentTotal,
      saldoCapitalPuro
    };
  });

  const totalPlanSum = installments.reduce((acc, inst) => acc + inst.currentTotal, 0);
  const cuotaPromedio = totalPlanSum / totalCuotas;

  const handleSubscribe = () => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes estar registrado para unirte a un círculo.", variant: "destructive" });
      return;
    }
    if (!db) return;
    if (isAlreadyMember) {
      toast({ title: "Ya eres miembro", description: "Ya tienes una suscripción activa para este círculo." });
      return;
    }
    const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
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
      paidInstallmentsCount: 1, // Se abona la primera al suscribirse
      capitalPaid: alicuotaPura,
      outstandingCapitalBalance: capitalTotal - alicuotaPura,
      adjudicationStatus: 'Pending',
      createdAt: serverTimestamp(),
    };

    const userMembershipRef = doc(collection(db, 'users', user.uid, 'saving_circle_memberships'));
    setDocumentNonBlocking(userMembershipRef, { ...membershipData, id: userMembershipRef.id }, { merge: true });
    
    const circleMemberRef = doc(db, 'saving_circles', circle.id, 'members', user.uid);
    setDocumentNonBlocking(circleMemberRef, { ...membershipData, id: userMembershipRef.id }, { merge: true });

    const circleDocRef = doc(db, 'saving_circles', circle.id);
    updateDocumentNonBlocking(circleDocRef, { currentMemberCount: increment(1) });

    toast({ title: "¡Suscripción exitosa!", description: "Has abonado la 1ra cuota correctamente." });
    
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
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {isAlreadyMember ? 'Tu Plan Financiero' : 'Detalle del Plan Financiero'}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold text-primary">{circle.name}</CardTitle>
                  <CardDescription className="text-lg">Capital Suscripto: {formatCurrency(capitalTotal)} USD</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${(circle.currentMemberCount || 0) >= circle.memberCapacity ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} border-none font-bold px-4 py-1`}>
                    {(circle.currentMemberCount || 0) >= circle.memberCapacity ? 'ACTIVO (Completo)' : 'ABIERTO'}
                  </Badge>
                  {circle.isPrivate && (
                    <Badge variant="outline" className="gap-1 border-orange-200 text-orange-700 bg-orange-50">
                      <Lock className="h-3 w-3" /> Privado
                    </Badge>
                  )}
                </div>
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
                    <span className="text-xl font-bold">{totalCuotas} meses</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Cuota Promedio</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">{formatCurrency(cuotaPromedio)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Vencimientos</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">Día 10</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-accent/30 rounded-3xl border border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-primary text-lg">
                      <Calculator className="h-5 w-5" />
                      {isAlreadyMember ? 'Resumen Financiero del Plan' : 'Costo Financiero Total (CFT)'}
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      La 1ra cuota se abona al suscribirse. La 2da cuota vence el día 10 posterior a los 30 días de suscripción.
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-4xl font-black text-primary">
                      {(((totalPlanSum - capitalTotal) / capitalTotal) * 100).toFixed(2)}%
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Carga Total del Plan</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {isAlreadyMember ? 'Tu Plan de' : 'Proyección de'} {totalCuotas} Cuotas
              </CardTitle>
              <CardDescription>Seguro de vida decreciente según saldo de capital puro.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full pr-4">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="font-bold">Cuota</TableHead>
                      <TableHead className="font-bold">Saldo Capital Puro</TableHead>
                      <TableHead className="font-bold">Total Mensual</TableHead>
                      <TableHead className="font-bold text-right">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst) => (
                      <TableRow key={inst.num} className="hover:bg-accent/10 transition-colors">
                        <TableCell className="font-bold">#{inst.num}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatCurrency(inst.saldoCapitalPuro)}</TableCell>
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
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                                  <span className="text-sm font-medium">Alícuota Pura (Capital)</span>
                                  <span className="font-bold">{formatCurrency(alicuotaPura)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">Gastos Administrativos</span>
                                    <span className="text-[10px] text-muted-foreground">{(adminRate * 100).toFixed(1)}% de la alícuota</span>
                                  </div>
                                  <span className="font-bold">{formatCurrency(adminFeeMensual)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">Seguro de Vida</span>
                                    <span className="text-[10px] text-muted-foreground">{(lifeInsRate * 100).toFixed(2)}% sobre saldo puro { formatCurrency(inst.saldoCapitalPuro) }</span>
                                  </div>
                                  <span className="font-bold">{formatCurrency(adminFeeMensual)}</span>
                                </div>
                                {inst.currentSubFee > 0 && (
                                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-primary">Derecho de Suscripción</span>
                                      <span className="text-[10px] text-primary/70">Prorrateo {inst.num} de {installmentsWithSubFee} cuotas</span>
                                    </div>
                                    <span className="font-bold text-primary">{formatCurrency(inst.currentSubFee)}</span>
                                  </div>
                                )}
                                <div className="border-t pt-4 flex justify-between items-center">
                                  <span className="text-lg font-bold">Total Mensual</span>
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
          <Card className={`border-none shadow-xl ${isAlreadyMember ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'} sticky top-8 transition-colors`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {isAlreadyMember ? <CheckCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                {isAlreadyMember ? 'Membresía Activa' : 'Suscripción en USD'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className={`flex justify-between items-center text-sm p-3 rounded-xl ${isAlreadyMember ? 'bg-white/50' : 'bg-white/10'}`}>
                  <span className="font-medium">Abono Inicial (1ra Cuota)</span>
                  <span className="font-bold text-lg">{formatCurrency(installments[0].currentTotal)}</span>
                </div>
                <div className={`flex justify-between items-center text-sm p-3 rounded-xl ${isAlreadyMember ? 'bg-white/50' : 'bg-white/10'}`}>
                  <span className="font-medium">Capital a Adjudicar</span>
                  <span className="font-bold text-lg">{formatCurrency(capitalTotal)}</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl text-[10px] leading-relaxed ${isAlreadyMember ? 'bg-white/50 text-muted-foreground' : 'bg-white/10 text-white/80'}`}>
                <p><strong>Nota:</strong> Al suscribirse se abona la primera cuota. Las cuotas subsiguientes vencen los días 10 de cada mes, siempre que hayan transcurrido al menos 30 días desde la suscripción.</p>
              </div>

              <Button 
                variant={isAlreadyMember ? "outline" : "secondary"}
                className="w-full h-14 text-lg font-bold shadow-lg"
                onClick={handleSubscribe}
                disabled={isSubscribing || (circle.currentMemberCount || 0) >= circle.memberCapacity || isAlreadyMember}
              >
                {isSubscribing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isAlreadyMember ? (
                  'Ya eres miembro'
                ) : (circle.currentMemberCount || 0) >= circle.memberCapacity ? (
                  'Círculo Completo'
                ) : (
                  'Abonar 1ra Cuota y Unirme'
                )}
              </Button>
              {isAlreadyMember && (
                <p className="text-xs text-center font-medium animate-in fade-in slide-in-from-top-2">
                  Puedes gestionar tu plan en la sección "Mis Círculos"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
