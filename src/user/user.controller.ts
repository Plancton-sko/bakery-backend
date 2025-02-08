// src/user/user.controller.ts
import { Controller, Post, Body, Get, Param, Put, Delete, BadRequestException, Patch, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserOutputDto } from './dtos/user-output.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserRole } from './user.entity';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // Criar usuário
  @Post()
  @Public()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserOutputDto> {
    return this.userService.create(createUserDto);
  }

  // Listar todos os usuários
  @Get()
  @UseGuards(LocalAuthGuard)
  // @Roles(UserRole.ADMIN)
  async findAll() {
    return this.userService.findAll();
  }

  // Encontrar um usuário pelo ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserOutputDto> {
    return this.userService.findOne(id); // `+id` transforma a string em número
  }

  // Atualizar um usuário
  @Put(':id')
  @UseGuards(LocalAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserOutputDto> {
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

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAdmin(@Body() createAdminDto: CreateAdminDto): Promise<UserOutputDto> {
    if (createAdminDto.adminSecret !== process.env.ADMIN_CREATION_SECRET) {
      throw new UnauthorizedException('Invalid admin secret key');
    }

    return this.userService.createAdmin({
      username: createAdminDto.username,
      email: createAdminDto.email,
      password: createAdminDto.password,
      role: UserRole.ADMIN
    });
  }
}
