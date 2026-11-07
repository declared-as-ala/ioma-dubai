import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AdminResourcesService } from "./admin-resources.service";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

describe("admin bulk deletion", () => {
  const id = "507f1f77bcf86cd799439011";
  const user = {
    sub: id,
    email: "admin@example.test",
    roles: ["super_administrator"],
  } as JwtPayload;
  let service: AdminResourcesService;
  let collection: { find: jest.Mock; updateMany: jest.Mock };
  let audit: { recordEvent: jest.Mock };
  beforeEach(() => {
    collection = {
      find: jest
        .fn()
        .mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: id }]) }),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    audit = { recordEvent: jest.fn().mockResolvedValue(undefined) };
    service = new AdminResourcesService(
      { collection: () => collection } as never,
      audit as never,
      { invalidate: jest.fn() } as never,
      {} as never,
      {} as never,
    );
  });
  it("requires commerce management before accessing storage", async () => {
    await expect(
      service.deleteProducts({ ...user, roles: ["customer"] }, { ids: [id] }),
    ).rejects.toThrow(ForbiddenException);
    expect(collection.find).not.toHaveBeenCalled();
  });
  it.each([null, {}, { ids: [] }, { ids: ["invalid"] }, { ids: Array(101).fill(id) }])(
    "rejects malformed or oversized selection %p",
    async (body) => {
      await expect(service.deleteProducts(user, body)).rejects.toThrow(
        BadRequestException,
      );
      expect(collection.updateMany).not.toHaveBeenCalled();
    },
  );
  it("validates every record before mutating the batch", async () => {
    await expect(
      service.deleteProducts(user, { ids: [id, "507f1f77bcf86cd799439012"] }),
    ).rejects.toThrow(NotFoundException);
    expect(collection.updateMany).not.toHaveBeenCalled();
  });
  it("deduplicates IDs and retains product data while unpublishing", async () => {
    await expect(service.deleteProducts(user, { ids: [id, id] })).resolves.toEqual({
      deletedCount: 1,
    });
    expect(collection.updateMany.mock.calls[0][1].$set).toEqual({
      status: "archived",
      deletedAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.products.deleted" }),
    );
  });
  it("removes orders from management without changing payment or fulfillment", async () => {
    await service.deleteProducts(user, { ids: [id] }, "orders");
    expect(collection.updateMany.mock.calls[0][1].$set).toEqual({
      adminDeletedAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.orders.deleted" }),
    );
  });
});
