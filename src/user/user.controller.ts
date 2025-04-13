import { Controller, Post, Body, Get, Param, Put, Delete, Patch, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { Request } from 'express';
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
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { EnhancedNativeLogger } from 'src/common/logger/nest-logger.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: EnhancedNativeLogger, // Inject via constructor
  ) {}

  // Criar usuário
  @Post()
  @Public()
  async create(@Body() createUserDto: CreateUserDto, @Req() req: Request): Promise<UserOutputDto> {
    // Log that an (anonymous) user is creating a new user
    this.logger.log(`[POST] /users - create user requested`, 'UserController', { 
      requester: req.user ? req.user : 'anonymous'
    });
    return this.userService.create(createUserDto);
  }

  // Listar todos os usuários – log which admin accessed the endpoint and when
  @Get()
  @Public()
  // @UseGuards(AuthenticatedGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  async findAll(@Req() req: Request): Promise<UserOutputDto[]> {
    // Assuming the authentication guard attaches the admin info to req.user
    this.logger.log(
      `[GET] /users - accessed by admin: ${req.user && (req.user as any).username}`, 
      'UserController',
      { 
        requester: req.user ? req.user : 'unknown'
      }
    );
    return this.userService.findAll();
  }

  // Encontrar um usuário pelo ID
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<UserOutputDto> {
    this.logger.log(
      `[GET] /users/${id} - requested`, 
      'UserController',
      { 
        requester: req.user ? req.user : 'anonymous'
      }
    );
    return this.userService.findOne(id);
  }

  // Atualizar um usuário
  @Put(':id')
  @UseGuards(LocalAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request
  ): Promise<UserOutputDto> {
    this.logger.log(
      `[PUT] /users/${id} - update requested`, 
      'UserController',
      { 
        requester: req.user ? req.user : 'unknown',
        updateData: updateUserDto
      }
    );
    return this.userService.update(id, updateUserDto);
  }

  // Soft delete (marcar como deletado)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: Request): Promise<UserOutputDto> {
    this.logger.warn(
      `[DELETE] /users/${id} - soft delete requested`, 
      'UserController',
      { 
        requester: req.user ? req.user : 'unknown'
      }
    );
    return this.userService.softDelete(id);
  }

  // Ativar/desativar o status do usuário (toggle)
  @Patch(':id')
  async toggleStatus(@Param('id') id: string, @Req() req: Request): Promise<UserOutputDto> {
    this.logger.log(
      `[PATCH] /users/${id} - toggle status requested`, 
      'UserController',
      { 
        requester: req.user ? req.user : 'unknown'
      }
    );
    return this.userService.toggleStatus(id);
  }

  // Criação de usuário admin
  @Post('admin')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  @Public()
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @Req() req: Request): Promise<UserOutputDto> {
    if (createAdminDto.adminSecret !== process.env.ADMIN_CREATION_SECRET) {
      this.logger.error(
        `[POST] /users/admin - admin creation failed due to invalid secret`, 
        '', 
        'UserController',
        { requester: req.user ? req.user : 'unknown' }
      );
      throw new UnauthorizedException('Invalid admin secret key');
    }

    this.logger.log(
      `[POST] /users/admin - admin creation requested by ${(req.user as any)?.username}`, 
      'UserController',
      { requester: req.user ? req.user : 'unknown' }
    );
    return this.userService.createAdmin({
      username: createAdminDto.username,
      email: createAdminDto.email,
      password: createAdminDto.password,
      role: UserRole.ADMIN
    });
  }
}
