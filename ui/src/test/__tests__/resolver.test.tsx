import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ResolveWorkspace } from "@/components/ResolveWorkspace";

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("resolver workflow", () => {
  it("renders grouped usage results from resolve API", async () => {
    localStorage.setItem("plm_user_id", "11111111-1111-1111-1111-111111111111");
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([{ key: "C001" }, { key: "C004" }]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            productKey: "prodA",
            baseline: null,
            branch: "main",
            resolvedCodes: ["C001", "C004"],
            validationMessages: [{ severity: "WARN", message: "Package expanded." }],
            usages: [
              {
                usageMasterId: "u1",
                partKey: "partA",
                orgNodeKey: "rearaxle",
                conditionExpr: "C004-C001",
                pcssExpr: "LA+right",
                finalTransform4x4: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1],
              },
            ],
          }),
          { status: 200 },
        ),
      );

    renderWithClient(<ResolveWorkspace productKey="prodA" branch="main" />);

    await screen.findByText("C001");
    fireEvent.click(screen.getByRole("button", { name: /c001/i }));
    fireEvent.click(screen.getByRole("button", { name: /run resolve/i }));

    await waitFor(() => {
      expect(screen.getByText("rearaxle")).toBeInTheDocument();
      expect(screen.getByText("partA")).toBeInTheDocument();
      expect(screen.getByText(/Package expanded/i)).toBeInTheDocument();
    });
  });
});
