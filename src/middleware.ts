import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// Routes that require NO authentication at all
const FULLY_PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/otp-verif",
  "/api/auth/otp-gen",
  "/api/auth/reset-password-gen",
  "/api/auth/reset-password-verif",
  "/api/payments/webhook",
  "/api/subscriptions/plans",
];

// API routes that require a valid JWT (x-user-id will be injected)
const PROTECTED_API_PREFIXES = [
  "/api/auth/me",
  "/api/sheetSizeCalculations",
  "/api/total-calcs",
  "/api/mono-carton",
  "/api/devices",
  "/api/payments/create-order",
  "/api/payments/verify",
  "/api/subscriptions/purchase-device",
];

// Page routes that require authentication (redirect to login if not authed)
const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/calculator",
  "/history",
  "/pricing",
];

function extractToken(request: NextRequest): string | null {
  // 1. httpOnly cookie (primary)
  const cookieToken = request.cookies.get("auth_token")?.value;
  if (cookieToken) return cookieToken;

  // 2. Authorization header fallback
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow fully public paths
  if (FULLY_PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // Not a route we care about — pass through
  if (!isProtectedApi && !isProtectedPage) {
    return NextResponse.next();
  }

  const token = extractToken(request);

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    if (isProtectedApi) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      );
    }
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  // Inject verified user identity into request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", String(payload.userId));
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-device-id", payload.deviceId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
