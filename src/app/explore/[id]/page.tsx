'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, ShieldCheck, TrendingUp, Users, Info, Loader2, DollarSign, Calendar, Lock, Unlock, Clock, CheckCircle, Download, HelpCircle, ShieldAlert, Fingerprint } from "lucide-react"
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
import { doc, collection, addDoc, serverTimestamp, increment, query, where, documentId } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { 
  calculatePureAlicuota, 
  calculateAdminFee, 
  calculateLifeInsurance,
  calculateSubscriptionFee,
  calculateAverageLifeInsurance
} from '@/lib/financial-logic';
import { KYCVerificationDialog } from "@/components/kyc/kyc-verification-dialog";
import { KYC_STATUS_LABELS } from "@/lib/kyc-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AdhesionContractDialog } from "@/components/legal/adhesion-contract-dialog";
import { generateReceiptPDF } from '@/lib/pdf-utils';
import { AuthDialog } from '@/components/auth/auth-dialog';

export default function CirclePlanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [personalGoal, setPersonalGoal] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle, isLoading: circleLoading } = useDoc(circleRef);
  
  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);
  const kycStatus = profile?.role === 'ceo' ? 'verified' : (profile?.kycStatus || 'not_started');
  const isVerified = kycStatus === 'verified';
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);

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

  const allMembershipsRef = useMemoFirebase(() => (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), [db, user]);
  const { data: allMemberships } = useCollection(allMembershipsRef);
  
  const allCircleIds = useMemo(() => allMemberships?.map(m => m.savingCircleId) || [], [allMemberships]);
  const allCirclesQuery = useMemoFirebase(() => {
    if (!db || allCircleIds.length === 0) return null;
    return query(collection(db, 'saving_circles'), where(documentId(), 'in', allCircleIds));
  }, [db, allCircleIds.join(',')]);
  const { data: allUserCircles } = useCollection(allCirclesQuery);

  const circleMembersQuery = useMemoFirebase(() => {
    if (!db || !params.id) return null;
    return collection(db, 'saving_circles', params.id as string, 'members');
  }, [db, params.id]);
  const { data: circleMembers } = useCollection(circleMembersQuery);

  useEffect(() => {
    // Member list hook loaded. Can be used for extra logic.
  }, [circleMembers]);

  const totalCommittedCapital = useMemo(() => {
    if (!allUserCircles) return 0;
    return allUserCircles.reduce((sum, c) => sum + (c.targetCapital || 0), 0);
  }, [allUserCircles]);

  const limitExceeded = (totalCommittedCapital + (circle?.targetCapital || 0)) > 50000;
  const [isRequestingLimit, setIsRequestingLimit] = useState(false);
  
  const handleRequestLimitExtension = () => {
    if (!db || !user) return;
    setIsRequestingLimit(true);
    
    const requestData = {
      userId: user.uid,
      userName: user.displayName || user.email,
      currentTotal: totalCommittedCapital,
      requestedCircleId: params.id,
      requestedCircleCapital: circle?.targetCapital,
      requestDate: new Date().toISOString(),
      status: 'Pending',
      createdAt: serverTimestamp(),
    };
    
    // Simulamos envío a una colección de solicitudes
    const requestsCol = collection(db, 'admin_requests');
    addDocumentNonBlocking(requestsCol, requestData);
    
    setTimeout(() => {
      setIsRequestingLimit(false);
      toast({ title: "Solicitud enviada", description: "El administrador revisará tu pedido a la brevedad." });
    }, 1500);
  };

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

  const handleDownloadReceipt = async (num: number) => {
    if (!profile || !circle) return;
    
    toast({ title: "Generando recibo...", description: "Tu documento estará listo en breve." });
    
    await generateReceiptPDF({
      userName: profile.displayName || profile.email || 'Usuario',
      circleName: circle.name,
      installmentNum: num,
      amount: installments[num-1].currentTotal,
      date: new Date().toLocaleDateString('es-ES'),
    });
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

  const isCircleActive = (circle.currentMemberCount || 0) >= circle.memberCapacity;

  const getBaseDate = () => {
    if (membership?.joiningDate) return new Date(membership.joiningDate);
    if (circle?.creationDate) return new Date(circle.creationDate);
    return new Date();
  };

  const calculateInstallmentDate = (num: number) => {
    // Si no está activo, proyectamos desde HOY + 5 días (Ventana móvil)
    const baseDate = isCircleActive ? getBaseDate() : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
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
    
    const result = new Date(candidate);
    result.setMonth(result.getMonth() + (num - 1));
    return result.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const capitalTotal = circle.targetCapital;
  const totalCuotas = circle.totalInstallments;
  
  const alicuotaPura = calculatePureAlicuota(capitalTotal, totalCuotas);
  
  const adminFeeMensual = calculateAdminFee(alicuotaPura, circle.administrativeFeeRate || 10, circle.adminVatApplied);
  const totalSubFee = calculateSubscriptionFee(capitalTotal, circle.subscriptionFeeRate || 3, circle.subscriptionVatApplied);

  const installmentsWithSubFee = Math.ceil(totalCuotas * 0.20);
  const proratedSubFee = totalSubFee / installmentsWithSubFee;

  const installments = Array.from({ length: totalCuotas }, (_, i) => {
    const num = i + 1;
    // Saldo remanente LUEGO de pagar la cuota actual
    const currentSaldo = capitalTotal - (alicuotaPura * num);
    const MathSaldo = currentSaldo < 0 ? 0 : currentSaldo;
    const currentInsurance = calculateLifeInsurance(capitalTotal, alicuotaPura, MathSaldo, circle.lifeInsuranceRate || 0.09, circle.lifeInsuranceVatApplied, true);
    const currentSubFee = num <= installmentsWithSubFee ? proratedSubFee : 0;
    const currentTotal = alicuotaPura + adminFeeMensual + currentInsurance + currentSubFee;
    
    return { 
      num, 
      date: isCircleActive ? calculateInstallmentDate(num) : null,
      alicuotaPura,
      adminFeeMensual,
      currentInsurance,
      currentSubFee, 
      currentTotal,
      saldoCapitalPuro: currentSaldo
    };
  });

  const averageLifeInsurance = calculateAverageLifeInsurance(capitalTotal, circle.lifeInsuranceRate || 0.09, circle.lifeInsuranceVatApplied);
  const totalPlanCost = capitalTotal + (totalCuotas * adminFeeMensual) + totalSubFee + (totalCuotas * averageLifeInsurance);
  const cuotaPromedio = totalPlanCost / totalCuotas;

  const handleSubscribe = () => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes estar registrado para unirte.", variant: "destructive" });
      return;
    }
    if (!isVerified) {
      toast({ 
        title: "Identidad no verificada", 
        description: "Debes completar el proceso de verificación antes de unirte a un grupo.", 
        variant: "destructive" 
      });
      setIsKYCOpen(true);
      return;
    }
    if (!db) return;
    if (isAlreadyMember) return;
    if ((circle.currentMemberCount || 0) >= circle.memberCapacity) {
      toast({ title: "Círculo Completo", variant: "destructive" });
      return;
    }
    
    setIsSubscribing(true);

    const nextOrderNumber = (circle.currentMemberCount || 0) + 1;

    const membershipData = {
      userId: user.uid,
      savingCircleId: circle.id,
      savingCircleName: circle.name,
      savingCircleAdminUserId: circle.adminUserId,
      joiningDate: new Date().toISOString(),
      status: 'Active',
      paidInstallmentsCount: 1, 
      capitalPaid: alicuotaPura,
      savingCircleCapital: circle.targetCapital, // NUEVO: Para optimizar filtros
      outstandingCapitalBalance: capitalTotal - alicuotaPura,
      adjudicationStatus: 'Pending',
      personalGoal: personalGoal.trim() || circle.name,
      orderNumber: nextOrderNumber, // Guardamos el número de orden autonumérico
      // Auditoría Legal
      contractAccepted: true,
      contractVersion: '2026-04-12',
      contractAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const userMembershipRef = doc(collection(db, 'users', user.uid, 'saving_circle_memberships'));
    setDocumentNonBlocking(userMembershipRef, { ...membershipData, id: userMembershipRef.id }, { merge: true });
    
    // Anonymized data for the shared circle list
    const anonymizedMemberData = {
      userId: user.uid,
      orderNumber: nextOrderNumber,
      status: 'Active',
      adjudicationStatus: 'Pending',
      joiningDate: membershipData.joiningDate,
      capitalPaid: alicuotaPura,
      id: userMembershipRef.id
    };
    
    const circleMemberRef = doc(db, 'saving_circles', circle.id, 'members', user.uid);
    setDocumentNonBlocking(circleMemberRef, anonymizedMemberData, { merge: true });

    const circleDocRef = doc(db, 'saving_circles', circle.id);
    updateDocumentNonBlocking(circleDocRef, { 
      currentMemberCount: increment(1),
      accumulatedCommonFund: increment(alicuotaPura)
    });

    // Registrar Log de Suscripción
    addDoc(collection(db, 'users', user.uid, 'saving_circle_memberships', userMembershipRef.id, 'logs'), {
      type: 'Subscription',
      reason: `Suscripción al grupo ${circle.name}. Pago inicial de capital: ${formatCurrency(alicuotaPura)}`,
      amountPaid: alicuotaPura,
      createdAt: new Date().toISOString()
    });

    // Auto-duplicación para grupos recurrentes
    if (circle.isRecurrent && (circle.currentMemberCount || 0) + 1 >= circle.memberCapacity) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const nums = "0123456789";
      let l = ""; for (let i = 0; i < 4; i++) l += letters[Math.floor(Math.random() * letters.length)];
      let n = ""; for (let i = 0; i < 4; i++) n += nums[Math.floor(Math.random() * nums.length)];
      const newId = l + n;

      const { id, currentMemberCount, creationDate, createdAt, ...baseConfig } = circle;
      const newCircleData = {
        ...baseConfig,
        id: newId,
        currentMemberCount: 0,
        creationDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };
      
      const newCircleRef = doc(db, 'saving_circles', newId);
      setDocumentNonBlocking(newCircleRef, newCircleData, { merge: true });
    }

    toast({ title: "¡Suscripción exitosa!", description: "Bienvenido al grupo." });
    setTimeout(() => router.push('/my-circles'), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 md:pt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/explore"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {isAlreadyMember ? 'Tu Plan de Ahorro' : 'Detalles de tu Plan'}
        </h1>
      </div>

      <div className={`grid gap-8 ${!isAlreadyMember ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        <div className={`${!isAlreadyMember ? 'lg:col-span-2' : ''} space-y-8`}>
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold text-primary">{circle.name}</CardTitle>
                  <CardDescription className="text-lg">Monto del Plan: {formatCurrency(capitalTotal)} USD</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${(circle.currentMemberCount || 0) >= circle.memberCapacity ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} border-none font-bold px-4 py-1`}>
                    {(circle.currentMemberCount || 0) >= circle.memberCapacity ? 'GRUPO LLENO' : 'ABIERTO'}
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">CFT (Costo Financiero Total)</span>
                  <div className="flex items-center gap-2 font-bold text-xl text-primary">{(((totalPlanSum - capitalTotal) / capitalTotal) * 100).toFixed(2)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{isAlreadyMember ? 'Tu' : 'Proyección de tu'} Plan de {totalCuotas} Cuotas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full pr-4">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="font-bold">Cuota</TableHead>
                      <TableHead className="font-bold">Fecha {!isCircleActive && <Badge variant="outline" className="text-[8px] h-3 px-1 ml-1 bg-blue-50 text-blue-600 border-none font-black uppercase">Estimada</Badge>}</TableHead>
                      <TableHead className="font-bold">Total del mes</TableHead>
                      <TableHead className="font-bold text-right">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst) => {
                      const isPaid = inst.num <= paidCount;
                      return (
                        <TableRow key={inst.num} className={cn("hover:bg-accent/10 transition-colors", isPaid && "bg-green-50/50")}>
                          <TableCell className="font-bold">#{inst.num} {isPaid && <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-none">Pagada</Badge>}</TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1 opacity-50" />{isCircleActive ? inst.date : calculateInstallmentDate(inst.num)}</TableCell>
                          <TableCell className="font-bold text-primary">{formatCurrency(inst.currentTotal)}</TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="sm" className="text-xs font-bold h-7 text-primary">Detalles</Button></DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogTitle>Desglose Cuota #{inst.num}</DialogTitle>
                                <div className="space-y-4 py-4">
                                  <div className="flex justify-between p-3 bg-muted/50 rounded-xl"><span>Ahorro puro</span> <span className="font-bold">{formatCurrency(alicuotaPura)}</span></div>
                                  <div className="flex justify-between p-3 bg-muted/50 rounded-xl"><span>Gastos de gestión ({(adminRate * 100).toFixed(1)}% {circle.adminVatApplied ? '+ IVA' : ''})</span> <span className="font-bold">{formatCurrency(inst.adminFeeMensual)}</span></div>
                                  <div className="flex justify-between p-3 bg-muted/50 rounded-xl"><span>Seguro de vida ({(lifeInsRate * 100).toFixed(3)}% {circle.lifeInsuranceVatApplied ? '+ IVA' : ''})</span> <span className="font-bold">{formatCurrency(inst.currentInsurance)}</span></div>
                                  {inst.currentSubFee > 0 && <div className="flex justify-between p-3 bg-primary/10 rounded-xl border border-primary/20"><span>Derecho de suscripción ({(subRate * 100).toFixed(1)}% {circle.subscriptionVatApplied ? '+ IVA' : ''}) • Cuota {inst.num} de {installmentsWithSubFee}</span> <span className="font-bold text-primary">{formatCurrency(inst.currentSubFee)}</span></div>}
                                  <div className="border-t pt-4 flex justify-between"> <span className="text-lg font-bold">Cuota Total</span> <span className="text-2xl font-black text-primary">{formatCurrency(inst.currentTotal)}</span></div>
                                  {isPaid && <Button variant="outline" className="w-full gap-2 border-primary text-primary mt-4" onClick={() => handleDownloadReceipt(inst.num)}><Download className="h-4 w-4" /> Bajar Recibo</Button>}
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

        {isAlreadyMember ? (
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-primary text-white sticky top-8 transition-colors overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-10">
                  <ShieldCheck className="h-24 w-24" />
               </div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" /> Ya eres Miembro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <p className="text-sm leading-relaxed opacity-90">
                  Este plan ya forma parte de tu cartera de ahorros. Para realizar pagos, licitar o ver tu proyección detallada, ve a tu panel personal.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full h-14 text-lg font-bold shadow-lg hover:scale-[1.02] transition-transform active:scale-95" 
                  asChild
                >
                  <Link href="/my-circles">Ir a Mis Círculos</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-primary text-white sticky top-8 transition-colors">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6" /> Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/10"><span>Primera Cuota</span> <span className="font-bold text-lg">{formatCurrency(installments[0].currentTotal)}</span></div>
                  <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/10"><span>Monto a recibir</span> <span className="font-bold text-lg">{formatCurrency(capitalTotal)}</span></div>
                </div>


                {!limitExceeded && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80">Identificá tu Plan (Ej: Mi Meta)</label>
                    <Input 
                      placeholder="Ej: Ahorro para mis vacaciones / Ford Fiesta" 
                      value={personalGoal} 
                      onChange={(e) => setPersonalGoal(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                    />
                    <p className="text-[10px] text-white/60 italic leading-tight">
                      * Este nombre es privado y solo lo verás vos en tu panel para organizar tus ahorros.
                    </p>
                  </div>
                )}

                {(!user || user.isAnonymous) ? (
                  <AuthDialog 
                    defaultMode="register"
                    shouldRedirect={false}
                    trigger={
                      <Button 
                        variant="secondary" 
                        className="w-full h-14 text-lg font-bold shadow-lg" 
                      >
                        Unirme al Grupo
                      </Button>
                    }
                  />
                ) : !isVerified ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-center space-y-2">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Estado de Identidad</p>
                       <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
                          {kycStatus === 'pending' ? <Clock className="h-4 w-4 text-orange-400" /> : <ShieldAlert className="h-4 w-4 text-red-400" />}
                          {KYC_STATUS_LABELS[kycStatus] || 'Pendiente de Verificación'}
                       </div>
                       <p className="text-[9px] text-white/50 leading-tight">Debes validar tus datos personales para habilitar los pagos de capital.</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full h-14 text-lg font-bold shadow-lg gap-2 animate-pulse hover:animate-none" 
                      onClick={() => setIsKYCOpen(true)}
                    >
                      <Fingerprint className="h-5 w-5" />
                      {kycStatus === 'rejected' ? 'Re-Intentar Verificación' : 'Verificar mi Identidad'}
                    </Button>
                  </div>
                ) : (
                    <Button 
                      variant={limitExceeded ? "ghost" : "secondary"} 
                      className="w-full h-14 text-lg font-bold shadow-lg" 
                      onClick={() => setIsContractOpen(true)} 
                      disabled={isSubscribing || (circle.currentMemberCount || 0) >= circle.memberCapacity || limitExceeded}
                    >
                      {isSubscribing ? <Loader2 className="animate-spin" /> : 
                       limitExceeded ? 'Límite Excedido' : 'Unirme al Grupo'}
                    </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <KYCVerificationDialog 
        open={isKYCOpen} 
        onOpenChange={setIsKYCOpen} 
      />

      <AdhesionContractDialog
        open={isContractOpen}
        onOpenChange={setIsContractOpen}
        onConfirm={() => {
          setIsContractOpen(false);
          handleSubscribe();
        }}
        circleName={circle.name}
        circle={circle}
        userProfile={profile}
        isSubmitting={isSubscribing}
      />
    </div>
  );
}
