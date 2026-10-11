import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { UserDropdownPanelSwitcher } from "../PanelSwitcher";
import { useInstructorPanelAccess } from "@/features/live/useInstructorPanelAccess";
import type { useUserDropdownLogic } from "../useUserDropdownLogic";

const fetcher = vi.hoisted(() => vi.fn());
vi.mock("@/features/live/client", () => ({ liveFetch: fetcher }));
type Logic = ReturnType<typeof useUserDropdownLogic>;
const navigate = vi.fn();
const labels: Record<string, string> = {
  "profileDropdown.panels.admin": "Admin", "profileDropdown.panels.instructor": "Instructor",
  "profileDropdown.panels.business": "Empresa", "profileDropdown.panels.user": "Usuario",
  "profileDropdown.panels.title": "Paneles",
};
function Probe({ isAdmin = false, isOrgAdmin = false, orgSlug = "demo", userId = "user", pathname = "/demo/business-panel" }) {
  const instructorPanelPath = useInstructorPanelAccess({ isAdmin, isOrgAdmin, orgSlug, userId, isOpen: true });
  const logic = {
    isAdmin, isOrgAdmin, isInstructor: false, instructorPanelPath,
    currentOrganization: orgSlug ? { slug: orgSlug } : null, pathname,
    handleNavigation: navigate, handleUserDashboardNavigation: vi.fn(),
    accentColor: "var(--color-accent)", t: (key: string) => labels[key] || key,
  } as unknown as Logic;
  return <UserDropdownPanelSwitcher logic={logic} />;
}
function Wrapper({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}
beforeEach(() => { vi.resetAllMocks(); fetcher.mockResolvedValue({ canTeach: false }); });
afterEach(cleanup);

describe("Acceso organizacional al panel de instructor", () => {
  it("muestra Instructor al Superadmin de la captura y navega al panel existente", () => {
    render(<Probe isAdmin isOrgAdmin />, { wrapper: Wrapper });
    expect(screen.getAllByRole("button")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Instructor" }));
    expect(navigate).toHaveBeenCalledWith("/demo/instructor");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("lo muestra al administrador de empresa sin exigir un rol global Instructor", () => {
    render(<Probe isOrgAdmin pathname="/demo/instructor" />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: "Instructor" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
  it("lo muestra al miembro docente autorizado por Learning", async () => {
    fetcher.mockResolvedValue({ canTeach: true });
    render(<Probe />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Instructor" }));
    expect(fetcher).toHaveBeenCalledWith("/api/demo/live/capabilities");
    expect(navigate).toHaveBeenCalledWith("/demo/instructor");
  });
  it("lo oculta al alumno sin permisos de docencia", async () => {
    render(<Probe />, { wrapper: Wrapper });
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Instructor" })).not.toBeInTheDocument();
  });
  it("no lleva permisos del docente a otra organización", async () => {
    fetcher.mockResolvedValueOnce({ canTeach: true }).mockResolvedValue({ canTeach: false });
    const view = render(<Probe />, { wrapper: Wrapper });
    await screen.findByRole("button", { name: "Instructor" });
    view.rerender(<Probe orgSlug="other" />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/other/live/capabilities"));
    expect(screen.queryByRole("button", { name: "Instructor" })).not.toBeInTheDocument();
  });
  it("no expone una ruta global inexistente cuando no hay organización activa", () => {
    render(<Probe isAdmin orgSlug="" />, { wrapper: Wrapper });
    expect(screen.queryByRole("button", { name: "Instructor" })).not.toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("no reutiliza permisos del docente tras cambiar la cuenta en la misma organización", async () => {
    fetcher.mockResolvedValueOnce({ canTeach: true }).mockResolvedValue({ canTeach: false });
    const view = render(<Probe userId="teacher" />, { wrapper: Wrapper });
    await screen.findByRole("button", { name: "Instructor" });
    view.rerender(<Probe userId="student" />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("button", { name: "Instructor" })).not.toBeInTheDocument();
  });
});
