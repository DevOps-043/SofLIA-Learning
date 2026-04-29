import { describe, expect, it } from "vitest";

import { normalizeLiaLinkUrl } from "../lia-link.utils";

describe("normalizeLiaLinkUrl", () => {
  it("keeps internal absolute paths", () => {
    expect(normalizeLiaLinkUrl("/courses/intro/learn")).toEqual({
      kind: "internal",
      url: "/courses/intro/learn",
    });
  });

  it("keeps http and https external links", () => {
    expect(normalizeLiaLinkUrl("https://example.com/path")).toEqual({
      kind: "external",
      url: "https://example.com/path",
    });
    expect(normalizeLiaLinkUrl("http://example.com/quiz")).toEqual({
      kind: "external",
      url: "http://example.com/quiz",
    });
  });

  it("normalizes www links to https", () => {
    expect(normalizeLiaLinkUrl("www.example.com/resource")).toEqual({
      kind: "external",
      url: "https://www.example.com/resource",
    });
  });

  it("rejects protocol-relative and unsafe schemes", () => {
    expect(normalizeLiaLinkUrl("//evil.example.com")).toBeNull();
    expect(normalizeLiaLinkUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeLiaLinkUrl("data:text/html,hi")).toBeNull();
  });

  it("rejects invalid values", () => {
    expect(normalizeLiaLinkUrl("not a url")).toBeNull();
    expect(normalizeLiaLinkUrl("")).toBeNull();
  });
});
