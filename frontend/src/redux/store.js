import { configureStore } from '@reduxjs/toolkit';
import messageReducer from './reducers/messageReducer';

export const store = configureStore({
  reducer: {
    messageReducer
  },
});
