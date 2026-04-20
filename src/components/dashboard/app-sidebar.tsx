
"use client"

import * as React from "react"
import {
  Home,
  LayoutDashboard,
  Search,
  Layers,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  Fingerprint,
  FileText,
  Handshake,
  Shield
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { NotificationIndicator } from "./notification-indicator"
import { BrandLogo } from "../brand/brand-logo"

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Explorar Círculos", href: "/explore", icon: Search },
  { name: "Mis Círculos", href: "/my-circles", icon: Layers },
]

const securityNavigation = [
  { name: "Verificación", href: "/verification", icon: Fingerprint },
  { name: "Cuentas y Pagos", href: "/payment-methods", icon: Building2 },
  { name: "Documentación", href: "/documentation", icon: FileText },
  { name: "Contratos de Adhesión", href: "/contracts", icon: Handshake },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user } = useUser()

  // Nuevo: Fetch del perfil para saber el rol
  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  // Efecto para asegurar que el mail del administrador principal sea CEO
  // Lo movemos aquí para que se asigne apenas inicie sesión y aparezca el link en el sidebar
  React.useEffect(() => {
    if (db && user && user.email === 'crowd.lease.adm@gmail.com') {
      const needsInit = !profile || profile.role !== 'ceo';
      
      if (needsInit) {
        console.log("Detectado Administrador Principal en Sidebar. Iniciando/Actualizando rol CEO...");
        import('@/firebase/non-blocking-updates').then(({ setDocumentNonBlocking }) => {
          setDocumentNonBlocking(doc(db, 'users', user.uid), { 
            role: 'ceo',
            displayName: profile?.displayName || 'Juan Manuel Correa Casabo',
            dni: profile?.dni || '31693615',
            phoneNumber: profile?.phoneNumber || '2236358121',
            email: user.email,
            documentId: 'AAA-000000', // ID Resguardado para el CEO
            createdAt: profile?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        });
      }
    }
  }, [db, user, profile]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'ceo';

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <Sidebar className="border-r border-border bg-white shadow-sm">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center group">
          <div className="flex h-24 w-24 items-center justify-center shrink-0 py-2">
            <img 
              src="/branding/Isotipo.svg" 
              alt="Círculo de Ahorro Logo" 
              className="h-full w-full object-contain"
            />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-11 px-3 data-[active=true]:bg-accent data-[active=true]:text-primary transition-all hover:translate-x-1"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Seguridad & Trámites</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-11 px-3 data-[active=true]:bg-accent data-[active=true]:text-primary transition-all hover:translate-x-1"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-tighter">
          Círculo de Ahorro &copy; {new Date().getFullYear()}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
