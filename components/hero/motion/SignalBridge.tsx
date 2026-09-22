/** A continuation of the Hyderabad route, entirely absent in the locked frame. */
export default function SignalBridge() {
  return (
    <svg className="signal-bridge" aria-hidden="true" focusable="false">
      <defs>
        <filter id="signal-halo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <path
        className="signal-path signal-halo"
        pathLength="1"
        filter="url(#signal-halo)"
      />
      <path className="signal-path signal-core" pathLength="1" />
      <circle className="signal-head-halo" r="11" filter="url(#signal-halo)" />
      <circle className="signal-head" r="3" />
    </svg>
  );
}
