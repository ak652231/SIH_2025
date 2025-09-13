"use client";

import { useState, useRef, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  MapPin,
  Phone,
  User,
  Store,
  Navigation,
  Mountain,
  Camera,
  Compass,
  Languages,
  Building,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CloudinaryUpload from "../../components/CloudinaryUpload";
import { Check } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [userType, setUserType] = useState("merchant"); // Changed from 'vendor' to 'merchant'
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const suggestionRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    businessName: "", // Changed from shopName to businessName
    businessLocation: "", // Changed from shopLocation to businessLocation
    businessAddress: "", // Changed from shopAddress to businessAddress
    businessType: "", // Added business category field
    profilePhoto: "", // Added profile photo for tour guides
    languagesSpoken: "", // Added languages spoken for tour guides
    lat: null,
    lng: null,
  });

  const [errors, setErrors] = useState({});

  const fetchFromNominatim = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + " Jharkhand India"
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

  const handleLocationChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, businessLocation: value }); // Updated field name

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
    setFormData({
      ...formData,
      businessLocation: suggestion.name, // Updated field name
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
              setFormData({
                ...formData,
                businessLocation: locationName, // Updated field name
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
          setIsLocationLoading(false);
        }
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (formData.phone && !/^\+91[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone =
        "Please enter a valid Indian phone number (+91XXXXXXXXXX)";
    }

    if (isSignUp) {
      if (!formData.name) newErrors.name = "Name is required";

      if (userType === "merchant") {
        // Updated condition
        if (!formData.businessName)
          newErrors.businessName = "Business name is required"; // Updated field name
        if (!formData.businessLocation)
          newErrors.businessLocation = "Business location is required"; // Updated field name
        if (!formData.businessAddress)
          newErrors.businessAddress = "Business address is required"; // Updated field name
        if (!formData.businessType)
          newErrors.businessType = "Business category is required"; // Added validation
      }

      if (userType === "tourguide") {
        // Added tour guide validation
        if (!formData.profilePhoto)
          newErrors.profilePhoto = "Profile photo is required";
        if (!formData.languagesSpoken)
          newErrors.languagesSpoken = "Languages spoken is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setupRecaptcha = () => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("[v0] reCAPTCHA solved");
        },
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    }
    return recaptchaVerifier;
  };

  const sendOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const verifier = setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formData.phone,
        verifier
      );
      setVerificationId(confirmationResult.verificationId);
      setShowOtpInput(true);
      console.log("[v0] OTP sent successfully");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ ...errors, otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      if (isSignUp) {
        const userData = {
          uid: user.uid,
          phone: formData.phone,
          name: formData.name,
          userType: userType, // Updated to use merchant/tourguide
          createdAt: new Date().toISOString(),
        };

        if (userType === "merchant") {
          // Updated condition
          userData.businessName = formData.businessName; // Updated field names
          userData.businessLocation = formData.businessLocation;
          userData.businessAddress = formData.businessAddress;
          userData.businessType = formData.businessType; // Added business type
          userData.lat = formData.lat;
          userData.lng = formData.lng;
        }

        if (userType === "tourguide") {
          // Added tour guide data
          userData.profilePhoto = formData.profilePhoto;
          userData.languagesSpoken = formData.languagesSpoken;
        }

        await setDoc(doc(db, "users", user.uid), userData);
        toast.success("Account created successfully!");
        router.push("/dashboard"); // Redirect to dashboard
      } else {
        toast.success("Signed in successfully!");
        router.push("/dashboard"); // Redirect to dashboard
      }

      // Reset form
      setShowOtpInput(false);
      setOtp("");
      setVerificationId("");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Invalid OTP. Please try again.", {
        className: "bg-red-600 text-white font-medium rounded-xl shadow-lg",
      });
      setErrors({ ...errors, otp: "Invalid OTP" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (showOtpInput) {
      await verifyOtp();
    } else {
      await sendOtp();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 relative overflow-hidden">
      {/* ... existing background elements ... */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <Mountain className="absolute top-20 right-20 w-16 h-16 text-emerald-300 opacity-30" />
        <Camera className="absolute bottom-20 left-20 w-12 h-12 text-teal-300 opacity-30" />
        <Compass className="absolute top-1/2 left-10 w-14 h-14 text-emerald-400 opacity-20" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* ... existing header ... */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">
              Explore Jharkhand
            </h1>
            <p className="text-emerald-600">
              {isSignUp
                ? "Join our travel community"
                : "Welcome back, explorer!"}
            </p>
          </div>

          {/* Auth Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-emerald-100">
            {/* ... existing toggle buttons ... */}
            <div className="flex bg-emerald-50 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isSignUp
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isSignUp
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* User Type Selection (only for sign up) */}
            {isSignUp && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  I am a:
                </label>
                <div className="flex bg-emerald-50 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setUserType("merchant")} // Updated to merchant
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      userType === "merchant"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Merchant {/* Updated label */}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("tourguide")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      userType === "tourguide"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    Tour Guide
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... existing phone field ... */}
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                      errors.phone ? "border-red-500" : "border-emerald-200"
                    }`}
                    placeholder="+91XXXXXXXXXX"
                    disabled={showOtpInput}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* ... existing OTP field ... */}
              {showOtpInput && (
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-center text-lg tracking-widest ${
                      errors.otp ? "border-red-500" : "border-emerald-200"
                    }`}
                    placeholder="000000"
                  />
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                  )}
                  <p className="mt-1 text-sm text-emerald-600">
                    OTP sent to {formData.phone}.
                    <button
                      type="button"
                      onClick={() => setShowOtpInput(false)}
                      className="ml-1 text-emerald-700 underline"
                    >
                      Change number?
                    </button>
                  </p>
                </div>
              )}

              {/* Sign Up Fields */}
              {isSignUp && !showOtpInput && (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          errors.name ? "border-red-500" : "border-emerald-200"
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Merchant-specific fields */}
                  {userType === "merchant" && ( // Updated condition
                    <>
                      {/* Business Name */}
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-1">
                          Business Name
                        </label>{" "}
                        {/* Updated label */}
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                          <input
                            type="text"
                            name="businessName" // Updated field name
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                              errors.businessName
                                ? "border-red-500"
                                : "border-emerald-200"
                            }`}
                            placeholder="Enter your business name" // Updated placeholder
                          />
                        </div>
                        {errors.businessName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.businessName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-1">
                          Business Category
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                          <select
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                              errors.businessType
                                ? "border-red-500"
                                : "border-emerald-200"
                            }`}
                          >
                            <option value="">Select a category</option>
                            <option value="accommodation">Accommodation</option>
                            <option value="dining">Dining</option>
                            <option value="shopping">Shopping</option>
                          </select>
                        </div>
                        {errors.businessType && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.businessType}
                          </p>
                        )}
                      </div>

                      {/* Business Location */}
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-1">
                          Business Location
                        </label>{" "}
                        {/* Updated label */}
                        <div className="relative" ref={suggestionRef}>
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                          <input
                            type="text"
                            name="businessLocation" // Updated field name
                            value={formData.businessLocation}
                            onChange={handleLocationChange}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                              errors.businessLocation
                                ? "border-red-500"
                                : "border-emerald-200"
                            }`}
                            placeholder="Enter business location" // Updated placeholder
                            autoComplete="off"
                          />

                          {/* ... existing loading indicator and suggestions ... */}
                          {isLocationLoading && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                            </div>
                          )}

                          {showSuggestions && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-emerald-200 max-h-60 overflow-auto">
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
                                  No locations found. Try a different search
                                  term.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors.businessLocation && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.businessLocation}
                          </p>
                        )}
                        {/* Current Location Button */}
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="mt-2 w-full bg-emerald-100 text-emerald-700 py-2 px-4 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                          disabled={isLocationLoading}
                        >
                          <Navigation className="w-4 h-4" />
                          Use Current Location
                        </button>
                      </div>

                      {/* Map Display */}
                      {selectedLocation && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-emerald-700 mb-2">
                            Selected Location
                          </label>
                          <div className="h-48 w-full rounded-lg overflow-hidden border border-emerald-200">
                            <iframe
                              title="Business Location Map" // Updated title
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              scrolling="no"
                              marginHeight="0"
                              marginWidth="0"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                                selectedLocation.lng - 0.01
                              },${selectedLocation.lat - 0.01},${
                                selectedLocation.lng + 0.01
                              },${
                                selectedLocation.lat + 0.01
                              }&layer=mapnik&marker=${selectedLocation.lat},${
                                selectedLocation.lng
                              }`}
                              style={{ border: "none" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Business Address */}
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-1">
                          Business Address
                        </label>{" "}
                        {/* Updated label */}
                        <textarea
                          name="businessAddress" // Updated field name
                          value={formData.businessAddress}
                          onChange={handleInputChange}
                          rows={3}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
                            errors.businessAddress
                              ? "border-red-500"
                              : "border-emerald-200"
                          }`}
                          placeholder="Enter complete business address" // Updated placeholder
                        />
                        {errors.businessAddress && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.businessAddress}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {userType === "tourguide" && (
                    <>
                      {/* Profile Photo */}
                      <div>
                        <CloudinaryUpload
                          onUploadSuccess={(url) =>
                            setFormData({ ...formData, profilePhoto: url })
                          }
                          label="Profile Photo"
                          className={`w-full border-2 border-dashed ${
                            errors.profilePhoto
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors`}
                        />

                        {formData.profilePhoto ? (
                          <div className="flex flex-col items-center mt-3">
                            <div className="flex items-center justify-center mb-2 text-green-600">
                              <Check className="h-6 w-6 mr-1" />
                              <span className="font-medium">File uploaded</span>
                            </div>
                            <img
                              src={
                                typeof formData.profilePhoto === "string"
                                  ? formData.profilePhoto
                                  : URL.createObjectURL(formData.profilePhoto) // if it's a File object
                              }
                              alt="Uploaded Product"
                              className="w-full h-40 object-cover rounded-lg border border-emerald-200"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  profilePhoto: null,
                                }))
                              }
                              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            PNG, JPG, or PDF (max. 5MB)
                          </p>
                        )}
                        {errors.profilePhoto && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.profilePhoto}
                          </p>
                        )}
                      </div>

                      {/* Languages Spoken */}
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-1">
                          Languages Spoken
                        </label>
                        <div className="relative">
                          <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                          <input
                            type="text"
                            name="languagesSpoken"
                            value={formData.languagesSpoken}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                              errors.languagesSpoken
                                ? "border-red-500"
                                : "border-emerald-200"
                            }`}
                            placeholder="e.g., Hindi, English, Bengali"
                          />
                        </div>
                        {errors.languagesSpoken && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.languagesSpoken}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ... existing submit button ... */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {showOtpInput ? "Verifying OTP..." : "Sending OTP..."}
                  </div>
                ) : showOtpInput ? (
                  "Verify OTP"
                ) : isSignUp ? (
                  "Send OTP & Create Account"
                ) : (
                  "Send OTP & Sign In"
                )}
              </button>
            </form>

            {/* ... existing footer ... */}
            <div className="mt-6 text-center">
              <p className="text-sm text-emerald-600">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-emerald-700 hover:text-emerald-800 underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>

          {/* ... existing Jharkhand footer ... */}
          <div className="mt-8 text-center">
            <p className="text-emerald-600 text-sm">
              🏔️ Discover the beauty of Jharkhand 🌿
            </p>
            <p className="text-emerald-500 text-xs mt-1">
              Waterfalls • Temples • Wildlife • Culture
            </p>
          </div>
        </div>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default AuthPage;
