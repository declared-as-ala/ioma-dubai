import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { ProfessionalService } from "./professional.service";
import { ProfessionalApplication } from "./schemas/professional-application.schema";
import { ProfessionalProfile } from "./schemas/professional-profile.schema";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import { MailOutboxService } from "../../common/mail/mail-outbox.service";

describe("ProfessionalService", () => {
  let service: ProfessionalService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockApplicationModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockProfileModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUsersService: any;
  let outbox: { enqueue: jest.Mock };

  const userId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();
  const applicationId = new Types.ObjectId().toString();
  const profileId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockApplicationModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };
    mockProfileModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };
    mockUsersService = {
      addRole: jest.fn().mockResolvedValue(true),
      removeRole: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue({
        email: "owner@example.com",
        firstName: "Ola",
        lastName: "Owner",
        locale: "fr",
      }),
    };
    outbox = { enqueue: jest.fn().mockResolvedValue({ created: true }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalService,
        {
          provide: getModelToken(ProfessionalApplication.name),
          useValue: mockApplicationModel,
        },
        { provide: getModelToken(ProfessionalProfile.name), useValue: mockProfileModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailOutboxService, useValue: outbox },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) =>
              ({
                CONTACT_EMAIL: "contact@iomaparis.ae",
                SUPPORT_EMAIL: "support@iomaparis.ae",
                APP_URL: "https://iomaparis.ae",
                ADMIN_APP_URL: "https://admin.iomaparis.ae",
              })[k],
          },
        },
      ],
    }).compile();

    service = module.get<ProfessionalService>(ProfessionalService);
  });

  describe("getOrCreateDraft", () => {
    it("should return existing draft if found", async () => {
      const mockDraft = {
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId),
        status: "draft",
        toObject: () => mockDraft,
      };
      mockApplicationModel.findOne.mockResolvedValue(mockDraft);

      const result = await service.getOrCreateDraft(userId);
      expect(result._id.toString()).toBe(applicationId);
    });

    it("should create draft if none exists", async () => {
      const mockCreated = {
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId),
        status: "draft",
        toObject: () => mockCreated,
      };
      mockApplicationModel.findOne.mockResolvedValue(null);
      mockApplicationModel.findOneAndUpdate.mockResolvedValue(mockCreated);

      const result = await service.getOrCreateDraft(userId);
      expect(mockApplicationModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result.status).toBe("draft");
    });
  });

  describe("submitApplication", () => {
    it("should submit draft and assign professional_pending role", async () => {
      const mockApp = {
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId),
        status: "draft",
        documents: [{ documentId: new Types.ObjectId() }],
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return this;
        },
      };
      mockApplicationModel.findById.mockResolvedValue(mockApp);

      const dto = {
        companyName: "Dubai Spa LLC",
        contactPerson: "Jane Doe",
        businessType: "spa",
        tradeLicenceNumber: "TL-12345",
        email: "jane@dubaispa.ae",
        phone: "+971-50-1234567",
        address: "JBR Dubai",
        emirate: "DXB",
        city: "Dubai",
        locationsCount: 1,
        expectedOrderVolume: "50k-100k AED",
        termsAccepted: true,
      };

      mockApplicationModel.findOneAndUpdate.mockResolvedValue({
        toObject: () => ({ ...dto, status: "submitted" }),
      });
      const result = await service.submitApplication(userId, applicationId, dto);

      expect(result.status).toBe("submitted");
      expect(mockUsersService.addRole).toHaveBeenCalledWith(
        userId,
        "professional_pending",
      );
      expect(result.companyName).toBe("Dubai Spa LLC");
    });
  });

  describe("approveApplication", () => {
    it("should approve application, flip roles, and create ProfessionalProfile", async () => {
      const mockApp = {
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId),
        status: "submitted",
        companyName: "Dubai Spa LLC",
        businessType: "spa",
        emirate: "DXB",
        city: "Dubai",
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return this;
        },
      };
      const mockProfile = {
        _id: new Types.ObjectId(profileId),
        userId: new Types.ObjectId(userId),
        applicationId: new Types.ObjectId(applicationId),
        companyName: "Dubai Spa LLC",
        status: "approved",
        toObject: function () {
          return this;
        },
      };

      mockApplicationModel.findById.mockResolvedValue(mockApp);
      mockProfileModel.create.mockResolvedValue(mockProfile);

      const result = await service.approveApplication(
        adminId,
        applicationId,
        "Approved by admin",
      );

      expect(mockApp.status).toBe("approved");
      expect(mockUsersService.removeRole).toHaveBeenCalledWith(
        userId,
        "professional_pending",
      );
      expect(mockUsersService.addRole).toHaveBeenCalledWith(
        userId,
        "professional_approved",
      );
      expect(mockProfileModel.create).toHaveBeenCalled();
      expect(result.profile.status).toBe("approved");
      // Approval email is queued by the backend transition, once, to the applicant.
      await new Promise((r) => setImmediate(r));
      expect(outbox.enqueue).toHaveBeenCalledTimes(1);
      expect(outbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `pro-app-approved:${applicationId}`,
          to: "owner@example.com",
        }),
      );
    });

    it("does not approve (or email) a second time", async () => {
      mockApplicationModel.findById.mockResolvedValue({
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId),
        status: "approved",
      });
      await expect(service.approveApplication(adminId, applicationId)).rejects.toThrow(
        "not in a reviewable state",
      );
      expect(outbox.enqueue).not.toHaveBeenCalled();
    });
  });

  describe("rejectApplication", () => {
    it("should reject application and remove professional_pending role", async () => {
      const mockApp = {
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId),
        status: "submitted",
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return this;
        },
      };
      mockApplicationModel.findById.mockResolvedValue(mockApp);

      const result = await service.rejectApplication(
        adminId,
        applicationId,
        "Invalid licence",
      );

      expect(mockApp.status).toBe("rejected");
      expect(mockUsersService.removeRole).toHaveBeenCalledWith(
        userId,
        "professional_pending",
      );
      await new Promise((r) => setImmediate(r));
      expect(outbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ key: `pro-app-rejected:${applicationId}` }),
      );
      expect(result.status).toBe("rejected");
    });
  });

  describe("suspendProfile", () => {
    it("should suspend profile and flip role to professional_suspended", async () => {
      const mockProfile = {
        _id: new Types.ObjectId(profileId),
        userId: new Types.ObjectId(userId),
        status: "approved",
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return this;
        },
      };
      mockProfileModel.findById.mockResolvedValue(mockProfile);

      const result = await service.suspendProfile(adminId, profileId, "Licence expired");

      expect(mockProfile.status).toBe("suspended");
      expect(mockUsersService.removeRole).toHaveBeenCalledWith(
        userId,
        "professional_approved",
      );
      expect(mockUsersService.addRole).toHaveBeenCalledWith(
        userId,
        "professional_suspended",
      );
      expect(result.status).toBe("suspended");
    });
  });
});
