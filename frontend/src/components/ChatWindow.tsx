import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '../api/axios';
import { getSocket } from '../sockets/socket';
import MessageInput from './MessageInput';
import type { RootState } from '../app/store';
import { addMessage, setMessages } from '../features/messages/messageSlice';

export default function ChatWindow() {
  const dispatch = useDispatch();
  const conversationId = useSelector((state: RootState) => state.convo.selectedId);
  console.log({conversationId});
  
  const messages = useSelector((state: RootState) => state.messages.messages);
  

  useEffect(() => {
    if (conversationId) {
      axios.get(`/api/messages/conversations/${conversationId}`).then(res => {
        dispatch(setMessages(res.data));
      });

      const socket = getSocket();
      socket?.emit('join_conversation', conversationId);
      socket?.on('receive_message', (msg) => {
        console.log({msg,conversationId});
        
        dispatch(addMessage(msg));
        if (msg.conversationId === conversationId) {
        }
      });

      return () => {
        socket?.off('receive_message');
      };
    }
  }, [conversationId]);

  return (
    <div className="h-full flex flex-col w-full p-1">
      <div id="chat-messages" className="flex-1 overflow-y-auto bg-slate-300 p-2">
        {messages.map((m) => (
          <div key={m._id} className="mb-1 ">
            <strong>{m.sender.username}:</strong> {m.content}
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
}
