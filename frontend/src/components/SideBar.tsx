import { ArrowBigRightDash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import axios from '../api/axios';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { selectConversation } from '../features/conversations/convoSlice';
import { getSocket } from '../sockets/socket';
import Modal from './Modal';
import RunCampaignForm from './RunCampaignForm';

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
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  
  const user = useSelector((state: RootState) => state.auth.user);
  
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
  <div className="w-[270px] bg-white h-full flex flex-col border-r border-gray-200 shadow-sm ">
    {/* Header */}
    <div className="h-20 flex items-center justify-center bg-gradient-to-r from-red-300 to-red-200 shadow-inner">
      <Link to="/" className="text-xl font-extrabold tracking-widest text-gray-800">
        ChatterBox - {user?.username}
      </Link>
    </div>

    {/* Campaign Controls */}
    <div className="p-3 border-b border-gray-100">
      <button
        onClick={() => setShowCampaignForm(prev => !prev)}
        className="w-full px-3 py-2 text-sm bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition"
      >
        📣 Run Campaign
      </button>
      {showCampaignForm && <RunCampaignForm />}
    </div>

    {/* Campaign Messages Link */}
    {
     user?.role == "admin" && (<div className="p-3 border-b border-gray-100">
      <Link
        to="/campaign-messages"
        className="flex items-center justify-between px-3 py-2 bg-green-600 text-white text-sm rounded-lg shadow hover:bg-green-700 transition"
      >
        <span>View All Campaigns</span>
        <ArrowBigRightDash size={20} />
      </Link>
    </div>)
    }

    {/* Tab Navigation */}
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => setActiveTab("users")}
        className={`flex-1 py-2.5 text-sm font-medium ${
          activeTab === "users"
            ? "bg-red-100 text-red-700 border-b-2 border-red-400"
            : "hover:bg-red-50 text-gray-600"
        }`}
      >
        👤 Users ({users.length})
      </button>
      <button
        onClick={() => setActiveTab("groups")}
        className={`flex-1 py-2.5 text-sm font-medium ${
          activeTab === "groups"
            ? "bg-red-100 text-red-700 border-b-2 border-red-400"
            : "hover:bg-red-50 text-gray-600"
        }`}
      >
        👥 Groups ({groups.length})
      </button>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 overflow-y-auto px-1 py-2 bg-white">
      {activeTab === "users" ? renderUsers() : renderGroups()}
    </div>

    {/* Footer */}
    <div className="p-3 border-t border-gray-100 bg-red-50">
      <button
        onClick={() => dispatch(logout())}
        className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
      >
        🚪 Logout
      </button>
    </div>
  </div>
);

}