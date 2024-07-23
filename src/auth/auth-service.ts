import prisma from '../db';
import { CreateUserDto } from './dtos/CreateUser.dto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET!
  private readonly jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!

  async registerUser(createUserDto: CreateUserDto): Promise<any> {
    const { email, password, username } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return newUser;
  }

  async loginUser(email: string, password: string): Promise<{ user: any, accessToken: string, refreshToken: string } | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const accessToken = this.generateJwt(user);
    const refreshToken = this.generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    });

    return { user, accessToken, refreshToken };
  }

  private generateJwt(user: any): string {
    return jwt.sign({ id: user.id, email: user.email }, this.jwtSecret, { expiresIn: '1h' });
  }

  private generateRefreshToken(user: any): string {
    return jwt.sign({ id: user.id, email: user.email }, this.jwtRefreshSecret, { expiresIn: '7d' });
  }

  verifyJwt(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (err) {
      return null;
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (err) {
      return null;
    }
  }

  async refreshToken(oldToken: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    const payload = this.verifyRefreshToken(oldToken);
    if (!payload) return null;

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return null;

    const newAccessToken = this.generateJwt(user);
    const newRefreshToken = this.generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
      },
    });

    await prisma.refreshToken.delete({ where: { token: oldToken } });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}

export default AuthService;