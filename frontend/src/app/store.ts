import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import authReducer from '../features/auth/authSlice';
import convoReducer from '../features/conversations/convoSlice';
import messageReducer from '../features/messages/messageSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
};

const rootReducer = combineReducers({
  auth: authReducer,
  convo: convoReducer,
  messages: messageReducer,
});

// Then wrap the combined reducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE', 
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
          'persist/PAUSE'
        ],
      },
    }),
});

// Create persistor object for use in the app
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;