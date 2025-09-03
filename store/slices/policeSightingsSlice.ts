import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { SightingReport } from "../../types"

export enum PoliceActionType {
  NOTIFIED_FAMILY = "NOTIFIED_FAMILY",
  SENT_TEAM = "SENT_TEAM",
  SOLVED = "SOLVED",
  REJECT = "REJECT",
}

interface PoliceSightingsState {
  sightingReports: SightingReport[]
  filteredReports: SightingReport[]
  selectedReport: SightingReport | null
  searchTerm: string
  statusFilter: string
  dateFilter: string
  showFilters: boolean
  mapCenter: [number, number] | null
  mapZoom: number
  error: string | null
}

const initialState: PoliceSightingsState = {
  sightingReports: [],
  filteredReports: [],
  selectedReport: null,
  searchTerm: "",
  statusFilter: "All",
  dateFilter: "All",
  showFilters: false,
  mapCenter: null,
  mapZoom: 12,
  error: null,
}

export const fetchSightingReports = createAsyncThunk(
  "policeSightings/fetchSightingReports",
  async ({ userId, missingPersonId }: { userId: string; missingPersonId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/police/sighting-reports?policeId=${userId}&missingpersonId=${missingPersonId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch sighting reports: ${response.status}`)
      }

      const data = await response.json()

      const reportsWithNotifications = await Promise.all(
        data.map(async (report: SightingReport) => {
          try {
            const notifResponse = await fetch(`/api/notifications/countReports?sightingReportId=${report.id}`)
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
      return rejectWithValue("Failed to load sighting reports. Please try again.")
    }
  },
)

export const markNotificationsAsRead = createAsyncThunk(
  "policeSightings/markNotificationsAsRead",
  async (sightingReportId: string, { rejectWithValue }) => {
    try {
      await fetch(`/api/notifications/mark-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sightingReportId }),
      })

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

      return sightingReportId
    } catch (error) {
      return rejectWithValue("Error marking notifications as read")
    }
  },
)

const policeSightingsSlice = createSlice({
  name: "policeSightings",
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
      applyFilters(state)
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload
      applyFilters(state)
    },
    setDateFilter: (state, action: PayloadAction<string>) => {
      state.dateFilter = action.payload
      applyFilters(state)
    },
    toggleFilters: (state) => {
      state.showFilters = !state.showFilters
    },
    resetFilters: (state) => {
      state.searchTerm = ""
      state.statusFilter = "All"
      state.dateFilter = "All"
      state.filteredReports = state.sightingReports
    },
    setSelectedReport: (state, action: PayloadAction<SightingReport | null>) => {
      state.selectedReport = action.payload
      if (action.payload) {
        state.mapCenter = [action.payload.sightingLat, action.payload.sightingLng]
        state.mapZoom = 15
      }
    },
    incrementNotificationCount: (state, action: PayloadAction<string>) => {
      const sightingReportId = action.payload

      // Update in sightingReports array
      const report = state.sightingReports.find((r) => r.id === sightingReportId)
      if (report) {
        report.notificationCount = (report.notificationCount || 0) + 1
      }

      // Update in filteredReports array
      const filteredReport = state.filteredReports.find((r) => r.id === sightingReportId)
      if (filteredReport) {
        filteredReport.notificationCount = (filteredReport.notificationCount || 0) + 1
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSightingReports.pending, (state) => {
        state.error = null
      })
      .addCase(fetchSightingReports.fulfilled, (state, action) => {
        state.sightingReports = action.payload
        state.filteredReports = action.payload

        if (action.payload.length > 0) {
          state.mapCenter = [action.payload[0].sightingLat, action.payload[0].sightingLng]
        }
      })
      .addCase(fetchSightingReports.rejected, (state, action) => {
        state.error = action.payload as string
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const sightingReportId = action.payload

        // Update in sightingReports array
        const report = state.sightingReports.find((r) => r.id === sightingReportId)
        if (report) {
          report.notificationCount = 0
        }

        // Update in filteredReports array
        const filteredReport = state.filteredReports.find((r) => r.id === sightingReportId)
        if (filteredReport) {
          filteredReport.notificationCount = 0
        }
      })
  },
})

// Helper function to apply filters
const applyFilters = (state: PoliceSightingsState) => {
  let results = [...state.sightingReports]

  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase()
    results = results.filter(
      (report) =>
        report.missingPerson?.fullName?.toLowerCase().includes(term) ||
        report.locationDetails?.toLowerCase().includes(term) ||
        report.appearanceNotes?.toLowerCase().includes(term) ||
        report.identifyingMarks?.toLowerCase().includes(term),
    )
  }

  if (state.statusFilter !== "All") {
    results = results.filter((report) => report.status === state.statusFilter)
  }

  if (state.dateFilter !== "All") {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (state.dateFilter === "Today") {
      results = results.filter((report) => {
        const reportDate = new Date(report.sightingDate)
        return reportDate >= today
      })
    } else if (state.dateFilter === "Last 7 days") {
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      results = results.filter((report) => {
        const reportDate = new Date(report.sightingDate)
        return reportDate >= lastWeek
      })
    } else if (state.dateFilter === "Last 30 days") {
      const lastMonth = new Date(today)
      lastMonth.setDate(lastMonth.getDate() - 30)

      results = results.filter((report) => {
        const reportDate = new Date(report.sightingDate)
        return reportDate >= lastMonth
      })
    }
  }

  state.filteredReports = results
}

export const {
  setSearchTerm,
  setStatusFilter,
  setDateFilter,
  toggleFilters,
  resetFilters,
  setSelectedReport,
  incrementNotificationCount,
} = policeSightingsSlice.actions
export default policeSightingsSlice.reducer

