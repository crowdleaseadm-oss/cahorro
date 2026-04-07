
'use client';

import { PiggyBank, TrendingUp, Users, Calendar, Award, DollarSign, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default function Dashboard() {
  // Financial metrics based on 50K circle with 24 installments
  const activeCircles = [
    {
      id: "1",
      name: "Círculo Emprendedores 50K",
      targetCapital: 50000,
      paidInstallments: 6,
      totalInstallments: 24,
      alicuota: 2083.33,
      totalFee: 2350,
      status: "Al día",
    }
  ]

  // Calculated values
  const capitalPaid = activeCircles[0].paidInstallments * activeCircles[0].alicuota;
  const capitalBalance = activeCircles[0].targetCapital - capitalPaid;
  const progressPercent = (activeCircles[0].paidInstallments / activeCircles[0].totalInstallments) * 100;

  const history = [
    { date: "15 Abr 2024", concept: "Cuota 6/24 - Alicuota + Gastos", amount: 2350, status: "Completado" },
    { date: "15 Mar 2024", concept: "Cuota 5/24 - Alicuota + Gastos", amount: 2350, status: "Completado" },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, Alejandro 👋</h1>
          <p className="text-muted-foreground mt-1">Tu resumen financiero consolidado en USD.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-3 py-1 font-medium border-primary/20 text-primary">
            Nivel Inversor
          </Badge>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/explore">Explorar Círculos</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Capital Integrado</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${capitalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs opacity-70 mt-1">Monto en alícuotas puras (USD)</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Saldo de Capital</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${capitalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendiente de suscripción</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próxima Alícuota</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${activeCircles[0].alicuota.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sin contar gastos/seguros</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground">Vencimiento</CardTitle>
            <PiggyBank className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">15 May</div>
            <p className="text-xs text-secondary-foreground/70 mt-1">Cuota total: ${activeCircles[0].totalFee}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Seguimiento de Capital USD</CardTitle>
            <CardDescription>Progreso basado en Alícuota Pura / Capital Suscripto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeCircles.map((circle) => (
              <div key={circle.id} className="group p-5 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{circle.name}</h4>
                    <span className="text-xs text-muted-foreground">Capital Suscripto: ${circle.targetCapital.toLocaleString()} USD</span>
                  </div>
                  <Badge variant="secondary" className="px-2 py-0.5 bg-green-100 text-green-700 border-none">
                    {circle.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Capital Pagado vs Saldo</span>
                    <span className="text-primary font-bold">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cuota Total</span>
                      <span className="text-sm font-bold text-primary">${circle.totalFee.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Saldo Capital</span>
                      <span className="text-sm font-bold text-foreground">${capitalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="bg-white border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                    <Link href={`/explore/${circle.id}`}>Ver Plan Financiero</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Historial en USD</CardTitle>
            <CardDescription>Pagos de cuotas integradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {history.map((tx, idx) => (
                  <TableRow key={idx} className="hover:bg-accent/30 border-none">
                    <TableCell className="pl-0 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{tx.concept}</span>
                        <span className="text-xs text-muted-foreground">{tx.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-0">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-sm text-primary">-${tx.amount.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-secondary-foreground px-1.5 py-0.5 bg-secondary rounded-full">
                          {tx.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-muted-foreground hover:text-primary">
              Descargar Comprobantes Fiscales
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
