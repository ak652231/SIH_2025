"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Clock, Car, Heart, Loader2, MapPin } from "lucide-react";

const STATIONS = [
  {
    id: "basics",
    name: "Journey Basics",
    icon: Clock,
    fields: ["num_days", "start_date", "budget"],
  },
  {
    id: "travel",
    name: "Travel Details",
    icon: Car,
    fields: ["transport_mode", "pace", "base_location"],
  },
  {
    id: "preferences",
    name: "Your Interests",
    icon: Heart,
    fields: ["interests", "must_visit"],
  },
  {
    id: "group",
    name: "Group Details",
    icon: Users,
    fields: ["family_trip", "accessibility_needs"],
  },
];

interface TravelPlanningFormProps {
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
}

export default function TravelPlanningForm({
  onSubmit,
  isLoading = false,
}: TravelPlanningFormProps) {
  const [currentStation, setCurrentStation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    num_days: "",
    budget: "",
    transport_mode: "",
    pace: "",
    base_location: "",
    base_location_name: "", // Added to store the display name
    base_location_lat: null, // Added to store latitude
    base_location_lng: null, // Added to store longitude
    interests: [],
    start_date: "",
    accessibility_needs: false,
    family_trip: false,
    must_visit: [],
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [recentLocationSearches, setRecentLocationSearches] = useState([]);
  const locationSuggestionRef = useRef(null);
  const locationSearchTimeoutRef = useRef(null);

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentLocationSearches");
    if (savedSearches) {
      try {
        setRecentLocationSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error("Error parsing saved searches", e);
      }
    }
  }, []);

  const saveToRecentSearches = (location) => {
    const updatedSearches = [
      location,
      ...recentLocationSearches.filter((item) => item.id !== location.id),
    ].slice(0, 5);
    setRecentLocationSearches(updatedSearches);
    localStorage.setItem(
      "recentLocationSearches",
      JSON.stringify(updatedSearches)
    );
  };

  const formatDisplayName = (item) => {
    const parts = [];

    if (item.address) {
      if (item.address.village) parts.push(item.address.village);
      else if (item.address.town) parts.push(item.address.town);
      else if (item.address.city) parts.push(item.address.city);
      else if (item.address.municipality) parts.push(item.address.municipality);

      if (
        item.address.state_district &&
        item.address.state_district !== parts[0]
      ) {
        parts.push(item.address.state_district);
      }

      if (item.address.state) parts.push(item.address.state);
    }

    return parts.length > 0 ? parts.join(", ") : item.display_name;
  };

  const fetchFromNominatim = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5&countrycodes=in`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "TravelPlanningApp/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.map((item) => ({
          id: `nom-${item.place_id}`,
          name: item.display_name,
          shortName: formatDisplayName(item),
          source: "nominatim",
          lat: Number.parseFloat(item.lat),
          lng: Number.parseFloat(item.lon),
        }));
      }
      return [];
    } catch (error) {
      console.error("Nominatim error:", error);
      return [];
    }
  };

  const fetchFromPhoton = async (query) => {
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          query
        )}&limit=5&lang=en&lat=20.5937&lon=78.9629`
      );

      if (response.ok) {
        const data = await response.json();
        return data.features.map((item) => ({
          id: `photon-${item.properties.osm_id}`,
          name: formatPhotonResult(item.properties),
          shortName: formatPhotonResult(item.properties, true),
          source: "photon",
          lat: item.geometry.coordinates[1],
          lng: item.geometry.coordinates[0],
        }));
      }
      return [];
    } catch (error) {
      console.error("Photon error:", error);
      return [];
    }
  };

  const formatPhotonResult = (props, short = false) => {
    const parts = [];

    if (props.name) {
      parts.push(props.name);
    }

    if (props.street && !short) {
      parts.push(props.street);
    }

    if (props.district) {
      parts.push(props.district);
    } else if (props.neighbourhood) {
      parts.push(props.neighbourhood);
    } else if (props.suburb) {
      parts.push(props.suburb);
    }

    if (props.city) {
      parts.push(props.city);
    } else if (props.town) {
      parts.push(props.town);
    } else if (props.village) {
      parts.push(props.village);
    }

    if (props.state) {
      parts.push(props.state);
    }

    return parts.join(", ");
  };

  const fetchLocationSuggestions = async (query) => {
    setIsLocationLoading(true);

    try {
      const [nominatimResults, photonResults] = await Promise.all([
        fetchFromNominatim(query),
        fetchFromPhoton(query),
      ]);

      const combinedResults = [];
      const addedNames = new Set();

      for (const result of nominatimResults) {
        if (!addedNames.has(result.shortName)) {
          combinedResults.push(result);
          addedNames.add(result.shortName);
        }
      }

      for (const result of photonResults) {
        if (!addedNames.has(result.shortName)) {
          combinedResults.push(result);
          addedNames.add(result.shortName);
        }
      }

      setLocationSuggestions(combinedResults);
      setShowLocationSuggestions(combinedResults.length > 0);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;

    updateField("base_location_name", value);

    if (locationSearchTimeoutRef.current) {
      clearTimeout(locationSearchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      setIsLocationLoading(true);
      locationSearchTimeoutRef.current = setTimeout(() => {
        fetchLocationSuggestions(value);
      }, 300);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      setIsLocationLoading(false);
    }
  };

  const handleLocationSuggestionClick = (suggestion) => {
    updateField("base_location_name", suggestion.shortName);
    updateField("base_location_lat", suggestion.lat);
    updateField("base_location_lng", suggestion.lng);
    setShowLocationSuggestions(false);
    saveToRecentSearches(suggestion);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStation = () => {
    if (currentStation < STATIONS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStation(currentStation + 1);
        setIsAnimating(false);
      }, 600);
    }
  };

  const prevStation = () => {
    if (currentStation > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStation(currentStation - 1);
        setIsAnimating(false);
      }, 600);
    }
  };

  const handleSubmit = () => {
    console.log("[v0] handleSubmit called, onSubmit type:", typeof onSubmit);
    if (typeof onSubmit !== "function") {
      console.error("[v0] onSubmit is not a function:", onSubmit);
      return;
    }

    const processedData = {
      ...formData,
      base_location:
        formData.base_location_lat && formData.base_location_lng
          ? [formData.base_location_lat, formData.base_location_lng]
          : [23.36, 85.33],
      num_days: Number.parseInt(formData.num_days) || 5,
      budget: Number.parseFloat(formData.budget) || 15000,
    };
    console.log("[v0] Calling onSubmit with data:", processedData);
    onSubmit(processedData);
  };

  const renderStationContent = () => {
    const station = STATIONS[currentStation];

    switch (station.id) {
      case "basics":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="num_days" className="text-lg font-medium">
                How many days is your journey?
              </Label>
              <Input
                id="num_days"
                type="number"
                placeholder="e.g., 3"
                value={formData.num_days}
                onChange={(e) => updateField("num_days", e.target.value)}
                className="mt-2 text-lg p-4"
              />
            </div>
            <div>
              <Label htmlFor="start_date" className="text-lg font-medium">
                When do you want to start?
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="mt-2 text-lg p-4"
              />
            </div>
            <div>
              <Label htmlFor="budget" className="text-lg font-medium">
                What's your budget? (₹)
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 10000"
                value={formData.budget}
                onChange={(e) => updateField("budget", e.target.value)}
                className="mt-2 text-lg p-4"
              />
            </div>
          </div>
        );

      case "travel":
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium">
                How will you travel?
              </Label>
              <Select
                value={formData.transport_mode}
                onValueChange={(value) => updateField("transport_mode", value)}
              >
                <SelectTrigger className="mt-2 text-lg p-4">
                  <SelectValue placeholder="Choose your transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">🚗 Car</SelectItem>
                  <SelectItem value="bus">🚌 Bus</SelectItem>
                  <SelectItem value="train">🚂 Train</SelectItem>
                  <SelectItem value="bike">🏍️ Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-lg font-medium">
                What's your travel pace?
              </Label>
              <Select
                value={formData.pace}
                onValueChange={(value) => updateField("pace", value)}
              >
                <SelectTrigger className="mt-2 text-lg p-4">
                  <SelectValue placeholder="Choose your pace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">🐌 Relaxed</SelectItem>
                  <SelectItem value="moderate">🚶 Moderate</SelectItem>
                  <SelectItem value="fast">🏃 Fast-paced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="base_location_name"
                className="text-lg font-medium"
              >
                Starting location
              </Label>
              <div className="relative mt-2" ref={locationSuggestionRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="base_location_name"
                  placeholder="Enter your starting location"
                  value={formData.base_location_name}
                  onChange={handleLocationChange}
                  className="text-lg p-4 pl-10 pr-10"
                  autoComplete="off"
                />

                {/* Loading indicator */}
                {isLocationLoading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showLocationSuggestions && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    {locationSuggestions.length > 0 ? (
                      locationSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="px-4 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-0"
                          onClick={() =>
                            handleLocationSuggestionClick(suggestion)
                          }
                        >
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-black text-sm font-medium">
                                {suggestion.shortName}
                              </div>
                              {suggestion.shortName !== suggestion.name && (
                                <div className="text-xs text-gray-500 truncate max-w-full">
                                  {suggestion.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-600">
                        No locations found. Try a different search term.
                      </div>
                    )}

                    {/* Recent searches section */}
                    {!isLocationLoading &&
                      locationSuggestions.length === 0 &&
                      recentLocationSearches.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                            RECENT SEARCHES
                          </div>
                          {recentLocationSearches.map((search) => (
                            <div
                              key={search.id}
                              className="px-4 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start"
                              onClick={() =>
                                handleLocationSuggestionClick(search)
                              }
                            >
                              <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                {search.shortName || search.name}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Start typing to see location suggestions
              </p>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">
                What interests you?
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "nature",
                  "culture",
                  "temple",
                  "adventure",
                  "food",
                  "history",
                ].map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField("interests", [
                            ...formData.interests,
                            interest,
                          ]);
                        } else {
                          updateField(
                            "interests",
                            formData.interests.filter((i) => i !== interest)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={interest} className="capitalize">
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-lg font-medium mb-4 block">
                Must-visit places
              </Label>
              <div className="grid grid-cols-1 gap-4">
                {[
                  "betla_np",
                  "bodh_gaya",
                  "ranchi",
                  "jamshedpur",
                  "deoghar",
                ].map((place) => (
                  <div key={place} className="flex items-center space-x-2">
                    <Checkbox
                      id={place}
                      checked={formData.must_visit.includes(place)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField("must_visit", [
                            ...formData.must_visit,
                            place,
                          ]);
                        } else {
                          updateField(
                            "must_visit",
                            formData.must_visit.filter((p) => p !== place)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={place} className="capitalize">
                      {place.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "group":
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="family_trip"
                checked={formData.family_trip}
                onCheckedChange={(checked) =>
                  updateField("family_trip", checked)
                }
              />
              <Label htmlFor="family_trip" className="text-lg">
                This is a family trip
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessibility_needs"
                checked={formData.accessibility_needs}
                onCheckedChange={(checked) =>
                  updateField("accessibility_needs", checked)
                }
              />
              <Label htmlFor="accessibility_needs" className="text-lg">
                We have accessibility needs
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between relative px-8">
          <div className="absolute top-1/2 left-8 right-8 h-8 -translate-y-1/2 z-0">
            <div className="w-full h-full bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-lg shadow-lg">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-600 to-transparent opacity-30 rounded-lg"></div>
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 -translate-y-1/2 shadow-sm">
                <div
                  className="absolute inset-0 bg-yellow-400"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, transparent 0px, transparent 8px, yellow 8px, yellow 16px)",
                  }}
                ></div>
              </div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white opacity-60"></div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white opacity-60"></div>
            </div>
          </div>

          {STATIONS.map((station, index) => {
            const Icon = station.icon;
            const isActive = index === currentStation;
            const isCompleted = index < currentStation;

            return (
              <div
                key={station.id}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`relative w-24 h-28 transition-all duration-300 ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-3 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg shadow-lg"></div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-18 bg-gradient-to-r from-gray-100 via-white to-gray-200 rounded-lg border-2 border-gray-300 shadow-xl">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-gray-200 to-transparent opacity-40 rounded-l-lg"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-gray-300 to-transparent opacity-40 rounded-r-lg"></div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-black font-bold">
                      <div className="text-[10px] leading-tight text-center px-1 mt-2">
                        {station.name.split(" ").map((word, i) => (
                          <div
                            key={i}
                            className="uppercase tracking-tight font-extrabold"
                          >
                            {word}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm font-black mt-1">{index}</div>
                      <div className="text-[8px] font-bold">KM</div>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-18 left-1/2 -translate-x-1/2 w-20 h-10 rounded-t-full border-2 transition-colors duration-300 shadow-lg ${
                      isActive
                        ? "bg-gradient-to-b from-yellow-300 to-yellow-500 border-yellow-600"
                        : isCompleted
                        ? "bg-gradient-to-b from-green-300 to-green-500 border-green-600"
                        : "bg-gradient-to-b from-yellow-300 to-yellow-500 border-yellow-600"
                    }`}
                  >
                    <div className="absolute top-2 left-4 right-8 h-4 bg-gradient-to-r from-white to-transparent opacity-40 rounded-t-full"></div>

                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                      <Icon size={16} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div
                    className={`absolute top-1/2 text-4xl transition-all duration-600 ease-in-out z-20 ${
                      isAnimating
                        ? `transform ${
                            currentStation < STATIONS.length - 1
                              ? "translate-x-32"
                              : "translate-x-0"
                          } scale-110`
                        : "scale-100"
                    }`}
                    style={{
                      left: "calc(100% + 1px)",
                      transform: "translateY(-50%) scaleX(-1)",
                      filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
                    }}
                  >
                    🚗
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-red-600 p-8 min-h-[400px]">
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const Icon = STATIONS[currentStation].icon;
            return <Icon className="text-red-600" size={32} />;
          })()}
          <h2 className="text-2xl font-bold text-gray-900">
            {STATIONS[currentStation].name}
          </h2>
        </div>

        {renderStationContent()}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          onClick={prevStation}
          disabled={currentStation === 0 || isAnimating || isLoading}
          variant="outline"
          className="px-6 py-3 bg-transparent"
        >
          ← Previous Milestone
        </Button>

        {currentStation === STATIONS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isAnimating || isLoading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planning Your Journey...
              </>
            ) : (
              "Start Your Journey! 🚗"
            )}
          </Button>
        ) : (
          <Button
            onClick={nextStation}
            disabled={isAnimating || isLoading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700"
          >
            Next Milestone →
          </Button>
        )}
      </div>
    </div>
  );
}