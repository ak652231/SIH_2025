"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  IndianRupee,
  Calendar,
  ArrowLeft,
  Star,
} from "lucide-react";
import type { float } from "some-module"; // Declare or import the float variable

interface POI {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  categories: string[];
  duration: number;
  popularity: float;
  open_time: number;
  close_time: number;
  cost: number;
  nearest_station_id?: string;
  description: string;
  rating: number;
  review_count: number;
  accessibility_score: number;
  family_friendly: boolean;
  best_time_to_visit?: string[];
}

interface ScheduleItem {
  poi?: POI;
  arrival_time?: string;
  start_time?: string;
  end_time?: string;
  visit_cost?: number;
  travel_cost?: number;
  travel_time?: number;
  travel_details?: string[];
  action?: string;
  details?: string; // Added for arrival action details
}

interface ItineraryDay {
  day_number: number;
  date: string;
  pois: ScheduleItem[];
  total_cost: number;
  total_travel_time: number;
  total_visit_time: number;
  overnight_location: string;
}

interface TripPlan {
  days: ItineraryDay[];
  total_cost: number;
  total_pois: number;
  user_preferences: any;
  generated_at: string;
}

interface ItineraryDisplayProps {
  itinerary: TripPlan;
  onBack: () => void;
}

export default function ItineraryDisplay({
  itinerary,
  onBack,
}: ItineraryDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getActualTransportMode = (travelDetails: string[]) => {
    if (!travelDetails || travelDetails.length === 0) return "car";

    const details = travelDetails.join(" ").toLowerCase();
    if (details.includes("train") || details.includes("board at"))
      return "train";
    if (details.includes("bus")) return "bus";
    if (details.includes("auto")) return "auto";
    if (details.includes("bike")) return "bike";
    if (details.includes("drive") || details.includes("car")) return "car";

    return "car"; // default fallback
  };

  const getTransportIcon = (mode: string) => {
    const icons = {
      car: "🚗",
      bus: "🚌",
      train: "🚂",
      auto: "🛺",
      bike: "🏍️",
    };
    return icons[mode as keyof typeof icons] || "🚗";
  };

  const calculateTravelTime = (endTime: string, startTime: string) => {
    const end = new Date(`2024-01-01 ${endTime}`);
    const start = new Date(`2024-01-01 ${startTime}`);
    const diffMs = start.getTime() - end.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? diffMinutes : 0;
  };

  const estimateDistance = (
    travelTimeMinutes: number,
    transportMode: string
  ) => {
    const speedKmh = {
      car: 50,
      bus: 35,
      train: 70,
      bike: 25,
      auto: 30,
    };
    const speed = speedKmh[transportMode as keyof typeof speedKmh] || 50;
    const hours = travelTimeMinutes / 60;
    return Math.round(hours * speed);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-4 bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Plan Another Trip
        </Button>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Jharkhand Adventure
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {itinerary.days.length} days • {itinerary.total_pois} destinations •{" "}
            {formatCurrency(itinerary.total_cost)}
          </p>

          {/* Trip Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">
                  {itinerary.days.length}
                </div>
                <div className="text-sm text-gray-600">Days</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{itinerary.total_pois}</div>
                <div className="text-sm text-gray-600">Destinations</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <IndianRupee className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">
                  {formatCurrency(itinerary.total_cost)}
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Daily Itinerary */}
      <div className="space-y-8">
        {itinerary.days.map((day) => (
          <Card key={day.day_number} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                    {day.day_number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Day {day.day_number}</h3>
                    <p className="text-sm text-gray-600 font-normal">
                      {formatDate(day.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(day.total_cost)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    📍 {day.overnight_location}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {day.pois.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No destinations planned for this day</p>
                  <p className="text-sm">
                    Consider adding more places to visit or extending your stay
                    at previous locations
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {day.pois.map((item, index) => {
                    if (item.action) {
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {item.action.includes("Travel")
                              ? "🚗"
                              : item.action.includes("Departure")
                              ? "✈️"
                              : item.action.includes("Arrival")
                              ? "🏨"
                              : "🏠"}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.action}</h4>
                            {item.travel_details && (
                              <div className="text-sm text-gray-600 mt-1">
                                {item.travel_details.map((detail, i) => (
                                  <div key={i}>{detail}</div>
                                ))}
                              </div>
                            )}
                            {(item as any).details && (
                              <div className="text-sm text-gray-600 mt-1">
                                {(item as any).details}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (!item.poi) return null;

                    const previousItem = index > 0 ? day.pois[index - 1] : null;
                    const showTravelSegment =
                      previousItem &&
                      previousItem.poi &&
                      previousItem.end_time &&
                      item.start_time;
                    const travelTime = showTravelSegment
                      ? calculateTravelTime(
                          previousItem.end_time!,
                          item.start_time!
                        )
                      : 0;

                    const actualTransportMode = getActualTransportMode(
                      item.travel_details || []
                    );
                    const distance = showTravelSegment
                      ? estimateDistance(travelTime, actualTransportMode)
                      : 0;

                    return (
                      <div key={index}>
                        {/* {showTravelSegment && travelTime > 0 && (
                          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                              {getTransportIcon(actualTransportMode)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="font-medium text-blue-800">
                                  Travel by {actualTransportMode}
                                </div>
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {Math.floor(travelTime / 60)}h{" "}
                                    {travelTime % 60}m
                                  </span>
                                </div>
                                <div className="text-blue-600">
                                  ~{distance} km
                                </div>
                                <div className="text-blue-600">
                                  {previousItem.end_time} → {item.start_time}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}  */}

                        <div className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl">
                            {item.poi.categories.includes("temple")
                              ? "🛕"
                              : item.poi.categories.includes("nature")
                              ? "🌿"
                              : item.poi.categories.includes("waterfall")
                              ? "💧"
                              : item.poi.categories.includes("history")
                              ? "🏛️"
                              : "📍"}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {item.poi.name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.poi.description}
                                </p>

                                {/* Categories */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.poi.categories.map((category) => (
                                    <Badge
                                      key={category}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {category}
                                    </Badge>
                                  ))}
                                </div>

                                {/* Rating */}
                                {item.poi.rating > 0 && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span>{item.poi.rating}</span>
                                    <span>
                                      ({item.poi.review_count} reviews)
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {formatCurrency(item.visit_cost || 0)}
                                </div>
                                {item.travel_cost && (
                                  <div className="text-sm text-gray-500">
                                    +{formatCurrency(item.travel_cost)} travel
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timing and Travel Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {item.start_time} - {item.end_time}
                                  </span>
                                </div>
                                {item.arrival_time && (
                                  <div>Arrive: {item.arrival_time}</div>
                                )}
                                <div>
                                  Duration:{" "}
                                  {Math.floor((item.poi.duration || 0) / 60)}h{" "}
                                  {(item.poi.duration || 0) % 60}m
                                </div>
                              </div>

                              {item.travel_details &&
                                item.travel_details.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                      Travel Instructions:
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {item.travel_details.map((detail, i) => (
                                        <div
                                          key={i}
                                          className={
                                            detail.includes(
                                              "No suitable train found"
                                            )
                                              ? "text-amber-600 font-medium"
                                              : ""
                                          }
                                        >
                                          {detail}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Day Summary */}
              <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-700">
                      Total Cost
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(day.total_cost)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">
                      Travel Time
                    </div>
                    <div className="text-lg">
                      {Math.floor(day.total_travel_time / 60)}h{" "}
                      {day.total_travel_time % 60}m
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">
                      Visit Time
                    </div>
                    <div className="text-lg">
                      {Math.floor(day.total_visit_time / 60)}h{" "}
                      {day.total_visit_time % 60}m
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Places</div>
                    <div className="text-lg">
                      {day.pois.filter((p) => p.poi).length}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <Card className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">Have an Amazing Trip! 🎉</h3>
            <p className="text-gray-600 mb-4">
              Your personalized itinerary is ready. Don't forget to check
              weather conditions and opening hours before visiting.
            </p>
            <Button onClick={onBack} className="bg-red-600 hover:bg-red-700">
              Plan Another Adventure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
