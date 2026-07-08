import { createBrowserClient } from "@supabase/ssr";

// Singleton: várias instâncias do client no browser competem para renovar a
// mesma sessão (cada uma com seu próprio timer de auto-refresh), o que pode
// invalidar o refresh token e deslogar o usuário sem motivo aparente.
let browserClient;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}
