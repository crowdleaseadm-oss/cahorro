'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, where, doc, getDocs, collection, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, CheckCircle2, XCircle, Clock, Info, Gavel, Trophy, ListOrdered, 
  Search, Filter, History, AlertCircle, CalendarDays, UserCheck
} from 'lucide-react';
import { initiateWinnerValidation, finalizeAdjudication } from '@/lib/adjudication-service';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdjudicationsPanel({ db, isReadOnly = false }: { db: any, isReadOnly?: boolean }) {
  const [pendingWinners, setPendingWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States for Mass Processing
  const [quinielaNumbers, setQuinielaNumbers] = useState<string[]>(Array(20).fill(''));
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftWinners, setDraftWinners] = useState<any[]>([]);
  const [adjudicationPeriod, setAdjudicationPeriod] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // Suggested dates: 5th and 20th of current and next month
  const suggestedDates = useMemo(() => {
    const now = new Date();
    const dates = [];
    // Current month
    dates.push(new Date(now.getFullYear(), now.getMonth(), 5));
    dates.push(new Date(now.getFullYear(), now.getMonth(), 20));
    // Next month
    dates.push(new Date(now.getFullYear(), now.getMonth() + 1, 5));
    dates.push(new Date(now.getFullYear(), now.getMonth() + 1, 20));
    return dates.map(d => format(d, 'yyyy-MM-dd'));
  }, []);

  // Filter States
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // 1. Fetch active circles
  const circlesRef = useMemoFirebase(() => (db ? collection(db, 'saving_circles') : null), [db]);
  const { data: circles, isLoading: circlesLoading } = useCollection(circlesRef);

  // 2. Fetch Winners Pending Confirmation (Evaluation Period)
  useEffect(() => {
    async function fetchAllWinners() {
      if (!db || !circles) return;
      
      setLoading(true);
      try {
        const allWinners: any[] = [];
        const promises = circles.map(async (circle: any) => {
          const membersRef = collection(db, 'saving_circles', circle.id, 'members');
          const q = query(membersRef, where('adjudicationStatus', '==', 'WinnerPendingConfirmation'));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ 
            id: d.id, 
            ...d.data(), 
            savingCircleId: circle.id, 
            savingCircleName: circle.name 
          }));
        });

        const results = await Promise.all(promises);
        results.forEach(list => allWinners.push(...list));
        setPendingWinners(allWinners);
      } catch (error) {
        console.error("Error al buscar adjudicados:", error);
      } finally {
        setLoading(false);
      }
    }

    if (circles && circles.length > 0) {
      fetchAllWinners();
    } else if (circles && circles.length === 0) {
      setLoading(false);
    }
  }, [db, circles]);

  // Mass Processing Logic
  const handleMassProcess = async () => {
    if (!db || !circles) return;
    setIsProcessing(true);
    const newDrafts: any[] = [];

    try {
      // 1. Validar que haya al menos un número de quiniela
      if (!quinielaNumbers[0]) {
        toast({ title: "Datos faltantes", description: "Ingresa al menos el primer premio de la Quiniela.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      // 1.5 Guardar Resultados en Historial para el período
      const historyRef = doc(db, 'quiniela_history', adjudicationPeriod);
      await setDoc(historyRef, {
        date: adjudicationPeriod,
        numbers: quinielaNumbers,
        processedAt: new Date().toISOString(),
        status: 'Processed'
      });

      for (const circle of circles) {
        // Solo procesar grupos llenos/activos que no estén cerrados
        const isFull = (circle.currentMemberCount || 0) >= circle.memberCapacity;
        if (circle.status !== 'Active' || !isFull) continue;

        // 2. Obtener miembros elegibles
        const membersRef = collection(db, 'saving_circles', circle.id, 'members');
        const q = query(membersRef, where('adjudicationStatus', '==', 'Pending'), where('status', '==', 'Active'));
        const snap = await getDocs(q);
        const members = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        if (members.length === 0) continue;

        // 3. Match Quiniela (Sorteo)
        const capacity = circle.memberCapacity || 0;
        const digits = capacity >= 1000 ? 4 : (capacity >= 100 ? 3 : 2);
        let winner = null;
        let winMethod: 'Draw' | 'Chronological' = 'Draw';
        let matchedNum = '';

        for (const qNum of quinielaNumbers) {
          if (!qNum || qNum.length < digits) continue;
          const suffix = parseInt(qNum.slice(-digits));
          const match = members.find(m => m.orderNumber === suffix);
          if (match) {
            winner = match;
            matchedNum = qNum;
            break;
          }
        }

        // 4. Fallback Automático: Cronológico
        if (!winner) {
          winMethod = 'Chronological';
          winner = members.sort((a, b) => new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime())[0];
        }

        if (winner) {
          newDrafts.push({
            ...winner,
            circleId: circle.id,
            circleName: circle.name,
            method: winMethod,
            matchedNum: matchedNum,
            period: adjudicationPeriod
          });
        }
      }

      setDraftWinners(newDrafts);
      if (newDrafts.length > 0) {
        toast({ title: "Procesamiento Completo", description: `Se detectaron ganadores para ${newDrafts.length} grupos.` });
      } else {
        toast({ title: "Sin novedades", description: "No se encontraron grupos activos para adjudicar con estos datos." });
      }
    } catch (error) {
      toast({ title: "Error masivo", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmWinner = async (draft: any) => {
    try {
      await initiateWinnerValidation(db, draft.userId, draft.circleId, draft.id, draft.method, draft.period);
      
      setDraftWinners(prev => prev.filter(d => !(d.userId === draft.userId && d.circleId === draft.circleId)));
      // Note: pendingWinners will update via useEffect/listener if implemented, 
      // or we can manually update local state for immediate feedback
      setPendingWinners(prev => [...prev, { ...draft, adjudicationStatus: 'WinnerPendingConfirmation', savingCircleId: draft.circleId, savingCircleName: draft.circleName }]);
      
      toast({ title: "Confirmado", description: `Iniciado período para ${draft.userName} en el período ${draft.period}.` });
    } catch (e) {
      toast({ title: "Error al confirmar", variant: "destructive" });
    }
  };

  const handleValidationConfirm = async (winner: any) => {
    try {
      await finalizeAdjudication(db, winner.userId, winner.savingCircleId, winner.id);
      
      // Confirm associated bid if it was via bidding
      if (winner.adjudicationMethod === 'Bid') {
        const bidsSnap = await getDocs(query(
          collection(db, 'saving_circles', winner.savingCircleId, 'bids'),
          where('userId', '==', winner.userId),
          where('status', '==', 'Won')
        ));
        bidsSnap.forEach(b => updateDocumentNonBlocking(b.ref, { status: 'Accepted' }));
      }

      setPendingWinners(prev => prev.filter(w => w.userId !== winner.userId || w.savingCircleId !== winner.savingCircleId));
      toast({ title: "Adjudicación Oficial", description: "El socio ha completado la validación administrativa." });
    } catch (e) { toast({ title: "Error", description: "No se pudo finalizar la adjudicación.", variant: "destructive" }); }
  };

  // Filter pending winners by method
  const filteredWinners = pendingWinners.filter(w => {
    if (methodFilter === 'all') return true;
    return w.adjudicationMethod?.toLowerCase() === methodFilter.toLowerCase();
  });

  return (
    <div className="space-y-10">
      {/* 1. SECCIÓN DE CARGA MASIVA (QUINIELA) */}
      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="bg-primary/5 px-10 py-8 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <ListOrdered className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">Adjudicación Masiva Mensual</CardTitle>
                <CardDescription className="text-sm font-medium">Ingresa la Quiniela Nacional para procesar todos los grupos activos.</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* SELECTOR DE PERÍODO */}
              <div className="flex flex-col items-end gap-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Período</Label>
                <Select value={adjudicationPeriod} onValueChange={setAdjudicationPeriod}>
                  <SelectTrigger className="w-52 h-12 rounded-xl bg-white border-primary/20 font-bold">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {suggestedDates.map(date => (
                      <SelectItem key={date} value={date} className="font-bold">
                        Cierre {format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleMassProcess} 
                disabled={isProcessing || !quinielaNumbers[0]}
                className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-3"
              >
                {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <Trophy className="h-6 w-6" />}
                Procesar Sorteo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-10 py-10 space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {quinielaNumbers.map((num, i) => (
              <div key={i} className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-1">{i+1}º</Label>
                <Input 
                  value={num} 
                  onChange={(e) => {
                    const n = [...quinielaNumbers];
                    n[i] = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setQuinielaNumbers(n);
                  }}
                  className="font-mono text-center text-lg font-bold h-12 bg-muted/30 border-none focus:ring-2 focus:ring-primary rounded-xl"
                  placeholder="00000"
                />
              </div>
            ))}
          </div>

          {draftWinners.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-primary" />
                  Pre-Selección de Ganadores Detectados
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setDraftWinners([])} className="text-muted-foreground">Ocultar lista</Button>
              </div>
              <div className="rounded-2xl border bg-muted/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="py-4 px-6 font-bold text-xs uppercase text-muted-foreground">Grupo</TableHead>
                      <TableHead className="py-4 font-bold text-xs uppercase text-muted-foreground">Socio Detectado</TableHead>
                      <TableHead className="py-4 font-bold text-xs uppercase text-muted-foreground">Método</TableHead>
                      <TableHead className="py-4 text-right px-6 font-bold text-xs uppercase text-muted-foreground">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftWinners.map((draft, idx) => (
                      <TableRow key={idx} className="hover:bg-white transition-colors border-b last:border-0">
                        <TableCell className="px-6 font-bold">{draft.circleName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{draft.userName}</span>
                            <span className="text-[10px] text-primary font-mono font-bold">Orden: #{draft.orderNumber.toString().padStart(2, '0')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={draft.method === 'Draw' ? 'bg-blue-100 text-blue-700 border-none px-3' : 'bg-orange-100 text-orange-700 border-none px-3'}>
                            {draft.method === 'Draw' ? `Sorteo (${draft.matchedNum})` : 'Cronológico (Mayor Antigüedad)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          {isReadOnly ? (
                            <Badge variant="ghost" className="text-[10px] opacity-40">LECTURA</Badge>
                          ) : (
                            <Button 
                              onClick={() => handleConfirmWinner(draft)}
                              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/10"
                              size="sm"
                            >
                              Iniciar 48hs
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. PANEL DE EVALUACIÓN Y VALIDACIÓN (HISTORIAL) */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div>
            <h2 className="text-3xl font-black text-foreground">Validación Administrativa</h2>
            <p className="text-muted-foreground font-medium mt-1">Gestión de socios en periodo de evaluación (48hs para confirmación final).</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white border rounded-2xl flex items-center px-4 h-12 shadow-sm">
              <Filter className="h-4 w-4 text-muted-foreground mr-3" />
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="border-none bg-transparent shadow-none focus:ring-0 p-0 text-xs font-bold w-40">
                  <SelectValue placeholder="Filtrar Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Métodos</SelectItem>
                  <SelectItem value="draw">Sorteo</SelectItem>
                  <SelectItem value="bid">Licitación</SelectItem>
                  <SelectItem value="chronological">Cronológico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
            {circlesLoading || loading ? (
              <div className="py-24 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : filteredWinners.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center gap-4">
                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center">
                  <History className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground italic font-medium">No se encontraron adjudicaciones pendientes de validación con los filtros aplicados.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/5 border-b">
                  <TableRow>
                    <TableHead className="px-10 py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Socio / Grupo</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Metodología de Adjudicación</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Vence Confirmación</TableHead>
                    <TableHead className="text-right px-10 font-bold text-xs uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWinners.map((winner: any) => {
                    const drawDateStr = winner.adjudicationDate;
                    const drawDate = drawDateStr ? new Date(drawDateStr) : new Date();
                    const expiryDate = new Date(drawDate.getTime() + 48 * 60 * 60 * 1000);
                    const isExpired = new Date() > expiryDate;
                    const method = winner.adjudicationMethod || 'Draw';

                    return (
                      <TableRow key={`${winner.savingCircleId}-${winner.userId}`} className="group hover:bg-muted/5 transition-colors">
                        <TableCell className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="font-bold text-base text-foreground">{winner.userName}</span>
                            <span className="text-[10px] text-primary font-black uppercase tracking-widest">{winner.savingCircleId} — {winner.savingCircleName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-2 h-8 px-4 border-none shadow-sm rounded-full font-bold uppercase text-[10px] 
                            ${method === 'Bid' ? 'bg-amber-50 text-amber-700' : 
                              method === 'Chronological' ? 'bg-indigo-50 text-indigo-700' : 
                              'bg-sky-50 text-sky-700'}`}>
                            {method === 'Bid' ? <Gavel className="h-3 w-3" /> : 
                             method === 'Chronological' ? <History className="h-3 w-3" /> : 
                             <Trophy className="h-3 w-3" />}
                            {method === 'Bid' ? 'Licitación' : 
                             method === 'Chronological' ? 'Cronológico' : 
                             'Sorteo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex flex-col gap-1 ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                              <CalendarDays className="h-3 w-3" />
                              {format(expiryDate, "d 'de' MMM, HH:mm", { locale: es })}
                            </div>
                            {isExpired && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full w-fit">ADMINISTRACIÓN VENCIDA</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-10">
                          {!isReadOnly && (
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:bg-red-50 font-bold"
                                onClick={() => {/* existing cancel logic */}}
                              >
                                Anular
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200"
                                onClick={() => handleValidationConfirm(winner)}
                              >
                                Confirmar Capital
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-sky-50/50 border border-sky-100 rounded-[2rem] p-8 flex gap-6">
        <div className="h-12 w-12 bg-sky-100 rounded-2xl flex items-center justify-center shrink-0">
          <Info className="h-6 w-6 text-sky-600" />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-sky-900">Guía de Procedimientos</h4>
          <p className="text-sm text-sky-800/70 leading-relaxed font-medium">
            El sistema de <strong>Adjudicación Masiva</strong> automatiza la detección de ganadores para todos tus grupos a partir de una única carga de Quiniela. 
            Recuerda que si no hay coincidencia numérica, se aplica automáticamente el <strong>Orden Cronológico</strong> para asegurar que cada grupo asigne su capital mensual. 
            Una vez pre-seleccionados, la confirmación inicia el periodo de 48hs de validación administrativa.
          </p>
        </div>
      </div>
    </div>
  );
}
