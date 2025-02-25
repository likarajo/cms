import { configureStore } from '@reduxjs/toolkit';
import messageReducer from './reducers/messageReducer';

export const store = configureStore({
  reducer: {
    messageReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ // for async
    serializableCheck: {
      ignoredActions: [],
    }
  }),
});
