export interface User {
  id: string;
  email: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  branch?: string | null;
  gradYear?: number | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  skills: string[];
  lookingFor: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectStatus = 'IDEA' | 'IN_PROGRESS' | 'RECRUITING' | 'COMPLETED';

export interface Project {
  id: string;
  ownerId: string;
  owner?: {
    id: string;
    email: string;
    profile?: Profile;
  };
  title: string;
  summary: string;
  description: string;
  branch?: string | null;
  techStack: string[];
  status: ProjectStatus;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    upvotes: number;
    comments: number;
    applications: number;
  };
  hasUpvoted?: boolean;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  user?: {
    id: string;
    profile?: Profile;
  };
  content: string;
  createdAt: string;
}

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Application {
  id: string;
  projectId: string;
  project?: Project;
  userId: string;
  applicant?: {
    id: string;
    email: string;
    profile?: Profile;
  };
  note: string;
  contactLink?: string | null;
  status: ApplicationStatus;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    profile?: Profile;
  };
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface Team {
  id: string;
  projectId: string;
  project?: Project;
  name: string;
  members: TeamMember[];
  conversation?: ChatConversation;
}

export interface ChatConversation {
  id: string;
  type: 'DIRECT' | 'TEAM';
  teamId?: string | null;
  name?: string | null;
  participants: {
    id: string;
    userId: string;
    user?: {
      id: string;
      email: string;
      profile?: Profile;
    };
    lastReadAt?: string | null;
  }[];
  lastMessage?: Message | null;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string | null;
  sender?: {
    id: string;
    profile?: Profile;
  } | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
}

export interface Gig {
  id: string;
  creatorId: string;
  creator?: {
    id: string;
    profile?: Profile;
  };
  title: string;
  description: string;
  category: string;
  stipend?: string | null;
  estimatedTime?: string | null;
  skillsRequired: string[];
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  _count?: {
    applications: number;
  };
  hasApplied?: boolean;
}

export interface GigApplication {
  id: string;
  gigId: string;
  applicantId: string;
  applicant?: {
    id: string;
    profile?: Profile;
  };
  pitchNote: string;
  portfolioLink?: string | null;
  status: ApplicationStatus;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'MESSAGE' | 'APPLICATION_STATUS' | 'NEW_MATCH' | 'SYSTEM';
  payload?: any;
  isRead: boolean;
  createdAt: string;
}
