'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  HelpCircle,
  ShieldAlert,
  Fingerprint,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationIndicator } from './notification-indicator';
import { cn } from '@/lib/utils';
import { KYCVerificationDialog } from '../kyc/kyc-verification-dialog';
import { KYC_STATUS_LABELS, KYC_STATUS_COLORS } from '@/lib/kyc-utils';
import { Badge } from '../ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'ceo';
  const kycStatus = profile?.role === 'ceo' ? 'verified' : (profile?.kycStatus || 'not_started');
  const [isKYCOpen, setIsKYCOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const getPageTitle = () => {
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/explore')) return 'Explorar';
    if (pathname.includes('/my-circles')) return 'Mis Círculos';
    if (pathname.includes('/admin')) return 'Administración';
    if (pathname.includes('/how-it-works')) return 'Cómo Funciona';
    if (pathname.includes('/faq')) return 'Preguntas Frecuentes';
    if (pathname.includes('/legal')) return 'Reglamento';
    return 'Resumen';
  };

  const getKYCIcon = () => {
    switch (kycStatus) {
      case 'verified': return <ShieldCheck className="h-3.5 w-3.5 text-green-600" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-orange-500" />;
      case 'rejected': return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const utilityLinks = [
    { name: "Cómo funciona", href: "/how-it-works", icon: TrendingUp },
    { name: "Preguntas Frecuentes", href: "/faq", icon: HelpCircle },
    { name: "Reglamento", href: "/legal", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-6">
        {/* Left side: Page Context */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{getPageTitle()}</h2>
        </div>

        {/* Center/Right: Utility Links + Actions */}
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-6 border-r pr-6 border-border mr-2">
            {utilityLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-primary flex items-center gap-2",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <NotificationIndicator />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-2 transition-opacity hover:opacity-80 focus:outline-none cursor-pointer">
                  <div className="flex flex-col items-end hidden md:flex">
                    <div className="flex items-center gap-1.5">
                      {kycStatus !== 'verified' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsKYCOpen(true);
                                }}
                                className="transition-transform hover:scale-110 active:scale-95"
                              >
                                {getKYCIcon()}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-[10px] bg-white text-foreground border shadow-lg">
                              <p>{KYC_STATUS_LABELS[kycStatus] || 'Pendiente de Verificación'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        getKYCIcon()
                      )}
                      <span className="text-xs font-bold text-foreground leading-none">
                        {profile?.displayName || 'Usuario'}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                      {profile?.role === 'ceo' ? 'CEO' : profile?.role === 'admin' ? 'Administrador' : 'Ahorrista'}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8 border-2 border-primary/20 p-0.5 relative">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(profile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                    {kycStatus === 'verified' && (
                      <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-0.5 shadow-sm">
                        <div className="bg-green-500 rounded-full p-0.5">
                          <CheckCircle2 className="h-2 w-2 text-white" />
                        </div>
                      </div>
                    )}
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-xl border-none bg-white">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold">{profile?.displayName || 'Mi Perfil'}</p>
                    <p className="text-xs text-muted-foreground truncate font-medium">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2" />
                
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2.5 focus:bg-primary/5 focus:text-primary">
                      <Link href="/admin" className="flex items-center gap-3 font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Gestión Administrativa</span>
                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="mx-2" />
                  </>
                )}

                <DropdownMenuItem 
                  onClick={() => setIsKYCOpen(true)}
                  className="rounded-xl cursor-pointer py-2.5 focus:bg-primary/5 focus:text-primary"
                >
                  <div className="flex items-center gap-3 font-bold text-foreground">
                    <Fingerprint className="h-4 w-4" />
                    <span>Verificación de Identidad</span>
                    <Badge variant="outline" className={cn("ml-auto text-[9px] px-2 py-0 border-none", KYC_STATUS_COLORS[kycStatus])}>
                      {kycStatus === 'verified' ? '✓' : 'Pendiente'}
                    </Badge>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="mx-2" />

                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="rounded-xl cursor-pointer py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive group"
                >
                  <div className="flex items-center gap-3 font-bold">
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <KYCVerificationDialog 
        open={isKYCOpen} 
        onOpenChange={setIsKYCOpen} 
      />
    </header>
  );
}
