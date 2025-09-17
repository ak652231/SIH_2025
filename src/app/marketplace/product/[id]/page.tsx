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
import { db } from "../../../../lib/firebase";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

// React Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons for Next.js
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const businessIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ProductDetailPage = ({ params }) => {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [merchant, setMerchant] = useState(null);
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

  const MapLegend = () => {
    const map = useMap();

    useEffect(() => {
      const legend = L.control({ position: "topright" });

      legend.onAdd = () => {
        const div = L.DomUtil.create(
          "div",
          "map-legend bg-white p-3 rounded-lg shadow-lg border border-emerald-100"
        );
        div.innerHTML = `
        <div style="font-size:14px; color:#065f46; font-weight:600; margin-bottom:8px;">Legend</div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" height="20"/>
          <span style="font-size:13px; color:#374151;">Your Location</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" height="20"/>
          <span style="font-size:13px; color:#374151;">Business</span>
        </div>
      `;
        return div;
      };

      legend.addTo(map);

      return () => {
        legend.remove();
      };
    }, [map]);

    return null;
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

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      const productDoc = await getDoc(doc(db, "products", params.id));

      if (productDoc.exists()) {
        const productData = productDoc.data();
        setProduct({ id: productDoc.id, ...productData });

        // Fetch merchant details
        const merchantQuery = query(
          collection(db, "users"),
          where("uid", "==", productData.merchantId)
        );
        const merchantSnapshot = await getDocs(merchantQuery);

        if (!merchantSnapshot.empty) {
          const merchantData = merchantSnapshot.docs[0].data();
          setMerchant(merchantData);

          if (userLocation && merchantData.lat && merchantData.lng) {
            const dist = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              merchantData.lat,
              merchantData.lng
            );
            setDistance(dist);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchProductDetails();
    }
  }, [params.id, userLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            <Store className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 mb-3">
              Product not found
            </h2>
            <p className="text-emerald-600 mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/marketplace")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = product.productPhoto || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="bg-white/90 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 shadow-sm h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/marketplace")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to marketplace
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
                    alt={product.productName}
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
                            alt={`${product.productName} ${index + 1}`}
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
                  <Store className="w-20 h-20 text-emerald-300 mx-auto mb-4" />
                  <p className="text-emerald-600 font-medium">
                    No images available
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 sticky top-24">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-emerald-800 mb-3 leading-tight">
                    {product.productName}
                  </h1>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold text-emerald-600">
                      ₹{product.cost?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">
                        {distance.toFixed(1)} km away
                      </span>
                    </div>
                  </div>
                  <p className="text-emerald-700 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-100">
                  <a
                    href={`tel:${merchant?.phone}`}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Phone className="w-6 h-6" />
                    Contact Merchant
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {merchant && (
          <div className="mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <Store className="w-6 h-6 text-emerald-600" />
                </div>
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Business Name
                  </p>
                  <p className="font-bold text-emerald-800 text-lg">
                    {merchant.businessName}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Category
                  </p>
                  <p className="font-bold text-emerald-800 text-lg capitalize">
                    {merchant.businessType}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Location
                  </p>
                  <p className="font-bold text-emerald-800 text-lg">
                    {merchant.businessLocation}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Contact
                  </p>
                  <a
                    href={`tel:${merchant.phone}`}
                    className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-lg transition-colors duration-200"
                  >
                    <Phone className="w-5 h-5" />
                    {merchant.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {merchant && merchant.lat && merchant.lng && userLocation && (
          <div className="mt-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
            <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-2xl font-bold text-emerald-800 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                Location & Directions
              </h3>
              <p className="text-emerald-600 mt-2">
                Find the exact location of this business and get directions
              </p>
            </div>
            <div className="h-[400px]">
              <MapContainer
                center={[merchant.lat, merchant.lng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker
                  position={[merchant.lat, merchant.lng]}
                  icon={businessIcon}
                >
                  <Popup className="font-medium">
                    <div className="text-center">
                      <p className="font-bold text-emerald-800">
                        {merchant.businessName}
                      </p>
                      <p className="text-emerald-600">
                        {merchant.businessLocation}
                      </p>
                    </div>
                  </Popup>
                </Marker>
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userIcon}
                >
                  <Popup className="font-medium">
                    <div className="text-center">
                      <p className="font-bold text-emerald-800">
                        Your Location
                      </p>
                      <p className="text-emerald-600">
                        {distance.toFixed(1)} km from business
                      </p>
                    </div>
                  </Popup>
                </Marker>
                <MapLegend />
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
