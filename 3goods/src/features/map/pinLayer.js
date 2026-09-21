/**
 * Wrapper-side behaviour for the vendored MapView's facility pins (they are drawn as plain SVG groups with no click handling, and
 * the vendor code is read-only, D-061). After every MapView render the pins are decorated (matched / selected state, keyboard
 * access, a larger invisible hit area for fingers) and a single delegated listener turns clicks into a pin index. Pin `i` in the
 * DOM is `facilities[i]`: the vendor draws them in array order, which `decoratePins` double-checks by name before touching anything.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
const CLICK_SLOP_PX = 6;

/**
 * @param {HTMLElement} container
 * @param {Array<{name: string}>} facilities
 * @param {Map<number, {organisation: {name: Record<string,string>}}>} matches
 * @param {number|null} selectedIndex
 * @param {(facility: object, match: object|undefined) => string} labelFor  accessible name for a pin
 */
export function decoratePins(container, facilities, matches, selectedIndex, labelFor) {
  const groups = [...container.querySelectorAll(".facility-pin-group")];
  if (groups.length !== facilities.length) return;
  groups.forEach((group, i) => {
    if (group.dataset.name !== facilities[i].name) return; // not the pin we think it is: leave it alone
    group.classList.toggle("matched", matches.has(i));
    group.classList.toggle("selected", i === selectedIndex);
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute("aria-label", labelFor(facilities[i], matches.get(i)));
    if (!group.querySelector(".facility-hit")) {
      // The pin is ~13 px wide on screen; this transparent disc makes it about 30 px across to tap.
      const hit = document.createElementNS(SVG_NS, "circle");
      hit.setAttribute("class", "facility-hit");
      hit.setAttribute("cx", "12");
      hit.setAttribute("cy", "12");
      hit.setAttribute("r", "28");
      hit.setAttribute("fill", "transparent");
      group.prepend(hit);
    }
  });
}

/**
 * One listener for every pin, surviving MapView's innerHTML re-renders. A drag that starts on a pin (panning) is not a click.
 * @returns {() => void} cleanup
 */
export function attachPinClicks(container, onPinClick) {
  let down = null;
  const indexOf = (group) => [...container.querySelectorAll(".facility-pin-group")].indexOf(group);
  const onPointerDown = (e) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onClick = (e) => {
    const group = e.target.closest?.(".facility-pin-group");
    if (!group) return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX) return;
    const index = indexOf(group);
    if (index >= 0) onPinClick(index);
  };
  const onKeyDown = (e) => {
    const group = e.target.closest?.(".facility-pin-group");
    if (!group || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    const index = indexOf(group);
    if (index >= 0) onPinClick(index);
  };
  container.addEventListener("pointerdown", onPointerDown, true);
  container.addEventListener("click", onClick);
  container.addEventListener("keydown", onKeyDown);
  return () => {
    container.removeEventListener("pointerdown", onPointerDown, true);
    container.removeEventListener("click", onClick);
    container.removeEventListener("keydown", onKeyDown);
  };
}
