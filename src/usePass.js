import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mei_pass_payment_id";

// Em desenvolvimento (npm run dev, sem a API rodando) dá para liberar tudo
// com VITE_DEV_UNLOCK=true em .env.local. Nunca vale em produção.
const DEV_UNLOCK =
  import.meta.env.DEV && import.meta.env.VITE_DEV_UNLOCK === "true";

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function writeStored(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function verify(paymentId) {
  try {
    const r = await fetch(
      `/api/pix-status?id=${encodeURIComponent(paymentId)}`,
      { cache: "no-store" }
    );
    if (!r.ok) return { ok: false, data: null };
    return { ok: true, data: await r.json() };
  } catch {
    return { ok: false, data: null };
  }
}

export function usePass() {
  const [pass, setPass] = useState(null); // { expiresAt: number (ms) }

  // Chamado depois que o Pix é pago. Devolve true se o passe foi ativado.
  const activate = useCallback(async (paymentId) => {
    const { data } = await verify(paymentId);
    if (data?.valid) {
      writeStored(paymentId);
      setPass({ expiresAt: new Date(data.expiresAt).getTime() });
      return true;
    }
    return false;
  }, []);

  // Ao abrir o site, revalida no servidor um passe guardado neste navegador.
  useEffect(() => {
    const id = readStored();
    if (!id) return;
    verify(id).then(({ ok, data }) => {
      if (!ok) return; // sem rede: não apaga, tenta de novo na próxima visita
      if (data?.valid) {
        setPass({ expiresAt: new Date(data.expiresAt).getTime() });
      } else {
        clearStored();
      }
    });
  }, []);

  // Bloqueia de novo quando o passe vence.
  useEffect(() => {
    if (!pass) return;
    const ms = pass.expiresAt - Date.now();
    if (ms <= 0) {
      setPass(null);
      clearStored();
      return;
    }
    const t = setTimeout(() => {
      setPass(null);
      clearStored();
    }, Math.min(ms, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [pass]);

  return {
    unlocked: DEV_UNLOCK || !!pass,
    expiresAt: pass?.expiresAt ?? null,
    activate,
  };
}
