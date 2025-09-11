"use client"

import { useState } from "react"
import TravelPlanningForm from "../../components/TravelPlanningForm"
import ItineraryDisplay from "../../components/ItineraryDisplay"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type PageState = "form" | "loading" | "results" | "error"

export default function TravelFormPage() {
  const [pageState, setPageState] = useState<PageState>("form")
  const [itinerary, setItinerary] = useState(null)
  const [error, setError] = useState<string>("")

  const handleFormSubmit = async (formData: any) => {
    console.log("[v0] handleFormSubmit called with:", formData)
    setPageState("loading")
    setError("")

    try {
      // Replace with your actual Flask backend URL
      const response = await fetch("http://localhost:5000/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === "success") {
        setItinerary(result.data)
        setPageState("results")
      } else {
        throw new Error(result.message || "Failed to generate itinerary")
      }
    } catch (err) {
      console.error("Error generating itinerary:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setPageState("error")
    }
  }

  const handleBackToForm = () => {
    setPageState("form")
    setItinerary(null)
    setError("")
  }

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Planning Your Perfect Journey</h2>
          <p className="text-gray-600 mb-4">Our AI is crafting a personalized itinerary just for you...</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-pulse">🗺️ Analyzing destinations</div>
            <div className="animate-pulse delay-100">🚗 Optimizing routes</div>
            <div className="animate-pulse delay-200">💰 Calculating costs</div>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
        <div className="container mx-auto max-w-2xl">
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Oops! Something went wrong.</strong>
              <br />
              {error}
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Unable to Generate Itinerary</h1>
            <p className="text-xl text-gray-600 mb-8">
              We encountered an issue while planning your trip. Please try again.
            </p>
            <button
              onClick={handleBackToForm}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === "results" && itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
        <ItineraryDisplay itinerary={itinerary} onBack={handleBackToForm} />
      </div>
    )
  }

  // Default form state
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Plan Your Jharkhand Adventure</h1>
          <p className="text-xl text-gray-600">Take our train journey through the planning process</p>
        </div>

        <TravelPlanningForm onSubmit={handleFormSubmit} isLoading={pageState === "loading"} />
      </div>
    </div>
  )
}
