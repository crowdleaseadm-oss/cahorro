
'use client';

import { Search, Filter, Users, Calendar, Target, ChevronRight, Info, Loader2, Lock, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useState } from 'react';

export default function ExplorePage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const circlesRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'saving_circles'), where('status', '==', 'Active'));
  }, [db]);

  const { data: circles, isLoading } = useCollection(circlesRef);

  const filteredCircles = circles?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.targetCapital.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Explorar Círculos en USD</h1>
        <p className="text-muted-foreground">Capital Suscripto en múltiplos de $5,000 con gestión de ahorro colaborativo.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o capital..." 
            className="pl-10 bg-white border-border" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="bg-white border-border gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando círculos disponibles...</p>
        </div>
      ) : !filteredCircles || filteredCircles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-dashed border-2">
          <p className="text-muted-foreground italic">No se encontraron círculos activos en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredCircles.map((circle) => {
            const IVA_RATE = 1.21;
            const n = circle.totalInstallments;
            const alicuota = circle.targetCapital / n;
            const adminFee = (alicuota * (circle.administrativeFeeRate || 0.10)) * IVA_RATE;
            const subFeeTotal = (circle.targetCapital * (circle.subscriptionFeeRate || 0.03)) * IVA_RATE;
            
            const insuranceSum = (circle.lifeInsuranceRate || 0.0009) * circle.targetCapital * (n + 1) / 2;
            
            const totalPlanCost = circle.targetCapital + (n * adminFee) + subFeeTotal + insuranceSum;
            const cuotaPromedio = totalPlanCost / n;
            
            const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
            const memberProgress = ((circle.currentMemberCount || 0) / circle.memberCapacity) * 100;

            return (
              <Card key={circle.id} className="group flex flex-col h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
                <div className={`h-2 w-full ${isFull ? 'bg-orange-500' : 'bg-primary'}`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant={isFull ? "secondary" : "default"} className={`border-none font-bold px-3 ${isFull ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {isFull ? 'ACTIVO (Completo)' : 'ABIERTO'}
                      </Badge>
                      {circle.isPrivate ? (
                        <Badge variant="outline" className="gap-1 border-orange-200 text-orange-700 bg-orange-50">
                          <Lock className="h-3 w-3" /> Privado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 bg-blue-50">
                          <Eye className="h-3 w-3" /> Público
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">
                    {circle.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Capital</span>
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        ${circle.targetCapital.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cuota Promedio</span>
                      <div className="font-bold text-primary flex items-center gap-1">
                        ${cuotaPromedio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs space-y-1">
                              <p className="text-xs font-bold">Cuota Promedio Estimada:</p>
                              <p className="text-[10px] leading-relaxed">Incluye Alícuota + Gastos Admin + Derecho de Suscripción + Seguro de Vida + IVA (21%).</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Miembros
                      </span>
                      <span className={isFull ? "text-orange-600" : "text-primary"}>
                        {circle.currentMemberCount || 0} / {circle.memberCapacity}
                      </span>
                    </div>
                    <Progress value={memberProgress} className={`h-2 ${isFull ? 'bg-orange-100' : 'bg-muted'}`} />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground bg-accent/30 p-3 rounded-lg border border-primary/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Plazo: {circle.totalInstallments} meses</span>
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  )
}
