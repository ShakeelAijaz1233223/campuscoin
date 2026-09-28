/** Pure CSS dimensional artwork: no canvas, images, network, or financial data. */
export default function Hologram({ compact = false }) {
  return (
    <div className={`hologram ${compact ? 'compact' : ''}`} aria-hidden="true">
      <div className="holo-halo" />
      <div className="holo-orbit orbit-a" />
      <div className="holo-orbit orbit-b" />
      <div className="holo-object">
        <div className="holo-face">
          <span>
            c<span>↗</span>
          </span>
        </div>
      </div>
      <i className="holo-star star-one" />
      <i className="holo-star star-two" />
      <span className="holo-caption">
        A LITTLE CLARITY. LIMITLESS POSSIBILITY.
      </span>
    </div>
  );
}
