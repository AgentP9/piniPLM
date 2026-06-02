import { fireEvent, render, screen } from "@testing-library/react";

import { MatrixEditor } from "@/components/MatrixEditor";

describe("matrix parsing", () => {
  it("stores 16 elements from pasted matrix string", () => {
    const handleChange = vi.fn();
    render(<MatrixEditor onChange={handleChange} />);

    fireEvent.paste(screen.getByLabelText(/paste matrix/i), {
      clipboardData: {
        getData: () => "1 0 0 0 0 1 0 0 0 0 1 0 5 0 0 1",
      },
    });

    expect(handleChange).toHaveBeenCalledWith([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1]);
    expect(screen.getByLabelText("matrix-cell-12")).toHaveValue(5);
  });
});
