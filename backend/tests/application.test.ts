import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import { resetMockStore } from './mockDb';
import { describe, it } from 'node:test';

describe('Team Formation & Application Integration Tests', () => {
  let ownerToken: string;
  let applicantToken: string;
  let applicantId: string;
  let projectId: string;
  let applicationId: string;

  beforeAll(async () => {
    resetMockStore();
    // Register owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      email: `owner_${Date.now()}@campus.edu`,
      password: 'password123',
      fullName: 'Project Owner',
    });
    ownerToken = ownerRes.body.data.tokens.accessToken;

    // Create project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Hackathon AI Assistant',
        summary: 'Smart assistant for hackathon pitch creation.',
        description: 'Building an LLM agent that structures slide decks and project demos in real time.',
        techStack: ['Python', 'OpenAI', 'React'],
      });
    projectId = projectRes.body.data.id;

    // Register applicant
    const appRes = await request(app).post('/api/auth/register').send({
      email: `applicant_${Date.now()}@campus.edu`,
      password: 'password123',
      fullName: 'Jane Developer',
    });
    applicantToken = appRes.body.data.tokens.accessToken;
    applicantId = appRes.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow student to apply to a project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/apply`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        note: 'I love AI agent development and would be thrilled to join!',
        contactLink: 'https://github.com/janedev',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    applicationId = res.body.data.id;
  });

  it('should allow project owner to list applications', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/applications`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(applicationId);
  });

  it('should auto-create team and group chat when owner accepts application', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');

    // Verify team created in DB
    const team = await prisma.team.findUnique({
      where: { projectId },
      include: { members: true, conversation: true },
    });

    expect(team).not.toBeNull();
    expect(team?.members.length).toBe(2);
    expect(team?.conversation).not.toBeNull();
  });
});
function beforeAll(arg0: () => Promise<void>) {
  throw new Error('Function not implemented.');
}

function afterAll(arg0: () => Promise<void>) {
  throw new Error('Function not implemented.');
}

function expect(status: number) {
  throw new Error('Function not implemented.');
}

