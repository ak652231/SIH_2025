"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import {
  Mountain,
  Camera,
  Compass,
  Plus,
  DollarSign,
  Clock,
  Users,
  LogOut,
  MapPin,
  Navigation,
} from "lucide-react";
import CloudinaryUpload from "../../components/CloudinaryUpload";
import { Check } from "lucide-react";
import { toast } from "sonner";

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const suggestionRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Form data for merchants
  const [merchantFormData, setMerchantFormData] = useState({
    productName: "",
    productPhoto: [],
    description: "",
    cost: "",
  });

  // Form data for tour guides
  const [tourGuideFormData, setTourGuideFormData] = useState({
    tourTitle: "",
    locationsAreas: "",
    meetingPoint: "",
    meetingPointAddress: "",
    duration: "",
    tourCategory: "",
    tourDescription: "",
    highlights: "",
    specialNotes: "",
    pricePerPerson: "",
    minGroupSize: "",
    maxGroupSize: "",
    availability: "",
    whatsIncluded: "",
    whatsNotIncluded: "",
    tourPhotos: [],
    cancellationPolicy: "",
    safetyNotes: "",
    lat: null,
    lng: null,
  });

  const [errors, setErrors] = useState({});

  // Auth listener effect
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } else {
      router.push("/auth");
    }
    setIsLoading(false);
  });

  return () => unsubscribe();
}, [router]);

