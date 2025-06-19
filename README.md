# Real-Time Chat Application

## Project Overview
This is a full-stack real-time chat application built for Ginger Technologies. The application enables users to register, login, and participate in real-time conversations with features like group messaging and campaign management.

## Architecture
The project follows a modern full-stack architecture with separate backend and frontend applications:

### Backend (Node.js/Express/TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Database Architecture**: MongoDB Replica Set and Sharding for high availability and scalability
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **CORS**: Enabled for cross-origin requests

### Frontend (React/TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with Redux Persist
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.IO Client
- **Icons**: Lucide React

## Key Features
- User authentication (login/register)
- Real-time messaging with Socket.IO
- Group conversations
- Campaign messaging system
- Protected routes
- Persistent state management
- Responsive UI with Tailwind CSS

## Tools and Technologies Used

### Backend Dependencies
- **express**: Web framework
- **mongoose**: MongoDB object modeling
- **socket.io**: Real-time bidirectional communication
- **jsonwebtoken**: JWT implementation
- **bcrypt**: Password hashing
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **morgan**: HTTP request logger

### Frontend Dependencies
- **react & react-dom**: UI library
- **@reduxjs/toolkit**: State management
- **react-router-dom**: Client-side routing
- **axios**: HTTP client
- **socket.io-client**: Real-time communication
- **tailwindcss**: Utility-first CSS framework
- **redux-persist**: State persistence

## How to Run the Application

### Prerequisites
- Node.js (v16 or higher)
- MongoDB with Replica Set configuration (running on localhost:27015)
- npm or yarn package manager

### MongoDB Setup (Replica Set & Sharding)

The application is configured to work with MongoDB replica sets for high availability and can be extended with sharding for horizontal scaling.

#### Replica Set Configuration
The application supports MongoDB replica set configuration as seen in the commented connection strings:
```bash
# Single instance (development)
mongodb://localhost:27015/real-time-chats-db

# Replica set configuration (production)
mongodb://localhost:27018,localhost:27019,localhost:27020/real-time-chats-db?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=true&w=majority
```

#### Setting up MongoDB Replica Set
1. **Start MongoDB instances**:
   ```bash
   mongod --replSet rs0 --port 27018 --dbpath /data/db1
   mongod --replSet rs0 --port 27019 --dbpath /data/db2
   mongod --replSet rs0 --port 27020 --dbpath /data/db3
   ```

2. **Initialize replica set**:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "localhost:27018" },
       { _id: 1, host: "localhost:27019" },
       { _id: 2, host: "localhost:27020" }
     ]
   })
   ```

#### Sharding Configuration
For horizontal scaling, the application can be configured with MongoDB sharding:
1. **Start config servers**
2. **Start shard servers**
3. **Start mongos router**
4. **Enable sharding on database and collections**

### Backend Setup and Run

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   The `.env` file is already configured with:
   - PORT: 9099
   - MONGO_URI: mongodb://localhost:27015/real-time-chats-db
   - JWT_SECRET: your-secret-key
   - FRONTEND_URL: http://localhost:5173

4. **Database Setup** (Optional):
   ```bash
   npm run seed
   ```

5. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

6. **Build and Run in Production**:
   ```bash
   npm run build
   npm start
   ```

The backend will run on `http://localhost:9099`

### Frontend Setup and Run

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   The `.env` file is configured with:
   - VITE_BACKEND_URL: http://localhost:9099

4. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Preview Production Build**:
   ```bash
   npm run preview
   ```

The frontend will run on `http://localhost:5173`

### Running Both Applications
1. Start MongoDB service (single instance on port 27015 or replica set on ports 27018-27020)
2. Open two terminal windows
3. In the first terminal, run the backend (`cd backend && npm run dev`)
4. In the second terminal, run the frontend (`cd frontend && npm run dev`)
5. Access the application at `http://localhost:5173`

## Database Scalability Features

### Replica Set Benefits
- **High Availability**: Automatic failover if primary node goes down
- **Read Scaling**: Read operations can be distributed across secondary nodes
- **Data Redundancy**: Multiple copies of data across different nodes
- **Zero Downtime Maintenance**: Rolling updates without service interruption

### Sharding Benefits
- **Horizontal Scaling**: Distribute data across multiple machines
- **Improved Performance**: Parallel processing of queries across shards
- **Large Dataset Support**: Handle datasets that exceed single server capacity
- **Geographic Distribution**: Place data closer to users for better performance

The application supports real-time messaging between users, with the backend handling WebSocket connections through Socket.IO and the frontend providing a responsive chat interface.