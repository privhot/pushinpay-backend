const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Opcional: para token no .env

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// IDs das contas na PushInPay (atualizados!)
const CONTA_PRINCIPAL_ID = '9E6B3CF6-B926-4D73-BCFF-6C2C721E2E59'; // Principal (recebe o resto)
const CONTA_SECUNDARIA_ID = '9D59972D-C784-4E0A-9B4A-412D23B3C9C0'; // TAXA (sempre R$ 0,20)

// Armazenamento temporário dos pagamentos (use Redis/DB em produção)
const pagamentos = {};

// Rota para gerar cobrança PIX com split fixo
app.post('/gerar-pix', async (req, res) => {
  try {
    const { value, description, name, cpf, email, product_id } = req.body; // Campos do frontend

    // Validação básica
    if (!value || value < 0.20) {
      return res.status(400).json({ success: false, error: 'Valor deve ser >= R$ 0,20 para split.' });
    }
    if (!name || !cpf || !email) {
      return res.status(400).json({ success: false, error: 'Dados do cliente obrigatórios.' });
    }

    // Cálculo do split: Secundária fixa em R$ 0,20 (20 centavos)
    const valorSecundariaCentavos = 20; // Fixo em centavos
    const valorTotalCentavos = Math.round(value * 100); // Converte reais para centavos (ex: 12.90 -> 1290)
    const valorPrincipalCentavos = valorTotalCentavos - valorSecundariaCentavos;

    if (valorPrincipalCentavos <= 0) {
      return res.status(400).json({ success: false, error: 'Valor muito baixo para split.' });
    }

    // Split rules: Apenas para secundária (fixa 20 centavos); principal recebe o resto auto
    const splitRules = [
      {
        value: valorSecundariaCentavos, // Em centavos (fixo)
        account_id: CONTA_SECUNDARIA_ID // ID da conta secundária
      }
    ];

    const response = await axios.post(
      'https://api.pushinpay.com.br/api/pix/cashIn',
      {
        value: value, // Total em reais
        webhook_url: 'https://pushinpay-backend-1.onrender.com/webhook',
        split_rules: splitRules, // Split aplicado aqui!
        description: description || `Pagamento Privacy - ${product_id} - ${name} (Principal: ${CONTA_PRINCIPAL_ID}, Sec: ${CONTA_SECUNDARIA_ID})`
      },
      {
        headers: {
          Authorization: 'Bearer 52168|UeUc4yiBILwOs7KQw9KTBMvikdw7xMUqOR0xeJRWdf3a9ae7', // Mova para .env em produção
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;
    const paymentId = data.id || data.paymentId || data.hash;
    pagamentos[paymentId] = 'pending';

    const code = data.pix_copy_paste || data.pixCode || data.qrCode || data.qr_code;
    let qrImage = '';
    if (data.qr_code_base64 && data.qr_code_base64.length > 100) {
      qrImage = `data:image/png;base64,${data.qr_code_base64}`;
    } else if (code) {
      qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(code)}&size=200`; // QR gerado dinamicamente
    } else {
      qrImage = null;
    }

    // Log do split para debug
    console.log(`Split aplicado [ID: ${paymentId}]: Principal (R$ ${(valorPrincipalCentavos / 100).toFixed(2)}) para ${CONTA_PRINCIPAL_ID}, Secundária (R$ 0,20) para ${CONTA_SECUNDARIA_ID}`);

    res.json({
      success: true,
      pixCode: code,
      qrCodeUrl: qrImage,
      paymentId: paymentId,
      splitDetails: { // Opcional: para frontend ou debug
        principal: {
          account: CONTA_PRINCIPAL_ID,
          value: (valorPrincipalCentavos / 100).toFixed(2)
        },
        secondary: {
          account: CONTA_SECUNDARIA_ID,
          value: 0.20
        }
      }
    });
  } catch (error) {
    console.error('Erro ao gerar pagamento com split:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Erro ao gerar pagamento. Verifique o console.' });
  }
});

// Rota para verificar o status do pagamento (mantida, com split info)
app.get('/payment-status/:id', (req, res) => {
  const { id } = req.params;
  const status = pagamentos[id];
  if (!status) {
    return res.status(404).json({ success: false, error: 'Pagamento não encontrado.' });
  }
  res.json({ 
    success: true, 
    status,
    splitInfo: 'Aplicado: Secundária R$ 0,20 fixo (ID: ' + CONTA_SECUNDARIA_ID + ')' // Opcional
  });
});

// Rota de webhook da PushInPay (mantida, com log de split)
app.post('/webhook', (req, res) => {
  const { id, status } = req.body;
  console.log(`Webhook recebido [Split Sec: ${CONTA_SECUNDARIA_ID} R$ 0,20]: ${id} = ${status}`);
  if (pagamentos[id]) {
    pagamentos[id] = status;
    // Opcional: Aqui envie email de confirmação com detalhes do split
  }
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} com split fixo (Sec: ${CONTA_SECUNDARIA_ID} = R$ 0,20)`);
});
