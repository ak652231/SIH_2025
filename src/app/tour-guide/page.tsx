"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Phone, Globe, Loader } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Tour {
  id: string;
  tourTitle: string;
  locationsAreas: string[];
  meetingPoint: {
    address: string;
    lat: number;
    lng: number;
  };
  duration: string;
  tourCategory: string;
  tourDescription: string;
  highlights: string[];
  pricePerPerson: number;
  minGroupSize: number;
  maxGroupSize: number;
  tourPhotos: string[];
  whatsIncluded: string[];
  whatsNotIncluded: string[];
  cancellationPolicy: string;
  safetyNotes: string;
  availability: string[];
  specialNotes: string;
  tourGuideId: string;
  tourGuideName: string;
  tourGuidePhone: string;
  languagesSpoken: string[];
  createdAt: any;
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const toursCollection = collection(db, "tours");
        const toursSnapshot = await getDocs(toursCollection);
        const toursData = toursSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Tour[];

        // Sort by creation date (newest first)
        toursData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setTours(toursData);
      } catch (error) {
        console.error("Error fetching tours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const categories = [
    "all",
    "adventure",
    "cultural",
    "historical",
    "nature",
    "food",
    "photography",
    "spiritual",
  ];

  const filteredTours =
    selectedCategory === "all"
      ? tours
      : tours.filter(
          (tour) => tour.tourCategory?.toLowerCase() === selectedCategory
        );

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-medium">
            Loading amazing tours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-emerald-900 mb-2">
              Discover Amazing Tours
            </h1>
            <p className="text-emerald-700 text-lg">
              Explore unique experiences with local tour guides
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`capitalize ${
                  selectedCategory === category
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {category === "all" ? "All Tours" : category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-emerald-600 mb-4">
              <Globe className="h-16 w-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">
              No tours found
            </h3>
            <p className="text-emerald-600">
              {selectedCategory === "all"
                ? "No tours are currently available."
                : `No ${selectedCategory} tours are currently available.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTours.map((tour) => (
              <Link key={tour.id} href={`/tour/${tour.id}`}>
                <Card className="group cursor-pointer h-full bg-white/80 backdrop-blur-sm border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Tour Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    {tour.tourPhotos && tour.tourPhotos.length > 0 ? (
                      <img
                        src={tour.tourPhotos[0] || "/placeholder.svg"}
                        alt={tour.tourTitle}
                        // fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-emerald-400" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white capitalize">
                        {tour.tourCategory}
                      </Badge>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-emerald-900 font-bold">
                        ₹{tour.pricePerPerson}/person
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-emerald-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {tour.tourTitle}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Location */}
                    <div className="flex items-center text-sm text-emerald-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {/* CHECK IF IT'S A STRING, THEN SPLIT. OTHERWISE, JOIN. */}
                        {typeof tour.locationsAreas === "string"
                          ? tour.locationsAreas
                          : tour.locationsAreas?.join(", ") ||
                            tour.meetingPoint?.address}
                      </span>
                    </div>

                    {/* Duration & Group Size */}
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{tour.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>
                          {tour.minGroupSize}-{tour.maxGroupSize} people
                        </span>
                      </div>
                    </div>

                    {/* Tour Guide */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-emerald-700">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-semibold text-emerald-700">
                            {tour.tourGuideName?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">
                          {tour.tourGuideName}
                        </span>
                      </div>
                      <div className="flex items-center text-emerald-600">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="text-xs">{tour.tourGuidePhone}</span>
                      </div>
                    </div>

                    {/* Languages */}

                    {(() => {
                      // First, ensure we have an array to work with
                      const languages = Array.isArray(tour.languagesSpoken)
                        ? tour.languagesSpoken
                        : typeof tour.languagesSpoken === "string"
                        ? tour.languagesSpoken
                            .split(",")
                            .map((lang) => lang.trim())
                        : [];

                      if (languages.length === 0) return null;

                      return (
                        <div className="flex flex-wrap gap-1">
                          {languages.slice(0, 3).map((language, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs border-emerald-200 text-emerald-700"
                            >
                              {language}
                            </Badge>
                          ))}
                          {languages.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-200 text-emerald-700"
                            >
                              +{languages.length - 3} more
                            </Badge>
                          )}
                        </div>
                      );
                    })()}

                    {/* Description Preview */}
                    <p className="text-sm text-emerald-600 line-clamp-2">
                      {tour.tourDescription}
                    </p>

                    {/* View Details Button */}
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:bg-emerald-700 transition-colors">
                      View Details & Book
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
