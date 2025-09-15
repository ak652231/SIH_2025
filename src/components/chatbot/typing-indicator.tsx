"use client"

import { useState, useEffect } from "react"
import { Compass, Mountain, Waves } from "lucide-react"

const travelIcons = [Compass, Mountain, Waves]

export function TypingIndicator() {
  const [currentIcon, setCurrentIcon] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % travelIcons.length)
    }, 800)

    return () => clearInterval(interval)
  }, [])

  const CurrentIcon = travelIcons[currentIcon]

  return (
    <div className="flex items-center space-x-2 text-emerald-600">
      <CurrentIcon className="w-4 h-4 animate-spin" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span className="text-sm text-gray-600">Exploring...</span>
    </div>
  )
}
