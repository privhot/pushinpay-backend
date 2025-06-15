const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = "33818|1nui49UuT2aJrYd6x40RZkDQgfFdMgvOzt2CoNXi54bcd297"; // seu token PushinPay

// Armazenar status no servidor em memória (pode mudar para DB em produção)
const paymentsStatus = {};

app.post("/gerar-pix", async (req, res) => {
  try {
    const { value, name, document, email, description } = req.body;

    // URL do webhook para receber notificações
    const webhookUrl = "https://pushinpay-backend.onrender.com/webhook";

    // Chamar API PushinPay
    const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        value,
        webhook_url: webhookUrl,
        split_rules: [],
        // você pode incluir outros campos se quiser (ex: name, email) se API suportar
      })
    });

    const data = await response.json();

    if (!data || !data.payload) {
      return res.status(400).json({ error: "Erro ao gerar cobrança", details: data });
    }

    // Salvar status inicial
    paymentsStatus[data.payload.payment_id] = "pending";

    // Retornar dados importantes para o frontend
    res.json({
      pixCode: data.payload.pix_code,
      qrCodeUrl: data.payload.qr_code_url,
      paymentId: data.payload.payment_id,
      value: value
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Webhook para receber atualização do status de pagamento
app.post("/webhook", (req, res) => {
  const { payment_id, status } = req.body;

  if (payment_id && status) {
    paymentsStatus[payment_id] = status;
    console.log(`Status atualizado para pagamento ${payment_id}: ${status}`);
  }
  res.sendStatus(200);
});

// Consulta status para o frontend
app.get("/payment-status/:paymentId", (req, res) => {
  const paymentId = req.params.paymentId;
  const status = paymentsStatus[paymentId] || "pending";
  res.json({ status });
});

app.get('/', (req, res) => {
  res.send('API PushinPay funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
