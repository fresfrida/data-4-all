// Shared by every endpoint in api/. Vercel does not turn files/folders
// starting with "_" into routes, so this is a plain helper module, not
// itself an endpoint.
//
// This API is read-only public data (no auth, no user input beyond query
// flags), so a permissive CORS origin is intentional -- it's what lets an
// external frontend (e.g. a Lovable-built React app on a *.lovable.app
// origin) call it directly from the browser without a proxy.
function withCors(handler) {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    try {
      await handler(req, res);
    } catch (err) {
      res.status(500).json({ error: "internal_error", message: err.message });
    }
  };
}

module.exports = { withCors };
