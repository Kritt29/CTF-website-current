import { eventConfig } from "../../lib/event";
export const eventHighlights = {
  // Date-only brief: use midnight in the event's Hyderabad timezone.
  startsAt: eventConfig.startsAt,
  countdownLabel: eventConfig.countdownLabel,
  details: [
    { label: "PARTICIPANTS", value: "TBA", icon: "people" },
    { label: "CHALLENGES", value: "TBA", icon: "box" },
    { label: "DURATION", value: "TBA", icon: "clock" },
    { label: "ELIGIBILITY", value: "TBA", icon: "person" },
    { label: "PRIZE POOL", value: "TBA", icon: "trophy" },
  ],
} as const;

