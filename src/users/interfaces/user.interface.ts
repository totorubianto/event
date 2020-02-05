import { Document } from 'mongoose';
export interface User extends Document {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly password: string;
    readonly slug: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}
