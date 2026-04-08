
'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  PiggyBank, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Loader2,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Info,
  Share2,
  Edit2,
  Mail,
  Copy,
  CheckCircle2,
  Settings2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function AdminPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [circleToDelete, setCircleToDelete] = useState<any>(null);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [selectedCircleFilter, setSelectedCircleFilter] = useState<string>('all');
  
  useEffect(() => {
    if (!user && !isUserLoading && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const circlesRef = useMemoFirebase(() => (db ? collection(db, 'saving_circles') : null), [db]);
  const { data: circlesList, isLoading: circlesLoading } = useCollection(circlesRef);

  const IVA_RATE = 1.21;

  const financialStats = useMemo(() => {
    if (!circlesList) return { 
      subPercibida: 0, subProyectada: 0, 
      adminPercibida: 0, adminProyectada: 0, 
      activeMembers: 0, totalCapacity: 0 
    };
    
    const filtered = selectedCircleFilter === 'all' 
      ? circlesList 
      : circlesList.filter(c => c.id === selectedCircleFilter);

    return filtered.reduce((acc, circle) => {
      const subRate = circle.subscriptionFeeRate || 0.03;
      const subFeePerMember = (circle.targetCapital * subRate) * IVA_RATE;
      
      const alicuota = circle.targetCapital / circle.totalInstallments;
      const adminRate = circle.administrativeFeeRate || 0.10;
      const adminFeePerMember = (alicuota * adminRate) * IVA_RATE;

      return {
        subPercibida: acc.subPercibida + (subFeePerMember * (circle.currentMemberCount || 0)),
        subProyectada: acc.subProyectada + (subFeePerMember * circle.memberCapacity),
        adminPercibida: acc.adminPercibida + (adminFeePerMember * (circle.currentMemberCount || 0)),
        adminProyectada: acc.adminProyectada + (adminFeePerMember * circle.memberCapacity),
        activeMembers: acc.activeMembers + (circle.currentMemberCount || 0),
        totalCapacity: acc.totalCapacity + circle.memberCapacity
      };
    }, { subPercibida: 0, subProyectada: 0, adminPercibida: 0, adminProyectada: 0, activeMembers: 0, totalCapacity: 0 });
  }, [circlesList, selectedCircleFilter]);

  const [formData, setFormData] = useState({
    name: '',
    targetCapital: 50000,
    totalInstallments: 84,
    subscriptionFeeRate: 0.03,
    administrativeFeeRate: 0.10,
    lifeInsuranceRate: 0.0009,
    drawMethodCount: 1,
    bidMethodCount: 1,
    isPrivate: false,
    password: '',
  });

  const calculations = useMemo(() => {
    const alicuota = formData.targetCapital / formData.totalInstallments;
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    return { alicuota, capacity };
  }, [formData]);

  const generateCustomId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    let l = "";
    for (let i = 0; i < 4; i++) l += letters[Math.floor(Math.random() * letters.length)];
    let n = "";
    for (let i = 0; i < 4; i++) n += nums[Math.floor(Math.random() * nums.length)];
    return l + n;
  };

  const handleCreateCircle = () => {
    if (!db || !user) return;
    const customId = generateCustomId();
    const newCircle = {
      ...formData,
      id: customId,
      installmentValue: calculations.alicuota,
      memberCapacity: calculations.capacity,
      currentMemberCount: 0,
      status: 'Active',
      creationDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      adminUserId: user.uid,
    };
    const circleRef = doc(db, 'saving_circles', customId);
    setDocumentNonBlocking(circleRef, newCircle, { merge: true });
    setIsCreateOpen(false);
    toast({ title: "Círculo Creado", description: `ID: ${customId}` });
  };

  const handleUpdateCircle = () => {
    if (!db || !selectedCircle) return;
    const circleRef = doc(db, 'saving_circles', selectedCircle.id);
    updateDocumentNonBlocking(circleRef, {
      ...formData,
      installmentValue: formData.targetCapital / formData.totalInstallments,
      memberCapacity: formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount)
    });
    setIsEditOpen(false);
    toast({ title: "Círculo Actualizado", description: selectedCircle.id });
  };

  const handleDeleteCircle = (id: string) => {
    if (!db) return;
    const circleRef = doc(db, 'saving_circles', id);
    deleteDocumentNonBlocking(circleRef);
    setCircleToDelete(null);
    toast({ title: "Círculo Eliminado", variant: "destructive" });
  };

  const copyInviteLink = (circle: any) => {
    const link = `${window.location.origin}/explore/${circle.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Enlace Copiado", description: "El enlace de invitación está en tu portapapeles." });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  if (isUserLoading || !user) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground font-medium">Accediendo al Panel de Control...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            Gestión Administrativa
          </h1>
          <p className="text-muted-foreground mt-1">Supervisión de salud financiera y control de grupos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCircleFilter} onValueChange={setSelectedCircleFilter}>
            <SelectTrigger className="w-[220px] bg-white border-primary/20">
              <SelectValue placeholder="Filtrar Dashboard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Consolidado Total</SelectItem>
              {circlesList?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.id} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/20 gap-2 h-11 px-6">
            <Plus className="h-5 w-5" />
            Nuevo Círculo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md bg-primary text-primary-foreground relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1">
              Suscripciones Percibidas / Proyectadas
              <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent><p className="text-[10px]">Facturación total por derecho de ingreso (Percibido hoy / Meta total).</p></TooltipContent></Tooltip></TooltipProvider>
            </CardTitle>
            <TrendingUp className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">${formatCurrency(financialStats.subPercibida)}</span>
              <span className="text-lg opacity-40">/</span>
              <span className="text-lg opacity-60">${formatCurrency(financialStats.subProyectada)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Gtos. Admin. Percibidos / Proyectados
              <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent><p className="text-[10px]">Ingreso recurrente mensual (MRR) estimado (Percibido hoy / Meta total).</p></TooltipContent></Tooltip></TooltipProvider>
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary">${formatCurrency(financialStats.adminPercibida)}</span>
              <span className="text-lg text-muted-foreground/30">/</span>
              <span className="text-lg text-muted-foreground/60">${formatCurrency(financialStats.adminProyectada)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Miembros Actuales / Capacidad</CardTitle>
            <Users className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{financialStats.activeMembers}</span>
              <span className="text-lg text-muted-foreground/30">/</span>
              <span className="text-lg text-muted-foreground/60">{financialStats.totalCapacity}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
        <CardHeader className="border-b bg-muted/30 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Gestión de Círculos de Ahorro</CardTitle>
              <CardDescription>Visualización y control administrativo de grupos activos.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 h-9 w-[240px] bg-white border-muted shadow-none focus-visible:ring-primary" placeholder="Buscar círculo..." />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-8 font-bold text-xs uppercase tracking-widest text-muted-foreground">ID / Nombre</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Capital (USD)</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Miembros</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right px-8 font-bold text-xs uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {circlesLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : !circlesList || circlesList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No hay círculos creados aún.</TableCell></TableRow>
              ) : circlesList.map((circle) => (
                <TableRow key={circle.id} className="group hover:bg-muted/5 transition-colors border-muted/50">
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-primary">{circle.id}</span>
                      <span className="font-bold text-sm">{circle.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-sm text-foreground">${circle.targetCapital.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${Math.min(100, ((circle.currentMemberCount || 0) / circle.memberCapacity) * 100)}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold text-primary">{circle.currentMemberCount || 0} / {circle.memberCapacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={circle.status === "Active" ? "default" : "secondary"} className="text-[10px] uppercase font-bold tracking-tighter px-2">
                      {circle.status === "Active" ? "Activo" : "Completado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-8 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setSelectedCircle(circle); setIsInviteOpen(true); }}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Enviar Invitación</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
                              <Link href={`/admin/circles/${circle.id}`}><Eye className="h-4 w-4" /></Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Miembros</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { 
                              setSelectedCircle(circle); 
                              setFormData({ 
                                name: circle.name,
                                targetCapital: circle.targetCapital,
                                totalInstallments: circle.totalInstallments,
                                subscriptionFeeRate: circle.subscriptionFeeRate,
                                administrativeFeeRate: circle.administrativeFeeRate,
                                lifeInsuranceRate: circle.lifeInsuranceRate,
                                drawMethodCount: circle.drawMethodCount,
                                bidMethodCount: circle.bidMethodCount,
                                isPrivate: circle.isPrivate,
                                password: circle.password || '',
                              });
                              setIsEditOpen(true); 
                            }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setCircleToDelete(circle)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIÁLOGOS */}
      
      {/* Crear Círculo */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Configurar Nuevo Círculo
            </DialogTitle>
            <DialogDescription>Defina los parámetros financieros y operativos del grupo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <PiggyBank className="h-4 w-4" /> Configuración General
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre del Círculo</Label>
                  <Input value={formData.name} placeholder="Ej. Círculo Gold I" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Capital Suscripto (USD)</Label>
                  <Input type="number" step="5000" value={formData.targetCapital} onChange={(e) => setFormData({...formData, targetCapital: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Plazo (Cuotas)</Label>
                  <Input type="number" value={formData.totalInstallments} onChange={(e) => setFormData({...formData, totalInstallments: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Acceso</Label>
                  <div className="flex items-center gap-3 h-10 px-3 bg-muted/30 rounded-lg">
                    <input type="checkbox" checked={formData.isPrivate} onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})} className="h-4 w-4 rounded border-primary text-primary" />
                    <span className="text-sm font-medium">Privado con contraseña</span>
                  </div>
                </div>
              </div>
              {formData.isPrivate && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Contraseña de Acceso</Label>
                  <Input type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <Settings2 className="h-4 w-4" /> Parámetros y Porcentajes
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Suscripción (%)</Label>
                  <Input type="number" step="0.01" value={formData.subscriptionFeeRate} onChange={(e) => setFormData({...formData, subscriptionFeeRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Admin (%)</Label>
                  <Input type="number" step="0.01" value={formData.administrativeFeeRate} onChange={(e) => setFormData({...formData, administrativeFeeRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Seguro Vida (%)</Label>
                  <Input type="number" step="0.0001" value={formData.lifeInsuranceRate} onChange={(e) => setFormData({...formData, lifeInsuranceRate: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <Users className="h-4 w-4" /> Métodos de Adjudicación
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Sorteos por Mes</Label>
                  <Input type="number" min="1" max="5" value={formData.drawMethodCount} onChange={(e) => setFormData({...formData, drawMethodCount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Licitaciones por Mes</Label>
                  <Input type="number" min="1" max="5" value={formData.bidMethodCount} onChange={(e) => setFormData({...formData, bidMethodCount: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCircle} className="px-8 shadow-lg shadow-primary/20">Generar Círculo Administrativo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Círculo */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Edit2 className="h-6 w-6 text-primary" />
              Editar Círculo {selectedCircle?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Capital (USD)</Label>
                  <Input type="number" value={formData.targetCapital} onChange={(e) => setFormData({...formData, targetCapital: Number(e.target.value)})} />
                </div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Suscripción (%)</Label>
                  <Input type="number" step="0.01" value={formData.subscriptionFeeRate} onChange={(e) => setFormData({...formData, subscriptionFeeRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Admin (%)</Label>
                  <Input type="number" step="0.01" value={formData.administrativeFeeRate} onChange={(e) => setFormData({...formData, administrativeFeeRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Seguro Vida (%)</Label>
                  <Input type="number" step="0.0001" value={formData.lifeInsuranceRate} onChange={(e) => setFormData({...formData, lifeInsuranceRate: Number(e.target.value)})} />
                </div>
             </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateCircle} className="w-full h-12 text-lg font-bold">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enviar Invitación */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Enviar Invitación
            </DialogTitle>
            <DialogDescription>Comparte el acceso directo al plan financiero con un potencial socio.</DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-6">
            <div className="p-6 bg-muted/30 rounded-2xl border border-dashed border-primary/20 text-center space-y-3">
              <div className="font-mono text-2xl font-black text-primary tracking-widest">{selectedCircle?.id}</div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Código de Invitación</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Enlace Directo</Label>
              <div className="flex gap-2">
                <Input readOnly value={selectedCircle ? `${window.location.origin}/explore/${selectedCircle.id}` : ''} className="bg-muted font-mono text-[10px]" />
                <Button size="icon" variant="outline" onClick={() => copyInviteLink(selectedCircle)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-bold gap-2" onClick={() => setIsInviteOpen(false)}>
            <CheckCircle2 className="h-5 w-5" />
            Listo
          </Button>
        </DialogContent>
      </Dialog>

      {/* Eliminar Círculo */}
      <AlertDialog open={!!circleToDelete} onOpenChange={(open) => !open && setCircleToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <CardHeader className="p-0 space-y-4">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-8 w-8" />
            </div>
            <div className="text-center space-y-2">
              <AlertDialogTitle className="text-xl font-bold">¿Eliminar círculo {circleToDelete?.id}?</AlertDialogTitle>
              <p className="text-muted-foreground text-sm">Esta acción es permanente. Se perderá todo el historial financiero y las membresías asociadas al grupo <strong>{circleToDelete?.name}</strong>.</p>
            </div>
          </CardHeader>
          <div className="flex flex-col gap-3 mt-6">
            <AlertDialogAction onClick={() => circleToDelete && handleDeleteCircle(circleToDelete.id)} className="bg-destructive hover:bg-destructive/90 h-12 font-bold text-lg rounded-xl">Eliminar Permanentemente</AlertDialogAction>
            <AlertDialogCancel className="h-12 font-bold rounded-xl border-none">Cancelar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
