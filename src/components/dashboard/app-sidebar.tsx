"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Search,
  PiggyBank,
  ShieldCheck,
  Info,
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  MessageCircle,
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
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Explorar Círculos", href: "/explore", icon: Search },
  { name: "Mis Círculos", href: "/my-circles", icon: PiggyBank },
]

const infoPages = [
  { name: "Cómo Funciona", href: "/how-it-works", icon: TrendingUp },
  { name: "Preguntas Frecuentes", href: "/faq", icon: HelpCircle },
  { name: "Legal y Regulaciones", href: "/legal", icon: ShieldCheck },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border bg-white shadow-sm">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-primary leading-none">Círculo</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">de Ahorro</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
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
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Información</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {infoPages.map((item) => (
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

      <SidebarFooter className="p-4 mt-auto space-y-4">
        <div className="rounded-2xl bg-green-50 p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-3">
             <MessageCircle className="h-4 w-4 text-green-600" />
             <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Ayuda Directa</span>
          </div>
          <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm h-9 text-xs font-bold gap-2">
            <a href="https://wa.me/542235194889" target="_blank" rel="noopener noreferrer">
              WhatsApp Soporte
            </a>
          </Button>
        </div>

        <div className="rounded-2xl bg-accent/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">Admin Panel</span>
          </div>
          <Link href="/admin">
            <SidebarMenuButton className="w-full justify-between bg-white border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">Gestionar Grupos</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </SidebarMenuButton>
          </Link>
        </div>
        
        <SidebarMenuButton className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Cerrar Sesión</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
