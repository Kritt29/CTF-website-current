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
  if (["crypto", "forensics", "osint", "pwn"].includes(kind)) {
    return (
      <img
        className={`vector-object vector-reference-image vector-${kind}`}
        src={`/assets/vectors/${kind}-reference.webp`}
        width={1448}
        height={1086}
        alt=""
        aria-hidden="true"
        decoding="async"
      />
    );
  }
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
        stroke={active ? orange : "#d3e0e4"}
        strokeWidth=".8"
      />
      <path
        d={`M${x} ${y + 19}h${w}`}
        stroke={active ? orange : silver}
        opacity=".6"
      />
      <path
        d={`M${x + 1} ${y + h - 1}V${y + 1}H${x + w - 1}`}
        fill="none"
        stroke="#eff9ff"
        strokeWidth=".5"
        opacity=".65"
      />
      {active && (
        <path
          d={`M${x + w} ${y}v${h}H${x}`}
          fill="none"
          stroke={orange}
          strokeWidth="1.2"
          filter={`url(#${id}glow)`}
        />
      )}
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
  const microcode = (x: number, y: number, rows: number, width = 85) => (
    <g fontFamily="monospace" fontSize="3.7" fill="#b8c8cd" opacity=".58">
      {Array.from({ length: rows }, (_, i) => (
        <text key={i} x={x} y={y + i * 6}>
          {[
            "0x004012f0  48 89 e5   mov rbp,rsp",
            "00000110  e8 4f 00   call 0x401000",
            "8b 45 fc  83 f8 00   cmp eax,0",
            "c7 45 f8  00 00 00   memory.read",
            "48 8d 05  74 0a 90   test rax,rax",
          ][i % 5].slice(0, Math.floor(width / 2.2))}
        </text>
      ))}
    </g>
  );
  const photo = (x: number, y: number, w: number, h: number) => (
    <svg
      x={x}
      y={y}
      width={w}
      height={h}
      viewBox="0 0 120 78"
      preserveAspectRatio="none"
    >
      <rect width="120" height="78" fill="#758187" />
      <image
        href="/assets/atmosphere.png"
        width="120"
        height="78"
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: "grayscale(1) brightness(2.4) contrast(1.4)" }}
      />
      <path
        d="M0 73L22 41 36 57 61 25 85 57 105 45 120 65V78H0Z"
        fill="#071014"
        opacity=".7"
      />
      <path
        d="M22 41l14 16 25-32 24 32"
        fill="none"
        stroke="#cdd6d9"
        strokeWidth=".6"
      />
    </svg>
  );
  return (
    <svg
      className={`vector-object vector-${kind}`}
      viewBox="0 0 450 320"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#56646c" stopOpacity=".19" />
          <stop offset=".45" stopColor="#030607" stopOpacity=".52" />
          <stop offset="1" stopColor="#20282c" stopOpacity=".2" />
        </linearGradient>
        <radialGradient id={`${id}light`}>
          <stop stopColor={orange} stopOpacity=".28" />
          <stop offset="1" stopColor={orange} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}metal`} cx="35%" cy="25%">
          <stop stopColor="#242e33" />
          <stop offset=".25" stopColor="#141b1e" />
          <stop offset=".7" stopColor="#020405" />
          <stop offset="1" stopColor="#080c0e" />
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
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              {panel(65 + i * 19, 9 + i * 17, 220, 178, i, i === 4)}
              {microcode(180 + i * 19, 47 + i * 17, 22, 95)}
            </g>
          ))}
          <g transform="translate(151 79)" fontFamily="monospace" fill={silver}>
            <path d="M-3 28h209M95 28v136" stroke="#d9e4e7" strokeWidth=".45" opacity=".38"/>
            <rect x="-8" y="5" width="5" height="8" rx="1" fill={orange}/>
            <text x="0" y="18" fontSize="11" fill={orange}>
              https://
            </text>
            {["INSPECT", "EXPLOIT", "BYPASS", "GAIN ACCESS"].map((t, i) => (
              <g key={t}><rect x="-6" y={41+i*26} width="4" height="5" fill="none" stroke={silver} strokeWidth=".5"/><text x="3" y={48+i*26} fontSize="10">{t}</text></g>
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
          {[42, 35, 28, 21, 14, 7].map((x, i) => (
            <circle
              key={i}
              cx={x}
              r="132"
              fill="#070b0d"
              stroke={silver}
              strokeWidth=".8"
            />
          ))}
          {Array.from({ length: 30 }, (_, i) => {
            const a = (i / 30) * Math.PI * 2;
            return (
              <path
                key={i}
                d={`M${sine(a) * 132} ${cosine(a) * 132}l42 0`}
                stroke={i % 3 === 0 ? "#e6eff1" : silver}
                strokeWidth=".6"
                opacity=".6"
              />
            );
          })}
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
                    <rect
                      x="-8"
                      y="-9"
                      width="16"
                      height="18"
                      rx="2"
                      fill={
                        (i === 6 || i === 7) && row === 0
                          ? "#c53e05"
                          : "#070a0c"
                      }
                      stroke={
                        (i === 6 || i === 7) && row === 0 ? orange : "#a0b3bd"
                      }
                      strokeWidth=".5"
                      opacity=".8"
                    />
                    {(i === 6 || i === 7) && row === 0 && (
                      <rect
                        x="-8"
                        y="-9"
                        width="16"
                        height="18"
                        fill={orange}
                        filter={`url(#${id}glow)`}
                      />
                    )}
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
            const y = 34 + i * 37, half=[91,123,109,134,115][i];
            return (
              <g key={i}>
                <path
                  d={`M235 ${y}L${235+half} ${y + 41}L234 ${y + 93}L${235-half} ${y + 43}Z`}
                  fill={`url(#${id}glass)`}
                  stroke={silver}
                  strokeWidth=".7"
                />
                <path
                  d={`M${235-half} ${y + 43}v23l${half-1} 50 ${half+1}-53v-22M234 ${y + 93}v23`}
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
          <g stroke="#c9d7dd" strokeWidth=".55" opacity=".5">
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${134 + i * 59} ${58 + Math.abs(i - 1.5) * 13}v187M${134 + i * 59} 218l95-40`}
              />
            ))}
          </g>
          <path
            d="M235 137l63 22-65 27-61-24z"
            fill={orange}
            filter={`url(#${id}glow)`}
          />
          <path
            d="M235 137l63 22-65 27-61-24z"
            fill="#a52a02"
            stroke="#ffe4ce"
          />
          <g transform="translate(234 162) scale(1 .43) rotate(-22)">
            <rect
              x="-36"
              y="-30"
              width="78"
              height="65"
              fill="#ff6818"
              stroke="#ffe9d3"
            />
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <path
                  d={`M${-31 + i * 7} -30v-20m0 85v20M-36 ${-25 + i * 5}h-20m98 0h20`}
                  stroke="#ffa45f"
                  strokeWidth="1.4"
                />
                <path
                  d={`M${-25 + i * 6} -20v40`}
                  stroke="#ffdfbe"
                  opacity=".6"
                />
              </g>
            ))}
            <rect
              x="-15"
              y="-11"
              width="33"
              height="28"
              fill="#fff1dc"
              filter={`url(#${id}glow)`}
            />
          </g>
          <g transform="translate(194 67) skewY(-14)">
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
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              {panel(73 + i * 24, 7 - i * 13, 206, 213, i, i === 2)}
              {microcode(81 + i * 24, 36 - i * 13, 27, 180)}
            </g>
          ))}
          <g transform="translate(155 17)" fontFamily="monospace">
            <rect
              x="-9"
              y="8"
              width="147"
              height="169"
              fill="#030607"
              fillOpacity=".94"
              stroke={orange}
              strokeWidth=".7"
            />
            <text x="0" y="16" fill="#afbec5" fontSize="4.5">DISASSEMBLY / .TEXT / x86_64</text>
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
            <g opacity=".62" fill="#c2cfd5" fontSize="4">{['RAX 00000001','RBP 7FFF2A10','RSP 7FFF29F0','RIP 004012F0'].map((t,i)=><text key={t} x="89" y={124+i*9}>{t}</text>)}</g>
          </g>
          <path d="M76 230H350M89 243H331" stroke={orange} opacity=".5" />
        </g>
      )}
      {kind === "forensics" && (
        <g>
          {/* A three-dimensional evidence volume, not a radial shard/fan symbol. */}
          <g fill="none" stroke="#b9cbd2" strokeWidth=".6" opacity=".55">
            <path d="M183 62l68-27 61 41v139l-66 52-70-46zM183 62l63 42 66-28M246 104v163M176 221l70-45 66 39" />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M180 ${87 + i * 35}l66 40 66-38`} />
            ))}
          </g>
          {Array.from({ length: 26 }, (_, i) => {
            const x = 203 + ((i * 23) % 72),
              y = 76 + ((i * 37) % 139),
              z = 4 + (i % 4) * 3;
            return (
              <g key={i}>
                <path
                  d={`M${x} ${y}l${z} -4 ${z} 5v${z + 4}l-${z} 5-${z}-5z`}
                  fill={i % 3 === 0 ? orange : "#441608"}
                  stroke={i % 3 === 0 ? "#ffb66a" : "#bb490f"}
                  strokeWidth=".5"
                />
                <path
                  d={`M${x + z} ${y + 1}v${z + 9}`}
                  stroke="#ffb46c"
                  strokeWidth=".6"
                />
              </g>
            );
          })}
          {[
            [126, 163],
            [305, 72],
            [344, 221],
            [177, 273],
            [174, 45],
            [275, 277],
          ].map(([x, y], i) => (
            <g key={i}>
              <path
                d={`M245 160L${x} ${y}`}
                stroke={orange}
                strokeWidth=".7"
                opacity=".7"
              />
              <circle cx={x} cy={y} r="2" fill="#ffe2c1" />
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={orange}
                filter={`url(#${id}glow)`}
              />
            </g>
          ))}
          <g transform="translate(91 133) rotate(-19) skewY(-6)">
            {panel(0, 0, 101, 115, 0)}
            <text x="8" y="13" fill="#c9d4d9" fontSize="5">
              EVIDENCE / 001
            </text>
            {Array.from({ length: 15 }, (_, i) => {
              const r = 9 + i * 2;
              return (
                <path
                  key={i}
                  d={`M${50 - r * 0.65} ${63 + r * 0.95}C${50 - r * 1.1} ${63 + r * 0.15},${50 - r * 0.9} ${63 - r},50 ${63 - r}C${50 + r} ${63 - r},${50 + r * 0.9} ${63 + r * 0.6},${50 + r * 0.3} ${63 + r}C${50 - r * 0.1} ${63 + r * 1.25},${50 - r * 0.5} ${63 + r * 0.6},${50 - r * 0.23} ${63 + r * 0.22}`}
                  fill="none"
                  stroke="#d9e2df"
                  strokeWidth=".75"
                />
              );
            })}
            <path d="M5 107h90" stroke="#b6c7cd" strokeWidth=".5" />
          </g>
          <g transform="translate(286 38) skewY(-8) rotate(6)">
            {panel(0, 0, 83, 98, 1)}
            {photo(5, 24, 73, 63)}
            <path d="M6 91h50" stroke="#dde4e8" strokeWidth=".8" />
          </g>
          <g transform="translate(285 188) rotate(19) skewX(7)">
            {panel(0, 0, 103, 90, 2)}
            {photo(5, 24, 55, 47)}
            {microcode(64, 30, 9, 35)}
          </g>
          <g transform="translate(168 245) rotate(-24)">
            {panel(0, 0, 75, 58, 3)}
            {microcode(5, 27, 5, 65)}
          </g>
          <g transform="translate(162 35) rotate(-27)">
            {panel(0, 0, 41, 59, 4)}
            {microcode(4, 25, 5, 33)}
          </g>
          <g transform="translate(255 239) rotate(27)">
            {panel(0, 0, 48, 57, 5)}
            {microcode(5, 27, 4, 37)}
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
            opacity=".32"
            style={{ filter: "grayscale(1) contrast(2)" }}
          />
          <g fill="none" stroke="#b7cbd4" strokeWidth=".5" opacity=".3">
            {[28, 61, 88].map((r) => (
              <ellipse key={r} cx="237" cy="157" rx={r} ry="110" />
            ))}
            {[-65, -30, 10, 50, 80].map((y) => (
              <ellipse
                key={y}
                cx="237"
                cy={157 + y}
                rx={Math.sqrt(12100 - y * y).toFixed(3)}
                ry="15"
              />
            ))}
          </g>
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
              <path
                d="M-29 29h71"
                stroke="#e0e7ea"
                opacity=".7"
                strokeWidth=".7"
              />
              {i % 2 === 0 ? (
                <>
                  <circle cx="-12" cy="-4" r="7" fill="#b2bdc0" />
                  <path d="M-23 20q0-24 22 0Z" fill="#7b8a91" />
                </>
              ) : (
                <>
                  {photo(-25, -3, 63, 25)}
                  <path
                    d="M-25 22V4h5v18h4V-1h7v23h3V8h4v14h8V-5h5v27h5V3h8v19"
                    fill="#061015"
                  />
                  <path d="M-25 24h63" stroke="#cbd8dd" />
                </>
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
