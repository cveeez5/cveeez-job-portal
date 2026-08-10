'use client';

/**
 * عرض نصوص أسئلة v2 في سياق RTL.
 *
 * الأرقام والنِسب والكلمات الإنجليزي جوه الجملة العربي المتصفح بيظبطها لوحده
 * صح (خوارزمية bidi القياسية) — أي تدخّل بـ<bdi> هنا بيكسر الأقواس زي «(1)».
 * اللي محتاج تدخّل فعلاً هو السطور الإنجليزي بالكامل (زي مقتطف السيرة الذاتية
 * في w2): دي لازم تتعرض LTR ومحاذاة شمال مش RTL.
 */

const ARABIC = /[؀-ۿ]/;

function isLatinLine(line: string): boolean {
  if (!/[A-Za-z]/.test(line)) return false;
  return !ARABIC.test(line);
}

export default function RichLabel({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const key = `l${i}`;

        if (line.trim() === '') {
          return <span key={key} className="block h-2" aria-hidden="true" />;
        }

        if (isLatinLine(line)) {
          return (
            <span
              key={key}
              dir="ltr"
              className="block text-left font-mono text-[13px] leading-relaxed break-words"
            >
              {line}
            </span>
          );
        }

        return (
          <span key={key} className="block break-words">
            {line}
          </span>
        );
      })}
    </>
  );
}
