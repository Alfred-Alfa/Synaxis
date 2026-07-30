# Chat Module - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HRMS APPLICATION                                   │
│                     (Existing - NOT MODIFIED)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Payroll    │  │  Attendance  │  │    Leave     │  │    Staff     │  │
│  │    Module    │  │    Module    │  │   Module     │  │   Module     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (READ-ONLY Access to User Model)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHAT MODULE (ISOLATED)                               │
│                          ✅ NEW & ISOLATED                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                         FRONTEND (React/TS)                            ││
│  ├────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐    ││
│  │  │  ChatPage    │───▶│  ChatContext    │◀───│  ChatBadge       │    ││
│  │  │  Component   │    │  (WebSocket +   │    │  Component       │    ││
│  │  │              │    │  Notifications) │    │                  │    ││
│  │  └──────────────┘    └─────────────────┘    └──────────────────┘    ││
│  │                              │                                         ││
│  │                              │ Socket.IO Client                        ││
│  │                              ▼                                         ││
│  │  ┌──────────────────────────────────────────────────────────┐        ││
│  │  │           Notification Features                           │        ││
│  │  ├──────────────────────────────────────────────────────────┤        ││
│  │  │  🔊 Sound Notifications                                  │        ││
│  │  │  🔔 Browser Notifications                               │        ││
│  │  │  📛 Unread Message Badges                               │        ││
│  │  │  🔇 Mute/Unmute Controls                                │        ││
│  │  └──────────────────────────────────────────────────────────┘        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│                                    │                                         │
│                                    │ WebSocket (Socket.IO)                   │
│                                    │                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                        BACKEND (Node.js/Express)                       ││
│  ├────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ┌─────────────────────────────────────────────────────────────────┐ ││
│  │  │                   WebSocket Server                              │ ││
│  │  │                    (socket.js)                                  │ ││
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │ ││
│  │  │  │ join_room  │  │send_message│  │   typing   │              │ ││
│  │  │  └────────────┘  └────────────┘  └────────────┘              │ ││
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │ ││
│  │  │  │leave_room  │  │mark_as_read│  │stop_typing │              │ ││
│  │  │  └────────────┘  └────────────┘  └────────────┘              │ ││
│  │  └─────────────────────────────────────────────────────────────────┘ ││
│  │                                │                                        ││
│  │                                ▼                                        ││
│  │  ┌─────────────────────────────────────────────────────────────────┐ ││
│  │  │                    REST API Endpoints                           │ ││
│  │  │                   (chatController.js)                           │ ││
│  │  │  ┌────────────────────────────────────────────────────────┐    │ ││
│  │  │  │ GET  /api/chat/employees                              │    │ ││
│  │  │  │ POST /api/chat/rooms/direct                           │    │ ││
│  │  │  │ POST /api/chat/rooms/group                            │    │ ││
│  │  │  │ GET  /api/chat/rooms                                  │    │ ││
│  │  │  │ GET  /api/chat/rooms/:roomId/messages                 │    │ ││
│  │  │  │ POST /api/chat/rooms/:roomId/messages                 │    │ ││
│  │  │  │ PUT  /api/chat/rooms/:roomId/read                     │    │ ││
│  │  │  │ GET  /api/chat/unread-count                           │    │ ││
│  │  │  └────────────────────────────────────────────────────────┘    │ ││
│  │  └─────────────────────────────────────────────────────────────────┘ ││
│  │                                │                                        ││
│  │                                ▼                                        ││
│  │  ┌─────────────────────────────────────────────────────────────────┐ ││
│  │  │                   Database Models                               │ ││
│  │  │  ┌────────────────┐            ┌────────────────┐              │ ││
│  │  │  │   ChatRoom     │            │    Message     │              │ ││
│  │  │  ├────────────────┤            ├────────────────┤              │ ││
│  │  │  │ - name         │            │ - roomId       │              │ ││
│  │  │  │ - type         │            │ - senderId     │              │ ││
│  │  │  │ - members[]    │◀───────────│ - senderName   │              │ ││
│  │  │  │ - admins[]     │            │ - messageText  │              │ ││
│  │  │  │ - lastMessage  │            │ - readBy[]     │              │ ││
│  │  │  │ - isActive     │            │ - createdAt    │              │ ││
│  │  │  └────────────────┘            └────────────────┘              │ ││
│  │  └─────────────────────────────────────────────────────────────────┘ ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (Stores Data)
                                    ▼
                    ┌──────────────────────────────────┐
                    │      MongoDB Database            │
                    ├──────────────────────────────────┤
                    │  Collections:                    │
                    │  - chatrooms                     │
                    │  - messages                      │
                    │                                  │
                    │  (Isolated from HRMS tables)     │
                    └──────────────────────────────────┘
```

## Data Flow

### 1. User Sends Message
```
┌──────────┐      ┌────────────┐      ┌────────────┐      ┌──────────┐
│  User A  │─────▶│ WebSocket  │─────▶│  Backend   │─────▶│ Database │
│ (Browser)│      │   Client   │      │   Server   │      │ (MongoDB)│
└──────────┘      └────────────┘      └────────────┘      └──────────┘
                                            │
                                            │ (Broadcast)
                                            ▼
                                      ┌────────────┐
                                      │  User B    │
                                      │ (Browser)  │
                                      └────────────┘
