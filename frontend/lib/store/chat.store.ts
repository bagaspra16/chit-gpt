import { create } from "zustand";

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  isStreaming: boolean;
  abortController: AbortController | null;
  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  removeChat: (id: string) => void;
  updateChatTitle: (id: string, title: string) => void;
  setActiveChat: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateLastMessage: (content: string) => void;
  replaceLastMessage: (msg: Message) => void;
  setIsStreaming: (status: boolean) => void;
  setAbortController: (ctrl: AbortController | null) => void;
  clearActiveChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  isStreaming: false,
  abortController: null,

  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((s) => ({ chats: [chat, ...s.chats] })),
  removeChat: (id) =>
    set((s) => ({ chats: s.chats.filter((c) => c.id !== id) })),
  updateChatTitle: (id, title) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)),
    })),
  setActiveChat: (id) => set({ activeChatId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: msgs[msgs.length - 1].content + content,
        };
      }
      return { messages: msgs };
    }),
  replaceLastMessage: (msg) =>
    set((s) => {
      const msgs = [...s.messages];
      if (msgs.length > 0) msgs[msgs.length - 1] = msg;
      return { messages: msgs };
    }),
  setIsStreaming: (status) => set({ isStreaming: status }),
  setAbortController: (ctrl) => set({ abortController: ctrl }),
  clearActiveChat: () =>
    set({
      activeChatId: null,
      messages: [],
      isStreaming: false,
      abortController: null,
    }),
}));
