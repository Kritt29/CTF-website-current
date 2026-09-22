import { useId } from "react";

const sine = (n: number) => Number(Math.sin(n).toFixed(6));
const cosine = (n: number) => Number(Math.cos(n).toFixed(6));
const code = [
  "push rbp",
  "mov rbp, rsp",
  "call sub_4012F0",
  "cmp eax, 0",
  "jne 0x4012F0",
  "ret",
];
export default function VectorObject({ kind }: { kind: string }) {
  const id = useId().replaceAll(":", "");
  const orange = "#ff6a13",
    silver = "#aebdc2";
  const panel = (
    x: number,
    y: number,
    w: number,
    h: number,
    key: number,
    active = false,
  ) => (
    <g key={key}>
      <rect
        x={x + 4}
        y={y + 4}
        width={w}
        height={h}
        rx="2"
        fill="none"
        stroke={active ? orange : silver}
        opacity=".2"
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        fill={`url(#${id}glass)`}
        stroke={active ? orange : silver}
        strokeWidth=".8"
      />
      <path
        d={`M${x} ${y + 19}h${w}`}
        stroke={active ? orange : silver}
        opacity=".6"
      />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={x + 9 + i * 7}
          cy={y + 9}
          r="1.5"
          fill={active ? orange : silver}
        />
      ))}
    </g>
  );
  return (
    <svg
      className={`vector-object vector-${kind}`}
      viewBox="0 0 450 320"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#56646c" stopOpacity=".36" />
          <stop offset=".45" stopColor="#030607" stopOpacity=".92" />
          <stop offset="1" stopColor="#20282c" stopOpacity=".5" />
        </linearGradient>
        <radialGradient id={`${id}light`}>
          <stop stopColor={orange} stopOpacity=".28" />
          <stop offset="1" stopColor={orange} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}metal`} cx="35%" cy="25%">
          <stop stopColor="#536066" />
          <stop offset=".25" stopColor="#141b1e" />
          <stop offset=".7" stopColor="#020405" />
          <stop offset="1" stopColor="#344148" />
        </radialGradient>
        <filter id={`${id}glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id={`${id}earth`}>
          <circle cx="237" cy="157" r="110" />
        </clipPath>
      </defs>
      <ellipse cx="235" cy="205" rx="170" ry="100" fill={`url(#${id}light)`} />
      {kind === "web" && (
        <g transform="translate(25 53) skewY(-13)">
          {[0, 1, 2, 3, 4].map((i) =>
            panel(65 + i * 19, 9 + i * 17, 220, 178, i, i === 4),
          )}
          <g transform="translate(151 79)" fontFamily="monospace" fill={silver}>
            <text x="0" y="18" fontSize="11" fill={orange}>
              https://
            </text>
            {["INSPECT", "EXPLOIT", "BYPASS", "GAIN ACCESS"].map((t, i) => (
              <text key={t} x="0" y={48 + i * 26} fontSize="11">
                {t}
              </text>
            ))}
            {Array.from({ length: 16 }, (_, i) => (
              <path
                key={i}
                d={`M105 ${36 + i * 7}h${35 + ((i * 19) % 65)}`}
                stroke={i % 4 === 0 ? orange : silver}
                strokeWidth=".7"
                opacity=".5"
              />
            ))}
          </g>
        </g>
      )}
      {kind === "crypto" && (
        <g transform="translate(229 162) rotate(-17) skewY(7) scale(.88 1)">
          {[22, 16, 10].map((x, i) => (
            <circle
              key={i}
              cx={x}
              r="132"
              fill="#070b0d"
              stroke={silver}
              strokeWidth=".8"
            />
          ))}
          <circle r="132" fill={`url(#${id}metal)`} stroke="#d7dede" />
          {[126, 119, 97, 90, 69, 62, 39].map((r, i) => (
            <circle
              key={r}
              r={r}
              fill="none"
              stroke={i % 2 ? orange : silver}
              opacity={i % 2 ? 0.4 : 0.65}
              strokeWidth={i % 2 ? 0.6 : 1}
            />
          ))}
          {[108, 79, 50].map((r, row) => (
            <g key={r} className={`cipher-track cipher-track-${row}`}>
              {Array.from({ length: 26 }, (_, i) => {
                const a = (i / 26) * Math.PI * 2;
                return (
                  <g
                    key={i}
                    transform={`translate(${sine(a) * r} ${-cosine(a) * r}) rotate(${(i / 26) * 360})`}
                  >
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="monospace"
                      fontSize={row === 2 ? 10 : 13}
                      fill={(i + row * 3) % 9 === 0 ? orange : "#bac1c3"}
                    >
                      {String.fromCharCode(65 + ((i + row * 7) % 26))}
                    </text>
                    <path d="M-7 -10V-14" stroke={silver} opacity=".5" />
                  </g>
                );
              })}
            </g>
          ))}
          <path
            d="M-12 -123L-10 -34H10L12 -123Z"
            fill={orange}
            opacity=".12"
            stroke={orange}
          />
          <circle r="24" fill="#05090b" stroke={silver} />
          <circle r="8" fill={orange} filter={`url(#${id}glow)`} />
          <circle r="5" fill="#ffe1ba" />
          <text
            x="154"
            y="-42"
            fill={orange}
            fontSize="10"
            fontFamily="monospace"
          >
            A → H
          </text>
          <text
            x="155"
            y="-23"
            fill={silver}
            fontSize="9"
            fontFamily="monospace"
          >
            KEY +07
          </text>
        </g>
      )}
      {kind === "pwn" && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 45 + i * 43;
            return (
              <g key={i}>
                <path
                  d={`M235 ${y}L360 ${y + 41}L234 ${y + 93}L107 ${y + 43}Z`}
                  fill={`url(#${id}glass)`}
                  stroke={silver}
                  strokeWidth=".7"
                />
                <path
                  d={`M107 ${y + 43}v23l127 50 126-53v-22M234 ${y + 93}v23`}
                  fill="none"
                  stroke={silver}
                  opacity=".45"
                />
                {Array.from({ length: 7 }, (_, j) => (
                  <path
                    key={j}
                    d={`M${139 + j * 24} ${y + 33 - j * 3}l70 28`}
                    stroke={i === 2 ? orange : silver}
                    opacity=".26"
                  />
                ))}
              </g>
            );
          })}
          <path
            d="M235 137l63 22-65 27-61-24z"
            fill={orange}
            filter={`url(#${id}glow)`}
          />
          <path
            d="M235 137l63 22-65 27-61-24z"
            fill="#ff812d"
            stroke="#ffe4ce"
          />
          <g transform="translate(194 85) skewY(-14)">
            {panel(0, 0, 110, 65, 0, true)}
            <text
              x="11"
              y="40"
              fontFamily="monospace"
              fontSize="15"
              fill="#eee"
            >
              0x401000
            </text>
          </g>
          {[123, 166, 306, 347].map((x, i) => (
            <path
              key={x}
              d={`M${x} ${60 + i * 12}v164`}
              stroke={orange}
              strokeDasharray="3 15"
              opacity=".55"
            />
          ))}
        </g>
      )}
      {kind === "reverse" && (
        <g transform="translate(20 29) skewY(12)">
          {[0, 1, 2, 3].map((i) =>
            panel(73 + i * 24, 7 - i * 13, 206, 213, i, i === 2),
          )}
          <g transform="translate(155 17)" fontFamily="monospace">
            {code.map((t, i) => (
              <text
                key={t}
                y={30 + i * 24}
                fontSize="13"
                fill={i === 2 ? orange : "#d8dedf"}
              >
                {t}
              </text>
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <path
                key={i}
                d={`M-61 ${6 + i * 15}h${24 + ((i * 9) % 40)}`}
                stroke={silver}
                opacity=".5"
              />
            ))}
          </g>
          <path d="M76 230H350M89 243H331" stroke={orange} opacity=".5" />
        </g>
      )}
      {kind === "forensics" && (
        <g>
          {Array.from({ length: 19 }, (_, i) => {
            const a = i * 2.4,
              r = 45 + i * 4,
              x = 234 + cosine(a) * r,
              y = 160 + sine(a) * r;
            return (
              <g key={i}>
                <path
                  d={`M234 161L${x} ${y}l${12 + (i % 3) * 8} -25 14 32Z`}
                  fill={`url(#${id}glass)`}
                  stroke={i % 3 === 0 ? orange : silver}
                  strokeWidth=".7"
                />
                <rect
                  x={x}
                  y={y}
                  width={5 + (i % 3) * 3}
                  height={7 + (i % 4) * 4}
                  fill={orange}
                  opacity={i % 2 ? 0.8 : 0.25}
                />
              </g>
            );
          })}
          <g transform="translate(95 114) rotate(-17)">
            {panel(0, 0, 105, 132, 0)}
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={`M${15 + i * 2} 108 C${-10 + i * 3} ${20 + i * 3},${97 - i * 3} ${12 + i * 3},${89 - i * 2} 91 C${82 - i * 2} 116,${45 + i} 119,${52 + i} 75`}
                fill="none"
                stroke="#d4d8d6"
                strokeWidth=".8"
              />
            ))}
          </g>
          <g transform="translate(277 47) rotate(12)">
            {panel(0, 0, 91, 99, 1)}
            <path d="M7 81L32 43 49 70 64 51 83 79Z" fill="#66767e" />
            <circle cx="66" cy="32" r="8" fill="#aab6bd" />
          </g>
          <g transform="translate(287 187) rotate(21)">
            {panel(0, 0, 108, 95, 2)}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path
                key={i}
                d={`M11 ${32 + i * 9}h${i % 2 ? 58 : 80}`}
                stroke={silver}
                opacity=".6"
              />
            ))}
          </g>
        </g>
      )}
      {kind === "osint" && (
        <g>
          <circle
            cx="237"
            cy="157"
            r="110"
            fill={`url(#${id}metal)`}
            stroke={silver}
          />
          <image
            href="/assets/earth-day.jpg"
            x="106"
            y="38"
            width="267"
            height="240"
            clipPath={`url(#${id}earth)`}
            opacity=".21"
            style={{ filter: "grayscale(1) contrast(2)" }}
          />
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx="237"
              cy="157"
              rx={122 - i * 3}
              ry={35 + i * 17}
              transform={`rotate(${i * 43 - 40} 237 157)`}
              fill="none"
              stroke={orange}
              strokeWidth=".7"
            />
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const a = i * 2.4,
              r = 45 + ((i * 23) % 85),
              x = 237 + cosine(a) * r,
              y = 157 + sine(a) * r;
            return (
              <g key={i}>
                <path
                  d={`M${x} ${y}L${237 + cosine(a + 2) * r} ${157 + sine(a + 2) * r}`}
                  stroke={orange}
                  opacity=".22"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={i % 5 === 0 ? 3 : 1.4}
                  fill={i % 5 === 0 ? "#ffad69" : orange}
                />
              </g>
            );
          })}
          {[
            [109, 65, -12],
            [308, 88, 12],
            [112, 233, 8],
            [325, 204, -8],
          ].map(([x, y, a], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
              {panel(-30, -25, 73, 55, i)}
              {i % 2 === 0 ? (
                <>
                  <circle cx="-12" cy="-4" r="7" fill="#b2bdc0" />
                  <path d="M-23 20q0-24 22 0Z" fill="#7b8a91" />
                </>
              ) : (
                <path
                  d="M-23 20V-2h8v22h5V-9H1v29h5V-1h9v21h9V-15h9v35"
                  fill="#87949a"
                />
              )}
              <path d="M3 1h29M3 8h21M3 15h26" stroke={silver} opacity=".35" />
            </g>
          ))}
        </g>
      )}
      {Array.from({ length: 22 }, (_, i) => (
        <circle
          key={i}
          cx={65 + ((i * 61) % 337)}
          cy={28 + ((i * 47) % 270)}
          r={i % 7 === 0 ? 1.5 : 0.6}
          fill={i % 3 === 0 ? orange : silver}
          opacity=".55"
        />
      ))}
    </svg>
  );
}
