'use client';

import React from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Info,
  Clock,
  CheckCircle2,
  FileSearch,
  AlertCircle,
  FileMinus,
  FileSignature,
  Inbox,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function DocumentationPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pt-24 pb-12 px-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <FileText className="h-10 w-10 text-primary" />
            Documentación
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Gestiona y consulta los documentos requeridos por la administración.</p>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre de documento..." 
            className="pl-12 h-12 rounded-2xl border-none bg-muted/30 focus-visible:ring-primary"
          />
        </div>
        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold">Filtrar</Button>
      </div>

      {/* 3. Empty State (or List) */}
      <Card className="border-dashed border-2 bg-muted/10 flex flex-col items-center justify-center p-20 text-center rounded-[3rem]">
        <div className="h-24 w-24 bg-muted/40 rounded-full flex items-center justify-center mb-6">
          <Inbox className="h-12 w-12 text-muted-foreground/30" />
        </div>
        <h4 className="text-2xl font-bold">Sin solicitudes pendientes</h4>
        <p className="text-muted-foreground max-w-sm mt-2 mb-8 font-medium italic">
          Actualmente no tienes documentos adicionales requeridos. Te avisaremos si necesitamos algo más para tu legajo.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-xl h-12 px-6 font-bold gap-2">
            <History className="h-5 w-5" /> Historial
          </Button>
          <Button className="rounded-xl h-12 px-6 font-bold gap-2 shadow-lg">
            <Upload className="h-5 w-5" /> Subir Documento
          </Button>
        </div>
      </Card>

      {/* 5. Security Notice */}
      <div className="bg-muted/50 border rounded-[2rem] p-8 flex gap-6">
        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <AlertCircle className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h4 className="font-bold">Privacidad de tus datos</h4>
          <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
            Todos los archivos que subas a la plataforma son encriptados y almacenados de forma segura. 
            Solo el personal autorizado de la administración de Círculo de Ahorro tiene acceso a tu documentación para fines de validación legal.
          </p>
        </div>
      </div>
    </div>
  );
}
