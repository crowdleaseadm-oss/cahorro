'use client';

import { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { firebaseConfig } from '@/firebase/config';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Fingerprint } from 'lucide-react';

export function UserCreationDialog() {
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dni: '',
    password: '',
    phoneNumber: ''
  });


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber) {
      toast({ title: "Datos incompletos", description: "Completa todos los campos, incluyendo el teléfono", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let secondaryApp = null;
    
    try {
      // 1. Validar duplicados en Firestore (Email y DNI)
      const emailCheck = query(collection(db, 'users'), where('email', '==', formData.email));
      const dniCheck = query(collection(db, 'users'), where('dni', '==', formData.dni));
      
      const [emailSnap, dniSnap] = await Promise.all([
        getDocs(emailCheck),
        getDocs(dniCheck)
      ]);
      
      if (!emailSnap.empty) {
        toast({ title: "Email duplicado", description: "Ya existe un usuario con este correo electrónico.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      if (!dniSnap.empty) {
        toast({ title: "DNI duplicado", description: "Ya existe un usuario con este número de documento.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // 2. Inicializar App secundaria para Auth
      const tempAppName = 'SecondaryApp_' + Date.now();
      secondaryApp = initializeApp(firebaseConfig, tempAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 3. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const newUid = userCredential.user.uid;

      // 4. Obtener ID secuencial mediante transacción
      const metadataRef = doc(db, 'system', 'metadata');
      const customDocumentId = await runTransaction(db, async (transaction) => {
        const metadataDoc = await transaction.get(metadataRef);
        let nextNumber = 1;
        if (metadataDoc.exists()) {
          nextNumber = (metadataDoc.data().userCounter || 0) + 1;
        }
        transaction.set(metadataRef, { userCounter: nextNumber }, { merge: true });
        return `AAA-${nextNumber.toString().padStart(6, '0')}`;
      });

      // 5. Guardar información completa en Firestore
      const userRef = doc(db, 'users', newUid);
      setDocumentNonBlocking(userRef, {
        displayName: formData.name,
        email: formData.email,
        dni: formData.dni,
        phoneNumber: formData.phoneNumber,
        documentId: customDocumentId,
        role: 'user',
        createdAt: serverTimestamp(),
      });

      toast({ 
        title: "Usuario Creado Exitosamente", 
        description: `El ID asignado es: ${customDocumentId}` 
      });
      
      setFormData({ name: '', email: '', dni: '', password: '', phoneNumber: '' });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Error al crear usuario", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 h-11 px-4 border-primary/20 text-primary hover:bg-primary/5">
          <UserPlus className="h-4 w-4" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-center">Registrar Usuario</DialogTitle>
          <DialogDescription className="text-center px-2">
            Crea una cuenta para un nuevo integrador o ahorrista. El ID privado se generará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</Label>
            <Input 
              id="name" 
              placeholder="Juan Pérez" 
              className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Correo Electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="correo@ejemplo.com" 
              className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Teléfono (WhatsApp)</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+549112345678" 
              className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              value={formData.phoneNumber}
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
            />
            <p className="text-[10px] text-muted-foreground px-1">Ingresar con código de país (Ej: +54, +598) sin espacios ni guiones para notificaciones automáticas.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dni" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">DNI / Documento</Label>
            <Input 
              id="dni" 
              placeholder="12.345.678" 
              className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              value={formData.dni}
              onChange={e => setFormData({...formData, dni: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Contraseña Inicial</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="bg-muted/40 p-4 rounded-xl flex items-center gap-3 border border-dashed border-primary/20 mt-6">
            <Fingerprint className="h-6 w-6 text-primary/60" />
            <div className="text-xs font-medium text-muted-foreground">
              Se asignará automáticamente el ID secuencial (Ej: AAA-000001) para el integrador.
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 mt-4">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear Usuario'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
