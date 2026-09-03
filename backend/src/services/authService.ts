import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  branch?: string;
  gradYear?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw { statusCode: 400, message: 'User with this email already exists' };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      profile: {
        create: {
          fullName: input.fullName,
          branch: input.branch || 'Computer Science',
          gradYear: input.gradYear || new Date().getFullYear() + 2,
          skills: ['JavaScript', 'React'],
          lookingFor: ['Project Partner', 'Hackathon Team'],
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const tokens = generateTokens({ userId: user.id, email: user.email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile,
    },
    tokens,
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { profile: true },
  });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile,
    },
    tokens,
  };
};

export const refreshAuthTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    throw { statusCode: 401, message: 'Invalid or expired refresh token' };
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const newTokens = generateTokens({ userId: user.id, email: user.email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newTokens.refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile,
    },
    tokens: newTokens,
  };
};

export const logoutUser = async (token?: string) => {
  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }
  return true;
};

export const loginOrCreateGoogleUser = async (email: string, fullName?: string, avatarUrl?: string) => {
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            fullName: fullName || email.split('@')[0],
            avatarUrl: avatarUrl || null,
            branch: 'Computer Science',
            gradYear: new Date().getFullYear() + 2,
            skills: ['JavaScript'],
            lookingFor: ['Project Teammates'],
          },
        },
      },
      include: { profile: true },
    });
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile,
    },
    tokens,
  };
};

export const loginOrCreateGithubUser = async (username: string) => {
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
  const email = `${cleanUsername}@github.user`;
  const githubUrl = `https://github.com/${cleanUsername}`;
  const avatarUrl = `https://github.com/${cleanUsername}.png`;

  let user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(`github_${Date.now()}_${Math.random()}`, 10);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            fullName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
            avatarUrl,
            githubUrl,
            branch: 'Computer Science',
            gradYear: new Date().getFullYear() + 2,
            skills: ['GitHub', 'Git', 'TypeScript'],
            lookingFor: ['Hackathon Team'],
          },
        },
      },
      include: { profile: true },
    });
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile,
    },
    tokens,
  };
};
