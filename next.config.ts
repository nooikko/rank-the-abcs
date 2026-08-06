import type { NextConfig } from "next";

// Intentionally empty. Both figures are encoded once at build time and pass
// `unoptimized`, so nothing routes through /_next/image. If an image is ever
// added that *should* be optimized, note that Next 16 treats `images.qualities`
// as an allowlist defaulting to [75] — a value outside it falls back silently
// rather than erroring.
const nextConfig: NextConfig = {};

export default nextConfig;
