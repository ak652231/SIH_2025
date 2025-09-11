"use client";

import type React from "react";
import { useRef } from "react";
import Link from "next/link";

const LocationPin: React.FC = () => {
  const pinRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Large Pin SVG with modern gradient */}
      <div
        id="main-location-pin"
        ref={pinRef}
        className="absolute z-10 transform-origin-center w-[1400px] drop-shadow-2xl"
      >
        <svg viewBox="0 0 400 500" className="w-full h-auto">
          <defs>
            <linearGradient
              id="pinGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <filter id="pinShadow">
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="12"
                floodColor="#000000"
                floodOpacity="0.3"
              />
            </filter>
          </defs>
          <path
            d="M200 0C89.5 0 0 89.5 0 200c0 110.5 200 300 200 300s200-189.5 200-300C400 89.5 310.5 0 200 0z"
            fill="url(#pinGradient)"
            filter="url(#pinShadow)"
          />
          <circle cx="200" cy="180" r="80" fill="white" opacity="0.95" />
          <circle cx="200" cy="180" r="60" fill="#f0fdf4" />
        </svg>
      </div>

      <div className="absolute z-40 text-center pointer-events-none">
        <h1 className="text-6xl font-bold text-black mb-2 text-balance">
          Explore Jharkhand
        </h1>
        <h2 className="text-4xl font-semibold text-black mb-8 text-balance">
          Plan Smarter Trips
        </h2>

        <div className="flex justify-center space-x-6 pointer-events-auto">
          <Link
            href="/itinerary"
            className="bg-emerald-600 text-white font-bold py-4 px-8 rounded-full hover:bg-emerald-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Plan Your Itinerary
          </Link>
          <Link
            href="/searchforsomeone"
            className="bg-white border-2 border-emerald-600 text-emerald-700 font-bold py-4 px-8 rounded-full hover:bg-emerald-50 hover:border-emerald-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Explore Destinations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LocationPin;
