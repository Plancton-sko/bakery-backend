// src/user/user.service.ts
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from './dtos/user-output.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserOutputSecureDto } from './dtos/user-output-secure.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  // Criar usuário
  async create(createUserDto: CreateUserDto): Promise<UserOutputDto> {
    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      return plainToInstance(UserOutputDto, user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Unique constraint violated.');
      }
      throw new InternalServerErrorException('Failed to create user.');
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
    try {
      const result = await this.userRepository.update(id, updateUserDto);
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }
      const updatedUser = await this.userRepository.findOne({ where: { id } });
      updatedUser.lastUpdateAt = new Date();
      return plainToInstance(UserOutputDto, updatedUser);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Unique constraint violated.');
      }
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
      if (error.code === '23505') {
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
      if (error.code === '23505') {
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
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found.`);
      }
      return plainToInstance(UserOutputSecureDto, user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve user by email.');
    }
  }

  
}

