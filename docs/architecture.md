# CampusConnect - Architecture Overview

CampusConnect is structured as a pragmatic full-stack monorepo designed for real-time campus collaboration.

```mermaid
graph TD
    subgraph Mobile Client [React Native Mobile App]
        RN[React Native UI]
        RQ[React Query Server State]
        Zustand[Zustand Auth & Local State]
        SocketClient[Socket.io Client]
    end

    subgraph Backend Services [Node.js / Express Server]
        API[Express REST API]
        Auth[JWT Access & Refresh Auth]
        SocketServer[Socket.io Server]
        Services[Project, Team & Notification Engine]
    end

    subgraph Data & Storage [Database Layer]
        PG[(PostgreSQL Database)]
        Redis[(Redis Cache / Presence)]
    end

    RN -->|HTTP Requests / Axios| API
    SocketClient <-->|WebSocket Real-time Events| SocketServer
    API --> Auth
    API --> Services
    Services -->|Prisma ORM| PG
    SocketServer -->|Adapter & State| Redis
```

## Data Flow Highlights

1. **Authentication Flow**:
   - Short-lived Access Token (15 min) + Rotated Refresh Token (7 days stored in DB).
   - Axios request interceptor attaches Bearer token automatically; response interceptor triggers token rotation on 401.

2. **Team Formation & Automated Chat Provisioning**:
   - When a project owner accepts a pending applicant application (`PATCH /api/applications/:id/status`), the backend transaction:
     - Creates or attaches the `Team` record.
     - Adds owner (`OWNER`) and student (`MEMBER`) to `TeamMember`.
     - Creates a `TEAM` group chat in `ChatConversation`.
     - Injects an automated system message into the chat stream.
     - Pushes a real-time notification over Socket.io to the applicant.

3. **Real-time Messaging & Notifications**:
   - Socket connections authenticate via JWT handshake.
   - Users join private channels (`user:userId`) and active chat rooms (`conversation:conversationId`).
   - Typing indicators (`typing_start` / `typing_stop`) broadcast instantly across room participants.
