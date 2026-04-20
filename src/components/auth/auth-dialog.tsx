'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
// Removed empty import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

interface AuthDialogProps {
  defaultMode?: 'login' | 'register';
  trigger?: React.ReactNode;
  shouldRedirect?: boolean;
}

export function AuthDialog({ defaultMode = 'login', trigger, shouldRedirect = true }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Iniciando sesión", description: "Sesión iniciada correctamente." });
        setIsOpen(false);
        if (shouldRedirect) router.push('/dashboard');
      } else {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Creando cuenta", description: "Cuenta creada correctamente." });
        setIsOpen(false);
        if (shouldRedirect) router.push('/dashboard');
      }
    } catch (error: any) {
      let title = "Error de Autenticación";
      let desc = error.message || "Ha ocurrido un error inesperado al procesar la solicitud.";

      switch (error.code) {
        case 'auth/email-already-in-use':
          desc = "El correo electrónico u otros datos provistos ya se encuentran en uso. Por favor ingresa otro o inicia sesión.";
          break;
        case 'auth/invalid-email':
          desc = "El formato del correo electrónico u otros datos provistos son inválidos.";
          break;
        case 'auth/user-not-found':
          desc = "No existe ninguna cuenta registrada con este correo electrónico.";
          break;
        case 'auth/wrong-password':
          desc = "La contraseña es incorrecta. Recuerda que al quinto intento fallido la cuenta se bloqueará y deberás recuperarla.";
          break;
        case 'auth/invalid-credential':
          desc = "Credenciales inválidas. Si no tienes cuenta, por favor regístrate. Si la cuenta existe, la contraseña es incorrecta (recuerda que al quinto intento erróneo la cuenta se bloquea y deberás recuperarla).";
          break;
        case 'auth/too-many-requests':
          desc = "La cuenta ha sido bloqueada debido a múltiples intentos fallidos. Deberás recuperarla restableciendo tu contraseña.";
          break;
        case 'auth/weak-password':
          desc = "La contraseña es demasiado débil. Debe cumplir con los requisitos mínimos de seguridad.";
          break;
        case 'auth/operation-not-allowed':
        case 'auth/user-disabled':
          desc = "La cuenta se encuentra bloqueada o el registro está inhabilitado por el administrador.";
          break;
      }

      toast({ title, description: desc, variant: "destructive", duration: 7000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Acceder</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
            {mode === 'login' ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
          </div>
          <DialogTitle className="text-2xl font-black text-center">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </DialogTitle>
          <DialogDescription className="text-center px-4">
            {mode === 'login' 
              ? 'Ingresa tus credenciales para acceder a tu panel de ahorrista.' 
              : 'Únete a nuestra comunidad financiera y empieza a alcanzar tus metas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                className="h-12 pl-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="h-12 pl-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </Button>
        </form>

        <div className="pt-6 text-center">
          <button 
            type="button"
            className="text-sm font-semibold text-primary hover:underline underline-offset-4"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
