import React from "react";

export function renderJobPostRichText(raw) {
  const text = (raw ?? "").toString();
  if (!text.trim()) return "—";

  const renderInlineBold = (input) => {
    const s = (input ?? "").toString();
    const parts = [];
    const re = /\*\*(.+?)\*\*/g;
    let last = 0;
    let m;
    let idx = 0;
    while ((m = re.exec(s)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (start > last) parts.push(s.slice(last, start));
      parts.push(<strong key={`b-${idx++}`}>{m[1]}</strong>);
      last = end;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.length ? parts : s;
  };

  const rawLines = text.split(/\r?\n/);
  const nodes = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const keyBase = `ul-${nodes.length}`;
    nodes.push(
      <ul key={keyBase} className="pl-5 space-y-1 list-disc">
        {listItems.map((item, idx) => (
          <li key={`${keyBase}-li-${idx}`} className="whitespace-pre-line">
            {renderInlineBold(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  rawLines.forEach((lineRaw) => {
    const line = (lineRaw ?? "").toString().trim();
    if (!line) return;

    if (/^-\s+/.test(line)) {
      const item = line.replace(/^-\s+/, "").trim();
      if (item) listItems.push(item);
      return;
    }

    flushList();
    nodes.push(
      <div key={`p-${nodes.length}`} className="whitespace-pre-line">
        {renderInlineBold(line)}
      </div>
    );
  });

  flushList();
  if (nodes.length === 0) return "—";
  return <div className="space-y-1">{nodes}</div>;
}