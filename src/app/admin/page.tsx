
'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  PiggyBank, 
  MoreHorizontal, 
  Plus, 
  Search, 
  DollarSign, 
  Calculator, 
  Settings2, 
  Eye, 
  Lock, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  TrendingUp,
  BarChart3,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function AdminPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [circleToDelete, setCircleToDelete] = useState<string | null>(null);
  const [selectedCircleFilter, setSelectedCircleFilter] = useState<string>('all');
  
  useEffect(() => {
    if (!user && !isUserLoading && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const circlesRef = useMemoFirebase(() => (db ? collection(db, 'saving_circles') : null), [db]);
  const { data: circlesList, isLoading: circlesLoading } = useCollection(circlesRef);

  // 1. Cálculos de Salud Financiera
  const financialStats = useMemo(() => {
    if (!circlesList) return { subIncome: 0, adminFees: 0, activeMembers: 0 };
    
    const filtered = selectedCircleFilter === 'all' 
      ? circlesList 
      : circlesList.filter(c => c.id === selectedCircleFilter);

    return filtered.reduce((acc, circle) => {
      const subIncome = circle.targetCapital * (circle.subscriptionFeeRate || 0.03);
      const alicuota = circle.targetCapital / circle.totalInstallments;
      const adminFeeMensual = alicuota * (circle.administrativeFeeRate || 0.10) * (circle.currentMemberCount || 0);
      
      return {
        subIncome: acc.subIncome + subIncome,
        adminFees: acc.adminFees + adminFeeMensual,
        activeMembers: acc.activeMembers + (circle.currentMemberCount || 0)
      };
    }, { subIncome: 0, adminFees: 0, activeMembers: 0 });
  }, [circlesList, selectedCircleFilter]);

  // 2. Fetch Members for Selected Circle (Only if a specific one is selected)
  const selectedCircleMembersRef = useMemoFirebase(() => {
    if (!db || selectedCircleFilter === 'all') return null;
    return collection(db, 'saving_circles', selectedCircleFilter, 'members');
  }, [db, selectedCircleFilter]);
  const { data: selectedMembers, isLoading: membersLoading } = useCollection(selectedCircleMembersRef);

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
    const adminFee = alicuota * formData.administrativeFeeRate;
    const capacity = formData.totalInstallments * (formData.drawMethodCount + formData.bidMethodCount);
    return { alicuota, adminFee, capacity };
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
    setIsDialogOpen(false);
    toast({ title: "Círculo Creado", description: `ID: ${customId}` });
  };

  const handleDeleteCircle = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'saving_circles', id));
    toast({ title: "Círculo Eliminado", description: id });
    setCircleToDelete(null);
  };

  if (isUserLoading || !user) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground">Autenticando administrador...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Salud Financiera
          </h1>
          <p className="text-muted-foreground mt-1">Supervisión global de ingresos y suscripciones.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCircleFilter} onValueChange={setSelectedCircleFilter}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Filtrar por Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {circlesList?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.id} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Círculo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
               {/* Formulario de creación (se mantiene similar al anterior para consistencia) */}
               <DialogHeader>
                <DialogTitle>Configurar Nuevo Círculo</DialogTitle>
                <DialogDescription>ID LLLLNNNN (ej. AAAA0001).</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Círculo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Capital Suscripto (USD)</Label>
                    <Input type="number" step="5000" value={formData.targetCapital} onChange={(e) => setFormData({...formData, targetCapital: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateCircle}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-80">Ingresos x Suscripción</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialStats.subIncome.toLocaleString()}</div>
            <p className="text-[10px] opacity-70 mt-1">Estimado total de ingresos por derecho de ingreso.</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gastos Administrativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${financialStats.adminFees.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Estimado mensual recurrente (MRR).</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Miembros Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{financialStats.activeMembers}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Total de participaciones en {selectedCircleFilter === 'all' ? 'todos los grupos' : 'el grupo'}.</p>
          </CardContent>
        </Card>
      </div>

      {selectedCircleFilter === 'all' ? (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Círculos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID / Nombre</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Suscripción (Est.)</TableHead>
                  <TableHead>Gto. Admin (Est.)</TableHead>
                  <TableHead>Miembros</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {circlesLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">Cargando...</TableCell></TableRow>
                ) : circlesList?.map((circle) => (
                  <TableRow key={circle.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-bold text-primary">{circle.id}</span>
                        <span className="text-xs font-medium">{circle.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold">${circle.targetCapital.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">${(circle.targetCapital * (circle.subscriptionFeeRate || 0.03)).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-primary font-bold">
                      ${((circle.targetCapital / circle.totalInstallments) * (circle.administrativeFeeRate || 0.10) * (circle.currentMemberCount || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{circle.currentMemberCount || 0} / {circle.memberCapacity}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/circles/${circle.id}`}><ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Miembros del Grupo {selectedCircleFilter}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/circles/${selectedCircleFilter}`}>Ver Gestión Avanzada</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
            ) : !selectedMembers || selectedMembers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">Sin miembros registrados en este grupo.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Usuario</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Cuotas Pagas</TableHead>
                    <TableHead>Capital Pagado</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono text-[10px]">{member.userId.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="text-xs">{new Date(member.joiningDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-bold">{member.paidInstallmentsCount}</TableCell>
                      <TableCell className="text-xs">${member.capitalPaid.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={member.adjudicationStatus === 'Adjudicated' ? "default" : "secondary"} className="text-[10px]">
                          {member.adjudicationStatus === 'Adjudicated' ? 'Adjudicado' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!circleToDelete} onOpenChange={(open) => !open && setCircleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">¿Eliminar círculo {circleToDelete}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y afectará a todos los miembros.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => circleToDelete && handleDeleteCircle(circleToDelete)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
