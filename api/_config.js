// Configuração compartilhada das funções de API.
// Arquivos que começam com "_" não viram rotas na Vercel.

// Valor cobrado. É definido AQUI (servidor), nunca pelo navegador.
// Para testar com valor baixo, defina PRICE_BRL=1 nas variáveis de ambiente.
export const PRICE_BRL = Number(process.env.PRICE_BRL || 9.9);

// Por quantas horas o pagamento libera o gerador.
export const PASS_HOURS = 24;

// Marca que identifica os pagamentos deste produto no Mercado Pago.
export const EXTERNAL_REFERENCE = "gerador-contrato-mei";

export const MP_PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";
