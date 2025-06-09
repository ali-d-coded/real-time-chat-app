import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import { addConversation } from '../features/conversations/conversationSlice';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../app/store';
interface User {
  _id: string;
  username: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewGroupModal({ isOpen, onClose }: Props) {
  
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/users').then((res) => setUsers(res.data.filter((it:any) => it._id !== user!.id))); 
    }
  }, [isOpen]);

  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const res = await axios.post('/api/messages/group', {
      name: groupName,
      participantIds: selected,
    });
    console.log({res: res.data});
    
    dispatch(addConversation(res.data));
    navigate(`/chat/${res.data._id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/30 bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-4 w-[300px] rounded shadow">
        {JSON.stringify(user)}
        <h2 className="text-lg font-bold mb-2">Create Group</h2>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          className="w-full border p-1 mb-3"
        />
        <div className="h-[120px] overflow-y-auto border mb-3">
          {users.map((u) => (
            <div key={u._id} className="p-1">
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(u._id)}
                  onChange={() => toggleUser(u._id)}
                />{' '}
                {u.username}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <button onClick={handleSubmit} className="bg-green-500 px-3 py-1 text-white rounded">Create</button>
          <button onClick={onClose} className="text-sm text-red-500">Cancel</button>
        </div>
      </div>
    </div>
  );
}
