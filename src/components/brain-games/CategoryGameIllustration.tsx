import React from "react";

type Props = { type: string };

export default function CategoryGameIllustration({ type }: Props) {
  const common = { stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const t = type.toLowerCase();
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label="Game illustration">
      <defs>
        <filter id="shadow"><feDropShadow dx="0" dy="7" stdDeviation="5" floodOpacity=".18" /></filter>
        <linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".98"/><stop offset="1" stopColor="#dbeafe" stopOpacity=".92"/></linearGradient>
      </defs>
      <g filter="url(#shadow)">
        {t.includes("memory") && <>
          {[72,122,172,222].map((x,i)=><g key={x} transform={`translate(${x} 68) rotate(${i%2?3:-3})`}><rect x="-20" y="-25" width="40" height="50" rx="10" fill="url(#card)" {...common}/><text x="0" y="8" textAnchor="middle" fontSize="25" fontWeight="900" fill="currentColor">{i%2?"?":"7"}</text></g>)}
          <circle cx="42" cy="34" r="13" fill="#fbbf24"/><circle cx="277" cy="130" r="9" fill="#fff" opacity=".7"/>
        </>}
        {t.includes("flash") && <><rect x="78" y="43" width="164" height="94" rx="22" fill="url(#card)" {...common}/><text x="160" y="103" textAnchor="middle" fontSize="43" fontWeight="900" fill="currentColor">3 8 5</text><path d="M49 100l18-12 12 16 22-28M251 80l20 20-20 20" fill="none" stroke="#fbbf24" strokeWidth="9" strokeLinecap="round"/></>}
        {t.includes("order") && <><path d="M60 120 C100 55 140 145 180 75 S240 60 265 115" fill="none" stroke="#fff" strokeWidth="8" opacity=".7"/><g fill="url(#card)" {...common}>{[1,2,3].map((n,i)=><rect key={n} x={62+i*72} y={72-i*14} width="48" height="48" rx="14"/>)}</g><g fill="currentColor" fontSize="23" fontWeight="900" textAnchor="middle"><text x="86" y="103">1</text><text x="158" y="89">2</text><text x="230" y="75">3</text></g></>}
        {t.includes("pattern") && <><circle cx="85" cy="90" r="28" fill="url(#card)" {...common}/><rect x="130" y="62" width="56" height="56" rx="14" fill="url(#card)" {...common}/><path d="M212 112l28-44 28 44z" fill="url(#card)" {...common}/><path d="M48 143h224" stroke="#fff" strokeWidth="7" opacity=".65" strokeLinecap="round"/></>}
        {t.includes("rush") && <><path d="M47 125h205" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity=".65"/><path d="M68 112l72-42 38 23 60-48" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/><path d="M218 45h24v24" fill="none" {...common}/><text x="91" y="145" fontSize="28" fontWeight="900" fill="currentColor">+ 7 = 15</text></>}
        {t.includes("even") && <><circle cx="92" cy="91" r="34" fill="url(#card)" {...common}/><text x="92" y="104" textAnchor="middle" fontSize="38" fontWeight="900" fill="currentColor">8</text><circle cx="228" cy="91" r="34" fill="url(#card)" {...common}/><text x="228" y="104" textAnchor="middle" fontSize="38" fontWeight="900" fill="currentColor">5</text><path d="M137 91h46" stroke="#fff" strokeWidth="8" strokeLinecap="round"/></>}
        {t.includes("missing") && <><rect x="67" y="55" width="186" height="70" rx="20" fill="url(#card)" {...common}/><text x="160" y="101" textAnchor="middle" fontSize="35" fontWeight="900" fill="currentColor">4 + ? = 9</text><circle cx="160" cy="143" r="16" fill="#fbbf24"/><text x="160" y="150" textAnchor="middle" fontSize="18" fontWeight="900">5</text></>}
        {t.includes("hidden") && <><path d="M45 133 Q92 82 140 133 T235 133 T285 120" fill="none" stroke="#fff" strokeWidth="8" opacity=".7"/><path d="M76 120V76l25-22 25 22v44M213 120V76l25-22 25 22v44" fill="none" stroke="currentColor" strokeWidth="7"/><circle cx="160" cy="73" r="22" fill="#fbbf24"/><text x="160" y="81" textAnchor="middle" fontSize="22" fontWeight="900">7</text></>}
      </g>
    </svg>
  );
}
