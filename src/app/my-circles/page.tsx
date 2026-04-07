
'use client';

import { PiggyBank, ArrowRight, Target, Calendar, DollarSign, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function MyCirclesPage() {
  // Mock data for user's memberships
  const memberships = [
    {
      id: "M001",
      circleName: "Círculo Emprendedores 50K",
      capital: 50000,
      installments: 24,
      paidCount: 6,
      alicuota: 2083.33,
      totalMonthly: 2350,
      balance: 37500, // 50000 - (6 * 2083.33)
      status: "Activo",
      adjudicationStatus: "Pendiente",
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PiggyBank className="h-8 w-8 text-primary" />
            Mis Círculos
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona tus suscripciones y seguimiento de capital en USD.</p>
        </div>
      </div>

      {memberships.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center p-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-bold">No tienes círculos activos</h3>
          <p className="text-muted-foreground mb-6">Únete a un círculo para comenzar tu plan de ahorro programado.</p>
          <Button asChild>
            <Link href="/explore">Explorar Círculos</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {memberships.map((membership) => {
            const progress = (membership.paidCount / membership.installments) * 100;
            return (
              <Card key={membership.id} className="border-none shadow-sm overflow-hidden bg-white">
                <div className="grid md:grid-cols-12">
                  <div className="md:col-span-4 bg-accent/30 p-6 flex flex-col justify-between border-r border-border">
                    <div className="space-y-4">
                      <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20">{membership.status}</Badge>
                      <div>
                        <h2 className="text-xl font-bold">{membership.circleName}</h2>
                        <p className="text-xs text-muted-foreground">ID Membresía: {membership.id}</p>
                      </div>
                    </div>
                    <div className="mt-8 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Progreso de Capital</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>

                  <div className="md:col-span-8 p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Capital Suscripto</span>
                        <div className="flex items-center gap-1.5 font-bold text-lg">
                          <Target className="h-4 w-4 text-primary" />
                          ${membership.capital.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Saldo de Capital</span>
                        <div className="flex items-center gap-1.5 font-bold text-lg text-primary">
                          <DollarSign className="h-4 w-4" />
                          ${membership.balance.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Cuotas Pagas</span>
                        <div className="flex items-center gap-1.5 font-bold text-lg">
                          <Calendar className="h-4 w-4 text-primary" />
                          {membership.paidCount}/{membership.installments}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Adjudicación</span>
                        <div className="flex items-center gap-1.5 font-bold text-lg">
                          <Badge variant="secondary" className="bg-secondary/50">{membership.adjudicationStatus}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Próxima Cuota Estimada: </span>
                        <span className="font-bold text-foreground">${membership.totalMonthly.toFixed(2)} USD</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none">Historial de Pagos</Button>
                        <Button asChild className="flex-1 sm:flex-none gap-2">
                          <Link href={`/explore/${membership.id}`}>
                            Ver Plan Financiero
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
