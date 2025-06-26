const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const formatStatus = (status) => {
  const statusMap = {
    OPERATIONAL: "🟢 *Operacional*",
    UNDERMAINTENANCE: "🛠️ *Em manutenção*",
    DEGRADEDPERFORMANCE: "🟡 *Desempenho degradado*",
    PARTIALOUTAGE: "🟠 *Indisponibilidade parcial*",
    MAJOROUTAGE: "🔴 *Indisponível*",
    INVESTIGATING: "🔍 *Investigando*",
    IDENTIFIED: "📌 *Problema identificado*",
    MONITORING: "🔎 *Monitorando*",
    RESOLVED: "✅ *Resolvido*",
    NOTSTARTEDYET: "⏳ *Aguardando início*",
    INPROGRESS: "🔧 *Em andamento*",
    COMPLETED: "✅ *Concluído*"
  };
  return statusMap[status] || `⚪ *Status desconhecido (${status})*`;
};

app.post("/monitorsefaz", async (req, res) => {
  const data = req.body;
  console.log("Recebido:", JSON.stringify(data, null, 2));

  let title = ":rotating_light: *Alerta do Monitor Sefaz*";
  let corpo = "";

  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

  if (data.incident) {
    const incident = data.incident;
    const status = formatStatus(incident.status);
    const impact = incident.impact || "Não informado";
    const update = incident.incident_updates?.[0]?.body || "Sem detalhes.";

    title = `🚨 *${incident.name || "Incidente sem nome"}*`;
    corpo = `*📊 Impacto:* ${impact}\n*📍 Status:* ${status}\n*🕒 Atualizado:* ${timestamp}\n\n${update}`;
  } else if (data.maintenance) {
    const maintenance = data.maintenance;
    const status = formatStatus(maintenance.status);
    const duracao = maintenance.duration || "Não informada";
    const update = maintenance.maintenance_updates?.[0]?.body || "Sem detalhes.";

    title = `🛠️ *${maintenance.name || "Manutenção programada"}*`;
    corpo = `*⏳ Duração estimada:* ${duracao}\n*📍 Status:* ${status}\n*🕒 Atualizado:* ${timestamp}\n\n${update}`;
  } else if (data.component && data.component_update) {
    const componente = data.component.name || "Componente desconhecido";
    const status = formatStatus(data.component_update.new_status);

    title = `📦 *Atualização de componente:* ${componente}`;
    corpo = `*📍 Novo status:* ${status}\n*🕒 Atualizado:* ${timestamp}`;
  } else {
    title = `ℹ️ *Notificação não reconhecida*`;
    corpo = `Conteúdo do payload:\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``;
  }

  const payload = {
    text: `${title}\n\n${corpo}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n🔗 *Verifique no painel:* ${data.page?.url || "https://monitorsefaz.webmaniabr.com"}`
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, payload);
    res.status(200).json({ status: "Enviado para Slack com sucesso." });
  } catch (err) {
    console.error("Erro ao enviar para Slack:", err.message);
    res.status(500).json({ error: "Falha ao enviar alerta" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

