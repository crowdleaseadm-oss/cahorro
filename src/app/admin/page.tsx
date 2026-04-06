
'use client';

import { ShieldCheck, Users, PiggyBank, MoreHorizontal, Plus, Search, Mail, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminPage() {
  const circles = [
    { 
      id: "C001", 
      name: "Empresarios Q4", 
      members: "24/48", 
      status: "Activo", 
      capital: 50000, 
      installments: 24,
      alicuota: 2083.33 
    },
    { 
      id: "C002", 
      name: "Inmuebles Sur", 
      members: "8/120", 
      status: "Abierto", 
      capital: 150000, 
      installments: 60,
      alicuota: 2500 
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-1">Gestión de Círculos de Ahorro en USD.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white border-border">Reportes USD</Button>
          <Button className="shadow-lg shadow-primary/20 gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Círculo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Capital Suscripto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,250,000</div>
            <div className="text-xs text-muted-foreground mt-1">Consolidado en USD</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grupos Activos</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <div className="text-xs text-muted-foreground mt-1">Múltiplos de 12 cuotas</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Adjudicaciones Mes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground mt-1">Sorteo y Licitación</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Configuración de Círculos</CardTitle>
              <CardDescription>Parámetros financieros: Alícuotas, Gastos y Seguros.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por capital o nombre..." className="pl-9 h-9 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / ID</TableHead>
                <TableHead>Cap. Suscripto</TableHead>
                <TableHead>Cuotas</TableHead>
                <TableHead>Alícuota Pura</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {circles.map((circle) => (
                <TableRow key={circle.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{circle.name}</span>
                      <span className="text-[10px] text-muted-foreground">{circle.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${circle.capital.toLocaleString()} USD</TableCell>
                  <TableCell>{circle.installments}</TableCell>
                  <TableCell className="text-primary font-bold">${circle.alicuota.toLocaleString()}</TableCell>
                  <TableCell>{circle.members}</TableCell>
                  <TableCell>
                    <Badge variant={circle.status === "Abierto" ? "default" : "secondary"}>
                      {circle.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar Tasas (Admin/Susc.)</DropdownMenuItem>
                        <DropdownMenuItem>Ver Plan de Adjudicación</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive font-bold">Suspender</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
