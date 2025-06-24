js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Escutando na porta ${PORT}`);
});
// Substitua com o webhook do seu canal Slack
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

app.use(bodyParser.json());

app.post('/monitorsefaz', async (req, res) => {
  const data = req.body;

  const componente = data?.component?.name || 'Componente desconhecido';
  const status = data?.component?.status || 'unknown';
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];

  const statusEmoji = {
    major_outage: '🔴 Major Outage',
    partial_outage: '🟠 Partial Outage',
    degraded_performance: '🟡 Degraded',
    operational: '🟢 Operational'
  };

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Alerta: ${componente}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n${statusEmoji[status] || status}`
          },
          {
            type: 'mrkdwn',
            text: `*Horário:*\n${timestamp}`
          },
          {
            type: 'mrkdwn',
            text: '*Serviço:*\nEmissão de NF-e'
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '<https://monitorsefaz.webmaniabr.com|Ver no painel>'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(SLACK_WEBHOOK_URL, payload);
    res.status(200).json({ status: 'OK', slack: response.data });
  } catch (err) {
    console.error('Erro ao enviar para o Slack:', err.message);
    res.status(500).json({ error: 'Falha ao enviar alerta' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Middleware rodando em http://localhost:${PORT}`);
});
