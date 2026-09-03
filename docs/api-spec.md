# CampusConnect - API Endpoint Specification

All endpoints prefix with `/api`. Protected endpoints require header: `Authorization: Bearer <accessToken>`.

## Authentication (`/api/auth`)
- `POST /api/auth/register`: Create user account & profile (`email`, `password`, `fullName`, `branch`, `gradYear`).
- `POST /api/auth/login`: Authenticate credentials (`email`, `password`).
- `POST /api/auth/refresh`: Rotate refresh token (`refreshToken`).
- `POST /api/auth/logout`: Invalidate refresh token.
- `GET /api/auth/me`: Fetch authenticated user profile.

## Profiles (`/api/profiles`)
- `GET /api/profiles/me`: Get current user's profile.
- `PUT /api/profiles/me`: Update profile bio, skills array, lookingFor tags, GitHub & portfolio URLs.
- `GET /api/profiles/user/:userId`: View student profile by ID.

## Projects & Ideas (`/api/projects`)
- `GET /api/projects`: Query project ideas (`search`, `branch`, `techStack`, `status`, pagination).
- `GET /api/projects/:id`: Get project details with upvote status and comment counts.
- `POST /api/projects`: Create project idea pitch.
- `PUT /api/projects/:id`: Update owned project idea.
- `DELETE /api/projects/:id`: Remove project idea.
- `POST /api/projects/:id/upvote`: Toggle upvote on project.
- `GET /api/projects/:id/comments`: Fetch project discussion comments.
- `POST /api/projects/:id/comments`: Add comment to project.

## Team Formation & Applications (`/api`)
- `POST /api/projects/:id/apply`: Submit application to join project team (`note`, `contactLink`).
- `GET /api/projects/:id/applications`: List project applications (Owner only).
- `PATCH /api/applications/:applicationId/status`: Accept or Reject application (`status: 'ACCEPTED' | 'REJECTED'`). Auto-generates team group chat on acceptance.

## Real-time Chat (`/api/chat`)
- `GET /api/chat/conversations`: List user's 1:1 and team group chats.
- `GET /api/chat/conversations/:id/messages`: Fetch chat message history.
- `POST /api/chat/conversations/direct`: Get or start direct 1:1 chat with student.

## Campus Gigs (`/api/gigs`)
- `GET /api/gigs`: Browse mini campus gigs (`category`, `search`, `status`).
- `POST /api/gigs`: Post a new internal gig (`title`, `description`, `category`, `stipend`, `estimatedTime`, `skillsRequired`).
- `POST /api/gigs/:id/apply`: Apply for a gig (`pitchNote`, `portfolioLink`).

## Notifications (`/api/notifications`)
- `GET /api/notifications`: Fetch in-app notifications and unread counter.
- `PATCH /api/notifications/:id/read`: Mark single notification as read.
- `POST /api/notifications/read-all`: Mark all notifications as read.
