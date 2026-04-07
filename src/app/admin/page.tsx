'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, Users, PiggyBank, MoreHorizontal, Plus, Search, DollarSign, Calculator } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import Link from 'next/link';

export default function AdminPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Garantizar que el administrador esté autenticado (aunque sea anónimamente) para crear círculos
  useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const circlesRef = useMemoFirebase(() => (db ? collection(db, 'saving_circles') : null), [db]);
  const { data: circlesList, isLoading: circlesLoading } = useCollection(circlesRef);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    targetCapital: 50000,
    totalInstallments: 84,
    subscriptionFeeRate: 0.03,
    administrativeFeeRate: 0.02,
    drawMethodCount: 1,
    bidMethodCount: 1,
  });

  const calculations = useMemo(() => {
    const alicuota = formData.targetCapital / formData.totalInstallments;
    const subFee = alicuota * formData.subscriptionFeeRate;
    const adminFee = alicuota * formData.administrativeFeeRate;
    const lifeInsurance = formData.targetCapital * 0.0009;
    const totalMonthly = alicuota + subFee + adminFee + lifeInsurance;
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    
    return { alicuota, totalMonthly, capacity, lifeInsurance };
  }, [formData]);

  const handleCreateCircle = () => {
    if (!db || !user) return;
    
    const newCircle = {
      ...formData,
      installmentValue: calculations.alicuota,
      lifeInsuranceRate: 0.0009,
      memberCapacity: calculations.capacity,
      currentMemberCount: 0,
      status: 'Active',
      creationDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      adminUserId: user.uid, // Vincular con el ID real del usuario autenticado
    };

    addDocumentNonBlocking(collection(db, 'saving_circles'), newCircle);
    setIsDialogOpen(false);
  };

  const installmentOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 12);
  const countOptions = Array.from({ length: 6 }, (_, i) => i);

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

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="installments">Cuotas</Label>
                    <Select 
                      value={formData.totalInstallments.toString()} 
                      onValueChange={(val) => setFormData({...formData, totalInstallments: Number(val)})}
                    >
                      <SelectTrigger id="installments">
                        <SelectValue placeholder="Seleccione cuotas" />
                      </SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map(opt => (
                          <SelectItem key={opt} value={opt.toString()}>{opt} meses</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidad Total</Label>
                    <div className="h-10 px-3 flex items-center bg-muted rounded-md font-bold text-primary">
                      {calculations.capacity} miembros
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sorteos por Ronda</Label>
                    <Select 
                      value={formData.drawMethodCount.toString()} 
                      onValueChange={(val) => setFormData({...formData, drawMethodCount: Number(val)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0-5" />
                      </SelectTrigger>
                      <SelectContent>
                        {countOptions.map(opt => (
                          <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Licitaciones por Ronda</Label>
                    <Select 
                      value={formData.bidMethodCount.toString()} 
                      onValueChange={(val) => setFormData({...formData, bidMethodCount: Number(val)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0-5" />
                      </SelectTrigger>
                      <SelectContent>
                        {countOptions.map(opt => (
                          <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-accent/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary mb-1">
                    <Calculator className="h-4 w-4" />
                    Previsualización Financiera
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
                <Button onClick={handleCreateCircle}>Crear Círculo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Configuración de Círculos</CardTitle>
              <CardDescription>Gestione la capacidad y parámetros financieros.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar círculo..." className="pl-9 h-9 text-xs" />
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
                <TableHead>Estado Llenado</TableHead>
                <TableHead>Estado Admin</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {circlesLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4">Cargando círculos...</TableCell></TableRow>
              ) : circlesList?.map((circle) => {
                const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
                return (
                  <TableRow key={circle.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{circle.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{circle.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${circle.targetCapital.toLocaleString()} USD</TableCell>
                    <TableCell>{circle.totalInstallments}</TableCell>
                    <TableCell className="text-primary font-bold">${(circle.targetCapital / circle.totalInstallments).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={isFull ? "secondary" : "default"} className={isFull ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}>
                          {isFull ? "ACTIVO (Lleno)" : "ABIERTO"}
                        </Badge>
                        <span className="text-[10px] text-center">{circle.currentMemberCount || 0} / {circle.memberCapacity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
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
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/circles/${circle.id}`}>Gestionar Miembros</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Editar Tasas</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive font-bold">Suspender</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}