import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from './dtos/user-output.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  // Criar usuário
  async create(createUserDto: CreateUserDto): Promise<UserOutputDto> {
    const user = this.userRepository.create(createUserDto);
    await this.userRepository.save(user);
    return plainToInstance(UserOutputDto, user);
  }

  // Listar todos os usuários
  async findAll(): Promise<UserOutputDto[]> {
    const users = await this.userRepository.find();
    return plainToInstance(UserOutputDto, users);
  }

  // Encontrar um usuário pelo ID
  async findOne(id: string): Promise<UserOutputDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    return plainToInstance(UserOutputDto, user);
  }

  // Atualizar usuário
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserOutputDto> {
    try {
      // Tenta realizar a atualização
      const result = await this.userRepository.update(id, updateUserDto);

      // Verifica se a atualização não encontrou nenhum usuário
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      // Recupera o usuário atualizado
      const updatedUser = await this.userRepository.findOne({ where: { id } }); 
      updatedUser.lastUpdateAt = new Date();

      return plainToInstance(UserOutputDto, updatedUser);

    } catch (error) {
      // Captura erros específicos do TypeORM/PostgreSQL
      if (error.code === '23505') {
        // Erro de duplicidade de chave única
        const detail = error.detail || 'Unique constraint violated.';
        throw new ConflictException(detail);
      }

      // Lança uma exceção genérica para outros erros
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  // Soft delete (marcar como deletado)
  async softDelete(id: string): Promise<UserOutputDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    user.delete();
    await this.userRepository.save(user);
    return plainToInstance(UserOutputDto, user);
  }

  // Ativar/desativar status do usuário
  async toggleStatus(id: string): Promise<UserOutputDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    switch (user.isActive) {
      case true: user.deactivate();
        break;
      case false: user.activate();
        break;
      default: user.activate();
        break;
    }

    await this.userRepository.save(user);
    return plainToInstance(UserOutputDto, user);
  }
}
