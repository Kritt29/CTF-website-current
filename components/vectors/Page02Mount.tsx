"use client";
import { useEffect, useState } from "react";
import ChallengeVectors from "./ChallengeVectors";
import JourneyHandoff from "../journey/JourneyHandoff";
/** Let the approved Hero measure its original document before adding Page 02. */
export default function Page02Mount() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? <><ChallengeVectors /><JourneyHandoff /></> : null;
}
