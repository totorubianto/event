import { Model } from 'mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import * as fs from 'fs';
import { ForgotPasswordUserDto } from './dto/forgot-password-user.dto';
import { MailerService } from '@nest-modules/mailer';
import * as uuidv1 from 'uuid/v1';
import { VerificationService } from '../verification/verification.service';
import { Verification } from '../verification/interfaces/verification.interface';
import { UpdateForgotPasswordUserDto } from './dto/update-forgot-password.dto';
import { AuthService } from '../auth/auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { UserType } from '../global/enum/user-type.enum';
import * as bcrypt from 'bcrypt';
import { FileType } from 'src/global/enum/file-type.enum';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel('User') private userModel: Model<User>,
        private readonly mailerService: MailerService,
        private readonly verificationService: VerificationService,
        private readonly authService: AuthService,
        private readonly filesService: FilesService,
    ) {
        console.log(process.env.APP_URL);
    }

    //create service
    async create(createUserDto: CreateUserDto, client: any) {
        let createdUser = new this.userModel(createUserDto);
        await createdUser.save();
        const login = {
            email: createUserDto.email,
            password: createUserDto.password,
        };
        const [loginData, user] = await this.login(login, client);
        await this.updateDevice(client, user);
        return [loginData, createdUser, client];
    }

    //login
    async login(data: LoginUserDto, client: any) {
        let user = await this.userModel.findOne({ email: data.email }).exec();
        if (!user) throw new BadRequestException('Email not found!');
        let pass = await bcrypt.compare(data.password, user.password);
        if (!pass) throw new BadRequestException('Wrong password');
        let payload = {
            _id: user._id,
            actor: user._id,
            actorModel: UserType.USER,
        };
        const res = await this.authService.login(payload);
        await this.updateDevice(client, user);
        return [res, user, client];
    }

    // findall user service
    async findOne(query): Promise<User> {
        return await this.userModel.findOne(query);
    }

    // findall user service
    async findById(id: string): Model<User> {
        return await this.userModel.findById(id);
    }

    // findall user service
    async findAll(query: any): Promise<User[]> {
        return await this.userModel.find(query);
    }

    // updateProfile service
    async updateProfile(data: any, user: any): Promise<User> {
        let users: Model<User> = await this.findById(user._id);
        if (data.firstName) users.firstName = data.firstName;
        if (data.lastName) users.lastName = data.lastName;
        if (data.email) users.email = data.email;

        return await users.save();
    }

    // requestForgotPassword service
    async requestForgotPassword(forgotPassword: ForgotPasswordUserDto): Promise<any> {
        const email = { email: forgotPassword.email };
        const user: Model<User> = await this.findOne(email);
        if (!user) throw new BadRequestException('email tidak ditemukan');
        const data = {
            email: forgotPassword.email,
            name: 'FORGOT_PASSWORD',
            description: 'FORGOT PASSWORD',
            token: uuidv1(),
        };
        const verification = await this.verificationService.create(data);
        console.log(verification.token);
        await this.mailerService.sendMail({
            to: forgotPassword.email,
            from: 'noreply@nestjs.com',
            subject: 'Simalakama Forgot Password ✔',
            template: 'forgotPassword.html', // The `.pug` or `.hbs` extension is appended automatically.
            context: {
                // Data to be sent to template engine.
                to: user.firstName,
                token: uuidv1(),
                address: `${process.env.APP_URL}/forgot-password?token=${verification.token}`,
            },
        });
        return verification;
    }

    // forgotPassword Service
    async forgotPassword(
        forgotPasswordUserDto: UpdateForgotPasswordUserDto,
        token: string,
    ): Promise<User> {
        let verify: Model<Verification> = await this.verificationService.verify(token);
        const email = { email: verify.email };
        let user: Model<User> = await this.userModel.findOne(email);
        user.password = forgotPasswordUserDto.newPassword;
        await user.save();
        verify.delete();
        return user;
    }

    // upload user avatar service
    async uploadAvatar(avatar, userData: any): Promise<User> {
        const user = await this.findById(userData._id);
        console.log(userData);
        if (avatar) {
            const cover = await this.filesService.upload(
                avatar,
                FileType.LOCAL_IMAGES,
                `Article:${user._id}`,
                user._id,
            );
            user.cover = cover._id;
        }
        return user;
    }

    private async updateDevice(device: string, user: Model<User>): Promise<Model<User>> {
        const devices = user.devices;
        if (!devices || !Array.isArray(devices)) return null;

        const exists = devices.find(d => {
            return d.name == device;
        });
        if (exists) return null;

        user.devices.push({ name: device, description: 'Using user login API' });
        return await user.save();
    }
}
