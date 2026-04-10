
'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, ShieldCheck, TrendingUp, Users, Info, Loader2, DollarSign, Calendar, Lock, Unlock, Clock, CheckCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, increment, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  const membershipQuery = useMemoFirebase(() => {
    if (!db || !user || !params.id) return null;
    return query(
      collection(db, 'users', user.uid, 'saving_circle_memberships'),
      where('savingCircleId', '==', params.id as string)
    );
  }, [db, user, params.id]);

  const { data: existingMemberships, isLoading: membershipCheckLoading } = useCollection(membershipQuery);
  const isAlreadyMember = !!(existingMemberships && existingMemberships.length > 0);
  const membership = existingMemberships?.[0];
  const paidCount = membership?.paidInstallmentsCount || 0;

  useEffect(() => {
    if (circle && circle.isPrivate) {
      setIsLocked(true);
    }
  }, [circle]);

  const handleUnlock = () => {
    if (passwordInput === circle?.password) {
      setIsLocked(false);
      toast({ title: "Acceso Concedido" });
    } else {
      toast({ title: "Error", description: "Contraseña incorrecta.", variant: "destructive" });
    }
  };

  const handleDownloadReceipt = (num: number) => {
    toast({ title: "Generando recibo...", description: `Descarga de Cuota #${num} en proceso.` });
    setTimeout(() => {
      toast({ title: "Descarga completada", description: `Recibo_Cuota_${num}_${circle?.id}.pdf` });
    }, 2000);
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
          <p className="text-muted-foreground">Este grupo requiere contraseña para ver la proyección financiera.</p>
        </div>
        <div className="w-full space-y-4">
          <Input type="password" placeholder="Ingrese la contraseña" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlock()} className="text-center h-12 text-lg" />
          <Button onClick={handleUnlock} className="w-full h-12 text-lg font-bold gap-2"><Unlock className="h-5 w-5" /> Desbloquear Plan</Button>
          <Button asChild variant="ghost" className="w-full"><Link href="/explore">Volver a Explorar</Link></Button>
        </div>
      </div>
    );
  }

  const IVA_RATE = 1.21;
  const capitalTotal = circle.targetCapital;
  const totalCuotas = circle.totalInstallments;
  
  const alicuotaPura = capitalTotal / totalCuotas;
  
  // Cargos base
  const adminRate = circle.administrativeFeeRate || 0.10;
  const subRate = circle.subscriptionFeeRate || 0.03;
  const lifeInsRate = circle.lifeInsuranceRate || 0.0009;

  // Aplicación de IVA según configuración del círculo
  const adminFeeMensual = circle.adminVatApplied 
    ? (alicuotaPura * adminRate) * IVA_RATE 
    : (alicuotaPura * adminRate);
    
  const totalSubFee = circle.subscriptionVatApplied 
    ? (capitalTotal * subRate) * IVA_RATE 
    : (capitalTotal * subRate);

  const installmentsWithSubFee = Math.ceil(totalCuotas * 0.20);
  const proratedSubFee = totalSubFee / installmentsWithSubFee;

  const installments = Array.from({ length: totalCuotas }, (_, i) => {
    const num = i + 1;
    const currentSaldo = capitalTotal - (alicuotaPura * i);
    const rawInsurance = currentSaldo * lifeInsRate;
    const currentInsurance = circle.lifeInsuranceVatApplied ? rawInsurance * IVA_RATE : rawInsurance;
    const currentSubFee = num <= installmentsWithSubFee ? proratedSubFee : 0;
    const currentTotal = alicuotaPura + adminFeeMensual + currentInsurance + currentSubFee;
    
    return { 
      num, 
      alicuotaPura,
      adminFeeMensual,
      currentInsurance,
      currentSubFee, 
      currentTotal,
      saldoCapitalPuro: currentSaldo
    };
  });

  const totalPlanSum = installments.reduce((acc, inst) => acc + inst.currentTotal, 0);
  const cuotaPromedio = totalPlanSum / totalCuotas;

  const handleSubscribe = () => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes estar registrado para unirte.", variant: "destructive" });
      return;
    }
    if (!db) return;
    if (isAlreadyMember) return;
    if ((circle.currentMemberCount || 0) >= circle.memberCapacity) {
      toast({ title: "Círculo Completo", variant: "destructive" });
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
      paidInstallmentsCount: 1, 
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

    toast({ title: "¡Suscripción exitosa!", description: "Bienvenido al grupo." });
    setTimeout(() => router.push('/my-circles'), 1500);
  };

  const formatCurrency = (val: number) => {
    if (!mounted) return `$0.00`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/explore"><ArrowLeft className="h-5 w-5" /></Link>
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Miembros</span>
                  <div className="flex items-center gap-2 font-bold text-xl"><Users className="h-4 w-4 text-primary" /> {circle.currentMemberCount || 0}/{circle.memberCapacity}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Plazo</span>
                  <div className="flex items-center gap-2 font-bold text-xl"><Calendar className="h-4 w-4 text-primary" /> {totalCuotas} meses</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Cuota Promedio</span>
                  <div className="flex items-center gap-2 font-bold text-xl"><DollarSign className="h-4 w-4 text-primary" /> {formatCurrency(cuotaPromedio)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Carga Total</span>
                  <div className="flex items-center gap-2 font-bold text-xl text-primary">{(((totalPlanSum - capitalTotal) / capitalTotal) * 100).toFixed(2)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{isAlreadyMember ? 'Tu Plan de' : 'Proyección de'} {totalCuotas} Cuotas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full pr-4">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="font-bold">Cuota</TableHead>
                      <TableHead className="font-bold">Saldo Capital</TableHead>
                      <TableHead className="font-bold">Total Mensual</TableHead>
                      <TableHead className="font-bold text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst) => {
                      const isPaid = inst.num <= paidCount;
                      return (
                        <TableRow key={inst.num} className={cn("hover:bg-accent/10 transition-colors", isPaid && "bg-green-50/50")}>
                          <TableCell className="font-bold">#{inst.num} {isPaid && <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-none">Pagada</Badge>}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatCurrency(inst.saldoCapitalPuro)}</TableCell>
                          <TableCell className="font-bold text-primary">{formatCurrency(inst.currentTotal)}</TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="sm" className="text-xs font-bold h-7 text-primary">Detalles</Button></DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogTitle>Desglose Cuota #{inst.num}</DialogTitle>
                                <div className="space-y-4 py-4">
                                  <div className="flex justify-between p-3 bg-muted/50 rounded-xl"><span>Alícuota Pura</span> <span className="font-bold">{formatCurrency(alicuotaPura)}</span></div>
                                  <div className="flex justify-between p-3 bg-muted/50 rounded-xl"><span>Gastos Admin. {circle.adminVatApplied ? '(+IVA)' : ''}</span> <span className="font-bold">{formatCurrency(inst.adminFeeMensual)}</span></div>
                                  <div className="flex justify-between p-3 bg-muted/50 rounded-xl"><span>Seguro Vida {circle.lifeInsuranceVatApplied ? '(+IVA)' : ''}</span> <span className="font-bold">{formatCurrency(inst.currentInsurance)}</span></div>
                                  {inst.currentSubFee > 0 && <div className="flex justify-between p-3 bg-primary/10 rounded-xl border border-primary/20"><span>Derecho Suscrip. {circle.subscriptionVatApplied ? '(+IVA)' : ''}</span> <span className="font-bold text-primary">{formatCurrency(inst.currentSubFee)}</span></div>}
                                  <div className="border-t pt-4 flex justify-between"> <span className="text-lg font-bold">Total</span> <span className="text-2xl font-black text-primary">{formatCurrency(inst.currentTotal)}</span></div>
                                  {isPaid && <Button variant="outline" className="w-full gap-2 border-primary text-primary mt-4" onClick={() => handleDownloadReceipt(inst.num)}><Download className="h-4 w-4" /> Descargar Recibo</Button>}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border-none shadow-xl ${isAlreadyMember ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'} sticky top-8 transition-colors`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">{isAlreadyMember ? <CheckCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />} {isAlreadyMember ? 'Membresía Activa' : 'Suscripción'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className={`flex justify-between items-center text-sm p-3 rounded-xl ${isAlreadyMember ? 'bg-white/50' : 'bg-white/10'}`}><span>Abono Inicial</span> <span className="font-bold text-lg">{formatCurrency(installments[0].currentTotal)}</span></div>
                <div className={`flex justify-between items-center text-sm p-3 rounded-xl ${isAlreadyMember ? 'bg-white/50' : 'bg-white/10'}`}><span>Capital a Adjudicar</span> <span className="font-bold text-lg">{formatCurrency(capitalTotal)}</span></div>
              </div>
              <Button variant={isAlreadyMember ? "outline" : "secondary"} className="w-full h-14 text-lg font-bold shadow-lg" onClick={handleSubscribe} disabled={isSubscribing || (circle.currentMemberCount || 0) >= circle.memberCapacity || isAlreadyMember}>
                {isSubscribing ? <Loader2 className="animate-spin" /> : isAlreadyMember ? 'Ya eres miembro' : 'Abonar 1ra Cuota'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
