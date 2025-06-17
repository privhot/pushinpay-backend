const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
  try {
    const { value, description } = req.body;

    const response = await axios.post(
      'https://api.pushinpay.com.br/api/pix/cashIn',
      {
        value: value,
        webhook_url: 'https://pushinpay-backend-1.onrender.com/webhook',
        split_rules: [],
        description: description || 'Pagamento PIX'
      },
      {
        headers: {
          Authorization: 'Bearer 33960|rfhrEkNOdUEy0bVGTYhplBnLs5vbhB8TuY9VWvTXc9a1adf7',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    // Aqui garantimos que mesmo se o base64 não vier, geramos com QuickChart
    const code = data.pix_copy_paste || data.qr_code || data.pixCode;
    const qrImage = data.qr_code_base64
      ? `data:image/png;base64,${data.qr_code_base64}`
      : `https://quickchart.io/qr?text=${encodeURIComponent(code)}`;

    res.json({
      pixCode: code,
      qrCodeUrl: qrImage,
      paymentId: data.id || data.paymentId || data.hash
    });

  } catch (error) {
    console.error('Erro ao gerar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar pagamento.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
