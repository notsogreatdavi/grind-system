"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente do navegador. Toda escrita do check-in passa por aqui, com a anon
 * key: a RLS do Postgres é o que garante que só o dono vê os próprios eventos.
 */
export function clienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
