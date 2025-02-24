import { createSlice, current } from "@reduxjs/toolkit"

const initialState = {
  messages: [],
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    
    setMessages: (state, action) => {
      state.messages = action.payload;
      console.log("setMessages", current(state).messages);
    },

  },
});

export const { 
  setMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
