"use client";

import { normalizeContentForRenderer } from "@/lib/course-content";

type FormattedContentItem = {
  content: string;
  type:
    | "checklist"
    | "example"
    | "highlight"
    | "list"
    | "main-title"
    | "paragraph"
    | "section-title"
    | "subsection-title";
  checked?: boolean;
};

function buildFormattedContent(readingContent: string): FormattedContentItem[] {
  const lines = readingContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index, allLines) => {
    const checklistMatch = line.match(/^\[([\sxX])\]\s*(.+)$/);
    if (checklistMatch) {
      return {
        checked: checklistMatch[1].toLowerCase() === "x",
        content: checklistMatch[2].trim(),
        type: "checklist",
      } satisfies FormattedContentItem;
    }

    if (
      /^(Introducción|Introduccion|Cuerpo|Cierre|Conclusión|Conclusion|Resumen):?$/iu.test(
        line
      )
    ) {
      return {
        content: line.replace(/:$/, ""),
        type: "main-title",
      } satisfies FormattedContentItem;
    }

    if (/^(\d+)[.)]\s+(.+)$/u.test(line) && line.length < 120) {
      return {
        content: line,
        type: "subsection-title",
      } satisfies FormattedContentItem;
    }

    if (
      line.length < 90 &&
      /^[A-ZÁÉÍÓÚÑ][^.!?]*$/u.test(line) &&
      !line.includes(":") &&
      index < allLines.length - 1 &&
      (allLines[index + 1]?.length || 0) > 50
    ) {
      return {
        content: line,
        type: "section-title",
      } satisfies FormattedContentItem;
    }

    if (/^Ejemplos?:?/iu.test(line) || /por ejemplo/iu.test(line)) {
      return {
        content: line,
        type: "example",
      } satisfies FormattedContentItem;
    }

    if ((line.startsWith('"') && line.endsWith('"')) || (line.startsWith("'") && line.endsWith("'"))) {
      return {
        content: line.slice(1, -1),
        type: "highlight",
      } satisfies FormattedContentItem;
    }

    if (/^[-*•]\s+/u.test(line)) {
      return {
        content: line.replace(/^[-*•]\s+/u, ""),
        type: "list",
      } satisfies FormattedContentItem;
    }

    return {
      content: line,
      type: "paragraph",
    } satisfies FormattedContentItem;
  });
}

function StaticChecklistItem({
  checked,
  content,
}: {
  checked: boolean;
  content: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#10161D]">
      <span
        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold ${
          checked
            ? "border-[#0A2540] bg-[#0A2540] text-white dark:border-[#00D4B3] dark:bg-[#00D4B3] dark:text-[#08141F]"
            : "border-gray-300 text-transparent dark:border-white/20"
        }`}
      >
        ✓
      </span>
      <p
        className={`text-base leading-relaxed ${
          checked
            ? "text-gray-500 line-through dark:text-white/55"
            : "text-gray-800 dark:text-white"
        }`}
      >
        {content}
      </p>
    </div>
  );
}

export function FormattedContentRenderer({
  content,
  activityId: _activityId,
}: {
  content: unknown;
  activityId?: string;
}) {
  const readingContent = normalizeContentForRenderer(content);

  if (!readingContent.trim()) {
    return null;
  }

  if (/<[a-z][\s\S]*>/i.test(readingContent)) {
    return (
      <div className="rounded-xl border border-[#E9ECEF] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#10161D]">
        <article
          className="prose prose-slate max-w-none overflow-x-auto text-[#0A2540] dark:prose-invert dark:text-white [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-3 dark:[&_td]:border-white/10 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-3 [&_th]:text-left dark:[&_th]:border-white/20 dark:[&_th]:bg-white/10"
          dangerouslySetInnerHTML={{ __html: readingContent }}
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
        />
      </div>
    );
  }

  const formattedContent = buildFormattedContent(readingContent);

  return (
    <div className="rounded-xl border border-[#E9ECEF] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#10161D]">
      <article className="space-y-5">
        {formattedContent.map((item, index) => {
          if (item.type === "main-title") {
            return (
              <h1
                key={`item-${index}`}
                className="border-b border-[#0A2540]/15 pb-3 text-3xl font-bold text-[#0A2540] dark:border-[#00D4B3]/20 dark:text-white"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
              >
                {item.content}
              </h1>
            );
          }

          if (item.type === "section-title") {
            return (
              <h2
                key={`item-${index}`}
                className="text-2xl font-bold text-[#0A2540] dark:text-white"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
              >
                {item.content}
              </h2>
            );
          }

          if (item.type === "subsection-title") {
            const match = item.content.match(/^(\d+)[.)]\s+(.+)$/u);

            return (
              <div
                key={`item-${index}`}
                className="flex items-center gap-3 text-[#0A2540] dark:text-[#D6FFF8]"
              >
                {match ? (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A2540]/20 bg-[#0A2540]/5 text-lg font-bold dark:border-[#00D4B3]/25 dark:bg-[#00D4B3]/10 dark:text-[#00D4B3]">
                      {match[1]}
                    </span>
                    <h3 className="text-xl font-semibold">{match[2]}</h3>
                  </>
                ) : (
                  <h3 className="text-xl font-semibold">{item.content}</h3>
                )}
              </div>
            );
          }

          if (item.type === "example") {
            return (
              <div
                key={`item-${index}`}
                className="rounded-xl border-l-4 border-[#0A2540]/30 bg-[#F5F8FC] px-4 py-3 dark:border-[#00D4B3]/35 dark:bg-[#0B1A20]"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-[#0A2540] dark:text-[#98F5E4]">
                  Ejemplo
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-white/80">
                  {item.content}
                </p>
              </div>
            );
          }

          if (item.type === "highlight") {
            return (
              <div
                key={`item-${index}`}
                className="rounded-xl border border-[#F3D98B] bg-[#FFF7DA] px-4 py-3 dark:border-[#8A6D1F]/50 dark:bg-[#2B2410]"
              >
                <p className="text-lg italic leading-relaxed text-[#5B4A18] dark:text-[#F7E7A8]">
                  {item.content}
                </p>
              </div>
            );
          }

          if (item.type === "checklist") {
            return (
              <StaticChecklistItem
                key={`item-${index}`}
                checked={item.checked === true}
                content={item.content}
              />
            );
          }

          if (item.type === "list") {
            return (
              <div key={`item-${index}`} className="flex items-start gap-3">
                <span className="mt-1 text-lg font-bold text-[#0A2540] dark:text-[#00D4B3]">
                  -
                </span>
                <p className="flex-1 text-base leading-relaxed text-[#0A2540] dark:text-white">
                  {item.content}
                </p>
              </div>
            );
          }

          return (
            <p
              key={`item-${index}`}
              className="text-base leading-[1.9] text-[#0A2540] dark:text-white"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
            >
              {item.content}
            </p>
          );
        })}
      </article>
    </div>
  );
}
