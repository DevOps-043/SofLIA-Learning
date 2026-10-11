import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { LiveSessionsWidget } from "../LiveCatalog";
import { InstructorWorkspace } from "../InstructorWorkspace";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../client", () => ({
  liveFetch: mocks.fetch,
  liveDate: (value: string) => value,
  statusLabel: {},
}));
vi.mock("@/features/courses/hooks/useCourseTheme", () => ({
  useCourseTheme: () => ({
    bgPrimary: "var(--background)",
    bgSecondary: "var(--surface)",
    text: "var(--text)",
    accent: "var(--accent)",
  }),
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.fetch.mockResolvedValue({
    sessions: [],
    courses: [],
    instructors: [],
    canTeach: true,
    isAdmin: true,
    userId: "teacher",
    total: 0,
    courseTotal: 0,
    instructorTotal: 0,
    stats: { sessions: 0, learners: 0, completed: 0, averageProgress: 0 },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
describe("Sesiones e instructores disponibles permanentemente", () => {
  it.each([undefined, "false"])(
    "carga el dashboard y el formulario del instructor con la antigua variable en %s",
    async (value) => {
      vi.stubEnv("NEXT_PUBLIC_LIVE_LEARNING_ENABLED", value);
      render(
        <SWRConfig value={{ provider: () => new Map() }}>
          <LiveSessionsWidget orgSlug="demo" />
          <InstructorWorkspace orgSlug="demo" />
        </SWRConfig>,
      );
      expect(
        screen.getByRole("heading", { name: "Tus sesiones en Soflia Hub" }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("button", {
          name: "Programar sesión en Soflia Hub",
        }),
      ).toBeEnabled();
      await waitFor(() =>
        expect(mocks.fetch).toHaveBeenCalledWith(
          "/api/demo/live?period=upcoming",
        ),
      );
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/demo/live?view=instructor&page=0&coursePage=0&instructorPage=0",
      );
      expect(
        screen.queryByText(/todavía no está habilitada/),
      ).not.toBeInTheDocument();
    },
  );

  it("rechaza una fecha pasada antes de llamar a Zoom y muestra el error en Nueva sesión", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InstructorWorkspace orgSlug="demo" />
      </SWRConfig>,
    );
    const button = await screen.findByRole("button", {
      name: "Programar sesión en Soflia Hub",
    });
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByLabelText("Fecha y hora local"), {
      target: { value: "2020-01-01T10:00" },
    });
    fireEvent.submit(form);
    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "Elige una fecha y hora futura",
    );
    expect(mocks.fetch.mock.calls.every((args) => args.length === 1)).toBe(
      true,
    );
    const instructorForm = screen
      .getByRole("button", { name: "Guardar acceso" })
      .closest("form")!;
    expect(within(instructorForm).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mantiene el rechazo del anfitrión junto al formulario de acceso al cambiar la vista", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InstructorWorkspace orgSlug="demo" />
      </SWRConfig>,
    );
    const button = await screen.findByRole("button", {
      name: "Guardar acceso",
    });
    const form = button.closest("form")!;
    mocks.fetch.mockImplementation(async (_url: string, body?: unknown) => {
      if (body)
        throw new Error(
          "El anfitrión no existe en la cuenta de Zoom conectada.",
        );
      return {
        sessions: [],
        courses: [],
        instructors: [],
        isAdmin: true,
        userId: "teacher",
        total: 0,
        courseTotal: 0,
        instructorTotal: 0,
        stats: { sessions: 0, learners: 0, completed: 0, averageProgress: 0 },
      };
    });
    fireEvent.submit(form);
    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "El anfitrión no existe",
    );
    fireEvent.change(screen.getByLabelText("Filtrar por instructor"), {
      target: { value: "teacher" },
    });
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/demo/live?view=instructor&page=0&coursePage=0&instructorPage=0&instructor=teacher",
      ),
    );
    const currentForm = (
      await screen.findByRole("button", { name: "Guardar acceso" })
    ).closest("form")!;
    expect(within(currentForm).getByRole("alert")).toHaveTextContent(
      "El anfitrión no existe",
    );
  });
});
