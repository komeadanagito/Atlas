type Props = {
  text: string;
  /** Applied to digit runs, rendered in the serif numeral face. */
  figureClassName?: string;
  /** Applied to everything else (CJK units, separators), kept in the sans face. */
  textClassName?: string;
};

/** Serif figures with sans CJK in between; Cormorant has no CJK glyphs, so mixing needs splitting. */
export const Figures = ({ text, figureClassName = "", textClassName = "" }: Props) => (
  <>
    {text.split(/(\d+)/).filter(Boolean).map((part, index) =>
      /^\d+$/.test(part) ? (
        <span key={index} className={`numeral ${figureClassName}`}>{part}</span>
      ) : (
        <span key={index} className={textClassName}>{part}</span>
      ),
    )}
  </>
);