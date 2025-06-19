import { useEffect, useState, useCallback, memo } from "react";
import axios from "../api/axios";
import {
  ChevronDown,
  ChevronUp,
  User,
  MessageCircle,
  Users,
  Calendar,
  Mail,
  Activity,
  Clock,
  Target,
} from "lucide-react";

// Interfaces based on the new response model
interface Sender {
  _id: string;
  username: string;
  email: string;
}

interface Receiver {
  _id: string;
  username: string;
  email: string;
}

interface Conversation {
  _id: string;
  name?: string;
  type: string;
  participantCount: number;
}

interface Message {
  _id: string;
  content: string;
  timestamp: string;
  isCampaign: boolean;
  conversation: Conversation;
  receivers: Receiver[];
}

interface CampaignData {
  sender: Sender;
  messages: Message[];
  messageCount: number;
}

interface ApiResponse {
  success: boolean;
  data: CampaignData[];
  totalGroups: number;
  page: number;
  limit: number;
  groupedBy: string;
}

// Utility functions
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  return diffInHours < 24 ? `${diffInHours}h ago` : `${Math.floor(diffInHours / 24)}d ago`;
};

// Sub-components
interface SummaryStatsProps {
  metadata: ApiResponse | null;
  totalRecipients: number;
}

const SummaryStats = memo(({ metadata, totalRecipients }: SummaryStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center">
        <Activity className="w-8 h-8 text-blue-500 mr-3" />
        <div>
          <div className="text-2xl font-bold text-gray-900">{metadata?.totalGroups || 0}</div>
          <div className="text-sm text-gray-600">Active Senders</div>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center">
        <MessageCircle className="w-8 h-8 text-green-500 mr-3" />
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {metadata?.data.reduce((acc, group) => acc + group.messageCount, 0) || 0}
          </div>
          <div className="text-sm text-gray-600">Total Campaign Messages</div>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center">
        <Target className="w-8 h-8 text-purple-500 mr-3" />
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalRecipients}</div>
          <div className="text-sm text-gray-600">Total Recipients Reached</div>
        </div>
      </div>
    </div>
  </div>
));

interface SenderHeaderProps {
  campaign: CampaignData;
  isExpanded: boolean;
  toggleExpansion: () => void;
}

const SenderHeader = memo(({ campaign, isExpanded, toggleExpansion }: SenderHeaderProps) => {
  const { sender, messages, messageCount } = campaign;
  const uniqueReceiversCount = new Set(
    messages.flatMap((msg) => msg.receivers.map((r) => r._id))
  ).size;
  const campaignPeriod = {
    firstMessage: messages[0]?.timestamp,
    lastMessage: messages[messages.length - 1]?.timestamp,
    durationDays: messages[0] && messages[messages.length - 1]
      ? Math.ceil(
          (new Date(messages[messages.length - 1].timestamp).getTime() - new Date(messages[0].timestamp).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0,
  };

  return (
    <div
      className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      onClick={toggleExpansion}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{sender.username}</h2>
            <p className="text-blue-100 text-sm">{sender.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{messageCount}</div>
            <div className="text-xs text-blue-100">Messages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{uniqueReceiversCount}</div>
            <div className="text-xs text-blue-100">Recipients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{campaignPeriod.durationDays}</div>
            <div className="text-xs text-blue-100">Days Active</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-blue-100">{campaignPeriod.lastMessage ? formatRelativeTime(campaignPeriod.lastMessage) : '-'}</div>
            <div className="text-xs text-blue-100">Last Active</div>
          </div>
          {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
});

interface RecipientsSectionProps {
  receivers: Receiver[];
}

const RecipientsSection = memo(({ receivers }: RecipientsSectionProps) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <Users className="w-5 h-5 mr-2 text-gray-600" />
      All Recipients ({receivers.length})
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {receivers.map((receiver) => (
        <div
          key={receiver._id}
          className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{receiver.username}</div>
              <div className="text-sm text-gray-500 truncate">{receiver.email}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

interface MessageCardProps {
  message: Message;
  isExpanded: boolean;
  toggleExpansion: () => void;
}

const MessageCard = memo(({ message, isExpanded, toggleExpansion }: MessageCardProps) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={toggleExpansion}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(message.timestamp)}
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                message.conversation.type === "group"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {message.conversation.type}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {formatRelativeTime(message.timestamp)}
            </div>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">{message.conversation.name || "Conversation"}</h4>
          <p className="text-gray-700 line-clamp-2">{message.content}</p>
        </div>
        <div className="flex items-center space-x-4 ml-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{message.receivers.length}</div>
            <div className="text-xs text-gray-500">Recipients</div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
    </div>
    {isExpanded && (
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="mb-4">
          <h5 className="font-medium text-gray-900 mb-2">Full Message:</h5>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Message Recipients:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.receivers.map((receiver) => (
              <div key={receiver._id} className="bg-white rounded-lg p-3 border shadow-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">{receiver.username}</div>
                    <div className="text-sm text-gray-500">{receiver.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
));

interface CampaignMessagesProps {}

const CampaignMessages: React.FC<CampaignMessagesProps> = () => {
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSenders, setExpandedSenders] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [metadata, setMetadata] = useState<ApiResponse | null>(null);

  const fetchCampaignMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ApiResponse>("/api/messages/campaigns/all");
      if (response.data.success) {
        setCampaignData(response.data.data);
        setMetadata(response.data);
      } else {
        setError("Failed to load campaign messages");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch campaign messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaignMessages();
  }, [fetchCampaignMessages]);

  const toggleSenderExpansion = useCallback((senderId: string) => {
    setExpandedSenders((prev) => {
      const newSet = new Set(prev);
      newSet.has(senderId) ? newSet.delete(senderId) : newSet.add(senderId);
      return newSet;
    });
  }, []);

  const toggleMessageExpansion = useCallback((messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      newSet.has(messageId) ? newSet.delete(messageId) : newSet.add(messageId);
      return newSet;
    });
  }, []);

  const totalRecipients = campaignData.reduce(
    (acc, group) => acc + new Set(group.messages.flatMap((msg) => msg.receivers.map((r) => r._id))).size,
    0
  );

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Campaign Messages</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📢 Campaign Messages Dashboard</h1>
        <p className="text-gray-600">Monitor and analyze campaign message activity by sender</p>
        <SummaryStats metadata={metadata} totalRecipients={totalRecipients} />
      </div>

      {campaignData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Messages</h3>
          <p className="text-gray-500">No campaign messages have been sent yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {campaignData.map((campaign) => {
            const uniqueReceivers = [
              ...new Map(
                campaign.messages
                  .flatMap((msg) => msg.receivers)
                  .map((r) => [r._id, r])
              ).values(),
            ];
            return (
              <div key={campaign.sender._id} className="bg-white rounded-lg shadow-lg overflow-hidden border">
                <SenderHeader
                  campaign={campaign}
                  isExpanded={expandedSenders.has(campaign.sender._id)}
                  toggleExpansion={() => toggleSenderExpansion(campaign.sender._id)}
                />
                {expandedSenders.has(campaign.sender._id) && (
                  <div className="p-6 bg-gray-50">
                    <RecipientsSection receivers={uniqueReceivers} />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Campaign Messages ({campaign.messages.length})
                      </h3>
                      <div className="space-y-4">
                        {campaign.messages.map((message) => (
                          <MessageCard
                            key={message._id}
                            message={message}
                            isExpanded={expandedMessages.has(message._id)}
                            toggleExpansion={() => toggleMessageExpansion(message._id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignMessages;