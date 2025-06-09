import { Schema, model, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: Schema.Types.ObjectId[];
  type: 'individual' | 'group';
  name: string
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
        {
         type: Schema.Types.ObjectId, 
         ref: 'User', 
         required: true 
        }
    ],
    type: {
      type: String,
      enum: ['individual', 'group'],
      default: 'individual'
    },
    name: {
      type: String,
    }
  },
  { timestamps: true }
);

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;