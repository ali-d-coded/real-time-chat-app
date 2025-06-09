import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { getSocket } from '../sockets/socket';
import { useDispatch, useSelector } from 'react-redux';
import { selectConversation } from '../features/conversations/convoSlice';
import { Link, useParams } from 'react-router-dom';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';
import Modal from './Modal';
import { EllipsisVertical } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  isOnline: boolean;
}

interface Group {
  _id: string;
  name: string;
  type: string;
  participants: string[];
}

export default function Sidebar() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  
  const [isModalOpen, setModalOpen] = useState(false);
  
  const dispatch = useDispatch();
  const { convoId } = useParams();
  const selectedId = useSelector((state: RootState) => state.convo.selectedId);

  const handleSelectUser = async (userId: string) => {
    try {
      const res = await axios.post('/api/messages/start', { userId });
      dispatch(selectConversation(res.data._id));
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    dispatch(selectConversation(groupId));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get<User[]>('/api/users');
        setUsers(res.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchGroups = async () => {
      try {
        const res = await axios.get<any[]>('/api/messages/conversations/all');
        setGroups(res.data.filter(convo => convo.type === 'group'));
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchUsers();
    fetchGroups();

    const socket = getSocket();
    
    socket?.on('user_online', (user: { id: string }) => {
      setUsers((prev) => prev.map((u) => (u._id === user.id ? { ...u, isOnline: true } : u)));
    });

    socket?.on('user_offline', (user: { id: string }) => {
      setUsers((prev) => prev.map((u) => (u._id === user.id ? { ...u, isOnline: false } : u)));
    });

    socket?.on('new_group', (group: Group) => {
      setGroups((prev) => [...prev, group]);
    });

    socket?.on('group_updated', (updatedGroup: Group) => {
      setGroups((prev) => prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)));
    });

    return () => {
      socket?.off('user_online');
      socket?.off('user_offline');
      socket?.off('new_group');
      socket?.off('group_updated');
    };
  }, []);

  const renderUsers = () => (
    <div className='flex flex-col gap-2 px-1'>
      {users.map((u) => {
        const isActive = selectedId === u._id || convoId === u._id;
        return (
          <Link
            to={`/chat/${u._id}`}
            key={u._id}
            onClick={() => handleSelectUser(u._id)}
            className={`px-2 py-3 cursor-pointer hover:bg-red-200 border-b border-b-black/20 rounded-sm transition-colors ${
              isActive ? 'bg-red-300 font-semibold' : ''
            }`}
          >
            <div className='flex items-center justify-between'>
              <span>{u.username}</span>
              <span className='text-xs'>
                {u.isOnline ? '🟢' : '⚪'}
              </span>
            </div>
          </Link>
        );
      })}
      {users.length === 0 && (
        <div className='px-2 py-4 text-gray-500 text-sm'>
          No users available
        </div>
      )}
    </div>
  );

  const renderGroups = () => (
    
    <div className='flex flex-col gap-2 px-1'>
      {groups.map((g) => {
        const isActive = selectedId === g._id || convoId === g._id;
        return (
          <Link
            to={`/chat/${g._id}`}
            key={g._id}
            onClick={() => handleSelectGroup(g._id)}
            className={`px-2 py-3 cursor-pointer hover:bg-red-200 border-b border-b-black/20 rounded-sm transition-colors ${
              isActive ? 'bg-red-300 font-semibold' : ''
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{g.name} ({g.participants.length})</span>
              {/* <span className='text-xs text-gray-600 flex'>
            
                <EllipsisVertical size={20} onClick={() => setModalOpen(true)} />
              </span> */}
            </div>
      
      
          </Link>
        );
      })}
      {groups.length === 0 && (
        <div className='px-2 py-4 text-gray-500 text-sm'>
          No groups available
        </div>
      )}

    

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Conversation"
        // groupname=
        convoId={convoId}
      />
    </div>
  );


    
  


  return (
    <div className='w-[250px] bg-red-100 h-full flex flex-col'>
      <h3 className='h-20 flex justify-center items-center text-lg font-bold uppercase tracking-widest bg-amber-100'>
        <Link to={"/"}>
          ChatterBox
        </Link>
      </h3>
      
      {/* Tab Navigation */}
      <div className='flex bg-red-50 border-b border-red-200'>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-red-200 text-red-800 border-b-2 border-red-400'
              : 'text-red-600 hover:bg-red-100'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'groups'
              ? 'bg-red-200 text-red-800 border-b-2 border-red-400'
              : 'text-red-600 hover:bg-red-100'
          }`}
        >
          Groups ({groups.length})
        </button>
      </div>

      {/* Content Area */}
      <div className='flex-1 overflow-y-auto'>
        {activeTab === 'users' ? renderUsers() : renderGroups()}
      </div>

      <div className=' bg-red-200'>
        <button className='p-3 border rounded-xl' onClick={()=>dispatch(logout())}>
          Logout
        </button>
      </div>
    </div>
  );
}