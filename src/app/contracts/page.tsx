'use client';

import React from 'react';

import { 
  Handshake, 
  FileSignature, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Info,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  PiggyBank,
  FileSearch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { AdhesionContractDialog } from '@/components/legal/adhesion-contract-dialog';
import Link from 'next/link';
import { generateContractPDF } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function ContractsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [selectedContract, setSelectedContract] = React.useState<any>(null);

  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  // Fetch circle memberships to show relevant contracts
  const membershipsRef = useMemoFirebase(() => (db && user ? collection(db, 'users', user.uid, 'saving_circle_memberships') : null), [db, user]);
  const { data: memberships, isLoading } = useCollection(membershipsRef);

  const handleDownloadContract = async (membership: any) => {
    toast({ title: "Generando PDF...", description: "Iniciando descarga del contrato." });
    
    await generateContractPDF({
      userName: profile?.displayName || profile?.email || 'Usuario',
      userDni: profile?.dni || profile?.cuit,
      userEmail: profile?.email,
      circleName: membership.savingCircleName,
      circleCapital: membership.savingCircleCapital,
      installments: membership.totalInstallments || 60,
      date: membership.contractAcceptedAt?.toDate ? membership.contractAcceptedAt.toDate().toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'),
      circleId: membership.savingCircleId,
    });
  };

  const handleViewContract = (membership: any) => {
    setSelectedContract({
      name: membership.savingCircleName,
      circle: {
        id: membership.savingCircleId,
        name: membership.savingCircleName,
        targetCapital: membership.savingCircleCapital,
        totalInstallments: membership.totalInstallments || 60, // Default if not present
        administrativeFeeRate: 10 // Default (now as percentage)
      }
    });
    setIsPreviewOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <Handshake className="h-10 w-10 text-primary" />
            Contratos de Adhesión
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Accede a las copias digitales de tus contratos y términos aceptados.</p>
        </div>
      </div>

      {/* 2. Contracts Grid */}
      <div className="grid gap-8">
        {isLoading ? (
          <div className="py-20 text-center space-y-4">
             <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-muted-foreground font-medium">Buscando tus contratos...</p>
          </div>
        ) : memberships && memberships.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {memberships.map((membership, idx) => (
              <Card key={idx} className="border-none shadow-lg rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <CardHeader className="p-8 bg-primary/5 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <FileSignature className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Contrato de Adhesión</CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary/70">{membership.savingCircleName}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-xl py-1 px-3 font-bold gap-1">
                    <ShieldCheck className="h-3 w-3" /> Firmado
                  </Badge>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Fecha de Firma
                      </span>
                      <p className="font-bold text-sm">
                        {membership.createdAt?.toDate ? membership.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Layers className="h-3 w-3" /> Tipo de Plan
                      </span>
                      <p className="font-bold text-sm">Círculo Abierto</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-2xl border border-dashed flex gap-3 items-center">
                    <Info className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      Este documento tiene validez legal como duplicado digital del contrato original aceptado el {membership.contractAcceptedAt?.toDate ? membership.contractAcceptedAt.toDate().toLocaleDateString() : 'en la suscripción'}.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 font-bold gap-2"
                    onClick={() => handleDownloadContract(membership)}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                  <Button onClick={() => handleViewContract(membership)} className="flex-1 rounded-xl h-12 font-bold gap-2 shadow-lg">
                    <ExternalLink className="h-4 w-4" /> Ver Online
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/10 flex flex-col items-center justify-center p-20 text-center rounded-[3rem]">
            <div className="h-24 w-24 bg-muted/40 rounded-full flex items-center justify-center mb-6">
              <Handshake className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h4 className="text-2xl font-bold">No se encontraron contratos</h4>
            <p className="text-muted-foreground max-w-sm mt-2 mb-8 font-medium italic">
              Aún no has formalizado tu adhesión a ningún grupo. Explora los círculos disponibles para comenzar.
            </p>
            <Button asChild className="rounded-2xl h-14 px-10 font-bold text-lg gap-2 shadow-xl shadow-primary/20">
               <Link href="/explore">Explorar Círculos <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </Card>
        )}
      </div>

      {selectedContract && (
        <AdhesionContractDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          circleName={selectedContract.name}
          circle={selectedContract.circle}
          userProfile={profile}
          readOnly={true}
          title={selectedContract.id === "MODELO-001" ? "Contrato de Adhesión (Modelo)" : "Copia de Contrato de Adhesión"}
        />
      )}

      {/* 3. Security & Legal Banner */}
      <div className="rounded-[2.5rem] bg-slate-900 text-slate-100 p-10 md:p-14 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <ShieldCheck className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-6 max-w-2xl">
          <Badge className="bg-primary/20 text-primary-foreground border-primary/30 font-black uppercase tracking-widest px-4 py-1">Seguridad Jurídica</Badge>
          <h2 className="text-3xl font-black tracking-tight">Respaldo legal en cada paso</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            Cada vez que te unes a un grupo en **Círculo de Ahorro**, se genera un contrato de adhesión que regula las obligaciones de todas las partes. 
            Este documento está respaldado por nuestra personería jurídica y cumple con las normativas locales de ahorro y capitalización.
          </p>
          <div className="flex flex-wrap gap-6 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Documentos Inalterables</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Validez Digital</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
