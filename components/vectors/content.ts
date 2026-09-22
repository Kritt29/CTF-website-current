export const domains = [
  {
    id: "web",
    name: "WEB",
    line: "BREAK WHAT SHOULDN’T BE TRUSTED.",
    words: ["INSPECT", "EXPLOIT", "BYPASS", "ACCESS"],
    description:
      "Look beneath the interface. Trace requests, question trust boundaries, and uncover weaknesses in how an application handles its users and data.",
    skills: ["HTTP & sessions", "Input validation", "Application logic"],
  },
  {
    id: "crypto",
    name: "CRYPTO",
    line: "NOT EVERYTHING IS MEANT TO BE READ.",
    words: ["CIPHERS", "PATTERNS", "HIDDEN MEANINGS", "TRUTH"],
    description:
      "Find structure inside the noise. Work through encoded messages, cipher design and flawed cryptographic assumptions to recover what was meant to stay hidden.",
    skills: ["Classical ciphers", "Number theory", "Cryptanalysis"],
  },
  {
    id: "pwn",
    name: "PWN",
    line: "CONTROL IS A MATTER OF PERSPECTIVE.",
    words: ["MEMORY", "EXPLOIT", "SHELL", "PRIVILEGE"],
    description:
      "Understand what a program does with memory. Follow execution, investigate unsafe behavior, and turn a small implementation mistake into control.",
    skills: ["Memory layout", "Binary analysis", "Exploit development"],
  },
  {
    id: "reverse",
    name: "REVERSE",
    line: "SEE WHAT OTHERS DON’T.",
    words: ["DISASSEMBLE", "ANALYZE", "UNDERSTAND", "REBUILD"],
    description:
      "Start with the finished program and work backward. Reconstruct its logic, follow the checks, and discover the behavior hidden behind compiled instructions.",
    skills: ["Disassembly", "Debugging", "Program logic"],
  },
  {
    id: "forensics",
    name: "FORENSICS",
    line: "EVERY BYTE TELLS A STORY.",
    words: ["RECOVER", "ANALYZE", "CONNECT", "UNCOVER"],
    description:
      "Piece together the evidence left behind. Inspect files, recover fragments and connect artifacts to understand what happened and where the flag is hidden.",
    skills: ["File analysis", "Packet inspection", "Data recovery"],
  },
  {
    id: "osint",
    name: "OSINT",
    line: "THE INTERNET REMEMBERS.",
    words: ["PEOPLE", "PLACES", "PATTERNS", "INTEL"],
    description:
      "Follow publicly available clues. Compare sources, read the context in images and metadata, and connect scattered information into a defensible conclusion.",
    skills: ["Source verification", "Geolocation", "Public information"],
  },
];

export const vectorEvent = {
  participants: null,
  challenges: null,
  prizePool: null,
  duration: null,
  eligibility: null,
  registrationUrl: "",
} as {
  participants: string | null;
  challenges: string | null;
  prizePool: string | null;
  duration: string | null;
  eligibility: string | null;
  registrationUrl: string;
};
