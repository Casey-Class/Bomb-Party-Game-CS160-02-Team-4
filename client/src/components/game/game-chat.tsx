import { useState, useRef, useEffect } from "react"
import { type ChatMessage } from "@/data/mock-game"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

interface GameChatProps {
  messages: ChatMessage[]
  onSendMessage?: (message: string) => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function GameChat({ messages, onSendMessage }: GameChatProps) {
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    onSendMessage?.(newMessage.trim())
    setNewMessage("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea
        ref={scrollRef}
        className="min-h-0 flex-1"
      >
        <div className="flex flex-col gap-1.5">
          <div className="p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm ${msg.isSystem ? "text-center" : ""}`}
              >
                {msg.isSystem ? (
                  <span className="text-amber-400/70 text-xs italic">
                    {msg.text}
                  </span>
                ) : (
                  <div className="flex gap-1.5 items-baseline">
                    <span className="text-white/30 text-[10px] shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                    <span
                      className={`font-semibold text-xs shrink-0 ${
                        msg.author === "You"
                          ? "text-amber-400"
                          : "text-white/70"
                      }`}
                    >
                      {msg.author}:
                    </span>
                    <span className="text-white/80 text-xs break-all">
                      {msg.text}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSend}
        className="flex gap-1.5 border-t border-white/10 p-2"
      >
        <Input
          id="chat-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="bg-zinc-800/80 border-white/10 text-white placeholder:text-white/30 text-xs h-8"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newMessage.trim()}
          className="h-8 w-8 bg-zinc-700 hover:bg-zinc-600 text-white shrink-0"
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  )
}
