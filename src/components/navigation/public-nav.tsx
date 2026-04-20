'use client';

import Link from 'next/link';
import { useUser } from '@/firebase';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutDashboard, Search, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function PublicNav() {
  const { user, isUserLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-1.5",
      scrolled ? "bg-white/80 backdrop-blur-md border-b shadow-sm py-1" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center group">
          <div className="flex h-16 w-16 items-center justify-center shrink-0 py-1.5">
            <img 
              src="/branding/Isotipo.svg" 
              alt="Círculo de Ahorro Logo" 
              className="h-full w-full object-contain transition-transform group-hover:scale-110"
            />
          </div>
        </Link>

        {/* LINKS */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Link href="/explore" className="hover:text-primary transition-colors flex items-center gap-2">
            <Search className="h-4 w-4" /> Explorar
          </Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">Cómo Funciona</Link>
          <Link href="/faq" className="hover:text-primary transition-colors flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> FAQ
          </Link>
        </div>

        {/* AUTH ACTIONS */}
        <div className="flex items-center gap-4">
          {!isUserLoading && (
            <>
              {user && !user.isAnonymous ? (
                <Button asChild size="lg" className="h-9 px-6 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 gap-2">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    Acceder al Panel
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <AuthDialog 
                    defaultMode="login" 
                    trigger={<Button variant="ghost" className="font-bold text-sm h-9 px-6 rounded-xl hover:bg-primary/5 hover:text-primary">Ingresar</Button>} 
                  />
                  <AuthDialog 
                    defaultMode="register" 
                    trigger={<Button size="lg" className="h-9 px-6 text-sm font-bold rounded-xl shadow-lg shadow-primary/20">Empezar ahora</Button>} 
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
