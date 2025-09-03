import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { SightingReport } from "../../types"

export enum PoliceActionType {
  NOTIFIED_FAMILY = "NOTIFIED_FAMILY",
  SENT_TEAM = "SENT_TEAM",
  SOLVED = "SOLVED",
  REJECT = "REJECT",
}

interface TimelineEvent {
  date: string
  title: string
  description: string
  icon: any
  color: string
}

interface SightingReportDetailState {
  report: SightingReport | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  activeTab: "details" | "timeline" | "map" | "actions"
  expandedSections: {
    missingPerson: boolean
    sightingDetails: boolean
    photoEvidence: boolean
    familyInteractions: boolean
    policeActions: boolean
  }
  mapMarkers: Array<{
    id: string
    position: [number, number]
    title: string
    status: string
    isSelected: boolean
  }>
  timelineEvents: TimelineEvent[]
}

const initialState: SightingReportDetailState = {
  report: null,
  isLoading: true,
  isUpdating: false,
  error: null,
  activeTab: "details",
  expandedSections: {
    missingPerson: true,
    sightingDetails: true,
    photoEvidence: true,
    familyInteractions: true,
    policeActions: true,
  },
  mapMarkers: [],
  timelineEvents: [],
}

export const fetchSightingReportDetail = createAsyncThunk(
  "sightingReportDetail/fetchReport",
  async (reportId: string, { rejectWithValue }) => {
    try {
      console.log("Fetching report with ID:", reportId)
      const response = await fetch(`/api/sighting-reports/${reportId}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error:", errorText)
        throw new Error(`Failed to fetch report: ${response.status}`)
      }

      const data = await response.json()
      console.log("Report data fetched successfully")
      return data
    } catch (error) {
      console.error("Error in fetchSightingReportDetail:", error)
      return rejectWithValue("Failed to load report details. Please try again.")
    }
  },
)

export const updateReportStatus = createAsyncThunk(
  "sightingReportDetail/updateStatus",
  async (
    {
      reportId,
      status,
      policeId,
      missingPersonId,
      missingPersonUserId,
    }: {
      reportId: string
      status: string
      policeId: string
      missingPersonId: string
      missingPersonUserId: string
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/police/update-report-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          status,
          policeId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update report status: ${response.status}`)
      }

      let notificationMessage = ""

      switch (status) {
        case PoliceActionType.NOTIFIED_FAMILY:
          notificationMessage = "A new suspect has been found. Please verify if this is your missing person."
          break
        case PoliceActionType.SENT_TEAM:
          notificationMessage = "Police have started an investigation on your sighting report."
          break
        case PoliceActionType.SOLVED:
          notificationMessage = "Your missing person case has been marked as solved by the police."
          break
        case PoliceActionType.REJECT:
          notificationMessage = "Your sighting report has been closed by the police."
          break
      }

      if (notificationMessage) {
        await fetch("/api/notifications/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: missingPersonUserId,
            sightingReportId: reportId,
            missingPersonId,
            type: "POLICE_ACTION_UPDATE",
            message: notificationMessage,
            status,
          }),
        })
      }

      return { status }
    } catch (error) {
      return rejectWithValue("Failed to update report status. Please try again.")
    }
  },
)

