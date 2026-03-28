"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useChatStore } from "@/lib/store/chat.store"
import { Loader2, Sparkles } from "lucide-react"

export default function ChatRootPage() {
  const router = useRouter()
  const { setChats, clearActiveChat } = useChatStore()
  
  React.useEffect(() => {
    let mounted = true;
    
    const resolveChat = async () => {
      try {
        const res = await api.get('/chats')
        const userChats = res.data.data.chats || []
        
        if (!mounted) return;
        
        if (userChats.length > 0) {
          router.replace(`/chat/${userChats[0].id}`)
        } else {
          const newRes = await api.post('/chats', { title: 'New Chat' })
          if (mounted) {
            setChats([newRes.data.data.chat])
            clearActiveChat()
            router.replace(`/chat/${newRes.data.data.chat.id}`)
          }
        }
      } catch (err) {
        console.error("Failed to resolve initial chat", err)
      }
    }
    
    // Redirect to last chat if exists, else create new
    resolveChat()
    return () => { mounted = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center animate-pulse-slow">
         <Sparkles className="w-10 h-10 text-indigo-400/50 mb-4" />
         <div className="flex items-center text-white/40 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Initializing secure context...</span>
         </div>
      </div>
    </div>
  )
}
