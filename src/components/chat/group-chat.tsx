
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, ShieldAlert } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GroupChatProps {
  circleId: string;
  orderNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupChat({ circleId, orderNumber, open, onOpenChange }: GroupChatProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !circleId) return null;
    return query(
      collection(db, 'saving_circles', circleId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, circleId]);

  const { data: messages, isLoading } = useCollection(messagesQuery);

  const sortedMessages = messages?.slice().reverse() || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !message.trim() || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'saving_circles', circleId, 'messages'), {
        text: message.trim(),
        senderId: user.uid,
        senderOrder: orderNumber,
        createdAt: serverTimestamp(),
      });
      setMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] h-[600px] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Chat del Grupo</DialogTitle>
              <DialogDescription className="text-white/60 text-xs">
                Participando como: <b className="text-secondary tracking-widest">AHORRISTA #{(orderNumber || 0).toString().padStart(2, '0')}</b>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-accent/5">
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-4">
              {/* SECURITY WARNING */}
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex items-start gap-3 mb-6">
                <ShieldAlert className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-800 font-medium leading-normal">
                  <b>Recomendación de Seguridad:</b> Por la seguridad de todos los participantes, evitá compartir datos personales (teléfonos, emails o direcciones) en este chat.
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
              ) : sortedMessages.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground text-sm italic">
                  No hay mensajes aún. ¡Sé el primero en saludar!
                </div>
              ) : (
                sortedMessages.map((msg: any, i) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1">
                        {isMe ? 'VOS' : `AHORRISTA #${(msg.senderOrder || 0).toString().padStart(2, '0')}`}
                      </span>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-foreground rounded-tl-none border border-border/50'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-muted-foreground/50 mt-1">
                        {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm', { locale: es }) : '...'}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-border/50 flex gap-2 items-center shrink-0">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="rounded-xl border-accent/20 h-11 focus-visible:ring-primary shadow-none"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20 shrink-0"
            disabled={!message.trim() || isSending}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
