import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

// Types
type MissingPerson = {
  id: string
  fullName: string
  age: number
  gender: string
  photo: string
  behavioralTraits?: string
  healthConditions?: string
  lastSeenLocation: string
  lastSeenDate: string
  lastSeenTime: string
  lat: number
  lng: number
  height: number
  heightUnit: string
  weight: number
  weightUnit: string
  hairColor: string
  eyeColor: string
  clothingWorn: string
  identifyingMarks?: string
  additionalPhotos: string[]
  reporterName: string
  relationship: string
  mobileNumber: string
  emailAddress?: string
  aadhaarImage: string
  createdAt: string
  distance?: number
}

interface MissingPersonsState {
  nearbyPersons: MissingPerson[]
  otherPersons: MissingPerson[]
  selectedPerson: MissingPerson | null
  userLocation: { lat: number; lng: number } | null
  locationPermission: "granted" | "denied" | "pending"
  viewMode: "list" | "map"
  searchQuery: string
  filters: {
    ageRange: [number, number]
    gender: string
    dateRange: string
  }
  showFilters: boolean
  mapCenter: [number, number]
  mapZoom: number
  activeMapLayer: string
  isLoading: boolean
  error: string | null
}

const initialState: MissingPersonsState = {
  nearbyPersons: [],
  otherPersons: [],
  selectedPerson: null,
  userLocation: null,
  locationPermission: "pending",
  viewMode: "list",
  searchQuery: "",
  filters: {
    ageRange: [0, 100],
    gender: "all",
    dateRange: "all",
  },
  showFilters: false,
  mapCenter: [20.5937, 78.9629],
  mapZoom: 5,
  activeMapLayer: "street",
  isLoading: false,
  error: null,
}

const API_BASE_URL = "/api/missing-persons"

// Async thunks
export const fetchNearbyMissingPersons = createAsyncThunk(
  "missingPersons/fetchNearby",
  async (location: { lat: number; lng: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { missingPersons: MissingPersonsState }
      const { searchQuery, filters } = state.missingPersons

      const queryParams = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        radius: "10",
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(filters.gender !== "all" ? { gender: filters.gender } : {}),
        minAge: filters.ageRange[0].toString(),
        maxAge: filters.ageRange[1].toString(),
        ...(filters.dateRange !== "all" ? { dateRange: filters.dateRange } : {}),
      })

      const response = await fetch(`${API_BASE_URL}/nearby?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch nearby missing persons")

      return await response.json()
    } catch (error) {
      console.error("Error fetching nearby missing persons:", error)
      return rejectWithValue("Failed to load nearby missing persons")
    }
  },
)

export const fetchOtherMissingPersons = createAsyncThunk(
  "missingPersons/fetchOther",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { missingPersons: MissingPersonsState }
      const { searchQuery, filters, userLocation, nearbyPersons } = state.missingPersons

      const queryParams = new URLSearchParams({
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(filters.gender !== "all" ? { gender: filters.gender } : {}),
        minAge: filters.ageRange[0].toString(),
        maxAge: filters.ageRange[1].toString(),
        ...(filters.dateRange !== "all" ? { dateRange: filters.dateRange } : {}),
      })

      if (userLocation) {
        queryParams.append("excludeNearby", "true")
        queryParams.append("lat", userLocation.lat.toString())
        queryParams.append("lng", userLocation.lng.toString())
      }

      const response = await fetch(`${API_BASE_URL}?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch missing persons")

      const data = await response.json()

      // Filter out any persons that are already in nearbyPersons
      const nearbyIds = new Set(nearbyPersons.map((p) => p.id))
      return data.filter((person: MissingPerson) => !nearbyIds.has(person.id))
    } catch (error) {
      console.error("Error fetching other missing persons:", error)
      return rejectWithValue("Failed to load missing persons")
    }
  },
)

// Slice
const missingPersonsSlice = createSlice({
  name: "missingPersons",
  initialState,
  reducers: {
    setSelectedPerson: (state, action: PayloadAction<MissingPerson | null>) => {
      state.selectedPerson = action.payload
    },
    setUserLocation: (state, action: PayloadAction<{ lat: number; lng: number } | null>) => {
      state.userLocation = action.payload
    },
    setLocationPermission: (state, action: PayloadAction<"granted" | "denied" | "pending">) => {
      state.locationPermission = action.payload
    },
    setViewMode: (state, action: PayloadAction<"list" | "map">) => {
      state.viewMode = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setFilters: (state, action: PayloadAction<{ filterType: string; value: any }>) => {
      const { filterType, value } = action.payload

      if (filterType === "reset") {
        state.filters = {
          ageRange: [0, 100],
          gender: "all",
          dateRange: "all",
        }
      } else {
        // @ts-ignore - dynamic property access
        state.filters[filterType] = value
      }
    },
    setShowFilters: (state, action: PayloadAction<boolean>) => {
      state.showFilters = action.payload
    },
    setMapCenter: (state, action: PayloadAction<[number, number]>) => {
      state.mapCenter = action.payload
    },
    setMapZoom: (state, action: PayloadAction<number>) => {
      state.mapZoom = action.payload
    },
    setActiveMapLayer: (state, action: PayloadAction<string>) => {
      state.activeMapLayer = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNearbyMissingPersons
      .addCase(fetchNearbyMissingPersons.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNearbyMissingPersons.fulfilled, (state, action) => {
        state.nearbyPersons = action.payload
        state.isLoading = false
      })
      .addCase(fetchNearbyMissingPersons.rejected, (state, action) => {
        state.nearbyPersons = []
        state.isLoading = false
        state.error = action.payload as string
      })

      // fetchOtherMissingPersons
      .addCase(fetchOtherMissingPersons.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOtherMissingPersons.fulfilled, (state, action) => {
        state.otherPersons = action.payload
        state.isLoading = false
      })
      .addCase(fetchOtherMissingPersons.rejected, (state, action) => {
        state.otherPersons = []
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setSelectedPerson,
  setUserLocation,
  setLocationPermission,
  setViewMode,
  setSearchQuery,
  setFilters,
  setShowFilters,
  setMapCenter,
  setMapZoom,
  setActiveMapLayer,
} = missingPersonsSlice.actions

export default missingPersonsSlice.reducer

