'use client';

import { 
  calculatePureAlicuota, 
  calculateAdminFee, 
  calculateAverageLifeInsurance,
  calculateSubscriptionFee 
} from '@/lib/financial-logic';
import { Search, Filter, Users, Calendar, Target, ChevronRight, Info, Loader2, Lock, Eye, X, DollarSign, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn, formatCurrency } from '@/lib/utils';

export default function ExplorePage() {
  const db = useFirestore();
  const { user } = useUser();
  const [selectedCapitals, setSelectedCapitals] = useState<string[]>([]);
  const [selectedCuotas, setSelectedCuotas] = useState<string[]>([]);
  const [selectedPlazos, setSelectedPlazos] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");

  const circlesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'saving_circles'), where('status', '==', 'Active'));
  }, [db, user]);

  const { data: circles, isLoading } = useCollection(circlesRef);

  const processedCircles = useMemo(() => {
    const MOCK_CIRCLES = [
      { id: 'DEMO01', name: '$ 2.000', targetCapital: 2000, totalInstallments: 12, currentMemberCount: 12, memberCapacity: 24, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
      { id: 'DEMO02', name: '$ 5.000', targetCapital: 5000, totalInstallments: 36, currentMemberCount: 67, memberCapacity: 72, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
      { id: 'DEMO03', name: '$ 15.000', targetCapital: 15000, totalInstallments: 84, currentMemberCount: 163, memberCapacity: 168, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
      { id: 'DEMO04', name: '$ 10.000', targetCapital: 10000, totalInstallments: 84, currentMemberCount: 84, memberCapacity: 168, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
      { id: 'DEMO05', name: '$ 7.500', targetCapital: 7500, totalInstallments: 48, currentMemberCount: 10, memberCapacity: 96, subscriptionFeeRate: 3, administrativeFeeRate: 10, lifeInsuranceRate: 0.09, drawMethodCount: 1, bidMethodCount: 1, status: 'Active', isPrivate: false, creationDate: new Date().toISOString() },
    ];

    const allCircles = [...(circles || []), ...MOCK_CIRCLES];
    
    return allCircles.map(circle => {
      const n = circle.totalInstallments;
      const alicuota = calculatePureAlicuota(circle.targetCapital, n);
      const adminFee = calculateAdminFee(alicuota, circle.administrativeFeeRate || 10, circle.adminVatApplied);
      const subFeeTotal = calculateSubscriptionFee(circle.targetCapital, circle.subscriptionFeeRate || 3, circle.subscriptionVatApplied);
      const averageLifeInsurance = calculateAverageLifeInsurance(circle.targetCapital, circle.lifeInsuranceRate || 0.09, circle.lifeInsuranceVatApplied);
      
      const totalPlanCost = circle.targetCapital + (n * adminFee) + subFeeTotal + (n * averageLifeInsurance);
      const cuotaPromedio = totalPlanCost / n;
      
      const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
      const remaining = circle.memberCapacity - (circle.currentMemberCount || 0);
      const isUrgent = !isFull && remaining <= (circle.memberCapacity * 0.1);

      return {
        ...circle,
        cuotaPromedio,
        isFull,
        remaining,
        isUrgent
      };
    });
  }, [circles]);

  const filteredCircles = useMemo(() => {
    let result = processedCircles.filter(c => {
      if (c.isFull) return false;
      let matchesCapital = selectedCapitals.length === 0;
      if (selectedCapitals.length > 0) {
        if (selectedCapitals.includes('cap-1') && c.targetCapital < 2500) matchesCapital = true;
        if (selectedCapitals.includes('cap-2') && c.targetCapital >= 2500 && c.targetCapital <= 5000) matchesCapital = true;
        if (selectedCapitals.includes('cap-3') && c.targetCapital > 5000 && c.targetCapital <= 7500) matchesCapital = true;
        if (selectedCapitals.includes('cap-4') && c.targetCapital > 7500 && c.targetCapital <= 10000) matchesCapital = true;
        if (selectedCapitals.includes('cap-5') && c.targetCapital > 10000 && c.targetCapital <= 12500) matchesCapital = true;
        if (selectedCapitals.includes('cap-6') && c.targetCapital > 12500) matchesCapital = true;
      }
      let matchesCuota = selectedCuotas.length === 0;
      if (selectedCuotas.length > 0) {
        if (selectedCuotas.includes('cuo-1') && c.cuotaPromedio < 100) matchesCuota = true;
        if (selectedCuotas.includes('cuo-2') && c.cuotaPromedio >= 100 && c.cuotaPromedio <= 200) matchesCuota = true;
        if (selectedCuotas.includes('cuo-3') && c.cuotaPromedio > 200 && c.cuotaPromedio <= 300) matchesCuota = true;
        if (selectedCuotas.includes('cuo-4') && c.cuotaPromedio > 300 && c.cuotaPromedio <= 400) matchesCuota = true;
        if (selectedCuotas.includes('cuo-5') && c.cuotaPromedio > 400 && c.cuotaPromedio <= 500) matchesCuota = true;
        if (selectedCuotas.includes('cuo-6') && c.cuotaPromedio > 500) matchesCuota = true;
      }
      const matchesPlazo = selectedPlazos.length === 0 || selectedPlazos.includes(c.totalInstallments.toString());
      const matchesVisibility = selectedVisibility.length === 0 || 
        (selectedVisibility.includes('public') && !c.isPrivate) || 
        (selectedVisibility.includes('private') && c.isPrivate);
      return matchesCapital && matchesCuota && matchesPlazo && matchesVisibility;
    });

    if (sortBy === 'cuota-asc') result.sort((a, b) => a.cuotaPromedio - b.cuotaPromedio);
    if (sortBy === 'capital-desc') result.sort((a, b) => b.targetCapital - a.targetCapital);
    if (sortBy === 'plazo-asc') result.sort((a, b) => a.totalInstallments - b.totalInstallments);
    if (sortBy === 'urgency') result.sort((a, b) => a.remaining - b.remaining);

    return result;
  }, [processedCircles, selectedCapitals, selectedCuotas, selectedPlazos, selectedVisibility, sortBy]);

  const toggleFilter = (list: string[], setList: (val: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(i => i !== value));
    } else {
      setList([...list, value]);
    }
  };

  const activeFiltersCount = selectedCapitals.length + selectedCuotas.length + selectedPlazos.length + selectedVisibility.length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase text-primary">Círculos de Ahorro</h1>
          <p className="text-muted-foreground font-medium text-sm">Explorá grupos y empezá a cumplir tus metas hoy mismo.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedCapitals([]);
                setSelectedCuotas([]);
                setSelectedPlazos([]);
                setSelectedVisibility([]);
                setSortBy("default");
              }}
              className="text-xs font-bold text-destructive border-destructive/20 hover:bg-destructive/5 gap-2 h-9 px-4 rounded-xl uppercase"
            >
              <X className="h-4 w-4" />
              Limpiar ({activeFiltersCount})
            </Button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ordenar</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 rounded-xl bg-accent/50 border-none font-bold text-xs">
                <ArrowUpDown className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Recomendados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" className="text-xs">Recomendados</SelectItem>
                <SelectItem value="cuota-asc" className="text-xs">Menor Cuota</SelectItem>
                <SelectItem value="capital-desc" className="text-xs">Mayor Capital</SelectItem>
                <SelectItem value="plazo-asc" className="text-xs">Menor Plazo</SelectItem>
                <SelectItem value="urgency" className="text-xs">Casi Completos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS HORIZONTAL CON FONDO SÓLIDO */}
      <div className="sticky top-[64px] z-30 bg-white py-4 border-y border-primary/10 shadow-sm -mx-4 px-4 md:-mx-8 md:px-8">
        <ScrollArea className="w-full pb-4 md:pb-0">
          <div className="flex items-start gap-12">
            {/* CAPITAL */}
            <div className="space-y-4 min-w-[240px]">
              <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Target className="h-3 w-3" /> Capital Objetivo
              </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { id: 'cap-1', label: '<$2.5k' },
                  { id: 'cap-2', label: '$2.5k-$5k' },
                  { id: 'cap-3', label: '$5k-$7.5k' },
                  { id: 'cap-4', label: '$7.5k-$10k' },
                  { id: 'cap-5', label: '$10k-$12.5k' },
                  { id: 'cap-6', label: '>$12.5k' }
                ].map(r => (
                  <label key={r.id} className="flex items-center space-x-2.5 group cursor-pointer">
                    <Checkbox 
                      checked={selectedCapitals.includes(r.id)} 
                      onCheckedChange={() => toggleFilter(selectedCapitals, setSelectedCapitals, r.id)}
                    />
                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* CUOTA */}
            <div className="space-y-4 min-w-[240px]">
              <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <DollarSign className="h-3 w-3" /> Cuota Promedio
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { id: 'cuo-1', label: '<$100' },
                  { id: 'cuo-2', label: '$100-$200' },
                  { id: 'cuo-3', label: '$200-$300' },
                  { id: 'cuo-4', label: '$300-$400' },
                  { id: 'cuo-5', label: '$400-$500' },
                  { id: 'cuo-6', label: '>$500' }
                ].map(r => (
                  <label key={r.id} className="flex items-center space-x-2.5 group cursor-pointer">
                    <Checkbox 
                      checked={selectedCuotas.includes(r.id)} 
                      onCheckedChange={() => toggleFilter(selectedCuotas, setSelectedCuotas, r.id)}
                    />
                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* PLAZOS */}
            <div className="space-y-4 min-w-[180px]">
              <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Plazos (Meses)
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {['12', '24', '48', '60', '84', '120'].map(t => (
                  <label key={t} className="flex items-center space-x-2.5 group cursor-pointer">
                    <Checkbox 
                      checked={selectedPlazos.includes(t)} 
                      onCheckedChange={() => toggleFilter(selectedPlazos, setSelectedPlazos, t)}
                    />
                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{t}m</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TIPO */}
            <div className="space-y-4 min-w-[140px]">
              <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Lock className="h-3 w-3" /> Visibilidad
              </h3>
              <div className="grid gap-3">
                {[
                  { id: 'public', label: 'Público' },
                  { id: 'private', label: 'Privado' }
                ].map(r => (
                  <label key={r.id} className="flex items-center space-x-2.5 group cursor-pointer">
                    <Checkbox 
                      checked={selectedVisibility.includes(r.id)} 
                      onCheckedChange={() => toggleFilter(selectedVisibility, setSelectedVisibility, r.id)}
                    />
                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* RESULTADOS */}
      <div className="pt-2 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Buscando los mejores planes...</p>
          </div>
        ) : !filteredCircles || filteredCircles.length === 0 ? (
          <div className="text-center py-32 bg-accent/20 rounded-[2rem] border-2 border-dashed border-primary/10">
            <div className="max-w-xs mx-auto space-y-4">
              <Filter className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground font-bold italic uppercase tracking-tighter">No encontramos planes con esos filtros.</p>
              <Button variant="link" onClick={() => {
                setSelectedCapitals([]);
                setSelectedCuotas([]);
                setSelectedPlazos([]);
                setSelectedVisibility([]);
                setSortBy("default");
              }} className="text-primary font-black uppercase tracking-widest">Ver todos los planes</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCircles.map((circle) => {
              const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
              const memberProgress = ((circle.currentMemberCount || 0) / circle.memberCapacity) * 100;

              return (
                <Card key={circle.id} className="group flex flex-col h-full border-none shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-visible bg-white rounded-[1.5rem] relative">
                  <div className={cn("h-1 w-full rounded-t-[1.5rem]", isFull ? 'bg-orange-500' : 'bg-primary')} />
                  
                  {/* Floating Urgency Badge */}
                  {circle.remaining <= 10 && !isFull && (
                    <Badge variant="default" className="absolute -top-2 -right-2 z-50 bg-red-600 text-white animate-pulse border-2 border-white shadow-lg font-black uppercase text-[10px] px-3 h-7 rounded-full flex items-center justify-center whitespace-nowrap">
                      ¡SOLO {circle.remaining}!
                    </Badge>
                  )}

                  <CardHeader className="p-4 pb-0 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight font-bold uppercase tracking-tighter line-clamp-1 flex-1">
                        {circle.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {circle.isPrivate ? (
                          <Badge variant="outline" className="h-5 gap-1 border-orange-100 text-orange-600 bg-orange-50/50 rounded-md text-[9px] font-black uppercase px-1.5">
                            <Lock className="h-2.5 w-2.5" /> Privado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-5 gap-1 border-blue-100 text-blue-600 bg-blue-50/50 rounded-md text-[9px] font-black uppercase px-1.5">
                            <Eye className="h-2.5 w-2.5" /> Público
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Cuota Promedio</span>
                        <div className="font-bold text-primary flex items-center gap-1 text-base">
                          {formatCurrency(circle.cuotaPromedio)}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-3 rounded-xl bg-white shadow-xl border-none">
                                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">Incluye cuota pura, gastos administrativos y seguro de vida.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="bg-accent/30 p-2 px-3 rounded-xl border border-primary/5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span className="font-bold text-[11px] uppercase tracking-tighter">{circle.totalInstallments} m</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-2.5 w-2.5" /> Miembros
                        </span>
                        <span className={cn(circle.remaining <= 5 ? "text-red-600" : "text-primary")}>
                          {circle.currentMemberCount || 0} / {circle.memberCapacity}
                        </span>
                      </div>
                      <Progress value={memberProgress} className="h-1.5 bg-accent/50 rounded-full" />
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button asChild className="w-full h-10 group/btn shadow-lg shadow-primary/5 hover:shadow-primary/10 rounded-xl font-black uppercase tracking-widest text-xs">
                      <Link href={`/explore/${circle.id}`} className="flex items-center justify-center">
                        Explorar
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
