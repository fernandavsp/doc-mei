import { randomUUID } from "node:crypto";
import {
  PRICE_BRL,
  PASS_HOURS,
  EXTERNAL_REFERENCE,
  MP_PAYMENTS_URL,
} from "./_config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error("MP_ACCESS_TOKEN não configurado");
    return res.status(500).json({ error: "server_not_configured" });
  }

  const email = String(readBody(req).email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: "invalid_email" });
  }

  try {
    const r = await fetch(MP_PAYMENTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: PRICE_BRL,
        description: `Passe de ${PASS_HOURS}h - Gerador de contrato MEI`,
        payment_method_id: "pix",
        external_reference: EXTERNAL_REFERENCE,
        payer: { email },
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // O detalhe vai só para o log do servidor, nunca para o navegador.
      console.error("Mercado Pago recusou a criação do Pix:", r.status, data);
      return res.status(502).json({ error: "provider_error" });
    }

    const tx = data.point_of_interaction?.transaction_data;
    if (!data.id || !tx?.qr_code) {
      console.error("Resposta inesperada do Mercado Pago:", data);
      return res.status(502).json({ error: "provider_error" });
    }

    return res.status(200).json({
      id: String(data.id),
      qrCode: tx.qr_code, // "copia e cola"
      qrCodeBase64: tx.qr_code_base64, // imagem do QR (PNG em base64)
    });
  } catch (err) {
    console.error("Falha ao chamar o Mercado Pago:", err);
    return res.status(502).json({ error: "provider_error" });
  }
}
