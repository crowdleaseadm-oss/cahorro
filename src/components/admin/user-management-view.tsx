'use client';

import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, Calendar, Search, User, Shield } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminUserDetailDialog } from './admin-user-detail-dialog';
import { toast } from '@/hooks/use-toast';
import { KYC_STATUS_LABELS, KYC_STATUS_COLORS } from '@/lib/kyc-utils';
import { Clock, ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserManagementView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Nuevo: Chequear si el usuario actual es CEO
  const currentUserRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: currentUserProfile } = useDoc(currentUserRef);
  const isCEO = currentUserProfile?.role === 'ceo';

  const handleUpdateRole = (targetUserId: string, newRole: string) => {
    if (!db || !isCEO || isReadOnly) return;
    updateDocumentNonBlocking(doc(db, 'users', targetUserId), { role: newRole });
    toast({ title: "Rol actualizado", description: `Usuario actualizado a ${newRole.toUpperCase()}` });
  };

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.documentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, email o ID..." 
            className="pl-10 h-11 rounded-xl bg-white border-muted"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-full border">
          Total: {users?.length || 0} Usuarios Registrados
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 px-8 py-6">
          <CardTitle className="text-xl font-bold">Listado Global de Usuarios</CardTitle>
          <CardDescription>Gestión de identidades y datos de contacto de todos los ahorristas.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Cargando base de usuarios...</p>
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="p-20 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium italic">No se encontraron usuarios que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="px-8 font-bold text-xs uppercase tracking-widest py-4">Usuario / ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Contacto</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-4">KYC / Identidad</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Rol / Estado</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Registrado</TableHead>
                  <TableHead className="text-right px-8 font-bold text-xs uppercase tracking-widest py-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="group hover:bg-muted/5 transition-colors">
                    <TableCell className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{u.displayName || 'Sin Nombre'}</span>
                        <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-tighter">
                          {u.documentId || u.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {u.email}
                        </div>
                        {u.phoneNumber && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {u.phoneNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn("text-[9px] uppercase font-bold justify-center w-fit", KYC_STATUS_COLORS[u.kycStatus || 'not_started'])}>
                          {u.kycStatus === 'verified' && <ShieldCheck className="h-2 w-2 mr-1" />}
                          {u.kycStatus === 'pending' && <Clock className="h-2 w-2 mr-1" />}
                          {u.kycStatus === 'rejected' && <ShieldAlert className="h-2 w-2 mr-1" />}
                          {(!u.kycStatus || u.kycStatus === 'not_started') && <Fingerprint className="h-2 w-2 mr-1" />}
                          {KYC_STATUS_LABELS[u.kycStatus || 'not_started']}
                        </Badge>
                        {u.kycStatus === 'verified' && u.cuit && (
                          <span className="text-[9px] font-mono font-bold text-muted-foreground ml-1">
                            CUIT: {u.cuit}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          u.role === 'ceo' ? 'border-primary text-primary bg-primary/10 font-black' : 
                          u.role === 'admin' ? 'border-blue-500 text-blue-600 bg-blue-50' : 
                          'border-muted text-muted-foreground'
                        }>
                          {u.role?.toUpperCase() || 'USER'}
                        </Badge>
                        
                        {isCEO && u.role !== 'ceo' && !isReadOnly && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full hover:bg-blue-50 hover:text-blue-600"
                              title="Hacer Admin"
                              onClick={() => handleUpdateRole(u.id, 'admin')}
                              disabled={u.role === 'admin'}
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full hover:bg-muted"
                              title="Hacer Usuario"
                              onClick={() => handleUpdateRole(u.id, 'user')}
                              disabled={u.role === 'user' || !u.role}
                            >
                              <User className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {u.createdAt ? format(u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt), "d MMM, yyyy", { locale: es }) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="text-[9px] uppercase tracking-widest h-7 rounded-lg"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDetailOpen(true);
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminUserDetailDialog 
        user={selectedUser} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />
    </div>
  );
}
