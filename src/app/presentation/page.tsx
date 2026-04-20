
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Zap, 
  Lock, 
  Globe,
  PieChart,
  Target,
  Trophy,
  CheckCircle2,
  Car,
  Plane,
  Rocket,
  Home,
  Briefcase,
  Plus,
  Minus,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 'intro',
    title: "",
    description: "La plataforma líder que transforma el ahorro en realidades mediante la fuerza de la comunidad.",
    bg: "bg-white",
    accent: "text-primary",
    isLight: true,
    logo: "/branding/Isotipo_nombre_eslogan pagina inicio.svg"
  },
  {
    id: 'metas',
    title: "Tu Meta, Tu Plan",
    description: "Seleccioná el círculo según el capital que necesitás y tus posibilidades de pago. El capital es de libre disponibilidad: lo usás para lo que vos quieras.",
    bg: "bg-white",
    accent: "text-primary",
    isLight: true,
    pillarGoals: [
      { label: "Vehículos", desc: "Alcanzá tu próximo auto, moto o utilitario con cuotas accesibles y sin intereses bancarios.", icon: "car", color: "from-blue-500/10 to-blue-600/5" },
      { label: "Inmuebles", desc: "Construí, refaccioná o adquirí tu vivienda propia con el respaldo de una comunidad sólida.", icon: "home", color: "from-indigo-500/10 to-indigo-600/5" },
      { label: "Turismo", desc: "Descubrí el destino de tus sueños planificando tu ahorro para viajar con total libertad.", icon: "plane", color: "from-teal-500/10 to-teal-600/5" },
      { label: "Emprendimiento", desc: "Capitalizá tu negocio o lanzá ese proyecto que tenés en mente con fondos genuinos.", icon: "rocket", color: "from-orange-500/10 to-orange-600/5" },
      { label: "Tu Libertad, Tu Capital", desc: "El capital es 100% tuyo. Sin restricciones ni explicaciones, vos elegís en qué transformar tu ahorro.", icon: "briefcase", color: "from-purple-500/10 to-purple-600/5" }
    ]
  },
  {
    id: 'comparativa',
    title: "Métodos para llegar a tus Metas",
    description: "Cada camino tiene sus desafíos. Entenderlos es el primer paso para elegir el mejor.",
    bg: "bg-neutral-50",
    accent: "text-primary",
    isLight: true,
    comparisonMethods: [
      {
        name: "Ahorro Propio",
        pros: ["Control total del capital", "Sin deudas ni intereses"],
        cons: ["Proceso extremadamente lento", "Primer recurso ante un antojo (aleja la meta)"],
        icon: "user"
      },
      {
        name: "Crédito Bancario",
        pros: ["Disponibilidad inmediata", "Financiación a largo plazo"],
        cons: ["Tasas de interés abusivas", "Obligatoriedad de adquirir seguros"],
        icon: "building"
      },
      {
        name: "Planes de Ahorro",
        pros: ["Cuotas accesibles", "Acceso a bienes específicos"],
        cons: ["Alta volatilidad de cuotas (ítems diferidos)", "Cargos administrativos poco claros"],
        icon: "file-text"
      },
      {
        name: "Círculos Informales",
        pros: ["Bajo costo administrativo", "Basado en la confianza mutua"],
        cons: ["Cero seguridad jurídica", "Riesgo total de estafa o falta de pago"],
        icon: "users"
      }
    ]
  },
  {
    id: 'solution',
    title: "Beneficios Círculo de Ahorro",
    description: "Una propuesta superadora diseñada para proteger tu ahorro y potenciar tu capital.",
    bg: "bg-white",
    accent: "text-primary",
    isLight: true,
    benefitCards: [
      {
        title: "Liquidez Inmediata",
        desc: "Los planes son 100% transferibles. Podés vender tu participación en cualquier momento si necesitás el capital.",
        icon: "zap"
      },
      {
        title: "0% Interés",
        desc: "Olvidate de las tasas bancarias abusivas. Aquí el ahorro es genuino entre personas.",
        icon: "trending-up"
      },
      {
        title: "Transparencia Total",
        desc: "Gestión 100% digital con trazabilidad absoluta de fondos comunes.",
        icon: "shield-check"
      },
      {
        title: "Ganancia por Permanencia",
        desc: "Beneficios exclusivos e incentivos especiales para los últimos adjudicatarios del grupo.",
        icon: "trophy"
      },
      {
        title: "Alta Seguridad Jurídica",
        desc: "Contratos de adhesión digitales con validez legal y seguros integrados.",
        icon: "lock"
      },
      {
        title: "Resguardo en Monedas Duras",
        desc: "Tu ahorro se capitaliza en USD, protegiéndote contra la devaluación.",
        icon: "globe"
      }
    ]
  },
  {
    id: 'how-it-works',
    title: "¿Cómo funciona el Círculo?",
    description: "Un proceso transparente y justo para todos los miembros del grupo.",
    bg: "bg-white",
    accent: "text-primary",
    isLight: true,
    icon: <Zap className="h-16 w-16 text-primary" />,
    steps: [
      { t: "Registro", d: "Uníte a la plataforma de forma simple y rápida para comenzar tu camino." },
      { t: "Validación", d: "Verificamos tu identidad para garantizar la seguridad y transparencia de todos." },
      { t: "Selección", d: "Elegí el círculo de ahorro que mejor se adapte a tu capacidad y meta personal." },
      { t: "Participación", d: "Realizá tus aportes mensuales y participá activamente de sorteos o licitaciones." },
      { t: "Adjudicación", d: "¡Recibí el capital adjudicado y hacé realidad tu sueño o proyecto!" },
      { t: "Finalización", d: "Completá tus obligaciones mientras ayudás a que otros miembros logren su meta." }
    ]
  },
  {
    id: 'security',
    title: "Seguridad y Transparencia",
    description: "Máxima transparencia en la gestión de fondos comunes y procesos de adjudicación técnica.",
    bg: "bg-white",
    accent: "text-emerald-600",
    isLight: true,
    icon: <ShieldCheck className="h-16 w-16 text-emerald-600" />,
    points: [
      "Sorteo de adjudicación basado en Quiniela Nacional (Refiere al sorteo técnico)",
      "Contratos de Adhesión digitales con validez institucional inmediata",
      "Seguro de vida y caución integrados (Protección total)",
      "Fondo de incentivo por cumplimiento (Excedentes redistribuibles)"
    ]
  },
  {
    id: 'vision',
    title: "Tu Meta, Nuestra Misión",
    description: "Ya sea tu primer auto, tu casa o capital para tu negocio, estamos acá para que lo alcances más rápido.",
    bg: "bg-white",
    accent: "text-primary",
    isLight: true,
    icon: <Trophy className="h-16 w-16 text-primary" />,
    cta: true
  }
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  if (!isMounted) return null;

  const slide = slides[currentSlide];

  return (
    <div className="h-screen max-h-screen pt-16 md:pt-20 px-4 md:px-12 bg-[#FDFCFB] flex flex-col overflow-hidden pb-2 md:pb-4">
      <div className="relative flex-1 w-full flex flex-col items-center justify-center overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-slate-200 bg-white shadow-sm selection:bg-white selection:text-black">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/branding/fondo.avif" 
          alt="Background" 
          fill 
          className="object-cover"
          priority
        />
        {/* Dynamic Overlay */}
        <div className={cn(
          "absolute inset-0 transition-all duration-1000 backdrop-blur-[4px]",
          "bg-white/80"
        )} />
      </div>

      {/* ProgressBar */}
      <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 px-1 pt-1 z-50">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-full flex-1 rounded-full transition-all duration-500",
              i <= currentSlide ? "bg-primary" : "bg-primary/10"
            )}
          />
        ))}
      </div>

      {/* Navigation Buttons - Centered Vertically */}
      <div className="absolute inset-y-0 inset-x-0 w-full px-2 md:px-4 flex items-center justify-between z-50 pointer-events-none">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={prevSlide}
          className={cn(
            "h-10 w-10 rounded-full border border-slate-200 pointer-events-auto transition-all bg-white/50 text-slate-400 hover:text-primary hover:bg-white hover:border-primary shadow-sm",
            currentSlide === 0 ? "opacity-0 invisible" : "opacity-100"
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={nextSlide}
          className={cn(
            "h-10 w-10 rounded-full border border-slate-200 pointer-events-auto transition-all bg-white/50 text-slate-400 hover:text-primary hover:bg-white hover:border-primary shadow-sm",
            currentSlide === slides.length - 1 ? "opacity-0 invisible" : "opacity-100"
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        {/* Title & Subtitle Section - Enforced Margins */}
        <div className={cn(
          "w-full flex-shrink-0 flex flex-col items-center text-center transition-all duration-700 py-1 md:py-2",
          slide.id === 'intro' ? "justify-center h-full px-4 md:px-[2cm]" : "px-4 md:px-[2cm] space-y-0.5"
        )}>
            <div className={cn(
              "flex flex-col items-center gap-6 mb-4 w-full transition-all duration-700",
              slide.id === 'intro' ? "max-w-xs md:max-w-md lg:max-w-lg" : "max-w-[100px] md:max-w-[140px]"
            )}>
              <div className={cn(
                "relative w-full animate-in fade-in slide-in-from-bottom-8 duration-1000",
                slide.id === 'intro' ? "aspect-[2/1]" : "aspect-[4/1]"
              )}>
                <Image 
                  src={slide.logo} 
                  alt="Logo Círculo de Ahorro" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          ) : slide.icon && !['how-it-works', 'security', 'vision'].includes(slide.id) ? (
            <div className="mb-2 h-10 w-10 text-primary">{slide.icon}</div>
          ) : null}

          {slide.title && (
            <h1 className={cn(
              "text-base md:text-lg lg:text-xl font-bold tracking-tight leading-none uppercase",
              slide.isLight ? "text-slate-900" : "text-white"
            )}>
              {slide.title}
            </h1>
          )}
          
          <p className={cn(
            "font-semibold leading-snug transition-colors whitespace-pre-wrap max-w-2xl",
            slide.id === 'intro' ? "text-base md:text-lg" : "text-xs md:text-sm",
            slide.isLight ? "text-slate-900" : "text-white/70"
          )}>
            {slide.description}
          </p>
        </div>

        {/* Dynamic Section based on Slide Type */}
        <div className="w-full flex-1 flex flex-col items-center justify-start pb-2 overflow-hidden">
          <div className="w-full max-w-full px-4 md:px-[2cm] pt-1 md:pt-2 overflow-y-auto custom-scrollbar">
          {slide.id === 'comparativa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {slide.comparisonMethods?.map((m: any, i: number) => (
                <div key={i} className={cn(
                  "p-4 xl:p-5 rounded-[1.5rem] bg-white border border-slate-200 shadow-lg space-y-3 transition-all hover:scale-[1.01]",
                )}>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {m.icon === 'user' && <Users className="h-4 w-4" />}
                      {m.icon === 'building' && <Lock className="h-4 w-4" />}
                      {m.icon === 'file-text' && <ShieldCheck className="h-4 w-4" />}
                      {m.icon === 'users' && <Users className="h-4 w-4" />}
                    </div>
                    <h3 className="text-base font-black text-slate-900">{m.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                         <Plus className="h-3 w-3" /> Ventajas
                      </span>
                      <ul className="space-y-1">
                        {m.pros.map((p: string, idx: number) => (
                          <li key={idx} className="text-[13px] text-slate-600 flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="font-medium leading-tight">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                         <Minus className="h-3 w-3" /> Desventajas
                      </span>
                      <ul className="space-y-1">
                        {m.cons.map((c: string, idx: number) => (
                          <li key={idx} className="text-[13px] text-slate-600 flex items-start gap-2">
                            <X className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span className="font-medium leading-tight">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.id === 'metas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto text-left">
              {slide.pillarGoals?.map((g: any, i: number) => (
                <div key={i} className={cn(
                  "p-2 md:py-1 md:px-4 xl:py-2 xl:px-5 rounded-2xl md:rounded-[2rem] border border-slate-200 bg-white shadow-md space-y-0.5 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 group cursor-default flex flex-col justify-center text-left",
                  i === 4 ? "md:col-span-2 bg-gradient-to-r from-primary/5 to-transparent border-primary/20 shadow-primary/5 px-4 md:px-6 py-1.5" : ""
                )}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-sm shrink-0",
                      "bg-slate-100 text-primary"
                    )}>
                      {g.icon === 'car' && <Car className="h-3.5 w-3.5" />}
                      {g.icon === 'plane' && <Plane className="h-3.5 w-3.5" />}
                      {g.icon === 'rocket' && <Rocket className="h-3.5 w-3.5" />}
                      {g.icon === 'home' && <Home className="h-3.5 w-3.5" />}
                      {g.icon === 'briefcase' && <Briefcase className="h-3.5 w-3.5" />}
                    </div>
                    <h3 className={cn(
                      "font-black text-slate-900 leading-tight transition-colors",
                      i === 4 ? "text-lg md:text-xl" : "text-sm md:text-base"
                    )}>{g.label}</h3>
                  </div>
                  
                  <p className={cn(
                    "text-slate-500 font-bold leading-tight transition-colors",
                    i === 4 ? "text-xs md:text-sm max-w-2xl" : "text-[10px] md:text-xs"
                  )}>{g.desc}</p>
                </div>
              ))}
            </div>
          )}

          {slide.id === 'problem' && (
            <div className="grid md:grid-cols-3 gap-6">
              {slide.stats?.map((s: any, i: number) => (
                <div key={i} className={cn(
                  "p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md",
                  slide.isLight ? "bg-slate-100" : "bg-black/40"
                )}>
                   <div className={cn("text-3xl font-black mb-2", slide.isLight ? "text-slate-900" : "text-white")}>{s.value}</div>
                   <div className="text-sm font-bold uppercase tracking-widest text-red-400">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {slide.id === 'solution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {slide.benefitCards?.map((b, i) => (
                <div key={i} className="p-3 md:py-2 md:px-4 xl:py-3 xl:px-5 rounded-xl md:rounded-[1.5rem] bg-white border border-slate-200 shadow-lg shadow-slate-200/50 space-y-1 md:space-y-2 hover:scale-[1.02] transition-transform group flex flex-col justify-center">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        {b.icon === 'zap' && <Zap className="h-5 w-5" />}
                        {b.icon === 'trending-up' && <TrendingUp className="h-5 w-5" />}
                        {b.icon === 'shield-check' && <ShieldCheck className="h-5 w-5" />}
                        {b.icon === 'trophy' && <Trophy className="h-5 w-5" />}
                        {b.icon === 'lock' && <Lock className="h-5 w-5" />}
                        {b.icon === 'globe' && <Globe className="h-5 w-5" />}
                     </div>
                     <h3 className="text-lg font-black text-slate-900 leading-tight">{b.title}</h3>
                   </div>
                   <p className="text-xs font-semibold text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          )}

          {slide.id === 'how-it-works' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {slide.steps?.map((s, i) => (
                 <div key={i} className={cn(
                  "text-left p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border transition-all hover:scale-[1.02] hover:shadow-lg shadow-slate-200/50 flex flex-col justify-center gap-1 md:gap-2",
                   slide.isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
                 )}>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-sm shadow-md shrink-0">
                        {i + 1}
                      </div>
                      <h3 className={cn("text-lg font-black leading-tight", slide.isLight ? "text-slate-900" : "text-white")}>
                        {s.t}
                      </h3>
                    </div>
                    <p className={cn("text-xs leading-tight font-semibold", slide.isLight ? "text-slate-500" : "text-white/60")}>
                      {s.d}
                    </p>
          {slide.id === 'security' && (
            <div className="grid md:grid-cols-2 gap-4 text-left items-center">
               <div className="space-y-2">
                 {slide.points?.map((p, i) => (
                   <div key={i} className={cn(
                     "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                     slide.isLight ? "bg-slate-50 border-slate-200" : "bg-white/10 border-white/20"
                   )}>
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className={cn("font-bold text-[12px] leading-tight", slide.isLight ? "text-slate-800" : "text-white")}>{p}</span>
                   </div>
                 ))}
               </div>
 
               {/* Info Block */}
               <div className="p-4 md:p-6 rounded-[1.5rem] bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-center space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <p className="text-base font-bold text-slate-900 leading-tight">
                    Transparencia Total:
                  </p>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    Cada socio tendrá acceso a la visualización en tiempo real del <span className="text-primary">saldo disponible del fondo común</span> de su grupo y del acumulado del <span className="text-emerald-600">fondo de penalidades</span>.
                  </p>
               </div>
            </div>
          )}

          {slide.cta && (
            <div className="flex flex-col gap-6 items-center">
                <div className="p-6 md:p-10 bg-white rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden group max-w-2xl">
                  <div className="absolute -right-10 -bottom-10 bg-primary/5 h-40 w-40 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                  <Target className="h-12 w-12 text-primary mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">¿Estás listo para empezar?</h2>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">Unite a cientos de ahorristas que ya están construyendo su futuro hoy mismo.</p>
                  <Button asChild size="lg" className="h-16 px-12 rounded-2xl text-xl font-black bg-primary text-white hover:bg-primary/90 shadow-xl transition-transform hover:scale-105">
                    <Link href="/explore">Empezar Ahora <ArrowRight className="ml-3 h-6 w-6" /></Link>
                  </Button>
               </div>
               <Button asChild variant="ghost" className="text-slate-400 hover:text-primary hover:bg-slate-100">
                 <Link href="/">Volver a la Página Principal</Link>
               </Button>
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
