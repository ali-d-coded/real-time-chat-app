import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    username: string;
  };
  content: string;
  timestamp: string;
}

interface MessageState {
  messages: Message[];
}

const initialState: MessageState = {
  messages: [],
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setMessages, addMessage } = messageSlice.actions;
export default messageSlice.reducer;