const sightingReportDetailSlice = createSlice({
  name: "sightingReportDetail",
  initialState,
  reducers: {
    setReport: (state, action: PayloadAction<SightingReport>) => {
      state.report = action.payload
      state.isLoading = false

      // Set map markers
      const markers = []

      markers.push({
        id: "sighting",
        position: [action.payload.sightingLat, action.payload.sightingLng],
        title: "Sighting Location",
        status: action.payload.status,
        isSelected: true,
      })

      if (action.payload.missingPerson?.lat && action.payload.missingPerson?.lng) {
        markers.push({
          id: "lastSeen",
          position: [action.payload.missingPerson.lat, action.payload.missingPerson.lng],
          title: "Last Seen Location",
          status: "lastSeen",
          isSelected: false,
        })
      }

      state.mapMarkers = markers

      // Generate timeline events
      state.timelineEvents = generateTimelineEvents(action.payload)
    },
    setActiveTab: (state, action: PayloadAction<"details" | "timeline" | "map" | "actions">) => {
      state.activeTab = action.payload
    },
    toggleSection: (state, action: PayloadAction<keyof SightingReportDetailState["expandedSections"]>) => {
      state.expandedSections[action.payload] = !state.expandedSections[action.payload]
    },
    updateFamilyInteraction: (state, action: PayloadAction<{ response: string }>) => {
      if (state.report) {
        state.report.familyInteractions = {
          ...state.report.familyInteractions,
          response: action.payload.response,
        }

        // Update timeline events
        state.timelineEvents = generateTimelineEvents(state.report)
      }
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSightingReportDetail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSightingReportDetail.fulfilled, (state, action) => {
        state.report = action.payload
        state.isLoading = false

        // Set map markers
        const markers = []

        markers.push({
          id: "sighting",
          position: [action.payload.sightingLat, action.payload.sightingLng],
          title: "Sighting Location",
          status: action.payload.status,
          isSelected: true,
        })

        if (action.payload.missingPerson?.lat && action.payload.missingPerson?.lng) {
          markers.push({
            id: "lastSeen",
            position: [action.payload.missingPerson.lat, action.payload.missingPerson.lng],
            title: "Last Seen Location",
            status: "lastSeen",
            isSelected: false,
          })
        }

        state.mapMarkers = markers

        // Generate timeline events
        state.timelineEvents = generateTimelineEvents(action.payload)
      })
      .addCase(fetchSightingReportDetail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateReportStatus.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        if (state.report) {
          state.report.status = action.payload.status
        }
        state.isUpdating = false
      })
      .addCase(updateReportStatus.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
  },
})

// Helper function to generate timeline events
const generateTimelineEvents = (report: SightingReport): TimelineEvent[] => {
  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const timelineEvents: TimelineEvent[] = []

  if (report.missingPerson?.createdAt) {
    timelineEvents.push({
      date: formatDateTime(report.missingPerson.createdAt),
      title: "Missing Person Reported",
      description: `${report.missingPerson.reporterName} reported ${report.missingPerson.fullName} as missing.`,
      icon: "AlertCircle",
      color: "bg-red-500",
    })
  }

  timelineEvents.push({
    date: formatDateTime(report.createdAt),
    title: "Sighting Reported",
    description: `${report.reporter?.name || "Anonymous"} reported seeing the missing person at ${report.locationDetails}.`,
    icon: "Eye",
    color: "bg-blue-500",
  })

  if (report.policeActions) {
    const actionTitle =
      report.policeActions.actionTaken === "NOTIFIED_FAMILY"
        ? "Family Notified"
        : report.policeActions.actionTaken === "SENT_TEAM"
          ? "Investigation Team Dispatched"
          : "Case Closed"

    const actionIcon =
      report.policeActions.actionTaken === "NOTIFIED_FAMILY"
        ? "Bell"
        : report.policeActions.actionTaken === "SENT_TEAM"
          ? "Users"
          : "FileCheck"

    timelineEvents.push({
      date: formatDateTime(report.policeActions.createdAt),
      title: actionTitle,
      description: report.policeActions.remarks || `Police officer took action: ${actionTitle}`,
      icon: actionIcon,
      color: "bg-indigo-500",
    })
  }

  if (report.familyInteractions) {
    timelineEvents.push({
      date: formatDateTime(report.familyInteractions.createdAt),
      title:
        report.familyInteractions.response === "CONFIRMED" ? "Family Confirmed Sighting" : "Family Denied Sighting",
      description:
        report.familyInteractions.notes ||
        `Family ${report.familyInteractions.response === "CONFIRMED" ? "confirmed" : "denied"} this sighting report.`,
      icon: report.familyInteractions.response === "CONFIRMED" ? "CheckCircle" : "XCircle",
      color: report.familyInteractions.response === "CONFIRMED" ? "bg-green-500" : "bg-red-500",
    })
  }

  return timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export const { setReport, setActiveTab, toggleSection, updateFamilyInteraction, resetState } =
  sightingReportDetailSlice.actions
export default sightingReportDetailSlice.reducer

