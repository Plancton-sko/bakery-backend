// src/user/user.service.ts
import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from './dtos/user-output.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserOutputSecureDto } from './dtos/user-output-secure.dto';
import { EnhancedNativeLogger } from 'src/common/logger/nest-logger.service';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly logger: EnhancedNativeLogger, // Inject logger here as well
  ) { }

  // Criar usuário
  async create(createUserDto: CreateUserDto): Promise<UserOutputDto> {
    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      return plainToInstance(UserOutputDto, user);
    } catch (error) {
      if ((error as any).code === '23505') {
        this.logger.error
        throw new ConflictException('Unique constraint violated.');
      }
      throw new InternalServerErrorException('Failed to create user.');
    }
  }

  // Criar usuário admin
  async createAdmin(createUserDto: CreateUserDto): Promise<UserOutputDto> {
    try {
      const adminUser = this.userRepository.create({
        ...createUserDto,
        role: UserRole.ADMIN,
        isActive: true
      });

      await this.userRepository.save(adminUser);
      return plainToInstance(UserOutputDto, adminUser);
    } catch (error) {
      if ((error as any).code === '23505') {
        throw new ConflictException('Admin user already exists');
      }
      throw new InternalServerErrorException('Failed to create admin user');
    }
  }

  // Listar todos os usuários
  async findAll(): Promise<UserOutputDto[]> {
    try {
      const users = await this.userRepository.find();
      return plainToInstance(UserOutputDto, users);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve users.');
    }
  }

  // Encontrar um usuário pelo ID
  async findOne(id: string): Promise<UserOutputDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }
      return plainToInstance(UserOutputDto, user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve user.');
    }
  }

  // Atualizar usuário
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserOutputDto> {
    this.logger.log(`[Service] Attempting update for user ${id}`, 'UserService', { updateData: updateUserDto });
    try {
      const result = await this.userRepository.update(id, updateUserDto);
      if (result.affected === 0) {
        this.logger.warn(`[Service] No user found for update: ${id}`, 'UserService');
        throw new NotFoundException(`User with ID ${id} not found.`);
      }
      const updatedUser = await this.userRepository.findOne({ where: { id } });
      updatedUser.lastUpdateAt = new Date();
      this.logger.log(`[Service] Successfully updated user ${id}`, 'UserService');
      return plainToInstance(UserOutputDto, updatedUser);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[Service] Failed to update user ${id}`,
        err.stack, // Agora temos certeza de que err é do tipo Error
        'UserService',
        { updateData: updateUserDto }
      );
      throw new InternalServerErrorException('Failed to update user.');
    }
  }

  // Soft delete (marcar como deletado)
  async softDelete(id: string): Promise<UserOutputDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      user.delete();
      await this.userRepository.save(user);
      return plainToInstance(UserOutputDto, user);
    } catch (error) {
      if ((error as any).code === '23505') {
        throw new ConflictException('Unique constraint violated.');
      }
      throw new InternalServerErrorException('Failed to delete user.');
    }
  }

  // Ativar/desativar status do usuário
  async toggleStatus(id: string): Promise<UserOutputDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      user.isActive ? user.deactivate() : user.activate();
      await this.userRepository.save(user);
      return plainToInstance(UserOutputDto, user);
    } catch (error) {
      if ((error as any).code === '23505') {
        throw new ConflictException('Unique constraint violated.');
      }
      throw new InternalServerErrorException('Failed to toggle user status.');
    }
  }

  async findOneByEmail(email: string): Promise<UserOutputDto> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found.`);
      }
      return plainToInstance(UserOutputDto, user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve user by email.');
    }
  }

  async findOneByEmailSecure(email: string): Promise<UserOutputSecureDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'username', 'email', 'password', 'role', 'isActive']
      });

      if (!user) {
        throw new NotFoundException(`Usuário com email ${email} não encontrado`);
      }

      return plainToInstance(UserOutputSecureDto, user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to find');
    }
  }
}

