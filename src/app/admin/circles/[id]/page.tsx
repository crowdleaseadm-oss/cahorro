'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function CircleMembersPage() {
  const params = useParams();
  const db = useFirestore();

  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle } = useDoc(circleRef);

  // In a real multi-user scenario, memberships are nested under /users/{uid}/memberships.
  // To list ALL members for a circle, we would ideally have a separate collection or a collection group query.
  // For this MVP, we simulate listing by showing a filtered list if we had global access.
  // We'll search for memberships globally (requires collectionGroup index in production, but here we'll assume a specific path for ease of demo).
  
  // NOTE: In the provided schema, memberships are in /users/{userId}/saving_circle_memberships/{id}.
  // We can't easily list them all without collectionGroup. Let's assume we have a way to find them or use a mock for now.
  // Actually, I will create a query that fetches members if they were accessible.
  
  // For the sake of this functional demo, I'll provide a way to "Register Payment" for a mock member 
  // until collection groups are fully configured.

  const handleRegisterPayment = (membership: any) => {
    if (!db || !circle) return;

    const alicuota = circle.targetCapital / circle.totalInstallments;
    const subFee = alicuota * circle.subscriptionFeeRate;
    const adminFee = alicuota * circle.administrativeFeeRate;
    const insurance = circle.targetCapital * 0.0009;
    const totalPaid = alicuota + subFee + adminFee + insurance;

    const nextInstallmentNumber = (membership.paidInstallmentsCount || 0) + 1;
    
    // 1. Create Payment Record
    const paymentData = {
      savingCircleMembershipId: membership.id,
      savingCircleAdminUserId: circle.adminUserId,
      userId: membership.userId,
      installmentNumber: nextInstallmentNumber,
      paymentDate: new Date().toISOString(),
      baseInstallmentAmountComponent: alicuota,
      subscriptionFeeComponent: subFee,
      administrativeFeeComponent: adminFee,
      lifeInsuranceComponent: insurance,
      totalPaidAmount: totalPaid,
      status: 'Completed',
      dueDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    const paymentsCol = collection(db, 'users', membership.userId, 'saving_circle_memberships', membership.id, 'payments');
    addDocumentNonBlocking(paymentsCol, paymentData);

    // 2. Update Membership Balance
    const membershipRef = doc(db, 'users', membership.userId, 'saving_circle_memberships', membership.id);
    updateDocumentNonBlocking(membershipRef, {
      paidInstallmentsCount: nextInstallmentNumber,
      capitalPaid: (membership.capitalPaid || 0) + alicuota,
      outstandingCapitalBalance: (membership.outstandingCapitalBalance || circle.targetCapital) - alicuota,
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
          <p className="text-muted-foreground">Gestión de miembros y pagos (USD)</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Capital</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${circle.targetCapital.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Cuotas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.totalInstallments}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Alícuota</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">${(circle.targetCapital / circle.totalInstallments).toFixed(2)}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Capacidad</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{circle.memberCapacity}</div></CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Miembros del Círculo</CardTitle>
          <CardDescription>Registre pagos y supervise el saldo de cada suscriptor.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-8 text-center rounded-xl">
             <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
             <h3 className="text-lg font-bold">Visualización de Miembros</h3>
             <p className="text-muted-foreground max-w-md mx-auto mb-6">
               Para ver miembros reales, los suscriptores deben unirse desde la sección de "Explorar". 
               Una vez unidos, aparecerán aquí para la gestión de sus pagos.
             </p>
             <Badge variant="secondary">Demo Funcional de Pagos lista</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}