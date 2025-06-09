import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

interface User {
  _id: string;
  username: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  convoId: string | undefined;
}

const EditGroupModal: React.FC<ModalProps> = ({ isOpen, onClose, title, convoId}) => {
  const [name, setName] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);
  const [intent, setIntent] = useState<'add' | 'remove' | ''>('');
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch users and conversation details when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch users, exclude current user
      axios
        .get('/api/users')
        .then((res) =>
          setUsers(res.data.filter((u: User) => u._id !== user?.id))
        )
        .catch(() => setError('Failed to load users'));

      // Fetch conversation to prefill name
      axios
        .get(`/api/messages/conversations/${convoId}`)
        .then((res) => setName(res.data.name || ''))
        .catch(() => setError('Failed to load conversation details'));
    }
  }, [isOpen, convoId, user?.id]);

  // Toggle user selection
  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate inputs
    if (!intent) {
      setError('Please select an intent (Add or Remove).');
      return;
    }

    if (selected.length === 0 && !name) {
      setError('Please provide a name or select participants.');
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${convoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          participantIds: selected.length > 0 ? selected : undefined,
          intent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update conversation');
      }

      setSuccess(data.message || 'Conversation updated successfully');
      setName(undefined)
      setSelected([]);
      setIntent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">Conversation ID: {convoId}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Group Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter group name"
            />
          </div>
          <div>
            <label
              htmlFor="intent"
              className="block text-sm font-medium text-gray-700"
            >
              Action
            </label>
            <select
              id="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value as 'add' | 'remove' | '')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select an action</option>
              <option value="add">Add Participants</option>
              <option value="remove">Remove Participants</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Participants
            </label>
            <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {users.length === 0 && (
                <p className="text-gray-500 text-sm">No users available</p>
              )}
              {users.map((u) => (
                <div key={u._id} className="flex items-center p-1">
                  <input
                    type="checkbox"
                    id={`user-${u._id}`}
                    checked={selected.includes(u._id)}
                    onChange={() => toggleUser(u._id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`user-${u._id}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {u.username}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;