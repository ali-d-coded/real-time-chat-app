// --- conversationsSlice.ts ---
// src/features/conversations/conversationsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Conversation {
  _id: string;
  name?: string;
  type: 'private' | 'group';
  participants: { _id: string; username: string; isOnline: boolean }[];
}

interface ConversationsState {
  list: Conversation[];
}

const initialState: ConversationsState = {
  list: [],
};

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.list = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.list.unshift(action.payload);
    },
  },
});

export const { setConversations, addConversation } = conversationsSlice.actions;
export default conversationsSlice.reducer;
