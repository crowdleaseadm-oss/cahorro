
'use client';

import { 
  PiggyBank, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Target, 
  Zap, 
  Lock,
  ChevronRight,
  BarChart3,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative py-20 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Badge variant="outline" className="px-4 py-1.5 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-wider">
              Ahorro Colaborativo en USD
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
              Círculo de <span className="text-primary italic">Ahorro</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              La alternativa inteligente al sistema bancario. Accede a capital sin intereses abusivos mediante la fuerza de la comunidad y la transparencia digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 rounded-2xl group">
                <Link href="/explore">
                  Explorar Círculos
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold border-2 rounded-2xl">
                <Link href="/how-it-works">Ver Tutorial</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl rounded-full opacity-50" />
            <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white/50 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Capital Promedio</p>
                  <p className="text-xl font-black text-primary">$50,000 USD</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Interés Bancario</p>
                  <p className="text-lg font-bold text-destructive line-through">12% - 18%</p>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-bold text-green-700 uppercase">Costo Círculo</p>
                  <p className="text-lg font-bold text-green-700">0% Interés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIVA SECTION */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black">Círculo vs. Sistema Tradicional</h2>
          <p className="text-muted-foreground">¿Por qué miles de personas eligen el ahorro colaborativo?</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-8">
              <CardTitle className="flex items-center gap-3 text-destructive">
                <BarChart3 className="h-6 w-6" /> Crédito Bancario
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {[
                "Tasas de interés abusivas y variables.",
                "Requisitos de calificación excluyentes.",
                "Letras chicas y seguros obligatorios caros.",
                "Endeudamiento a largo plazo con bancos."
              ].map((item, i) => (
                <div key={i} className="flex gap-3 text-muted-foreground">
                  <span className="text-destructive font-bold">✕</span> {item}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden border-2 border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
              <CardTitle className="flex items-center gap-3 text-primary">
                <Zap className="h-6 w-6" /> Círculo de Ahorro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {[
                "0% de interés real sobre el capital.",
                "Acceso equitativo mediante sorteo y licitación.",
                "Gastos administrativos mínimos y transparentes.",
                "Construcción de disciplina financiera comunal."
              ].map((item, i) => (
                <div key={i} className="flex gap-3 text-foreground font-medium">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TRANSPARENCIA SECTION */}
      <section className="bg-primary rounded-[3rem] p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <ShieldCheck className="h-64 w-64" />
        </div>
        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-black">Transparencia <span className="text-secondary italic">Digital</span></h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Utilizamos tecnología de vanguardia para asegurar que cada centavo esté donde debe estar. El administrador gestiona los grupos con reglas inmutables y los socios supervisan su plan en tiempo real.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5" /> 100% Seguro
                </h4>
                <p className="text-sm opacity-70">Fondos segregados y auditoría constante.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" /> Comunidad
                </h4>
                <p className="text-sm opacity-70">Validación de socios rigurosa.</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <h4 className="font-bold mb-6">Estado de Salud del Sistema</h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase"><span>Círculos Activos</span> <span>98%</span></div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-secondary w-[98%]" /></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase"><span>Adjudicaciones Exitosas</span> <span>100%</span></div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-secondary w-full" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA FAST */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="text-center space-y-4 p-8">
          <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">1. Selección</h3>
          <p className="text-muted-foreground text-sm">Elige el capital en USD y el plazo que mejor se adapte a tu objetivo.</p>
        </div>
        <div className="text-center space-y-4 p-8">
          <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">2. Aporte</h3>
          <p className="text-muted-foreground text-sm">Realiza aportes mensuales sin intereses bancarios al fondo común.</p>
        </div>
        <div className="text-center space-y-4 p-8">
          <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">3. Adjudicación</h3>
          <p className="text-muted-foreground text-sm">Recibe tu capital mediante sorteo mensual o licitación anticipada.</p>
        </div>
      </section>

      {/* MARCO LEGAL */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-border flex flex-col md:flex-row items-center gap-10">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Scale className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-4 flex-1">
          <h2 className="text-2xl font-bold">Seguridad y Respaldo Legal</h2>
          <p className="text-muted-foreground">
            Cada círculo está respaldado por un contrato de adhesión legalmente vinculante, registrado ante las autoridades competentes. Cumplimos con las regulaciones de ahorro colectivo y protección de datos para garantizar que tu inversión esté siempre protegida.
          </p>
          <Button variant="link" asChild className="p-0 h-auto text-primary font-bold gap-2">
            <Link href="/legal">Leer Marco Legal <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-20 bg-muted/30 rounded-[3rem] border border-dashed border-primary/20">
        <h2 className="text-4xl font-black mb-6">¿Listo para transformar tu ahorro?</h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">Únete hoy a la comunidad financiera más transparente y eficiente de la región.</p>
        <Button asChild size="lg" className="h-14 px-12 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
          <Link href="/explore">Empezar Ahora</Link>
        </Button>
      </section>
    </div>
  )
}
