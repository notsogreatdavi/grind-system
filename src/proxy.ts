import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh de sessão e guarda de rota.
 *
 * No Next 16 este arquivo se chama `proxy.ts`: a convenção `middleware.ts` foi
 * renomeada (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 *
 * Roda antes de qualquer render, que é o único lugar onde ainda dá pra gravar
 * o cookie renovado na resposta.
 */

const PUBLICAS = ["/entrar", "/auth"];

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (paraGravar, headers) => {
          for (const { name, value } of paraGravar) request.cookies.set(name, value);
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of paraGravar) {
            resposta.cookies.set(name, value, options);
          }
          for (const [chave, valor] of Object.entries(headers)) {
            resposta.headers.set(chave, valor);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims);
  const publica = PUBLICAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (!autenticado && !publica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    return NextResponse.redirect(destino);
  }

  if (autenticado && request.nextUrl.pathname === "/entrar") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/notify|favicon.ico|icone.svg|manifest.webmanifest).*)"],
};
