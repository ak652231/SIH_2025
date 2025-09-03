import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { MissingPerson } from "../../types"

interface MissingPersonState {
  data: MissingPerson | null
}

const initialState: MissingPersonState = {
  data: null,
}

export const fetchMissingPersonDetails = createAsyncThunk(
  "missingPerson/fetchDetails",
  async ({ id, userId }: { id: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/missing-persons/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch missing person details")
      }
      const data = await response.json()

      if (data.userId !== userId) {
        return rejectWithValue("Unauthorized access to this report")
      }

      return data
    } catch (error) {
      return rejectWithValue("Failed to load missing person details. Please try again later.")
    }
  },
)

const missingPersonSlice = createSlice({
  name: "missingPerson",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMissingPersonDetails.fulfilled, (state, action) => {
        state.data = action.payload
      })
      .addCase(fetchMissingPersonDetails.rejected, (state) => {
        state.data = null
      })
  },
})

export default missingPersonSlice.reducer

