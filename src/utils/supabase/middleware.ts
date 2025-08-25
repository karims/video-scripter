import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // keep request-side jar in sync
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // rebuild response and copy all refreshed cookies
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: do not insert logic between createServerClient and getUser
  await supabase.auth.getUser();

  // Global protection (simple): allow /login, /auth, /error; everything else needs a user.
  const pathname = request.nextUrl.pathname;

// Public routes (no auth required)
  const isPublicPath =
  pathname === "/" ||
  pathname.startsWith("/pricing") ||
  pathname.startsWith("/login") ||
  pathname.startsWith("/signup") ||
  pathname.startsWith("/auth") ||
  pathname.startsWith("/error") ||
  // Allow the search API so logged-out users can use free quota
  pathname === "/api/ideas";

const {
  data: { user },
} = await supabase.auth.getUser();

if (!user && !isPublicPath) {
  if (pathname.startsWith("/api")) {
    const json = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    for (const c of supabaseResponse.cookies.getAll()) json.cookies.set(c);
    return json;
  } else {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (request.nextUrl.search ?? ""));
    const redirect = NextResponse.redirect(url);
    for (const c of supabaseResponse.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }
}

return supabaseResponse;

}
