import { createSlice, current } from "@reduxjs/toolkit";
import { addMessage } from "@/redux/actions/messageActions";

const initialState = {
  messages: [],
  allTags: [],
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    
    setMessages: (state, action) => {
      state.messages = action.payload;
      console.log("setMessages", current(state).messages);
    },

    setAllTags: (state, action) => {
      state.allTags = action.payload;
      console.log("setAllTags", current(state).allTags);
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(addMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMessage.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;  // store the error message
      });
  },
});

export const { 
  setMessages,
  setAllTags,
} = messageSlice.actions;

export default messageSlice.reducer;
