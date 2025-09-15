"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { FloatingChatButton } from "./floating-button"
import { TravelChatbox } from "./travel-chatbox"

interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const toggleChat = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setIsChatOpen(!isChatOpen)

    // Reset animation state after transition completes
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isChatOpen])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          "min-h-screen",
          isChatOpen ? "lg:mr-96 lg:scale-95" : "mr-0 scale-100",
        )}
      >
        {children}
      </div>

      {/* Chat overlay for mobile */}
      {isChatOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleChat} />}

      {/* Chatbox */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-in-out",
          "w-full sm:w-96 lg:w-96",
          isChatOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <TravelChatbox onClose={toggleChat} />
      </div>

      {/* Floating button */}
      <FloatingChatButton onClick={toggleChat} isOpen={isChatOpen} />
    </div>
  )
}
