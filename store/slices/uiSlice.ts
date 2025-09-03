import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UIState {
  isLoading: boolean
  error: string | null
  mousePosition: { x: number; y: number }
}

const initialState: UIState = {
  isLoading: true,
  error: null,
  mousePosition: { x: 0, y: 0 },
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setMousePosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.mousePosition = action.payload
    },
  },
})

export const { setLoading, setError, setMousePosition } = uiSlice.actions
export default uiSlice.reducer

