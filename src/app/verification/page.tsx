'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Fingerprint, 
  ChevronRight, 
  Info,
  CheckCircle2,
  FileSearch,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Shield,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { KYC_STATUS_LABELS, KYC_STATUS_COLORS } from '@/lib/kyc-utils';
import { KYCVerificationDialog } from '@/components/kyc/kyc-verification-dialog';
import { cn } from '@/lib/utils';

export default function VerificationPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isKYCOpen, setIsKYCOpen] = React.useState(false);

  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, isLoading } = useDoc(userProfileRef);
  const kycStatus = profile?.role === 'ceo' ? 'verified' : (profile?.kycStatus || 'not_started');
  const isVerified = kycStatus === 'verified';

  const statusConfig = {
    verified: {
      title: "Identidad Verificada",
      description: "Tu cuenta ha sido validada correctamente. Tienes acceso completo a todas las funcionalidades.",
      icon: <ShieldCheck className="h-20 w-20 text-green-500" />,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    pending: {
      title: "Verificación en Proceso",
      description: "Estamos revisando tu documentación. Recibirás una notificación cuando el proceso finalice.",
      icon: <Clock className="h-20 w-20 text-orange-500" />,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    rejected: {
      title: "Verificación Rechazada",
      description: "Hubo un problema con la documentación enviada. Por favor, revisa los motivos e intenta nuevamente.",
      icon: <ShieldAlert className="h-20 w-20 text-red-500" />,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    not_started: {
      title: "Sin Verificar",
      description: "Aún no has iniciado tu proceso de verificación. Este paso es obligatorio para unirse a un grupo y realizar el pago de la primera cuota.",
      icon: <Fingerprint className="h-20 w-20 text-slate-400" />,
      color: "text-slate-600",
      bg: "bg-slate-50"
    }
  }[kycStatus] || {
    title: "Estado Desconocido",
    description: "No se pudo determinar tu estado de verificación.",
    icon: <AlertCircle className="h-20 w-20 text-slate-400" />,
    color: "text-slate-600",
    bg: "bg-slate-50"
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Cargando estado de seguridad...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <Fingerprint className="h-10 w-10 text-primary" />
          Verificación de Identidad
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Cumple con los estándares de seguridad para operar en la plataforma.</p>
      </div>

      {/* 2. Main Status Card */}
      <Card className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden", statusConfig.bg)}>
        <CardContent className="p-10 md:p-16 flex flex-col items-center text-center space-y-6">
          <div className="p-6 bg-white rounded-[2rem] shadow-sm">
            {statusConfig.icon}
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" className={cn("font-black uppercase tracking-widest px-4 py-1 rounded-full bg-white border-2", KYC_STATUS_COLORS[kycStatus])}>
              {KYC_STATUS_LABELS[kycStatus]}
            </Badge>
            <h2 className={cn("text-3xl font-black pt-2", statusConfig.color)}>{statusConfig.title}</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
              {statusConfig.description}
            </p>
          </div>

          <div className="pt-4">
            {isVerified ? (
              <div className="flex items-center gap-2 text-green-700 font-bold bg-green-100/50 px-6 py-3 rounded-2xl">
                <CheckCircle2 className="h-5 w-5" />
                Tu CUIT {profile?.cuit} está validado
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={() => setIsKYCOpen(true)}
                className="rounded-2xl h-14 px-10 font-bold text-lg gap-3 shadow-xl"
              >
                {kycStatus === 'not_started' ? 'Iniciar Verificación' : 'Reintentar Carga'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Why verify? */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none bg-muted/30 shadow-sm p-8 space-y-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Seguridad de la Comunidad</h3>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            La verificación asegura que todos los miembros del Círculo son personas reales y verificadas, previniendo fraudes y lavados de dinero.
          </p>
        </Card>
        
        <Card className="rounded-[2rem] border-none bg-muted/30 shadow-sm p-8 space-y-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Respaldo ante el BCRA</h3>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            Cumplimos con las regulaciones vigentes para sistemas de capitalización y ahorro, garantizando que tu dinero esté respaldado legalmente.
          </p>
        </Card>
      </div>

      {/* 4. Requirements List */}
      <Card className="rounded-[2.5rem] border-2 border-dashed bg-transparent p-10">
        <h3 className="text-2xl font-black mb-8">Requisitos Necesarios</h3>
        <div className="space-y-6">
          {[
            { title: "DNI Vigente", desc: "Foto de frente y dorso de tu documento.", done: isVerified },
            { title: "CUIT / CUIL", desc: "Número de identificación fiscal argentina.", done: isVerified },
            { title: "Validación Biométrica", desc: "Una selfie para corroborar tu identidad real.", done: isVerified },
            { title: "Datos de Contacto", desc: "Teléfono y domicilio actualizados.", done: !!profile?.phoneNumber }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                item.done ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
              )}>
                {item.done ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-current" />}
              </div>
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Help Footer */}
      <div className="bg-primary text-primary-foreground rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <FileSearch className="h-8 w-8 text-primary-foreground/50" />
          <p className="text-sm font-medium max-w-md">
            ¿Tienes dudas sobre por qué pedimos estos datos? Revisa nuestro Reglamento o consulta con soporte.
          </p>
        </div>
        <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl h-12 px-6 font-bold">
          Hablar con un asesor
        </Button>
      </div>

      {/* KYC Modal */}
      <KYCVerificationDialog 
        open={isKYCOpen} 
        onOpenChange={setIsKYCOpen} 
      />
    </div>
  );
}
