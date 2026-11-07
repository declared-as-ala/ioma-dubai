import { ContactService } from "./contact.service";

const base = {
  name: "Ada",
  email: "ada@example.com",
  subject: "Order",
  message: "Where is my order please?",
  locale: "en",
};

function build(notify?: string) {
  const save = jest.fn().mockResolvedValue(undefined);
  const ctor = jest
    .fn()
    .mockImplementation((data) => ({
      ...data,
      id: "m1",
      save,
      get: () => new Date("2026-01-01"),
    }));
  const mail = { sendHtml: jest.fn().mockResolvedValue(undefined) };
  const config = { get: jest.fn().mockReturnValue(notify) };
  const service = new ContactService(ctor as never, mail as never, config as never);
  return { service, ctor, save, mail };
}

describe("ContactService", () => {
  it("stores a message with its category and order reference", async () => {
    const { service, ctor, save } = build();
    const res = await service.create({
      ...base,
      category: "return",
      orderReference: "IOMA-1042",
    });
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({ category: "return", orderReference: "IOMA-1042" }),
    );
    expect(save).toHaveBeenCalled();
    expect(res.id).toBe("m1");
  });

  it("discards honeypot submissions without storing or notifying, and answers like a success", async () => {
    const { service, ctor, mail } = build("staff@example.com");
    const res = await service.create({ ...base, website: "http://spam.example" });
    expect(ctor).not.toHaveBeenCalled();
    expect(mail.sendHtml).not.toHaveBeenCalled();
    expect(res.id).toBe("discarded");
  });

  it("notifies staff when an address is configured and escapes the content", async () => {
    const { service, mail } = build("staff@example.com");
    await service.create({ ...base, message: "<script>alert(1)</script> hello there" });
    expect(mail.sendHtml).toHaveBeenCalledTimes(1);
    const html = mail.sendHtml.mock.calls[0][2] as string;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not notify when no address is configured", async () => {
    const { service, mail, save } = build();
    await service.create(base);
    expect(save).toHaveBeenCalled();
    expect(mail.sendHtml).not.toHaveBeenCalled();
  });
});
