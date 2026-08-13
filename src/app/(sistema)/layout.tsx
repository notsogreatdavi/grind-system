import { redirect } from "next/navigation";
import { BarraStatus } from "@/components/BarraStatus";
import { carregarTudo, garantirPerfil } from "@/lib/grind/consultas";
import { ProvedorEventos } from "@/lib/grind/store";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Casca das cinco abas. Busca os eventos no servidor e entrega prontos ao
 * provider: nenhuma aba abre vazia esperando um fetch do cliente.
 */
export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");

  await garantirPerfil(supabase, data.user.id);
  const dados = await carregarTudo(supabase, data.user.id);

  return (
    <ProvedorEventos iniciais={dados}>
      <BarraStatus />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">{children}</main>
    </ProvedorEventos>
  );
}
