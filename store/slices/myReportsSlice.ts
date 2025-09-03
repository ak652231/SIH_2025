import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { MissingPerson } from "../../types"

interface MyReportsState {
  reports: MissingPerson[]
  searchQuery: string
}

const initialState: MyReportsState = {
  reports: [],
  searchQuery: "",
}

export const fetchMyReports = createAsyncThunk("myReports/fetchAll", async (userId: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/my-reports`)
    if (!response.ok) {
      throw new Error("Failed to fetch your reports")
    }

    const data = await response.json()

    const reportsWithNotifications = await Promise.all(
      data.map(async (report: MissingPerson) => {
        try {
          const notifResponse = await fetch(
            `/api/notifications/countReports?missingPersonId=${report.id}&userId=${userId}`,
          )
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
    return rejectWithValue("Failed to load your reports. Please try again later.")
  }
})

const myReportsSlice = createSlice({
  name: "myReports",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    updateReportStatus: (
      state,
      action: PayloadAction<{
        missingPersonId: string
        status: string
        notificationIncrement?: boolean
      }>,
    ) => {
      const { missingPersonId, status, notificationIncrement = true } = action.payload
      const report = state.reports.find((r) => r.id === missingPersonId)

      if (report) {
        report.status = status
        if (notificationIncrement) {
          report.notificationCount = (report.notificationCount || 0) + 1
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMyReports.fulfilled, (state, action) => {
      state.reports = action.payload
    })
  },
})

export const { setSearchQuery, updateReportStatus } = myReportsSlice.actions
export default myReportsSlice.reducer

