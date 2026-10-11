import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { LiveSessionsWidget } from "../LiveCatalog";
import { InstructorWorkspace } from "../InstructorWorkspace";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../client", () => ({ liveFetch: mocks.fetch, liveDate: (value: string) => value, statusLabel: {} }));
vi.mock("@/features/courses/hooks/useCourseTheme", () => ({
  useCourseTheme: () => ({ bgPrimary: "var(--background)", bgSecondary: "var(--surface)", text: "var(--text)", accent: "var(--accent)" }),
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.fetch.mockResolvedValue({
    sessions: [], courses: [], instructors: [], canTeach: true, isAdmin: true, userId: "teacher",
    total: 0, courseTotal: 0, instructorTotal: 0,
    stats: { sessions: 0, learners: 0, completed: 0, averageProgress: 0 },
  });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });
describe("Sesiones e instructores disponibles permanentemente", () => {
  it.each([undefined, "false"])("carga el dashboard y el formulario del instructor con la antigua variable en %s", async (value) => {
    vi.stubEnv("NEXT_PUBLIC_LIVE_LEARNING_ENABLED", value);
    render(<SWRConfig value={{ provider: () => new Map() }}>
      <LiveSessionsWidget orgSlug="demo" />
      <InstructorWorkspace orgSlug="demo" />
    </SWRConfig>);
    expect(screen.getByRole("heading", { name: "Tus sesiones en Soflia Hub" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Programar sesión en Soflia Hub" })).toBeEnabled();
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith("/api/demo/live?period=upcoming"));
    expect(mocks.fetch).toHaveBeenCalledWith("/api/demo/live?view=instructor&page=0&coursePage=0&instructorPage=0");
    expect(screen.queryByText(/todavía no está habilitada/)).not.toBeInTheDocument();
  });
});
