/**
 * Marca en la consola. El logotipo va en Source Serif 4 semibold, verde,
 * tracking +2. En la consola oscura el símbolo se ilumina en verde-400 para
 * que sobreviva sobre negro sin perder la lectura de "techo".
 */
export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid size-8 place-items-center rounded-[6px] bg-verde-400"
        style={{ boxShadow: '0 0 12px #12735A55' }}
        aria-hidden
      >
        {/* La A que cubre: un vértice angular y, debajo, una persona. */}
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path d="M4 19 L12 5 L20 19" stroke="#06241C" strokeWidth="2.4" strokeLinecap="square" />
          <circle cx="12" cy="14" r="1.7" fill="#C97A22" />
          <path d="M12 16 v3" stroke="#06241C" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      {!compacta && (
        <span className="font-serif text-[20px] font-semibold tracking-[2px] text-texto-consola">
          AMPARO
        </span>
      )}
    </div>
  );
}
