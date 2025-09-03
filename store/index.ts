import { configureStore } from "@reduxjs/toolkit"
import missingPersonReducer from "./slices/missingPersonSlice"
import sightingReportsReducer from "./slices/sightingReportsSlice"
import notificationsReducer from "./slices/notificationsSlice"
import authReducer from "./slices/authSlice"
import uiReducer from "./slices/uiSlice"
import myReportsReducer from "./slices/myReportsSlice"
import policeDashboardReducer from "./slices/policeDashboardSlice"
import policeSightingsReducer from "./slices/policeSightingsSlice"
import sightingReportDetailReducer from "./slices/sightingReportDetailSlice"
import missingPersonsReducer from "./slices/missingPersonsSlice"

export const store = configureStore({
  reducer: {
    missingPerson: missingPersonReducer,
    sightingReports: sightingReportsReducer,
    notifications: notificationsReducer,
    auth: authReducer,
    ui: uiReducer,
    myReports: myReportsReducer,
    policeDashboard: policeDashboardReducer,
    policeSightings: policeSightingsReducer,
    sightingReportDetail: sightingReportDetailReducer,
    missingPersons: missingPersonsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

