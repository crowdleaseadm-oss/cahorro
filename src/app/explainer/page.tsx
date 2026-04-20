'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Cake, 
  TrendingDown, 
  ShieldCheck, 
  DollarSign, 
  PartyPopper, 
  ArrowRight,
  Info,
  Heart,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 'intro',
    title: "6 Amigas, Una Gran Misión",
    description: "Ana, Bea, Cele, Diana, Eli y Flor son mejores amigas. Sus hijos cumplen años en meses seguidos: de marzo a agosto.",
    icon: <Users className="h-16 w-16 text-primary" />,
    image: "/branding/explainer-moms-v2.png",
    bg: "bg-white",
    color: "text-primary"
  },
  {
    id: 'goal',
    title: "El Sueño de la Fiesta Perfecta",
    description: "Ana averiguó los precios de cada detalle: ¡el festejo sale $ 2.000.000! Parece que este año las chicas no tendrán la fiesta con la que sueñan.",
    icon: <Cake className="h-16 w-16 text-pink-500" />,
    image: "/branding/explainer-party.png",
    bg: "bg-pink-50",
    color: "text-pink-600"
  },
  {
    id: 'proposal_pesos',
    title: "Una Solución Colaborativa",
    description: "Bea propone un plan: '¡Si cada una aporta $ 350.000 por mes, juntamos la plata y se la damos a la que cumple años ese mes!'. Parecía la solución ideal, pero...",
    icon: <Calendar className="h-16 w-16 text-blue-500" />,
    bg: "bg-blue-50",
    color: "text-blue-600"
  },
  {
    id: 'inflation',
    title: "El Obstáculo: La Inflación",
    description: "Flor se dio cuenta de un gran problema: '¡Chicas! Con la inflación, en agosto los $ 2.000.000 ya no van a alcanzar para nada. ¡Yo me quedo sin festejo!'.",
    icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
    bg: "bg-orange-50",
    color: "text-orange-600",
    quote: "La inflación hace que los precios suban: lo que hoy alcanza para un salón completo, en unos meses apenas llegará para la torta."
  },
  {
    id: 'magic_fused',
    title: "Plan Inteligente: Pasar a USD",
    description: "Proponen pasar el aporte mensual a dólares para que todas estén protegidas. Deciden aportar USD 200 cada una; así cada madre contará con USD 1.200 en el mes que le toque.",
    icon: <ShieldCheck className="h-16 w-16 text-emerald-500" />,
    bg: "bg-emerald-50",
    color: "text-emerald-600"
  },
  {
    id: 'summary',
    title: "¡Todas Festejan Felices!",
    description: "Al final, las 6 amigas pagaron sus fiestas sin esfuerzo y protegidas de la inflación gracias a la fuerza del grupo. ¡Eso es un Círculo de Ahorro!",
    icon: <PartyPopper className="h-16 w-16 text-purple-500" />,
    bg: "bg-purple-50",
    color: "text-purple-600",
    cta: true
  }
];

export default function ExplainerPage() {
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
    <div className="min-h-screen bg-slate-50 py-[2cm] px-4 md:px-12 flex items-center justify-center pt-0">
      <div className={cn(
        "relative w-full max-w-4xl aspect-video min-h-[400px] flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border shadow-xl transition-all duration-700",
        slide.bg
      )}>
        {/* Navigation Buttons */}
        <div className="absolute inset-x-0 bottom-8 px-8 flex items-center justify-between z-50">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={prevSlide}
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all shadow-lg",
              currentSlide === 0 ? "opacity-0 invisible" : "opacity-100"
            )}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-3 rounded-full transition-all duration-300",
                  i === currentSlide ? "w-8 bg-slate-900" : "w-3 bg-slate-300"
                )}
              />
            ))}
          </div>

          <Button 
            variant="default" 
            size="icon" 
            onClick={nextSlide}
            className={cn(
              "h-14 w-14 rounded-full transition-all shadow-lg",
              currentSlide === slides.length - 1 ? "opacity-0 invisible" : "opacity-100"
            )}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Content */}
        <div className="w-full h-full flex flex-col md:flex-row items-center justify-center text-center md:text-left px-8 md:px-16 pb-24 md:pb-0 gap-8 animate-in fade-in zoom-in duration-700">
           {slide.image && (
             <div className="relative w-full max-w-[300px] md:max-w-[400px] aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0">
               <Image 
                 src={slide.image} 
                 alt={slide.title} 
                 fill 
                 className="object-cover"
                 priority
               />
             </div>
           )}

           <div className={cn(
             "flex flex-col items-center md:items-start justify-center flex-1 max-w-2xl",
             !slide.image && "md:items-center text-center"
           )}>
              <div className={cn(
                "mb-4 p-4 rounded-xl bg-white shadow-md transform transition-transform duration-500 hover:rotate-3",
                slide.color
              )}>
                {React.cloneElement(slide.icon as React.ReactElement, { className: "h-10 w-10" })}
              </div>
                          <h1 className={cn(
                "text-xl md:text-3xl lg:text-4xl font-black mb-3 tracking-tight leading-tight",
                slide.color
              )}>
                {slide.title}
              </h1>
                          <p className="text-base md:text-lg lg:text-xl font-bold text-slate-700 leading-snug">
                {slide.description}
              </p>



             {slide.quote && (
               <div className="mt-6 p-4 bg-white/50 border-l-4 border-orange-500 rounded-r-xl max-w-xl text-left">
                 <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-2">
                   <Info className="h-4 w-4" /> Sabías que...
                 </p>
                 <p className="text-slate-600 font-bold italic mt-1 leading-tight text-sm md:text-base">{slide.quote}</p>
               </div>
             )}

                {slide.cta && (
                <div className="mt-6 animate-bounce w-full flex justify-center md:justify-start">
                  <Button asChild size="lg" className="h-12 px-8 rounded-xl text-base font-black shadow-lg">
                    <Link href="/explore">Ver planes reales <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
                )}
           </div>
        </div>

        {/* Logo placeholder */}

        

      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -ml-64 -mb-64" />
      </div>
    </div>
  );
}
