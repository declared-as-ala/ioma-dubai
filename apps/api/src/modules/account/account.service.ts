import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as argon2 from "argon2";
import {
  CustomerProfile,
  CustomerProfileDocument,
} from "./schemas/customer-profile.schema";
import { Address, AddressDocument } from "./schemas/address.schema";
import {
  AccountDeletionRequest,
  AccountDeletionRequestDocument,
} from "./schemas/account-deletion-request.schema";
import { UsersService } from "../users/users.service";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { UpsertAddressDto } from "./dto/upsert-address.dto";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { DeletionRequestDto } from "./dto/deletion-request.dto";

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(CustomerProfile.name)
    private readonly profileModel: Model<CustomerProfileDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel(AccountDeletionRequest.name)
    private readonly deletionRequestModel: Model<AccountDeletionRequestDocument>,
    private readonly usersService: UsersService,
  ) {}

  private async getOrCreateProfile(userId: string): Promise<CustomerProfileDocument> {
    let profile = await this.profileModel.findOne({ userId });
    if (!profile) {
      profile = await this.profileModel.create({ userId });
    }
    return profile;
  }

  async getProfile(userId: string) {
    const [user, profile] = await Promise.all([
      this.usersService.findById(userId),
      this.getOrCreateProfile(userId),
    ]);
    if (!user) throw new NotFoundException("User not found.");

    return {
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      firstName: user.firstName,
      lastName: user.lastName,
      locale: user.locale,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
      skinConcerns: profile.skinConcerns,
      newsletterOptIn: profile.newsletterOptIn,
      preferredLocale: profile.preferredLocale,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.usersService.updateNameAndLocale(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      locale: dto.preferredLocale,
    });

    const profile = await this.getOrCreateProfile(userId);
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.dateOfBirth !== undefined) {
      profile.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    }
    if (dto.skinConcerns !== undefined) profile.skinConcerns = dto.skinConcerns;
    if (dto.newsletterOptIn !== undefined) profile.newsletterOptIn = dto.newsletterOptIn;
    if (dto.preferredLocale !== undefined) profile.preferredLocale = dto.preferredLocale;
    await profile.save();

    return this.getProfile(userId);
  }

  listAddresses(userId: string) {
    return this.addressModel
      .find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
  }

  async createAddress(userId: string, dto: UpsertAddressDto) {
    if (dto.isDefault) {
      await this.addressModel.updateMany(
        { userId, type: dto.type },
        { $set: { isDefault: false } },
      );
    }
    const address = await this.addressModel.create({ ...dto, userId });
    return address.toObject();
  }

  async updateAddress(userId: string, addressId: string, dto: UpsertAddressDto) {
    const address = await this.findOwnedAddress(userId, addressId);
    if (dto.isDefault) {
      await this.addressModel.updateMany(
        { userId, type: dto.type, _id: { $ne: address._id } },
        { $set: { isDefault: false } },
      );
    }
    Object.assign(address, dto);
    await address.save();
    return address.toObject();
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.findOwnedAddress(userId, addressId);
    await address.deleteOne();
  }

  private async findOwnedAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressDocument> {
    const address = await this.addressModel.findById(addressId);
    if (!address) throw new NotFoundException("Address not found.");
    if (address.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have access to this address.");
    }
    return address;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPasswordHash(userId);
    if (!user) throw new NotFoundException("User not found.");

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new BadRequestException("Current password is incorrect.");
    }

    const newHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.usersService.updatePasswordHash(userId, newHash);
  }

  async requestDeletion(userId: string, dto: DeletionRequestDto) {
    const existing = await this.deletionRequestModel.findOne({
      userId,
      status: "pending",
    });
    if (existing) return existing.toObject();

    const request = await this.deletionRequestModel.create({
      userId,
      reason: dto.reason ?? null,
    });
    return request.toObject();
  }
}
