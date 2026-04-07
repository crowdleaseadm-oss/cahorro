
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, DollarSign, ArrowLeft, Gavel, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function CircleAdminDetail() {
  const params = useParams();
  const db = useFirestore();

  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle } = useDoc(circleRef);

  const bidsRef = useMemoFirebase(() => (db && params.id ? query(collection(db, 'saving_circles', params.id as string, 'bids'), orderBy('installmentsOffered', 'desc')) : null), [db, params.id]);
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsRef);

  const handleAdjudicate = (bid: any) => {
    if (!db) return;
    
    // 1. Mark bid as Won
    const bidDocRef = doc(db, 'saving_circles', params.id as string, 'bids', bid.id);
    updateDocumentNonBlocking(bidDocRef, { status: 'Won' });

    // 2. Update user membership
    const membershipRef = doc(db, 'users', bid.userId, 'saving_circle_memberships', bid.membershipId);
    updateDocumentNonBlocking(membershipRef, { 
      adjudicationStatus: 'Adjudicated'
    });
  };

  if (!circle) return <div className="p-10 text-center">Cargando datos del círculo...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{circle.name}</h1>
          <p className="text-muted-foreground">Gestión Financiera (USD)</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Capital</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${circle.targetCapital.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Alícuota</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">${circle.installmentValue.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sorteos/Mes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.drawMethodCount}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Licitaciones/Mes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.bidMethodCount}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border border-border shadow-sm">
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="bids">Licitaciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Listado de Miembros</CardTitle>
              <CardDescription>Supervisión de estados y pagos de suscripción.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-12 text-center rounded-xl">
                 <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                 <h3 className="text-lg font-bold">Sin miembros registrados aún</h3>
                 <p className="text-muted-foreground">Los usuarios deben unirse desde la sección "Explorar".</p>
              </div>
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
              <CardDescription>Ranking de miembros que ofrecen adelantar cuotas.</CardDescription>
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
                      <TableHead>Fecha</TableHead>
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
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(bid.bidDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={bid.status === "Won" ? "default" : "secondary"}>
                            {bid.status === "Won" ? "Adjudicado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.status === "Pending" && (
                            <Button size="sm" onClick={() => handleAdjudicate(bid)} className="gap-2">
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
      </Tabs>
    </div>
  );
}
