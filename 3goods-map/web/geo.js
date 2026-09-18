// Geometry only: turns GeoJSON lon/lat into flat SVG path strings and
// pixel-space bounding boxes. Knows nothing about scores, colors, or DOM --
// MapView decides what to do with what this module produces.

// Web Mercator projection, same approach as the Singapore project this map
// is modeled on: project then fit to a bounding box client-side so raw
// lon/lat never leaks into the SVG.
export function project([lon, lat]) {
  const x = lon * 20037508 / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 20037508 / Math.PI;
  return [x, -y];
}

// Builds one SVG path per feature, scaled/translated to fit targetWidth,
// plus a pixel-space bounding box per shape (used later to zoom-to-province).
export function buildShapes(features, targetWidth) {
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  const polysByFeature = features.map(f => {
    const poly = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const rings of poly) {
      for (const ring of rings) {
        ring.forEach(c => {
          const [x, y] = project(c);
          minx = Math.min(minx, x); maxx = Math.max(maxx, x);
          miny = Math.min(miny, y); maxy = Math.max(maxy, y);
        });
      }
    }
    return { poly, p: f.properties };
  });

  const pad = 10;
  const span = Math.max(maxx - minx, (maxy - miny) * targetWidth / 900);
  const s = (targetWidth - 2 * pad) / span;

  const shapes = polysByFeature.map(({ poly, p }) => {
    let d = "";
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const rings of poly) {
      for (const ring of rings) {
        ring.forEach((c, i) => {
          const [x, y] = project(c);
          const px = (x - minx) * s + pad, py = (y - miny) * s + pad;
          bx0 = Math.min(bx0, px); bx1 = Math.max(bx1, px);
          by0 = Math.min(by0, py); by1 = Math.max(by1, py);
          d += (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1);
        });
        d += "Z";
      }
    }
    return { d, p, bbox: { x0: bx0, y0: by0, x1: bx1, y1: by1 } };
  });

  const height = (maxy - miny) * s + 2 * pad;
  return { shapes, width: targetWidth, height, minx, miny, s, pad };
}

// Projects a single lon/lat into the same pixel space buildShapes() used,
// for placing point markers (metro hubs, facility pins) on top of the map.
export function projectToPixel(lon, lat, extent) {
  const [x, y] = project([lon, lat]);
  return { x: (x - extent.minx) * extent.s + extent.pad, y: (y - extent.miny) * extent.s + extent.pad };
}

export function minmaxSqrt(vals, rMin, rMax) {
  const roots = vals.map(Math.sqrt);
  const lo = Math.min(...roots), hi = Math.max(...roots);
  return roots.map(r => hi === lo ? (rMin + rMax) / 2 : rMin + (r - lo) / (hi - lo) * (rMax - rMin));
}
