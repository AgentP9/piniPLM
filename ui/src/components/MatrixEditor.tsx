"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createIdentityMatrix, parseMatrixString } from "@/lib/utils";

export function MatrixEditor({
  value,
  onChange,
  label = "4x4 matrix",
}: {
  value?: number[];
  onChange?: (value: number[]) => void;
  label?: string;
}) {
  const [internalMatrix, setInternalMatrix] = useState<number[]>(value && value.length === 16 ? value : createIdentityMatrix());
  const [pasteValue, setPasteValue] = useState("");
  const matrix = value && value.length === 16 ? value : internalMatrix;

  const emit = (next: number[]) => {
    if (!(value && value.length === 16)) {
      setInternalMatrix(next);
    }
    onChange?.(next);
  };

  const updateCell = (index: number, raw: string) => {
    const next = [...matrix];
    next[index] = Number(raw);
    emit(next);
  };

  const applyMatrixString = (raw: string) => {
    setPasteValue(raw);
    const parsed = parseMatrixString(raw);
    if (parsed) {
      emit(parsed);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {matrix.map((cell, index) => (
            <Input
              key={index}
              aria-label={`matrix-cell-${index}`}
              type="number"
              step="any"
              value={Number.isFinite(cell) ? cell : 0}
              onChange={(event) => updateCell(index, event.target.value)}
            />
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="matrix-paste">Paste matrix values</Label>
        <Textarea
          id="matrix-paste"
          aria-label="Paste matrix"
          value={pasteValue}
          onChange={(event) => applyMatrixString(event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            applyMatrixString(pasted);
            event.preventDefault();
          }}
          placeholder="1 0 0 0 0 1 0 0 0 0 1 0 5 0 0 1"
        />
      </div>
    </div>
  );
}
