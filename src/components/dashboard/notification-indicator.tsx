'use client';

import { Bell } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationIndicator() {
  const { user } = useUser();
  const db = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(10)
    );
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const markAsRead = (id: string) => {
    if (!db) return;
    const ref = doc(db, 'notifications', id);
    updateDocumentNonBlocking(ref, { read: true });
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-xl border bg-white hover:bg-muted/30 transition-colors shadow-sm focus:outline-none">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl border-none bg-white">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Notificaciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-2" />
        <div className="max-h-[350px] overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl cursor-default focus:bg-accent/50 ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex justify-between w-full">
                  <span className={`text-sm font-bold ${!n.read ? 'text-primary' : 'text-foreground'}`}>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {n.createdAt?.toDate ? format(n.createdAt.toDate(), 'HH:mm', { locale: es }) : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {n.message}
                </p>
                {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              No tienes notificaciones pendientes.
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
