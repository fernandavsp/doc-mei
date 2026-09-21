import React, { useEffect, useMemo } from "react";
import { marked } from "marked";
import privacidade from "./legal/privacidade.md?raw";
import termos from "./legal/termos.md?raw";

// Para editar os textos, mexa nos arquivos em src/legal/*.md
const DOCS = {
  privacidade: { md: privacidade, title: "Política de Privacidade", other: { href: "/termos", label: "Termos de uso" } },
  termos: { md: termos, title: "Termos de Uso", other: { href: "/privacidade", label: "Política de privacidade" } },
};

// Detecta campos que ainda estão entre [COLCHETES] para preencher.
const PLACEHOLDER_RE = /\[(?:\d+|[^\]]*[A-ZÀ-Ú]{2,}[^\]]*)\]/g;

export default function Legal({ doc }) {
  const { md, title, other } = DOCS[doc];

  // O conteúdo é nosso (arquivo do projeto), por isso é seguro renderizar como HTML.
  const html = useMemo(() => marked.parse(md), [md]);

  // Só em desenvolvimento: avisa se ainda há campos para preencher.
  const pending = useMemo(
    () => (import.meta.env.DEV ? [...new Set(md.match(PLACEHOLDER_RE) || [])] : []),
    [md]
  );

  useEffect(() => {
    document.title = `${title} · Gerador de contrato MEI`;
  }, [title]);

  return (
    <div className="min-h-screen bg-[#F6F2E9]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="border-b border-[#DED5BE] px-6 md:px-10 py-5">
        <a href="/" className="text-[13px] font-medium text-[#1F3D2E] hover:underline">
          ← Voltar ao gerador de contrato
        </a>
      </header>

      <main className="max-w-[760px] mx-auto px-5 md:px-8 py-10">
        {pending.length > 0 && (
          <div className="mb-8 rounded-[4px] border border-[#E0C36A] bg-[#FBF3D5] px-4 py-3 text-[12.5px] text-[#5C4A0E]">
            <strong>Só aparece em desenvolvimento:</strong> ainda há {pending.length} campo(s)
            para preencher em <code>src/legal/{doc}.md</code>, por exemplo{" "}
            <code>{pending.slice(0, 3).join(" ")}</code>.
          </div>
        )}

        <article className="legal" dangerouslySetInnerHTML={{ __html: html }} />

        <p className="mt-12 border-t border-[#DED5BE] pt-5 text-[12.5px] text-[#8A836E]">
          <a href={other.href} className="underline hover:text-[#1F3D2E]">
            {other.label}
          </a>
        </p>
      </main>
    </div>
  );
}
