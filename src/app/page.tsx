
'use client';

import { 
  ArrowRight, 
  HelpCircle,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden selection:bg-primary/10">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
      </div>
      <div className="max-w-7xl mx-auto pb-40 pt-20 px-6">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-12">
          <div className="flex flex-col items-center text-center max-w-6xl mx-auto">
            {/* COMBINED LOGO */}
            <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
              <div className="relative">
                <img 
                  src="/branding/Isotipo_nombre_eslogan pagina inicio.svg" 
                  alt="Círculo de Ahorro Logo" 
                  className="h-44 md:h-64 w-auto object-contain"
                />
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 mb-12">
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium">
                El sistema de ahorro <span className="text-primary font-bold">transparente y seguro</span> diseñado para que alcances tus metas junto a una comunidad sólida.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-[1.5rem] border-secondary/30 hover:bg-secondary/5 text-secondary text-lg font-bold transition-all hover:border-secondary group">
                  <Link href="/explainer" className="flex items-center gap-3">
                    <div className="bg-secondary/10 p-1.5 rounded-full group-hover:bg-secondary group-hover:text-white transition-all">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    ¿QUÉ ES UN CÍRCULO?
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-[1.5rem] border-primary/20 hover:bg-primary/5 text-lg font-bold transition-all hover:border-primary/40 group">
                  <Link href="/presentation" className="flex items-center gap-3">
                    PRESENTACIÓN GENERAL 
                    <div className="bg-primary text-white p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </Link>
                </Button>
                <Button asChild size="lg" className="h-16 px-10 rounded-[1.5rem] bg-primary hover:bg-primary/95 text-lg font-black shadow-2xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95 group">
                  <Link href="/explore">
                    EXPLORAR GRUPOS <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
