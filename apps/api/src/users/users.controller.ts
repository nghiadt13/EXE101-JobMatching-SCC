import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserView, UsersListResponse } from './users.types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: QueryUsersDto): Promise<UsersListResponse> {
    return this.usersService.list(query);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted: string | undefined,
  ): Promise<UserView> {
    return this.usersService.getById(id, includeDeleted === 'true');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserView> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ): Promise<{ success: true }> {
    return this.usersService.softDelete(id, user.sub);
  }
}
