import { useState } from "react";
import Layout from "../components/Layout";
import NewGroupModal from "../components/NewGroupModal";
import type { RootState } from "../app/store";
import { useSelector } from "react-redux";

export default function Home() {

  const user = useSelector((state: RootState) => state.auth.user);
  const [showGroupModal, setShowGroupModal] = useState(false);
  return (
    <>
      {/* Add your home page content here */}
      <div className="flex-1 p-4">
        <h1>Welcome to the Chat App {user?.username}</h1>

         <button
        onClick={() => setShowGroupModal(true)}
        className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded"
      >
        New Group
      </button>

      <NewGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} />
       
        {/* You might want to show recent conversations, create new chat button, etc. */}
      </div>
    </>
  );
}