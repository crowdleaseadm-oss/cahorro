
'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  PiggyBank, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Loader2,
  TrendingUp,
  BarChart3,
  Share2,
  Edit2,
  Mail,
  Copy,
  CheckCircle2,
  DollarSign,
  Gavel,
  Calendar,
  Trophy,
  Hammer,
  RotateCcw,
  Settings2,
  Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { UserCreationDialog } from '@/components/admin/user-creation-dialog';
import { FinancialHealthView } from '@/components/admin/financial-health-view';
import { AdjudicationsPanel } from '@/components/admin/adjudications-panel';
import { UserManagementView } from '@/components/admin/user-management-view';
import { useRouter } from 'next/navigation';
import { recordMemberTransaction } from '@/lib/ledger-service';
import { initiateWinnerValidation } from '@/lib/adjudication-service';
import { processMonthEndClosing } from '@/lib/business-logic';
import { format } from 'date-fns';
import { 
  calculatePureAlicuota, 
  calculateAdminFee, 
  calculateAverageLifeInsurance 
} from '@/lib/financial-logic';

function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border px-4 py-2 rounded-2xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Reloj de Sistema</span>
        <span className="text-sm font-black text-foreground tabular-nums">
          {time.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })} • {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
        <Clock className="h-4 w-4 text-primary animate-pulse" />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  // Nuevo: Referencia al documento del usuario actual para chequear rol
  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const userRole = userProfile?.role || 'user';
  const isCEO = userRole === 'ceo';


  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [circleToDelete, setCircleToDelete] = useState<any>(null);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [selectedCircleFilter, setSelectedCircleFilter] = useState<string>('all');
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('all');
  const [isWiping, setIsWiping] = useState(false);
  const [isBidsOpen, setIsBidsOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    minTargetCapital: 10000,
    maxTargetCapital: 50000,
    stepTargetCapital: 10000,
    minInstallments: 48,
    maxInstallments: 84,
    stepInstallments: 12,
    minAvgInstallment: 100,
    maxAvgInstallment: 2000,
  });
  
  const circlesRef = useMemoFirebase(() => (db && user ? collection(db, 'saving_circles') : null), [db, user]);
  const MOCK_CIRCLES = useMemo(() => [
    { id: 'DEMO01', name: '$ 2.000', targetCapital: 2000, totalInstallments: 12, currentMemberCount: 12, memberCapacity: 24, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
    { id: 'DEMO02', name: '$ 5.000', targetCapital: 5000, totalInstallments: 36, currentMemberCount: 67, memberCapacity: 72, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
    { id: 'DEMO03', name: '$ 15.000', targetCapital: 15000, totalInstallments: 84, currentMemberCount: 163, memberCapacity: 168, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
    { id: 'DEMO04', name: '$ 10.000', targetCapital: 10000, totalInstallments: 84, currentMemberCount: 84, memberCapacity: 168, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
    { id: 'DEMO05', name: '$ 7.500', targetCapital: 7500, totalInstallments: 48, currentMemberCount: 10, memberCapacity: 96, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
  ], []);

  const mergedCircles = useMemo(() => [...(circlesList || []), ...MOCK_CIRCLES], [circlesList, MOCK_CIRCLES]);

  const financialStats = useMemo(() => {
    if (!mergedCircles) return { 
      subPercibida: 0, subProyectada: 0, 
      adminPercibida: 0, adminProyectada: 0, 
      activeMembers: 0, totalCapacity: 0 
    };
    
    const filteredByStatus = mergedCircles.filter(circle => {
      if (tableStatusFilter === 'all') return true;
      const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
      const isClosed = circle.status === 'Closed';
      if (tableStatusFilter === 'formation') return !isFull && !isClosed;
      if (tableStatusFilter === 'full') return isFull && !isClosed;
      if (tableStatusFilter === 'closed') return isClosed;
      return true;
    });

    const filtered = selectedCircleFilter === 'all' 
      ? filteredByStatus 
      : filteredByStatus.filter(c => c.id === selectedCircleFilter);

    return filtered.reduce((acc, circle) => {
      // Ignoramos grupos cerrados para estas estadísticas operativas
      if (circle.status === 'Closed') return acc;

      const isActive = circle.status === 'Active';

      return {
        activeGroups: acc.activeGroups + (isActive ? 1 : 0),
        totalGroupsNonClosed: acc.totalGroupsNonClosed + 1,
        activeMembers: acc.activeMembers + (circle.currentMemberCount || 0),
        totalCapacity: acc.totalCapacity + circle.memberCapacity
      };
    }, { activeGroups: 0, totalGroupsNonClosed: 0, activeMembers: 0, totalCapacity: 0 });
  }, [circlesList, tableStatusFilter, selectedCircleFilter]);

  const circlesForDropdown = useMemo(() => {
    if (!mergedCircles) return [];
    return mergedCircles.filter(circle => {
      if (tableStatusFilter === 'all') return true;
      const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
      const isClosed = circle.status === 'Closed';
      if (tableStatusFilter === 'formation') return !isFull && !isClosed;
      if (tableStatusFilter === 'full') return isFull && !isClosed;
      if (tableStatusFilter === 'closed') return isClosed;
      return true;
    });
  }, [mergedCircles, tableStatusFilter]);

  useEffect(() => {
    // Reset individual circle filter if it's no longer in the filtered list
    if (selectedCircleFilter !== 'all' && !circlesForDropdown.some(c => c.id === selectedCircleFilter)) {
      setSelectedCircleFilter('all');
    }
  }, [tableStatusFilter, circlesForDropdown, selectedCircleFilter]);

  // Lógica de "Pulso" para notificaciones de cierre de licitación (Auto-WhatsApp 1h antes)
  useEffect(() => {
    if (!db || !circlesList) return;

    const pulseInterval = setInterval(() => {
      const now = new Date();
      
      circlesList.forEach(async (circle) => {
        if (circle.status !== 'Active' || (circle.currentMemberCount || 0) < circle.memberCapacity) return;

        // Calculamos fecha de cierre (basada en el día 5 o 20)
        // Simplificación para el prototipo: usamos la lógica de MyCircles
        // En un entorno real, esto vendría de una subcolección 'installments'
        const baseDate = new Date(circle.creationDate || Date.now());
        let dueDay = baseDate.getDate() < 20 ? 5 : 20;
        const closeDate = new Date(now.getFullYear(), now.getMonth(), dueDay + 5, 0, 0, 0);

        const diffMs = closeDate.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Si falta entre 50 y 60 minutos
        if (diffMinutes > 0 && diffMinutes <= 60) {
          const sessionKey = `notified_close_${circle.id}_${closeDate.getTime()}`;
          if (!sessionStorage.getItem(sessionKey)) {
            console.log(`[PULSE] Detectado cierre inminente para grupo ${circle.id}. Enviando Alertas WhatsApp...`);
            
            // Notificar a todos los miembros (Simulado)
            const membersSnap = await getDocs(collection(db, 'saving_circles', circle.id, 'members'));
            import('@/services/messenger').then(({ sendNotification }) => {
              membersSnap.forEach(memberDoc => {
                const m = memberDoc.data();
                sendNotification(db, {
                  userId: m.userId,
                  title: '¡Licitación por cerrar!',
                  message: `La licitación del grupo ${circle.name} cierra en 1 hora. ¡Última oportunidad para mejorar tu oferta!`,
                  circleId: circle.id,
                  type: 'system'
                });
              });
            });
            
            sessionStorage.setItem(sessionKey, 'true');
          }
        }
      });
    }, 60000); // Revisar cada minuto

    return () => clearInterval(pulseInterval);
  }, [db, circlesList]);

  const [formData, setFormData] = useState({
    name: '',
    targetCapital: 50000,
    totalInstallments: 84,
    subscriptionFeeRate: 3,
    administrativeFeeRate: 10,
    lifeInsuranceRate: 0.09,
    drawMethodCount: 1,
    bidMethodCount: 1,
    isPrivate: false,
    password: '',
    subscriptionVatApplied: true,
    adminVatApplied: true,
    lifeInsuranceVatApplied: false,
    isRecurrent: false,
    moraRate: 3,
    bidCommissionRate: 3,
    installmentDueDay: 5
  });

  const handleWipeAllData = async () => {
    if (!db) return;
    setIsWiping(true);
    try {
      // 1. Limpiar saving_circles y sus miembros
      const circlesSnap = await getDocs(collection(db, 'saving_circles'));
      for (const circleDoc of circlesSnap.docs) {
        // Borrar miembros del círculo
        const membersSnap = await getDocs(collection(db, 'saving_circles', circleDoc.id, 'members'));
        await Promise.all(membersSnap.docs.map(m => deleteDoc(m.ref)));
        // Borrar el círculo
        await deleteDoc(circleDoc.ref);
      }
      
      // 2. Limpiar admin_requests y alertas
      const requestsSnap = await getDocs(collection(db, 'admin_requests'));
      await Promise.all(requestsSnap.docs.map(d => deleteDoc(d.ref)));
      
      // 3. Limpiar usuarios (EXCEPTO PERFIL CEO Y ADMINS, PERO SÍ SUS MEMBRESÍAS)
      const usersSnap = await getDocs(collection(db, 'users'));
      let usersDeleted = 0;
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const isProtectedAccount = 
          data.role === 'ceo' || 
          data.role === 'admin' ||
          data.email === 'crowd.lease.adm@gmail.com' ||
          data.dni === '31693615';
        
        // BORRAR SIEMPRE LAS MEMBRESÍAS para limpiar el historial de simulaciones
        const membershipsSnap = await getDocs(collection(db, 'users', userDoc.id, 'saving_circle_memberships'));
        await Promise.all(membershipsSnap.docs.map(m => deleteDoc(m.ref)));

        if (!isProtectedAccount) {
          await deleteDoc(userDoc.ref);
          usersDeleted++;
        }
      }

      // 4. Limpiar notificaciones globales
      const notificationsSnap = await getDocs(collection(db, 'notifications'));
      await Promise.all(notificationsSnap.docs.map(d => deleteDoc(d.ref)));

      // 5. Limpiar metadata del sistema (Reiniciar contadores)
      const metadataRef = doc(db, 'system', 'metadata');
      await deleteDoc(metadataRef);
      
      toast({ 
        title: "Reinicio Maestro Completado", 
        description: `Se eliminaron ${circlesSnap.size} grupos, ${usersDeleted} usuarios y se reiniciaron los contadores. IMPORTANTE: Los accesos de login (Authentication) deben borrarse manualmente en la consola de Firebase.` 
      });
    } catch (error: any) {
      console.error("Error al borrar:", error);
      toast({ title: "Error al borrar", description: error.message, variant: "destructive" });
    } finally {
      setIsWiping(false);
      setIsWipeConfirmOpen(false);
    }
  };

  const calculations = useMemo(() => {
    const alicuota = calculatePureAlicuota(formData.targetCapital, formData.totalInstallments);
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    
    const adminFee = calculateAdminFee(alicuota, formData.administrativeFeeRate, formData.adminVatApplied);
    const lifeInsurance = calculateAverageLifeInsurance(formData.targetCapital, formData.lifeInsuranceRate, formData.lifeInsuranceVatApplied);
    const averageInstallment = alicuota + adminFee + lifeInsurance;

    return { alicuota, capacity, averageInstallment };
  }, [formData]);

  const bulkPreviewGroups = useMemo(() => {
    if (!isBulkMode) return [];
    
    const validGroups: any[] = [];
    const { 
      minTargetCapital, maxTargetCapital, stepTargetCapital,
      minInstallments, maxInstallments, stepInstallments,
      minAvgInstallment, maxAvgInstallment 
    } = bulkFormData;

    if (stepTargetCapital <= 0 || stepInstallments <= 0) return [];

    for (let cap = minTargetCapital; cap <= maxTargetCapital; cap += stepTargetCapital) {
      for (let inst = minInstallments; inst <= maxInstallments; inst += stepInstallments) {
        const alicuota = calculatePureAlicuota(cap, inst);
        const adminFee = calculateAdminFee(alicuota, formData.administrativeFeeRate, formData.adminVatApplied);
        const lifeInsurance = calculateAverageLifeInsurance(cap, formData.lifeInsuranceRate, formData.lifeInsuranceVatApplied);
        const avg = alicuota + adminFee + lifeInsurance;

        if (avg >= minAvgInstallment && avg <= maxAvgInstallment) {
          validGroups.push({ targetCapital: cap, totalInstallments: inst, averageInstallment: avg });
        }
      }
    }
    return validGroups;
  }, [isBulkMode, bulkFormData, formData]);

  const handleCreateCircle = () => {
    if (!db || !user) return;
    
    const groupsToCreate = isBulkMode ? bulkPreviewGroups : [formData];

    if (groupsToCreate.length === 0) {
      toast({ title: "Error", description: "No hay grupos válidos para crear.", variant: "destructive" });
      return;
    }

    if (groupsToCreate.length > 50) {
      toast({ title: "Límite excedido", description: "No puedes crear más de 50 grupos de una sola vez.", variant: "destructive" });
      return;
    }

    groupsToCreate.forEach((groupInfo: any) => {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const nums = "0123456789";
      let l = ""; for (let i = 0; i < 4; i++) l += letters[Math.floor(Math.random() * letters.length)];
      let n = ""; for (let i = 0; i < 4; i++) n += nums[Math.floor(Math.random() * nums.length)];
      const customId = l + n;
      
      const targetCapital = groupInfo.targetCapital || formData.targetCapital;
      const totalInstallments = groupInfo.totalInstallments || formData.totalInstallments;
      
      const alicuota = targetCapital / totalInstallments;
      const capacity = totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
      const capitalName = formatCurrency(targetCapital);
      const circleName = formData.isPrivate ? formData.name : capitalName;

      const newCircle = {
        ...formData,
        targetCapital,
        totalInstallments,
        name: circleName,
        id: customId,
        installmentValue: alicuota,
        memberCapacity: capacity,
        currentMemberCount: 0,
        status: 'Active',
        creationDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        adminUserId: user.uid,
      };
      
      const circleRef = doc(db, 'saving_circles', customId);
      setDocumentNonBlocking(circleRef, newCircle, { merge: true });
    });

    setIsCreateOpen(false);
    toast({ title: "Proceso completado", description: `Se crearon ${groupsToCreate.length} grupos exitosamente.` });
  };

  const handleUpdateCircle = () => {
    if (!db || !selectedCircle) return;
    const circleRef = doc(db, 'saving_circles', selectedCircle.id);
    
    const capitalName = formatCurrency(formData.targetCapital);
    const circleName = formData.isPrivate ? formData.name : capitalName;

    updateDocumentNonBlocking(circleRef, {
      ...formData,
      name: circleName,
      installmentValue: formData.targetCapital / formData.totalInstallments,
      memberCapacity: formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount)
    });
    setIsEditOpen(false);
    toast({ title: "Círculo Actualizado", description: selectedCircle.id });
  };

  const handleDeleteCircle = (id: string) => {
    if (!db) return;
    const circleRef = doc(db, 'saving_circles', id);
    deleteDocumentNonBlocking(circleRef);
    setCircleToDelete(null);
    toast({ title: "Círculo Eliminado", variant: "destructive" });
  };

  const handleSyncFunds = async () => {
    if (!db || !circlesList) return;
    setIsSyncing(true);
    try {
      let updatedCount = 0;
      for (const circle of circlesList) {
        // Consultar todos los miembros del círculo
        const membersSnap = await getDocs(collection(db, 'saving_circles', circle.id, 'members'));
        let totalPureCapital = 0;
        
        for (const memberDoc of membersSnap.docs) {
          const mData = memberDoc.data();
          let memberCapital = mData.capitalPaid || 0;

          // FALLBACK: Si no está en la sombra del círculo, buscar en la membresía real del usuario
          if (!mData.capitalPaid && mData.userId && mData.id) {
            try {
              const realMembRef = doc(db, 'users', mData.userId, 'saving_circle_memberships', mData.id);
              const realMembSnap = await getDocs(query(collection(db, 'users', mData.userId, 'saving_circle_memberships'), where('id', '==', mData.id)));
              if (!realMembSnap.empty) {
                const realData = realMembSnap.docs[0].data();
                memberCapital = realData.capitalPaid || 0;
                
                // Aprovechamos para arreglar la sombra
                updateDocumentNonBlocking(memberDoc.ref, { capitalPaid: memberCapital });
              }
            } catch (e) {
              console.error(`Error deep-syncing member ${mData.userId}:`, e);
            }
          }
          
          totalPureCapital += memberCapital;
        }

        // Actualizar el círculo
        const circleRef = doc(db, 'saving_circles', circle.id);
        updateDocumentNonBlocking(circleRef, { accumulatedCommonFund: totalPureCapital });
        updatedCount++;
      }
      toast({ title: "Fondo Común Sincronizado", description: `Se recalcularon los fondos de ${updatedCount} grupos.` });
    } catch (error: any) {
      console.error("Error syncing funds:", error);
      toast({ title: "Error de Sincronización", description: error.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };


  const handleMonthEndClosing = async () => {
    if (!db || !circlesList || !isCEO) return;
    setIsSyncing(true);
    try {
      toast({ title: "Iniciando Cierre", description: "Procesando moras y validaciones de conducta..." });
      
      const results = await processMonthEndClosing(db, circlesList);
      
      toast({ 
        title: "Cierre Completado", 
        description: `Miembros: ${results.processedMembers}, Penalidades: ${results.penaltiesApplied}, Bajas: ${results.forcedWithdrawals}, Seguros: ${results.suretyBondsExecuted}` 
      });
    } catch (e: any) {
      console.error("Error en Cierre:", e);
      toast({ title: "Error en Cierre", description: e.message || "Error desconocido", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isUserLoading || !user) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground font-medium">Cargando Panel Administrativo...</p>
    </div>
  );

  return (
    <Tabs defaultValue="gestion" className="space-y-10 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            Panel de Control
          </h1>
          <p className="text-muted-foreground mt-1">Gestión operativa y salud financiera de los círculos.</p>
        </div>
        <RealTimeClock />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="hidden md:block" />
        <TabsList className="h-14 bg-muted/30 border p-1 rounded-2xl">
          <TabsTrigger value="gestion" className="h-full px-6 text-sm font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Grupos</TabsTrigger>
          <TabsTrigger value="usuarios" className="h-full px-6 text-sm font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Usuarios</TabsTrigger>
          <TabsTrigger value="adjudicaciones" className="h-full px-6 text-sm font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Adjudicaciones
          </TabsTrigger>
          {isCEO && (
            <TabsTrigger value="finanzas" className="h-full px-6 text-sm font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Salud Financiera</TabsTrigger>
          )}
        </TabsList>
      </div>

      {isCEO && (
        <TabsContent value="finanzas" className="mt-0">
          <FinancialHealthView circles={circlesList || []} isReadOnly={userRole === 'auditor'} />
        </TabsContent>
      )}

      <TabsContent value="adjudicaciones" className="mt-0">
        <AdjudicationsPanel db={db} isReadOnly={userRole === 'auditor'} />
      </TabsContent>

      <TabsContent value="usuarios" className="space-y-6 mt-0">
        <div className="flex justify-end">
          <UserCreationDialog />
        </div>
        <UserManagementView isReadOnly={userRole === 'auditor'} />
      </TabsContent>

      <TabsContent value="gestion" className="space-y-10 mt-0">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tableStatusFilter} onValueChange={setTableStatusFilter} className="w-full md:w-auto">
            <TabsList className="bg-white/50 border">
              <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
              <TabsTrigger value="formation" className="text-xs">En Formación</TabsTrigger>
              <TabsTrigger value="full" className="text-xs">Activos (Llenos)</TabsTrigger>
              <TabsTrigger value="closed" className="text-xs">Cerrados</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedCircleFilter} onValueChange={setSelectedCircleFilter}>
            <SelectTrigger className="w-[220px] bg-white h-11 border-muted">
              <SelectValue placeholder="Elegir Grupo Específico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Consolidado ({tableStatusFilter === 'all' ? 'Total' : tableStatusFilter})</SelectItem>
              {circlesForDropdown?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.id} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isCEO && (
            <div className="flex gap-2 bg-red-50/50 p-2 rounded-2xl border border-red-100 items-center">
              <Button 
                variant="destructive"
                onClick={handleMonthEndClosing}
                disabled={isSyncing}
                className="rounded-xl h-11 font-bold text-xs uppercase tracking-widest px-6 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Cierre de Mes
              </Button>

              <Button 
                variant="outline" 
                onClick={handleSyncFunds} 
                disabled={isSyncing}
                className="border-blue-200 text-blue-700 bg-blue-50 gap-2 h-11 px-4 hover:bg-blue-100 rounded-xl"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Sincronizar Fondos
              </Button>

              <Button variant="outline" onClick={() => setIsWipeConfirmOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50 gap-2 h-11 px-4 rounded-xl">
                <Trash2 className="h-4 w-4" />
                Eliminar Todo
              </Button>
            </div>
          )}
          
          {userRole !== 'auditor' && (
            <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/20 gap-2 h-11 px-8 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs">
              <Plus className="h-5 w-5" />
              Nuevo Grupo
            </Button>
          )}
        </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md bg-white border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grupos Operativos</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{financialStats.activeGroups}</span>
              <span className="text-lg text-muted-foreground/30">/</span>
              <span className="text-lg text-muted-foreground/60">{financialStats.totalGroupsNonClosed}</span>
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground italic font-medium">Cantidad de grupos activos vs totales (sin contar cerrados)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ocupación de Miembros</CardTitle>
            <Users className="h-5 w-5 text-blue-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{financialStats.activeMembers}</span>
              <span className="text-lg text-muted-foreground/30">/</span>
              <span className="text-lg text-muted-foreground/60">{financialStats.totalCapacity}</span>
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground italic font-medium">Participaciones suscriptas vs. capacidad total (sin contar cerrados)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold">Gestión de Grupos</CardTitle>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-white px-3 py-1 rounded-full border">
            Mostrando: {tableStatusFilter === 'all' ? 'Todos los registros' : tableStatusFilter}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="px-8 font-bold text-xs uppercase tracking-widest">ID / Nombre</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Capital (USD)</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-primary">Cuota Promedio</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Miembros</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Estado</TableHead>
                <TableHead className="text-right px-8 font-bold text-xs uppercase tracking-widest">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {circlesLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : circlesForDropdown.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No se encontraron grupos con este estado.</TableCell></TableRow>
              ) : circlesForDropdown.map((circle) => (
                <TableRow key={circle.id} className="group hover:bg-muted/5">
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-primary">{circle.id}</span>
                      <span className="font-bold text-sm">{circle.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-sm text-foreground">{formatCurrency(circle.targetCapital)}</TableCell>
                  <TableCell>
                    {(() => {
                      const alicuota = calculatePureAlicuota(circle.targetCapital, circle.totalInstallments);
                      const adminFee = calculateAdminFee(alicuota, circle.administrativeFeeRate || 10, circle.adminVatApplied);
                      const lifeInsurance = calculateAverageLifeInsurance(circle.targetCapital, circle.lifeInsuranceRate || 0.09, circle.lifeInsuranceVatApplied);
                      const avg = alicuota + adminFee + lifeInsurance;
                      return <span className="font-bold text-primary">{formatCurrency(avg)}</span>
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{circle.currentMemberCount || 0} / {circle.memberCapacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {circle.status === 'Closed' ? (
                      <Badge variant="secondary">Cerrado</Badge>
                    ) : (circle.currentMemberCount || 0) >= circle.memberCapacity ? (
                      <Badge variant="default" className="bg-primary hover:bg-primary/90">ACTIVO / LLENO</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 uppercase text-[10px] font-bold">En Formación</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-8 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="Ver Detalle / Gestión de Socios">
                        <Link href={`/admin/circles/${circle.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      
                      {/* Link de invitación: Solo en formación */}
                      {circle.status !== 'Closed' && (circle.currentMemberCount || 0) < circle.memberCapacity && (
                        <Button variant="ghost" size="icon" title="Link de Invitación" onClick={() => { setSelectedCircle(circle); setIsInviteOpen(true); }}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Editar/Eliminar: Solo si no hay suscriptos */}
                      {(circle.currentMemberCount || 0) === 0 && (
                        <>
                          <Button variant="ghost" size="icon" title="Editar Configuración" onClick={() => { 
                            setSelectedCircle(circle); 
                            setFormData({ 
                              name: circle.name,
                              targetCapital: circle.targetCapital,
                              totalInstallments: circle.totalInstallments,
                              subscriptionFeeRate: circle.subscriptionFeeRate,
                              administrativeFeeRate: circle.administrativeFeeRate,
                              lifeInsuranceRate: circle.lifeInsuranceRate,
                              drawMethodCount: circle.drawMethodCount,
                              bidMethodCount: circle.bidMethodCount,
                              isPrivate: circle.isPrivate,
                              password: circle.password || '',
                              subscriptionVatApplied: circle.subscriptionVatApplied ?? true,
                              adminVatApplied: circle.adminVatApplied ?? true,
                              lifeInsuranceVatApplied: circle.lifeInsuranceVatApplied ?? false,
                              isRecurrent: circle.isRecurrent ?? false,
                              moraRate: circle.moraRate || 3,
                              bidCommissionRate: circle.bidCommissionRate || 3,
                              installmentDueDay: circle.installmentDueDay || 5
                            });
                            setIsEditOpen(true); 
                          }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" title="Eliminar Grupo" onClick={() => setCircleToDelete(circle)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </TabsContent>

      {/* DIÁLOGOS DE CREACIÓN Y EDICIÓN */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(val) => isCreateOpen ? setIsCreateOpen(val) : setIsEditOpen(val)}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {isCreateOpen ? <Plus className="h-7 w-7 text-primary" /> : <Edit2 className="h-7 w-7 text-primary" />}
              {isCreateOpen ? "Nuevo Círculo de Ahorro" : `Editar Círculo ${selectedCircle?.id}`}
            </DialogTitle>
            <DialogDescription>Configure los parámetros financieros y operativos del grupo colaborativo.</DialogDescription>
          </DialogHeader>

          {isCreateOpen && (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 mt-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary">Creación Masiva de Grupos</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Habilitar generación por rangos y filtros</span>
              </div>
              <Switch 
                checked={isBulkMode} 
                onCheckedChange={setIsBulkMode} 
              />
            </div>
          )}

          <div className="grid gap-10 py-6">
            {/* SECCIÓN ADMINISTRATIVA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                <Settings2 className="h-4 w-4" /> Configuración Administrativa
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Círculo</Label>
                  <Input 
                    value={formData.isPrivate ? formData.name : formatCurrency(formData.targetCapital)} 
                    placeholder={formData.isPrivate ? "Ej. Círculo Privado Empresa X" : "Generado automáticamente"} 
                    disabled={!formData.isPrivate}
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className={!formData.isPrivate ? "bg-muted/50 font-bold text-primary" : ""}
                  />
                  <p className="text-[10px] text-muted-foreground px-1">
                    {formData.isPrivate 
                      ? "Nombre personalizado para este grupo privado." 
                      : "En grupos públicos, el nombre es siempre el capital suscripto."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Acceso y Seguridad</Label>
                  <div className="flex items-center gap-4 h-10 px-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={formData.isPrivate} onCheckedChange={(val) => setFormData({...formData, isPrivate: !!val})} />
                      <span className="text-sm font-medium">Acceso Privado</span>
                    </div>
                    {formData.isPrivate && (
                      <Input value={formData.password} placeholder="Contraseña" className="h-7 text-xs bg-white" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">Requiere contraseña para ver la proyección del plan.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Ciclo del Grupo</Label>
                  <div className="flex items-center justify-between h-10 px-4 bg-muted/20 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Recurrencia Automática</span>
                      <span className="text-[9px] text-muted-foreground">Crear otro igual al llenarse</span>
                    </div>
                    <Switch 
                      checked={formData.isRecurrent} 
                      onCheckedChange={(val) => setFormData({...formData, isRecurrent: val})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECCIÓN FINANCIERA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                <DollarSign className="h-4 w-4" /> Parámetros Financieros & IVA
              </div>
              {!isBulkMode ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Capital Suscripto (USD)</Label>
                    <Input type="number" step="5000" value={formData.targetCapital} onChange={(e) => setFormData({...formData, targetCapital: Number(e.target.value)})} />
                    <p className="text-[10px] text-muted-foreground px-1">Capital total a adjudicar por sorteo/licitación.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Plazo del Plan (Meses)</Label>
                    <Select value={formData.totalInstallments.toString()} onValueChange={(val) => setFormData({...formData, totalInstallments: Number(val)})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 10}, (_, i) => (i + 1) * 12).map(plazo => (
                          <SelectItem key={plazo} value={plazo.toString()}>{plazo} meses</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground px-1">Cantidad total de cuotas del plan de ahorro.</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-xl flex flex-col justify-center border border-primary/10">
                    <Label className="text-[10px] font-bold text-primary uppercase mb-1">Alícuota Pura</Label>
                    <div className="text-xl font-black text-primary">{formatCurrency(calculations.alicuota)}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-muted/20 rounded-2xl border border-dashed">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Rango de Capital (USD)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Min" value={bulkFormData.minTargetCapital} onChange={(e) => setBulkFormData({...bulkFormData, minTargetCapital: Number(e.target.value)})} className="h-9 text-xs" />
                        <Input type="number" placeholder="Max" value={bulkFormData.maxTargetCapital} onChange={(e) => setBulkFormData({...bulkFormData, maxTargetCapital: Number(e.target.value)})} className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Múltiplo de</Label>
                        <Input type="number" value={bulkFormData.stepTargetCapital} onChange={(e) => setBulkFormData({...bulkFormData, stepTargetCapital: Number(e.target.value)})} className="h-9 text-xs" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Plazo (Cuotas)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Min" value={bulkFormData.minInstallments} onChange={(e) => setBulkFormData({...bulkFormData, minInstallments: Number(e.target.value)})} className="h-9 text-xs" />
                        <Input type="number" placeholder="Max" value={bulkFormData.maxInstallments} onChange={(e) => setBulkFormData({...bulkFormData, maxInstallments: Number(e.target.value)})} className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Múltiplo de</Label>
                        <Input type="number" value={bulkFormData.stepInstallments} onChange={(e) => setBulkFormData({...bulkFormData, stepInstallments: Number(e.target.value)})} className="h-9 text-xs" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Cuota Promedio (USD)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Min" value={bulkFormData.minAvgInstallment} onChange={(e) => setBulkFormData({...bulkFormData, minAvgInstallment: Number(e.target.value)})} className="h-9 text-xs" />
                        <Input type="number" placeholder="Max" value={bulkFormData.maxAvgInstallment} onChange={(e) => setBulkFormData({...bulkFormData, maxAvgInstallment: Number(e.target.value)})} className="h-9 text-xs" />
                      </div>
                      <p className="text-[9px] leading-tight text-muted-foreground italic pt-1">
                        Filtra las combinaciones para que la cuota final esté en este rango.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-primary/10 p-5 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white text-xl font-black">
                        {bulkPreviewGroups.length}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight">Grupos a Crear</span>
                        <span className="text-xs text-muted-foreground font-medium">Basado en las combinaciones válidas encontradas</span>
                      </div>
                    </div>
                    {bulkPreviewGroups.length > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-primary uppercase">Muestra del primer grupo:</span>
                        <span className="text-xs font-bold text-foreground">
                          {formatCurrency(bulkPreviewGroups[0].targetCapital)} en {bulkPreviewGroups[0].totalInstallments} cuotas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-green-50/50 p-4 rounded-xl flex items-center justify-between border border-green-100 mt-4">
                <div className="flex flex-col">
                   <Label className="text-[10px] font-bold text-green-700 uppercase mb-1">Cuota Promedio {!isBulkMode ? '(Estimada)' : '(Muestra)'}</Label>
                   <div className="text-xl font-black text-green-700">
                    {formatCurrency(!isBulkMode ? calculations.averageInstallment : (bulkPreviewGroups[0]?.averageInstallment || 0))}
                   </div>
                </div>
                {!isBulkMode && (
                   <p className="text-[10px] text-green-600/70 max-w-[200px] text-right italic font-medium leading-tight">
                    Incluye Alícuota + Gastos Admin + Seguro e IVA aplicable.
                   </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/10 p-6 rounded-2xl">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Derecho Suscripción (%)</Label>
                  <Input type="number" step="0.01" value={formData.subscriptionFeeRate} onChange={(e) => setFormData({...formData, subscriptionFeeRate: Number(e.target.value)})} />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={formData.subscriptionVatApplied} onCheckedChange={(v) => setFormData({...formData, subscriptionVatApplied: !!v})} />
                    <span className="text-[10px] font-bold">Aplicar IVA (21%)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Gasto Administrativo (%)</Label>
                  <Input type="number" step="0.01" value={formData.administrativeFeeRate} onChange={(e) => setFormData({...formData, administrativeFeeRate: Number(e.target.value)})} />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={formData.adminVatApplied} onCheckedChange={(v) => setFormData({...formData, adminVatApplied: !!v})} />
                    <span className="text-[10px] font-bold">Aplicar IVA (21%)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Seguro de Vida (%)</Label>
                  <Input type="number" step="0.0001" value={formData.lifeInsuranceRate} onChange={(e) => setFormData({...formData, lifeInsuranceRate: Number(e.target.value)})} />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={formData.lifeInsuranceVatApplied} onCheckedChange={(v) => setFormData({...formData, lifeInsuranceVatApplied: !!v})} />
                    <span className="text-[10px] font-bold">Aplicar IVA (21%)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-primary uppercase">Interés por Mora (%)</Label>
                  <Input type="number" step="0.1" value={formData.moraRate} onChange={(e) => setFormData({...formData, moraRate: Number(e.target.value)})} />
                  <p className="text-[9px] text-muted-foreground italic">Se aplica sobre el valor de la cuota vencida + IVA.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-primary uppercase">Comisión Licitación (%)</Label>
                  <Input type="number" step="0.1" value={formData.bidCommissionRate} onChange={(e) => setFormData({...formData, bidCommissionRate: Number(e.target.value)})} />
                  <p className="text-[9px] text-muted-foreground italic">Comisión por adjudicación (Licitación Plus + IVA).</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-primary uppercase">Día de Vencimiento</Label>
                  <Select value={formData.installmentDueDay.toString()} onValueChange={(v) => setFormData({...formData, installmentDueDay: Number(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Día 5 de cada mes</SelectItem>
                      <SelectItem value="20">Día 20 de cada mes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-muted-foreground italic">El cierre de mora será los días 10 o 25 resp.</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECCIÓN OPERATIVA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                <Gavel className="h-4 w-4" /> Métodos de Adjudicación
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Adjudicaciones por Sorteo (Mensual)</Label>
                  <Select value={formData.drawMethodCount.toString()} onValueChange={(val) => setFormData({...formData, drawMethodCount: Number(val)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} cupos por mes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground px-1">Cantidad de miembros adjudicados al azar cada mes.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Adjudicaciones por Licitación (Mensual)</Label>
                  <Select value={formData.bidMethodCount.toString()} onValueChange={(val) => setFormData({...formData, bidMethodCount: Number(val)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} cupos por mes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground px-1">Cantidad de miembros que pueden adelantar cuotas para adjudicar.</p>
                </div>
              </div>
              <div className="bg-accent/30 p-5 rounded-2xl flex items-center justify-between border border-primary/10">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="text-sm font-bold">Capacidad Total del Grupo</h4>
                    <p className="text-[10px] text-muted-foreground">Plazo x Adjudicaciones Mensuales Totales</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-primary">{calculations.capacity} Miembros</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button variant="ghost" onClick={() => isCreateOpen ? setIsCreateOpen(false) : setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={isCreateOpen ? handleCreateCircle : handleUpdateCircle} className="px-10 shadow-lg shadow-primary/20 h-12 text-lg font-bold">
              {isCreateOpen ? "Generar Círculo Operativo" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGOS DE APOYO */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Enviar Invitación
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-6">
            <div className="p-6 bg-muted/30 rounded-2xl border border-dashed border-primary/20 text-center space-y-3">
              <div className="font-mono text-2xl font-black text-primary tracking-widest">{selectedCircle?.id}</div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Código de Invitación</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Enlace Directo</Label>
              <div className="flex gap-2">
                <Input readOnly value={selectedCircle ? `${window.location.origin}/explore/${selectedCircle.id}` : ''} className="bg-muted font-mono text-[10px]" />
                <Button size="icon" variant="outline" onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/explore/${selectedCircle?.id}`);
                   toast({ title: "Enlace Copiado" });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-bold" onClick={() => setIsInviteOpen(false)}>Listo</Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!circleToDelete} onOpenChange={(open) => !open && setCircleToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">¿Eliminar círculo {circleToDelete?.id}?</AlertDialogTitle>
            <p className="text-muted-foreground text-sm text-center">Esta acción es permanente y eliminará todo el historial financiero asociado.</p>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <AlertDialogAction onClick={() => circleToDelete && handleDeleteCircle(circleToDelete.id)} className="bg-destructive hover:bg-destructive/90 h-12 font-bold text-lg rounded-xl">Eliminar Permanentemente</AlertDialogAction>
            <AlertDialogCancel className="h-12 font-bold rounded-xl border-none">Cancelar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* GLOBAL WIPE CONFIRMATION */}
      <AlertDialog open={isWipeConfirmOpen} onOpenChange={setIsWipeConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="h-20 w-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-2 animate-pulse">
              <Trash2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-center text-foreground">
              ¿Borrar TODO el sistema?
            </AlertDialogTitle>
            <p className="text-center text-muted-foreground text-base leading-relaxed px-2">
              Esta acción eliminará **todos** los grupos de ahorro y solicitudes del sistema. Es irreversible y se utiliza para un reinicio total.
            </p>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-10">
            <Button 
              variant="destructive" 
              onClick={handleWipeAllData} 
              disabled={isWiping}
              className="h-14 rounded-2xl text-lg font-bold shadow-xl shadow-red-200"
            >
              {isWiping ? <Loader2 className="animate-spin h-6 w-6" /> : "SÍ, ELIMINAR TODO"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsWipeConfirmOpen(false)} 
              disabled={isWiping}
              className="h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
            >
              No, cancelar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Circle Bids Manager Modal */}
      {selectedCircle && <CircleBidsManager db={db} circle={selectedCircle} isOpen={isBidsOpen} onClose={() => setIsBidsOpen(false)} />}
    </Tabs>
  );
}

function CircleBidsManager({ db, circle, isOpen, onClose }: { db: any, circle: any, isOpen: boolean, onClose: () => void }) {
  const bidsQuery = useMemoFirebase(() => {
    if (!db || !circle || !isOpen) return null;
    // Buscamos todas las pujas (Pending, Annulled, Rejected, etc) para ver hitorial
    return query(collection(db, 'saving_circles', circle.id, 'bids'));
  }, [db, circle, isOpen]);
  
  const { data: bids, isLoading } = useCollection(bidsQuery);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleAdjudicate = async (bid: any) => {
    setIsEvaluating(true);
    
    try {
      // 1. Marcar la puja como ganadora (Won = Won the bid, Pending official confirmation)
      const bidRef = doc(db, 'saving_circles', circle.id, 'bids', bid.id);
      updateDocumentNonBlocking(bidRef, { status: 'Won' }); 
      
      // 2. Iniciar Validación vía Servicio Centralizado
      await initiateWinnerValidation(db, bid.userId, circle.id, bid.membershipId, 'Bid');

      // 3. Marcar otras pujas como superadas/anuladas
      bids?.forEach(otherBid => {
        if (otherBid.id !== bid.id && (otherBid.status === 'Pending' || otherBid.status === 'Winner')) {
          updateDocumentNonBlocking(doc(db, 'saving_circles', circle.id, 'bids', otherBid.id), { status: 'Annulled' });
        }
      });

      setTimeout(() => {
        setIsEvaluating(false);
        toast({ title: 'Ganador en Revisión', description: `Socio ${bid.userName} marcado para validación administrativa (48hs).` });
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsEvaluating(false);
      toast({ title: "Error", description: "No se pudo procesar la adjudicación.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Gavel className="h-6 w-6 text-primary" />
            Gestión de Licitaciones: {circle?.name}
          </DialogTitle>
          <DialogDescription>
            Ofertas recibidas. Solo la oferta más alta se mantiene como líder. Las superadas se anulan automáticamente.
          </DialogDescription>
        </DialogHeader>
        
        {circle.accumulatedPenaltyFund > 0 && (
          <div className="mx-6 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PiggyBank className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Fondo de Beneficio para Socios</p>
                <p className="text-xs text-orange-600/70 italic">Acumulado por penalidades de licitación</p>
              </div>
            </div>
            <div className="text-2xl font-black text-orange-700">
              {formatCurrency(circle.accumulatedPenaltyFund)}
            </div>
          </div>
        )}

        <div className="py-4">
          {isLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto mt-10" /> : (
            (() => {
              const pendingBids = bids?.filter((b: any) => b.status === 'Pending').sort((a: any, b: any) => b.installmentsOffered - a.installmentsOffered) || [];
              const historyBids = bids?.filter((b: any) => b.status !== 'Pending').sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds) || [];

              return (
                <div className="space-y-6">
                  {pendingBids.length > 0 ? (
                    <div className="space-y-3 px-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Líder Actual
                      </h3>
                      <div className="border border-primary/20 bg-primary/5 rounded-2xl overflow-hidden shadow-sm">
                        <Table>
                          <TableBody>
                            {pendingBids.map((bid: any) => (
                              <TableRow key={bid.id} className="hover:bg-primary/10 border-none">
                                <TableCell className="font-bold text-sm py-4">
                                  {bid.userName}
                                  <div className="text-[10px] font-mono opacity-50">{bid.userId}</div>
                                </TableCell>
                                <TableCell className="font-black text-primary text-2xl">
                                  {bid.installmentsOffered} <span className="text-xs font-medium text-foreground">ctas.</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 shadow-lg rounded-xl font-bold px-6"
                                    onClick={() => handleAdjudicate(bid)}
                                    disabled={isEvaluating}
                                  >
                                    Adjudicar Ganador
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-10 border border-dashed rounded-3xl mx-6 opacity-60">
                      <p className="text-sm italic">No hay ofertas líderes pendientes.</p>
                    </div>
                  )}

                  {historyBids.length > 0 && (
                    <div className="space-y-3 px-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Historial / Superadas</h3>
                      <div className="max-h-[300px] overflow-y-auto border rounded-2xl">
                        <Table>
                          <TableHeader className="bg-muted/30 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="text-[10px] uppercase font-bold">Ahorrista</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold">Oferta</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold">Estado</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold text-right">Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyBids.map((bid: any) => (
                              <TableRow key={bid.id} className="opacity-60 hover:opacity-100 transition-opacity">
                                <TableCell className="text-xs font-medium">{bid.userName}</TableCell>
                                <TableCell className="text-xs font-bold">{bid.installmentsOffered} ctas.</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[10px] ${
                                    bid.status === 'Annulled' ? 'bg-orange-50 text-orange-600' : 
                                    bid.status === 'Withdrawn' ? 'bg-red-50 text-red-600' : 
                                    bid.status === 'Accepted' ? 'bg-green-50 text-green-600' : ''
                                  }`}>
                                    {bid.status === 'Annulled' ? 'SUPERADA' : 
                                     bid.status === 'Withdrawn' ? 'RETIRADA' : 
                                     bid.status === 'Accepted' ? 'GANADORA' : bid.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] text-right text-muted-foreground italic">
                                  {bid.createdAt?.toDate ? format(bid.createdAt.toDate(), 'dd/MM HH:mm') : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
