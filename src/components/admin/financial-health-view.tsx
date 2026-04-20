'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { format, addMonths, differenceInMonths, isSameMonth, parseISO, isAfter, isBefore, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { formatNumber, formatCurrency } from '@/lib/utils';
import { 
  calculatePureAlicuota, 
  calculateAdminFee, 
  calculateAverageLifeInsurance,
  calculateSubscriptionFee 
} from '@/lib/financial-logic';

interface FinancialHealthViewProps {
  circles: any[];
}

export function FinancialHealthView({ circles }: FinancialHealthViewProps) {
  const [monthsToShow, setMonthsToShow] = useState(12);
  const [filterActive, setFilterActive] = useState(true);
  const [filterClosed, setFilterClosed] = useState(true);
  const [filterFormation, setFilterFormation] = useState(true);

  const calculateProjections = useMemo(() => {
    const filteredCircles = (circles || []).filter(circle => {
      const currentMembers = Number(circle.currentMemberCount) || 0;
      const capacity = Number(circle.memberCapacity) || 1;
      const isFull = currentMembers >= capacity;
      const isCls = circle.status === 'Closed';
      const isForm = !isFull && !isCls;
      const isAct = isFull && !isCls;
      
      return (isAct && filterActive) || (isCls && filterClosed) || (isForm && filterFormation);
    });

    if (filteredCircles.length === 0) return [];

    const now = startOfMonth(new Date());
    const monthlyData: Record<string, {
      monthStr: string,
      dateObj: Date,
      percibidoSub: number,
      percibidoAdmin: number,
      devengadoSub: number,
      devengadoAdmin: number,
      percibidoPenalty: number,
      devengadoPenalty: number,
      percibidoCapital: number,
      devengadoCapital: number,
      percibidoTotal: number,
      devengadoTotal: number,
      isFuture: boolean
    }> = {};

    // Helper to add data
    const addVal = (date: Date, type: 'percibidoSub' | 'percibidoAdmin' | 'devengadoSub' | 'devengadoAdmin', amount: number) => {
      const ms = startOfMonth(date);
      const key = format(ms, 'yyyy-MM');
      if (!monthlyData[key]) {
        monthlyData[key] = {
          monthStr: format(ms, 'MMM yyyy', { locale: es }).toUpperCase(),
          dateObj: ms,
          percibidoSub: 0, percibidoAdmin: 0,
          devengadoSub: 0, devengadoAdmin: 0,
          percibidoPenalty: 0, devengadoPenalty: 0, // Keep in schema for compatibility but 0
          percibidoCapital: 0, devengadoCapital: 0,
          percibidoTotal: 0, devengadoTotal: 0,
          isFuture: isAfter(ms, now)
        };
      }
      monthlyData[key][type] += amount;
      if (type.startsWith('percibido')) monthlyData[key].percibidoTotal += amount;
      if (type.startsWith('devengado')) monthlyData[key].devengadoTotal += amount;
    };

    filteredCircles.forEach(circle => {
      const creationDate = circle.creationDate ? parseISO(circle.creationDate) : now;
      const startMs = startOfMonth(creationDate);
      
      const targetCapital = Number(circle.targetCapital) || 0;
      const totalInstallments = Number(circle.totalInstallments) || 84;
      const currentMembers = Number(circle.currentMemberCount) || 0;
      const capacity = Number(circle.memberCapacity) || 168; 
      const installmentValue = Number(circle.installmentValue) || (totalInstallments > 0 ? targetCapital / totalInstallments : 0);
      const status = circle.status;

      if (targetCapital <= 0) return; 

      const alicuota = calculatePureAlicuota(targetCapital, totalInstallments);
      const subFeeNet = calculateSubscriptionFee(targetCapital, circle.subscriptionFeeRate || 3, false);
      const adminFeeNet = calculateAdminFee(alicuota, circle.administrativeFeeRate || 10, false);

      const isFull = currentMembers >= capacity && capacity > 0;
      const isFormation = !isFull && status !== 'Closed';

      if (status === 'Closed' || (status === 'Active' && isFull)) {
        const activeMembers = status === 'Closed' ? capacity : currentMembers;
        const subMonthsCount = Math.max(1, Math.ceil(totalInstallments * 0.20));
        const monthlySubNet = subFeeNet / subMonthsCount;

        for (let i = 0; i < subMonthsCount; i++) {
          const mDate = addMonths(startMs, i);
          const isMonthFuture = isAfter(mDate, now);
          addVal(mDate, isMonthFuture ? 'devengadoSub' : 'percibidoSub', activeMembers * monthlySubNet);
        }

        for (let i = 0; i < totalInstallments; i++) {
          const mDate = addMonths(startMs, i);
          const isMonthFuture = isAfter(mDate, now);
          addVal(mDate, isMonthFuture ? 'devengadoAdmin' : 'percibidoAdmin', activeMembers * adminFeeNet);
        }

      } else if (isFormation) {
        // SIMULACIÓN PARA GRUPOS EN FORMACIÓN: 
        // 1. Suscripción + 1era Cuota Administrativa: Empiezan HOY (Simulando activación inmediata)
        const subMonthsCount = Math.max(1, Math.ceil(totalInstallments * 0.20));
        const monthlySubNet = subFeeNet / subMonthsCount;
        
        for (let i = 0; i < subMonthsCount; i++) {
          const mDateSimulated = addMonths(now, i); 
          addVal(mDateSimulated, 'devengadoSub', capacity * monthlySubNet);
        }

        // El primer gasto administrativo ingresa con la suscripción (Mes Actual)
        addVal(now, 'devengadoAdmin', capacity * adminFeeNet);

        // 2. Resto de Cuotas Administrativas (#2 a Final): 
        // Según usuario: 30 días de gracia para la 2da cuota.
        // Esto significa saltar un mes entre la #1 y la #2.
        const nextAdminStart = addMonths(now, 2); 

        for (let i = 0; i < totalInstallments - 1; i++) {
          const mDateSimulated = addMonths(nextAdminStart, i);
          addVal(mDateSimulated, 'devengadoAdmin', capacity * adminFeeNet);
        }
      }
    });

    addVal(now, 'devengadoSub', 0);

    const sorted = Object.values(monthlyData).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    const currentMonthIndex = sorted.findIndex(s => isSameMonth(s.dateObj, now));
    const offset = Math.max(0, currentMonthIndex);
    
    const startIdx = offset; 
    const endIdx = Math.min(sorted.length, offset + monthsToShow);

    return sorted.slice(startIdx, endIdx).map(d => ({
      ...d,
      netoPercibido: d.percibidoSub + d.percibidoAdmin,
      netoDevengado: d.devengadoSub + d.devengadoAdmin,
      totalMes: d.percibidoTotal + d.devengadoTotal
    }));

  }, [circles, monthsToShow, filterActive, filterClosed, filterFormation]);

  const customTooltipFormatter = (value: number) => {
    return [`${formatCurrency(value)}`, ''];
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mt-6">
        <CardHeader className="bg-primary/5 pb-8 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black text-primary">Salud Financiera Cronológica</CardTitle>
              <CardDescription className="text-foreground/70 font-medium">
                Proyección de flujos netos sin impuestos. Valores devengados calculados a partir del próximo mes. Contiene estimaciones de penalidad.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border self-end">
                {[12, 24, 36].map(m => (
                  <button
                    key={m}
                    onClick={() => setMonthsToShow(m)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${monthsToShow === m ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    +{m} Meses
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border px-4 self-end">
                <div className="flex items-center space-x-2">
                  <Checkbox id="f-active" checked={filterActive} onCheckedChange={(val) => setFilterActive(!!val)} />
                  <label htmlFor="f-active" className="text-xs font-bold cursor-pointer uppercase tracking-tight">Activos</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="f-closed" checked={filterClosed} onCheckedChange={(val) => setFilterClosed(!!val)} />
                  <label htmlFor="f-closed" className="text-xs font-bold cursor-pointer uppercase tracking-tight">Cerrados</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="f-formation" checked={filterFormation} onCheckedChange={(val) => setFilterFormation(!!val)} />
                  <label htmlFor="f-formation" className="text-xs font-bold cursor-pointer uppercase tracking-tight">En Form.</label>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[400px] w-full mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calculateProjections} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="monthStr" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(val) => `$${val / 1000}k`} />
                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} formatter={customTooltipFormatter} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
                
                <Bar dataKey="netoPercibido" name="Percibido (Cobrado)" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="netoDevengado" name="Devengado (Proyectado)" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl overflow-hidden border">
            <Table className="w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                   <TableHead className="text-[10px] uppercase tracking-tighter font-bold whitespace-nowrap px-2">MES</TableHead>
                   <TableHead className="text-right text-[10px] text-emerald-600 uppercase tracking-tighter font-bold whitespace-nowrap px-2">SUSC(P)</TableHead>
                   <TableHead className="text-right text-[10px] text-emerald-600 uppercase tracking-tighter font-bold whitespace-nowrap px-2">ADM(P)</TableHead>
                   <TableHead className="text-right text-[10px] text-blue-600 uppercase tracking-tighter font-bold whitespace-nowrap px-2 opacity-80">SUSC(D)</TableHead>
                   <TableHead className="text-right text-[10px] text-blue-600 uppercase tracking-tighter font-bold whitespace-nowrap px-2 opacity-80">ADM(D)</TableHead>
                   <TableHead className="text-right text-[11px] font-black whitespace-nowrap bg-muted/20 px-3">NETO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculateProjections.map((row) => (
                  <TableRow key={row.monthStr} className={row.isFuture ? "bg-blue-50/10" : ""}>
                    <TableCell className="font-bold flex items-center gap-1 text-[11px] px-2 py-3">
                      {row.monthStr}
                      {row.isFuture && <Badge variant="outline" className="text-[8px] uppercase border-blue-200 text-blue-600 bg-blue-50 px-1 py-0 h-4 min-w-0">Proy</Badge>}
                    </TableCell>
                    <TableCell className="text-right text-[12px] font-medium text-emerald-700 px-2">{formatCurrency(row.percibidoSub)}</TableCell>
                    <TableCell className="text-right text-[12px] font-medium text-emerald-700 px-2">{formatCurrency(row.percibidoAdmin)}</TableCell>
                    <TableCell className="text-right text-[12px] font-medium text-blue-600 opacity-80 px-2">{formatCurrency(row.devengadoSub)}</TableCell>
                    <TableCell className="text-right text-[12px] font-medium text-blue-600 opacity-80 px-2">{formatCurrency(row.devengadoAdmin)}</TableCell>
                    <TableCell className="text-right text-[13px] font-black bg-muted/10 px-3">{formatCurrency(row.totalMes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
