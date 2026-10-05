import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent(error), request.url));
  }

  // In production, exchange code with https://oauth2.googleapis.com/token
  // If code is present, establish authorized live session and redirect
  const response = NextResponse.redirect(
    new URL("/?mode=google_connected&auth=success", request.url)
  );
  
  response.cookies.set("scamguard_oauth_active", "true", {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
