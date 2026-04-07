'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, ShieldCheck, TrendingUp, Users, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function CirclePlanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const circleRef = useMemoFirebase(() => (db && params.id ? doc(db, 'saving_circles', params.id as string) : null), [db, params.id]);
  const { data: circle, isLoading: circleLoading } = useDoc(circleRef);

  if (circleLoading) return <div className="p-10 text-center">Cargando plan...</div>;
  if (!circle) return <div className="p-10 text-center text-destructive">Círculo no encontrado</div>;

  const alicuota = circle.targetCapital / circle.totalInstallments;
  const subFee = alicuota * circle.subscriptionFeeRate;
  const adminFee = alicuota * circle.administrativeFeeRate;
  const insurance = circle.targetCapital * 0.0009;
  const totalMonthly = alicuota + subFee + adminFee + insurance;
  const totalMembers = circle.memberCapacity;

  const handleSubscribe = () => {
    if (!user || !db) return;
    setIsSubscribing(true);

    const membershipData = {
      userId: user.uid,
      savingCircleId: circle.id,
      savingCircleName: circle.name,
      savingCircleAdminUserId: circle.adminUserId,
      joiningDate: new Date().toISOString(),
      status: 'Active',
      paidInstallmentsCount: 0,
      capitalPaid: 0,
      outstandingCapitalBalance: circle.targetCapital,
      adjudicationStatus: 'Pending',
      createdAt: serverTimestamp(),
    };

    const membershipsCol = collection(db, 'users', user.uid, 'saving_circle_memberships');
    addDocumentNonBlocking(membershipsCol, membershipData);
    
    // Simulate navigation after start
    setTimeout(() => {
      router.push('/my-circles');
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/explore">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Plan Financiero Detallado</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">{circle.name}</CardTitle>
                <CardDescription>Capital Suscripto: ${circle.targetCapital.toLocaleString()} USD</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">Sin Interés Bancario</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Alícuota Pura</span>
                <span className="text-lg font-bold text-foreground">${alicuota.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Capacidad</span>
                <span className="text-lg font-bold text-foreground">{totalMembers} Miembros</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Plazo</span>
                <span className="text-lg font-bold text-foreground">{circle.totalInstallments} Meses</span>
              </div>
            </div>

            <div className="bg-accent/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Calculator className="h-5 w-5" />
                Desglose de Cuota Mensual
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alícuota Pura (Capital / Cuotas)</span>
                  <span className="font-medium">${alicuota.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Der. Suscripción ({(circle.subscriptionFeeRate * 100).toFixed(0)}%) + Adm ({(circle.administrativeFeeRate * 100).toFixed(0)}%)</span>
                  <span className="font-medium">${(subFee + adminFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seguro de Vida (0.09%)</span>
                  <span className="font-medium">${insurance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t">
                  <span>Cuota Total Mensual</span>
                  <span>${totalMonthly.toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Adjudicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Sorteo Mensual</span>
                </div>
                <span className="font-bold">{circle.drawMethodCount} cupo</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Licitación Mensual</span>
                </div>
                <span className="font-bold">{circle.bidMethodCount} cupo</span>
              </div>
              <Button 
                variant="secondary" 
                className="w-full font-bold"
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Suscribiendo...' : 'Suscribirme Ahora'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">Información Útil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Capital ajustable en USD",
                "Sin costos de otorgamiento",
                "Seguro de vida incluido",
                "Cancelación anticipada"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {text}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Tabla de Amortización Estimada</CardTitle>
          <CardDescription>Simulación de las primeras 6 cuotas integradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuota #</TableHead>
                <TableHead>Alícuota</TableHead>
                <TableHead>Gastos + Seguro</TableHead>
                <TableHead>Total Cuota</TableHead>
                <TableHead>Saldo de Capital</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TableRow key={num}>
                  <TableCell className="font-bold">#{num}</TableCell>
                  <TableCell>${alicuota.toFixed(2)}</TableCell>
                  <TableCell>${(subFee + adminFee + insurance).toFixed(2)}</TableCell>
                  <TableCell className="text-primary font-bold">${totalMonthly.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${(circle.targetCapital - (num * alicuota)).toFixed(2)} USD</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}