```

### 2. Message Reception & Notifications
```
┌─────────────────────────────────────────────────────────────────┐
│                    Message Received                             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Is sender the current user?      │
          └───────────────────────────────────┘
                     │                │
                  Yes│                │No
                     │                ▼
                     │    ┌─────────────────────────────┐
                     │    │   Check Notification Settings│
                     │    └─────────────────────────────┘
                     │                │
                     │                ▼
                     │    ┌─────────────────────────────┐
                     │    │   Play Sound (if not muted) │
                     │    └─────────────────────────────┘
                     │                │
                     │                ▼
                     │    ┌─────────────────────────────┐
                     │    │ Show Browser Notification   │
                     │    │ (if tab is inactive)        │
                     │    └─────────────────────────────┘
                     │                │
                     ▼                ▼
          ┌────────────────────────────────────┐
          │    Update Unread Count Badge       │
          └────────────────────────────────────┘
                          │
                          ▼
          ┌────────────────────────────────────┐
          │    Display Message in UI           │
          └────────────────────────────────────┘
```

### 3. Sound Notification Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   Browser Loads                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Wait for user interaction        │
          │  (click, touch, keydown)          │
          └───────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Unlock Audio Context             │
          │  (Play & pause silent audio)      │
          └───────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Audio Ready for Notifications    │
          └───────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌──────────────┐          ┌──────────────┐
    │ Message      │          │ Sound        │
    │ Received     │          │ Muted?       │
    └──────────────┘          └──────────────┘
            │                           │
            └────────────┬──────────────┘
                         │
                         ▼
          ┌───────────────────────────────────┐
          │  Play notification.mp3            │
          └───────────────────────────────────┘
```

### 4. Browser Notification Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   Chat Module Loads                             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Check Notification Permission    │
          └───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
    ┌──────────┐                  ┌──────────────┐
    │ Granted  │                  │ Not Granted  │
    └──────────┘                  └──────────────┘
          │                               │
          │                               ▼
          │                   ┌──────────────────┐
          │                   │ Request Permission│
          │                   └──────────────────┘
          │                               │
          └───────────────┬───────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │      Message Received             │
          └───────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │   Is browser tab visible?         │
          └───────────────────────────────────┘
                     │                │
                  Yes│                │No
                     │                ▼
                     │    ┌─────────────────────────────┐
                     │    │ Show Browser Notification   │
                     │    │ Title: "New Message"        │
                     │    │ Body: "Sender: Preview..."  │
                     │    │ Icon: /chat-icon.png        │
                     │    └─────────────────────────────┘
                     │                │
                     ▼                ▼
          ┌────────────────────────────────────┐
          │    Display in Chat UI              │
          └────────────────────────────────────┘
```

## Key Features Implementation

### 1. Isolation from HRMS
- ✅ Separate database collections (chatrooms, messages)
- ✅ Separate API routes (/api/chat/*)
- ✅ Separate React components and contexts
- ✅ No foreign key constraints
- ✅ Read-only access to User model
- ✅ Independent failure mode

### 2. Real-time Communication
- ✅ WebSocket via Socket.IO
- ✅ JWT authentication
- ✅ Room-based messaging
- ✅ Auto-reconnection
- ✅ Online/offline status

### 3. Notification System
- ✅ Sound with autoplay unlock
- ✅ Browser notifications with visibility check
- ✅ Unread message tracking
- ✅ Persistent mute settings
- ✅ Permission management

### 4. Security
- ✅ JWT token validation
- ✅ Room membership verification
- ✅ Message authorization
- ✅ CORS configuration
- ✅ Input sanitization

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Socket.IO Client** - WebSocket library
- **Lucide React** - Icons
- **CSS** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.IO** - WebSocket server
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication

### Database
- **MongoDB** - NoSQL database
- **Collections**: chatrooms, messages

## File Structure

```
hrms/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── ChatRoom.js       ✅ NEW
│   │   │   └── Message.js        ✅ NEW
│   │   ├── controllers/
│   │   │   └── chatController.js ✅ NEW
│   │   ├── routes/
│   │   │   └── chat.js           ✅ NEW
│   │   ├── config/
│   │   │   └── socket.js         ✅ NEW
│   │   └── server.js             🔧 UPDATED
│   └── package.json              🔧 UPDATED
├── ui/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── ChatContext.tsx   ✅ NEW
│   │   ├── services/
│   │   │   └── chatService.ts    ✅ NEW
│   │   ├── pages/common/
│   │   │   ├── ChatPage.tsx      ✅ NEW
│   │   │   └── ChatPage.css      ✅ NEW
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── ChatBadge.tsx ✅ NEW
│   │   │   └── layout/
│   │   │       └── Sidebar.tsx   🔧 UPDATED
│   │   └── App.tsx               🔧 UPDATED
│   ├── public/
│   │   ├── sounds/
│   │   │   └── chat-notification.mp3 📁 REQUIRED
│   │   └── chat-icon.png         📁 OPTIONAL
│   └── package.json              🔧 UPDATED
└── docs/
    ├── CHAT_MODULE_DOCUMENTATION.md  ✅ NEW
    ├── CHAT_MODULE_SUMMARY.md        ✅ NEW
    └── CHAT_QUICK_START.md           ✅ NEW
```

## Legend
- ✅ NEW: Completely new file (isolated)
- 🔧 UPDATED: Modified to integrate chat (minimal changes)
- 📁 REQUIRED: Asset file needed
- 📁 OPTIONAL: Asset file recommended but not required

---

**Last Updated**: 2025-12-20  
**Status**: Production Ready ✅
