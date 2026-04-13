import { verifyAccessToken } from "../utils/jwt.mjs";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
