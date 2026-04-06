import { ShieldCheck, Scale, FileText, Gavel } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LegalPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Marco Legal y Regulaciones</h1>
        <p className="text-xl text-muted-foreground">Tu seguridad financiera es nuestra máxima prioridad. Operamos bajo estándares de transparencia y cumplimiento normativo.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-accent/30 pb-6">
            <Scale className="h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl">Normatividad Vigente</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Círculo de Ahorro opera conforme a las leyes de sociedades mercantiles y regulaciones de ahorro colectivo en las jurisdicciones correspondientes.
            </p>
            <p>
              Nuestros contratos de adhesión están registrados y validados por las autoridades de protección al consumidor, asegurando cláusulas justas y transparentes para todos los participantes.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-accent/30 pb-6">
            <ShieldCheck className="h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl">Protección de Datos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Cumplimos estrictamente con la Ley Federal de Protección de Datos Personales. Tu información financiera y personal está encriptada con estándares bancarios.
            </p>
            <p>
              Nunca compartimos tus datos con terceros sin tu consentimiento explícito, y utilizamos tecnologías de punta para prevenir cualquier tipo de fraude o acceso no autorizado.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Gavel className="h-6 w-6 text-primary" />
          Nuestros Compromisos Legales
        </h2>
        <div className="grid gap-4">
          {[
            {
              title: "Contratos Vinculantes",
              desc: "Cada círculo está respaldado por un contrato legalmente vinculante que detalla derechos, obligaciones y procesos de adjudicación."
            },
            {
              title: "Prevención de Fraude",
              desc: "Implementamos procesos de validación de identidad (KYC) y prevención de lavado de dinero (AML) en todas nuestras operaciones."
            },
            {
              title: "Fondos Segregados",
              desc: "Los fondos de los círculos se mantienen en cuentas bancarias totalmente separadas de los activos operativos de la empresa."
            },
            {
              title: "Transparencia de Comisiones",
              desc: "Todas las comisiones administrativas están detalladas desde el inicio, sin costos ocultos ni letras chiquitas."
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white border border-border hover:border-primary/20 transition-colors">
              <FileText className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}