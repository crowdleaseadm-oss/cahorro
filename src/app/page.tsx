
'use client';

import { useState, useEffect } from 'react';
import { PiggyBank, Users, Calendar, Award, PartyPopper, Loader2, ArrowRight, Clock, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [isAnyCircleActive, setIsAnyCircleActive] = useState(false);

  // 1. Fetch User Memberships
  const membershipsRef = useMemoFirebase(() => 
    (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), 
    [db, user]
  );
  const { data: memberships, isLoading: membershipsLoading } = useCollection(membershipsRef);

  // 2. Fetch Circle Statuses to determine if they are active
  const circleIds = memberships?.map(m => m.savingCircleId) || [];
  const circlesQuery = useMemoFirebase(() => {
    if (!db || circleIds.length === 0) return null;
    return query(collection(db, 'saving_circles'), where(documentId(), 'in', circleIds));
  }, [db, circleIds.join(',')]);
  const { data: circles, isLoading: circlesLoading } = useCollection(circlesQuery);

  const adjudicatedMemberships = (memberships || []).filter(m => m.adjudicationStatus === 'Adjudicated');

  const calculateNextInstallmentDate = (joiningDateStr: string) => {
    const joinDate = new Date(joiningDateStr);
    const minDateForSecond = new Date(joinDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    let next10th = new Date(joinDate.getFullYear(), joinDate.getMonth(), 10);
    while (next10th < minDateForSecond) {
      next10th.setMonth(next10th.getMonth() + 1);
    }
    return next10th;
  };

  useEffect(() => {
    setMounted(true);
    
    if (memberships && memberships.length > 0 && circles) {
      const activeCircleIds = circles
        .filter(c => (c.currentMemberCount || 0) >= c.memberCapacity)
        .map(c => c.id);

      const activeMemberships = memberships.filter(m => activeCircleIds.includes(m.savingCircleId));
      
      if (activeMemberships.length > 0) {
        setIsAnyCircleActive(true);
        const nextDates = activeMemberships.map(m => calculateNextInstallmentDate(m.joiningDate));
        const futureDates = nextDates.filter(d => d >= new Date());
        
        if (futureDates.length > 0) {
          const earliest = new Date(Math.min(...futureDates.map(d => d.getTime())));
          setNextDueDate(earliest.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }));
        } else {
          setNextDueDate('Día 10 del próximo mes');
        }
      } else {
        setIsAnyCircleActive(false);
        setNextDueDate('Pendiente de inicio de grupo');
      }
    } else {
      setIsAnyCircleActive(false);
      setNextDueDate('Sin planes activos');
    }
  }, [memberships, circles]);

  const formatCurrency = (val: number) => {
    if (!mounted) return `$0.00`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isUserLoading || membershipsLoading || (circleIds.length > 0 && circlesLoading)) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando tu resumen financiero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hola, {user?.displayName?.split(' ')[0] || 'Inversor'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Tu resumen de ahorro y adjudicaciones.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-3 py-1 font-medium border-primary/20 text-primary">
            Socio Activo
          </Badge>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/explore">Explorar Círculos</Link>
          </Button>
        </div>
      </div>

      {adjudicatedMemberships.length > 0 && (
        <div className="space-y-4">
          {adjudicatedMemberships.map((m) => (
            <Alert key={m.id} className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <PartyPopper className="h-6 w-6 text-white" />
              <AlertTitle className="text-lg font-bold ml-2">¡Felicitaciones! Plan Adjudicado</AlertTitle>
              <AlertDescription className="ml-2 opacity-90">
                Tu plan <strong>{m.savingCircleName}</strong> ha sido seleccionado para adjudicación. 
                Ponte en contacto con administración para coordinar la entrega de tu capital.
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
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Próximo Vencimiento</CardTitle>
            <Clock className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{nextDueDate}</div>
            <p className="text-xs opacity-70 mt-1">
              {isAnyCircleActive ? 'Cobro administrativo automático' : 'A la espera de conformación de grupo'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Planes Suscriptos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{memberships?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Suscripciones en USD</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground">Adjudicados</CardTitle>
            <Award className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">{adjudicatedMemberships.length}</div>
            <p className="text-xs text-secondary-foreground/70 mt-1">Listos para adjudicar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Tus Planes de Ahorro</CardTitle>
            <CardDescription>Seguimiento de fechas de pago y estado de grupo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!memberships || memberships.length === 0 ? (
              <div className="py-10 text-center bg-muted/20 rounded-2xl border-dashed border-2">
                <p className="text-muted-foreground italic">Aún no tienes suscripciones activas.</p>
                <Button variant="link" asChild className="mt-2"><Link href="/explore">Explorar opciones</Link></Button>
              </div>
            ) : (
              memberships.map((membership) => {
                const circle = circles?.find(c => c.id === membership.savingCircleId);
                const isCircleActive = circle && (circle.currentMemberCount || 0) >= circle.memberCapacity;
                const totalCapital = membership.capitalPaid + membership.outstandingCapitalBalance;
                const progress = totalCapital > 0 ? (membership.capitalPaid / totalCapital) * 100 : 0;
                const nextPayDate = isCircleActive ? calculateNextInstallmentDate(membership.joiningDate) : null;
                
                return (
                  <div key={membership.id} className="group p-5 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{membership.savingCircleName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={isCircleActive ? "default" : "secondary"} className={`text-[10px] h-5 ${isCircleActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} border-none`}>
                            {isCircleActive ? 'GRUPO ACTIVO' : 'GRUPO EN FORMACIÓN'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Capital: {formatCurrency(totalCapital)}</span>
                        </div>
                      </div>
                      <Badge variant={membership.adjudicationStatus === 'Adjudicated' ? "default" : "outline"} className={membership.adjudicationStatus === 'Adjudicated' ? "bg-green-100 text-green-700 border-none" : ""}>
                        {membership.adjudicationStatus === 'Adjudicated' ? 'Adjudicado' : 'Pendiente'}
                      </Badge>
                    </div>
                    
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                            Vencimiento
                            {!isCircleActive && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">El vencimiento se activará cuando el grupo esté completo.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                          <span className={`text-sm font-bold ${isCircleActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {nextPayDate ? nextPayDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'TBD'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cuotas Pagas</span>
                          <span className="text-sm font-bold text-primary">{membership.paidInstallmentsCount} Meses</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="bg-white border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                        <Link href={`/explore/${membership.savingCircleId}`}>Ver Detalle</Link>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Próximos Pasos</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Acciones recomendadas para tu plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-2">
              <h5 className="text-sm font-bold">Licitación Abierta</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Quieres adjudicar antes? Realiza una oferta de licitación en tus círculos activos.
              </p>
              <Button size="sm" variant="link" className="p-0 h-auto text-primary font-bold" asChild>
                <Link href="/my-circles">Ir a Mis Círculos</Link>
              </Button>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <h5 className="text-sm font-bold">Nuevas Oportunidades</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explora nuevos círculos en USD con alícuotas competitivas.
              </p>
              <Button size="sm" variant="link" className="p-0 h-auto text-muted-foreground font-bold" asChild>
                <Link href="/explore">Ver Catálogo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
