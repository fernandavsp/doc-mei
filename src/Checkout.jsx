import React, { useEffect, useRef, useState } from "react";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { track } from "@vercel/analytics";
import { PRICE_LABEL, PASS_HOURS } from "./config.js";

const GENERIC_ERROR =
  "Não foi possível gerar o Pix agora. Tente novamente em instantes.";
const DEAD_STATUSES = ["cancelled", "rejected", "expired"];

const inputClass =
  "w-full rounded-[3px] border border-[#D9D1BC] bg-[#FFFEFB] px-3 py-2 text-[14px] text-[#232019] placeholder:text-[#B4AC96] outline-none transition focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15";

// onPaid(paymentId) deve devolver uma Promise<boolean>: true = passe ativado.
export default function Checkout({ onClose, onPaid }) {
  const [email, setEmail] = useState("");
  const [pix, setPix] = useState(null); // { id, qrCode, qrCodeBase64 }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track("checkout_aberto");
  }, []);

  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const createPix = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(
          data.error === "invalid_email"
            ? "Confira o e-mail digitado."
            : GENERIC_ERROR
        );
        return;
      }
      setPix(data);
      track("pix_criado");
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Consulta o status a cada 3 s enquanto o QR estiver na tela.
  useEffect(() => {
    if (!pix) return;
    let stopped = false;
    let busy = false;

    const tick = async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        const r = await fetch(
          `/api/pix-status?id=${encodeURIComponent(pix.id)}`,
          { cache: "no-store" }
        );
        if (!r.ok || stopped) return;
        const data = await r.json();
        if (stopped) return;

        if (data.valid) {
          const ok = await onPaidRef.current(pix.id);
          if (ok) {
            stopped = true;
            track("pix_aprovado");
          }
        } else if (DEAD_STATUSES.includes(data.status)) {
          stopped = true;
          setPix(null);
          setError("Este Pix expirou ou foi cancelado. Gere um novo.");
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      } finally {
        busy = false;
      }
    };

    const t = setInterval(tick, 3000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [pix]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pagamento por Pix"
        className="relative w-full max-w-[420px] rounded-[4px] border border-[#E4DDC9] bg-[#F6F2E9] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 text-[#6B6552] hover:text-[#232019]"
        >
          <X size={18} />
        </button>

        {!pix ? (
          <form onSubmit={createPix}>
            <h2 className="text-[17px] font-semibold text-[#1F3D2E] tracking-tight">
              Liberar contrato · {PRICE_LABEL}
            </h2>
            <ul className="mt-3 mb-5 space-y-1.5 text-[13px] text-[#3D392E]">
              <li>• Gere, copie e imprima quantos contratos precisar por {PASS_HOURS} horas</li>
              <li>• Sem marca d'água</li>
              <li>• Pix: liberação na hora</li>
            </ul>

            <label className="block mb-4">
              <span className="block text-[13px] font-medium text-[#3D392E] mb-1.5">
                Seu e-mail
              </span>
              <input
                type="email"
                required
                autoFocus
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
              <span className="block text-[11.5px] text-[#8A836E] mt-1">
                Usado apenas para processar o pagamento. Os dados do contrato
                ficam no seu navegador e não são enviados ao servidor.
              </span>
            </label>

            {error && (
              <p className="mb-3 text-[12.5px] text-[#9B2C2C]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-[3px] bg-[#1F3D2E] text-[#F6F2E9] text-[13.5px] font-medium py-2.5 hover:bg-[#18301F] transition disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Gerando Pix…" : "Gerar Pix"}
            </button>

            <p className="mt-3 text-center text-[11.5px] text-[#8A836E]">
              Ao continuar, você concorda com os{" "}
              <a href="/termos" target="_blank" rel="noopener" className="underline hover:text-[#1F3D2E]">
                Termos de uso
              </a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" rel="noopener" className="underline hover:text-[#1F3D2E]">
                Política de privacidade
              </a>
              .
            </p>
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-[17px] font-semibold text-[#1F3D2E] tracking-tight">
              Pague {PRICE_LABEL} com Pix
            </h2>
            <p className="mt-1 text-[12.5px] text-[#6B6552]">
              Abra o app do seu banco e escaneie o QR Code.
            </p>

            {pix.qrCodeBase64 && (
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR Code do Pix"
                className="mx-auto mt-4 h-52 w-52 rounded-[3px] border border-[#E4DDC9] bg-white p-2"
              />
            )}

            <button
              type="button"
              onClick={copyCode}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-[3px] border border-[#1F3D2E] text-[#1F3D2E] text-[13.5px] font-medium py-2.5 hover:bg-[#1F3D2E]/5 transition"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Código copiado" : "Copiar Pix copia e cola"}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-[12.5px] text-[#6B6552]">
              <Loader2 size={14} className="animate-spin" />
              Aguardando o pagamento… a tela libera sozinha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
