import { ContentController } from "./content.controller";
describe("published content response contract", () => {
  it("serializes missing content as JSON null so existing site content can render", async () => {
    const db = {
      collection: jest
        .fn()
        .mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) }),
    };
    const response = { json: jest.fn() };
    await new ContentController(db as never).page(
      "journal",
      "existing-static-article",
      response as never,
    );
    expect(response.json).toHaveBeenCalledWith(null);
  });
  it("does not expose draft entries through the public endpoint", async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const db = { collection: jest.fn().mockReturnValue({ findOne }) };
    await new ContentController(db as never).page("page", "draft-page", {
      json: jest.fn(),
    } as never);
    expect(findOne.mock.calls[0][0]).toEqual({
      kind: "page",
      slug: "draft-page",
      status: "published",
    });
  });
});
