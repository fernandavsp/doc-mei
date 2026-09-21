import { PASS_HOURS, EXTERNAL_REFERENCE, MP_PAYMENTS_URL } from "./_config.js";

// Consulta o pagamento direto no Mercado Pago (não precisa de banco de dados)
// e diz se o passe ainda está válido.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "server_not_configured" });
  }

  const id = String(req.query?.id || "");
  if (!/^\d{5,20}$/.test(id)) {
    return res.status(400).json({ error: "invalid_id" });
  }

  try {
    const r = await fetch(`${MP_PAYMENTS_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.status === 404) {
      return res.status(404).json({ error: "not_found" });
    }
    if (!r.ok) {
      console.error("Mercado Pago falhou ao consultar o pagamento:", r.status);
      return res.status(502).json({ error: "provider_error" });
    }

    const p = await r.json();

    // Só vale pagamento criado por este produto.
    if (p.external_reference !== EXTERNAL_REFERENCE) {
      return res.status(404).json({ error: "not_found" });
    }

    let valid = false;
    let expiresAt = null;

    if (p.status === "approved" && p.date_approved) {
      const exp = new Date(p.date_approved).getTime() + PASS_HOURS * 3600 * 1000;
      if (Number.isFinite(exp)) {
        expiresAt = new Date(exp).toISOString();
        valid = Date.now() < exp;
      }
    }

    // Reembolso e estorno mudam o status e derrubam o acesso automaticamente.
    return res.status(200).json({ status: p.status, valid, expiresAt });
  } catch (err) {
    console.error("Falha ao consultar o Mercado Pago:", err);
    return res.status(502).json({ error: "provider_error" });
  }
}
