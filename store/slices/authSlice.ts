import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import Cookies from "js-cookie"

interface AuthState {
  userId: string
  isAuthenticated: boolean
}

const initialState: AuthState = {
  userId: "",
  isAuthenticated: false,
}

export const checkUserLogin = createAsyncThunk("auth/checkUserLogin", async (_, { rejectWithValue }) => {
  try {
    const token = Cookies.get("sessionToken")
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]))
        return decoded.id
      } catch (error) {
        return rejectWithValue("Error decoding token")
      }
    } else {
      return rejectWithValue("No token found")
    }
  } catch (error) {
    return rejectWithValue("Error verifying token")
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUserLogin.fulfilled, (state, action) => {
        state.userId = action.payload as string
        state.isAuthenticated = true
      })
      .addCase(checkUserLogin.rejected, (state) => {
        state.userId = ""
        state.isAuthenticated = false
      })
  },
})

export const { setUserId, setAuthenticated } = authSlice.actions
export default authSlice.reducer

