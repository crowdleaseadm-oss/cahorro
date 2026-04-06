
'use client';

import { useState, useMemo } from 'react';
import { ShieldCheck, Users, PiggyBank, MoreHorizontal, Plus, Search, DollarSign, Calculator, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AdminPage() {
  const db = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    targetCapital: 50000,
    totalInstallments: 24,
    subscriptionFeeRate: 0.03, // 3%
    administrativeFeeRate: 0.02, // 2%
    drawMethodCount: 1,
    bidMethodCount: 1,
  });

  // Financial Calculations
  const calculations = useMemo(() => {
    const alicuota = formData.targetCapital / formData.totalInstallments;
    const subFee = alicuota * formData.subscriptionFeeRate;
    const adminFee = alicuota * formData.administrativeFeeRate;
    const lifeInsurance = formData.targetCapital * 0.0009; // 0.09% mensual sobre saldo o capital? Usualmente sobre capital suscripto en estos modelos.
    const totalMonthly = alicuota + subFee + adminFee + lifeInsurance;
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    
    return { alicuota, totalMonthly, capacity, lifeInsurance };
  }, [formData]);

  const handleCreateCircle = () => {
    if (!db) return;
    
    const newCircle = {
      ...formData,
      installmentValue: calculations.alicuota,
      lifeInsuranceRate: 0.0009,
      memberCapacity: calculations.capacity,
      status: 'Pending',
      creationDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      adminUserId: 'system-admin', // Placeholder for current admin ID
    };

    addDocumentNonBlocking(collection(db, 'saving_circles'), newCircle);
    setIsDialogOpen(false);
  };

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
  ];

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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Círculo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurar Nuevo Círculo</DialogTitle>
                <DialogDescription>
                  Define los parámetros financieros del grupo. El capital debe ser múltiplo de $5,000.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Círculo</Label>
                    <Input 
                      id="name" 
                      placeholder="Ej: Inversión Premium 2024" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capital">Capital Suscripto (USD)</Label>
                    <Input 
                      id="capital" 
                      type="number" 
                      step="5000" 
                      value={formData.targetCapital}
                      onChange={(e) => setFormData({...formData, targetCapital: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="installments">Cuotas (Múltiplo de 12)</Label>
                    <Input 
                      id="installments" 
                      type="number" 
                      step="12" 
                      value={formData.totalInstallments}
                      onChange={(e) => setFormData({...formData, totalInstallments: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidad Total</Label>
                    <div className="h-10 px-3 flex items-center bg-muted rounded-md font-bold text-primary">
                      {calculations.capacity} miembros
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Sorteos por Ronda (1-5)</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={formData.drawMethodCount}
                      onChange={(e) => setFormData({...formData, drawMethodCount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Licitaciones por Ronda (1-5)</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={formData.bidMethodCount}
                      onChange={(e) => setFormData({...formData, bidMethodCount: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="bg-accent/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary mb-1">
                    <Calculator className="h-4 w-4" />
                    Previsualización Financiera (Estimado Mensual)
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Alícuota Pura</span>
                      <span className="font-bold text-foreground">${calculations.alicuota.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Seguro (0.09%)</span>
                      <span className="font-bold text-foreground">${calculations.lifeInsurance.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Cuota Total</span>
                      <span className="font-bold text-primary text-sm">${calculations.totalMonthly.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCircle}>Crear Círculo en USD</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
