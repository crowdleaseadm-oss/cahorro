
'use client';

import { Search, Filter, Users, Calendar, Target, ChevronRight, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

export default function ExplorePage() {
  const circles = [
    {
      id: "1",
      name: "Círculo Premium 50K",
      description: "Ideal para inversión en capital de trabajo. Cuotas fijas en USD.",
      target: 50000,
      alicuota: 2083.33,
      totalFee: 2350.00,
      term: "24 meses",
      members: 45,
      capacity: 48, // 24 meses * (1 sorteo + 1 licitacion)
      category: "Inversión",
    },
    {
      id: "2",
      name: "Plan Vivienda 100K",
      description: "Ahorro programado para anticipo de hipoteca sin intereses bancarios.",
      target: 100000,
      alicuota: 1666.67,
      totalFee: 1890.00,
      term: "60 meses",
      members: 12,
      capacity: 120,
      category: "Vivienda",
    },
    {
      id: "3",
      name: "Emprendedor 15K",
      description: "Capital semilla para pequeños negocios. Adjudicaciones rápidas.",
      target: 15000.00,
      alicuota: 1250.00,
      totalFee: 1420.00,
      term: "12 meses",
      members: 18,
      capacity: 24,
      category: "Negocios",
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Explorar Círculos en USD</h1>
        <p className="text-muted-foreground">Capital Suscripto en múltiplos de $5,000 con cuotas sin interés bancario.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por Capital Suscripto o cuota..." className="pl-10 bg-white border-border" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="bg-white border-border gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button className="bg-primary text-white shadow-lg shadow-primary/20">
            Buscar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {circles.map((circle) => (
          <Card key={circle.id} className="group flex flex-col h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-2">
                <Badge className="bg-secondary/30 text-primary hover:bg-secondary/50 border-none font-bold">
                  {circle.category}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground font-medium">
                  <Users className="h-3 w-3 mr-1" />
                  {circle.members}/{circle.capacity}
                </div>
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">
                {circle.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {circle.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Capital Suscripto</span>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    ${circle.target.toLocaleString()} USD
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cuota Total</span>
                  <div className="font-bold text-primary flex items-center gap-1">
                    ${circle.totalFee.toLocaleString()}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs space-y-1">
                          <p className="text-xs font-bold">Desglose mensual:</p>
                          <p className="text-[10px]">Alícuota: ${circle.alicuota.toLocaleString()}</p>
                          <p className="text-[10px]">Der. Suscripción + Gasto Adm. + Seguro</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground bg-accent/30 p-3 rounded-lg border border-primary/5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Plazo: {circle.term}</span>
                </div>
                <span className="text-[10px] font-bold text-primary italic">Sin interés</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button asChild className="w-full group/btn shadow-md hover:shadow-primary/20">
                <Link href={`/explore/${circle.id}`} className="flex items-center justify-center">
                  Ver Plan Financiero
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
