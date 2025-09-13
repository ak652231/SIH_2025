"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { Search, MapPin, Store, Utensils, Bed, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"

const MarketplacePage = () => {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLocationLoading, setIsLocationLoading] = useState(false)

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
    setIsLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setIsLocationLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to Ranchi, Jharkhand if location access denied
          setUserLocation({ lat: 23.3441, lng: 85.3096 })
          setIsLocationLoading(false)
        },
      )
    } else {
      // Default to Ranchi, Jharkhand if geolocation not supported
      setUserLocation({ lat: 23.3441, lng: 85.3096 })
      setIsLocationLoading(false)
    }
  }

  // Fetch products from Firebase
  const fetchProducts = async () => {
    try {
      const productsQuery = query(collection(db, "products"))
      const querySnapshot = await getDocs(productsQuery)
      const productsData = []

      for (const doc of querySnapshot.docs) {
        const productData = doc.data()

        // Fetch merchant location data
        const usersQuery = query(collection(db, "users"), where("uid", "==", productData.merchantId))
        const userSnapshot = await getDocs(usersQuery)

        if (!userSnapshot.empty) {
          const merchantData = userSnapshot.docs[0].data()
          if (merchantData.lat && merchantData.lng && userLocation) {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, merchantData.lat, merchantData.lng)

            // Only include products within 10km radius
            if (distance <= 10) {
              productsData.push({
                id: doc.id,
                ...productData,
                merchantLocation: {
                  lat: merchantData.lat,
                  lng: merchantData.lng,
                  address: merchantData.businessLocation,
                  businessName: merchantData.businessName,
                },
                distance: distance,
              })
            }
          }
        }
      }

      // Sort by distance (ascending)
      productsData.sort((a, b) => a.distance - b.distance)

      setProducts(productsData)
      setFilteredProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter products based on active filter and search query
  const filterProducts = () => {
    let filtered = products

    // Apply category filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((product) => product.businessType === activeFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredProducts(filtered)
  }

  // Get filter icon
  const getFilterIcon = (filter) => {
    switch (filter) {
      case "accommodation":
        return <Bed className="w-4 h-4" />
      case "dining":
        return <Utensils className="w-4 h-4" />
      case "shopping":
        return <ShoppingBag className="w-4 h-4" />
      default:
        return <Store className="w-4 h-4" />
    }
  }

  // Handle product card click
  const handleProductClick = (productId) => {
    router.push(`/marketplace/product/${productId}`)
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchProducts()
    }
  }, [userLocation])

  useEffect(() => {
    filterProducts()
  }, [activeFilter, searchQuery, products])

  if (isLoading || isLocationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600">
            {isLocationLoading ? "Getting your location..." : "Loading marketplace..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-emerald-800">Jharkhand Marketplace</h1>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white/80 backdrop-blur-sm"
              placeholder="Search products..."
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-full p-2 border border-emerald-100">
            {[
              { key: "all", label: "All", icon: <Store className="w-4 h-4" /> },
              { key: "accommodation", label: "Stay", icon: <Bed className="w-4 h-4" /> },
              { key: "dining", label: "Dine", icon: <Utensils className="w-4 h-4" /> },
              { key: "shopping", label: "Shop", icon: <ShoppingBag className="w-4 h-4" /> },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Layout */}
        <div className={`${activeFilter === "all" ? "block" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}`}>
          {/* Products Grid */}
          <div
            className={`${activeFilter === "all" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}`}
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 border border-emerald-100"
                >
                  {/* Product Image */}
                  <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 relative overflow-hidden">
                    {product.productPhoto ? (
                      <img
                        src={product.productPhoto[0] || "/placeholder.svg"}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getFilterIcon(product.businessType)}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-emerald-800 text-lg mb-1 line-clamp-1">{product.productName}</h3>
                    <p className="text-emerald-600 text-sm mb-2 font-medium">
                      {product.merchantLocation?.businessName}
                    </p>
                    <p className="text-emerald-700 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-800 font-bold text-lg">₹{product.cost}</span>
                      <div className="flex items-center gap-1 text-emerald-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        {product.distance.toFixed(1)} km
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Store className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-700 mb-2">No products found</h3>
                <p className="text-emerald-600">
                  {searchQuery ? "Try adjusting your search terms" : "No products available in your area"}
                </p>
              </div>
            )}
          </div>

          {/* Map (only shown when filter is not "all") */}
          {activeFilter !== "all" && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
              <div className="p-4 border-b border-emerald-100">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Nearby Locations
                </h3>
              </div>
              <div className="h-96 relative">
                {userLocation && (
                  <iframe
                    title="Marketplace Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.05},${userLocation.lat - 0.05},${userLocation.lng + 0.05},${userLocation.lat + 0.05}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`}
                    style={{ border: "none" }}
                  />
                )}
                {/* Map overlay with business locations */}
                <div className="absolute top-4 left-4 right-4 max-h-32 overflow-y-auto">
                  {filteredProducts.slice(0, 3).map((product, index) => (
                    <div
                      key={product.id}
                      className="bg-white/90 backdrop-blur-sm rounded-lg p-2 mb-2 border border-emerald-200 text-sm"
                    >
                      <div className="font-medium text-emerald-800">{product.merchantLocation?.businessName}</div>
                      <div className="text-emerald-600 text-xs">{product.distance.toFixed(1)} km away</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketplacePage
