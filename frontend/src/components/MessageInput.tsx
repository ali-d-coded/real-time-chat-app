import { useState } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '../sockets/socket';
import type { RootState } from '../app/store';

export default function MessageInput() {
  const [text, setText] = useState('');
  const conversationId = useSelector((state: RootState) => state.convo.selectedId);

  const handleSend = () => {
    console.log({conversationId});
    
    const socket = getSocket();
    if (conversationId && text.trim()) {
      socket?.emit('send_message', {
        conversationId,
        content: text,
      });
      setText('');
    }
  };

  return (
    <div className='flex gap-2 p-2 border-t border-black/10 bg-white'>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
        className='flex-1 p-2 border border-gray-300 rounded'
      />
      <button
        onClick={handleSend}
        className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition'
      >
        Send
      </button>
    </div>
  );
}
