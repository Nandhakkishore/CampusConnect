// In-memory mock store for offline test execution when PostgreSQL is not running locally
export const mockStore = {
  users: [] as any[],
  profiles: [] as any[],
  refreshTokens: [] as any[],
  projects: [] as any[],
  upvotes: [] as any[],
  comments: [] as any[],
  applications: [] as any[],
  teams: [] as any[],
  teamMembers: [] as any[],
  conversations: [] as any[],
  participants: [] as any[],
  messages: [] as any[],
  gigs: [] as any[],
  notifications: [] as any[],
};

export const resetMockStore = () => {
  mockStore.users = [];
  mockStore.profiles = [];
  mockStore.refreshTokens = [];
  mockStore.projects = [];
  mockStore.upvotes = [];
  mockStore.comments = [];
  mockStore.applications = [];
  mockStore.teams = [];
  mockStore.teamMembers = [];
  mockStore.conversations = [];
  mockStore.participants = [];
  mockStore.messages = [];
  mockStore.gigs = [];
  mockStore.notifications = [];
};

export const mockPrisma = {
  $disconnect: jest.fn().mockResolvedValue(undefined),
  user: {
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      if (where.email) return mockStore.users.find((u) => u.email === where.email) || null;
      if (where.id) return mockStore.users.find((u) => u.id === where.id) || null;
      return null;
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const profileId = `prof_${Date.now()}`;
      const profile = {
        id: profileId,
        userId: id,
        fullName: data.profile?.create?.fullName || 'Test Student',
        branch: data.profile?.create?.branch || 'Computer Science',
        gradYear: data.profile?.create?.gradYear || 2026,
        skills: data.profile?.create?.skills || ['JavaScript'],
        lookingFor: data.profile?.create?.lookingFor || ['Partner'],
      };
      const user = {
        id,
        email: data.email,
        passwordHash: data.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile,
      };
      mockStore.users.push(user);
      mockStore.profiles.push(profile);
      return user;
    }),
  },
  profile: {
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.profiles.find((p) => p.userId === where.userId) || null;
    }),
    upsert: jest.fn().mockImplementation(async ({ where, create, update }: any) => {
      let existing = mockStore.profiles.find((p) => p.userId === where.userId);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const newProf = { id: `prof_${Date.now()}`, userId: where.userId, ...create };
      mockStore.profiles.push(newProf);
      return newProf;
    }),
  },
  refreshToken: {
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const record = { id: `rt_${Date.now()}`, ...data };
      mockStore.refreshTokens.push(record);
      return record;
    }),
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.refreshTokens.find((r) => r.token === where.token) || null;
    }),
    delete: jest.fn().mockImplementation(async ({ where }: any) => {
      mockStore.refreshTokens = mockStore.refreshTokens.filter((r) => r.id !== where.id);
      return { count: 1 };
    }),
    deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 })),
  },
  project: {
    findMany: jest.fn().mockImplementation(async () => mockStore.projects),
    count: jest.fn().mockImplementation(async () => mockStore.projects.length),
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.projects.find((p) => p.id === where.id) || null;
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const owner = mockStore.users.find((u) => u.id === data.ownerId);
      const project = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner,
        _count: { upvotes: 0, comments: 0, applications: 0 },
      };
      mockStore.projects.push(project);
      return project;
    }),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => {
      const project = mockStore.projects.find((p) => p.id === where.id);
      if (project) Object.assign(project, data);
      return project;
    }),
    delete: jest.fn().mockImplementation(async ({ where }: any) => {
      mockStore.projects = mockStore.projects.filter((p) => p.id !== where.id);
      return { count: 1 };
    }),
  },
  projectUpvote: {
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.upvotes.find(
        (u) => u.projectId === where.projectId_userId.projectId && u.userId === where.projectId_userId.userId
      ) || null;
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const upvote = { id: `up_${Date.now()}`, ...data };
      mockStore.upvotes.push(upvote);
      return upvote;
    }),
    delete: jest.fn().mockImplementation(async ({ where }: any) => {
      mockStore.upvotes = mockStore.upvotes.filter((u) => u.id !== where.id);
      return { count: 1 };
    }),
  },
  projectComment: {
    findMany: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.comments.filter((c) => c.projectId === where.projectId);
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const user = mockStore.users.find((u) => u.id === data.userId);
      const comment = { id: `comm_${Date.now()}`, ...data, createdAt: new Date(), user };
      mockStore.comments.push(comment);
      return comment;
    }),
  },
  application: {
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      let app = null;
      if (where.projectId_userId) {
        app = mockStore.applications.find(
          (a) => a.projectId === where.projectId_userId.projectId && a.userId === where.projectId_userId.userId
        );
      } else if (where.id) {
        app = mockStore.applications.find((a) => a.id === where.id);
      }
      if (app) {
        const project = mockStore.projects.find((p) => p.id === app.projectId);
        const applicant = mockStore.users.find((u) => u.id === app.userId);
        return { ...app, project, applicant };
      }
      return null;
    }),
    findMany: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.applications.filter((a) => a.projectId === where.projectId);
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const id = `app_${Date.now()}`;
      const applicant = mockStore.users.find((u) => u.id === data.userId);
      const project = mockStore.projects.find((p) => p.id === data.projectId);
      const application = { id, ...data, applicant, project, createdAt: new Date() };
      mockStore.applications.push(application);
      return application;
    }),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => {
      const app = mockStore.applications.find((a) => a.id === where.id);
      if (app) Object.assign(app, data);
      return app;
    }),
  },
  team: {
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      const team = mockStore.teams.find((t) => t.projectId === where.projectId);
      if (!team) return null;
      const members = mockStore.teamMembers.filter((m) => m.teamId === team.id);
      const conversation = mockStore.conversations.find((c) => c.teamId === team.id) || null;
      return { ...team, members, conversation };
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const team = { id: `team_${Date.now()}`, ...data, members: [], conversation: null };
      mockStore.teams.push(team);
      return team;
    }),
  },
  teamMember: {
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return mockStore.teamMembers.find(
        (tm) => tm.teamId === where.teamId_userId.teamId && tm.userId === where.teamId_userId.userId
      ) || null;
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const member = { id: `tm_${Date.now()}`, ...data };
      mockStore.teamMembers.push(member);
      return member;
    }),
  },
  chatConversation: {
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const conv = { id: `conv_${Date.now()}`, ...data, createdAt: new Date() };
      mockStore.conversations.push(conv);
      return conv;
    }),
  },
  conversationParticipant: {
    upsert: jest.fn().mockImplementation(async ({ create }: any) => {
      const part = { id: `part_${Date.now()}`, ...create };
      mockStore.participants.push(part);
      return part;
    }),
  },
  message: {
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const msg = { id: `msg_${Date.now()}`, ...data, createdAt: new Date() };
      mockStore.messages.push(msg);
      return msg;
    }),
  },
  notification: {
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const notif = { id: `notif_${Date.now()}`, ...data, createdAt: new Date(), isRead: false };
      mockStore.notifications.push(notif);
      return notif;
    }),
  },
};
