"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FloatingChatButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full",
        "bg-gradient-to-br from-emerald-500 to-teal-600",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "flex items-center justify-center",
        "transform hover:scale-110 active:scale-95",
        isOpen && "rotate-45",
      )}
      aria-label="Open Jharkhand Travel Guide Chat"
    >
      <div className={cn("relative w-8 h-8 transition-transform duration-300", isHovered && "scale-110")}>
        <Image
          src="/images/chatbot-icon.png"
          alt="Chatbot"
          width={32}
          height={32}
          className="filter brightness-0 invert"
        />
      </div>

      {/* Pulse animation when not open */}
      {!isOpen && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />}

      {/* Tooltip */}
      <div
        className={cn(
          "absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg",
          "opacity-0 pointer-events-none transition-opacity duration-200",
          "whitespace-nowrap",
          isHovered && !isOpen && "opacity-100",
        )}
      >
        Jharkhand Travel Guide
        <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45 transform -translate-y-1/2" />
      </div>
    </button>
  )
}
