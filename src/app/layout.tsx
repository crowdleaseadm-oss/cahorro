import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Círculo de Ahorro | Tu comunidad financiera',
  description: 'Gestiona tus círculos de ahorro de forma segura y transparente.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background overflow-x-hidden">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex-1 bg-background">
                <main className="w-full h-full p-6 md:p-8 lg:p-10 transition-all duration-300">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
