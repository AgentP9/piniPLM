import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ResolveWorkspace } from "@/components/ResolveWorkspace";

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("403 handling", () => {
  it("renders restricted access when resolve returns 403", async () => {
    localStorage.setItem("plm_user_id", "22222222-2222-2222-2222-222222222222");
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([{ key: "C001" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Forbidden" }), { status: 403 }));

    renderWithClient(<ResolveWorkspace productKey="prodA" branch="main" />);

    await screen.findByText("C001");
    fireEvent.click(screen.getByRole("button", { name: /c001/i }));
    fireEvent.click(screen.getByRole("button", { name: /run resolve/i }));

    await waitFor(() => {
      expect(screen.getByText(/No product access or insufficient clearance/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
