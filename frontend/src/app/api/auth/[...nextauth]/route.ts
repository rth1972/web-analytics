// Removed — auth is handled by the backend JWT system.
// Kept as empty route to avoid 404s from any cached requests.
export async function GET() {
  return new Response(null, { status: 404 });
}

