import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Prepare a response object that we will keep mutating so
  // refreshed cookies (if any) make it back to the browser.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // If you standardized on ANON_KEY, swap to that env var name:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Read cookies from the incoming request
        getAll() {
          return request.cookies.getAll();
        },
        // Write any rotated/updated cookies onto the outgoing response
        setAll(cookiesToSet) {
          // Update the request-side cookie jar (so downstream server code sees it)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Create a fresh response and attach all updated cookies to it
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ⚠️ Do not put code between createServerClient(...) and auth.getUser()
  // per Supabase docs. Keep this call here to refresh/rotate tokens as needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/error");
  const isApi = pathname.startsWith("/api");

  // Global protection: if no user and not on an allowed public path
  if (!user && !isAuthPath) {
    if (isApi) {
      // For API calls, return 401 JSON (better than an HTML redirect for fetch/XHR)
      const json = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // IMPORTANT: copy the refreshed cookies from supabaseResponse
      for (const cookie of supabaseResponse.cookies.getAll()) {
        json.cookies.set(cookie);
      }

      return json;
    } else {
      // For pages, redirect to /login with a return URL
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + (request.nextUrl.search ?? ""));
      const redirect = NextResponse.redirect(url);
      // IMPORTANT: copy the refreshed cookies from supabaseResponse
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirect.cookies.set(cookie);
      }       

      return redirect;
    }
  }

  // IMPORTANT: return the same supabaseResponse object (with cookies) to avoid
  // client/server cookie desync that can force logouts.
  return supabaseResponse;
}
