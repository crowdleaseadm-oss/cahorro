"use client"

import React from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WhatsAppFloat() {
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <a 
        href="https://wa.me/542235194889" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl shadow-green-500/40 border-4 border-white transition-all hover:scale-110 active:scale-95"
        >
          <MessageCircle className="h-7 w-7 text-white fill-white" />
        </Button>
      </a>
      <div className="absolute -top-12 right-0 bg-white px-4 py-2 rounded-2xl shadow-xl border border-border text-xs font-bold whitespace-nowrap animate-bounce pointer-events-none">
        ¿Necesitas ayuda? 👋
        <div className="absolute -bottom-1 right-6 w-3 h-3 bg-white border-r border-b border-border rotate-45" />
      </div>
    </div>
  )
}
