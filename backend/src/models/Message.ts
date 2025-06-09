import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: Schema.Types.ObjectId;
  conversationId: Schema.Types.ObjectId;
  content: string;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Message = model<IMessage>('Message', messageSchema);
export default Message;
