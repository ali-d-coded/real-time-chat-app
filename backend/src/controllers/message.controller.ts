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