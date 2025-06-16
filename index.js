const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ROTA PARA GERAR COBRANÇA PIX
app.post('/gerar-pix', async (req, res) => {
  try {
    const { value } = req.body;

    const response = await axios.post(
      'https://api.pushinpay.com.br/api/pix/cashIn',
      {
        value: value,
        webhook_url: 'https://seusite.com',
        split_rules: []
      },
      {
        headers: {
          Authorization: 'Bearer 33812|N8S3myM1ojjFsC88BmEdbtmbWY4CePGSbtBeAuyr7cfd4096',
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    const data = response.data;

    res.json({
      pixCode: data.pix_code || data.pixCode || '',
      qrCodeUrl: data.qr_code_base64 || data.qrCodeUrl || '',
      paymentId: data.id || ''
    });

  } catch (error) {
    console.error('Erro ao gerar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar pagamento.' });
  }
});

// ROTA PARA CONSULTAR STATUS DO PAGAMENTO
app.get('/consultar-pix/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`https://api.pushinpay.com.br/api/transactions/${id}`, {
      headers: {
        Authorization: 'Bearer 33812|N8S3myM1ojjFsC88BmEdbtmbWY4CePGSbtBeAuyr7cfd4096',
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Erro ao consultar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao consultar pagamento.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
