"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  DollarSign,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface POI {
  name: string;
  category: string;
  rating: number;
  cost: number;
  time_required: number;
  description: string;
}

interface DayPlan {
  day: number;
  date: string;
  pois: POI[];
  total_cost: number;
  total_time: number;
}

interface ItineraryData {
  trip_summary: {
    total_days: number;
    total_destinations: number;
    total_cost: number;
  };
  daily_plans: DayPlan[];
}

interface TrainItineraryDisplayProps {
  itinerary: ItineraryData | null;
  onBack: () => void;
  isLoading?: boolean;
}

export default function TrainItineraryDisplay({
  itinerary,
  onBack,
  isLoading = false,
}: TrainItineraryDisplayProps) {
  const displayItinerary = itinerary || MOCK_ITINERARY;

  const [scrollPosition, setScrollPosition] = useState(0);
  const [isFlickerComplete, setIsFlickerComplete] = useState(false);
  const [flickerPosition, setFlickerPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trainRef = useRef<HTMLDivElement>(null);

  const totalCoaches = displayItinerary.daily_plans.length + 1; // +1 for engine
  const maxScroll = (totalCoaches - 1) * 100;

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setFlickerPosition((prev) => {
        if (prev >= 100) {
          clearInterval(flickerInterval);
          setTimeout(() => setIsFlickerComplete(true), 500);
          return 100;
        }
        return prev + 3;
      });
    }, 80);

    return () => clearInterval(flickerInterval);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const scrollSpeed = 15;
      const newPosition =
        scrollPosition + (e.deltaY > 0 ? scrollSpeed : -scrollSpeed);
      const clampedPosition = Math.max(0, Math.min(maxScroll, newPosition));

      setScrollPosition(clampedPosition);
    };

    const container = containerRef.current;
    if (container && isFlickerComplete) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [scrollPosition, maxScroll, isFlickerComplete]);

  if (isLoading || !isFlickerComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"></div>
        </div>

        <div className="relative w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Headlight beam with flicker effect */}
              <div
                className="absolute -left-40 top-1/2 transform -translate-y-1/2 h-8 bg-gradient-to-r from-yellow-300/90 via-yellow-200/70 to-transparent rounded-full transition-all duration-100"
                style={{
                  width: `${flickerPosition * 1.6}px`,
                  opacity:
                    flickerPosition < 100
                      ? 0.3 + Math.sin(flickerPosition * 0.3) * 0.4
                      : 0.9,
                  boxShadow:
                    flickerPosition > 50
                      ? "0 0 30px rgba(255, 255, 0, 0.5)"
                      : "none",
                }}
              />

              {/* Advanced bullet train engine */}
              <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 w-[500px] h-40 shadow-2xl">
                {/* Aerodynamic nose */}
                <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-blue-700 to-blue-600 transform skew-x-12 origin-left rounded-l-full"></div>

                {/* Main body */}
                <div className="absolute left-20 top-0 right-0 h-full bg-gradient-to-b from-blue-500 to-blue-700 rounded-r-lg">
                  {/* Namaste Jharkhand branding */}
                  <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
                    <h1 className="text-white font-bold text-4xl tracking-wider drop-shadow-lg">
                      Namaste Jharkhand
                    </h1>
                    <div className="text-blue-200 text-sm font-medium">
                      Express Journey
                    </div>
                  </div>

                  {/* Realistic windows */}
                  <div className="absolute right-12 top-8 grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-6 bg-slate-800/80 rounded border border-blue-300/50 backdrop-blur-sm"
                      ></div>
                    ))}
                  </div>

                  {/* Side details */}
                  <div className="absolute left-8 bottom-6 flex gap-4">
                    <div className="w-16 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-12 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>

                {/* Headlight */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-yellow-300 rounded-full border-2 border-yellow-500 shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full animate-pulse"></div>
                </div>

                {/* Wheels */}
                <div className="absolute -bottom-6 left-16 flex gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-slate-900 rounded-full border-4 border-slate-700 shadow-lg"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 text-white">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Preparing Your Jharkhand Journey
            </h2>
            <p className="text-slate-300 text-lg">
              The Namaste Jharkhand Express is arriving at the platform...
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Railway track */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500 to-transparent animate-pulse"></div>
        </div>
      </div>
    );
  }

  const renderEngine = () => (
    <div className="w-full h-screen flex items-center justify-center relative">
      {/* Continuous headlight beam */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-64 h-12 bg-gradient-to-r from-yellow-300/80 via-yellow-200/60 to-transparent rounded-full animate-pulse shadow-2xl"></div>

      {/* Advanced bullet train engine */}
      <div className="relative">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 w-[600px] h-48 shadow-2xl">
          {/* Aerodynamic nose */}
          <div className="absolute left-0 top-0 w-40 h-full bg-gradient-to-r from-blue-700 to-blue-600 transform skew-x-12 origin-left rounded-l-full shadow-inner"></div>

          {/* Main body */}
          <div className="absolute left-24 top-0 right-0 h-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-r-lg">
            {/* Namaste Jharkhand branding */}
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2">
              <h1 className="text-white font-bold text-5xl tracking-wider drop-shadow-2xl">
                Namaste Jharkhand
              </h1>
              <div className="text-blue-200 text-lg font-medium mt-1">
                Express Journey
              </div>
              <div className="text-blue-300 text-sm">Discover Jharkhand</div>
            </div>

            {/* Premium windows */}
            <div className="absolute right-16 top-12 grid grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-8 bg-slate-800/90 rounded-lg border-2 border-blue-300/60 backdrop-blur-sm shadow-inner"
                >
                  <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-900 rounded-md"></div>
                </div>
              ))}
            </div>

            {/* Side decorative elements */}
            <div className="absolute left-12 bottom-8 flex gap-6">
              <div className="w-20 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg"></div>
              <div className="w-16 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg"></div>
              <div className="w-12 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg"></div>
            </div>
          </div>

          {/* Headlight */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-yellow-300 rounded-full border-3 border-yellow-500 shadow-2xl">
            <div className="w-full h-full bg-gradient-radial from-yellow-200 via-yellow-300 to-yellow-400 rounded-full animate-pulse"></div>
          </div>

          {/* Advanced wheel system */}
          <div className="absolute -bottom-8 left-20 flex gap-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="relative">
                <div className="w-10 h-10 bg-slate-900 rounded-full border-4 border-slate-700 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full"></div>
                  <div className="absolute inset-2 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupling connector */}
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-8 h-6 bg-slate-600 rounded-r-lg shadow-lg border-2 border-slate-500"></div>
        </div>
      </div>
    </div>
  );

  const renderDayCoach = (dayPlan: DayPlan, index: number) => (
    <div className="w-full h-screen flex items-center justify-center px-12 relative">
      {/* Coupling connector left */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-6 bg-slate-600 rounded-l-lg shadow-lg border-2 border-slate-500"></div>

      <div className="relative max-w-5xl w-full">
        {/* Coach body */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700 rounded-2xl shadow-2xl border-4 border-emerald-800 p-10 min-h-[500px]">
          {/* Coach header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <Calendar className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-white font-bold text-4xl drop-shadow-lg">
                  Day {dayPlan.day}
                </h2>
                <p className="text-emerald-100 text-xl">
                  {new Date(dayPlan.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Enhanced summary stats */}
            <div className="flex gap-8 text-white">
              <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="h-6 w-6" />
                  <span className="font-bold text-2xl">
                    {Math.round(dayPlan.total_time)}h
                  </span>
                </div>
                <p className="text-emerald-100 font-medium">Duration</p>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 justify-center">
                  <DollarSign className="h-6 w-6" />
                  <span className="font-bold text-2xl">
                    ₹{dayPlan.total_cost}
                  </span>
                </div>
                <p className="text-emerald-100 font-medium">Total Cost</p>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 justify-center">
                  <MapPin className="h-6 w-6" />
                  <span className="font-bold text-2xl">
                    {dayPlan.pois.length}
                  </span>
                </div>
                <p className="text-emerald-100 font-medium">Places</p>
              </div>
            </div>
          </div>

          {/* Enhanced POIs grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dayPlan.pois.map((poi, poiIndex) => (
              <div
                key={poiIndex}
                className="bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-xl hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-white font-bold text-xl">{poi.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-300 bg-yellow-900/30 rounded-full px-3 py-1">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-semibold">{poi.rating}</span>
                  </div>
                </div>

                <p className="text-emerald-100 text-base mb-4 leading-relaxed">
                  {poi.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="bg-emerald-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    {poi.category}
                  </span>
                  <div className="flex items-center gap-4 text-emerald-100">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{poi.time_required}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">₹{poi.cost}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coach windows */}
          <div className="absolute top-6 right-6 grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-6 bg-slate-800/80 rounded-lg border-2 border-emerald-300/50 backdrop-blur-sm shadow-inner"
              ></div>
            ))}
          </div>
        </div>

        {/* Coupling connector right */}
        {index < displayItinerary.daily_plans.length - 1 && (
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-8 h-6 bg-slate-600 rounded-r-lg shadow-lg border-2 border-slate-500"></div>
        )}

        {/* Advanced wheel system */}
        <div className="absolute -bottom-8 left-12 flex gap-16">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative">
              <div className="w-10 h-10 bg-slate-900 rounded-full border-4 border-slate-700 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full"></div>
                <div className="absolute inset-2 bg-slate-600 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 overflow-hidden relative cursor-grab active:cursor-grabbing"
    >
      <div className="fixed top-6 right-6 z-50 bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 text-white border border-white/20">
        <div className="text-sm font-medium mb-2">Journey Progress</div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${(scrollPosition / maxScroll) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs">
            {Math.round((scrollPosition / maxScroll) * 100)}%
          </span>
        </div>
      </div>

      {/* Back button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 px-6 py-3 text-lg font-medium shadow-xl"
        >
          Plan New Journey
        </Button>
      </div>

      {/* Scroll instruction */}
      <div className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm border border-white/20">
        Scroll to move the train →
      </div>

      {/* Enhanced railway track */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-slate-400"></div>
      </div>

      <div className="relative w-full h-full">
        <div
          ref={trainRef}
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${scrollPosition}%)`,
            width: `${totalCoaches * 100}%`,
          }}
        >
          {/* Engine */}
          <div className="w-full flex-shrink-0">{renderEngine()}</div>

          {/* Day coaches */}
          {displayItinerary.daily_plans.map((dayPlan, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {renderDayCoach(dayPlan, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
