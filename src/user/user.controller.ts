import { Controller, Post, Body, Get, Param, Put, Delete, BadRequestException, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserOutputDto } from './dtos/user-output.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Criar usuário
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserOutputDto> {
    return this.userService.create(createUserDto);
  }

  // Listar todos os usuários
  @Get()
  async findAll(): Promise<UserOutputDto[]> {
    return this.userService.findAll();
  }

  // Encontrar um usuário pelo ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserOutputDto> {
    return this.userService.findOne(id); // `+id` transforma a string em número
  }

  // Atualizar um usuário
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserOutputDto> {

    if (Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    return this.userService.update(id, updateUserDto);
  }

  // Soft delete (marcar como deletado, mas não apagar fisicamente)
  @Delete(':id')
  async softDelete(@Param('id') id: string): Promise<UserOutputDto> {
    return this.userService.softDelete(id);
  }

  // Ativar/desativar o status do usuário (toggle)
  @Patch(':id')
  async toggleStatus(@Param('id') id: string): Promise<UserOutputDto> {
    return this.userService.toggleStatus(id);
  }
}
