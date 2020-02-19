// config on top
import { ConfigModule } from './config/config.module';

//import core
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer';
import { IsUniqueConstraint } from './global/validators/IsUnique';
import { DoesExistConstraint } from './global/validators/DoesExist';
import { AuthMiddleware } from './global/middleware/auth.middleware';
import { GlobalHelper } from './global/helper/global.helper';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './global/interceptor/transform.interceptor';
import { HttpExceptionFilter } from './global/filter/http-exception.filter';

//import schema
import { UserSchema } from './users/schema/user.schema';
import { AdminSchema } from './admins/schema/admin.schema';

// import module
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendsModule } from './friends/friends.module';
import { CompaniesModule } from './companies/companies.module';
import { AdminsModule } from './admins/admins.module';
import { FilesModule } from './files/files.module';
import { CronModule } from './cron/cron.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { PostsModule } from './posts/posts.module';

//import controller
import { AppController } from './app.controller';
import { UsersController } from './users/users.controller';
import { AdminsController } from './admins/admins.controller';
import { CompaniesSchema } from './companies/schemas/companies.schema';
import { FriendsController } from './friends/friends.controller';

//import service
import { AppService } from './app.service';
import { PostsService } from './posts/posts.service';
import { CronService } from './cron/cron.service';
import { SeedService } from './seed/seed.service';
import { PostsController } from './posts/posts.controller';
import { CommentsModule } from './comments/comments.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        ConfigModule,
        CronModule,
        MongooseModule.forRoot(
            `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/test?retryWrites=true&w=majority`,
            {
                useCreateIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
            },
        ),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        MongooseModule.forFeature([{ name: 'Admin', schema: AdminSchema }]),
        MongooseModule.forFeature([{ name: 'Companies', schema: CompaniesSchema }]),
        MailerModule.forRootAsync({
            useFactory: () => ({
                transport: {
                    host: process.env.MAIL_HOST,
                    port: Number(process.env.MAIL_PORT),
                    secure: process.env.MAIL_SECURE, // true for 465, false for other ports
                    auth: {
                        user: process.env.MAIL_USERNAME,
                        pass: process.env.MAIL_PASSWORD,
                    },
                },
                defaults: {
                    from: '"nest-modules" <modules@nestjs.com>',
                },
                template: {
                    dir: __dirname + '/../views/templates/',
                    adapter: new HandlebarsAdapter(), // or new PugAdapter()
                    options: {
                        strict: true,
                    },
                },
            }),
        }),
        VerificationModule,
        AdminsModule,
        SeedModule,
        FilesModule,
        GlobalHelper,
        CompaniesModule,
        FriendsModule,
        PostsModule,
        CommentsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        IsUniqueConstraint,
        DoesExistConstraint,
        AuthMiddleware,
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule {
    constructor(
        private readonly cronService: CronService,
        private readonly seedService: SeedService,
    ) {}
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .exclude(
                // users endpoin
                { path: 'users/login', method: RequestMethod.POST },
                { path: 'users/register', method: RequestMethod.POST },
                { path: 'users/refresh', method: RequestMethod.POST },
                // { path: 'users/find-all', method: RequestMethod.GET },
                { path: 'users/request-forgot-password', method: RequestMethod.POST },
                { path: 'users/forgot-password/:token', method: RequestMethod.POST },
                { path: 'users/verify/:token', method: RequestMethod.GET },
                //admin endpoin
                { path: 'admins/login', method: RequestMethod.POST },
                { path: 'admins/register', method: RequestMethod.POST },
                { path: 'admins/request-forgot-password', method: RequestMethod.POST },
                { path: 'admins/forgot-password/:token', method: RequestMethod.POST },
                { path: 'admins/verify/:token', method: RequestMethod.GET },
            )
            .forRoutes(UsersController, AdminsController, FriendsController, PostsController);
    }
    async onApplicationBootstrap() {
        this.seedService.run();
        this.cronService.runTask();
    }
}
