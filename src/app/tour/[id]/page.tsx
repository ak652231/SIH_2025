"use client";

import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Star,
  Shield,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TourDetailPage = ({ params }) => {
  const router = useRouter();
  const [tour, setTour] = useState(null);
  const [tourGuide, setTourGuide] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Haversine distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        () => {
          setUserLocation({ lat: 23.3441, lng: 85.3096 }); // Ranchi default
        }
      );
    } else {
      setUserLocation({ lat: 23.3441, lng: 85.3096 });
    }
  };

  // Fetch tour details
  const fetchTourDetails = async () => {
    try {
      const tourDoc = await getDoc(doc(db, "tours", params.id));

      if (tourDoc.exists()) {
        const tourData = tourDoc.data();
        setTour({ id: tourDoc.id, ...tourData });

        // Fetch tour guide details
        const tourGuideQuery = query(
          collection(db, "users"),
          where("uid", "==", tourData.tourGuideId)
        );
        const tourGuideSnapshot = await getDocs(tourGuideQuery);

        if (!tourGuideSnapshot.empty) {
          const tourGuideData = tourGuideSnapshot.docs[0].data();
          setTourGuide(tourGuideData);

          if (userLocation && tourData.lat && tourData.lng) {
            const dist = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              tourData.lat,
              tourData.lng
            );
            setDistance(dist);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tour details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchTourDetails();
    }
  }, [params.id, userLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">
            Loading tour details...
          </p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            <User className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 mb-3">
              Tour not found
            </h2>
            <p className="text-emerald-600 mb-6">
              The tour you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/tour-guide")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to tours
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = tour.tourPhotos || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="bg-white/90 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/tour-guide")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to tours
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            {images.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
                <div className="relative h-[500px] group">
                  <img
                    src={images[currentImageIndex] || "/placeholder.svg"}
                    alt={tour.tourTitle}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) => (prev - 1 + images.length) % images.length
                          )
                        }
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-6 h-6 text-emerald-600" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) => (prev + 1) % images.length
                          )
                        }
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-6 h-6 text-emerald-600" />
                      </button>
                    </>
                  )}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-6">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all duration-200 ${
                            index === currentImageIndex
                              ? "border-emerald-500 shadow-lg scale-105"
                              : "border-emerald-200 hover:border-emerald-300"
                          }`}
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`${tour.tourTitle} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <User className="w-20 h-20 text-emerald-300 mx-auto mb-4" />
                  <p className="text-emerald-600 font-medium">
                    No images available
                  </p>
                </div>
              </div>
            )}

            {/* Tour Details Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h2 className="text-2xl font-bold text-emerald-800 mb-6">
                Tour Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    <p className="font-semibold text-emerald-800">Duration</p>
                  </div>
                  <p className="text-emerald-700 text-lg">{tour.duration}</p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-emerald-600" />
                    <p className="font-semibold text-emerald-800">Group Size</p>
                  </div>
                  <p className="text-emerald-700 text-lg">
                    {tour.minGroupSize
                      ? `${tour.minGroupSize} - ${tour.maxGroupSize}`
                      : `Up to ${tour.maxGroupSize}`}{" "}
                    people
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                    <p className="font-semibold text-emerald-800">
                      Areas Covered
                    </p>
                  </div>
                  <p className="text-emerald-700 text-lg">
                    {tour.locationsAreas}
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-6 h-6 text-emerald-600" />
                    <p className="font-semibold text-emerald-800">Category</p>
                  </div>
                  <p className="text-emerald-700 text-lg capitalize">
                    {tour.tourCategory}
                  </p>
                </div>
              </div>

              {tour.highlights && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-emerald-800 mb-4">
                    Highlights
                  </h3>
                  <div className="bg-emerald-50 rounded-2xl p-6">
                    <p className="text-emerald-700 leading-relaxed whitespace-pre-line">
                      {tour.highlights}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tour.whatsIncluded && (
                  <div>
                    <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      What's Included
                    </h3>
                    <div className="bg-emerald-50 rounded-2xl p-6">
                      <p className="text-emerald-700 leading-relaxed whitespace-pre-line">
                        {tour.whatsIncluded}
                      </p>
                    </div>
                  </div>
                )}

                {tour.whatsNotIncluded && (
                  <div>
                    <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-emerald-600" />
                      What's Not Included
                    </h3>
                    <div className="bg-emerald-50 rounded-2xl p-6">
                      <p className="text-emerald-700 leading-relaxed whitespace-pre-line">
                        {tour.whatsNotIncluded}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {tour.cancellationPolicy && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-emerald-600" />
                    Cancellation Policy
                  </h3>
                  <div className="bg-emerald-50 rounded-2xl p-6">
                    <p className="text-emerald-700 text-lg capitalize">
                      {tour.cancellationPolicy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 sticky top-24">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-emerald-800 mb-3 leading-tight">
                    {tour.tourTitle}
                  </h1>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold text-emerald-600">
                      ₹{tour.pricePerPerson?.toLocaleString()}
                    </span>
                    {distance > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">
                          {distance.toFixed(1)} km away
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-emerald-700 leading-relaxed text-lg">
                    {tour.tourDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-100">
                  <a
                    href={`tel:${tourGuide?.phone || tour.tourGuidePhone}`}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Phone className="w-6 h-6" />
                    Contact Tour Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {tourGuide && (
          <div className="mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                Tour Guide Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Guide Name
                  </p>
                  <p className="font-bold text-emerald-800 text-lg">
                    {tourGuide.name || tour.tourGuideName}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Languages
                  </p>
                  <p className="font-bold text-emerald-800 text-lg">
                    {tourGuide.languagesSpoken || tour.languagesSpoken}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Meeting Point
                  </p>
                  <p className="font-bold text-emerald-800 text-lg">
                    {tour.meetingPoint}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Contact
                  </p>
                  <a
                    href={`tel:${tourGuide.phone || tour.tourGuidePhone}`}
                    className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-lg transition-colors duration-200"
                  >
                    <Phone className="w-5 h-5" />
                    {tourGuide.phone || tour.tourGuidePhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {tour.lat && tour.lng && (
          <div className="mt-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
            <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-2xl font-bold text-emerald-800 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                Meeting Point & Directions
              </h3>
              <p className="text-emerald-600 mt-2">
                Get directions to the tour meeting point
              </p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <h4 className="font-bold text-emerald-800 mb-3">
                    Meeting Point
                  </h4>
                  <p className="text-emerald-700 mb-4">{tour.meetingPoint}</p>
                  <p className="text-sm text-emerald-600">
                    Coordinates: {tour.lat.toFixed(4)}, {tour.lng.toFixed(4)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <h4 className="font-bold text-emerald-800 mb-3">
                    Get Directions
                  </h4>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${tour.lat},${tour.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourDetailPage;
