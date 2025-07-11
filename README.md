# Collaborative Code Editor

A real-time collaborative code editor built with React, Node.js, and Socket.IO that allows multiple users to edit code simultaneously.

## Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Live Code Synchronization**: Changes are instantly reflected across all connected users
- **Room-based Editing**: Create and join editing rooms for focused collaboration
- **User Management**: See who's currently in the room
- **Modern UI**: Clean and intuitive interface built with React
- **WebSocket Communication**: Real-time updates using Socket.IO

## Tech Stack

### Frontend
- React.js
- Socket.IO Client
- CSS3 with modern styling

### Backend
- Node.js
- Express.js
- Socket.IO
- CORS enabled for cross-origin requests

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd collaborative-code-editor
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Start the development servers:

In one terminal (for the server):
```bash
cd server
npm start
```

In another terminal (for the client):
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Usage

1. Open the application in your browser
2. Enter a room ID and your username
3. Start coding! Your changes will be synchronized with other users in the same room

## Project Structure

```
collaborative-code-editor/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Main server file
│   └── package.json
└── README.md
```

## API Endpoints

- `POST /api/execute` - Code execution endpoint (stub implementation)

## Socket.IO Events

- `join-room` - Join a collaborative editing room
- `code-change` - Broadcast code changes to other users
- `leave-room` - Leave the current room
- `users-update` - Update the list of users in the room
- `code-update` - Receive code updates from other users

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Code syntax highlighting
- [ ] Multiple language support
- [ ] File upload/download
- [ ] Chat functionality
- [ ] User authentication
- [ ] Persistent storage
- [ ] Code execution integration 