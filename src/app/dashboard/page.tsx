
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PiggyBank, Users, Calendar, Award, PartyPopper, Loader2, ArrowRight, Clock, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatNumber, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, documentId, doc } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [isAnyCircleActive, setIsAnyCircleActive] = useState(false);

  // 0. Fetch User Profile for Role
  const profileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(profileRef);
  const roleText = profile?.role === 'ceo' ? 'CEO' : profile?.role === 'admin' ? 'Administrador' : 'Ahorrista';

  // 1. Fetch User Memberships
  const membershipsRef = useMemoFirebase(() => 
    (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), 
    [db, user]
  );
  const { data: memberships, isLoading: membershipsLoading } = useCollection(membershipsRef);

  // 2. Fetch Circle Statuses
  const circleIds = useMemo(() => memberships?.map(m => m.savingCircleId) || [], [memberships]);
  const circlesQuery = useMemoFirebase(() => {
    if (!db || circleIds.length === 0) return null;
    return query(collection(db, 'saving_circles'), where(documentId(), 'in', circleIds));
  }, [db, circleIds.join(',')]);
  const { data: circles, isLoading: circlesLoading } = useCollection(circlesQuery);

  // 3. Filter valid memberships
  const validMemberships = useMemo(() => {
    if (!memberships) return [];
    if (!circles && !circlesLoading) return [];
    if (!circles) return memberships;
    return memberships.filter(m => circles.some(c => c.id === m.savingCircleId));
  }, [memberships, circles, circlesLoading]);

  const adjudicatedMemberships = useMemo(() => 
    validMemberships.filter(m => m.adjudicationStatus === 'Adjudicated'), 
    [validMemberships]
  );

  const calculateNextInstallmentDate = (joiningDateStr: string, paidCount: number) => {
    const activationDate = new Date(joiningDateStr);
    const minDateForSecond = new Date(activationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let candidate = new Date(activationDate.getFullYear(), activationDate.getMonth(), activationDate.getDate());
    
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

  useEffect(() => {
    setMounted(true);
    
    if (validMemberships.length > 0 && circles) {
      const activeCircleIds = circles
        .filter(c => (c.currentMemberCount || 0) >= c.memberCapacity)
        .map(c => c.id);

      const activeMemberships = validMemberships.filter(m => activeCircleIds.includes(m.savingCircleId));
      
        if (activeMemberships.length > 0) {
          setIsAnyCircleActive(true);
          const nextDates = activeMemberships.map(m => calculateNextInstallmentDate(m.joiningDate, m.paidInstallmentsCount || 0));
          
          if (nextDates.length > 0) {
            const earliest = new Date(Math.min(...nextDates.map(d => d.getTime())));
            setNextDueDate(earliest.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }));
          }
        } else {
        setIsAnyCircleActive(false);
        setNextDueDate('Pendiente de inicio de grupo');
      }
    } else {
      setIsAnyCircleActive(false);
      setNextDueDate(validMemberships.length === 0 ? 'Sin planes activos' : 'Cargando fechas...');
    }
  }, [validMemberships, circles]);


  if (isUserLoading || membershipsLoading || (circleIds.length > 0 && circlesLoading)) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando tu estado de ahorro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mi Panel de Ahorro 👋
          </h1>
          <p className="text-muted-foreground mt-1">Acá podés seguir tus metas y ver cuándo te toca cobrar.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`bg-white px-3 py-1 font-medium ${profile?.role === 'ceo' ? 'border-primary text-primary shadow-sm' : 'border-primary/20 text-primary'}`}>
            {roleText}
          </Badge>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/explore">Nuevo Plan</Link>
          </Button>
        </div>
      </div>

      {adjudicatedMemberships.length > 0 && (
        <div className="space-y-4">
          {adjudicatedMemberships.map((m) => (
            <Alert key={m.id} className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <PartyPopper className="h-6 w-6 text-white" />
              <AlertTitle className="text-lg font-bold ml-2">¡Felicitaciones! Plan Cobrado</AlertTitle>
              <AlertDescription className="ml-2 opacity-90">
                Tu plan <strong>{m.savingCircleName}</strong> ya fue adjudicado y está listo para que recibas la plata. 
              </AlertDescription>
              <Button size="sm" variant="secondary" className="mt-4 font-bold" asChild>
                <Link href="/my-circles">Ver Detalles</Link>
              </Button>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`border-none shadow-sm ${isAnyCircleActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Próxima Cuota</CardTitle>
            <Clock className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{nextDueDate}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Planes Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{validMemberships.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground">YA COBRADOS</CardTitle>
            <Award className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">{adjudicatedMemberships.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Mis Grupos</CardTitle>
          <CardDescription>Seguí tus cuotas y el estado de tus grupos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validMemberships.length === 0 ? (
            <div className="py-10 text-center bg-muted/20 rounded-2xl border-dashed border-2">
              <p className="text-muted-foreground italic">Aún no tienes suscripciones activas.</p>
              <Button variant="link" asChild className="mt-2"><Link href="/explore">Explorar opciones</Link></Button>
            </div>
          ) : (
            validMemberships.map((membership) => {
              const circle = circles?.find(c => c.id === membership.savingCircleId);
              const isCircleActive = circle && (circle.currentMemberCount || 0) >= circle.memberCapacity;
              const totalCapital = membership.capitalPaid + membership.outstandingCapitalBalance;
              const nextPayDate = isCircleActive ? calculateNextInstallmentDate(membership.joiningDate) : null;
              
              return (
                <div key={membership.id} className="group p-5 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {membership.personalGoal || membership.savingCircleName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isCircleActive ? "default" : "secondary"} className={`text-[10px] h-5 ${isCircleActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} border-none`}>
                          {isCircleActive ? 'GRUPO ACTIVO' : 'JUNTANDO GENTE'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Monto del Plan: {formatCurrency(totalCapital)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-white border-primary/20 text-primary">
                      <Link href="/my-circles">Detalles</Link>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
