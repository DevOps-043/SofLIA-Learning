// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  afterEachNotesTest,
  beforeEachNotesTest,
  createJsonResponse,
  renderNotesManagement,
} from "./notes-management-hook.test-utils";

function generatedSummary(overrides: Record<string, unknown> = {}) {
  return {
    summary_id: "summary-1",
    module_id: "module-1",
    title: "Apunte SofLIA: Modulo 1",
    content_html: "",
    status: "generating",
    version: 1,
    generation_type: "default",
    generated_at: "2026-04-09T12:00:00.000Z",
    ...overrides,
  };
}

describe("useNotesManagement generated summaries", () => {
  beforeEach(beforeEachNotesTest);
  afterEach(afterEachNotesTest);

  it("closes a generated summary viewer when the refreshed server list no longer contains it", async () => {
    const summaryResponses = [[generatedSummary()], []];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/courses/curso-demo/notes") {
        return createJsonResponse([]);
      }

      if (url.startsWith("/api/courses/curso-demo/learning-summaries")) {
        return createJsonResponse({
          summaries: summaryResponses.shift() || [],
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    global.fetch = fetchMock as typeof fetch;

    const { result } = renderNotesManagement();

    await vi.waitFor(() => {
      expect(result.current.savedNotes).toHaveLength(1);
    });

    act(() => {
      result.current.openEditNoteModal(result.current.savedNotes[0]);
    });

    await vi.waitFor(() => {
      expect(result.current.generatedSummaryVersions).toHaveLength(0);
      expect(result.current.viewingGeneratedSummary).toBeNull();
    });
  });
});
