
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, MessageSquare } from "lucide-react"

export default function FAQPage() {
  const faqs = [
    {
      q: "¿Cómo se compone mi cuota mensual?",
      a: "Tu cuota se compone de cuatro pilares: 1) Alícuota Pura (valor del capital dividido el plazo), 2) Gastos Administrativos + IVA (21%), 3) Derecho de Suscripción + IVA (21%) (prorrateado solo en las primeras cuotas), y 4) Seguro de Vida decreciente calculado sobre el saldo de capital pendiente cada mes."
    },
    {
      q: "¿Qué pasa si alguien deja de pagar?",
      a: "Contamos con un fondo de garantía y un proceso legal riguroso. Cada miembro firma un contrato vinculante. En caso de impago, el fondo de garantía cubre la cuota temporalmente mientras se ejecutan las medidas de recuperación legal y administrativa."
    },
    {
      q: "¿Cómo se decide quién recibe el dinero primero?",
      a: "Existen dos modalidades: Sorteo y Licitación. En el sorteo mensual, el azar decide quién adjudica el capital. En la licitación, los miembros ofrecen adelantar cuotas para obtener el capital antes, similar a una subasta de prioridades."
    },
    {
      q: "¿Es seguro mi dinero?",
      a: "Sí, operamos bajo regulaciones financieras vigentes y utilizamos cuentas bancarias segregadas. Además, todos los participantes pasan por un proceso de verificación de identidad (KYC) y el respaldo de un contrato legal notarizado."
    },
    {
      q: "¿Puedo retirarme antes de que termine el círculo?",
      a: "Depende del reglamento del círculo. Generalmente, se permite si encuentras a un sustituto que asuma tus compromisos y beneficios, sujeto a aprobación administrativa y validación de antecedentes financieros."
    },
    {
      q: "¿Las cuotas son fijas?",
      a: "Las cuotas se calculan en USD y se abonan en dicha moneda o su equivalente en moneda local al tipo de cambio del día de pago, asegurando que el capital final no pierda valor adquisitivo durante el plazo."
    },
    {
      q: "¿Qué necesito para empezar a unirme a un grupo?",
      a: "Para unirte a cualquier grupo de ahorro y realizar el pago de la primera cuota, es obligatorio completar el proceso de verificación de identidad (KYC) y que tu cuenta sea validada por nuestro equipo administrativo. Este proceso asegura la legalidad y transparencia de todo el círculo."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-12 pt-24 pb-20 px-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 text-primary mb-2">
          <HelpCircle className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Preguntas Frecuentes</h1>
        <p className="text-lg text-muted-foreground">Todo lo que necesitas saber sobre los círculos de ahorro y su transparencia financiera.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-border">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-muted py-2 last:border-0">
              <AccordionTrigger className="text-left font-bold text-lg hover:no-underline hover:text-primary transition-colors py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-accent/30 rounded-3xl border border-primary/10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-xl">¿Aún tienes dudas?</h3>
            <p className="text-muted-foreground text-sm">Nuestro equipo de soporte está listo para ayudarte con tu plan.</p>
          </div>
        </div>
        <a 
          href="https://wa.me/542235194889" 
          target="_blank" 
          rel="noopener noreferrer"
          className="whitespace-nowrap bg-primary text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-center"
        >
          Contactar Soporte
        </a>
      </div>
    </div>
  )
}
