"use client";

import { useId, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { event } from "../hero/content";

/** Shares Page 01's configured destination and unavailable-link behavior. */
export default function HighlightsRegister({ className, label }: { className: string; label: string }) {
  const [notice, setNotice] = useState(false);
  const noticeId = useId();
  const content = <>{label}<ArrowUpRight aria-hidden="true" /></>;
  return (
    <span className="highlights-register-control">
      {event.registrationUrl ? (
        <a className={className} href={event.registrationUrl}>{content}</a>
      ) : (
        <>
          <button type="button" className={className} aria-expanded={notice} aria-controls={noticeId} onClick={() => setNotice(value => !value)}>{content}</button>
          <span id={noticeId} className="highlights-register-notice" role="status" hidden={!notice}>
            The registration link hasn’t been announced here yet. Check back soon.
          </span>
        </>
      )}
    </span>
  );
}
