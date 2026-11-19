import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findByEmail(email: string, withPasswordHash = false) {
    const query = this.userModel.findOne({
      email: email.toLowerCase().trim(),
      deletedAt: null,
    });
    if (withPasswordHash) {
      query.select("+passwordHash");
    }
    return query.exec();
  }

  findById(id: string) {
    return this.userModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    locale?: string;
  }) {
    const user = new this.userModel({
      ...data,
      email: data.email.toLowerCase().trim(),
      roles: ["customer"],
    });
    return user.save();
  }

  async recordFailedLogin(userId: string, maxAttempts: number, lockMinutes: number) {
    const user = await this.userModel.findById(userId);
    if (!user) return;
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= maxAttempts) {
      user.lockedUntil = new Date(Date.now() + lockMinutes * 60_000);
    }
    await user.save();
  }

  async recordSuccessfulLogin(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } },
    );
  }

  findByIdWithPasswordHash(id: string) {
    return this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select("+passwordHash")
      .exec();
  }

  async addRole(userId: string, role: string) {
    await this.userModel.updateOne({ _id: userId }, { $addToSet: { roles: role } });
  }

  async removeRole(userId: string, role: string) {
    await this.userModel.updateOne({ _id: userId }, { $pull: { roles: role } });
  }

  async markEmailVerified(userId: string) {
    await this.userModel.updateOne(
      { _id: userId, emailVerifiedAt: null },
      { $set: { emailVerifiedAt: new Date() } },
    );
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await this.userModel.updateOne({ _id: userId }, { $set: { passwordHash } });
  }

  async updateNameAndLocale(
    userId: string,
    data: { firstName?: string; lastName?: string; locale?: string },
  ) {
    const update: Record<string, string> = {};
    if (data.firstName !== undefined) update.firstName = data.firstName;
    if (data.lastName !== undefined) update.lastName = data.lastName;
    if (data.locale !== undefined) update.locale = data.locale;
    if (Object.keys(update).length === 0) return;
    await this.userModel.updateOne({ _id: userId }, { $set: update });
  }
}
