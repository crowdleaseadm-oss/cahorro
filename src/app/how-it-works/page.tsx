import { Info, Users, CreditCard, TrendingUp, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function HowItWorks() {
  const steps = [
    {
      title: "Únete a un Círculo",
      description: "Explora y elige un grupo que se adapte a tu meta de ahorro mensual y capital final deseado.",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Aportación Mensual",
      description: "Cada mes, todos los miembros depositan una cuota fija. Este fondo común se entrega a un miembro por turno.",
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-accent"
    },
    {
      title: "Adjudicación",
      description: "Recibe el capital total acumulado del mes mediante sorteo o licitación. ¡Sin intereses bancarios!",
      icon: TrendingUp,
      color: "text-secondary-foreground",
      bg: "bg-secondary"
    },
    {
      title: "Seguridad Garantizada",
      description: "Todos los procesos están validados y supervisados bajo un marco legal transparente para tu tranquilidad.",
      icon: ShieldCheck,
      color: "text-green-500",
      bg: "bg-green-50"
    }
  ]

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">¿Cómo Funciona?</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          El Círculo de Ahorro es un modelo colaborativo donde la confianza y el compromiso colectivo construyen tu futuro.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {steps.map((step, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
            <CardContent className="p-8 flex gap-6">
              <div className={`flex-shrink-0 w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <step.icon className={`h-8 w-8 ${step.color}`} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-sm border border-border">
        <h2 className="text-2xl font-bold mb-8 text-center">Beneficios de Ahorrar en Círculo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Sin tasas de interés abusivas",
            "Disciplina de ahorro forzada",
            "Acceso anticipado a capital",
            "Capital de libre destino",
            "Comunidad de apoyo mutuo",
            "Flexibilidad en montos",
            "Gestión 100% digital"
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-accent/20">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center p-12 bg-primary rounded-3xl text-white shadow-xl shadow-primary/20">
        <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
        <p className="mb-8 opacity-90 text-lg">Únete hoy a miles de personas que están alcanzando sus metas.</p>
        <button className="bg-white text-primary px-8 py-3 rounded-xl font-bold text-lg hover:bg-secondary transition-colors">
          Ver círculos disponibles
        </button>
      </div>
    </div>
  )
}
