
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
  Share2,
  Edit2,
  Mail,
  Copy,
  CheckCircle2,
  Settings2,
  Info,
  DollarSign,
  Gavel
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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
      const subFeePerMember = circle.subscriptionVatApplied 
        ? (circle.targetCapital * subRate) * IVA_RATE 
        : (circle.targetCapital * subRate);
      
      const alicuota = circle.targetCapital / circle.totalInstallments;
      const adminRate = circle.administrativeFeeRate || 0.10;
      const adminFeePerMember = circle.adminVatApplied 
        ? (alicuota * adminRate) * IVA_RATE 
        : (alicuota * adminRate);

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
    subscriptionVatApplied: true,
    adminVatApplied: true,
    lifeInsuranceVatApplied: false
  });

  const calculations = useMemo(() => {
    const alicuota = formData.targetCapital / formData.totalInstallments;
    // Capacidad: Cuotas * Adjudicaciones por mes
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    return { alicuota, capacity };
  }, [formData]);

  const handleCreateCircle = () => {
    if (!db || !user) return;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    let l = ""; for (let i = 0; i < 4; i++) l += letters[Math.floor(Math.random() * letters.length)];
    let n = ""; for (let i = 0; i < 4; i++) n += nums[Math.floor(Math.random() * nums.length)];
    const customId = l + n;

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

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  if (isUserLoading || !user) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground font-medium">Cargando Panel Administrativo...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            Panel de Control
          </h1>
          <p className="text-muted-foreground mt-1">Gestión operativa y salud financiera de los círculos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCircleFilter} onValueChange={setSelectedCircleFilter}>
            <SelectTrigger className="w-[220px] bg-white">
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
            Nuevo Grupo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md bg-primary text-primary-foreground relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-90">Suscripciones (Ingreso)</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">${formatCurrency(financialStats.subPercibida)}</span>
              <span className="text-lg opacity-40">/</span>
              <span className="text-lg opacity-60">${formatCurrency(financialStats.subProyectada)}</span>
            </div>
            <p className="text-[10px] mt-2 opacity-70 italic font-medium">Estimación bruta (Percibido / Total Proyectado)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gastos Admin. (Recurrente)</CardTitle>
            <BarChart3 className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary">${formatCurrency(financialStats.adminPercibida)}</span>
              <span className="text-lg text-muted-foreground/30">/</span>
              <span className="text-lg text-muted-foreground/60">${formatCurrency(financialStats.adminProyectada)}</span>
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground italic font-medium">Carga mensual estimada (Percibido / Total Proyectado)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ocupación de Miembros</CardTitle>
            <Users className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{financialStats.activeMembers}</span>
              <span className="text-lg text-muted-foreground/30">/</span>
              <span className="text-lg text-muted-foreground/60">{financialStats.totalCapacity}</span>
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground italic font-medium">Participaciones suscriptas vs. capacidad total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 px-8 py-6">
          <CardTitle className="text-xl font-bold">Gestión de Círculos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="px-8 font-bold text-xs uppercase tracking-widest">ID / Nombre</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Capital (USD)</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Miembros</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Estado</TableHead>
                <TableHead className="text-right px-8 font-bold text-xs uppercase tracking-widest">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {circlesLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : circlesList?.map((circle) => (
                <TableRow key={circle.id} className="group hover:bg-muted/5">
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-primary">{circle.id}</span>
                      <span className="font-bold text-sm">{circle.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-sm text-foreground">${circle.targetCapital.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{circle.currentMemberCount || 0} / {circle.memberCapacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={circle.status === "Active" ? "default" : "secondary"}>
                      {circle.status === "Active" ? "Activo" : "Cerrado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-8 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedCircle(circle); setIsInviteOpen(true); }}><Mail className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" asChild><Link href={`/admin/circles/${circle.id}`}><Eye className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" onClick={() => { 
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
                          subscriptionVatApplied: circle.subscriptionVatApplied ?? true,
                          adminVatApplied: circle.adminVatApplied ?? true,
                          lifeInsuranceVatApplied: circle.lifeInsuranceVatApplied ?? false
                        });
                        setIsEditOpen(true); 
                      }}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCircleToDelete(circle)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIÁLOGOS DE CREACIÓN Y EDICIÓN */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(val) => isCreateOpen ? setIsCreateOpen(val) : setIsEditOpen(val)}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {isCreateOpen ? <Plus className="h-7 w-7 text-primary" /> : <Edit2 className="h-7 w-7 text-primary" />}
              {isCreateOpen ? "Nuevo Círculo de Ahorro" : `Editar Círculo ${selectedCircle?.id}`}
            </DialogTitle>
            <DialogDescription>Configure los parámetros financieros y operativos del grupo colaborativo.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-10 py-6">
            {/* SECCIÓN ADMINISTRATIVA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                <Settings2 className="h-4 w-4" /> Configuración Administrativa
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Círculo</Label>
                  <Input value={formData.name} placeholder="Ej. Círculo Platinum 100" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <p className="text-[10px] text-muted-foreground px-1">Nombre público identificativo del grupo.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Acceso y Seguridad</Label>
                  <div className="flex items-center gap-4 h-10 px-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={formData.isPrivate} onCheckedChange={(val) => setFormData({...formData, isPrivate: !!val})} />
                      <span className="text-sm font-medium">Acceso Privado</span>
                    </div>
                    {formData.isPrivate && (
                      <Input value={formData.password} placeholder="Contraseña" className="h-7 text-xs bg-white" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">Requiere contraseña para ver la proyección del plan.</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECCIÓN FINANCIERA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                <DollarSign className="h-4 w-4" /> Parámetros Financieros & IVA
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Capital Suscripto (USD)</Label>
                  <Input type="number" step="5000" value={formData.targetCapital} onChange={(e) => setFormData({...formData, targetCapital: Number(e.target.value)})} />
                  <p className="text-[10px] text-muted-foreground px-1">Capital total a adjudicar por sorteo/licitación.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Plazo del Plan (Meses)</Label>
                  <Select value={formData.totalInstallments.toString()} onValueChange={(val) => setFormData({...formData, totalInstallments: Number(val)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 10}, (_, i) => (i + 1) * 12).map(plazo => (
                        <SelectItem key={plazo} value={plazo.toString()}>{plazo} meses</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground px-1">Cantidad total de cuotas del plan de ahorro.</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-xl flex flex-col justify-center border border-primary/10">
                  <Label className="text-[10px] font-bold text-primary uppercase mb-1">Alícuota Pura</Label>
                  <div className="text-xl font-black text-primary">${calculations.alicuota.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/10 p-6 rounded-2xl">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Derecho Suscripción (%)</Label>
                  <Input type="number" step="0.01" value={formData.subscriptionFeeRate} onChange={(e) => setFormData({...formData, subscriptionFeeRate: Number(e.target.value)})} />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={formData.subscriptionVatApplied} onCheckedChange={(v) => setFormData({...formData, subscriptionVatApplied: !!v})} />
                    <span className="text-[10px] font-bold">Aplicar IVA (21%)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Gasto Administrativo (%)</Label>
                  <Input type="number" step="0.01" value={formData.administrativeFeeRate} onChange={(e) => setFormData({...formData, administrativeFeeRate: Number(e.target.value)})} />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={formData.adminVatApplied} onCheckedChange={(v) => setFormData({...formData, adminVatApplied: !!v})} />
                    <span className="text-[10px] font-bold">Aplicar IVA (21%)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Seguro de Vida (%)</Label>
                  <Input type="number" step="0.0001" value={formData.lifeInsuranceRate} onChange={(e) => setFormData({...formData, lifeInsuranceRate: Number(e.target.value)})} />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={formData.lifeInsuranceVatApplied} onCheckedChange={(v) => setFormData({...formData, lifeInsuranceVatApplied: !!v})} />
                    <span className="text-[10px] font-bold">Aplicar IVA (21%)</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECCIÓN OPERATIVA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                <Gavel className="h-4 w-4" /> Métodos de Adjudicación
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Adjudicaciones por Sorteo (Mensual)</Label>
                  <Select value={formData.drawMethodCount.toString()} onValueChange={(val) => setFormData({...formData, drawMethodCount: Number(val)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} cupos por mes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground px-1">Cantidad de miembros adjudicados al azar cada mes.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Adjudicaciones por Licitación (Mensual)</Label>
                  <Select value={formData.bidMethodCount.toString()} onValueChange={(val) => setFormData({...formData, bidMethodCount: Number(val)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} cupos por mes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground px-1">Cantidad de miembros que pueden adelantar cuotas para adjudicar.</p>
                </div>
              </div>
              <div className="bg-accent/30 p-5 rounded-2xl flex items-center justify-between border border-primary/10">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="text-sm font-bold">Capacidad Total del Grupo</h4>
                    <p className="text-[10px] text-muted-foreground">Plazo x Adjudicaciones Mensuales Totales</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-primary">{calculations.capacity} Miembros</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button variant="ghost" onClick={() => isCreateOpen ? setIsCreateOpen(false) : setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={isCreateOpen ? handleCreateCircle : handleUpdateCircle} className="px-10 shadow-lg shadow-primary/20 h-12 text-lg font-bold">
              {isCreateOpen ? "Generar Círculo Operativo" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGOS DE APOYO */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Enviar Invitación
            </DialogTitle>
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
                <Button size="icon" variant="outline" onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/explore/${selectedCircle?.id}`);
                   toast({ title: "Enlace Copiado" });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-bold" onClick={() => setIsInviteOpen(false)}>Listo</Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!circleToDelete} onOpenChange={(open) => !open && setCircleToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">¿Eliminar círculo {circleToDelete?.id}?</AlertDialogTitle>
            <p className="text-muted-foreground text-sm text-center">Esta acción es permanente y eliminará todo el historial financiero asociado.</p>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <AlertDialogAction onClick={() => circleToDelete && handleDeleteCircle(circleToDelete.id)} className="bg-destructive hover:bg-destructive/90 h-12 font-bold text-lg rounded-xl">Eliminar Permanentemente</AlertDialogAction>
            <AlertDialogCancel className="h-12 font-bold rounded-xl border-none">Cancelar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
