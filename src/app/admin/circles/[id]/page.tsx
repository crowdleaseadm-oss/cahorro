
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, where, collectionGroup, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, DollarSign, ArrowLeft, Gavel, UserCheck, Trophy, Shuffle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from "@/hooks/use-toast";

export default function CircleAdminDetail() {
  const params = useParams();
  const db = useFirestore();
  const [isDrawing, setIsDrawing] = useState(false);

  // 1. Fetch Circle Data
  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle } = useDoc(circleRef);

  // 2. Fetch Bids
  const bidsRef = useMemoFirebase(() => (db && params.id ? query(collection(db, 'saving_circles', params.id as string, 'bids'), orderBy('installmentsOffered', 'desc')) : null), [db, params.id]);
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsRef);

  // 3. Fetch Members (using Collection Group to find all memberships for this circle)
  const membersQuery = useMemoFirebase(() => {
    if (!db || !params.id) return null;
    return query(
      collectionGroup(db, 'saving_circle_memberships'),
      where('savingCircleId', '==', params.id)
    );
  }, [db, params.id]);
  const { data: members, isLoading: membersLoading } = useCollection(membersQuery);

  const handleAdjudicateBid = (bid: any) => {
    if (!db) return;
    const bidDocRef = doc(db, 'saving_circles', params.id as string, 'bids', bid.id);
    updateDocumentNonBlocking(bidDocRef, { status: 'Won' });

    const membershipRef = doc(db, 'users', bid.userId, 'saving_circle_memberships', bid.membershipId);
    updateDocumentNonBlocking(membershipRef, { adjudicationStatus: 'Adjudicated' });
    
    toast({ title: "Licitación Adjudicada", description: `El socio ha sido notificado.` });
  };

  const handlePerformDraw = () => {
    if (!circle || !members || members.length === 0) return;
    
    const pendingMembers = members.filter(m => m.adjudicationStatus === 'Pending');
    
    if (pendingMembers.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No hay miembros pendientes de adjudicación." });
      return;
    }

    setIsDrawing(true);

    // Simulate draw animation/delay
    setTimeout(() => {
      const winnersCount = Math.min(circle.drawMethodCount || 1, pendingMembers.length);
      const shuffled = [...pendingMembers].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, winnersCount);

      winners.forEach(winner => {
        const membershipRef = doc(db!, 'users', winner.userId, 'saving_circle_memberships', winner.id);
        updateDocumentNonBlocking(membershipRef, { 
          adjudicationStatus: 'Adjudicated',
          adjudicationMethod: 'Draw',
          adjudicationDate: new Date().toISOString()
        });
      });

      setIsDrawing(false);
      toast({ 
        title: "¡Sorteo Finalizado!", 
        description: `Se han adjudicado ${winnersCount} nuevos miembros por sorteo.` 
      });
    }, 2000);
  };

  if (!circle) return <div className="p-10 text-center">Cargando datos del círculo...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{circle.name}</h1>
            <p className="text-muted-foreground">Gestión Financiera (USD)</p>
          </div>
        </div>
        <Badge variant={circle.status === "Active" ? "default" : "secondary"} className="px-4 py-1">
          {circle.status === "Active" ? "Círculo Activo" : circle.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Capital Suscripto</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${circle.targetCapital.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alícuota Pura</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">${circle.installmentValue.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cupos Sorteo</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.drawMethodCount}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cupos Licitación</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.bidMethodCount}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl bg-white border border-border shadow-sm">
          <TabsTrigger value="members">Miembros ({members?.length || 0})</TabsTrigger>
          <TabsTrigger value="bids">Licitaciones ({bids?.length || 0})</TabsTrigger>
          <TabsTrigger value="draw">Sorteo Mensual</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Listado de Miembros</CardTitle>
              <CardDescription>Supervisión de estados de adjudicación y capital integrado.</CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
              ) : !members || members.length === 0 ? (
                <div className="bg-muted/30 p-12 text-center rounded-xl">
                   <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                   <h3 className="text-lg font-bold">Sin miembros registrados</h3>
                   <p className="text-muted-foreground">Los usuarios deben unirse desde la sección de exploración.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Miembro</TableHead>
                      <TableHead>Fecha Ingreso</TableHead>
                      <TableHead>Capital Pagado</TableHead>
                      <TableHead>Estado Adjudicación</TableHead>
                      <TableHead>Estado Cuenta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-[10px]">{member.id}</TableCell>
                        <TableCell className="text-xs">{new Date(member.joiningDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold">${member.capitalPaid.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={member.adjudicationStatus === 'Adjudicated' ? "default" : "outline"} className={member.adjudicationStatus === 'Adjudicated' ? "bg-green-100 text-green-700 border-none" : ""}>
                            {member.adjudicationStatus === 'Adjudicated' ? 'Adjudicado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge variant="secondary">{member.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bids" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                Ofertas de Licitación
              </CardTitle>
              <CardDescription>Ranking de ofertas para adjudicación anticipada.</CardDescription>
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="p-8 text-center">Cargando ofertas...</div>
              ) : !bids || bids.length === 0 ? (
                <div className="p-12 text-center bg-muted/20 rounded-xl">
                  <p className="text-muted-foreground">No hay ofertas de licitación en este momento.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Cuotas Ofertadas</TableHead>
                      <TableHead>Monto USD (Alícuota)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-bold">{bid.userName || "Socio Registrado"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary border-primary/20">
                            {bid.installmentsOffered} cuotas
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">${bid.amountInUsd.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={bid.status === "Won" ? "default" : "secondary"}>
                            {bid.status === "Won" ? "Adjudicado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.status === "Pending" && (
                            <Button size="sm" onClick={() => handleAdjudicateBid(bid)} className="gap-2">
                              <UserCheck className="h-4 w-4" />
                              Adjudicar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draw" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-primary" />
                  Sorteo de Adjudicación
                </CardTitle>
                <CardDescription>
                  Realiza el sorteo mensual entre los miembros que aún no han sido adjudicados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Miembros en el Bombo</p>
                    <p className="text-3xl font-bold text-primary">
                      {members?.filter(m => m.adjudicationStatus === 'Pending').length || 0}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-muted-foreground">Cupos Disponibles</p>
                    <p className="text-3xl font-bold text-foreground">{circle.drawMethodCount}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Condiciones del Sorteo:</h4>
                   <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Solo participan miembros con estado de cuenta "Active".
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Se seleccionarán {circle.drawMethodCount} ganadores de forma aleatoria.
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        La adjudicación es irreversible una vez ejecutada.
                      </li>
                   </ul>
                </div>

                <Button 
                  className="w-full h-14 text-lg font-bold gap-3 shadow-xl shadow-primary/20"
                  onClick={handlePerformDraw}
                  disabled={isDrawing || !members || members.filter(m => m.adjudicationStatus === 'Pending').length === 0}
                >
                  {isDrawing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Mezclando Bombo...
                    </>
                  ) : (
                    <>
                      <Shuffle className="h-6 w-6" />
                      Ejecutar Sorteo Mensual
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-accent/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  Últimos Adjudicados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members?.filter(m => m.adjudicationStatus === 'Adjudicated').length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">No hay adjudicaciones registradas aún.</p>
                ) : (
                  members?.filter(m => m.adjudicationStatus === 'Adjudicated')
                    .sort((a, b) => new Date(b.adjudicationDate || 0).getTime() - new Date(a.adjudicationDate || 0).getTime())
                    .slice(0, 5)
                    .map((winner) => (
                      <div key={winner.id} className="bg-white p-3 rounded-xl shadow-sm border border-border/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-primary uppercase">{winner.adjudicationMethod === 'Draw' ? 'Sorteo' : 'Licitación'}</span>
                          <span className="text-[9px] text-muted-foreground">{winner.adjudicationDate ? new Date(winner.adjudicationDate).toLocaleDateString() : '-'}</span>
                        </div>
                        <p className="text-xs font-bold truncate">Socio ID: {winner.id.slice(-6).toUpperCase()}</p>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
