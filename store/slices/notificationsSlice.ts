import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Notification } from "../../types"

interface NotificationsState {
  notifications: Notification[]
}

const initialState: NotificationsState = {
  notifications: [],
}

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (
    { missingPersonId, sightingReportId }: { missingPersonId?: string; sightingReportId?: string },
    { rejectWithValue },
  ) => {
    try {
      const url = sightingReportId
        ? `/api/notifications?sightingReportId=${sightingReportId}`
        : `/api/notifications?missingPersonId=${missingPersonId}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        return data.notifications
      }
      return []
    } catch (error) {
      return rejectWithValue("Error fetching notifications")
    }
  },
)

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload
    })
  },
})

export const { addNotification } = notificationsSlice.actions
export default notificationsSlice.reducer

