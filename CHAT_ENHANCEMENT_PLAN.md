# Chat Module Enhancement - Implementation Plan

## 🎯 PRIORITY RANKING (Implement in this order)

### PHASE 1: Visual & UX Fundamentals (HIGH IMPACT, LOW RISK)
**Priority: IMMEDIATE** | **Est: 2-3 hours**

1. ✅ **User Avatars & Initials**
   - Add avatar component with fallback to initials
   - Color-coded based on user ID
   - Consistent across chat list, messages, header

2. ✅ **Improved Chat List Display**
   - Show display name instead of email
   - Add last message timestamp
   - Format timestamps (Today, Yesterday, date)
   - Better message preview truncation

3. ✅ **Search & Filter**
   - Search input for chat names
   - Filter buttons: All | Unread | Groups | Archived
   - Real-time filtering

4. ✅ **Empty States**
   - Custom empty state for no chats
   - Custom empty state for no results
   - CTA buttons for actions

### PHASE 2: Chat Management Actions (MEDIUM IMPACT, LOW RISK)
**Priority: HIGH** | **Est: 3-4 hours**

1. ✅ **Three-Dot Menu on Chat Items**
   - Delete chat (with confirmation)
   - Archive chat
   - Clear history (with confirmation)
   - Mute/unmute notifications
   - Pin/unpin chat
   - Mark as unread
   - Leave group (groups only)

2. ✅ **Backend API Endpoints**
   - POST /api/chat/rooms/:id/archive
   - POST /api/chat/rooms/:id/delete
   - POST /api/chat/rooms/:id/clear-history
   - POST /api/chat/rooms/:id/mute
   - POST /api/chat/rooms/:id/pin

3. ✅ **Database Schema Updates**
   - Add `isArchived`, `isPinned`, `isMuted` to ChatRoom
   - Add `deletedAt` for soft delete
   - No breaking changes to existing schema

### PHASE 3: Real-Time Presence System (HIGH IMPACT, MEDIUM RISK)
**Priority: HIGH** | **Est: 4-5 hours**

1. ✅ **Backend Presence Tracking**
   - Track user online/offline via WebSocket
   - Store presence in memory (Redis or in-memory map)
   - Broadcast presence updates
   - Auto-offline after disconnect
   - Away after inactivity

2. ✅ **Frontend Presence Display**
   - Green dot (🟢) for online
   - Orange dot (🟠) for away  
   - Grey dot (⚪) for offline
   - Show in: chat list, chat header, floating bubble
   - Last seen timestamp for offline users

3. ✅ **WebSocket Events**
   - `user_online` - Broadcast when user connects
   - `user_offline` - Broadcast when user disconnects
   - `user_away` - Broadcast after inactivity
   - `presence_update` - Subscribe to presence changes

### PHASE 4: Enhanced Chat Window (MEDIUM IMPACT, LOW RISK)
**Priority: MEDIUM** | **Est: 2-3 hours**

1. ✅ **Message Improvements**
   - Show user avatar in messages
   - Read receipts (checkmarks)
   - Better timestamp display
   - Message status indicators

2. ✅ **Typing Indicator Enhancement**
   - Show user name who is typing
   - Multiple users typing support

3. ✅ **Chat Header Enhancement**  
   - User avatar
   - Online status
   - Last seen info
   - Group member count with avatars

### PHASE 5: Polish & Optimization (LOW IMPACT, LOW RISK)
**Priority: MEDIUM** | **Est: 2-3 hours**

1. ✅ **Floating Chat Bubble Sync**
   - Sync unread count
   - Show online status
   - Open last active chat
   - Position optimization

2. ✅ **Performance Optimizations**
   - Virtualized chat list for large datasets
   - Message pagination
   - Lazy load images
   - Debounce search

3. ✅ **Accessibility**
   - Keyboard navigation
   - ARIA labels
   - Screen reader support
   - Focus management

---

## 📋 IMPLEMENTATION CHECKLIST

### Files to Create/Modify

#### Frontend (React/TypeScript)
- [ ] `ui/src/components/chat/UserAvatar.tsx` - ✅ NEW
- [ ] `ui/src/components/chat/ChatListItem.tsx` - ✅ NEW  
- [ ] `ui/src/components/chat/ChatActions.tsx` - ✅ NEW
- [ ] `ui/src/components/chat/PresenceIndicator.tsx` - ✅ NEW
- [ ] `ui/src/pages/common/ChatPage.tsx` - 🔧 MAJOR UPDATE
- [ ] `ui/src/pages/common/ChatPage.css` - 🔧 UPDATE
- [ ] `ui/src/contexts/ChatContext.tsx` - 🔧 UPDATE (presence)
- [ ] `ui/src/services/chatService.ts` - 🔧 UPDATE (new APIs)
- [ ] `ui/src/utils/chatHelpers.ts` - ✅ NEW (utility functions)

#### Backend (Node.js)
- [ ] `backend/src/models/ChatRoom.js` - 🔧 UPDATE (add fields)
- [ ] `backend/src/controllers/chatController.js` - 🔧 UPDATE (new actions)
- [ ] `backend/src/routes/chat.js` - 🔧 UPDATE (new endpoints)
- [ ] `backend/src/config/socket.js` - 🔧 UPDATE (presence events)
- [ ] `backend/src/utils/presenceManager.js` - ✅ NEW

---

