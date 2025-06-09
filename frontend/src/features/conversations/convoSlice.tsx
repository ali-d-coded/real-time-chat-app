import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ConvoState {
  selectedId: string | null;
}

const initialState: ConvoState = {
  selectedId: null,
};

const convoSlice = createSlice({
  name: 'convo',
  initialState,
  reducers: {
    selectConversation: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
  },
});

export const { selectConversation } = convoSlice.actions;
export default convoSlice.reducer;