import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { connectSocket, getSocket } from '../sockets/socket';
import ChatWindow from '../components/ChatWindow';
import { selectConversation } from '../features/conversations/convoSlice';
import type { RootState } from '../app/store';
import Layout from '../components/Layout';

export default function ChatPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const { convoId } = useParams();

  useEffect(() => {
    if (token && !getSocket()) {
      connectSocket(token);
    }
  }, [token]);

  useEffect(() => {
    if (convoId) {
      dispatch(selectConversation(convoId));
    }
  }, [convoId, dispatch]);

  return (
    // <Layout>
      <ChatWindow />
    // </Layout>
  );
}