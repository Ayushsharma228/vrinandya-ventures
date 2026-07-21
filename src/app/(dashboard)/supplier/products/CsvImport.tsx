"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type ImportResult = {
  imported: number;
  skipped:  number;
  errors:   string[];
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: ImportResult }
  | { status: "error"; message: string };

export function CsvImport({ onImported }: { onImported?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ status: "idle" });
  const [showErrors, setShowErrors] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setState({ status: "loading" });
    setShowErrors(false);

    try {
      const fd = new FormData();
      fd.append("csv", file);

      const res  = await fetch("/api/supplier/products/import-csv", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Import failed" });
        return;
      }

      setState({ status: "done", result: data as ImportResult });
      onImported?.();
    } catch {
      setState({ status: "error", message: "Something went wrong. Please try again." });
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={state.status === "loading"}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--text-600)", background: "var(--bg-card)" }}
      >
        {state.status === "loading"
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
          : <><Upload className="w-4 h-4" /> Import CSV</>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />

      {state.status === "done" && (
        <div
          className="w-72 rounded-xl px-4 py-3 text-sm border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-1 font-semibold" style={{ color: "#16A34A" }}>
            <CheckCircle className="w-4 h-4" />
            Import complete
          </div>
          <p style={{ color: "var(--text-600)" }}>
            {state.result.imported} imported · {state.result.skipped} skipped
          </p>
          {state.result.errors.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowErrors((v) => !v)}
                className="text-xs underline"
                style={{ color: "var(--text-400)" }}
              >
                {showErrors ? "Hide" : "Show"} {state.result.errors.length} warning
                {state.result.errors.length !== 1 ? "s" : ""}
              </button>
              {showErrors && (
                <ul className="mt-1 space-y-0.5 text-xs" style={{ color: "#F59E0B" }}>
                  {state.result.errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {state.status === "error" && (
        <div
          className="w-72 rounded-xl px-4 py-3 text-sm border flex items-start gap-2"
          style={{ background: "var(--bg-card)", borderColor: "#EF4444", color: "#EF4444" }}
        >
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {state.message}
        </div>
      )}
    </div>
  );
}
