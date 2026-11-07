import {
  parseApplication,
  parseReview,
  validateApplicationFile,
} from "./application-validation";
import { ProfessionalApplicationSchema } from "./schemas/professional-application.schema";
import { model, Types } from "mongoose";

const valid = {
  companyName: "Test Spa",
  contactPerson: "Test Owner",
  businessType: "spa",
  tradeLicenceNumber: "DXB-123",
  email: "test@example.com",
  phone: "+971501234567",
  address: "Dubai Marina",
  emirate: "DXB",
  city: "Dubai",
  locationsCount: 1,
  expectedOrderVolume: "1000 AED",
  termsAccepted: true,
};

describe("Professional application submission validation", () => {
  it("accepts an incomplete draft at the database layer", () => {
    const Application = model("ValidationDraftTest", ProfessionalApplicationSchema);
    expect(
      new Application({ userId: new Types.ObjectId() }).validateSync(),
    ).toBeUndefined();
  });
  it("accepts a complete submission", () =>
    expect(parseApplication(valid)).toEqual(valid));
  it.each([
    { companyName: "" },
    { contactPerson: "" },
    { businessType: "unknown" },
    { email: "invalid" },
    { phone: "abcdefg" },
    { phone: "12" },
    { locationsCount: 1.5 },
    { emirate: "unknown" },
    { termsAccepted: false },
    { status: "approved" },
    { roles: ["professional_approved"] },
  ])("rejects invalid or injected fields: %j", (fields) => {
    expect(() => parseApplication({ ...valid, ...fields })).toThrow();
  });
  it("requires a reason for requests and rejection", () => {
    expect(() => parseReview({}, true)).toThrow();
    expect(() => parseReview({ reviewNotes: "  " }, true)).toThrow();
    expect(parseReview({ reviewNotes: "New licence needed" }, true)).toBe(
      "New licence needed",
    );
  });
  it("checks file signatures rather than trusting MIME metadata", () => {
    expect(() =>
      validateApplicationFile({
        size: 10,
        mimetype: "application/pdf",
        buffer: Buffer.from("not a pdf"),
      } as Express.Multer.File),
    ).toThrow();
    expect(() =>
      validateApplicationFile({
        size: 10,
        mimetype: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n"),
      } as Express.Multer.File),
    ).not.toThrow();
    expect(() =>
      validateApplicationFile({ size: 11 * 1024 * 1024 } as Express.Multer.File),
    ).toThrow();
  });
});
