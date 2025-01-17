import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from './dtos/user-output.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<UserOutputDto[]> {
    const users = await this.userRepository.find();
    return plainToInstance(UserOutputDto, users);
  }
  
  async findOne(id: number): Promise<UserOutputDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    return plainToInstance(UserOutputDto, user);
  }
}
