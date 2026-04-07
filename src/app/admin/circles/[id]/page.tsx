'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser, useAuth } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, ArrowLeft, Gavel, UserCheck, Trophy, Shuffle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { toast } from "@/hooks/use-toast";

export default function CircleAdminDetail() {
  const params = useParams();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isDrawing, setIsDrawing] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const formatNumber = (num: number) => {
    if (!mounted) return num.toString();
    return num.toLocaleString();
  };

  const handleAdjudicateBid = (bid: any) => {
    if (!db || !circle) return;
    
    // Actualizar estado de la licitación
    const bidDocRef = doc(db, 'saving_circles', circle.id, 'bids', bid.id);
    updateDocumentNonBlocking(bidDocRef, { status: 'Won' });

    // Actualizar membresía bajo el usuario
    const userMembershipRef = doc(db, 'users', bid.userId, 'saving_circle_memberships', bid.membershipId);
    updateDocumentNonBlocking(userMembershipRef, { 
      adjudicationStatus: 'Adjudicated',
      adjudicationMethod: 'Bid',
      adjudicationDate: new Date().toISOString()
    });

    // Actualizar membresía duplicada bajo el círculo (para consistencia admin)
    const circleMemberRef = doc(db, 'saving_circles', circle.id, 'members', bid.userId);
    updateDocumentNonBlocking(circleMemberRef, { 
      adjudicationStatus: 'Adjudicated',
      adjudicationMethod: 'Bid',
      adjudicationDate: new Date().toISOString()
    });
    
    toast({ title: "Licitación Adjudicada", description: `El socio ha sido notificado.` });
  };

  const handlePerformDraw = () => {
    if (!circle || !members || members.length === 0 || !db) return;
    
    const pendingMembers = members.filter(m => m.adjudicationStatus === 'Pending');
    
    if (pendingMembers.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No hay miembros pendientes de adjudicación." });
      return;
    }

    setIsDrawing(true);

    setTimeout(() => {
      const winnersCount = Math.min(circle.drawMethodCount || 1, pendingMembers.length);
      const shuffled = [...pendingMembers].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, winnersCount);

      winners.forEach(winner => {
        const updateData = { 
          adjudicationStatus: 'Adjudicated',
          adjudicationMethod: 'Draw',
          adjudicationDate: new Date().toISOString()
        };

        // Actualizar bajo el usuario
        const userMembershipRef = doc(db, 'users', winner.userId, 'saving_circle_memberships', winner.id);
        updateDocumentNonBlocking(userMembershipRef, updateData);

        // Actualizar bajo el círculo
        const circleMemberRef = doc(db, 'saving_circles', circle.id, 'members', winner.userId);
        updateDocumentNonBlocking(circleMemberRef, updateData);
      });

      setIsDrawing(false);
      toast({ 
        title: "¡Sorteo Finalizado!", 
        description: `Se han adjudicado ${winnersCount} nuevos miembros por sorteo.` 
      });
    }, 2000);
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
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Licitaciones</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.bidMethodCount}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl bg-white border">
          <TabsTrigger value="members">Miembros ({members?.length || 0})</TabsTrigger>
          <TabsTrigger value="bids">Licitaciones ({bids?.length || 0})</TabsTrigger>
          <TabsTrigger value="draw">Sorteo Mensual</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Listado de Miembros</CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
              ) : !members || members.length === 0 ? (
                <div className="bg-muted/30 p-12 text-center rounded-xl">
                   <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                   <h3 className="text-lg font-bold">Sin miembros registrados</h3>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Miembro</TableHead>
                      <TableHead>Fecha Ingreso</TableHead>
                      <TableHead>Capital Pagado</TableHead>
                      <TableHead>Estado Adjudicación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-[10px]">{member.id.slice(-8).toUpperCase()}</TableCell>
                        <TableCell className="text-xs">{new Date(member.joiningDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold">${formatNumber(member.capitalPaid)}</TableCell>
                        <TableCell>
                          <Badge variant={member.adjudicationStatus === 'Adjudicated' ? "default" : "outline"} className={member.adjudicationStatus === 'Adjudicated' ? "bg-green-100 text-green-700 border-none" : ""}>
                            {member.adjudicationStatus === 'Adjudicated' ? 'Adjudicado' : 'Pendiente'}
                          </Badge>
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
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="p-8 text-center">Cargando ofertas...</div>
              ) : !bids || bids.length === 0 ? (
                <div className="p-12 text-center bg-muted/20 rounded-xl">
                  <p className="text-muted-foreground">No hay ofertas de licitación.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Cuotas Ofertadas</TableHead>
                      <TableHead>Monto USD</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-bold">{bid.userName || "Socio"}</TableCell>
                        <TableCell>{bid.installmentsOffered} cuotas</TableCell>
                        <TableCell className="font-bold">${formatNumber(bid.amountInUsd)}</TableCell>
                        <TableCell>
                          <Badge variant={bid.status === "Won" ? "default" : "secondary"}>{bid.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.status === "Pending" && (
                            <Button size="sm" onClick={() => handleAdjudicateBid(bid)}>Adjudicar</Button>
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
          <Card className="max-w-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5 text-primary" />
                Sorteo Mensual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Candidatos</p>
                  <p className="text-3xl font-bold text-primary">
                    {members?.filter(m => m.adjudicationStatus === 'Pending').length || 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Cupos Sorteo</p>
                  <p className="text-3xl font-bold">{circle.drawMethodCount}</p>
                </div>
              </div>
              <Button 
                className="w-full h-14 text-lg font-bold gap-3"
                onClick={handlePerformDraw}
                disabled={isDrawing || !members || members.filter(m => m.adjudicationStatus === 'Pending').length === 0}
              >
                {isDrawing ? <Loader2 className="animate-spin" /> : "Ejecutar Sorteo"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}