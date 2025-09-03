import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { MissingPerson } from "../../types"

interface PoliceDashboardState {
  assignedReports: MissingPerson[]
  searchQuery: string
  statusFilter: string
  selectedReport: MissingPerson | null
  currentPhotoIndex: number
  showModal: boolean
  modalViewMode: "details" | "map"
  userLocation: { lat: number; lng: number } | null
}

const initialState: PoliceDashboardState = {
  assignedReports: [],
  searchQuery: "",
  statusFilter: "all",
  selectedReport: null,
  currentPhotoIndex: 0,
  showModal: false,
  modalViewMode: "details",
  userLocation: null,
}

export const fetchAssignedReports = createAsyncThunk(
  "policeDashboard/fetchAssignedReports",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/police/assigned-reports")

      if (!response.ok) {
        throw new Error("Failed to fetch assigned reports")
      }

      const data = await response.json()

      const reportsWithNotifications = await Promise.all(
        data.map(async (report: MissingPerson) => {
          try {
            const notifResponse = await fetch(`/api/notifications/countSighting?missingPersonId=${report.id}`)
            if (notifResponse.ok) {
              const notifData = await notifResponse.json()
              return { ...report, notificationCount: notifData.count }
            }
            return { ...report, notificationCount: 0 }
          } catch (error) {
            console.error(`Error fetching notifications for report ${report.id}:`, error)
            return { ...report, notificationCount: 0 }
          }
        }),
      )

      return reportsWithNotifications
    } catch (error) {
      return rejectWithValue("Failed to load assigned reports. Please try again later.")
    }
  },
)

export const markReportAsSeen = createAsyncThunk(
  "policeDashboard/markReportAsSeen",
  async (reportId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/police/mark-missing-seen/${reportId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to mark report as seen")
      }

      // Update navbar notification count
      try {
        const notifResponse = await fetch("/api/police/total-notification-count")
        if (notifResponse.ok) {
          const data = await notifResponse.json()
          if (typeof window !== "undefined") {
            const event = new CustomEvent("updateNotificationCount", {
              detail: { count: data.count },
            })
            window.dispatchEvent(event)
          }
        }
      } catch (error) {
        console.error("Error updating navbar notification count:", error)
      }

      return reportId
    } catch (error) {
      return rejectWithValue("Failed to mark report as seen")
    }
  },
)

export const getUserLocation = createAsyncThunk("policeDashboard/getUserLocation", async (_, { rejectWithValue }) => {
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          reject(error)
        },
      )
    } else {
      reject(new Error("Geolocation is not supported by this browser."))
    }
  }).catch((error) => {
    console.error("Error getting user location:", error)
    return rejectWithValue("Failed to get user location")
  })
})

const policeDashboardSlice = createSlice({
  name: "policeDashboard",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload
    },
    setSelectedReport: (state, action: PayloadAction<MissingPerson | null>) => {
      state.selectedReport = action.payload
      state.currentPhotoIndex = 0
    },
    setShowModal: (state, action: PayloadAction<boolean>) => {
      state.showModal = action.payload
    },
    setModalViewMode: (state, action: PayloadAction<"details" | "map">) => {
      state.modalViewMode = action.payload
    },
    setCurrentPhotoIndex: (state, action: PayloadAction<number>) => {
      state.currentPhotoIndex = action.payload
    },
    nextPhoto: (state) => {
      if (state.selectedReport && state.currentPhotoIndex < state.selectedReport.additionalPhotos.length - 1) {
        state.currentPhotoIndex += 1
      }
    },
    prevPhoto: (state) => {
      if (state.currentPhotoIndex > 0) {
        state.currentPhotoIndex -= 1
      }
    },
    incrementNotificationCount: (state, action: PayloadAction<string>) => {
      const missingId = action.payload
      const report = state.assignedReports.find((r) => r.id === missingId)
      if (report) {
        report.notificationCount = (report.notificationCount || 0) + 1
      }
    },
    clearFilters: (state) => {
      state.searchQuery = ""
      state.statusFilter = "all"
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignedReports.fulfilled, (state, action) => {
        state.assignedReports = action.payload
      })
      .addCase(markReportAsSeen.fulfilled, (state, action) => {
        const reportId = action.payload
        const report = state.assignedReports.find((r) => r.id === reportId)
        if (report) {
          report.isSeen = true
        }
      })
      .addCase(getUserLocation.fulfilled, (state, action) => {
        state.userLocation = action.payload
      })
  },
})

export const {
  setSearchQuery,
  setStatusFilter,
  setSelectedReport,
  setShowModal,
  setModalViewMode,
  setCurrentPhotoIndex,
  nextPhoto,
  prevPhoto,
  incrementNotificationCount,
  clearFilters,
} = policeDashboardSlice.actions
export default policeDashboardSlice.reducer

