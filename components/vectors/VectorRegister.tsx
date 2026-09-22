"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { vectorEvent } from "./content";
export function VectorRegister() {
  const [notice, setNotice] = useState(false);
  return (
    <div className="vectors-register-control">
      {vectorEvent.registrationUrl ? (
        <a
          className="vectors-register-button"
          href={vectorEvent.registrationUrl}
        >
          REGISTER NOW
          <ArrowUpRight />
        </a>
      ) : (
        <button
          className="vectors-register-button"
          onClick={() => setNotice(!notice)}
          aria-expanded={notice}
        >
          REGISTRATION
          <ArrowUpRight />
        </button>
      )}
      {notice && (
        <p className="vectors-register-note" role="status">
          Registration details will be announced here.
        </p>
      )}
    </div>
  );
}
