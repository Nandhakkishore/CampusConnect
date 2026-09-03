import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CampusConnect database with realistic campus demo data...');

  // Clean existing tables
  await prisma.notification.deleteMany();
  await prisma.gigApplication.deleteMany();
  await prisma.gig.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.application.deleteMany();
  await prisma.projectComment.deleteMany();
  await prisma.projectUpvote.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create 10+ Student Users & Profiles
  const usersData = [
    {
      email: 'alex.chen@campus.edu',
      fullName: 'Alex Chen',
      bio: 'Full-stack dev obsessed with React Native and AI Agents. Looking for hackathon teammates!',
      branch: 'Computer Science',
      gradYear: 2026,
      skills: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind'],
      lookingFor: ['Hackathon Teammates', 'UI/UX Designer'],
      githubUrl: 'https://github.com/alexchen-dev',
      portfolioUrl: 'https://alexchen.dev',
    },
    {
      email: 'maya.patel@campus.edu',
      fullName: 'Maya Patel',
      bio: 'ML researcher & Python developer. Building computer vision prototypes for campus automation.',
      branch: 'Artificial Intelligence',
      gradYear: 2025,
      skills: ['Python', 'PyTorch', 'OpenCV', 'FastAPI', 'Docker'],
      lookingFor: ['Frontend Engineer', 'Robotics Specialist'],
      githubUrl: 'https://github.com/mayapatel-ai',
    },
    {
      email: 'liam.ross@campus.edu',
      fullName: 'Liam Ross',
      bio: 'UI/UX designer & Figma nerd. Crafting accessible, sleek dark mode interfaces.',
      branch: 'Information Technology',
      gradYear: 2026,
      skills: ['Figma', 'UI/UX Design', 'CSS', 'Framer', 'Prototyping'],
      lookingFor: ['Full-stack Developer', 'Co-founder'],
      portfolioUrl: 'https://liamdesign.craft.me',
    },
    {
      email: 'sophia.kim@campus.edu',
      fullName: 'Sophia Kim',
      bio: 'Cybersecurity sophomore & Rust enthusiast. Passionate about decentralized systems.',
      branch: 'Cybersecurity',
      gradYear: 2027,
      skills: ['Rust', 'C++', 'Linux', 'Network Security', 'Go'],
      lookingFor: ['Project Collaborator'],
      githubUrl: 'https://github.com/sophiakim-sec',
    },
    {
      email: 'marcus.vance@campus.edu',
      fullName: 'Marcus Vance',
      bio: 'Embedded systems engineer. Building IoT hardware and smart green energy trackers.',
      branch: 'Electrical Engineering',
      gradYear: 2025,
      skills: ['Embedded C', 'Arduino', 'Raspberry Pi', 'Python', 'PCB Design'],
      lookingFor: ['Mobile Developer', 'Cloud Engineer'],
    },
    {
      email: 'emily.zhang@campus.edu',
      fullName: 'Emily Zhang',
      bio: 'Data scientist & backend architect. Love PostgreSQL queries and Redis caching.',
      branch: 'Data Science',
      gradYear: 2026,
      skills: ['Python', 'SQL', 'PostgreSQL', 'Redis', 'Docker', 'R'],
      lookingFor: ['ML Engineer', 'Frontend Dev'],
      githubUrl: 'https://github.com/emilyzhang-ds',
    },
    {
      email: 'jordan.taylor@campus.edu',
      fullName: 'Jordan Taylor',
      bio: 'Flutter enthusiast & mobile growth hacker. Always down for weekend hackathons!',
      branch: 'Software Engineering',
      gradYear: 2026,
      skills: ['Flutter', 'Dart', 'Firebase', 'GraphQL'],
      lookingFor: ['Backend Developer'],
    },
    {
      email: 'priya.sharma@campus.edu',
      fullName: 'Priya Sharma',
      bio: 'Product manager & tech speaker. Passionate about building student community apps.',
      branch: 'Business Tech',
      gradYear: 2025,
      skills: ['Product Management', 'Wireframing', 'Agile', 'User Research'],
      lookingFor: ['Full-stack Developer', 'Lead Designer'],
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
            githubUrl: u.githubUrl || null,
            portfolioUrl: u.portfolioUrl || null,
          },
        },
      },
      include: { profile: true },
    });
    createdUsers.push(user);
  }

  const [alex, maya, liam, sophia, marcus, emily, jordan, priya] = createdUsers;

  console.log(`✅ Created ${createdUsers.length} student user profiles.`);

  // 2. Create Projects / Idea Pitches
  const p1 = await prisma.project.create({
    data: {
      ownerId: alex.id,
      title: 'StudyBuddy AI - Automated Lecture Summarizer',
      summary: 'Record campus lectures and generate structured summaries, quiz cards, and mind maps automatically.',
      description: 'StudyBuddy AI is a mobile-first app designed for college students. It uses Whisper for audio transcription and LLM prompts to synthesize bullet points, highlight formula definitions, and export Anki flashcards. We are looking for UI designers and Python backend devs!',
      branch: 'Computer Science',
      techStack: ['React Native', 'Node.js', 'Python', 'OpenAI API', 'Tailwind'],
      status: 'RECRUITING',
      repositoryUrl: 'https://github.com/alexchen-dev/studybuddy-ai',
      upvotes: {
        create: [
          { userId: maya.id },
          { userId: liam.id },
          { userId: emily.id },
          { userId: priya.id },
        ],
      },
      comments: {
        create: [
          { userId: maya.id, content: 'Love this idea! I can help connect the Whisper transcription pipeline in Python.' },
          { userId: liam.id, content: 'I can design the flashcard review UI in Figma!' },
        ],
      },
    },
  });

  const p2 = await prisma.project.create({
    data: {
      ownerId: maya.id,
      title: 'EcoCampus - Smart Recycling Trash Can IoT',
      summary: 'Smart waste bin equipped with camera vision that auto-sorts plastics, paper, and compost on campus.',
      description: 'Using lightweight YOLO models on Raspberry Pi 4, EcoCampus sorts thrown items into proper recycling chambers and awards points to students via mobile QR code. Need an embedded C/Python dev and a mobile app dev.',
      branch: 'Artificial Intelligence',
      techStack: ['Python', 'PyTorch', 'OpenCV', 'Raspberry Pi', 'Flutter'],
      status: 'RECRUITING',
      upvotes: {
        create: [
          { userId: alex.id },
          { userId: marcus.id },
          { userId: sophia.id },
        ],
      },
      comments: {
        create: [
          { userId: marcus.id, content: 'I have 3 Raspberry Pi boards we can use for testing in the EE lab!' },
        ],
      },
    },
  });

  const p3 = await prisma.project.create({
    data: {
      ownerId: marcus.id,
      title: 'Campus Energy Grid Dashboard',
      summary: 'Real-time telemetry monitor tracking solar panel output across university building roofs.',
      description: 'A Web & Mobile dashboard consuming MQTT telemetry stream from campus solar arrays. Visualizes live KWh production, battery storage levels, and CO2 offset metrics.',
      branch: 'Electrical Engineering',
      techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Grafana'],
      status: 'IN_PROGRESS',
      upvotes: {
        create: [
          { userId: emily.id },
          { userId: alex.id },
        ],
      },
    },
  });

  const p4 = await prisma.project.create({
    data: {
      ownerId: sophia.id,
      title: 'PeerShield - Zero-Knowledge Campus Pass',
      summary: 'Privacy-preserving digital campus credentials using ZK-snarks.',
      description: 'Allows students to prove dorm residence, lab access permissions, and student discount eligibility without disclosing full SSN or personal address.',
      branch: 'Cybersecurity',
      techStack: ['Rust', 'Circom', 'TypeScript', 'React Native'],
      status: 'RECRUITING',
      upvotes: {
        create: [{ userId: alex.id }, { userId: emily.id }],
      },
    },
  });

  console.log('✅ Created project ideas, upvotes, and comments.');

  // 3. Create Team Applications & Team Chat
  const app1 = await prisma.application.create({
    data: {
      projectId: p1.id,
      userId: maya.id,
      note: 'Hey Alex! I built an audio transcription script last semester. Would love to handle the Python API service.',
      contactLink: 'https://github.com/mayapatel-ai',
      status: 'ACCEPTED',
    },
  });

  const app2 = await prisma.application.create({
    data: {
      projectId: p1.id,
      userId: liam.id,
      note: 'Super interested in designing the mobile UI & dark theme component library!',
      contactLink: 'https://liamdesign.craft.me',
      status: 'ACCEPTED',
    },
  });

  // Create Team & Chat for StudyBuddy AI
  const team1 = await prisma.team.create({
    data: {
      projectId: p1.id,
      name: 'StudyBuddy AI Team',
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: maya.id, role: 'MEMBER' },
          { userId: liam.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const chat1 = await prisma.chatConversation.create({
    data: {
      type: 'TEAM',
      teamId: team1.id,
      name: 'StudyBuddy AI Team Chat',
      participants: {
        create: [
          { userId: alex.id },
          { userId: maya.id },
          { userId: liam.id },
        ],
      },
      messages: {
        create: [
          { isSystem: true, content: '🎉 StudyBuddy AI team created!' },
          { senderId: alex.id, content: 'Welcome guys! Glad to have you onboard.' },
          { senderId: maya.id, content: 'Thanks Alex! I just pushed the initial FastAPI endpoint for audio processing.' },
          { senderId: liam.id, content: 'Awesome! I will share Figma wireframes by tomorrow evening.' },
        ],
      },
    },
  });

  // 4. Create 1:1 Direct Chat
  await prisma.chatConversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [
          { userId: alex.id },
          { userId: sophia.id },
        ],
      },
      messages: {
        create: [
          { senderId: sophia.id, content: 'Hey Alex! Saw your StudyBuddy project. Is there any room for ZK auth integration?' },
          { senderId: alex.id, content: 'Hey Sophia! That would actually be super cool for verified student access.' },
        ],
      },
    },
  });

  console.log('✅ Created team applications, group chats, and direct messages.');

  // 5. Create Internal Gigs
  await prisma.gig.create({
    data: {
      creatorId: alex.id,
      title: 'Fix React Native Navigation Deep Linking',
      description: 'Need help configuring universal deep links for our mobile app so push notifications open directly into team chat rooms.',
      category: 'Frontend',
      stipend: '$40 Bounty',
      estimatedTime: '2 days',
      skillsRequired: ['React Native', 'React Navigation', 'TypeScript'],
      status: 'OPEN',
    },
  });

  await prisma.gig.create({
    data: {
      creatorId: liam.id,
      title: 'Design 5 Custom Vector Badges in Figma',
      description: 'Looking for a student graphic illustrator to draw 5 achievements badges (e.g. Code Wizard, Hackathon Winner, Top Contributor).',
      category: 'Design / UI',
      stipend: '$50 Bounty',
      estimatedTime: '3 days',
      skillsRequired: ['Figma', 'Illustrator', 'UI Design'],
      status: 'OPEN',
    },
  });

  await prisma.gig.create({
    data: {
      creatorId: emily.id,
      title: 'Optimize PostgreSQL Indexing for Chat History',
      description: 'Query tuning for fast paginated message fetching under heavy socket load. Need someone familiar with EXPLAIN ANALYZE.',
      category: 'Backend',
      stipend: '$60 Bounty',
      estimatedTime: '1 day',
      skillsRequired: ['PostgreSQL', 'SQL Optimization', 'Prisma'],
      status: 'OPEN',
    },
  });

  console.log('✅ Created internal campus gigs.');

  // 6. Create Notifications
  await prisma.notification.create({
    data: {
      userId: maya.id,
      title: 'Application Accepted! 🎉',
      message: 'Alex Chen accepted your application to join "StudyBuddy AI". Tap to join group chat!',
      type: 'APPLICATION_STATUS',
      payload: { conversationId: chat1.id, projectId: p1.id },
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: alex.id,
      title: 'New Message',
      message: 'Sophia Kim: Hey Alex! Saw your StudyBuddy project...',
      type: 'MESSAGE',
      isRead: true,
    },
  });

  console.log('🌱 CampusConnect database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
