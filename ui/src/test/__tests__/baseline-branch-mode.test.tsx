import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { PcssPageContent } from "@/components/PcssPageContent";

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const masters = [{ id: "pcss-1", product_id: "prod-1", pcss_key: "LA" }];
const symbols = [{ key: "LA", description: "Left axis" }];

describe("baseline vs branch mode", () => {
  it("enables create commit in branch mode", () => {
    renderWithClient(
      <PcssPageContent
        productKey="prodA"
        branch="main"
        editableOverride
        mastersOverride={masters}
        symbolsOverride={symbols}
      />,
    );

    expect(screen.getByRole("button", { name: /create commit/i })).toBeEnabled();
  });

  it("disables create commit in baseline mode", () => {
    renderWithClient(
      <PcssPageContent
        productKey="prodA"
        baseline="R2026.01"
        branch="main"
        editableOverride
        mastersOverride={masters}
        symbolsOverride={symbols}
      />,
    );

    expect(screen.getByRole("button", { name: /create commit/i })).toBeDisabled();
  });
});
