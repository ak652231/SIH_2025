"use client"
import type React from "react"
import { useEffect, useRef } from "react"
import { Users, Bot, Map, BadgeCheck, ShoppingBag, TrainFront } from "lucide-react"
import { Montserrat, Poppins } from "next/font/google"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
})

const ServiceCards: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-red-500" />,
      title: "AI Itinerary & Multilingual Chatbot",
      description: "Personalized trip plans and 24x7 assistance in multiple languages.",
    },
    {
      icon: <BadgeCheck className="h-8 w-8 text-red-500" />,
      title: "Verified Providers via Blockchain",
      description: "Secure bookings, guide verification, and digital certifications.",
    },
    {
      icon: <Map className="h-8 w-8 text-red-500" />,
      title: "Interactive Maps & AR/VR Previews",
      description: "Preview sites like Netarhat, Patratu, Betla, Hundru, and Deoghar.",
    },
    {
      icon: <TrainFront className="h-8 w-8 text-red-500" />,
      title: "Real-Time Transport & Geo-Info",
      description: "Live location, routes, and local travel updates.",
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-red-500" />,
      title: "Local Marketplace",
      description: "Discover handicrafts, homestays, cultural events, and eco-tours.",
    },
    {
      icon: <Users className="h-8 w-8 text-red-500" />,
      title: "Community & Analytics",
      description: "AI feedback loops and dashboards for tourism officials.",
    },
  ]

  useEffect(() => {
    const updateLines = () => {
      if (!svgRef.current) return

      const animatedPin = document.getElementById("main-location-pin")
      const cards = document.querySelectorAll(".feature-card")

      if (!animatedPin || cards.length < 1) return

      const pinRect = animatedPin.getBoundingClientRect()
      const svgRect = svgRef.current.getBoundingClientRect()

      const pinCenterX = pinRect.left + pinRect.width / 2 - svgRect.left
      const pinCenterY = pinRect.top + pinRect.height / 2 - svgRect.top

      const lines = svgRef.current.querySelectorAll("line")

      cards.forEach((card, index) => {
        if (index >= lines.length) return
        const cardRect = card.getBoundingClientRect()
        const cardTopX = cardRect.left + cardRect.width / 2 - svgRect.left
        const cardTopY = cardRect.top - svgRect.top + 6
        const line = lines[index] as SVGLineElement
        line.setAttribute("x1", cardTopX.toString())
        line.setAttribute("y1", cardTopY.toString())
        line.setAttribute("x2", pinCenterX.toString())
        line.setAttribute("y2", pinCenterY.toString())
      })
    }

    const setupPinObserver = () => {
      const animatedPin = document.getElementById("main-location-pin")
      if (!animatedPin) return

      setTimeout(updateLines, 500)

      const observer = new MutationObserver(() => {
        updateLines()
      })

      observer.observe(animatedPin, {
        attributes: true,
        attributeFilter: ["style"],
      })

      return observer
    }

    const observer = setupPinObserver()
    window.addEventListener("resize", updateLines)
    window.addEventListener("scroll", updateLines)

    const intervalId = setInterval(updateLines, 120)

    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", updateLines)
      window.removeEventListener("scroll", updateLines)
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div className={`relative w-full ${montserrat.variable} ${poppins.variable}`}>
      <h3 className="text-center font-poppins text-2xl font-bold text-red-600 mb-16 tracking-tight">
        <span className="text-black relative inline-block after:content-[''] after:absolute after:w-12 after:h-1 after:bg-red-500 after:bottom-[-8px] after:left-1/2 after:transform after:-translate-x-1/2">
          Key Features
        </span>
      </h3>

      <div className="relative flex justify-center items-center w-full">
        {/* Center section with pin landing spot */}
        <div className="relative mx-8 flex flex-col items-center justify-center">
          <div id="pin-landing-spot" className="relative h-16 w-16 z-20" />
          <div className="z-10">
            <span className="text-red-600 font-poppins font-bold text-xl tracking-wide">JharTour</span>
          </div>
        </div>
      </div>

      {/* Lines connecting cards to the pin */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
        {/* allocate enough lines for features */}
        {Array.from({ length: features.length }).map((_, i) => (
          <line key={i} stroke="#ff3a3a" strokeWidth="1" strokeDasharray="5,5" />
        ))}
      </svg>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mt-16">
        {features.map((feature, index) => (
          <div
            key={index}
            className="feature-card bg-white rounded-lg shadow-lg p-6 transform transition-all hover:scale-105 z-20 border-t-4 border-red-500"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-full shadow-md">{feature.icon}</div>
              <div>
                <h3 className="text-red-600 font-poppins font-bold text-lg mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-700 font-montserrat leading-relaxed text-[15px]">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServiceCards
