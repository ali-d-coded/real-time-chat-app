import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: Schema.Types.ObjectId;
  conversationId: Schema.Types.ObjectId;
  content: string;
  isCampaign: boolean;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', },
    content: { type: String, required: true },
    isCampaign: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// add indexes

const Message = model<IMessage>('Message', messageSchema);
export default Message;
