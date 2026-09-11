import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UserModel } from '../generated/prisma/models.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const SALT_ROUNDS = 10;

export type SafeUser = Omit<UserModel, 'passwordHash'>;

function toSafeUser(user: UserModel): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(toSafeUser);
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return toSafeUser(user);
  }

  // Kept separate from findOne: auth needs the passwordHash, everything else must not see it.
  findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, role: dto.role, passwordHash },
    });
    return toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const { password, ...rest } = dto;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await bcrypt.hash(password, SALT_ROUNDS) } : {}),
      },
    });
    return toSafeUser(user);
  }

  async remove(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.delete({ where: { id } });
    return toSafeUser(user);
  }
}
