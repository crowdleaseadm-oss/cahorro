
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp,
  PiggyBank, 
  ArrowRight, 
  Target, 
  Calendar, 
  DollarSign, 
  Activity, 
  Gavel, 
  Loader2, 
  Info, 
  Clock, 
  Flame, 
  History, 
  AlertTriangle, 
  RotateCcw, 
  UserMinus,
  CheckCircle2,
  Trophy,
  FastForward,
  CircleDollarSign,
  MessageSquare,
  MessageCircle,
  ShieldHalf,
  Download,
  TrendingDown,
  XCircle,
  Calculator
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { formatNumber, formatCurrency, cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, where, documentId, getDocs, deleteDoc, increment, setDoc, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { sendNotification } from '@/services/messenger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GroupChat } from '@/components/chat/group-chat';
import { updateDoc } from 'firebase/firestore';
import { 
  calculatePureAlicuota, 
  calculateAdminFee, 
  calculateLifeInsurance,
  calculateSubscriptionFee,
  calculateMoraInterest
} from '@/lib/financial-logic';

function LiveBidLeaderboard({ db, circleId, maxPossible }: { db: any, circleId: string, maxPossible: number }) {
  const bidsQuery = useMemoFirebase(() => {
    if (!db || !circleId) return null;
    return query(collection(db, 'saving_circles', circleId, 'bids'), where('status', '==', 'Pending'));
  }, [db, circleId]);

  const { data: bids } = useCollection(bidsQuery);

  if (!bids || bids.length === 0) return null;

  // Encontrar el mayor ofertante
  const maxBid = bids.reduce((prev: any, current: any) => {
    // Si la cantidad de cuotas es mayor, u ofrecieron igual pero este es más viejo
    if ((current.installmentsOffered || 0) > (prev.installmentsOffered || 0)) {
      return current;
    }
    return prev;
  }, { installmentsOffered: 0 });

  if (!maxBid || maxBid.installmentsOffered === 0) return null;

  const displayInstallments = Math.min(maxBid.installmentsOffered, maxPossible);

  return (
    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-orange-50 border border-orange-200/50 rounded-xl text-orange-700 w-fit animate-in fade-in slide-in-from-bottom-2">
      <Flame className="h-4 w-4 animate-pulse" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Subasta en Vivo:</span>
      <span className="text-sm font-black">{displayInstallments} cuotas</span>
      <span className="text-[10px] opacity-70 ml-1">lidera</span>
    </div>
  );
}

export default function MyCirclesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isBidding, setIsBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState(1);
  const [bidMethod, setBidMethod] = useState<'own' | 'deduct'>('own');
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedLogMembership, setSelectedLogMembership] = useState<any>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isProcessingBaja, setIsProcessingBaja] = useState(false);
  const [selectedAdelantoMembership, setSelectedAdelantoMembership] = useState<any>(null);
  const [isAdelantoOpen, setIsAdelantoOpen] = useState(false);
  const [adelantoQty, setAdelantoQty] = useState(1);
  const [isProcessingAdelanto, setIsProcessingAdelanto] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatMembership, setSelectedChatMembership] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const membershipsRef = useMemoFirebase(() => (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), [db, user]);
  const { data: memberships, isLoading: membershipsLoading } = useCollection(membershipsRef);

  const circleIds = useMemo(() => memberships?.map(m => m.savingCircleId) || [], [memberships]);
  const circlesQuery = useMemoFirebase(() => {
    if (!db || circleIds.length === 0) return null;
    return query(collection(db, 'saving_circles'), where(documentId(), 'in', circleIds));
  }, [db, circleIds.join(',')]);
  const { data: circles, isLoading: circlesLoading } = useCollection(circlesQuery);

  // Filtrar solo membresías de grupos que todavía existen
  const validMemberships = useMemo(() => {
    if (!memberships) return [];
    if (!circles && !circlesLoading) return [];
    if (!circles) return memberships; // Mientras carga, mostramos lo que hay
    return memberships.filter(m => circles.some(c => c.id === m.savingCircleId));
  }, [memberships, circles, circlesLoading]);

  const calculateNextInstallmentDate = (joiningDateStr: string, paidCount: number, isActive: boolean) => {
    const baseDate = isActive && joiningDateStr ? new Date(joiningDateStr) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const minDateForSecond = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let candidate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    
    while (true) {
        if (candidate.getDate() < 5) candidate.setDate(5);
        else if (candidate.getDate() < 20) candidate.setDate(20);
        else {
            candidate.setMonth(candidate.getMonth() + 1);
            candidate.setDate(5);
        }
        if (candidate.getTime() >= minDateForSecond.getTime()) break;
    }
    
    const result = new Date(candidate);
    const nextQuotaNum = Math.max(1, paidCount + 1);
    result.setMonth(result.getMonth() + (nextQuotaNum - 1));
    return result;
  };

  const calculateNetPrizeForBid = (circle: any, membership: any, bidQty: number, method: string) => {
    if (!circle || !membership) return { netPrize: 0, suretyBond: 0, pendingSubFeeAmount: 0, bidGrossValue: 0, bidCommission: 0 };
    const capitalTotal = circle.targetCapital;
    const totalCuotas = circle.totalInstallments;
    const paidCount = membership.paidInstallmentsCount || 0;
    
    const alicuotaPura = calculatePureAlicuota(capitalTotal, totalCuotas);
    
    // 1. Suscripción pendiente
    const subRate = circle.subscriptionFeeRate || 3;
    const totalSubFee = calculateSubscriptionFee(capitalTotal, subRate, circle.subscriptionVatApplied);
    const installmentsWithSubFee = Math.ceil(totalCuotas * 0.20);
    const proratedSubFee = totalSubFee / installmentsWithSubFee;
    const pendingSubFeesCount = Math.max(0, installmentsWithSubFee - paidCount);
    const pendingSubFeeAmount = pendingSubFeesCount * proratedSubFee;

    const remainingInstallments = Math.max(0, totalCuotas - paidCount - bidQty);
    
    const adminRate = circle.administrativeFeeRate || 10;
    const adminFeeMensual = calculateAdminFee(alicuotaPura, adminRate, circle.adminVatApplied);

    // Saldo remanente total omitiendo seguro de vida (se paga aparte mes a mes)
    const remainingConceptsSum = remainingInstallments * (alicuotaPura + adminFeeMensual);
    // El seguro de caución suele ser un % fijo del saldo (ej 3%) o una tasa.
    // El usuario mencionó 3% para licitación plus. Para caución usaremos 3% por ahora.
    const suretyBond = remainingConceptsSum * 0.03;

    const bidGrossValue = bidQty * alicuotaPura;
    const bidCommRate = circle.bidCommissionRate || 3;
    const bidCommission = method === 'deduct' ? (bidGrossValue * (bidCommRate / 100) * 1.21) : 0;
    const deductionValue = method === 'deduct' ? bidGrossValue : 0;

    const netPrize = capitalTotal - deductionValue - bidCommission - pendingSubFeeAmount - suretyBond;

    return { netPrize, suretyBond, pendingSubFeeAmount, bidGrossValue, bidCommission };
  };

  const calculateAdelantoData = (circle: any, membership: any, qty: number) => {
    if (!circle || !membership || qty <= 0) return { totalPay: 0, totalSavings: 0 };
    
    const capitalTotal = circle.targetCapital;
    const totalCuotas = circle.totalInstallments;
    const paidCount = membership.paidInstallmentsCount || 0;
    const alicuotaPura = calculatePureAlicuota(capitalTotal, totalCuotas);
    
    const subRate = circle.subscriptionFeeRate || 3;
    const totalSubFee = calculateSubscriptionFee(capitalTotal, subRate, circle.subscriptionVatApplied);
    const installmentsWithSubFee = Math.ceil(totalCuotas * 0.20);
    const proratedSubFee = totalSubFee / installmentsWithSubFee;
    
    const adminRate = circle.administrativeFeeRate || 10;
    const adminFeeMensual = calculateAdminFee(alicuotaPura, adminRate, circle.adminVatApplied);

    let totalPay = 0;
    let totalSavings = 0;

    for (let i = 0; i < qty; i++) {
      const installmentNum = totalCuotas - i;
      if (installmentNum <= paidCount) break;

      const currentInsurance = calculateLifeInsurance(
        capitalTotal, 
        alicuotaPura, 
        installmentNum - 1, // Balance after paying installmentNum-1
        circle.lifeInsuranceRate || 0.09, 
        circle.lifeInsuranceVatApplied
      );

      const currentSubFee = installmentNum <= installmentsWithSubFee ? proratedSubFee : 0;
      
      totalPay += alicuotaPura;
      totalSavings += (adminFeeMensual + currentInsurance + currentSubFee);
    }

    return { totalPay, totalSavings };
  };

  const handlePlaceBid = async () => {
    if (!db || !user || !selectedMembership) return;
    setIsBidding(true);

    try {
      const circle = circles?.find(c => c.id === selectedMembership.savingCircleId);
      const alicuota = calculatePureAlicuota(circle?.targetCapital || 0, circle?.totalInstallments || 84);
      const bidNominalValue = bidAmount * alicuota;
      const bidCommRate = circle?.bidCommissionRate || 3;
      const bidCommission = bidMethod === 'deduct' ? (bidNominalValue * (bidCommRate / 100) * 1.21) : 0;

      // 1. Verificar líder actual para evitar duplicados y validar liderazgo
      const bidsCol = collection(db, 'saving_circles', selectedMembership.savingCircleId, 'bids');
      const qPending = query(bidsCol, where('status', '==', 'Pending'));
      const pendingSnap = await getDocs(qPending);
      
      const pendingBids = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const currentLeader = pendingBids.reduce((prev: any, curr: any) => 
        (curr.installmentsOffered > prev.installmentsOffered) ? curr : prev, 
        { installmentsOffered: 0 }
      );

      const requiredMin = currentLeader.userId === user.uid ? currentLeader.installmentsOffered : currentLeader.installmentsOffered + 1;

      if (Number(bidAmount) < requiredMin) {
        toast({ 
          title: "Oferta insuficiente", 
          description: `La licitación es una subasta pública a viva voz. Debes ofrecer al menos ${requiredMin} cuotas para liderar.`, 
          variant: "destructive" 
        });
        setIsBidding(false);
        return;
      }

      const bidData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        savingCircleId: selectedMembership.savingCircleId,
        membershipId: selectedMembership.id,
        installmentsOffered: Number(bidAmount),
        pureQuotaValue: pureQuotaValue,
        amountInUsd: bidNominalValue,
        bidMethod: bidMethod,
        commission: bidCommission,
        bidDate: new Date().toISOString(),
        status: 'Pending',
        createdAt: serverTimestamp(),
      };

      // 2. Si soy el nuevo líder, anular las anteriores y notificar
      if (Number(bidAmount) > currentLeader.installmentsOffered) {
        for (const oldBid of pendingBids) {
          if (oldBid.userId !== user.uid) {
            const oldRef = doc(db, 'saving_circles', selectedMembership.savingCircleId, 'bids', oldBid.id);
            updateDocumentNonBlocking(oldRef, { status: 'Annulled' });
            
            // Notificar al usuario superado
            const userSnap = await getDocs(query(collection(db, 'users'), where(documentId(), '==', oldBid.userId)));
            const userData = userSnap.docs[0]?.data();
            
            sendNotification(db, {
              userId: oldBid.userId,
              title: 'Oferta Superada',
              message: `Tu oferta en ${circle?.name || 'el grupo'} ha sido superada. Ya no eres el líder de la puja.`,
              circleId: selectedMembership.savingCircleId,
              type: 'bid_superceded'
            }, userData?.phoneNumber);
          } else {
            // Si es mi propia puja vieja, la marcamos como reemplazada
            const oldRef = doc(db, 'saving_circles', selectedMembership.savingCircleId, 'bids', oldBid.id);
            updateDocumentNonBlocking(oldRef, { status: 'Replaced' });
          }
        }
      }

      addDocumentNonBlocking(bidsCol, bidData);
      
      if (user && selectedMembership.id) {
        const membershipRef = doc(db, 'users', user.uid, 'saving_circle_memberships', selectedMembership.id);
        updateDocumentNonBlocking(membershipRef, { 
          hasPendingBid: true, 
          pendingBidInstallments: Number(bidAmount),
          pendingBidMethod: bidMethod 
        });

        // Registrar Log de Oferta
        addDoc(collection(db, 'users', user.uid, 'saving_circle_memberships', selectedMembership.id, 'logs'), {
          type: 'BidPlacement',
          reason: `Oferta de licitación enviada: ${bidAmount} cuotas (${formatCurrency(bidAmount * pureQuotaValue)}). Método: ${bidMethod === 'own' ? 'Capital propio' : 'Deducible del premio'}.`,
          bidAmount: bidAmount,
          bidValue: bidAmount * pureQuotaValue,
          bidMethod: bidMethod,
          createdAt: new Date().toISOString()
        });
      }

      toast({ title: "Licitación Registrada", description: Number(bidAmount) > currentLeader.installmentsOffered ? "¡Ahora eres el nuevo líder!" : "Tu oferta ha sido guardada." });

      setTimeout(() => {
        setIsBidding(false);
        setSelectedMembership(null);
        setBidAmount(1);
        setBidMethod('own');
      }, 800);

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setIsBidding(false);
    }
  };

  const handlePlaceBidClick = () => {
    if (window.confirm("ATENCIÓN: Si retiras tu oferta siendo el líder, se te penalizará con el 2% del capital ofertado. Este fondo se sorteará íntegramente entre los socios al finalizar el plan.")) {
      handlePlaceBid();
    }
  };

  const handleRemoveBid = async () => {
    if (!db || !user || !selectedMembership) return;
    
    setIsBidding(true);
    try {
      const bidsCol = collection(db, 'saving_circles', selectedMembership.savingCircleId, 'bids');
      const qPending = query(bidsCol, where('status', '==', 'Pending'));
      const pendingSnap = await getDocs(qPending);
      
      const pendingBids = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const currentLeader = pendingBids.reduce((prev: any, curr: any) => 
        (curr.installmentsOffered > prev.installmentsOffered) ? curr : prev, 
        { installmentsOffered: 0 }
      );

      const isLeader = currentLeader.userId === user.uid;

      if (isLeader) {
        if (!window.confirm("ADVERTENCIA: Eres el líder actual. Al retirar la oferta se aplicará una penalidad del 2% del monto ofertado que se destinará al beneficio de los socios. ¿Deseas continuar?")) {
          setIsBidding(false);
          return;
        }
      } else {
        if (!window.confirm("¿Deseas retirar tu oferta? (Al no ser líder, no aplicará penalidad física inmediata pero tu puja ya no participará).")) {
          setIsBidding(false);
          return;
        }
      }

      const userBid = pendingBids.find(b => b.userId === user.uid);
      if (userBid) {
        const bidRef = doc(db, 'saving_circles', selectedMembership.savingCircleId, 'bids', userBid.id);
        updateDocumentNonBlocking(bidRef, { status: 'Withdrawn', withdrawnAt: new Date().toISOString() });
        
        if (isLeader) {
          const penalty = (userBid.amountInUsd || 0) * 0.02;
          const circleRef = doc(db, 'saving_circles', selectedMembership.savingCircleId);
          updateDocumentNonBlocking(circleRef, { accumulatedPenaltyFund: increment(penalty) });
          
          toast({ title: "Oferta Retirada con Penalidad", description: `Se han registrado ${formatCurrency(penalty)} para el fondo de socios.` });

          // Registrar Log de Retiro de Oferta
          addDoc(collection(db, 'users', user.uid, 'saving_circle_memberships', selectedMembership.id, 'logs'), {
            type: 'BidRemoval',
            reason: `Retiro de oferta líder. Penalización aplicada del 2%: ${formatCurrency(penalty)}.`,
            penaltyAmount: penalty,
            createdAt: new Date().toISOString()
          });
        } else {
          toast({ title: "Oferta Retirada", description: "Tu licitación fue cancelada correctamente." });
          
          // Registrar Log de Retiro de Oferta
          addDoc(collection(db, 'users', user.uid, 'saving_circle_memberships', selectedMembership.id, 'logs'), {
            type: 'BidRemoval',
            reason: 'Retiro de oferta no líder.',
            createdAt: new Date().toISOString()
          });
        }
      }
      
      const membershipRef = doc(db, 'users', user.uid, 'saving_circle_memberships', selectedMembership.id);
      updateDocumentNonBlocking(membershipRef, { 
        hasPendingBid: false, 
        pendingBidInstallments: null,
        pendingBidMethod: null,
      });

    } catch (e) {
      toast({ title: "Error", description: "No se pudo retirar la oferta.", variant: "destructive" });
    } finally {
      setIsBidding(false);
      setSelectedMembership(null);
    }
  };
  const handleWithdrawalRequest = async (membership: any) => {
    if (!db || !user) return;
    
    setIsProcessingBaja(true);
    try {
      const userRef = doc(db, 'users', user.uid, 'saving_circle_memberships', membership.id);
      const circleRef = doc(db, 'saving_circles', membership.savingCircleId, 'members', user.uid);
      
      const updateData = { status: 'WithdrawalRequested' };
      
      // Cambiamos a await para capturar el error inmediatamente
      await Promise.all([
        setDoc(userRef, updateData, { merge: true }),
        setDoc(circleRef, updateData, { merge: true })
      ]);

      // Registrar Log de Baja
      addDoc(collection(db, 'users', user.uid, 'saving_circle_memberships', membership.id, 'logs'), {
        type: 'WithdrawalRequested',
        reason: 'Solicitud de baja del plan enviada por el usuario.',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Baja Solicitada", description: "Tu solicitud está siendo revisada por la administración." });
    } catch (e: any) {
      console.error("Error al pedir baja:", e);
      toast({ 
        title: "Error de Permisos", 
        description: "No se pudo procesar la solicitud. Verifica que tu sesión esté activa.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessingBaja(false);
    }
  };

  const handleCancelWithdrawal = async (membership: any) => {
    if (!db || !user) return;

    setIsProcessingBaja(true);
    try {
      const userRef = doc(db, 'users', user.uid, 'saving_circle_memberships', membership.id);
      const circleRef = doc(db, 'saving_circles', membership.savingCircleId, 'members', user.uid);
      
      const updateData = { status: 'Active' };
      
      // Cambiamos a await para capturar el error inmediatamente
      await Promise.all([
        setDoc(userRef, updateData, { merge: true }),
        setDoc(circleRef, updateData, { merge: true })
      ]);

      // Registrar Log de Anulación de Baja
      addDoc(collection(db, 'users', user.uid, 'saving_circle_memberships', membership.id, 'logs'), {
        type: 'WithdrawalCancelled',
        reason: 'Solicitud de baja anulada por el propio usuario.',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Baja Anulada", description: "Tu plan ha sido restaurado exitosamente." });
    } catch (e: any) {
      console.error("Error al anular baja:", e);
      toast({ 
        title: "Error al Anular", 
        description: "No se pudo anular la solicitud. Intenta cerrar sesión y volver a entrar.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessingBaja(false);
    }
  };

  const handlePlaceAdelanto = async () => {
    if (!db || !user || !selectedAdelantoMembership) return;
    setIsProcessingAdelanto(true);

    try {
      const circle = circles?.find(c => c.id === selectedAdelantoMembership.savingCircleId);
      const { totalPay, totalSavings } = calculateAdelantoData(circle, selectedAdelantoMembership, adelantoQty);

      // Registrar el adelanto en el Ledger (esto también actualiza capitalPaid e incrementa Common Fund)
      await recordMemberTransaction(
        db,
        user.uid,
        selectedAdelantoMembership.id,
        'AdelantoCuotas',
        totalPay,
        {
          description: `Adelanto de ${adelantoQty} cuotas (desde la última hacia atrás). Ahorro: ${formatCurrency(totalSavings)}.`,
          circleId: selectedAdelantoMembership.savingCircleId,
          performedBy: user.uid,
          qty: adelantoQty,
          savings: totalSavings
        }
      );

      // El common fund se actualiza aparte del capital del socio
      await updateDoc(doc(db, 'saving_circles', selectedAdelantoMembership.savingCircleId), {
        accumulatedCommonFund: increment(totalPay)
      });

      toast({ 
        title: "¡Adelanto Exitoso!", 
        description: `Has adelantado ${adelantoQty} cuotas ahorrando ${formatCurrency(totalSavings)}. Tu plan ahora es más corto.` 
      });

      setIsAdelantoOpen(false);
      setSelectedAdelantoMembership(null);
    } catch (e: any) {
      console.error("Error al adelantar cuotas:", e);
      toast({ title: "Error", description: "No se pudo procesar el adelanto.", variant: "destructive" });
    } finally {
      setIsProcessingAdelanto(false);
    }
  };

  if (membershipsLoading || (circleIds.length > 0 && circlesLoading)) return (
    <div className="p-10 text-center flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p>Cargando tus planes...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PiggyBank className="h-8 w-8 text-primary" />
            Mis Grupos
          </h1>
          <p className="text-muted-foreground mt-1">Seguí tus cuotas y tus planes cobrados.</p>
        </div>
      </div>

      {(validMemberships.length === 0) ? (
        <Card className="border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center p-16 text-center rounded-3xl">
          <Activity className="h-16 w-16 text-muted-foreground mb-6 opacity-20" />
          <h3 className="text-xl font-bold">Aún no tenés planes activos</h3>
          <p className="text-muted-foreground mb-8 max-w-md">Elegí un grupo para empezar tu plan de ahorro.</p>
          <Button asChild size="lg" className="rounded-xl shadow-lg">
            <Link href="/explore">Elegí tu Plan</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 max-w-5xl mx-auto">
          {validMemberships.map((membership) => {
            const circle = circles?.find(c => c.id === membership.savingCircleId);
            const isCircleActive = circle && (circle.currentMemberCount || 0) >= circle.memberCapacity;
            const nextPayDate = calculateNextInstallmentDate(membership.joiningDate, membership.paidInstallmentsCount || 0, isCircleActive);
            
            // Lógica de cierre: 5 días después del vencimiento a las 00:00 hs
            const biddingCloseDate = nextPayDate ? new Date(nextPayDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null;
            if (biddingCloseDate) biddingCloseDate.setHours(0, 0, 0, 0);
            
            const now = new Date();
            const isBiddingClosed = biddingCloseDate ? now >= biddingCloseDate : false;
            const isEvaluationPeriod = biddingCloseDate ? (now >= biddingCloseDate && now.getTime() < biddingCloseDate.getTime() + 48 * 60 * 60 * 1000) : false;

            const progress = circle ? ((circle.currentMemberCount || 0) / circle.memberCapacity) * 100 : 0;
            const bidLimits = isCircleActive ? calculateNetPrizeForBid(circle, membership, bidAmount, bidMethod) : null;
            const isInvalidDeductBid = bidMethod === 'deduct' && (bidLimits?.netPrize || 0) <= 0;

            return (
              <Card key={membership.id} className="border-none shadow-sm h-full overflow-hidden bg-white rounded-3xl">
                <div className="grid md:grid-cols-12 h-full">
                  <div className="md:col-span-3 bg-accent/20 p-6 flex flex-col justify-between border-r border-border">
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <Badge className={`${isCircleActive ? 'bg-green-600' : 'bg-orange-500'} text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-widest w-fit`}>
                          {isCircleActive ? 'Grupo Activo' : 'En Formación'}
                        </Badge>
                        {isBiddingClosed && (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] w-fit">
                            LICITACIONES CERRADAS
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-foreground leading-none tracking-tight">
                          {membership.personalGoal || membership.savingCircleName}
                        </h2>
                        <div className="flex flex-col gap-1 mt-3">
                          <span className="text-xl font-black text-primary">
                            Fondo: {membership.savingCircleName}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-60">
                            <span>ID: {membership.savingCircleId}</span>
                            <span className="text-primary/40">•</span>
                            <span className="flex items-center gap-1">
                              N° ORDEN: <b className="text-primary text-xs">{membership.orderNumber ? membership.orderNumber.toString().padStart(2, '0') : '--'}</b>
                            </span>
                          </div>
                        </div>
                        {isCircleActive && !isBiddingClosed && (
                          <LiveBidLeaderboard db={db} circleId={membership.savingCircleId} maxPossible={(circle?.totalInstallments || 1) - (membership.paidInstallmentsCount || 1)} />
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-primary/5 flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Participar en Chat</span>
                        <span className="text-[9px] text-muted-foreground">Conversá con tu grupo</span>
                      </div>
                      <Switch 
                        checked={membership.chatEnabled !== false} 
                        onCheckedChange={async (val) => {
                          if (!db || !user) return;
                          const ref = doc(db, 'users', user.uid, 'saving_circle_memberships', membership.id);
                          await updateDoc(ref, { chatEnabled: val });
                          toast({ title: val ? "Chat Activado" : "Chat Desactivado" });
                        }}
                        className="data-[state=checked]:bg-secondary"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-9 p-6 flex flex-col justify-between">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 mb-6">
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
                        <div className={`flex items-center gap-2 font-bold text-xl ${isCircleActive ? 'text-primary' : 'text-blue-600'}`}>
                          <Clock className="h-5 w-5" />
                          {nextPayDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          {!isCircleActive && <Badge variant="outline" className="text-[8px] h-4 bg-blue-50 text-blue-600 border-none px-1 uppercase font-black">Est.</Badge>}
                        </div>
                        {isCircleActive && biddingCloseDate && (
                          <div className="flex flex-col mt-2 gap-1">
                            <span className="text-[9px] font-bold text-orange-600 uppercase tracking-tight flex items-center gap-1">
                              <Gavel className="h-3 w-3" /> Cierre Subasta: {format(biddingCloseDate, 'dd/MM HH:mm')}
                            </span>
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight flex items-center gap-1">
                              <Trophy className="h-3 w-3" /> Sorteo Quiniela: {format(biddingCloseDate, 'dd/MM')} (Vespertina)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cuotas Pagas</span>
                        <div className="flex items-center gap-2 font-bold text-xl">
                          <Target className="h-5 w-5 text-primary" />
                          {membership.paidInstallmentsCount} / {circle?.totalInstallments || '--'}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado del Plan</span>
                        <div>
                          <Badge variant="outline" className={membership.adjudicationStatus === 'Adjudicated' ? "bg-green-50 text-green-700 border-green-200" : "bg-secondary/20 text-secondary-foreground border-none"}>
                            {membership.adjudicationStatus === 'Adjudicated' ? '¡YA COBRADO!' : membership.status === 'WithdrawalRequested' ? 'BAJA EN TRÁMITE' : 'AHORRANDO'}
                          </Badge>
                          {membership.hasPendingBid && !isBiddingClosed && (
                            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 mt-2 text-[10px] w-fit shadow-md">
                              OFERTA ENVIADA
                            </Badge>
                          )}
                          {membership.adjudicationStatus === 'WinnerPendingConfirmation' && (
                            <Badge variant="default" className="bg-blue-600 mt-2 text-[10px] w-fit shadow-md animate-pulse">
                              GANADOR (PT. CONFIRMACIÓN)
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 group">
                          Fondo Común
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger><Info className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" /></TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">
                                <p className="text-[10px]">Capital puro acumulado por el grupo (cuotas, adelantos y licitaciones) que garantiza la salud del plan.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <div className="flex items-center gap-2 font-black text-xl text-primary">
                          <PiggyBank className="h-5 w-5" />
                          ${formatNumber(circle?.accumulatedCommonFund || 0)}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 group">
                          Penalizaciones a repartir
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger><Info className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" /></TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">
                                <p className="text-[10px]">Capital recaudado por retiro de ofertas. Se sorteará al final del plan entre socios con conducta ideal.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <div className="flex items-center gap-2 font-black text-xl text-orange-600">
                          <TrendingUp className="h-5 w-5" />
                          ${formatNumber(circle?.accumulatedPenaltyFund || 0)}
                        </div>
                      </div>
                    </div>

                    {membership.status === 'WithdrawalRequested' ? (
                      <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-orange-100/50">
                        <div className="flex gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-base font-black text-orange-950 uppercase tracking-tight">Solicitud de Baja en Trámite</h4>
                            <p className="text-sm text-orange-800/80 leading-relaxed max-w-lg">
                              Has solicitado retirarte de este círculo de ahorro. Mientras la administración procesa tu pedido, todas las acciones del grupo han sido bloqueadas.
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="border-orange-300 text-orange-800 hover:bg-orange-100 bg-white shadow-sm font-bold h-12 px-6 rounded-2xl"
                              disabled={isProcessingBaja}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Anular Pedido
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-bold">¿Anular pedido de baja?</AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Tu plan volverá al estado <strong>Activo</strong> y se restaurarán todos tus accesos de inmediato.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-3">
                              <AlertDialogCancel className="rounded-xl border-none bg-muted font-bold">No, mantener baja</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleCancelWithdrawal(membership)}
                                className="rounded-xl font-bold bg-primary hover:bg-primary/90"
                              >
                                Sí, anular y continuar ahorrando
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border/60">
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isCircleActive 
                            ? (membership.paidInstallmentsCount >= 3 
                                ? (isBiddingClosed ? "El periodo de licitación ha cerrado. Se anunciará al ganador a la brevedad." : "El grupo ya está juntando fondos. Podés participar de los sorteos y licitaciones.")
                                : "Necesitas tener al menos 3 cuotas pagas para participar en Sorteos y Licitaciones.")
                            : "El grupo va a empezar cuando se complete la gente que falta."}
                        </p>
                        <div className="flex gap-3 w-full sm:w-auto">
                          {membership.chatEnabled !== false && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                              onClick={() => { setSelectedChatMembership(membership); setIsChatOpen(true); }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat Grupal
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => { setSelectedLogMembership(membership); setIsLogOpen(true); }}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Historial
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Baja
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-bold flex items-center gap-3 text-destructive">
                                  <AlertTriangle className="h-7 w-7" />
                                  Solicitar Baja del Plan
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base text-balance pt-2">
                                  Al solicitar la baja, **se bloquearán todas tus acciones** (pagos, licitaciones y sorteos) hasta que la administración resuelva tu situación. Podrás anular este pedido mientras no haya sido procesado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-8 gap-3">
                                <AlertDialogCancel className="rounded-xl border-none bg-muted font-bold">Seguir en el plan</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleWithdrawalRequest(membership)}
                                  className="rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  Solicitar Baja
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {isCircleActive && membership.adjudicationStatus !== 'Adjudicated' && (
                            <Dialog 
                              open={isAdelantoOpen && selectedAdelantoMembership?.id === membership.id} 
                              onOpenChange={(val) => {
                                if (val) {
                                  setSelectedAdelantoMembership(membership);
                                  setAdelantoQty(1);
                                  setIsAdelantoOpen(true);
                                } else {
                                  setIsAdelantoOpen(false);
                                  setSelectedAdelantoMembership(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="flex-1 sm:flex-none gap-2 rounded-xl border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
                                >
                                  <FastForward className="h-4 w-4" />
                                  Adelantar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md rounded-3xl p-5 shadow-2xl border-none">
                                <DialogHeader>
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                      <CircleDollarSign className="h-6 w-6 text-primary" />
                                    </div>
                                    <DialogTitle className="text-xl font-bold">Adelanto de Cuotas</DialogTitle>
                                  </div>
                                  <DialogDescription className="text-sm">
                                    Al adelantar cuotas pagas solo la <b>Alícuota Pura</b>, ahorrando el 100% de los gastos administrativos y seguros.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="py-6 space-y-6">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <Label htmlFor="adelanto-qty" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">¿Cuántas cuotas querés adelantar?</Label>
                                      <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">
                                        Máx: {(circle?.totalInstallments || 1) - (membership.paidInstallmentsCount || 0)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-xl h-12 w-12"
                                        onClick={() => setAdelantoQty(Math.max(1, adelantoQty - 1))}
                                      >
                                        -
                                      </Button>
                                      <Input 
                                        id="adelanto-qty"
                                        type="number"
                                        value={adelantoQty}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const max = (circle?.totalInstallments || 1) - (membership.paidInstallmentsCount || 0);
                                          setAdelantoQty(val > max ? max : val < 1 ? 1 : val);
                                        }}
                                        className="text-center text-2xl font-black h-12 rounded-xl"
                                      />
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-xl h-12 w-12"
                                        onClick={() => {
                                          const max = (circle?.totalInstallments || 1) - (membership.paidInstallmentsCount || 0);
                                          setAdelantoQty(Math.min(max, adelantoQty + 1));
                                        }}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total a Pagar</span>
                                      <p className="text-xl font-black text-foreground">
                                        {formatCurrency(calculateAdelantoData(circle, membership, adelantoQty).totalPay)}
                                      </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                      <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                                        <TrendingDown className="h-10 w-10 text-primary" />
                                      </div>
                                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest block mb-1">Ahorro Real</span>
                                      <p className="text-xl font-black text-primary animate-in fade-in slide-in-from-bottom-2">
                                        {formatCurrency(calculateAdelantoData(circle, membership, adelantoQty).totalSavings)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                                    <p className="text-[10px] text-orange-800 leading-relaxed font-medium">
                                      <Info className="h-3 w-3 inline mr-1 mb-0.5" />
                                      Las cuotas se adelantan desde la <b>número {circle?.totalInstallments}</b> hacia atrás. Esto no anula el vencimiento de tu próxima cuota mensual, pero acorta el plazo total de tu plan de ahorro.
                                    </p>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button 
                                    className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                    disabled={isProcessingAdelanto}
                                    onClick={handlePlaceAdelanto}
                                  >
                                    {isProcessingAdelanto ? <Loader2 className="h-5 w-5 animate-spin" /> : `Adelantar y Ahorrar ${formatCurrency(calculateAdelantoData(circle, membership, adelantoQty).totalSavings)}`}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {isCircleActive && membership.paidInstallmentsCount >= 3 && membership.adjudicationStatus !== 'Adjudicated' && (
                          <Dialog 
                            open={selectedMembership?.id === membership.id} 
                            onOpenChange={(val) => {
                              if (val) {
                                setSelectedMembership(membership);
                                if (membership.hasPendingBid) {
                                  setBidAmount(membership.pendingBidInstallments || 1);
                                  setBidMethod(membership.pendingBidMethod || 'own');
                                } else {
                                  setBidMethod('own');
                                  setBidAmount(1);
                                }
                              } else {
                                setSelectedMembership(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant={membership.hasPendingBid ? "outline" : "default"} 
                                disabled={isBiddingClosed}
                                className={cn(
                                  "flex-1 sm:flex-none gap-2 rounded-xl",
                                  membership.hasPendingBid && !isBiddingClosed && "border-orange-500 text-orange-600 hover:bg-orange-50"
                                )}
                              >
                                <Gavel className="h-4 w-4" />
                                {isBiddingClosed 
                                  ? "Cerrado" 
                                  : membership.hasPendingBid ? "Editar Oferta" : "Licitación"
                                }
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-3xl p-5 shadow-2xl border-none">
                              <DialogHeader>
                                <DialogTitle>{membership.hasPendingBid ? 'Mejorar' : 'Oferta de'} Licitación Pública</DialogTitle>
                                <DialogDescription>
                                  Sistema de puja a viva voz. Tu oferta debe superar al líder actual para posicionarte.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <Label htmlFor="installments">Cantidad de Cuotas a Adelantar</Label>
                                    <span className="text-xs font-bold text-muted-foreground">
                                      Máximo posible: {(circle?.totalInstallments || 1) - (membership.paidInstallmentsCount || 0)}
                                    </span>
                                  </div>
                                  <Input 
                                    id="installments" 
                                    type="number" 
                                    min="1" 
                                    max={(circle?.totalInstallments || 1) - membership.paidInstallmentsCount}
                                    value={bidAmount} 
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const max = (circle?.totalInstallments || 1) - membership.paidInstallmentsCount;
                                      setBidAmount(val > max ? max : val);
                                    }} 
                                    className="text-base font-bold h-10"
                                  />
                                </div>
                                <div className="space-y-3">
                                  <Label>Método de Pago del Adelanto</Label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <Button 
                                      variant={bidMethod === 'own' ? 'default' : 'outline'} 
                                      onClick={() => setBidMethod('own')}
                                      className="w-full text-[10px] h-10 rounded-xl"
                                    >
                                      Capital Propio
                                    </Button>
                                    <Button 
                                      variant={bidMethod === 'deduct' ? 'default' : 'outline'} 
                                      onClick={() => setBidMethod('deduct')}
                                      className="w-full text-[10px] h-10 rounded-xl"
                                    >
                                      A Deducir
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-[10px] bg-muted/30 p-2.5 rounded-lg border border-border/50 space-y-1">
                                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Deducciones al adjudicar:</p>
                                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                    <li>Seguro de caución: <strong>-${formatNumber(bidLimits?.suretyBond || 0)}</strong></li>
                                    {bidLimits && bidLimits.pendingSubFeeAmount > 0 && <li>Suscripción: <strong>-${formatNumber(bidLimits.pendingSubFeeAmount)}</strong></li>}
                                    {bidMethod === 'deduct' && <li>Comisión (3% + IVA): <strong className="text-orange-600">-${formatNumber(bidLimits?.bidCommission || 0)}</strong></li>}
                                  </ul>
                                </div>
                                
                                <div className="bg-accent/30 p-3 rounded-xl flex flex-col gap-1.5">
                                  {bidMethod === 'own' ? (
                                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground border-b border-border/50 pb-2 mb-1">
                                      <span>Oferta (Propia):</span>
                                      <span className="text-lg font-bold text-foreground">
                                        ${formatNumber(bidLimits?.bidGrossValue || 0)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground border-b border-border/50 pb-2 mb-1">
                                      <span>Oferta (A descontar):</span>
                                      <span className="text-lg font-bold text-orange-600">
                                        -${formatNumber(bidLimits?.bidGrossValue || 0)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className={`flex justify-between items-center text-base font-black pt-1 ${isInvalidDeductBid ? 'text-red-500' : 'text-primary'}`}>
                                    <span>Capital a Recibir (Neto):</span>
                                    <span>${formatNumber(bidLimits?.netPrize || 0)}</span>
                                  </div>
                                  <p className="text-[9px] text-muted-foreground/60 italic leading-tight mt-0.5">
                                    * Descuento propio de plataforma. No incluye cargos interbancarios.
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-semibold text-muted-foreground">
                                    Cuotas restantes: <span className="text-primary font-bold text-base px-2">{Math.max(0, (circle?.totalInstallments || 1) - membership.paidInstallmentsCount - bidAmount)}</span>
                                  </p>
                                </div>
                                {isInvalidDeductBid && (
                                  <div className="text-xs font-bold text-red-500 text-center animate-pulse">
                                    Monto inválido: Las deducciones (comisión + seguro + suscripción impaga) agotarían el premio 🤯. Prueba menos cuotas.
                                  </div>
                                )}
                              </div>
                              <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                                {membership.hasPendingBid && (
                                  <Button 
                                    variant="destructive" 
                                    onClick={handleRemoveBid}
                                    disabled={isBidding}
                                    className="w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600"
                                  >
                                    Retirar Oferta
                                  </Button>
                                )}
                                <Button 
                                  onClick={handlePlaceBidClick} 
                                  disabled={
                                    isBidding || 
                                    !bidAmount || 
                                    bidAmount < 1 || 
                                    bidAmount > ((circle?.totalInstallments || 1) - membership.paidInstallmentsCount) || 
                                    isInvalidDeductBid
                                  } 
                                  className="w-full sm:w-auto rounded-xl flex-1"
                                >
                                  {isBidding ? 'Enviando...' : 'Confirmar Oferta'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                            </Dialog>
                        )}
                        
                        {membership.status !== 'WithdrawalRequested' && (
                          <InstallmentProjectionDialog circle={circle} membership={membership} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )}

      <AccountHistoryDialog 
        membership={selectedLogMembership} 
        open={isLogOpen} 
        onOpenChange={setIsLogOpen} 
        db={db} 
        user={user} 
      />

      <GroupChat 
        circleId={selectedChatMembership?.savingCircleId}
        orderNumber={selectedChatMembership?.orderNumber}
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
      />
    </div>
  )
}

function AccountHistoryDialog({ membership, open, onOpenChange, db, user }: any) {
  const logsQuery = useMemoFirebase(() => {
    if (!db || !membership || !user) return null;
    return collection(db, 'users', user.uid, 'saving_circle_memberships', membership.id, 'logs');
  }, [db, membership, user]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl p-6 shadow-2xl bg-white border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <History className="h-7 w-7 text-primary" />
            Historial de Cuenta
          </DialogTitle>
          <DialogDescription>
            Registro de movimientos y ajustes realizados por la administración.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4 max-h-[450px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-muted/20 rounded-2xl">
              No hay movimientos registrados en este plan.
            </div>
          ) : (
            logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((log: any, idx: number) => {
              const getLogStyles = (type: string) => {
                switch(type) {
                  case 'Subscription': return { badge: "bg-blue-100 text-blue-700", label: "Suscripción", icon: <CheckCircle2 className="h-3 w-3" /> };
                  case 'BidPlacement': return { badge: "bg-orange-100 text-orange-700", label: "Nueva Oferta", icon: <Gavel className="h-3 w-3" /> };
                  case 'BidRemoval': return { badge: "bg-red-100 text-red-700", label: "Retiro Oferta", icon: <XCircle className="h-3 w-3" /> };
                  case 'WithdrawalRequested': return { badge: "bg-gray-100 text-gray-700", label: "Baja Solicitada", icon: <UserMinus className="h-3 w-3" /> };
                  case 'WithdrawalCancelled': return { badge: "bg-green-100 text-green-700", label: "Baja Anulada", icon: <RotateCcw className="h-3 w-3" /> };
                  case 'WinnerPendingConfirmation': return { badge: "bg-yellow-100 text-yellow-700", label: "Pre-Adjudicado", icon: <Clock className="h-3 w-3" /> };
                  case 'Adjudicated': return { badge: "bg-green-100 text-green-700 font-bold animate-pulse", label: "¡ADJUDICADO!", icon: <Trophy className="h-3 w-3" /> };
                  case 'BalanceAdjustment': return { badge: "bg-primary/10 text-primary", label: "Ajuste Saldo", icon: <DollarSign className="h-3 w-3" /> };
                  case 'StatusChange': return { badge: "bg-purple-100 text-purple-700", label: "Estado Admin", icon: <Activity className="h-3 w-3" /> };
                  case 'AdelantoCuotas': return { badge: "bg-green-100 text-green-700", label: "Adelanto", icon: <FastForward className="h-3 w-3" /> };
                  default: return { badge: "bg-muted text-muted-foreground", label: "Movimiento", icon: <Info className="h-3 w-3" /> };
                }
              };
              const styles = getLogStyles(log.type);

              return (
                <div key={idx} className="p-4 rounded-2xl border bg-muted/5 space-y-2 relative border-l-4" style={{ borderLeftColor: 'currentColor' }}>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className={cn("text-[10px] gap-1 uppercase tracking-widest font-bold border-none", styles.badge)}>
                      {styles.icon}
                      {styles.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {format(new Date(log.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug">{log.reason}</p>
                  
                  {log.type === 'BalanceAdjustment' && (
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">Capital resultante:</span>
                      <span className="text-lg font-black text-primary">{formatCurrency(log.amountAfter)}</span>
                    </div>
                  )}

                  {log.type === 'BidRemoval' && log.penaltyAmount && (
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xs text-red-600 font-bold">Penalización:</span>
                      <span className="text-base font-black text-red-600">-{formatCurrency(log.penaltyAmount)}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button variant="ghost" className="w-full rounded-xl font-bold" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstallmentProjectionDialog({ circle, membership }: { circle: any, membership: any }) {
  if (!circle || !membership) return null;

  const isCircleActive = (circle.currentMemberCount || 0) >= circle.memberCapacity;
  const paidCount = membership.paidInstallmentsCount || 0;

  const calculateInstallmentDate = (num: number) => {
    const baseDate = membership.joiningDate ? new Date(membership.joiningDate) : new Date();
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
    const currentSaldo = capitalTotal - (alicuotaPura * num);
    const MathSaldo = currentSaldo < 0 ? 0 : currentSaldo;
    
    // Seguro de vida sobre saldo ANTES de pagar esta cuota? 
    // Usualmente el saldo para seguro es el del mes anterior.
    const currentInsurance = calculateLifeInsurance(capitalTotal, alicuotaPura, num - 1, circle.lifeInsuranceRate || 0.09, circle.lifeInsuranceVatApplied);
    const currentSubFee = num <= installmentsWithSubFee ? proratedSubFee : 0;
    const currentTotal = alicuotaPura + adminFeeMensual + currentInsurance + currentSubFee;
    
    return { 
      num, 
      date: calculateInstallmentDate(num),
      alicuotaPura,
      adminFeeMensual,
      currentInsurance,
      currentSubFee, 
      currentTotal
    };
  });

  const totalPlanSum = installments.reduce((acc, inst) => acc + inst.currentTotal, 0);
  const cuotaPromedio = totalPlanSum / totalCuotas;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="flex-1 sm:flex-none gap-2 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Calculator className="h-4 w-4" />
          Proyección de Cuotas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 border-none overflow-hidden rounded-[2rem] shadow-2xl">
        <div className="p-5 bg-primary text-white shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black">Proyección del Plan</DialogTitle>
                <DialogDescription className="text-white/70 text-xs font-medium">
                  Plan de {totalCuotas} meses • {formatCurrency(capitalTotal)} USD
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-slate-50">
          <div className="grid grid-cols-4 gap-3 p-4 shrink-0">
             <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pagadas</span>
                <p className="text-lg font-black text-primary">{paidCount} / {totalCuotas}</p>
             </div>
             <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Cuota Promedio</span>
                <p className="text-lg font-black text-slate-900">{formatCurrency(cuotaPromedio)}</p>
             </div>
             <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 text-center">Estado del Grupo</span>
                <div className="flex items-center justify-center">
                   <Badge className={cn("px-3 py-0.5 rounded-full font-black text-[10px] uppercase tracking-tighter", isCircleActive ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                      {isCircleActive ? 'Grupo Activo' : 'En Formación'}
                   </Badge>
                </div>
             </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col px-6 pb-6">
            <ScrollArea className="flex-1 h-full w-full rounded-[1.5rem] border bg-white shadow-inner">
              <Table>
                <TableHeader className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest pl-8">CUOTA</TableHead>
                    <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest">FECHA</TableHead>
                    <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest">TOTAL MES</TableHead>
                    <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest text-right pr-8">DESGLOSE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((inst) => {
                    const isPaid = inst.num <= paidCount;
                    return (
                      <TableRow key={inst.num} className={cn("group transition-colors border-slate-50", isPaid && "bg-green-50/30")}>
                        <TableCell className="font-black text-slate-900 pl-8">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">#{inst.num}</span>
                            {isPaid && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-none text-[9px] font-black uppercase px-2 h-5">PAGADA</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-500 uppercase tracking-tighter text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 opacity-30" />
                            {inst.date}
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-primary text-xl">
                          {formatCurrency(inst.currentTotal)}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 hover:border-primary hover:text-primary font-bold h-8 text-xs transition-all">Ver Detalle</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xs rounded-3xl border-none shadow-2xl p-6">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                  <Info className="h-5 w-5 text-primary" />
                                  Desglose Cuota #{inst.num}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 py-6">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Alícuota Pura</span>
                                  <span className="font-bold">{formatCurrency(inst.alicuotaPura)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Gestión ({circle.administrativeFeeRate || 10}% {circle.adminVatApplied ? '+ IVA' : ''})</span>
                                  <span className="font-bold">{formatCurrency(inst.adminFeeMensual)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Vida ({formatNumber(circle.lifeInsuranceRate || 0.09)}% {circle.lifeInsuranceVatApplied ? '+ IVA' : ''})</span>
                                  <span className="font-bold">{formatCurrency(inst.currentInsurance)}</span>
                                </div>
                                {inst.currentSubFee > 0 && (
                                  <div className="flex justify-between items-center text-sm p-2 bg-primary/5 rounded-lg border border-primary/10">
                                    <span className="text-primary font-bold">Suscripción (#{inst.num}/{installmentsWithSubFee})</span>
                                    <span className="font-black text-primary">{formatCurrency(inst.currentSubFee)}</span>
                                  </div>
                                )}
                                <div className="pt-4 border-t flex justify-between items-end">
                                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total a Pagar</span>
                                  <span className="text-2xl font-black text-primary">{formatCurrency(inst.currentTotal)}</span>
                                </div>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
