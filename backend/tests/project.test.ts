import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

describe('Project Endpoints Integration Tests', () => {
  let token: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    const email = `project_tester_${Date.now()}@campus.edu`;
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      fullName: 'Project Tester',
      branch: 'Computer Science',
    });
    token = res.body.data.tokens.accessToken;
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new project idea', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Campus Food Delivery Bot',
        summary: 'Autonomous robot prototype for delivering campus dining meals.',
        description: 'Building an IoT delivery robot using ROS2, Python, and React Native control dashboard.',
        branch: 'Robotics',
        techStack: ['Python', 'ROS2', 'React Native'],
        status: 'RECRUITING',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Campus Food Delivery Bot');
    projectId = res.body.data.id;
  });

  it('should fetch list of projects with filtering', async () => {
    const res = await request(app)
      .get('/api/projects?techStack=Python')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projects.length).toBeGreaterThan(0);
  });

  it('should toggle upvote on a project', async () => {
    const upvoteRes = await request(app)
      .post(`/api/projects/${projectId}/upvote`)
      .set('Authorization', `Bearer ${token}`);

    expect(upvoteRes.status).toBe(200);
    expect(upvoteRes.body.data.hasUpvoted).toBe(true);
  });

  it('should post a comment on a project', async () => {
    const commentRes = await request(app)
      .post(`/api/projects/${projectId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Super cool project! I have experience with ROS2.' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.data.content).toContain('ROS2');
  });
});
