import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  // Bots de prévia de link (WhatsApp, Telegram, etc.) não têm login. Deixa
  // passar só eles pra conseguirem gerar a prévia (número/cliente/descrição,
  // via view pública "orcamentos_preview" que só expõe esses 3 campos — nada
  // de custo/margem/fornecedor). Decisão explícita do usuário: aceita que um
  // User-Agent falsificado veria no máximo esses mesmos 3 campos já públicos
  // — o dado sensível de verdade (tabela orcamentos completa) continua
  // travado pelo RLS do Postgres pra quem não estiver autenticado de
  // verdade, independente do que essa checagem de UA deixar passar aqui.
  const userAgent = request.headers.get("user-agent") || "";
  const isLinkPreviewBot =
    /WhatsApp|facebookexternalhit|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|SkypeUriPreview|Pinterest|redditbot|Applebot/i.test(
      userAgent
    );
  const isOrcamentoPreview = request.nextUrl.pathname.startsWith("/orcamento/");

  if (!user && !isLoginPage && !(isLinkPreviewBot && isOrcamentoPreview)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
