import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/data/mock-game";

interface GameChatProps {
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function GameChat({ messages, onSendMessage }: GameChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const getAuthorClassName = (isSystem: boolean, author: string) => {
    if (isSystem) {
      return "text-amber-400/80";
    }

    return author === "You" ? "text-amber-400" : "text-white/70";
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) {
      return;
    }

    onSendMessage?.(newMessage.trim());
    setNewMessage("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1 overflow-hidden" ref={scrollRef}>
        <div className="flex flex-col gap-1.5">
          <div className="p-3">
            {messages.map((msg) => (
              <div className="text-sm" key={msg.id}>
                <div className="flex items-baseline gap-1.5">
                  <span className="shrink-0 text-[10px] text-white/30">
                    {formatTime(msg.timestamp)}
                  </span>
                  <span
                    className={`shrink-0 font-semibold text-xs ${getAuthorClassName(msg.isSystem, msg.author)}`}
                  >
                    {msg.author}:
                  </span>
                  <span
                    className={`break-all text-xs ${
                      msg.isSystem ? "text-white/70" : "text-white/80"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <form
        className="flex gap-1.5 border-white/10 border-t p-2"
        onSubmit={handleSend}
      >
        <Input
          autoComplete="off"
          className="h-8 border-white/10 bg-zinc-800/80 text-white text-xs placeholder:text-white/30"
          id="chat-input"
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          value={newMessage}
        />
        <Button
          className="h-8 w-8 shrink-0 bg-zinc-700 text-white hover:bg-zinc-600"
          disabled={!newMessage.trim()}
          size="icon"
          type="submit"
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
