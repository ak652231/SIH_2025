"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../../../lib/firebase"
import { ArrowLeft, MapPin, Phone, Store } from "lucide-react"
import { useRouter } from "next/navigation"

const ProductDetailPage = ({ params }) => {
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [merchant, setMerchant] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [distance, setDistance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Haversine distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in kilometers
    return distance
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to Ranchi, Jharkhand if location access denied
          setUserLocation({ lat: 23.3441, lng: 85.3096 })
        },
      )
    } else {
      // Default to Ranchi, Jharkhand if geolocation not supported
      setUserLocation({ lat: 23.3441, lng: 85.3096 })
    }
  }

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      const productDoc = await getDoc(doc(db, "products", params.id))

      if (productDoc.exists()) {
        const productData = productDoc.data()
        setProduct({ id: productDoc.id, ...productData })

        // Fetch merchant details
        const merchantQuery = query(collection(db, "users"), where("uid", "==", productData.merchantId))
        const merchantSnapshot = await getDocs(merchantQuery)

        if (!merchantSnapshot.empty) {
          const merchantData = merchantSnapshot.docs[0].data()
          setMerchant(merchantData)

          // Calculate distance if user location is available
          if (userLocation && merchantData.lat && merchantData.lng) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, merchantData.lat, merchantData.lng)
            setDistance(dist)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchProductDetails()
    }
  }, [params.id, userLocation])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-emerald-800 mb-2">Product not found</h2>
          <button
            onClick={() => router.push("/marketplace")}
            className="text-emerald-600 hover:text-emerald-700 underline"
          >
            Back to marketplace
          </button>
        </div>
      </div>
    )
  }

  // Create image array (for carousel - currently single image)
  const images = product.productPhoto || []


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/marketplace")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to marketplace
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
                <div className="h-96 relative">
                  <img
                    src={images[currentImageIndex] || "/placeholder.svg"}
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-emerald-600 rotate-180" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-4">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex ? "border-emerald-500" : "border-emerald-200"
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
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 h-96 flex items-center justify-center">
                <Store className="w-16 h-16 text-emerald-300" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-emerald-100">
              <h1 className="text-3xl font-bold text-emerald-800 mb-2">{product.productName}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-emerald-600">₹{product.cost}</span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <MapPin className="w-4 h-4" />
                  {distance.toFixed(1)} km away
                </div>
              </div>
              <p className="text-emerald-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Merchant Info */}
            {merchant && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Business Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-emerald-600">Business Name</p>
                    <p className="font-medium text-emerald-800">{merchant.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600">Category</p>
                    <p className="font-medium text-emerald-800 capitalize">{merchant.businessType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600">Location</p>
                    <p className="font-medium text-emerald-800">{merchant.businessLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600">Contact</p>
                    <a
                      href={`tel:${merchant.phone}`}
                      className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Phone className="w-4 h-4" />
                      {merchant.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Button */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-emerald-100">
              <a
                href={`tel:${merchant?.phone}`}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <Phone className="w-5 h-5" />
                Contact Merchant
              </a>
            </div>
          </div>
        </div>

        {/* Map */}
        {merchant && merchant.lat && merchant.lng && userLocation && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
            <div className="p-4 border-b border-emerald-100">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h3>
            </div>
            <div className="h-96 relative">
              <iframe
                title="Business Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(userLocation.lng, merchant.lng) - 0.01},${Math.min(userLocation.lat, merchant.lat) - 0.01},${Math.max(userLocation.lng, merchant.lng) + 0.01},${Math.max(userLocation.lat, merchant.lat) + 0.01}&layer=mapnik&marker=${merchant.lat},${merchant.lng}&marker=${userLocation.lat},${userLocation.lng}`}
                style={{ border: "none" }}
              />
              {/* Map legend */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-emerald-200">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-emerald-800">Business Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-emerald-800">Your Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage
