'use client';

import React from 'react';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Fingerprint,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ImageIcon,
  CheckCircle,
  XCircle,
  Eye,
  Camera,
  User,
  Info,
  Mail,
  Phone,
  Shield,
  PiggyBank,
  Loader2,
  ChevronRight,
  Gavel
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { KYC_STATUS_LABELS, KYC_STATUS_COLORS } from '@/lib/kyc-utils';
import { toast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

interface AdminUserDetailDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminUserDetailDialog({ user, open, onOpenChange }: AdminUserDetailDialogProps) {
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Fetch current admin's profile to check for CEO role
  const adminProfileRef = useMemoFirebase(() => (db && currentUser ? doc(db, 'users', currentUser.uid) : null), [db, currentUser]);
  const { data: adminProfile } = useDoc(adminProfileRef);
  const isCEO = adminProfile?.role === 'ceo';

  // LIVE USER DATA: Fetch the user document being viewed to ensure real-time UI updates
  const userRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.id) : null), [db, user?.id]);
  const { data: liveUser, isLoading: loadingUser } = useDoc(userRef);

  // Use live data if available, fallback to prop data
  const userData = liveUser || user;

  const membershipsQuery = useMemoFirebase(() => {
    if (!db || !user || !open) return null;
    return query(collection(db, 'users', user.id, 'saving_circle_memberships'));
  }, [db, user, open]);

  const { data: memberships, isLoading: loadingMemberships } = useCollection(membershipsQuery);

  const handleKYCAction = async (status: 'verified' | 'rejected' | 'not_started') => {
    if (!db || !userData) return;
    setIsProcessing(true);
    try {
      await updateDocumentNonBlocking(doc(db, 'users', user.id), {
        kycStatus: status,
        updatedAt: new Date().toISOString()
      });
      
      let title = "Estado Actualizado";
      if (status === 'verified') title = "Usuario Verificado";
      if (status === 'rejected') title = "KYC Rechazado";
      if (status === 'not_started') title = "Verificación Revocada";

      toast({ 
        title, 
        description: `La identidad de ${userData.displayName} ha sido marcada como ${status}` 
      });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo actualizar el estado KYC", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!userData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        {/* Header */}
        <div className="bg-primary/5 p-8 border-b border-primary/10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">{userData.displayName || 'Sin nombre'}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-[10px] tracking-widest uppercase">
                    {userData.documentId || userData.id.slice(-8).toUpperCase()}
                  </Badge>
                  <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                    {userData.role || 'User'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Unido el</p>
              <p className="text-sm font-bold">
                {userData.createdAt ? (userData.createdAt.toDate ? format(userData.createdAt.toDate(), "dd/MM/yyyy") : format(new Date(userData.createdAt), "dd/MM/yyyy")) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Sidebar: Info de Contacto */}
          <div className="p-8 border-r border-muted/30 bg-muted/5 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Info className="h-3 w-3" /> Contacto
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{userData.email}</span>
                </div>
                {userData.phoneNumber && (
                  <div className="flex items-center gap-3 text-xs">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{userData.phoneNumber}</span>
                  </div>
                )}
                {userData.dni && (
                  <div className="flex items-center gap-3 text-xs">
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                    <span>{userData.dni}</span>
                  </div>
                )}
                {userData.cuit && (
                  <div className="flex items-center gap-3 text-xs">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-bold">CUIT: {userData.cuit}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* KYC SECTION */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Shield className="h-3 w-3" /> Identidad / KYC
              </h4>
              <div className="space-y-3">
                <Badge variant="outline" className={`w-full justify-center text-[10px] py-1 font-bold ${KYC_STATUS_COLORS[userData.kycStatus || 'not_started']}`}>
                  {userData.kycStatus === 'verified' ? <CheckCircle2 className="h-3 w-3 mr-2" /> : <Clock className="h-3 w-3 mr-2" />}
                  {KYC_STATUS_LABELS[userData.kycStatus || 'not_started']}
                </Badge>

                {userData.kycData && (
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="w-full text-[10px] h-8 gap-2 rounded-xl"
                    >
                      <a href={userData.kycData.dniFrontUrl} target="_blank" rel="noopener noreferrer">
                        <ImageIcon className="h-3.3" /> DNI Frente
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="w-full text-[10px] h-8 gap-2 rounded-xl"
                    >
                      <a href={userData.kycData.dniBackUrl} target="_blank" rel="noopener noreferrer">
                        <ImageIcon className="h-3.3" /> DNI Dorso
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="w-full text-[10px] h-8 gap-2 rounded-xl"
                    >
                      <a href={userData.kycData.selfieUrl} target="_blank" rel="noopener noreferrer">
                        <Camera className="h-3.3" /> Selfie / Vida
                      </a>
                    </Button>
                  </div>
                )}

                {/* Administración Manual (CEO) - Switch Maestro */}
                {isCEO && (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                    <p className="text-[9px] font-black text-primary uppercase flex items-center gap-2">
                       <Gavel className="h-3 w-3" /> Control Maestro de Acceso
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="master-verify" className="text-xs font-bold">Verificación Manual</Label>
                        <p className="text-[9px] text-muted-foreground font-medium">Habilitar/Bloquear acciones</p>
                      </div>
                      <Switch 
                        id="master-verify"
                        checked={userData.kycStatus === 'verified'}
                        onCheckedChange={(checked) => {
                          handleKYCAction(checked ? 'verified' : 'not_started');
                        }}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                )}

                {/* Actividades de Verificación Estándar (Pendientes) */}
                {userData.kycStatus === 'pending' && !isCEO && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="rounded-xl h-9 font-bold bg-green-600 hover:bg-green-700"
                      onClick={() => handleKYCAction('verified')}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Aprobar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="rounded-xl h-9 font-bold"
                      onClick={() => handleKYCAction('rejected')}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Shield className="h-3 w-3" /> Seguridad
                </h4>
                <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground">ID Interno de Sistema:</p>
                    <code className="text-[9px] block bg-muted p-2 rounded-lg break-all font-mono">{userData.id}</code>
                </div>
            </div>
          </div>

          {/* Main Content: Suscripciones */}
          <div className="col-span-2 p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Suscripciones Activas
            </h3>

            {loadingMemberships ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            ) : !memberships || memberships.length === 0 ? (
              <div className="py-20 text-center bg-muted/10 rounded-3xl border border-dashed">
                <p className="text-muted-foreground text-sm italic">Este usuario aún no participa en ningún círculo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberships.map((membership: any) => (
                  <Card key={membership.id} className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden border-muted/50">
                    <Link href={`/admin/circles/${membership.savingCircleId}`} className="block">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${membership.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                             <PiggyBank className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{membership.savingCircleName || membership.savingCircleId}</p>
                            <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                               Status: <span className="font-bold">{membership.status}</span> • {membership.adjudicationStatus === 'Adjudicated' ? 'Adjudicado' : 'Pendiente'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cerrar</Button>
          <Button className="rounded-xl font-bold" disabled>Editar Usuario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
