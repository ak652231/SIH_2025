import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { SightingReport } from "../../types"

interface SightingReportsState {
  reports: SightingReport[]
  selectedSighting: SightingReport | null
}

const initialState: SightingReportsState = {
  reports: [],
  selectedSighting: null,
}

export const fetchSightingReports = createAsyncThunk(
  "sightingReports/fetchAll",
  async (missingPersonId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/sighting-reports-user?missingPersonId=${missingPersonId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch sighting reports")
      }
      const data = await response.json()

      const reportsWithNotifications = await Promise.all(
        data.map(async (report: SightingReport) => {
          try {
            const notifResponse = await fetch(`/api/notifications/countReports?sightingReportId=${report.id}`)
            if (notifResponse.ok) {
              const notifData = await notifResponse.json()

              const latestNotifResponse = await fetch(`/api/notifications/latest?sightingReportId=${report.id}`)
              let latestNotification = ""
              if (latestNotifResponse.ok) {
                const latestNotifData = await latestNotifResponse.json()
                latestNotification = latestNotifData.message || ""
              }

              const policeResponse = await fetch(`/api/police/details?sightingReportId=${report.id}`)
              let policeDetails = null
              if (policeResponse.ok) {
                const policeData = await policeResponse.json()
                policeDetails = policeData
              }

              return {
                ...report,
                notificationCount: notifData.count,
                latestNotification,
                policeDetails,
              }
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
      return rejectWithValue("Failed to load sighting reports. Please try again later.")
    }
  },
)

export const markNotificationsAsRead = createAsyncThunk(
  "sightingReports/markNotificationsAsRead",
  async (sightingReportId: string, { rejectWithValue }) => {
    try {
      await fetch(`/api/notifications/mark-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sightingReportId }),
      })

      const navbarNotifResponse = await fetch("/api/notifications/count")
      if (navbarNotifResponse.ok) {
        const navbarNotifData = await navbarNotifResponse.json()

        if (typeof window !== "undefined") {
          const event = new CustomEvent("updateNotificationCount", {
            detail: { count: navbarNotifData.count },
          })
          window.dispatchEvent(event)
        }
      }

      return sightingReportId
    } catch (error) {
      return rejectWithValue("Error marking notifications as read")
    }
  },
)

export const handleSightingAction = createAsyncThunk(
  "sightingReports/handleAction",
  async ({ sightingId, action }: { sightingId: string; action: "verify" | "decline" }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/sighting-reports-user/${sightingId}/family-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: action === "verify" ? "CONFIRMED" : "DENIED",
          notes: `Family member ${action === "verify" ? "confirmed" : "denied"} this sighting.`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} sighting report`)
      }

      return {
        sightingId,
        verifiedByFamily: action === "verify" ? true : false,
      }
    } catch (error) {
      return rejectWithValue(`Failed to ${action} sighting report. Please try again.`)
    }
  },
)

export const checkAndAddNewSightingReport = createAsyncThunk(
  "sightingReports/checkAndAddNew",
  async (newSightingReport: SightingReport, { getState }) => {
    const state = getState() as { sightingReports: SightingReportsState }
    
    const exists = state.sightingReports.reports.some(report => report.id === newSightingReport.id)
    
    return {
      sightingReport: newSightingReport,
      exists
    }
  }
)

const sightingReportsSlice = createSlice({
  name: "sightingReports",
  initialState,
  reducers: {
    setSelectedSighting: (state, action: PayloadAction<SightingReport | null>) => {
      state.selectedSighting = action.payload
    },
    updateSightingStatus: (state, action: PayloadAction<{ sightingId: string; status: string }>) => {
      const { sightingId, status } = action.payload

      const reportIndex = state.reports.findIndex((report) => report.id === sightingId)
      if (reportIndex !== -1) {
        state.reports[reportIndex].status = status
      }

      if (state.selectedSighting && state.selectedSighting.id === sightingId) {
        state.selectedSighting.status = status
      }
    },
    incrementNotificationCount: (state, action: PayloadAction<string>) => {
      const sightingId = action.payload
      const report = state.reports.find((r) => r.id === sightingId)
      if (report) {
        report.notificationCount = (report.notificationCount || 0) + 1
      }
    },
    addNewSightingReport: (state, action: PayloadAction<SightingReport>) => {
      const newReport = {
        ...action.payload,
        notificationCount: 1
      }
      state.reports.push(newReport)
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSightingReports.fulfilled, (state, action) => {
        state.reports = action.payload
        if (action.payload.length > 0 && !state.selectedSighting) {
          state.selectedSighting = action.payload[0]
        }
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const sightingId = action.payload
        const report = state.reports.find((r) => r.id === sightingId)
        if (report) {
          report.notificationCount = 0
        }
      })
      .addCase(handleSightingAction.fulfilled, (state, action) => {
        const { sightingId, verifiedByFamily } = action.payload

        const reportIndex = state.reports.findIndex((report) => report.id === sightingId)
        if (reportIndex !== -1) {
          state.reports[reportIndex].verifiedByFamily = verifiedByFamily ? "true" : "false"
        }

        if (state.selectedSighting && state.selectedSighting.id === sightingId) {
          state.selectedSighting.verifiedByFamily = verifiedByFamily ? "true" : "false"
        }
      })
      .addCase(checkAndAddNewSightingReport.fulfilled, (state, action) => {
        const { sightingReport, exists } = action.payload
        
        if (!exists) {
          state.reports.push({
            ...sightingReport,
            notificationCount: 1 
          })
        }
      })
  },
})

export const { 
  setSelectedSighting, 
  updateSightingStatus, 
  incrementNotificationCount,
  addNewSightingReport 
} = sightingReportsSlice.actions

export default sightingReportsSlice.reducer