'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser, useAuth } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AdminMemberConsolidatedDetail } from '@/components/admin/admin-member-consolidated-detail';
import { Settings, UserMinus, RotateCcw, Loader2, ArrowLeft, Trophy, PiggyBank, Shuffle, Gavel, User, TrendingUp, TrendingDown, ShieldCheck, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculatePenaltyDistribution, CompliantMember } from '@/lib/settlement-utils';
import { checkMemberArrears } from '@/lib/financial-logic';
import { initiateWinnerValidation } from '@/lib/adjudication-service';

export default function CircleAdminDetail() {
  const params = useParams();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isDrawing, setIsDrawing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [initialView, setInitialView] = useState<'profile' | 'adjudication' | 'financial'>('profile');

  useEffect(() => {
    setMounted(true);
    if (!user && !isUserLoading && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // 1. Fetch Circle Data
  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle } = useDoc(circleRef);

  // 2. Fetch Bids
  const bidsRef = useMemoFirebase(() => (db && params.id && user ? query(collection(db, 'saving_circles', params.id as string, 'bids'), orderBy('installmentsOffered', 'desc')) : null), [db, params.id, user]);
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsRef);

  // 3. Fetch Members (Consultamos directamente la subcolección del círculo para evitar errores de permisos de collectionGroup)
  const membersQuery = useMemoFirebase(() => {
    if (!db || !params.id || !user) return null;
    return collection(db, 'saving_circles', params.id as string, 'members');
  }, [db, params.id, user]);
  const { data: members, isLoading: membersLoading } = useCollection(membersQuery);

  const handleAdjudicateBid = async (bid: any) => {
    if (!db || !circle) return;
    try {
      await initiateWinnerValidation(db, bid.userId, circle.id, bid.membershipId, 'Bid');
      toast({ title: "Licitación Iniciada", description: "El socio ha pasado a revisión administrativa (48hs)." });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo iniciar la validación.", variant: "destructive" });
    }
  };

  const handlePerformDraw = async (winner: any) => {
    if (!circle || !db) return;
    setIsDrawing(true);
    try {
      await initiateWinnerValidation(db, winner.userId, circle.id, winner.id, 'Draw');
      setIsDrawing(false);
      toast({ title: "Sorteo Registrado", description: "Ganador pendiente de confirmación (48hs)." });
    } catch (e) {
      setIsDrawing(false);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isUserLoading || !user || !circle) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground">Autenticando y cargando datos...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{circle.name}</h1>
            <p className="text-muted-foreground">ID: {circle.id}</p>
          </div>
        </div>
        <Badge variant={circle.status === "Active" ? "default" : "secondary"}>
          {circle.status === "Active" ? "Círculo Activo" : circle.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Capital</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${formatNumber(circle.targetCapital)}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Alícuota</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">${circle.installmentValue.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Sorteos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.drawMethodCount}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Fondo Penalidades</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(circle.accumulatedPenaltyFund || 0)}</div></CardContent>
        </Card>
      </div>
       <Tabs defaultValue="members" className="mt-8">
        <TabsList className="bg-muted/50 p-1 rounded-2xl border mb-6">
          <TabsTrigger value="members" className="px-6 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Miembros y Gestión</TabsTrigger>
          <TabsTrigger value="settlement" className="px-6 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Liquidación Final
            {circle.status === 'Closed' && <Badge className="ml-2 bg-emerald-500 h-4 text-[9px] px-1">Listo</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mt-8">
            <CardHeader className="border-b bg-muted/30 px-8 py-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Gestión Integral de Miembros</CardTitle>
                <CardDescription>Consolidado de adjudicaciones, mora y contacto</CardDescription>
              </div>
              <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                {members?.length || 0} Socios Activos
              </Badge>
            </CardHeader>
            <CardContent className="p-0 text-left">
              {membersLoading ? (
                <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></div>
              ) : !members || members.length === 0 ? (
                <div className="p-20 text-center bg-muted/5">
                  <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">Sin miembros registrados</h3>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="px-8 font-bold text-xs uppercase tracking-widest py-4">Miembro</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-widest py-4">N° Orden</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Adjudicado</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Estado Financiero / Mora</TableHead>
                      <TableHead className="text-right px-8 font-bold text-xs uppercase tracking-widest py-4">Contactar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const { isInArrears } = checkMemberArrears(member, circle);

                      return (
                        <TableRow key={member.id} className="group hover:bg-muted/5 transition-colors">
                          <TableCell className="px-8 py-4">
                            <button 
                              onClick={() => { setSelectedMember(member); setInitialView('profile'); setIsDetailOpen(true); }}
                              className="flex flex-col text-left hover:text-primary transition-colors group/btn"
                            >
                              <span className="font-bold text-sm flex items-center gap-1">
                                {member.userName || "Socio"}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground uppercase">{member.userId.slice(-8)}</span>
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-xl font-black text-primary">
                              {member.orderNumber ? member.orderNumber.toString().padStart(2, '0') : '--'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <button 
                              onClick={() => { setSelectedMember(member); setInitialView('adjudication'); setIsDetailOpen(true); }}
                              className="flex flex-col gap-1 items-start group/adj"
                            >
                              <Badge variant={member.adjudicationStatus === 'Adjudicated' ? "default" : member.adjudicationStatus === 'WinnerPendingConfirmation' ? "secondary" : "outline"} className={member.adjudicationStatus === 'Adjudicated' ? "bg-green-100 text-green-700 border-none px-3" : "px-3"}>
                                {member.adjudicationStatus === 'Adjudicated' ? 'SÍ' : member.adjudicationStatus === 'WinnerPendingConfirmation' ? 'PENDIENTE' : 'NO'}
                              </Badge>
                              {member.adjudicationStatus === 'Adjudicated' && (
                                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 group-hover/adj:text-primary">
                                  Ver detalles <Trophy className="h-2 w-2" />
                                </span>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button 
                              onClick={() => { setSelectedMember(member); setInitialView('financial'); setIsDetailOpen(true); }}
                              className="flex flex-col gap-1 items-start group/fin text-left"
                            >
                              <div className="flex items-center gap-2">
                                 <span className="font-bold text-sm">{formatCurrency(member.capitalPaid)}</span>
                                 {isInArrears ? (
                                   <Badge variant="destructive" className="h-5 text-[9px] font-bold px-2 animate-pulse">EN MORA</Badge>
                                 ) : (
                                   <Badge className="h-5 text-[9px] font-bold px-2 bg-green-500 hover:bg-green-600">AL DÍA</Badge>
                                 )}
                              </div>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 group-hover/fin:text-primary">
                                Situación financiera <TrendingDown className="h-2 w-2" />
                              </span>
                            </button>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      className="h-9 w-9 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                                      asChild
                                    >
                                      <a href={`https://wa.me/${member.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>WhatsApp</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary"
                                      onClick={() => { setSelectedMember(member); setInitialView('profile'); setIsDetailOpen(true); }}
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Gestión Rápida</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlement">
          <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden text-left">
            <CardHeader className="border-b bg-emerald-50/50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-emerald-800">Cálculo de Beneficio por Conducta Ideal</CardTitle>
                  <CardDescription>Distribución del fondo de penalidades acumulado (${formatNumber(circle.accumulatedPenaltyFund || 0)})</CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fondo Total a Distribuir</span>
                  <div className="text-2xl font-black text-emerald-600">{formatCurrency(circle.accumulatedPenaltyFund || 0)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {(() => {
                 const perfectMembers = (members || []).filter(m => m.perfectBehavior);
                 const distribution = calculatePenaltyDistribution(circle.accumulatedPenaltyFund || 0, perfectMembers as any[]);
                 
                 if (perfectMembers.length === 0) {
                   return (
                     <div className="p-20 text-center bg-muted/5">
                        <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold">No se detectaron socios con conducta ideal</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                          El fondo de penalidades solo se distribuye entre aquellos socios que mantuvieron un historial de pago perfecto durante todo el plan.
                        </p>
                     </div>
                   );
                 }

                 return (
                   <>
                     <Table>
                       <TableHeader className="bg-muted/10">
                         <TableRow>
                           <TableHead className="px-8 font-bold text-xs uppercase tracking-widest py-4 text-emerald-800">N° Orden Adj.</TableHead>
                           <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Socio Cumplidor</TableHead>
                           <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Fecha Adjudicación</TableHead>
                           <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-center">Peso (%)</TableHead>
                           <TableHead className="text-right px-8 font-bold text-xs uppercase tracking-widest py-4 text-emerald-600">Beneficio Proyectado</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {distribution.map((item) => (
                           <TableRow key={item.id} className="hover:bg-emerald-50/30 transition-colors border-l-4 border-l-transparent hover:border-l-emerald-400">
                             <TableCell className="px-8 py-4 font-black text-lg text-emerald-700">
                               #{item.distributionIndex}
                             </TableCell>
                             <TableCell>
                               <div className="font-bold text-sm text-slate-900">{item.userName}</div>
                               <div className="text-[10px] text-muted-foreground uppercase font-mono">{item.userId.slice(-8)}</div>
                             </TableCell>
                             <TableCell className="text-sm font-medium">
                               {new Date(item.adjudicationDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                             </TableCell>
                             <TableCell className="text-center">
                               <Badge variant="outline" className="font-black text-emerald-600 border-emerald-200">
                                 {item.percentage.toFixed(1)}%
                               </Badge>
                             </TableCell>
                             <TableCell className="text-right px-8 font-black text-emerald-600">
                               {formatCurrency(item.shareAmount)}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>

                     <div className="p-8 bg-slate-50 border-t flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <ShieldCheck className="h-5 w-5" />
                           </div>
                           <p className="text-xs text-slate-500 font-medium max-w-md">
                             <span className="font-bold text-slate-900 block">Distribución Ponderada:</span>
                             El cálculo premia el tiempo de espera. Los socios adjudicados al final del ciclo reciben una porción mayor del fondo acumulado por penalidades.
                           </p>
                        </div>
                        {circle.status === 'Closed' ? (
                          <Button className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200">
                             Confirmar Liquidación Final
                          </Button>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                             <Button disabled className="h-12 px-8 rounded-xl opacity-50 bg-slate-400 text-white font-black uppercase tracking-widest text-xs">
                                Confirmar Liquidación Final
                             </Button>
                             <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">Habilitado solo al cerrar grupo</span>
                          </div>
                        )}
                     </div>
                   </>
                 );
               })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdminMemberConsolidatedDetail 
        member={selectedMember} 
        circle={circle} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        initialView={initialView}
      />
    </div>
  );
}