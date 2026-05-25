import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchAdminStats = createAsyncThunk(
  'admin/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch stats' });
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/users', { params: { page, limit: 20, search } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch users' });
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update role' });
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await axios.delete(`/admin/users/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete user' });
    }
  }
);

export const fetchAdminProperties = createAsyncThunk(
  'admin/fetchProperties',
  async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/properties', { params: { page, limit: 20, search } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch properties' });
    }
  }
);

export const deleteAdminProperty = createAsyncThunk(
  'admin/deleteProperty',
  async (propertyId, { rejectWithValue }) => {
    try {
      await axios.delete(`/admin/properties/${propertyId}`);
      return propertyId;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete property' });
    }
  }
);

export const fetchAdminTransactions = createAsyncThunk(
  'admin/fetchTransactions',
  async ({ page = 1, status = '', search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/transactions', { params: { page, limit: 20, status, search } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transactions' });
    }
  }
);

export const fetchAdminActivity = createAsyncThunk(
  'admin/fetchActivity',
  async ({ limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/activity', { params: { limit } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch activity' });
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: null,
    users: [],
    userTotal: 0,
    userPage: 1,
    userTotalPages: 1,
    properties: [],
    propertyTotal: 0,
    propertyPage: 1,
    propertyTotalPages: 1,
    transactions: [],
    transactionTotal: 0,
    transactionPage: 1,
    transactionTotalPages: 1,
    activity: [],
    activityLoading: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearAdminError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'An error occurred';
    };

    builder
      .addCase(fetchAdminStats.pending, pending)
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, rejected)

      .addCase(fetchAdminUsers.pending, pending)
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.userTotal = action.payload.total;
        state.userPage = action.payload.page;
        state.userTotalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminUsers.rejected, rejected)

      .addCase(updateUserRole.fulfilled, (state, action) => {
        const idx = state.users.findIndex(u => u._id === action.payload.user._id);
        if (idx !== -1) state.users[idx] = action.payload.user;
      })
      .addCase(updateUserRole.rejected, rejected)

      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
        state.userTotal = Math.max(0, state.userTotal - 1);
      })
      .addCase(deleteUser.rejected, rejected)

      .addCase(fetchAdminProperties.pending, pending)
      .addCase(fetchAdminProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties;
        state.propertyTotal = action.payload.total;
        state.propertyPage = action.payload.page;
        state.propertyTotalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminProperties.rejected, rejected)

      .addCase(deleteAdminProperty.fulfilled, (state, action) => {
        state.properties = state.properties.filter(p => p._id !== action.payload);
        state.propertyTotal = Math.max(0, state.propertyTotal - 1);
      })
      .addCase(deleteAdminProperty.rejected, rejected)

      .addCase(fetchAdminTransactions.pending, pending)
      .addCase(fetchAdminTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.transactionTotal = action.payload.total;
        state.transactionPage = action.payload.page;
        state.transactionTotalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminTransactions.rejected, rejected)

      .addCase(fetchAdminActivity.pending, (state) => { state.activityLoading = true; })
      .addCase(fetchAdminActivity.fulfilled, (state, action) => {
        state.activityLoading = false;
        state.activity = action.payload.events;
      })
      .addCase(fetchAdminActivity.rejected, (state, action) => {
        state.activityLoading = false;
        state.error = action.payload?.message || 'Failed to fetch activity';
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
