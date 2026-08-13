/**
 * Barra de progresso em blocos, não em CSS liso: a estética é de terminal
 * (§10), e o §14 desenha exatamente assim. Usada pela classe e pelas
 * disciplinas, que é onde a duplicação apareceria primeiro.
 */
export function Barra({
  valor,
  total,
  blocos = 10,
  className = "",
}: {
  valor: number;
  total: number;
  blocos?: number;
  className?: string;
}) {
  const cheios = total > 0 ? Math.min(blocos, Math.floor((valor / total) * blocos)) : 0;

  return (
    <span className={className} aria-hidden>
      {"█".repeat(cheios)}
      <span className="text-texto-apagado">{"░".repeat(blocos - cheios)}</span>
    </span>
  );
}

/** Números do sistema sempre com separador de milhar pt-BR. */
export function numero(valor: number) {
  return Math.round(valor).toLocaleString("pt-BR");
}
