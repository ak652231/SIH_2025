"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, X, MapPin, Compass, Mountain, Waves, TreePine, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TypingIndicator } from "./typing-indicator"
import { SohraiPattern, KohbarPattern } from "./cultural-patterns"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface TravelChatboxProps {
  onClose: () => void
}

const quickSuggestions = [
  { text: "Top waterfalls", icon: Waves, color: "from-blue-500 to-cyan-500" },
  { text: "Best trekking spots", icon: Mountain, color: "from-green-600 to-emerald-600" },
  { text: "Tribal festivals", icon: Compass, color: "from-orange-500 to-red-500" },
  { text: "Local cuisines", icon: MapPin, color: "from-purple-500 to-pink-500" },
  { text: "Wildlife sanctuaries", icon: TreePine, color: "from-green-500 to-teal-500" },
  { text: "Photography spots", icon: Camera, color: "from-indigo-500 to-blue-500" },
]

export function TravelChatbox({ onClose }: TravelChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "🙏 Namaste! I'm your Jharkhand Travel Guide. I can help you discover the beautiful waterfalls, rich tribal culture, wildlife sanctuaries, and hidden gems of Jharkhand. What would you like to explore today?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process that request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      }

      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      }, 1200) // Simulate realistic typing delay
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please try again in a moment. 🔄",
        isUser: false,
        timestamp: new Date(),
      }

      setTimeout(() => {
        setMessages((prev) => [...prev, errorMessage])
        setIsTyping(false)
      }, 1000)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="h-full bg-gradient-to-b from-emerald-50 via-teal-50 to-green-50 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <SohraiPattern className="absolute top-10 left-10 w-32 h-32 text-emerald-600" />
        <KohbarPattern className="absolute top-32 right-16 w-24 h-24 text-teal-500" />
        <SohraiPattern className="absolute bottom-32 left-8 w-28 h-28 text-green-600" />
        <KohbarPattern className="absolute bottom-16 right-12 w-20 h-20 text-emerald-500" />

        {/* Additional decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-emerald-300/20 rounded-full animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-12 h-12 border border-teal-400/20 rotate-45 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header with enhanced cultural design */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white p-4 flex items-center justify-between relative z-10 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: "8s" }} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Jharkhand Travel Guide</h3>
            <p className="text-emerald-100 text-sm flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Your cultural & nature companion
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:rotate-90"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages with enhanced styling */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 relative z-10">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={message.id} className={cn("flex", message.isUser ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative",
                  "animate-in slide-in-from-bottom-2 duration-300",
                  message.isUser
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md shadow-emerald-200"
                    : "bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-md border border-emerald-100 shadow-lg",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {!message.isUser && (
                  <div className="absolute -left-2 top-3 w-4 h-4 bg-white/90 border-l border-b border-emerald-100 rotate-45"></div>
                )}
                {message.isUser && (
                  <div className="absolute -right-2 top-3 w-4 h-4 bg-gradient-to-r from-emerald-600 to-teal-600 rotate-45"></div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={cn("text-xs mt-2 opacity-70", message.isUser ? "text-emerald-100" : "text-gray-500")}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 shadow-lg border border-emerald-100 relative animate-in slide-in-from-bottom-2">
                <div className="absolute -left-2 top-3 w-4 h-4 bg-white/90 border-l border-b border-emerald-100 rotate-45"></div>
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-emerald-100 bg-white/70 backdrop-blur-sm relative z-10">
        <p className="text-sm text-gray-700 mb-3 font-semibold flex items-center">
          <Compass className="w-4 h-4 mr-2 text-emerald-600" />
          Explore Jharkhand:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {quickSuggestions.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion.text)}
                className={cn(
                  "text-xs bg-gradient-to-r hover:scale-105 transition-all duration-200",
                  "border-emerald-200 text-emerald-800 hover:text-white shadow-sm",
                  `hover:${suggestion.color}`,
                )}
              >
                <Icon className="w-3 h-3 mr-1" />
                {suggestion.text}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Enhanced input section */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white/80 backdrop-blur-sm border-t border-emerald-100 relative z-10"
      >
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about Jharkhand's wonders..."
            className="flex-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-white/90 backdrop-blur-sm"
            disabled={isTyping}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-emerald-200 transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
