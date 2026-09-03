"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPrisma = exports.resetMockStore = exports.mockStore = void 0;
const createMockFn = (impl) => {
    const globalObj = globalThis;
    if (typeof globalObj.jest !== 'undefined' && globalObj.jest.fn) {
        return globalObj.jest.fn(impl);
    }
    return impl || (() => Promise.resolve(null));
};
exports.mockStore = {
    users: [],
    profiles: [],
    refreshTokens: [],
    projects: [],
    upvotes: [],
    comments: [],
    applications: [],
    teams: [],
    teamMembers: [],
    conversations: [],
    participants: [],
    messages: [],
    gigs: [],
    notifications: [],
};
const resetMockStore = () => {
    exports.mockStore.users = [];
    exports.mockStore.profiles = [];
    exports.mockStore.refreshTokens = [];
    exports.mockStore.projects = [];
    exports.mockStore.upvotes = [];
    exports.mockStore.comments = [];
    exports.mockStore.applications = [];
    exports.mockStore.teams = [];
    exports.mockStore.teamMembers = [];
    exports.mockStore.conversations = [];
    exports.mockStore.participants = [];
    exports.mockStore.messages = [];
    exports.mockStore.gigs = [];
    exports.mockStore.notifications = [];
};
exports.resetMockStore = resetMockStore;
exports.mockPrisma = {
    $disconnect: createMockFn(async () => undefined),
    user: {
        findUnique: createMockFn(async ({ where }) => {
            if (where.email)
                return exports.mockStore.users.find((u) => u.email === where.email) || null;
            if (where.id)
                return exports.mockStore.users.find((u) => u.id === where.id) || null;
            return null;
        }),
        create: createMockFn(async ({ data }) => {
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
            exports.mockStore.users.push(user);
            exports.mockStore.profiles.push(profile);
            return user;
        }),
    },
    profile: {
        findUnique: createMockFn(async ({ where }) => {
            return exports.mockStore.profiles.find((p) => p.userId === where.userId) || null;
        }),
        upsert: createMockFn(async ({ where, create, update }) => {
            let existing = exports.mockStore.profiles.find((p) => p.userId === where.userId);
            if (existing) {
                Object.assign(existing, update);
                return existing;
            }
            const newProf = { id: `prof_${Date.now()}`, userId: where.userId, ...create };
            exports.mockStore.profiles.push(newProf);
            return newProf;
        }),
    },
    refreshToken: {
        create: createMockFn(async ({ data }) => {
            const record = { id: `rt_${Date.now()}`, ...data };
            exports.mockStore.refreshTokens.push(record);
            return record;
        }),
        findUnique: createMockFn(async ({ where }) => {
            return exports.mockStore.refreshTokens.find((r) => r.token === where.token) || null;
        }),
        delete: createMockFn(async ({ where }) => {
            exports.mockStore.refreshTokens = exports.mockStore.refreshTokens.filter((r) => r.id !== where.id);
            return { count: 1 };
        }),
        deleteMany: createMockFn(async () => ({ count: 1 })),
    },
    project: {
        findMany: createMockFn(async () => exports.mockStore.projects),
        count: createMockFn(async () => exports.mockStore.projects.length),
        findUnique: createMockFn(async ({ where }) => {
            return exports.mockStore.projects.find((p) => p.id === where.id) || null;
        }),
        create: createMockFn(async ({ data }) => {
            const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const owner = exports.mockStore.users.find((u) => u.id === data.ownerId);
            const project = {
                id,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
                owner,
                _count: { upvotes: 0, comments: 0, applications: 0 },
            };
            exports.mockStore.projects.push(project);
            return project;
        }),
        update: createMockFn(async ({ where, data }) => {
            const project = exports.mockStore.projects.find((p) => p.id === where.id);
            if (project)
                Object.assign(project, data);
            return project;
        }),
        delete: createMockFn(async ({ where }) => {
            exports.mockStore.projects = exports.mockStore.projects.filter((p) => p.id !== where.id);
            return { count: 1 };
        }),
    },
    projectUpvote: {
        findUnique: createMockFn(async ({ where }) => {
            return exports.mockStore.upvotes.find((u) => u.projectId === where.projectId_userId.projectId && u.userId === where.projectId_userId.userId) || null;
        }),
        create: createMockFn(async ({ data }) => {
            const upvote = { id: `up_${Date.now()}`, ...data };
            exports.mockStore.upvotes.push(upvote);
            return upvote;
        }),
        delete: createMockFn(async ({ where }) => {
            exports.mockStore.upvotes = exports.mockStore.upvotes.filter((u) => u.id !== where.id);
            return { count: 1 };
        }),
    },
    projectComment: {
        findMany: createMockFn(async ({ where }) => {
            return exports.mockStore.comments.filter((c) => c.projectId === where.projectId);
        }),
        create: createMockFn(async ({ data }) => {
            const user = exports.mockStore.users.find((u) => u.id === data.userId);
            const comment = { id: `comm_${Date.now()}`, ...data, createdAt: new Date(), user };
            exports.mockStore.comments.push(comment);
            return comment;
        }),
    },
    application: {
        findUnique: createMockFn(async ({ where }) => {
            let app = null;
            if (where.projectId_userId) {
                app = exports.mockStore.applications.find((a) => a.projectId === where.projectId_userId.projectId && a.userId === where.projectId_userId.userId);
            }
            else if (where.id) {
                app = exports.mockStore.applications.find((a) => a.id === where.id);
            }
            if (app) {
                const project = exports.mockStore.projects.find((p) => p.id === app.projectId);
                const applicant = exports.mockStore.users.find((u) => u.id === app.userId);
                return { ...app, project, applicant };
            }
            return null;
        }),
        findMany: createMockFn(async ({ where }) => {
            return exports.mockStore.applications.filter((a) => a.projectId === where.projectId);
        }),
        create: createMockFn(async ({ data }) => {
            const id = `app_${Date.now()}`;
            const applicant = exports.mockStore.users.find((u) => u.id === data.userId);
            const project = exports.mockStore.projects.find((p) => p.id === data.projectId);
            const application = { id, ...data, applicant, project, createdAt: new Date() };
            exports.mockStore.applications.push(application);
            return application;
        }),
        update: createMockFn(async ({ where, data }) => {
            const app = exports.mockStore.applications.find((a) => a.id === where.id);
            if (app)
                Object.assign(app, data);
            return app;
        }),
    },
    team: {
        findUnique: createMockFn(async ({ where }) => {
            const team = exports.mockStore.teams.find((t) => t.projectId === where.projectId);
            if (!team)
                return null;
            const members = exports.mockStore.teamMembers.filter((m) => m.teamId === team.id);
            const conversation = exports.mockStore.conversations.find((c) => c.teamId === team.id) || null;
            return { ...team, members, conversation };
        }),
        create: createMockFn(async ({ data }) => {
            const team = { id: `team_${Date.now()}`, ...data, members: [], conversation: null };
            exports.mockStore.teams.push(team);
            return team;
        }),
    },
    teamMember: {
        findUnique: createMockFn(async ({ where }) => {
            return exports.mockStore.teamMembers.find((tm) => tm.teamId === where.teamId_userId.teamId && tm.userId === where.teamId_userId.userId) || null;
        }),
        create: createMockFn(async ({ data }) => {
            const member = { id: `tm_${Date.now()}`, ...data };
            exports.mockStore.teamMembers.push(member);
            return member;
        }),
    },
    chatConversation: {
        create: createMockFn(async ({ data }) => {
            const conv = { id: `conv_${Date.now()}`, ...data, createdAt: new Date() };
            exports.mockStore.conversations.push(conv);
            return conv;
        }),
    },
    conversationParticipant: {
        upsert: createMockFn(async ({ create }) => {
            const part = { id: `part_${Date.now()}`, ...create };
            exports.mockStore.participants.push(part);
            return part;
        }),
    },
    message: {
        create: createMockFn(async ({ data }) => {
            const msg = { id: `msg_${Date.now()}`, ...data, createdAt: new Date() };
            exports.mockStore.messages.push(msg);
            return msg;
        }),
    },
    notification: {
        create: createMockFn(async ({ data }) => {
            const notif = { id: `notif_${Date.now()}`, ...data, createdAt: new Date(), isRead: false };
            exports.mockStore.notifications.push(notif);
            return notif;
        }),
    },
};
