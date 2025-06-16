const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
  try {
    const { value, name, document, email, description } = req.body;

    const response = await axios.post(
      'https://api.pushinpay.com.br/api/pix/cashIn',
      {
        description: description,
        price: value,
        buyer_name: name,
        buyer_email: email,
        buyer_document: document,
        return_url: 'https://t.me/+edEpDjMIoBlkMTYx'
      },
      {
        headers: {
          Authorization: 'Bearer 33812|N8S3myM1ojjFsC88BmEdbtmbWY4CePGSbtBeAuyr7cfd4096',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    res.json({
      pixCode: data.pix_copy_paste,
      qrCodeUrl: data.qr_code_base64,
      paymentId: data.id
    });

  } catch (error) {
    console.error('Erro ao gerar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar pagamento.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
