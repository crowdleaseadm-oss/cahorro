'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Fingerprint,
  CheckCircle2,
  Banknote,
  ChevronRight,
  Shield,
  Loader2,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { isValidCBU, formatCBU, getBankName, KYC_STATUS_LABELS } from '@/lib/kyc-utils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PaymentMethodsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    alias: '',
    cbu: '',
    type: 'caja_ahorro'
  });

  // 1. Fetch User Profile for KYC Status
  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);
  const kycStatus = profile?.role === 'ceo' ? 'verified' : (profile?.kycStatus || 'not_started');
  const isVerified = kycStatus === 'verified';

  // 2. Fetch Bank Accounts
  const accountsRef = useMemoFirebase(() => (db && user ? collection(db, 'users', user.uid, 'bank_accounts') : null), [db, user]);
  const { data: accounts, isLoading: accountsLoading } = useCollection(accountsRef);

  const handleAddAccount = async () => {
    if (!db || !user) return;
    if (!isValidCBU(formData.cbu)) {
      toast({ title: "CBU/CVU Inválido", description: "Verifica los 22 dígitos ingresados.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await addDoc(accountsRef!, {
        ...formData,
        bankName: getBankName(formData.cbu),
        createdAt: serverTimestamp(),
        // La cuenta está verificada solo si el usuario ya tiene KYC aprobado
        isVerified: isVerified 
      });

      toast({ title: "Cuenta Agregada", description: "Tu método de pago ha sido registrado correctamente." });
      setFormData({ alias: '', cbu: '', type: 'caja_ahorro' });
      setIsAddOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar la cuenta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bank_accounts', accountId));
      toast({ title: "Cuenta Eliminada" });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo eliminar la cuenta.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* 1. Header & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
            <Building2 className="h-10 w-10 text-primary" />
            Cuentas y Pagos
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Gestiona tus cuentas bancarias para el cobro de adjudicaciones y pagos.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl h-14 px-8 font-bold text-lg gap-2 shadow-xl shadow-primary/20">
              <Plus className="h-6 w-6" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-none shadow-2xl bg-white">
            <DialogHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold">Vincular Nueva Cuenta</DialogTitle>
              <DialogDescription className="text-sm">
                Ingresa los datos de tu CBU o CVU. Recuerda que la cuenta debe ser de tu titularidad.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="alias" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre de Referencia (Alias)</Label>
                <Input 
                  id="alias" 
                  placeholder="Ej: Mi Cuenta Personal / Mercado Pago" 
                  className="h-12 rounded-xl"
                  value={formData.alias}
                  onChange={e => setFormData({ ...formData, alias: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cbu" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CBU / CVU (22 dígitos)</Label>
                <Input 
                  id="cbu" 
                  placeholder="0000000000000000000000" 
                  className="h-12 rounded-xl font-mono text-lg tracking-wider"
                  maxLength={22}
                  value={formData.cbu}
                  onChange={e => setFormData({ ...formData, cbu: e.target.value.replace(/\D/g, '') })}
                />
                {formData.cbu && (
                  <div className="flex items-center gap-2 mt-1">
                    {isValidCBU(formData.cbu) ? (
                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> CBU Válido: {getBankName(formData.cbu)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Formato de CBU incorrecto
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo de Cuenta</Label>
                <Select value={formData.type} onValueChange={val => setFormData({ ...formData, type: val })}>
                  <SelectTrigger className="h-12 rounded-xl font-medium">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="caja_ahorro">Caja de Ahorro</SelectItem>
                    <SelectItem value="cta_corriente">Cuenta Corriente</SelectItem>
                    <SelectItem value="virtual">Billetera Virtual / CVU</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/30 rounded-2xl border border-dashed flex gap-3">
                 <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                 <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                   Al guardar esta cuenta, confirmas que eres el titular de la misma. El sistema contrastará tu CUIT verificado con los datos bancarios.
                 </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddOpen(false)} 
                className="h-12 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddAccount} 
                className="h-12 rounded-xl font-bold px-8"
                disabled={loading || !isValidCBU(formData.cbu) || !formData.alias}
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Guardar Cuenta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. Security Legend Banner */}
      <Card className="bg-primary/5 border-primary/20 rounded-[2rem] overflow-hidden border-2 shadow-sm">
        <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center shrink-0">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Compromiso con la Seguridad</h2>
            <p className="text-muted-foreground leading-relaxed text-base font-medium">
              En **Círculo de Ahorro**, la transparencia y la seguridad de todos los miembros son nuestra prioridad. 
              Por eso, exigimos que todas las cuentas bancarias asociadas coincidan con la identidad verificada (CUIT) del titular. 
              Este control riguroso **garantiza que los fondos siempre lleguen a la persona correcta** y previene cualquier intento de fraude, protegiendo así el aporte de cada ahorrista del grupo.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Badge variant="outline" className="bg-white border-primary/30 text-primary font-bold px-3 py-1">Seguridad de Fondos</Badge>
              <Badge variant="outline" className="bg-white border-primary/30 text-primary font-bold px-3 py-1">Titularidad Validada</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. KYC Status Bar (Conditional) */}
      {!isVerified && (
        <Alert className="bg-orange-50 border-orange-200 rounded-3xl p-6 shadow-sm">
          <ShieldAlert className="h-6 w-6 text-orange-600" />
          <div>
            <AlertTitle className="text-orange-950 font-bold text-lg">Identidad no verificada</AlertTitle>
            <AlertDescription className="text-orange-800/80 font-medium">
              Tu identidad aún se encuentra en estado: **{KYC_STATUS_LABELS[kycStatus]}**. 
              Puedes agregar cuentas, pero no serán validadas oficialmente hasta que tu KYC sea aprobado.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* 4. Accounts List */}
      <div className="grid gap-6">
        <h3 className="text-xl font-bold flex items-center gap-2 px-1">
          <Banknote className="h-5 w-5 text-primary" />
          Tus Cuentas Registradas
        </h3>
        
        {accountsLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <p className="text-muted-foreground">Cargando cuentas...</p>
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {accounts.map(account => (
              <Card key={account.id} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-6 bg-accent/5 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border shadow-sm">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{account.alias}</CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-widest">{account.bankName}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CBU / CVU</span>
                    <p className="font-mono text-lg font-bold tracking-tighter text-foreground">{formatCBU(account.cbu)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className="rounded-xl border-none bg-muted/50 text-[10px] font-bold uppercase py-1">
                      {account.type === 'virtual' ? 'Billetera Virtual' : account.type === 'cta_corriente' ? 'Cuenta Corriente' : 'Caja de Ahorro'}
                    </Badge>
                    
                    {account.isVerified ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-xl gap-1 py-1 font-bold">
                        <ShieldCheck className="h-3 w-3" /> Titularidad Validada
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none rounded-xl gap-1 py-1 font-bold">
                        <ShieldAlert className="h-3 w-3" /> Verificación Pendiente
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center p-20 text-center rounded-[2.5rem]">
            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h4 className="text-xl font-bold">No tienes cuentas asociadas</h4>
            <p className="text-muted-foreground max-w-sm mt-2 mb-8 font-medium italic">Agrega tu primer CBU o CVU para poder recibir adelantos y participar en sorteos.</p>
            <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-lg">
               <Plus className="h-5 w-5" /> Vincular Cuenta
            </Button>
          </Card>
        )}
      </div>

      {/* 5. Footer Info */}
      <div className="rounded-3xl bg-muted/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border">
        <div className="flex items-center gap-4">
           <Info className="h-8 w-8 text-primary/50" />
           <p className="text-sm font-medium text-muted-foreground max-w-lg">
             Una vez que tu identidad (KYC) sea verificada por la administración, todas tus cuentas asociadas que coincidan con tu CUIT pasarán a estado **Validada** automáticamente.
           </p>
        </div>
        {!isVerified && (
          <Button asChild variant="outline" className="rounded-xl h-12 px-6 font-bold border-primary/20 text-primary">
            <a href="/dashboard">Verificar mi Identidad <ArrowRight className="h-4 w-4 ml-2" /></a>
          </Button>
        )}
      </div>
    </div>
  );
}