## 🚫 STRICT CONSTRAINTS (DO NOT VIOLATE)

❌ **Database Schema**
- Do NOT add foreign key constraints
- Do NOT modify existing collections structure
- Use soft deletes only (deletedAt field)
- Archive flag instead of deleting

❌ **API Contracts**
- Do NOT change existing endpoint signatures
- Do NOT remove existing fields from responses
- Add new fields as optional
- Maintain backward compatibility

❌ **Other Modules**
- Do NOT import from other HRMS modules
- Do NOT modify User model
- Do NOT affect payroll, attendance, etc.
- Read-only access to user data

❌ **Mobile App**
- Do NOT change WebSocket event names
- Do NOT change message structure
- Ensure mobile can still send/receive
- No breaking changes to socket.io protocol

---

## 🎨 UI/UX DESIGN PATTERNS

### Color Scheme
```css
--online-green: #10b981
--away-orange: #f59e0b
--offline-gray: #6b7280
--unread-badge: #3b82f6
--hover-bg: #f3f4f6
--active-bg: #e5e7eb
```

### Avatar Colors (Based on user ID hash)
```javascript
const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
const color = colors[userId.charCodeAt(0) % colors.length];
```

### Typography
- Chat names: 14px, font-weight: 500
- Last message: 12px, color: #6b7280
- Timestamps: 11px, color: #9ca3af
- Unread badge: 11px, font-weight: 600

---

## 🔌 WEBSOCKET EVENTS (New)

### Client → Server
```typescript
socket.emit('update_presence', { status: 'online' | 'away' });
socket.emit('request_presence', { userIds: string[] });
```

### Server → Client
```typescript
socket.on('presence_update', { userId: string, status: string, lastSeen?: Date });
socket.on('user_online', { userId: string });
socket.on('user_offline', { userId: string, lastSeen: Date });
```

---

## 📊 API ENDPOINTS (New)

### Chat Management
```
POST   /api/chat/rooms/:id/archive
POST   /api/chat/rooms/:id/unarchive
DELETE /api/chat/rooms/:id (soft delete)
POST   /api/chat/rooms/:id/clear-history
POST   /api/chat/rooms/:id/mute
POST   /api/chat/rooms/:id/unmute
POST   /api/chat/rooms/:id/pin
POST   /api/chat/rooms/:id/unpin
POST   /api/chat/rooms/:id/mark-unread
POST   /api/chat/rooms/:id/leave (groups only)
```

### Presence
```
GET    /api/chat/presence/:userId
GET    /api/chat/presence (batch - query params: userIds[])
```

---

## 🧪 TESTING CHECKLIST

### Visual Tests
- [ ] Avatars display correctly
- [ ] Presence indicators show correct color
- [ ] Timestamps format properly
- [ ] Search filters work
- [ ] Empty states display

### Functional Tests
- [ ] Delete chat removes it from list
- [ ] Archive hides chat (show in Archive filter)
- [ ] Clear history empties messages
- [ ] Mute prevents notifications
- [ ] Pin keeps chat at top
- [ ] Presence updates in real-time

### Edge Cases
- [ ] Long chat names truncate
- [ ] Many unread messages (999+)
- [ ] Offline user shows last seen
- [ ] No avatar fallback works
- [ ] Empty search results

### Performance Tests
- [ ] 100+ chats load quickly
- [ ] Search is responsive
- [ ] Presence updates don't lag
- [ ] Scroll is smooth

---

## 📝 IMPLEMENTATION NOTES

### Avatar Generation
```typescript
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(userId: string): string {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
```

### Timestamp Formatting
```typescript
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
```

### Presence Logic
```typescript
// Server-side presence manager
class PresenceManager {
  private userPresence = new Map<string, { status: string, lastSeen: Date }>();
  
  setOnline(userId: string) {
    this.userPresence.set(userId, { status: 'online', lastSeen: new Date() });
  }
  
  setAway(userId: string) {
    const current = this.userPresence.get(userId);
    if (current) {
      this.userPresence.set(userId, { ...current, status: 'away' });
    }
  }
  
  setOffline(userId: string) {
    this.userPresence.set(userId, { status: 'offline', lastSeen: new Date() });
  }
  
  getStatus(userId: string) {
    return this.userPresence.get(userId) || { status: 'offline', lastSeen: new Date() };
  }
}
```

---

## 🚀 DEPLOYMENT STRATEGY

### Phase 1: Deploy Visual Updates
- No backend changes needed
- No breaking changes
- Safe to deploy immediately
- Toggle with feature flag if needed

### Phase 2: Deploy Chat Actions
- Requires backend deployment first
- Database migration for new fields
- Test with small user group
- Monitor error rates

### Phase 3: Deploy Presence System
- Requires coordinated backend + frontend deploy
- May need Redis for production scale
- Monitor WebSocket connection count
- Fallback to polling if WS fails

---

## ✅ SUCCESS METRICS

- [ ] Chat list shows all required info (avatar, name, preview, time, badge)
- [ ] All chat actions work (delete, archive, mute, pin, clear)
- [ ] Presence updates within 2 seconds
- [ ] Search results appear instantly (<100ms)
- [ ] No regression in existing functionality
- [ ] No console errors
- [ ] Mobile app still works

---

**Status**: Ready for Implementation
**Last Updated**: 2026-01-06
**Priority**: CRITICAL
