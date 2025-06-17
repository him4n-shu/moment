# Moment

<div align="center">
  <img src="frontend/public/logos/m-logo.svg" alt="Moment Logo" width="120" />
  <br>
  <img src="frontend/public/logos/text-logo.svg" alt="Moment Text" width="200" />
  <br><br>
  <p><strong>Share your moments with the world</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Project Structure</a> •
    <a href="#api-documentation">API Documentation</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </p>
</div>

## Overview

Moment is a modern social media platform designed for sharing life's special moments through photos and posts. With a clean, responsive interface and real-time interactions, Moment provides users with a seamless experience across all devices.

The platform features a full-stack architecture with a React/Next.js frontend and Node.js/Express backend, complete with real-time notifications and messaging via Socket.IO.

## Features

### User Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Real-time Interactions**: Instant notifications and messaging
- **Smooth Animations**: Subtle animations for enhanced user experience

### Core Functionality
- **User Authentication**: Secure login/register with JWT and Google OAuth
- **Social Networking**: Follow users, like and comment on posts
- **Media Sharing**: Upload and share images with captions and locations
- **Real-time Messaging**: Private conversations between users
- **Notifications**: Real-time alerts for likes, comments, follows, and messages
- **User Profiles**: Customizable profiles with bio and profile picture
- **Feed**: Personalized content feed from followed users
- **Search**: Find users by username or name

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context API
- **Real-time Communication**: [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- **Animations**: [AOS](https://michalsnik.github.io/aos/) (Animate On Scroll)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [JWT](https://jwt.io/), [Passport](http://www.passportjs.org/)
- **Real-time Server**: [Socket.IO](https://socket.io/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)
- **File Upload**: [Multer](https://github.com/expressjs/multer)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/moment.git
cd moment
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/moment
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

4. Install frontend dependencies
```bash
cd ../frontend
npm install
```

5. Set up frontend environment variables
Create a `.env.local` file in the frontend directory:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

3. Access the application at `http://localhost:3000`

## Project Structure

```
moment/
├── backend/                # Backend server
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Entry point
│
└── frontend/               # Frontend application
    ├── public/             # Static assets
    └── src/
        ├── app/            # Next.js app directory
        │   ├── (main)/     # Main app routes
        │   ├── auth/       # Authentication routes
        │   ├── components/ # Shared components
        │   ├── contexts/   # React contexts
        │   └── utils/      # Utility functions
        └── components/     # Global components
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth login |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:username` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/search` | Search for users |
| POST | `/api/users/:id/follow` | Follow a user |
| DELETE | `/api/users/:id/follow` | Unfollow a user |

### Post Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/feed` | Get posts for feed |
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts/:id` | Get a specific post |
| DELETE | `/api/posts/:id` | Delete a post |
| POST | `/api/posts/:id/like` | Like a post |
| POST | `/api/posts/:id/comment` | Comment on a post |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | Get user conversations |
| POST | `/api/chat/conversations` | Create a new conversation |
| GET | `/api/chat/messages/:conversationId` | Get messages in a conversation |
| POST | `/api/chat/messages` | Send a message |
| GET | `/api/chat/unread` | Get unread messages |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark notification as read |
| PUT | `/api/notifications/read-all` | Mark all notifications as read |

## Socket.IO Events

### Client Events
- `client_ping`: Ping server to maintain connection
- `join_room`: Join a conversation room
- `leave_room`: Leave a conversation room
- `send_message`: Send a new message

### Server Events
- `server_pong`: Server response to ping
- `new_message`: Notify client of new message
- `new_post`: Notify client of new post
- `notification`: General notification event

## Deployment

### Backend Deployment
1. Set up a MongoDB Atlas database
2. Deploy to a Node.js hosting service (Heroku, DigitalOcean, AWS)
3. Set the appropriate environment variables

### Frontend Deployment
1. Build the Next.js application
```bash
cd frontend
npm run build
```
2. Deploy to Vercel, Netlify, or other hosting service
3. Set environment variables for production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by [React Icons](https://react-icons.github.io/react-icons/)
- UI inspiration from modern social media platforms
- Special thanks to all contributors and users

---

<div align="center">
  <p>Made with ❤️ by Himanshu</p>
</div> 