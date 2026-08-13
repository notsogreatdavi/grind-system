import { FaixaCheckin } from "@/components/FaixaCheckin";
import { PainelClasse, PainelDisciplinas } from "@/components/PainelClasse";
import { ResumoSemana } from "@/components/ResumoSemana";

/**
 * FICHA · "onde estou?" (§11.3).
 *
 * A ordem da tela é a ordem da prioridade: check-in primeiro, sempre. Classe,
 * disciplinas e semana são leitura, e leitura pode esperar — captura não.
 */
export default function Ficha() {
  return (
    <>
      <FaixaCheckin />
      <PainelClasse />
      <PainelDisciplinas />
      <ResumoSemana />
    </>
  );
}
