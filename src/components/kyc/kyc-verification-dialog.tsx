'use client';

import React, { useState, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Fingerprint, 
  ShieldCheck,
  Camera,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isValidCUIT, formatCUIT } from '@/lib/kyc-utils';
import { toast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface KYCVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function KYCVerificationDialog({ open, onOpenChange, onSuccess }: KYCVerificationDialogProps) {
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    cuit: '',
    dob: '',
    gender: 'other',
    occupation: '',
    customOccupation: '',
    isPEP: false
  });

  // Images State
  const [files, setFiles] = useState<{
    dniFront: File | null;
    dniBack: File | null;
    selfie: File | null;
  }>({
    dniFront: null,
    dniBack: null,
    selfie: null
  });

  const [previews, setPreviews] = useState<{
    dniFront: string | null;
    dniBack: string | null;
    selfie: string | null;
  }>({
    dniFront: null,
    dniBack: null,
    selfie: null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'dniFront' | 'dniBack' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName || formData.fullName.length < 5) {
      toast({ title: "Nombre inválido", description: "Ingresa tu nombre completo como figura en el DNI.", variant: "destructive" });
      return false;
    }
    if (!isValidCUIT(formData.cuit)) {
      toast({ title: "CUIT inválido", description: "El formato del CUIT/CUIL no es correcto.", variant: "destructive" });
      return false;
    }
    if (!formData.dob) {
      toast({ title: "Fecha de nacimiento", description: "Es obligatoria.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!db || !storage || !user) return;
    if (!files.dniFront || !files.dniBack || !files.selfie) {
      toast({ title: "Faltan fotos", description: "Debes subir todas las imágenes solicitadas.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Images to Storage
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (!file) return null;
        const storageRef = ref(storage, `users/${user.uid}/kyc/${key}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        return { key, url: await getDownloadURL(storageRef) };
      });

      const results = await Promise.all(uploadPromises);
      const urls: any = {};
      results.forEach(res => {
        if (res) urls[`${res.key}Url`] = res.url;
      });

      // 2. Update User Profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        kycStatus: 'pending',
        cuit: formData.cuit,
        dni: formData.cuit.slice(2, 10), // Extraemos el DNI del CUIT
        kycData: {
          ...formData,
          occupation: formData.occupation === 'otro' ? formData.customOccupation : formData.occupation,
          ...urls,
          submittedAt: new Date().toISOString()
        },
        updatedAt: serverTimestamp()
      });

      toast({ 
        title: "¡Solicitud Enviada!", 
        description: "Tu identidad está en proceso de verificación. Te avisaremos pronto." 
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error("Error en KYC:", e);
      toast({ title: "Error", description: "No se pudo procesar la verificación.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[90vh] md:h-auto md:max-h-[85vh] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black">Verifica tu Identidad</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Valida tus datos según normativas de seguridad.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre Completo (según DNI)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="fullName" 
                      placeholder="Ej: Juan Pérez" 
                      className="pl-10 h-12 rounded-xl"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuit" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CUIT / CUIL (11 dígitos)</Label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="cuit" 
                      placeholder="20XXXXXXXX3" 
                      className="pl-10 h-12 rounded-xl"
                      value={formData.cuit}
                      onChange={e => setFormData({...formData, cuit: e.target.value.replace(/\D/g, '').slice(0, 11)})}
                    />
                  </div>
                  {formData.cuit && (
                    <p className={`text-[10px] font-bold ${isValidCUIT(formData.cuit) ? 'text-green-600' : 'text-red-500'}`}>
                      {isValidCUIT(formData.cuit) ? '✓ Formato Válido: ' + formatCUIT(formData.cuit) : '✗ El CUIT no es válido'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fecha Nac.</Label>
                    <Input 
                      id="dob" 
                      type="date" 
                      className="h-12 rounded-xl"
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Género</Label>
                    <RadioGroup 
                      value={formData.gender} 
                      onValueChange={val => setFormData({...formData, gender: val})}
                      className="flex gap-2 h-12 items-center"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="male" id="g-male" />
                        <Label htmlFor="g-male" className="text-[10px] font-bold">M</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="female" id="g-female" />
                        <Label htmlFor="g-female" className="text-[10px] font-bold">F</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="other" id="g-other" />
                        <Label htmlFor="g-other" className="text-[10px] font-bold">X</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occ" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ocupación / Condición Laboral</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.occupation} 
                      onValueChange={val => setFormData({...formData, occupation: val})}
                    >
                      <SelectTrigger className="pl-10 h-12 rounded-xl">
                        <SelectValue placeholder="Selecciona tu actividad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="autonomo">Autónomo / Monotributista</SelectItem>
                        <SelectItem value="dependencia">Relación de dependencia</SelectItem>
                        <SelectItem value="profesional">Profesional Independiente</SelectItem>
                        <SelectItem value="jubilado">Jubilado / Pensionado</SelectItem>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                        <SelectItem value="otro">Otro (especificar...)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.occupation === 'otro' && (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    <Label htmlFor="custom-occ" className="text-xs font-bold uppercase tracking-widest text-primary">¿Cuál es tu ocupación?</Label>
                    <Input 
                      id="custom-occ" 
                      placeholder="Ej: Artista Plástico, Programador Freelance..." 
                      className="h-12 rounded-xl border-primary/30"
                      value={formData.customOccupation}
                      onChange={e => setFormData({...formData, customOccupation: e.target.value})}
                    />
                  </div>
                )}

                <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-2xl border">
                  <Checkbox 
                    id="pep" 
                    checked={formData.isPEP}
                    onCheckedChange={(checked) => setFormData({...formData, isPEP: !!checked})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="pep" className="text-xs font-bold leading-none cursor-pointer">
                      Declaración PEP
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Declaro Bajo Juramento que NO soy Persona Políticamente Expuesta.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 rounded-xl font-bold gap-2 text-md shadow-lg shadow-primary/20"
                onClick={() => validateStep1() && setStep(2)}
              >
                Siguiente Paso
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">DNI Frente</Label>
                    <div 
                      className="aspect-[3/2] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => document.getElementById('dni-front')?.click()}
                    >
                      {previews.dniFront ? (
                        <img src={previews.dniFront} alt="DNI Front" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Subir Foto</span>
                        </>
                      )}
                      <input type="file" id="dni-front" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'dniFront')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">DNI Dorso</Label>
                    <div 
                      className="aspect-[3/2] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => document.getElementById('dni-back')?.click()}
                    >
                      {previews.dniBack ? (
                        <img src={previews.dniBack} alt="DNI Back" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Subir Foto</span>
                        </>
                      )}
                      <input type="file" id="dni-back" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'dniBack')} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prueba de Vida (Selfie)</Label>
                  <div 
                    className="aspect-square w-40 mx-auto rounded-3xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => document.getElementById('selfie')?.click()}
                  >
                    {previews.selfie ? (
                      <img src={previews.selfie} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase text-center px-4">Tomar o Subir Foto</span>
                      </>
                    )}
                    <input type="file" id="selfie" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'selfie')} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="w-1/3 h-12 rounded-xl font-bold gap-2"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <Button 
                  className="w-2/3 h-12 rounded-xl font-bold gap-2 text-md shadow-lg shadow-primary/20"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-5 w-5" />
                      Finalizar Verificación
                    </>
                  )
                  }
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
