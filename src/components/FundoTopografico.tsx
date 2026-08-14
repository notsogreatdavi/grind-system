/**
 * Textura topográfica da árvore (§10.3): linhas de contorno são profundidade
 * revelada por camadas, que é literalmente o que uma árvore de habilidade mostra.
 *
 * SVG inline, não arquivo em `public/`: servido como `background-image` o SVG não
 * enxergaria os tokens do `@theme`, e a regra do design system é nunca escrever hex
 * fora do `globals.css`. Com `currentColor`, a cor vem da classe de quem usa.
 *
 * `aria-hidden` porque é textura: não há nada a anunciar.
 */
export function FundoTopografico() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-borda opacity-40"
    >
      <defs>
        <pattern id="topografia" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M-20 30 Q 30 0 60 30 T 140 30" />
            <path d="M-20 48 Q 30 22 60 48 T 140 48" />
            <path d="M-20 66 Q 30 44 60 66 T 140 66" />
            <path d="M-20 90 Q 30 66 60 90 T 140 90" />
            <path d="M-20 114 Q 30 92 60 114 T 140 114" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topografia)" />
    </svg>
  );
}
