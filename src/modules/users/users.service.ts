import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await this.bcryptService.hashPassword(
        createUserDto.password,
      );

      const user = await this.prisma.users.create({
        data: {
          ...createUserDto,
          birthDate: new Date(createUserDto.birthDate),
          password: hashedPassword,
        },
        omit: { password: true },
      });

      return user;
    } catch (error: unknown) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists');
      }
      this.logger.error('Error creating user', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { verifiedEmail: true },
      });
    } catch (error) {
      this.logger.error(`Error verifying email for user ${userId}`, error);
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async findAll(queryUserDto: QueryUserDto) {
    try {
      const { name, lastName, email, page = 1, limit = 10 } = queryUserDto;
      const skip = (page - 1) * limit;

      const where = {
        ...(name && {
          name: { contains: name, mode: 'insensitive' as const },
        }),
        ...(lastName && {
          lastName: { contains: lastName, mode: 'insensitive' as const },
        }),
        ...(email && {
          email: { contains: email, mode: 'insensitive' as const },
        }),
      };

      const [users, total] = await Promise.all([
        this.prisma.users.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          omit: { password: true },
        }),
        this.prisma.users.count({ where }),
      ]);

      return {
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching users', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      this.logger.error(`Error fetching user by email ${email}`, error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
        omit: { password: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching user ${id}`, error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.findOne(id);

      const data: Record<string, any> = { ...updateUserDto };

      if (updateUserDto.password) {
        data.password = await this.bcryptService.hashPassword(
          updateUserDto.password,
        );
      }

      if (updateUserDto.birthDate) {
        data.birthDate = new Date(updateUserDto.birthDate);
      }

      const updatedUser = await this.prisma.users.update({
        where: { id },
        data,
        omit: { password: true },
      });

      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists');
      }
      this.logger.error(`Error updating user ${id}`, error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await this.bcryptService.hashPassword(newPassword);
      await this.prisma.users.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } catch (error) {
      this.logger.error(`Error updating password for user ${userId}`, error);
      throw new InternalServerErrorException('Failed to update password');
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.users.delete({ where: { id } });

      return { message: `User with ID "${id}" deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error deleting user ${id}`, error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
