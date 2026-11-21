import { ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { ProAccessService } from "./pro-access.service";

const adminId = String(new Types.ObjectId());
const input = {
  email: "New.Spa@Example.test",
  firstName: "Layla",
  lastName: "Haddad",
  companyName: "Layla Beauty Spa",
  phone: "+971500000000",
  locale: "en" as const,
};

function build(
  opts: {
    existingUser?: { id: string } | null;
    existingProfile?: { status: string } | null;
  } = {},
) {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(opts.existingUser ?? null),
    create: jest.fn().mockResolvedValue({ id: String(new Types.ObjectId()) }),
    removeRole: jest.fn().mockResolvedValue(undefined),
    addRole: jest.fn().mockResolvedValue(undefined),
  };
  const applicationModel = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };
  const profileModel = {
    findOne: jest.fn().mockResolvedValue(opts.existingProfile ?? null),
    findOneAndUpdate: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };
  const auth = {
    createPasswordSetupLink: jest
      .fn()
      .mockResolvedValue({ url: "https://example.test/set-password" }),
  };
  const mail = { sendHtml: jest.fn().mockResolvedValue(undefined) };
  const config = { get: jest.fn().mockReturnValue("https://iomaparis.ae") };
  const svc = new ProAccessService(
    {} as never,
    profileModel as never,
    applicationModel as never,
    {} as never,
    {} as never,
    users as never,
    auth as never,
    mail as never,
    {} as never,
    {} as never,
    config as never,
  );
  return { svc, users, applicationModel, profileModel, auth, mail };
}

describe("ProAccessService.createProfessional", () => {
  it("creates an approved account for a new person and emails a link to choose a password", async () => {
    const { svc, users, auth, mail, profileModel, applicationModel } = build();
    const r = await svc.createProfessional(adminId, input);
    expect(r.invited).toBe(true);
    expect(users.create.mock.calls[0][0]).toMatchObject({
      email: "new.spa@example.test",
      firstName: "Layla",
    });
    // the stored password is an unusable random hash, never anything an admin typed
    expect(String(users.create.mock.calls[0][0].passwordHash)).toMatch(/^\$argon2id\$/);
    expect(applicationModel.create.mock.calls[0][0]).toMatchObject({
      status: "approved",
      companyName: "Layla Beauty Spa",
    });
    expect(profileModel.findOneAndUpdate.mock.calls[0][1].$set).toMatchObject({
      status: "approved",
    });
    expect(users.addRole).toHaveBeenCalledWith(
      expect.any(String),
      "professional_approved",
    );
    expect(auth.createPasswordSetupLink).toHaveBeenCalled();
    expect(mail.sendHtml).toHaveBeenCalledWith(
      "new.spa@example.test",
      expect.any(String),
      expect.any(String),
    );
  });

  it("gives an existing customer professional access without creating a second login", async () => {
    const { svc, users, auth } = build({
      existingUser: { id: String(new Types.ObjectId()) },
    });
    const r = await svc.createProfessional(adminId, input);
    expect(r.invited).toBe(false);
    expect(users.create).not.toHaveBeenCalled();
    expect(auth.createPasswordSetupLink).not.toHaveBeenCalled();
    expect(users.addRole).toHaveBeenCalledWith(
      expect.any(String),
      "professional_approved",
    );
  });

  it("refuses to create a second professional account for the same person", async () => {
    const { svc, applicationModel } = build({
      existingUser: { id: String(new Types.ObjectId()) },
      existingProfile: { status: "approved" },
    });
    await expect(svc.createProfessional(adminId, input)).rejects.toThrow(
      ConflictException,
    );
    expect(applicationModel.create).not.toHaveBeenCalled();
  });
});
