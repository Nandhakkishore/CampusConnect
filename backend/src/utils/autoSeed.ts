import bcrypt from 'bcryptjs';
import prisma from '../config/db';

export async function ensureSeedData() {
  try {
    const alex = await prisma.user.findUnique({
      where: { email: 'alex.chen@campus.edu' },
    });

    if (alex) {
      console.log('✅ Demo seed users already present.');
      return;
    }

    console.log('🌱 Seeding demo accounts (alex.chen@campus.edu, etc.)...');

    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    const usersData = [
      {
        email: 'alex.chen@campus.edu',
        fullName: 'Alex Chen',
        bio: 'Full-stack dev obsessed with React Native and AI Agents. Looking for hackathon teammates!',
        branch: 'Computer Science',
        gradYear: 2026,
        skills: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL'],
        lookingFor: ['Hackathon Teammates', 'UI/UX Designer'],
      },
      {
        email: 'maya.patel@campus.edu',
        fullName: 'Maya Patel',
        bio: 'ML researcher & Python developer. Building computer vision prototypes for campus automation.',
        branch: 'Artificial Intelligence',
        gradYear: 2025,
        skills: ['Python', 'PyTorch', 'OpenCV', 'FastAPI'],
        lookingFor: ['Frontend Engineer', 'Robotics Specialist'],
      },
      {
        email: 'liam.ross@campus.edu',
        fullName: 'Liam Ross',
        bio: 'UI/UX designer & Figma nerd. Crafting accessible, sleek dark mode interfaces.',
        branch: 'Information Technology',
        gradYear: 2026,
        skills: ['Figma', 'UI/UX Design', 'CSS'],
        lookingFor: ['Full-stack Developer', 'Co-founder'],
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: defaultPasswordHash,
          profile: {
            create: {
              fullName: u.fullName,
              bio: u.bio,
              branch: u.branch,
              gradYear: u.gradYear,
              skills: u.skills,
              lookingFor: u.lookingFor,
            },
          },
        },
        include: { profile: true },
      });
      createdUsers.push(user);
    }

    const [alexUser] = createdUsers;

    // Create sample demo project
    if (alexUser) {
      await prisma.project.create({
        data: {
          ownerId: alexUser.id,
          title: 'StudyBuddy AI - Automated Lecture Summarizer',
          summary: 'Record campus lectures and generate structured summaries, quiz cards, and mind maps automatically.',
          description: 'StudyBuddy AI is a mobile-first app designed for college students. Uses Whisper and LLM prompts.',
          branch: 'Computer Science',
          techStack: ['React Native', 'Node.js', 'Python'],
          status: 'RECRUITING',
        },
      });
    }

    console.log('✅ Auto-seeding completed successfully.');
  } catch (err) {
    console.error('⚠️ Auto-seed check error (non-fatal):', err);
  }
}
