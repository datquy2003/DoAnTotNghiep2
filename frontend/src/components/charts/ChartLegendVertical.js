import React from "react";

const clamp = (text, max = 26) => {
  const s = String(text ?? "");
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
};

export default function ChartLegendVertical({
  payload,
  maxHeight = 260,
  valueFormatter,
  showValue = true,
}) {
  const items = Array.isArray(payload) ? payload : [];
  if (items.length === 0) return null;

  return (
    <div
      className="pl-2"
      style={{
        maxHeight,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div className="space-y-2 pr-2">
        {items.map((it, idx) => {
          const name = it?.value ?? it?.payload?.name ?? "";
          const rawVal =
            it?.payload?.value ??
            it?.payload?.Total ??
            it?.payload?.total ??
            it?.payload?.count;
          const val = valueFormatter ? valueFormatter(rawVal) : rawVal;

          return (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <span
                className="mt-1 inline-block h-3 w-3 rounded-sm shrink-0"
                style={{ background: it?.color || "#94a3b8" }}
              />
              <div className="min-w-0">
                <div className="min-w-0 text-gray-800" title={String(name)}>
                  {clamp(name, 36)}
                </div>
                {showValue ? (
                  <div className="text-xs text-gray-500">{val}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}