import {
    Controller,
    Post,
    Param,
    UsePipes,
    UseFilters,
    UseInterceptors,
    ValidationPipe,
    HttpCode,
    UseGuards,
    Query,
    Get,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { UserType } from 'src/global/enum';
import { UserTypes } from 'src/global/decorator/userTypes';
import { User } from 'src/global/decorator/user';
import { TransformInterceptor } from 'src/global/interceptor/transform.interceptor';
import { HttpExceptionFilter } from 'src/global/filter/http-exception.filter';
import { UserTypesGuard } from 'src/global/guard/user-types.guard';
import { OParseIntPipe } from 'src/global/pipes/o-parse-int.pipe';
import { ParseSortPipe } from 'src/global/pipes/parse-sort.pipe';
import { ParseEnumPipe } from 'src/global/pipes/parse-enum.pipe';
import { filter } from 'rxjs/operators';
import { ParseFilterPipe } from 'src/global/pipes/parse-filter.pipe';

@UseGuards(UserTypesGuard)
@Controller('friends')
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) { }

    @UserTypes(UserType.USER)
    @HttpCode(200)
    @Post('add-friend/:idUser')
    async addFriend(@User() user: any, @Param('idUser') id) {
        const users = await this.friendsService.addFriend(user, id);
        return {};
    }

    // @list Friend
    @UserTypes(UserType.USER)
    @Get('get-friend')
    async listFriend(@User() user: any) {
        const friends = await this.friendsService.getFriend(user);
        return { friends };
    }

    @UserTypes(UserType.USER)
    @Get('get-friend-by-name')
    async getFriendByName(
        @User() user: any,
        @Query('skip', new OParseIntPipe()) qSkip,
        @Query('limit', new OParseIntPipe()) qLimit,
        @Query('sort', new ParseSortPipe()) qSort,
        @Query('filter', new ParseFilterPipe()) qType,
    ) {
        const [users] = await this.friendsService.getFriendByName(user, qSkip, qLimit, qSort, qType);
        return { users };
    }

    // @list Pending
    @UserTypes(UserType.USER)
    @Get('get-pending')
    async listPending(@User() user: any) {
        const users = await this.friendsService.getPending(user);
        return { users };
    }

    // @findAll
    @UserTypes(UserType.USER)
    @Get('get-all')
    async findAll(@User() user: any) {
        const users = await this.friendsService.getAll(null, user);
        return { users };
    }


    // @confirm friend
    @UserTypes(UserType.USER)
    @Post('confirm/:idFriend')
    async confirm(@User() user, @Param('idFriend') id) {
        const friend = await this.friendsService.confirm(user, id);
        return {};
    }

    // @reject
    @UserTypes(UserType.USER)
    @HttpCode(200)
    @Post('reject/:idFriend')
    async reject(@User() user, @Param('idFriend') id) {
        const friend = await this.friendsService.reject(user, id);
        return {};
    }
}
