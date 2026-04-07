
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, Users, PiggyBank, MoreHorizontal, Plus, Search, DollarSign, Calculator, Settings2, Eye, EyeOff, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function AdminPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const circlesRef = useMemoFirebase(() => (db ? collection(db, 'saving_circles') : null), [db]);
  const { data: circlesList, isLoading: circlesLoading } = useCollection(circlesRef);

  const [formData, setFormData] = useState({
    name: '',
    targetCapital: 50000,
    totalInstallments: 84,
    subscriptionFeeRate: 0.03, // 3%
    administrativeFeeRate: 0.10, // 10%
    lifeInsuranceRate: 0.0009, // 0.09%
    drawMethodCount: 1,
    bidMethodCount: 1,
    isPrivate: false,
    password: '',
  });

  const calculations = useMemo(() => {
    const alicuota = formData.targetCapital / formData.totalInstallments;
    const adminFee = alicuota * formData.administrativeFeeRate;
    const lifeInsuranceInicial = formData.targetCapital * formData.lifeInsuranceRate;
    const totalSubFee = formData.targetCapital * formData.subscriptionFeeRate;
    const cuotasSuscripcion = Math.ceil(formData.totalInstallments * 0.20);
    const subFeeMensual = totalSubFee / cuotasSuscripcion;

    const totalCuotaInicial = alicuota + adminFee + lifeInsuranceInicial + subFeeMensual;
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    
    return { alicuota, adminFee, totalCuotaInicial, capacity, lifeInsuranceInicial, subFeeMensual };
  }, [formData]);

  const handleCreateCircle = () => {
    if (!db || !user) return;
    if (formData.isPrivate && !formData.password) {
      toast({ title: "Error", description: "Los círculos privados requieren una contraseña.", variant: "destructive" });
      return;
    }
    
    const newCircle = {
      ...formData,
      installmentValue: calculations.alicuota,
      memberCapacity: calculations.capacity,
      currentMemberCount: 0,
      status: 'Active',
      creationDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      adminUserId: user.uid,
    };

    addDocumentNonBlocking(collection(db, 'saving_circles'), newCircle);
    setIsDialogOpen(false);
    toast({ title: "Círculo Creado", description: `El círculo ${formData.name} se ha configurado exitosamente.` });
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
          <p className="text-muted-foreground mt-1">Gestión avanzada de Círculos de Ahorro.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Círculo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Configurar Nuevo Círculo</DialogTitle>
                <DialogDescription>
                  Define los parámetros financieros y la visibilidad del grupo.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="name">Nombre del Círculo</Label>
                    <Input 
                      id="name" 
                      placeholder="Ej: Inversión Premium 2024" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-sm text-primary">
                      <Settings2 className="h-4 w-4" />
                      Editor de Tasas
                    </div>
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Gasto Administrativo (% de alícuota)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={formData.administrativeFeeRate}
                          onChange={(e) => setFormData({...formData, administrativeFeeRate: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Suscripción (% de capital total)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={formData.subscriptionFeeRate}
                          onChange={(e) => setFormData({...formData, subscriptionFeeRate: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Seguro de Vida (% sobre saldo)</Label>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          value={formData.lifeInsuranceRate}
                          onChange={(e) => setFormData({...formData, lifeInsuranceRate: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-sm text-primary">
                      <Lock className="h-4 w-4" />
                      Privacidad y Acceso
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Círculo Privado</Label>
                          <p className="text-[10px] text-muted-foreground">Requiere contraseña para ver detalles.</p>
                        </div>
                        <Switch 
                          checked={formData.isPrivate} 
                          onCheckedChange={(checked) => setFormData({...formData, isPrivate: checked})} 
                        />
                      </div>
                      {formData.isPrivate && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                          <Label className="text-xs">Contraseña de Acceso</Label>
                          <Input 
                            type="password" 
                            placeholder="Defina una clave" 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="installments">Plazo (Meses)</Label>
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
                    Proyección Cuota #1 (Simulación)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                    <div>
                      <span className="text-muted-foreground block uppercase">Alícuota</span>
                      <span className="font-bold text-foreground">${calculations.alicuota.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block uppercase">Admin</span>
                      <span className="font-bold text-foreground">${calculations.adminFee.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block uppercase">Seguro</span>
                      <span className="font-bold text-foreground">${calculations.lifeInsuranceInicial.toFixed(2)}</span>
                    </div>
                    <div className="bg-primary/10 p-1 rounded">
                      <span className="text-primary block uppercase font-bold">Total Inicial</span>
                      <span className="font-black text-primary text-sm">${calculations.totalCuotaInicial.toFixed(2)}</span>
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
              <CardTitle className="text-lg">Círculos Configurados</CardTitle>
              <CardDescription>Supervisión financiera y estado de grupos.</CardDescription>
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
                <TableHead>Privacidad</TableHead>
                <TableHead>Cap. Suscripto</TableHead>
                <TableHead>Cuotas</TableHead>
                <TableHead>Alícuota</TableHead>
                <TableHead>Estado Llenado</TableHead>
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
                    <TableCell>
                      {circle.isPrivate ? (
                        <Badge variant="outline" className="gap-1 border-orange-200 text-orange-700 bg-orange-50">
                          <Lock className="h-3 w-3" /> Privado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 bg-blue-50">
                          <Eye className="h-3 w-3" /> Público
                        </Badge>
                      )}
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
