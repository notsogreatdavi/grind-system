import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";

/** Retorno do magic link: troca o código pela sessão e cai na FICHA. */
export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("code");
  const destino = request.nextUrl.clone();
  destino.search = "";

  if (!codigo) {
    destino.pathname = "/entrar";
    return NextResponse.redirect(destino);
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);

  destino.pathname = error ? "/entrar" : "/";
  return NextResponse.redirect(destino);
}
