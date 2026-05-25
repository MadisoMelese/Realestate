import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

// Async thunks for transaction actions
export const createTransaction = createAsyncThunk(
  'transaction/createTransaction',
  async (transactionData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post('/transactions', transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const completeTransaction = createAsyncThunk(
  'transaction/completeTransaction',
  async ({ transactionId, paymentMethod }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(
        `/transactions/${transactionId}/complete`,
        { paymentMethod },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchUserTransactions = createAsyncThunk(
  'transaction/fetchUserTransactions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get('/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transaction/fetchTransactionById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const cancelTransaction = createAsyncThunk(
  'transaction/cancelTransaction',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`/transactions/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchSellerBankInfo = createAsyncThunk(
  'transaction/fetchSellerBankInfo',
  async (transactionId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`/transactions/${transactionId}/seller-bank`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch bank info' });
    }
  }
);

export const confirmTransaction = createAsyncThunk(
  'transaction/confirmTransaction',
  async (transactionId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`/transactions/${transactionId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to confirm transaction' });
    }
  }
);

export const rejectTransaction = createAsyncThunk(
  'transaction/rejectTransaction',
  async ({ transactionId, reason = '' }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`/transactions/${transactionId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to reject transaction' });
    }
  }
);

export const fetchTransactionContact = createAsyncThunk(
  'transaction/fetchTransactionContact',
  async (transactionId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`/transactions/${transactionId}/contact`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch contact info' });
    }
  }
);

export const uploadPaymentReceipt = createAsyncThunk(
  'transaction/uploadPaymentReceipt',
  async ({ transactionId, file }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      formData.append('receipt', file);
      const response = await axios.post(
        `/transactions/${transactionId}/upload-receipt`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to upload receipt' });
    }
  }
);

// Initial state
const initialState = {
  transactions: [],
  currentTransaction: null,
  loading: false,
  error: null,
  paymentIntent: null,
  sellerBankInfo: null,
  bankInfoLoading: false,
  receiptUploading: false
};

// Transaction slice
const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPaymentIntent: (state, action) => {
      state.paymentIntent = action.payload;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
    clearSellerBankInfo: (state) => {
      state.sellerBankInfo = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        // backend returns the transaction object directly
        const tx = action.payload.transaction ?? action.payload;
        state.transactions.unshift(tx);
        state.currentTransaction = tx;
        state.paymentIntent = action.payload.clientSecret
          ? { clientSecret: action.payload.clientSecret }
          : null;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create transaction';
      })
      // Complete transaction
      .addCase(completeTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(
          t => t._id === action.payload.transaction._id
        );
        if (index !== -1) {
          state.transactions[index] = action.payload.transaction;
        }
        state.currentTransaction = action.payload.transaction;
        state.paymentIntent = null;
      })
      .addCase(completeTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to complete transaction';
      })
      // Fetch user transactions
      .addCase(fetchUserTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchUserTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch transactions';
      })
      // Fetch single transaction
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch transaction';
      })
      // Cancel transaction
      .addCase(cancelTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(
          t => t._id === action.payload.transaction._id
        );
        if (index !== -1) {
          state.transactions[index] = action.payload.transaction;
        }
        if (state.currentTransaction?._id === action.payload.transaction._id) {
          state.currentTransaction = action.payload.transaction;
        }
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to cancel transaction';
      })
      // Fetch seller bank info
      .addCase(fetchSellerBankInfo.pending, (state) => {
        state.bankInfoLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerBankInfo.fulfilled, (state, action) => {
        state.bankInfoLoading = false;
        state.sellerBankInfo = action.payload;
      })
      .addCase(fetchSellerBankInfo.rejected, (state, action) => {
        state.bankInfoLoading = false;
        state.error = action.payload?.message || 'Failed to fetch bank info';
      })
      // Upload payment receipt
      .addCase(uploadPaymentReceipt.pending, (state) => {
        state.receiptUploading = true;
        state.error = null;
      })
      .addCase(uploadPaymentReceipt.fulfilled, (state, action) => {
        state.receiptUploading = false;
        const updated = action.payload.transaction;
        const index = state.transactions.findIndex(t => t._id === updated._id);
        if (index !== -1) state.transactions[index] = updated;
        state.currentTransaction = updated;
        state.sellerBankInfo = null;
      })
      .addCase(uploadPaymentReceipt.rejected, (state, action) => {
        state.receiptUploading = false;
        state.error = action.payload?.message || 'Failed to upload receipt';
      })
      // Confirm transaction (seller)
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        const updated = action.payload.transaction;
        const index = state.transactions.findIndex(t => t._id === updated._id);
        if (index !== -1) state.transactions[index] = updated;
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to confirm transaction';
      })
      // Reject transaction (seller)
      .addCase(rejectTransaction.fulfilled, (state, action) => {
        const updated = action.payload.transaction;
        const index = state.transactions.findIndex(t => t._id === updated._id);
        if (index !== -1) state.transactions[index] = updated;
      })
      .addCase(rejectTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to reject transaction';
      });
  }
});

export const { clearError, setPaymentIntent, clearPaymentIntent, clearSellerBankInfo } = transactionSlice.actions;
export default transactionSlice.reducer;