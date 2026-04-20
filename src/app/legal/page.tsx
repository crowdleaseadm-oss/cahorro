import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  Gavel, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  CircleDollarSign,
  Undo2,
  Lock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LegalPage() {
  const sections = [
    {
      icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
      title: "Requisitos de Participación",
      items: [
        "El registro simple te permite explorar la plataforma.",
        "Para pagar la primera cuota y unirte a un grupo debes estar verificado y tener tu cuenta validada.",
        "El pago de la primera cuota es obligatorio para confirmar la adhesión a un grupo.",
        "Es necesario designar un beneficiario para el seguro de vida colectivo."
      ]
    },
    {
      icon: <Calendar className="h-6 w-6 text-primary" />,
      title: "Activación de Grupo y Cobranza",
      items: [
        "Un grupo se 'Activa' cuando el último miembro se une y abona su primera cuota.",
        "La segunda cuota vencerá el día 5 o 20 del mes siguiente o subsiguiente a la activación, contemplando 30 días de gracia para el último suscripto.",
        "Los actos de adjudicación se realizarán pasados los 5 días del vencimiento mensual (días 5 y 20)."
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Ingreso de Fondos",
      items: [
        "Todo método de pago (CBU/CVU, tarjeta) debe pertenecer al titular de la cuenta.",
        "La titularidad se valida contrastando el CUIT/CUIL del titular con el del método de pago.",
        "No se permite el ingreso de fondos desde cuentas de terceros (Normativas AML)."
      ]
    },
    {
      icon: <Gavel className="h-6 w-6 text-primary" />,
      title: "Propuestas de Licitación",
      items: [
        "Puedes licitar con 'Licitación Común' (fondos propios) o 'Licitación Plus' (retención de capital).",
        "La 'Licitación Plus' tiene un costo de retención del 3% + IVA sobre el monto ofertado.",
        "La oferta se realiza con el valor de la 'alícuota pura', ahorrando en gastos administrativos."
      ]
    },
    {
      icon: <CircleDollarSign className="h-6 w-6 text-primary" />,
      title: "Adelanto de Cuotas",
      items: [
        "Puedes adelantar las últimas cuotas de tu plan en cualquier momento.",
        "Al adelantar, solo pagas la 'alícuota pura', obteniendo un descuento significativo.",
        "El adelanto no compite por la adjudicación, simplemente acorta el plazo de tu plan."
      ]
    },
    {
      icon: <Undo2 className="h-6 w-6 text-primary" />,
      title: "Baja de un Plan",
      items: [
        "Cancelación por Demora: Resolución en 24hs con reintegro total si el grupo no activa en 60 días.",
        "Baja Voluntaria: Devolución de alícuotas puras al finalizar el ciclo del grupo.",
        "Aplica una penalidad administrativa del 5% + IVA de lo abonado hasta el momento."
      ]
    },
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "Obligaciones en la Adjudicación",
      items: [
        "Es obligatorio integrar el capital ofertado en el plazo establecido al ganar por licitación.",
        "Se deben presentar las garantías requeridas (Seguro de Caución, Propietaria o Recibos de Sueldo).",
        "El sistema de garantías es flexible y se adapta a la solvencia demostrada."
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <Badge variant="outline" className="px-4 py-1 text-xs font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
          Marco Normativo
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Reglamento de Participación</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Las reglas claras que hacen posible nuestro sistema de confianza y ayuda mutua. Transparencia total en cada paso de tu ahorro.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, idx) => (
          <Card key={idx} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow group">
            <CardHeader className="bg-accent/30 pb-4 flex flex-row items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-border group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <CardTitle className="text-lg font-bold leading-tight">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5 opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 md:p-12 mt-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Scale className="h-64 w-64" />
        </div>
        <div className="max-w-2xl relative z-10">
          <h2 className="text-3xl font-black mb-6">Compromiso con la Transparencia</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              En Círculo de Ahorro, operamos bajo el principio de <b>solidaridad administrada</b>. Este reglamento asegura que cada participante cumpla con sus obligaciones para que los beneficios lleguen a todos en tiempo y forma.
            </p>
            <p>
              Nuestros procesos de adjudicación por sorteo y licitación son públicos y auditables, garantizando equidad absoluta para todos los integrantes del grupo, independientemente de su capital.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <ShieldCheck className="h-5 w-5" />
              Seguridad Bancaria
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <FileText className="h-5 w-5" />
              Contratos Vinculantes
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}