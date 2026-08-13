import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de servidor, um por render. Nunca compartilhar entre requisições.
 *
 * `setAll` falha dentro de Server Component (não dá pra escrever cookie
 * durante o render), e é por isso que o refresh de sessão mora no proxy.ts:
 * lá a resposta ainda é editável. O try/catch aqui é o caso esperado, não um
 * erro engolido.
 */
export async function clienteServidor() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (paraGravar) => {
          try {
            for (const { name, value, options } of paraGravar) {
              store.set(name, value, options);
            }
          } catch {
            // Render de Server Component: o proxy já cuidou do refresh.
          }
        },
      },
    },
  );
}
