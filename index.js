const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
  try {
    const { value } = req.body;

    const response = await axios.post(
      'https://api.pushinpay.com.br/api/pix/cashIn',
      {
        value: value,
        webhook_url: '',
        split_rules: []
      },
      {
        headers: {
          Authorization: 'Bearer 33960|rfhrEkNOdUEy0bVGTYhplBnLs5vbhB8TuY9VWvTXc9a1adf7',
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Erro ao gerar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar pagamento.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
