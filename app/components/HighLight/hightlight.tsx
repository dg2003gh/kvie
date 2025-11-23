import React from "react";

const ansiColors: Record<number, string> = {
  30: "#000000",
  31: "#ff0000",
  32: "#00ff00",
  33: "#ffff00",
  34: "#0000ff",
  35: "#ff00ff",
  36: "#00ffff",
  37: "#ffffff",
  90: "#808080",
  91: "#ff6b6b",
  92: "#51ff51",
  93: "#ffff80",
  94: "#6b6bff",
  95: "#ff6bff",
  96: "#6bffff",
  97: "#e0e0e0",
};

export default function AnsiText({ text }: { text: string }) {
  const parts = text.split(/\x1b\[/);

  const spans = parts.map((part, index) => {
    const match = part.match(/^(\d+(?:;\d+)*)m(.*)$/s);

    if (!match) {
      return <span key={index}>{part}</span>;
    }

    const codes = match[1].split(";").map(Number);
    const content = match[2];

    const colorCode = codes.find((c) => ansiColors[c]);
    const color = colorCode ? ansiColors[colorCode] : undefined;

    const bold = codes.includes(1);
    const reset = codes.includes(0) || codes.includes(39) || codes.includes(22);

    const style: React.CSSProperties = {
      color: color,
      fontWeight: bold ? "bold" : undefined,
    };

    return (
      <span key={index} style={reset ? {} : style}>
        {content}
      </span>
    );
  });

  return <div>{spans}</div>;
}
