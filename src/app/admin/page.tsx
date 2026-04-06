import { ShieldCheck, Users, PiggyBank, MoreHorizontal, Plus, Search, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminPage() {
  const circles = [
    { id: "C001", name: "Empresarios Q4", members: "15/20", status: "Activo", created: "2024-01-10" },
    { id: "C002", name: "Inmuebles Sur", members: "8/15", status: "Abierto", created: "2024-03-05" },
    { id: "C003", name: "Viaje Escolar", members: "45/50", status: "Cerrado", created: "2023-11-20" },
  ]

  const users = [
    { name: "Juan Perez", email: "juan@example.com", circles: 3, joined: "2023-12-15", status: "Verificado" },
    { name: "Maria Garcia", email: "maria@example.com", circles: 1, joined: "2024-02-20", status: "Pendiente" },
    { name: "Carlos Ruiz", email: "cruiz@example.com", circles: 5, joined: "2023-10-01", status: "Verificado" },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-1">Gestión global de usuarios, círculos y adjudicaciones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white border-border">Descargar Reportes</Button>
          <Button className="shadow-lg shadow-primary/20 gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Círculo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <div className="text-xs text-green-500 font-bold mt-1">+12% este mes</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grupos Activos</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <div className="text-xs text-muted-foreground mt-1">15 abiertos a suscripción</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Capital en Gestión</CardTitle>
            <div className="h-4 w-4 text-primary font-bold">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4.2M</div>
            <div className="text-xs text-muted-foreground mt-1">Monto acumulado total</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Managed Circles */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Gestión de Círculos</CardTitle>
                <CardDescription>Supervisa y configura los grupos de ahorro.</CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar círculo..." className="pl-9 h-9 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Miembros</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {circles.map((circle) => (
                  <TableRow key={circle.id}>
                    <TableCell className="font-bold">{circle.name}</TableCell>
                    <TableCell>{circle.members}</TableCell>
                    <TableCell>
                      <Badge variant={circle.status === "Abierto" ? "default" : circle.status === "Activo" ? "secondary" : "outline"}>
                        {circle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Editar Configuración</DropdownMenuItem>
                          <DropdownMenuItem>Ver Miembros</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive font-bold">Cerrar Grupo</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Control de Usuarios</CardTitle>
                <CardDescription>Validación y seguimiento de perfiles.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="bg-white border-border">
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Grupos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{user.circles}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Verificado" ? "secondary" : "outline"} className={user.status === "Verificado" ? "bg-green-100 text-green-700 hover:bg-green-200 border-none" : ""}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Detalles</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}