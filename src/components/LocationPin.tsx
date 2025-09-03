"use client"

import type React from "react"
import { useRef } from "react"
import Link from "next/link"

const LocationPin: React.FC = () => {
  const pinRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white">
      {/* Large Pin SVG */}
      <div id="main-location-pin" ref={pinRef} className="absolute z-10 transform-origin-center w-[1400px]">
        <svg viewBox="0 0 400 500" className="w-full h-auto">
          <path
            d="M200 0C89.5 0 0 89.5 0 200c0 110.5 200 300 200 300s200-189.5 200-300C400 89.5 310.5 0 200 0z"
            fill="#ff3a3a"
          />
          <circle cx="200" cy="180" r="80" fill="white" />
        </svg>
      </div>

      {/* Text with mix-blend-mode for automatic inversion */}
      <div className="absolute z-40 text-center pointer-events-none mix-blend-difference">
        <h1 className="dynamic-text text-6xl font-bold  mb-4">Explore Jharkhand</h1>
        <h1 className="text-6xl font-bold text-white mb-8 dynamic-text">Plan Smarter Trips</h1>

        {/* Buttons */}
        <div className="flex justify-center space-x-4 pointer-events-auto">
          <Link
            href="/report"
            className="dynamic-button text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition duration-300"
          >
            Plan Your Itinerary
          </Link>
          <Link
            href="/searchforsomeone"
            className="dyn-button bg-transparent border-2 border-white dynamic-text font-bold py-3 px-6 rounded-full  hover:text-black transition duration-300"
          >
            Explore Destinations
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LocationPin

