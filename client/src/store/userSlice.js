import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { register, login, logout, getProfile } from '../services/userService';

// Async actions
export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async (_, thunkAPI) => {
  try {
    return await getProfile();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const userLogin = createAsyncThunk('user/login', async ({ username, password }, thunkAPI) => {
  try {
    return await login(username, password);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const userRegister = createAsyncThunk('user/register', async ({ username, password, confirmPassword }, thunkAPI) => {
  try {
    return await register(username, password, confirmPassword);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const userLogout = createAsyncThunk('user/logout', async (_, thunkAPI) => {
  try {
    return await logout();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(userLogin.pending, (state) => {
        state.loading = true;
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(userRegister.pending, (state) => {
        state.loading = true;
      })
      .addCase(userRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(userRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(userLogout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;