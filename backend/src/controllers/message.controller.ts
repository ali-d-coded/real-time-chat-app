import { Request, Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { Types } from 'mongoose';

const PAGE_SIZE = 20;

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;

  const messages = await Message.find({ conversationId })
    .sort({ timestamp: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('sender', '_id username');

   res.json(messages.reverse()); // return newest last
    return;
};

export const getAllCampaignMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = PAGE_SIZE } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.aggregate([
      { $match: { isCampaign: true } },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversationId',
          foreignField: '_id',
          as: 'conversationInfo'
        }
      },
      { $unwind: '$senderInfo' },
      { $unwind: '$conversationInfo' },
      {
        $lookup: {
          from: 'users',
          localField: 'conversationInfo.participants',
          foreignField: '_id',
          as: 'allParticipants'
        }
      },
      {
        $addFields: {
          receivers: {
            $filter: {
              input: '$allParticipants',
              as: 'participant',
              cond: { $ne: ['$$participant._id', '$senderInfo._id'] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          timestamp: 1,
          isCampaign: 1,
          conversationId: 1,
          sender: {
            _id: '$senderInfo._id',
            username: '$senderInfo.username',
            email: '$senderInfo.email'
          },
          conversation: {
            _id: '$conversationInfo._id',
            name: '$conversationInfo.name',
            type: '$conversationInfo.type',
            participantCount: { $size: '$conversationInfo.participants' }
          },
          receivers: {
            $map: {
              input: '$receivers',
              as: 'receiver',
              in: {
                _id: '$$receiver._id',
                username: '$$receiver.username',
                email: '$$receiver.email'
              }
            }
          }
        }
      },
      { $sort: { timestamp: 1 } }
    ]);

    // Group messages by sender and unique message content
    const groupedMessages = messages.reduce((acc, message) => {
      const senderId = message.sender._id.toString();
      const messageKey = `${message.content}_${message.timestamp}`; // Unique key for message

      if (!acc[senderId]) {
        acc[senderId] = {
          sender: message.sender,
          messages: {},
          messageCount: 0
        };
      }

      if (!acc[senderId].messages[messageKey]) {
        acc[senderId].messages[messageKey] = {
          _id: message._id,
          content: message.content,
          timestamp: message.timestamp,
          isCampaign: message.isCampaign,
          conversation: message.conversation,
          receivers: []
        };
        acc[senderId].messageCount++;
      }

      // Add receivers to the message
      acc[senderId].messages[messageKey].receivers.push(...message.receivers);

      return acc;
    }, {});

    // Convert grouped object to array
    const result = Object.values(groupedMessages).map((group: any) => ({
      sender: group.sender,
      messages: Object.values(group.messages),
      messageCount: group.messageCount
    }));

    res.json({
      success: true,
      data: result,
      totalGroups: result.length,
      page: Number(page),
      limit: Number(limit),
      groupedBy: 'sender_and_message'
    });

  } catch (error: any) {
    console.error('Error fetching campaign messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign messages',
      message: error.message
    });
  }
};
// Helper function to get campaign message statistics
export const getCampaignMessageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Message.aggregate([
      { $match: { isCampaign: true } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          uniqueSenders: { $addToSet: '$sender' },
          uniqueConversations: { $addToSet: '$conversationId' },
          oldestMessage: { $min: '$timestamp' },
          newestMessage: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          uniqueSenderCount: { $size: '$uniqueSenders' },
          uniqueConversationCount: { $size: '$uniqueConversations' },
          oldestMessage: 1,
          newestMessage: 1,
          dateRange: {
            $divide: [
              { $subtract: ['$newestMessage', '$oldestMessage'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalMessages: 0,
        uniqueSenderCount: 0,
        uniqueConversationCount: 0,
        oldestMessage: null,
        newestMessage: null,
        dateRange: 0
      }
    });

  } catch (error:any) {
    console.error('Error fetching campaign message stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign message statistics',
      message: error.message
    });
  }
};


export const createConversationIfNotExists = async (req: Request, res: Response): Promise<void> => {
  const { userId: receiverId } = req.body;
  const senderId = (req as any).user.id;

  let convo = await Conversation.findOne({
    participants: { $all: [senderId, receiverId], $size: 2 },
  });

  if (!convo) {
    convo = new Conversation({ participants: [senderId, receiverId] });
    await convo.save();
  }

  res.json(convo);
  return; 
};


export const createGroupConversation =  async (req: Request, res: Response): Promise<void>  => {
  const senderId = (req as any).user.id;

  const { name, participantIds } = req.body;
  const conversation = await Conversation.create({
    name,
    type: 'group',
    participants: [...participantIds, senderId],
  });
   res.status(201).json(conversation);
  return; 
}

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    console.log({userId});
    
    // Filter conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', '_id username isOnline')
      .sort({ updatedAt: -1 });

    console.log({conversations});
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { name, participantIds, intent } = req.body;

    // Validate inputs
    if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }

    if (!intent || !['add', 'remove'].includes(intent)) {
      res.status(400).json({ error: 'Invalid or missing intent. Must be "add" or "remove"' });
      return;
    }

    // Validate participantIds if provided
    let participantObjectIds: Types.ObjectId[] = [];
    if (participantIds) {
      const ids = Array.isArray(participantIds) ? participantIds : [participantIds];
      if (!ids.every(id => Types.ObjectId.isValid(id))) {
        res.status(400).json({ error: 'Invalid participant ID(s)' });
        return;
      }
      participantObjectIds = ids.map(id => new Types.ObjectId(id));
    }

    // Build update object
    const update: any = {};
    if (name) update.name = name;
    if (participantIds) {
      update[intent === 'add' ? '$addToSet' : '$pullAll'] = {
        participants: participantObjectIds,
      };
    }

    // Update conversation
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      update,
      { new: true, runValidators: true }
    );

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.status(200).json({ message: 'Conversation updated successfully', conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
