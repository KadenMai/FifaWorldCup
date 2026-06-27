import { FORM_MATCH_COUNT } from '../utils/standingsHelpers';

interface FormDotsProps {
  form: (string | null)[];
  label: string;
}

export default function FormDots({ form, label }: FormDotsProps) {
  return (
    <div className="g-form-dots" aria-label={label}>
      {form.map((r, i) => (
        <span
          key={i}
          className={`g-form-dot${r ? ` g-form-${r.toLowerCase()}` : ' g-form-empty'}`}
          title={r ?? ''}
        >
          {r === 'W' && '✓'}
          {r === 'L' && '✕'}
          {r === 'D' && '−'}
        </span>
      ))}
    </div>
  );
}

export { FORM_MATCH_COUNT };
