import { useState } from "react";
import { getSocket } from "../sockets/socket";
import type { RootState } from "../app/store";
import { useSelector } from "react-redux";

type Props = {}

export default function RunCampaignForm({}: Props) {
    const [campaignmessage, setCampaignMessage] = useState<string>('');
    const conversationId = useSelector((state: RootState) => state.convo.selectedId);

    // Handler function to submit campaign message
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log({campaignmessage});

            const socket = getSocket();
                if (campaignmessage.trim()) {
                  socket?.emit('send_campaign_message', {
                    conversationId,
                    content: campaignmessage,
                  });
                  
                }
            
            // const response = await fetch('/api/campaign', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ message: campaignmessage }),
            // });
            // if (!response.ok) {
            //     throw new Error('Failed to submit campaign');
            // }
            // Reset form after successful submission
            setCampaignMessage('');
        } catch (error) {
            console.error('Error submitting campaign:', error);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <textarea 
                className="border"
                    name="campaignmessage"
                    id="campaignmessage"
                    value={campaignmessage}
                    cols={30}
                    rows={5}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    placeholder="Enter your campaign message"
                    required
                />
                <button type="submit" className="bg-slate-500 text-white p-2">Submit Campaign</button>
            </form>
        </div>
    )
}
