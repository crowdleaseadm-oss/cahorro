import { Search, Filter, Users, Calendar, Target, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ExplorePage() {
  const circles = [
    {
      id: "1",
      name: "Viaje Grupal 2025",
      description: "Ahorro colectivo para un viaje inolvidable a Europa el próximo año.",
      target: 250000,
      monthlyFee: 5000,
      term: "12 meses",
      members: 45,
      maxMembers: 50,
      category: "Viajes",
    },
    {
      id: "2",
      name: "Inversión Inmobiliaria Q3",
      description: "Un círculo de alto capital para licitación de enganche de propiedades.",
      target: 500000,
      monthlyFee: 20000,
      term: "24 meses",
      members: 12,
      maxMembers: 25,
      category: "Inversión",
    },
    {
      id: "3",
      name: "Renovación de Hogar",
      description: "Ahorra paso a paso para mejorar tu espacio vital.",
      target: 80000,
      monthlyFee: 4000,
      term: "10 meses",
      members: 18,
      maxMembers: 20,
      category: "Hogar",
    },
    {
      id: "4",
      name: "Educación Continua",
      description: "Fondos para maestrías, diplomados o certificaciones internacionales.",
      target: 120000,
      monthlyFee: 6000,
      term: "18 meses",
      members: 8,
      maxMembers: 15,
      category: "Educación",
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Explorar Círculos</h1>
        <p className="text-muted-foreground">Encuentra el grupo perfecto que se adapte a tus metas financieras.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, meta o categoría..." className="pl-10 bg-white border-border" />
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

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {["Todos", "Viajes", "Inversión", "Hogar", "Educación", "Salud", "Autos"].map((cat) => (
          <Badge key={cat} variant={cat === "Todos" ? "default" : "secondary"} className="cursor-pointer px-4 py-1.5 hover:scale-105 transition-transform">
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  {circle.members}/{circle.maxMembers}
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Meta Total</span>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    ${circle.target.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cuota Mensual</span>
                  <div className="font-bold text-primary">
                    ${circle.monthlyFee.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/30 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Plazo: {circle.term}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button asChild className="w-full group/btn shadow-md hover:shadow-primary/20">
                <Link href={`/explore/${circle.id}`} className="flex items-center justify-center">
                  Ver Detalles
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