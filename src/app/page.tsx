import { PiggyBank, TrendingUp, Users, Calendar, ArrowUpRight, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default function Dashboard() {
  const activeCircles = [
    {
      id: "1",
      name: "Círculo Emprendedores Q4",
      target: 50000,
      progress: 65,
      nextPayment: "2024-05-15",
      fee: 2500,
      status: "Al día",
    },
    {
      id: "2",
      name: "Plan Vivienda Joven",
      target: 120000,
      progress: 30,
      nextPayment: "2024-05-20",
      fee: 5000,
      status: "Pendiente",
    }
  ]

  const history = [
    { date: "15 Abr 2024", concept: "Cuota 6/12 - Emprendedores", amount: 2500, status: "Completado" },
    { date: "20 Abr 2024", concept: "Cuota 4/24 - Plan Vivienda", amount: 5000, status: "Completado" },
    { date: "15 Mar 2024", concept: "Cuota 5/12 - Emprendedores", amount: 2500, status: "Completado" },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, Alejandro 👋</h1>
          <p className="text-muted-foreground mt-1">Aquí tienes el resumen de tu progreso financiero.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-3 py-1 font-medium border-primary/20 text-primary">
            Nivel Plata
          </Badge>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/explore">Explorar nuevos grupos</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Total Ahorrado</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$72,500.00</div>
            <p className="text-xs opacity-70 mt-1">+12% respecto al mes pasado</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Círculos Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground mt-1">Contribuyendo activamente</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximo Pago</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">15 May</div>
            <p className="text-xs text-muted-foreground mt-1">$2,500.00 pendientes</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground">Adjudicaciones</CardTitle>
            <Award className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">1</div>
            <p className="text-xs text-secondary-foreground/70 mt-1">Círculo Q1 Finalizado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Active Progress */}
        <Card className="md:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mis Círculos de Ahorro</CardTitle>
            <CardDescription>Seguimiento de tus metas y cuotas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeCircles.map((circle) => (
              <div key={circle.id} className="group p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{circle.name}</h4>
                    <span className="text-xs text-muted-foreground">Meta: ${circle.target.toLocaleString()}</span>
                  </div>
                  <Badge variant={circle.status === "Al día" ? "secondary" : "destructive"} className="px-2 py-0.5">
                    {circle.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Progreso</span>
                    <span className="text-primary font-bold">{circle.progress}%</span>
                  </div>
                  <Progress value={circle.progress} className="h-2" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Cuota</span>
                      <span className="text-sm font-bold">${circle.fee}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Pago</span>
                      <span className="text-sm font-bold">{circle.nextPayment}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* History / Transactions */}
        <Card className="md:col-span-3 border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Historial Reciente</CardTitle>
                <CardDescription>Tus últimos movimientos.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-accent">
                Ver todo
              </Button>
            </div>
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
                        <span className="font-bold text-sm text-primary">-${tx.amount}</span>
                        <span className="text-[10px] font-bold text-secondary-foreground px-1.5 py-0.5 bg-secondary rounded-full">
                          {tx.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}