import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatIdPage({ params }: { params: { chatId: string } }) {
  // Pass the ID to the client-rendered ChatWindow
  return <ChatWindow chatId={params.chatId} />;
}
