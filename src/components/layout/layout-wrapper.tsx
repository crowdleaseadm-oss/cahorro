'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { WhatsAppFloat } from '@/components/whatsapp-float';
import { PublicNav } from '@/components/navigation/public-nav';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  
  // Consideramos logueado si hay un usuario que no es anónimo
  const isActuallyLoggedIn = !!user && !user.isAnonymous;
  
  // Rutas que SIEMPRE se ven como públicas (Home, Presentación, Info General)
  const informationalPaths = ['/', '/presentation', '/faq', '/how-it-works', '/explainer', '/legal'];
  const isInformational = informationalPaths.some(path => 
    pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  // Si el usuario está logueado y NO es una ruta informativa, usamos el layout de Dashboard
  if (isActuallyLoggedIn && !isInformational) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full relative bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-6 md:p-8 lg:px-10 pt-6">
              {children}
            </main>
          </SidebarInset>
          <WhatsAppFloat />
        </div>
      </SidebarProvider>
    );
  }

  // Rutas que usan navegación pública (Full Width)
  const publicPaths = ['/', '/explore', '/explainer', '/presentation', '/faq', '/how-it-works'];
  const isPublicRoute = publicPaths.some(path => 
    pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  return (
    <div className="flex min-h-screen w-full relative flex-col">
      <PublicNav />
      <main className={cn(
        "w-full h-full transition-all duration-300",
        (pathname === '/' || pathname.startsWith('/presentation')) ? "pt-[116px]" : ((pathname !== '/' && !pathname.startsWith('/presentation')) && "pt-20")
      )}>
        {children}
      </main>
      <WhatsAppFloat />
    </div>
  );
}