// Click outside listener effect
useEffect(() => {
  const handleClickOutside = (event) => {
    if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  // Location fetching logic
  const fetchFromNominatim = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + " India"
        )}&addressdetails=1&limit=5&countrycodes=in`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "JharkhandTourApp/1.0",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.map((item) => ({
          id: `nom-${item.place_id}`,
          name: item.display_name,
          shortName: item.display_name.split(",")[0],
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


  const fetchLocationSuggestions = async (query) => {
    setIsLocationLoading(true);
    try {
      const results = await fetchFromNominatim(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleMeetingPointChange = (e) => {
    const { value } = e.target;
    setTourGuideFormData({ ...tourGuideFormData, meetingPoint: value });
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (value.trim().length >= 2) {
      setIsLocationLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        fetchLocationSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLocationLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTourGuideFormData({
      ...tourGuideFormData,
      meetingPoint: suggestion.name,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  "Accept-Language": "en",
                  "User-Agent": "JharkhandTourApp/1.0",
                },
              }
            );
            if (response.ok) {
              const data = await response.json();
              const locationName = data.display_name;
              setTourGuideFormData({
                ...tourGuideFormData,
                meetingPoint: locationName,
                lat: latitude,
                lng: longitude,
              });
              setSelectedLocation({
                name: locationName,
                lat: latitude,
                lng: longitude,
              });
            }
          } catch (error) {
            console.error("Error getting location name:", error);
          } finally {
            setIsLocationLoading(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get current location.");
          setIsLocationLoading(false);
        }
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully!");
      router.push("/auth");
    } catch (error) {
      toast.error("Error signing out. Please try again.", {
        className: "bg-red-600 text-white font-medium rounded-xl shadow-lg",
      });
      console.error("Error signing out:", error);
    }
  };

  const handleMerchantInputChange = (e) => {
    const { name, value } = e.target;
    setMerchantFormData({ ...merchantFormData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleTourGuideInputChange = (e) => {
    const { name, value } = e.target;
    setTourGuideFormData({ ...tourGuideFormData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateMerchantForm = () => {
    const newErrors = {};
    if (!merchantFormData.productName)
      newErrors.productName = "Product name is required";
    if (
      !merchantFormData.productPhoto ||
      merchantFormData.productPhoto.length === 0
    )
      newErrors.productPhoto = "At least one product photo is required";
    if (!merchantFormData.description)
      newErrors.description = "Description is required";
    if (!merchantFormData.cost) newErrors.cost = "Cost is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTourGuideForm = () => {
    const newErrors = {};
    if (!tourGuideFormData.tourTitle)
      newErrors.tourTitle = "Tour title is required";
    if (!tourGuideFormData.locationsAreas)
      newErrors.locationsAreas = "Locations/Areas is required";
    if (!tourGuideFormData.meetingPoint)
      newErrors.meetingPoint = "Meeting point is required";
    if (!tourGuideFormData.duration)
      newErrors.duration = "Duration is required";
    if (!tourGuideFormData.tourCategory)
      newErrors.tourCategory = "Tour category is required";
    if (!tourGuideFormData.tourDescription)
      newErrors.tourDescription = "Tour description is required";
    if (!tourGuideFormData.pricePerPerson)
      newErrors.pricePerPerson = "Price per person is required";
    if (!tourGuideFormData.maxGroupSize)
      newErrors.maxGroupSize = "Maximum group size is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMerchantSubmit = async (e) => {
    e.preventDefault();
    if (!validateMerchantForm()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "products"), {
        ...merchantFormData,
        merchantId: user.uid,
        merchantName: userData.name,
        businessType: userData.businessType,
        createdAt: new Date().toISOString(),
      });

      toast.success("Product added successfully!");

      setMerchantFormData({
        productName: "",
        productPhoto: [],
        description: "",
        cost: "",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error adding product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTourGuideSubmit = async (e) => {
    e.preventDefault();
    if (!validateTourGuideForm()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "tours"), {
        ...tourGuideFormData,
        tourGuideId: user.uid || "",
        tourGuideName: userData.name || "",
        tourGuidePhone: userData.phone || "",
        languagesSpoken: userData.languagesSpoken || [],
        createdAt: new Date().toISOString(),
      });

      toast.success("Tour added successfully!");
      setTourGuideFormData({
        tourTitle: "",
        locationsAreas: "",
        meetingPoint: "",
        meetingPointAddress: "",
        duration: "",
        tourCategory: "",
        tourDescription: "",
        highlights: "",
        specialNotes: "",
        pricePerPerson: "",
        minGroupSize: "",
        maxGroupSize: "",
        availability: "",
        whatsIncluded: "",
        whatsNotIncluded: "",
        tourPhotos: [],
        cancellationPolicy: "",
        safetyNotes: "",
        lat: null,
        lng: null,
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding tour:", error);
      alert("Error adding tour. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-emerald-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <Mountain className="absolute top-20 right-20 w-16 h-16 text-emerald-300 opacity-30" />
        <Camera className="absolute bottom-20 left-20 w-12 h-12 text-teal-300 opacity-30" />
        <Compass className="absolute top-1/2 left-10 w-14 h-14 text-emerald-400 opacity-20" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">
              Welcome, {userData.name}!
            </h1>
            <p className="text-emerald-600 capitalize">
              {userData.userType === "merchant" ? "Merchant" : "Tour Guide"}{" "}
              Dashboard
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-4xl mx-auto">
          {/* Add New Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {userData.userType === "merchant"
                ? "Add New Product"
                : "Add New Tour"}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-emerald-100 mb-6">
              <h2 className="text-2xl font-bold text-emerald-800 mb-6">
                {userData.userType === "merchant"
                  ? "Add New Product"
                  : "Add New Tour"}
              </h2>

              {userData.userType === "merchant" ? (
                // Merchant Form
                <form onSubmit={handleMerchantSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={merchantFormData.productName}
                      onChange={handleMerchantInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        errors.productName
                          ? "border-red-500"
                          : "border-emerald-200"
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.productName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  <div>
                    <CloudinaryUpload
                      multiple={true}
                      onUploadSuccess={(urls) =>
                        setMerchantFormData((prev) => ({
                          ...prev,
                          productPhoto: [...prev.productPhoto, ...urls],
                        }))
                      }
                      label="Product Photos"
                      acceptedFileTypes="image/*"
                      className={`w-full border-2 border-dashed ${
                        errors.productPhoto
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors`}
                    />

                    {merchantFormData.productPhoto.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                        {merchantFormData.productPhoto.map(
                          (photoUrl, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center"
                            >
                              <img
                                src={photoUrl}
                                alt={`Product Photo ${index + 1}`}
                                className="w-full h-40 object-cover rounded-lg border border-emerald-200"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setMerchantFormData((prev) => ({
                                    ...prev,
                                    productPhoto: prev.productPhoto.filter(
                                      (_, i) => i !== index
                                    ),
                                  }))
                                }
                                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        PNG, JPG, or PDF (max. 5MB each)
                      </p>
                    )}

                    {errors.productPhoto && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.productPhoto}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={merchantFormData.description}
                      onChange={handleMerchantInputChange}
                      rows={4}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
                        errors.description
                          ? "border-red-500"
                          : "border-emerald-200"
                      }`}
                      placeholder="Describe your product"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Cost (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <input
                        type="number"
                        name="cost"
                        value={merchantFormData.cost}
                        onChange={handleMerchantInputChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          errors.cost ? "border-red-500" : "border-emerald-200"
                        }`}
                        placeholder="Enter cost"
                      />
                    </div>
                    {errors.cost && (
                      <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Adding Product..." : "Add Product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Tour Guide Form
                <form onSubmit={handleTourGuideSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        Tour Title
                      </label>
                      <input
                        type="text"
                        name="tourTitle"
                        value={tourGuideFormData.tourTitle}
                        onChange={handleTourGuideInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          errors.tourTitle
                            ? "border-red-500"
                            : "border-emerald-200"
                        }`}
                        placeholder="Short name of the tour"
                      />
                      {errors.tourTitle && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.tourTitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        Duration
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                        <input
                          type="text"
                          name="duration"
                          value={tourGuideFormData.duration}
                          onChange={handleTourGuideInputChange}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                            errors.duration
                              ? "border-red-500"
                              : "border-emerald-200"
                          }`}
                          placeholder="e.g., 2 hours, half-day, full-day"
                        />
                      </div>
                      {errors.duration && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.duration}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Locations/Areas Covered
                    </label>
                    <input
                      type="text"
                      name="locationsAreas"
                      value={tourGuideFormData.locationsAreas}
                      onChange={handleTourGuideInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        errors.locationsAreas
                          ? "border-red-500"
                          : "border-emerald-200"
                      }`}
                      placeholder="City, village, landmark, etc. (comma separated)"
                    />
                    {errors.locationsAreas && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.locationsAreas}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Meeting Point
                    </label>
                    <div className="relative" ref={suggestionRef}>
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <input
                        type="text"
                        name="meetingPoint"
                        value={tourGuideFormData.meetingPoint}
                        onChange={handleMeetingPointChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          errors.meetingPoint
                            ? "border-red-500"
                            : "border-emerald-200"
                        }`}
                        placeholder="Search for a meeting location"
                        autoComplete="off"
                      />
                      {isLocationLoading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        </div>
                      )}
                      {showSuggestions && (
                        <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border border-emerald-200 max-h-60 overflow-auto">
                          {suggestions.length > 0 ? (
                            suggestions.map((suggestion) => (
                              <div
                                key={suggestion.id}
                                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-emerald-100 last:border-0"
                                onClick={() =>
                                  handleSuggestionClick(suggestion)
                                }
                              >
                                <div className="flex items-start">
                                  <MapPin className="h-5 w-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-emerald-800 text-sm font-medium">
                                      {suggestion.shortName}
                                    </div>
                                    {suggestion.shortName !==
                                      suggestion.name && (
                                      <div className="text-xs text-emerald-600 truncate max-w-full">
                                        {suggestion.name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-emerald-600">
                              No locations found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.meetingPoint && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.meetingPoint}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Tour Category
                    </label>
                    <select
                      name="tourCategory"
                      value={tourGuideFormData.tourCategory}
                      onChange={handleTourGuideInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        errors.tourCategory
                          ? "border-red-500"
                          : "border-emerald-200"
                      }`}
                    >
                      <option value="">Select category</option>
                      <option value="sightseeing">Sightseeing</option>
                      <option value="adventure">Adventure</option>
                      <option value="cultural">Cultural</option>
                      <option value="food">Food</option>
                      <option value="nature">Nature</option>
                      <option value="wildlife">Wildlife</option>
                    </select>
                    {errors.tourCategory && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.tourCategory}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Tour Description
                    </label>
                    <textarea
                      name="tourDescription"
                      value={tourGuideFormData.tourDescription}
                      onChange={handleTourGuideInputChange}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
                        errors.tourDescription
                          ? "border-red-500"
                          : "border-emerald-200"
                      }`}
                      placeholder="Short paragraph about the experience"
                    />
                    {errors.tourDescription && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.tourDescription}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Highlights
                    </label>
                    <textarea
                      name="highlights"
                      value={tourGuideFormData.highlights}
                      onChange={handleTourGuideInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none"
                      placeholder="3-5 bullet points of key attractions/activities"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        Price per Person (₹)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                        <input
                          type="number"
                          name="pricePerPerson"
                          value={tourGuideFormData.pricePerPerson}
                          onChange={handleTourGuideInputChange}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                            errors.pricePerPerson
                              ? "border-red-500"
                              : "border-emerald-200"
                          }`}
                          placeholder="Price"
                        />
                      </div>
                      {errors.pricePerPerson && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.pricePerPerson}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        Min Group Size
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                        <input
                          type="number"
                          name="minGroupSize"
                          value={tourGuideFormData.minGroupSize}
                          onChange={handleTourGuideInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                          placeholder="Min"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        Max Group Size
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                        <input
                          type="number"
                          name="maxGroupSize"
                          value={tourGuideFormData.maxGroupSize}
                          onChange={handleTourGuideInputChange}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                            errors.maxGroupSize
                              ? "border-red-500"
                              : "border-emerald-200"
                          }`}
                          placeholder="Max"
                        />
                      </div>
                      {errors.maxGroupSize && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.maxGroupSize}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <CloudinaryUpload
                      multiple={true}
                      onUploadSuccess={(urls) =>
                        setTourGuideFormData((prev) => ({
                          ...prev,
                          tourPhotos: [...prev.tourPhotos, ...urls],
                        }))
                      }
                      label="Tour Photos"
                      className={`w-full border-2 border-dashed ${
                        errors.tourPhotos ? "border-red-500" : "border-gray-300"
                      } rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors`}
                    />

                    {tourGuideFormData.tourPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                        {tourGuideFormData.tourPhotos.map((photoUrl, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <img
                              src={photoUrl}
                              alt={`Tour Photo ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg border border-emerald-200"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setTourGuideFormData((prev) => ({
                                  ...prev,
                                  tourPhotos: prev.tourPhotos.filter(
                                    (_, i) => i !== index
                                  ),
                                }))
                              }
                              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        PNG, JPG, or PDF (max. 5MB each)
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        What's Included
                      </label>
                      <textarea
                        name="whatsIncluded"
                        value={tourGuideFormData.whatsIncluded}
                        onChange={handleTourGuideInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none"
                        placeholder="e.g., guide service, entry tickets, transport"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-1">
                        What's Not Included
                      </label>
                      <textarea
                        name="whatsNotIncluded"
                        value={tourGuideFormData.whatsNotIncluded}
                        onChange={handleTourGuideInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none"
                        placeholder="e.g., meals, personal expenses"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Cancellation Policy
                    </label>
                    <select
                      name="cancellationPolicy"
                      value={tourGuideFormData.cancellationPolicy}
                      onChange={handleTourGuideInputChange}
                      className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select policy</option>
                      <option value="flexible">Flexible</option>
                      <option value="moderate">Moderate</option>
                      <option value="strict">Strict</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Adding Tour..." : "Add Tour"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* User Info Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-emerald-100">
            <h3 className="text-xl font-bold text-emerald-800 mb-4">
              Your Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-emerald-600">Name</p>
                <p className="font-medium text-emerald-800">{userData.name}</p>
              </div>
              <div>
                <p className="text-sm text-emerald-600">Phone</p>
                <p className="font-medium text-emerald-800">{userData.phone}</p>
              </div>
              {userData.userType === "merchant" && (
                <>
                  <div>
                    <p className="text-sm text-emerald-600">Business Name</p>
                    <p className="font-medium text-emerald-800">
                      {userData.businessName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600">Business Type</p>
                    <p className="font-medium text-emerald-800 capitalize">
                      {userData.businessType}
                    </p>
                  </div>
                </>
              )}
              {userData.userType === "tourguide" && (
                <div>
                  <p className="text-sm text-emerald-600">Languages Spoken</p>
                  <p className="font-medium text-emerald-800">
                    {userData.languagesSpoken}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
