// Removed — logout is now handled client-side by clearing the auth-token cookie.
export async function POST() {
  return new Response(null, { status: 404 });
}
