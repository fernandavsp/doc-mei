import React, { useState, useMemo, useRef } from "react";
import { FileText, Copy, Printer, Check, Plus, Minus, Lock } from "lucide-react";
import Checkout from "./Checkout.jsx";
import { usePass } from "./usePass.js";
import { PRICE_LABEL, PASS_HOURS } from "./config.js";

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
`;

function toBRL(value) {
  const n = parseFloat(String(value).replace(",", "."));
  if (isNaN(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toBRDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

const initialState = {
  contratanteNome: "",
  contratanteDoc: "",
  contratanteEndereco: "",
  contratadoNome: "",
  contratadoCnpj: "",
  contratadoEndereco: "",
  objeto: "",
  valor: "",
  formaPagamento: "",
  prazoInicio: "",
  prazoFim: "",
  cidade: "",
  dataAssinatura: "",
  multa: true,
  multaPercentual: "2",
  jurosPercentual: "1",
  confidencialidade: false,
  propriedade: false,
  rescisao: true,
  avisoPrevio: "15",
  lgpd: false,
  testemunhas: false,
};

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-[13px] font-medium text-[#3D392E] mb-1.5 tracking-tight">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11.5px] text-[#8A836E] mt-1">{hint}</span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-[3px] border border-[#D9D1BC] bg-[#FFFEFB] px-3 py-2 text-[14px] text-[#232019] placeholder:text-[#B4AC96] outline-none transition focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15";

function Toggle({ checked, onChange, label, children }) {
  return (
    <div className="border border-[#E4DDC9] rounded-[4px] bg-[#FFFEFB] mb-3 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left"
      >
        <span className="text-[13.5px] font-medium text-[#232019]">{label}</span>
        <span
          className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ml-3 ${
            checked ? "bg-[#1F3D2E]" : "bg-[#DCD5C0]"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>
      {checked && children && (
        <div className="px-3.5 pb-3.5 pt-0 flex gap-3">{children}</div>
      )}
    </div>
  );
}

export default function ContractGenerator() {
  const [f, setF] = useState(initialState);
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);
  const { unlocked, expiresAt, activate } = usePass();
  const [showCheckout, setShowCheckout] = useState(false);

  const handlePaid = async (paymentId) => {
    const ok = await activate(paymentId);
    if (ok) setShowCheckout(false);
    return ok;
  };

  const set = (key) => (e) =>
    setF((prev) => ({
      ...prev,
      [key]: e && e.target ? e.target.value : e,
    }));

  const clauses = useMemo(() => {
    const list = [];

    list.push({
      title: "DO OBJETO",
      body: `O presente contrato tem como objeto a prestação, pelo CONTRATADO ao CONTRATANTE, dos seguintes serviços: ${
        f.objeto || "[descrever o serviço a ser prestado]"
      }.`,
    });

    list.push({
      title: "DO VALOR E DA FORMA DE PAGAMENTO",
      body: `Pelos serviços descritos na cláusula anterior, o CONTRATANTE pagará ao CONTRATADO o valor total de ${
        toBRL(f.valor) || "[valor]"
      }, a ser pago da seguinte forma: ${
        f.formaPagamento || "[forma de pagamento]"
      }.`,
    });

    const inicio = toBRDate(f.prazoInicio);
    const fim = toBRDate(f.prazoFim);
    list.push({
      title: "DO PRAZO",
      body:
        inicio && fim
          ? `Os serviços objeto deste contrato serão executados no período de ${inicio} a ${fim}, podendo ser prorrogado mediante acordo entre as partes.`
          : `Os serviços objeto deste contrato serão executados no prazo acordado entre as partes, podendo ser prorrogado mediante acordo entre ambas.`,
    });

    list.push({
      title: "DAS OBRIGAÇÕES DO CONTRATADO",
      body: "O CONTRATADO se compromete a executar os serviços com zelo, diligência e qualidade técnica, dentro do prazo estabelecido, comunicando ao CONTRATANTE, com antecedência razoável, eventuais imprevistos que possam impactar a entrega.",
    });

    list.push({
      title: "DAS OBRIGAÇÕES DO CONTRATANTE",
      body: "O CONTRATANTE se compromete a fornecer as informações, materiais e acessos necessários à execução dos serviços, bem como a efetuar os pagamentos nas condições e prazos ora acordados.",
    });

    if (f.multa) {
      list.push({
        title: "DA MULTA E DOS JUROS POR ATRASO",
        body: `Em caso de atraso no pagamento, incidirá multa de ${
          f.multaPercentual || "2"
        }% sobre o valor devido, acrescida de juros de mora de ${
          f.jurosPercentual || "1"
        }% ao mês, calculados pro rata die até a data da efetiva quitação.`,
      });
    }

    if (f.confidencialidade) {
      list.push({
        title: "DA CONFIDENCIALIDADE",
        body: "As partes comprometem-se a manter sigilo sobre quaisquer informações confidenciais a que tenham acesso em razão deste contrato, não as divulgando a terceiros sem autorização prévia e por escrito da outra parte, mesmo após o encerramento deste instrumento.",
      });
    }

    if (f.propriedade) {
      list.push({
        title: "DA PROPRIEDADE INTELECTUAL",
        body: "Os direitos autorais e de propriedade intelectual sobre os materiais e entregáveis produzidos em decorrência deste contrato serão transferidos ao CONTRATANTE mediante a quitação integral do valor acordado, ressalvado ao CONTRATADO o direito de citar o trabalho em seu portfólio, salvo disposição em contrário.",
      });
    }

    if (f.rescisao) {
      list.push({
        title: "DA RESCISÃO",
        body: `O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio, por escrito, de ${
          f.avisoPrevio || "15"
        } dias, ficando assegurado o pagamento proporcional pelos serviços já prestados até a data da rescisão.`,
      });
    }

    if (f.lgpd) {
      list.push({
        title: "DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)",
        body: "As partes comprometem-se a tratar quaisquer dados pessoais aos quais tenham acesso em razão deste contrato em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), utilizando-os exclusivamente para a execução do objeto contratado, adotando medidas técnicas e administrativas razoáveis para sua segurança e eliminando-os ao término da relação contratual, salvo obrigação legal de retenção.",
      });
    }

    list.push({
      title: "DO FORO",
      body: `Fica eleito o foro da comarca de ${
        f.cidade || "[cidade/UF]"
      } para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
    });

    return list;
  }, [f]);

  const plainText = useMemo(() => {
    const lines = [];
    lines.push("CONTRATO DE PRESTAÇÃO DE SERVIÇOS");
    lines.push("");
    lines.push(
      `Pelo presente instrumento particular, de um lado ${
        f.contratanteNome || "[nome do contratante]"
      }, portador(a) do CPF/CNPJ nº ${
        f.contratanteDoc || "[documento]"
      }, com endereço em ${
        f.contratanteEndereco || "[endereço]"
      }, doravante denominado CONTRATANTE; e de outro lado ${
        f.contratadoNome || "[nome do MEI]"
      }, inscrito no CNPJ sob o nº ${
        f.contratadoCnpj || "[CNPJ do MEI]"
      }, com endereço em ${
        f.contratadoEndereco || "[endereço]"
      }, doravante denominado CONTRATADO, têm entre si justo e acordado o presente contrato, que se regerá pelas cláusulas seguintes:`
    );
    lines.push("");
    clauses.forEach((c, i) => {
      lines.push(`CLÁUSULA ${i + 1}ª – ${c.title}`);
      lines.push(c.body);
      lines.push("");
    });
    lines.push(
      "E por estarem assim justas e contratadas, as partes firmam o presente instrumento em duas vias de igual teor e forma."
    );
    lines.push("");
    lines.push(
      `${f.cidade || "[cidade]"}, ${toBRDate(f.dataAssinatura) || "[data]"}.`
    );
    lines.push("");
    lines.push("_________________________________");
    lines.push(`${f.contratanteNome || "CONTRATANTE"}`);
    lines.push("");
    lines.push("_________________________________");
    lines.push(`${f.contratadoNome || "CONTRATADO"}`);
    if (f.testemunhas) {
      lines.push("");
      lines.push("_________________________________        _________________________________");
      lines.push("Testemunha 1 — CPF                                    Testemunha 2 — CPF");
    }
    return lines.join("\n");
  }, [f, clauses]);

  const handleCopy = async () => {
    if (!unlocked) {
      setShowCheckout(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      // ignore
    }
  };

  const handlePrint = () => {
    if (!unlocked) {
      setShowCheckout(true);
      return;
    }
    window.print();
  };

  return (
    <div
      className={`w-full min-h-screen bg-[#F6F2E9] ${unlocked ? "" : "locked"}`}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          body { background: white !important; }
          /* Sem passe ativo, Ctrl+P não imprime o contrato */
          .locked .print-area { display: none !important; }
          .locked .print-locked-msg { display: block !important; }
        }
        .doc-serif { font-family: 'Source Serif 4', Georgia, serif; }
        .watermark {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' transform='rotate(-25 160 100)' font-family='Arial' font-size='26' font-weight='700' fill='rgba(31,61,46,0.10)'%3EPR%C3%89VIA%3C/text%3E%3C/svg%3E");
        }
      `}</style>

      <header className="no-print border-b border-[#DED5BE] px-6 md:px-10 py-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full border-2 border-[#1F3D2E] flex items-center justify-center shrink-0">
          <FileText size={18} color="#1F3D2E" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-[19px] font-semibold text-[#1F3D2E] leading-tight tracking-tight">
            Gerador de contrato · MEI
          </h1>
          <p className="text-[13px] text-[#6B6552] mt-0.5">
            Prestação de serviços entre microempreendedor individual e cliente
          </p>
        </div>
      </header>

      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        {/* FORM */}
        <div className="no-print">
          <Section title="As partes">
            <Field label="Nome ou razão social do cliente (contratante)">
              <input className={inputClass} value={f.contratanteNome} onChange={set("contratanteNome")} placeholder="Ex.: Ana Paula Ferreira" />
            </Field>
            <Field label="CPF ou CNPJ do cliente">
              <input className={inputClass} value={f.contratanteDoc} onChange={set("contratanteDoc")} placeholder="000.000.000-00" />
            </Field>
            <Field label="Endereço do cliente">
              <input className={inputClass} value={f.contratanteEndereco} onChange={set("contratanteEndereco")} placeholder="Rua, número, bairro, cidade/UF" />
            </Field>
            <div className="h-px bg-[#E4DDC9] my-4" />
            <Field label="Seu nome (ou nome fantasia do MEI)">
              <input className={inputClass} value={f.contratadoNome} onChange={set("contratadoNome")} placeholder="Ex.: João Silva Serviços Digitais" />
            </Field>
            <Field label="CNPJ do MEI">
              <input className={inputClass} value={f.contratadoCnpj} onChange={set("contratadoCnpj")} placeholder="00.000.000/0001-00" />
            </Field>
            <Field label="Seu endereço">
              <input className={inputClass} value={f.contratadoEndereco} onChange={set("contratadoEndereco")} placeholder="Rua, número, bairro, cidade/UF" />
            </Field>
          </Section>

          <Section title="Serviço e pagamento">
            <Field label="Descrição do serviço prestado">
              <textarea rows={3} className={inputClass} value={f.objeto} onChange={set("objeto")} placeholder="Ex.: criação e desenvolvimento de site institucional, incluindo três páginas e formulário de contato" />
            </Field>
            <Field label="Valor total (R$)">
              <input className={inputClass} value={f.valor} onChange={set("valor")} placeholder="1500" inputMode="decimal" />
            </Field>
            <Field label="Forma de pagamento">
              <input className={inputClass} value={f.formaPagamento} onChange={set("formaPagamento")} placeholder="Ex.: 50% na assinatura e 50% na entrega, via Pix" />
            </Field>
          </Section>

          <Section title="Prazo">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <input type="date" className={inputClass} value={f.prazoInicio} onChange={set("prazoInicio")} />
              </Field>
              <Field label="Entrega">
                <input type="date" className={inputClass} value={f.prazoFim} onChange={set("prazoFim")} />
              </Field>
            </div>
          </Section>

          <Section title="Cláusulas adicionais">
            <Toggle checked={f.multa} onChange={(v) => setF((p) => ({ ...p, multa: v }))} label="Multa por atraso no pagamento">
              <Field label="Multa (%)">
                <input className={inputClass} value={f.multaPercentual} onChange={set("multaPercentual")} />
              </Field>
              <Field label="Juros ao mês (%)">
                <input className={inputClass} value={f.jurosPercentual} onChange={set("jurosPercentual")} />
              </Field>
            </Toggle>
            <Toggle checked={f.confidencialidade} onChange={(v) => setF((p) => ({ ...p, confidencialidade: v }))} label="Cláusula de confidencialidade" />
            <Toggle checked={f.propriedade} onChange={(v) => setF((p) => ({ ...p, propriedade: v }))} label="Transferência de propriedade intelectual" />
            <Toggle checked={f.rescisao} onChange={(v) => setF((p) => ({ ...p, rescisao: v }))} label="Rescisão com aviso prévio">
              <Field label="Aviso prévio (dias)">
                <input className={inputClass} value={f.avisoPrevio} onChange={set("avisoPrevio")} />
              </Field>
            </Toggle>
            <Toggle checked={f.lgpd} onChange={(v) => setF((p) => ({ ...p, lgpd: v }))} label="Proteção de dados pessoais (LGPD)" />
            <Toggle checked={f.testemunhas} onChange={(v) => setF((p) => ({ ...p, testemunhas: v }))} label="Incluir linhas para testemunhas" />
          </Section>

          <Section title="Assinatura">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade">
                <input className={inputClass} value={f.cidade} onChange={set("cidade")} placeholder="Duque de Caxias/RJ" />
              </Field>
              <Field label="Data">
                <input type="date" className={inputClass} value={f.dataAssinatura} onChange={set("dataAssinatura")} />
              </Field>
            </div>
          </Section>

          {unlocked ? (
            <>
              <div className="flex gap-2 mt-2">
                <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 rounded-[3px] border border-[#1F3D2E] text-[#1F3D2E] text-[13.5px] font-medium py-2.5 hover:bg-[#1F3D2E]/5 transition">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copiado" : "Copiar texto"}
                </button>
                <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 rounded-[3px] bg-[#1F3D2E] text-[#F6F2E9] text-[13.5px] font-medium py-2.5 hover:bg-[#18301F] transition">
                  <Printer size={15} />
                  Imprimir / salvar PDF
                </button>
              </div>
              {expiresAt && (
                <p className="text-[11.5px] text-[#8A836E] mt-2 text-center">
                  Passe ativo até{" "}
                  {new Date(expiresAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </>
          ) : (
            <div className="mt-2">
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full flex items-center justify-center gap-2 rounded-[3px] bg-[#1F3D2E] text-[#F6F2E9] text-[13.5px] font-medium py-3 hover:bg-[#18301F] transition"
              >
                <Lock size={15} />
                Liberar contrato — {PRICE_LABEL}
              </button>
              <p className="text-[11.5px] text-[#8A836E] mt-2 text-center">
                Pix, liberação na hora. Vale por {PASS_HOURS}h: gere e imprima
                quantos contratos precisar.
              </p>
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <div>
          <p className="print-locked-msg hidden text-center text-[14px] py-10">
            Libere o contrato para imprimir.
          </p>
          <div
            ref={printRef}
            onCopy={unlocked ? undefined : (e) => e.preventDefault()}
            className={`print-area relative bg-[#FFFEFB] border border-[#E4DDC9] shadow-[0_1px_3px_rgba(0,0,0,0.06)] rounded-[2px] px-8 md:px-14 py-12 max-w-[760px] mx-auto ${
              unlocked ? "" : "select-none"
            }`}
          >
            {!unlocked && <div className="watermark no-print" aria-hidden="true" />}
            <h2 className="doc-serif text-[20px] font-bold text-center tracking-wide text-[#232019] mb-8">
              CONTRATO DE PRESTAÇÃO DE SERVIÇOS
            </h2>

            <p className="doc-serif text-[14.5px] leading-[1.75] text-[#232019] text-justify mb-6">
              Pelo presente instrumento particular, de um lado{" "}
              <strong>{f.contratanteNome || "[nome do contratante]"}</strong>, portador(a) do
              CPF/CNPJ nº <strong>{f.contratanteDoc || "[documento]"}</strong>, com endereço em{" "}
              {f.contratanteEndereco || "[endereço]"}, doravante denominado{" "}
              <strong>CONTRATANTE</strong>; e de outro lado{" "}
              <strong>{f.contratadoNome || "[nome do MEI]"}</strong>, inscrito no CNPJ sob o nº{" "}
              <strong>{f.contratadoCnpj || "[CNPJ do MEI]"}</strong>, com endereço em{" "}
              {f.contratadoEndereco || "[endereço]"}, doravante denominado{" "}
              <strong>CONTRATADO</strong>, têm entre si justo e acordado o presente contrato, que
              se regerá pelas cláusulas seguintes:
            </p>

            {clauses.map((c, i) => (
              <div key={i} className="mb-5">
                <p className="doc-serif text-[13.5px] font-bold tracking-wide text-[#1F3D2E] mb-1.5">
                  CLÁUSULA {i + 1}ª – {c.title}
                </p>
                <p className="doc-serif text-[14.5px] leading-[1.75] text-[#232019] text-justify">
                  {c.body}
                </p>
              </div>
            ))}

            <p className="doc-serif text-[14.5px] leading-[1.75] text-[#232019] text-justify mt-8 mb-10">
              E por estarem assim justas e contratadas, as partes firmam o presente instrumento
              em duas vias de igual teor e forma.
            </p>

            <p className="doc-serif text-[14.5px] text-center text-[#232019] mb-14">
              {f.cidade || "[cidade]"}, {toBRDate(f.dataAssinatura) || "[data]"}.
            </p>

            <div className="grid grid-cols-1 gap-10 max-w-[420px] mx-auto text-center">
              <div>
                <div className="border-t border-[#232019] pt-2">
                  <p className="doc-serif text-[13.5px] text-[#232019]">
                    {f.contratanteNome || "CONTRATANTE"}
                  </p>
                </div>
              </div>
              <div>
                <div className="border-t border-[#232019] pt-2">
                  <p className="doc-serif text-[13.5px] text-[#232019]">
                    {f.contratadoNome || "CONTRATADO"}
                  </p>
                </div>
              </div>
              {f.testemunhas && (
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="border-t border-[#232019] pt-2">
                    <p className="doc-serif text-[12px] text-[#232019]">Testemunha 1 — CPF</p>
                  </div>
                  <div className="border-t border-[#232019] pt-2">
                    <p className="doc-serif text-[12px] text-[#232019]">Testemunha 2 — CPF</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="no-print text-center text-[12px] text-[#8A836E] mt-4 max-w-[760px] mx-auto">
            Modelo de referência — recomenda-se revisão por um advogado antes do uso, especialmente para contratos de maior valor ou complexidade.
          </p>
        </div>
      </div>

      <footer className="no-print border-t border-[#DED5BE] px-6 md:px-10 py-6 text-center text-[12px] text-[#8A836E]">
        {/* Abrem em nova aba para ninguém perder o formulário preenchido */}
        <a href="/termos" target="_blank" rel="noopener" className="underline hover:text-[#1F3D2E]">
          Termos de uso
        </a>
        <span className="mx-2">·</span>
        <a href="/privacidade" target="_blank" rel="noopener" className="underline hover:text-[#1F3D2E]">
          Política de privacidade
        </a>
      </footer>

      {showCheckout && (
        <Checkout onClose={() => setShowCheckout(false)} onPaid={handlePaid} />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h3 className="text-[12.5px] font-semibold text-[#6B6552] mb-3 tracking-tight">
        {title}
      </h3>
      {children}
    </div>
  );
}
