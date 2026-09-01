async function notifyOwnerCallMeBot(record) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apikey) return false;
  const text = `Yeni randevu talebi\nKod: ${record.reference}\n${record.customer_name} · ${record.customer_phone}\n${record.vehicle_brand} ${record.vehicle_model}\n${record.services.join(' · ')}\n${record.requested_date} ${record.requested_time}`;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  return response.ok;
}

async function notifyCustomerWhatsApp(record, event = 'received') {
  if (!record.whatsapp_consent) return false;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  const templateMap = {
    received: process.env.WHATSAPP_TEMPLATE_RECEIVED,
    confirmed: process.env.WHATSAPP_TEMPLATE_CONFIRMED,
    rescheduled: process.env.WHATSAPP_TEMPLATE_RESCHEDULED,
    cancelled: process.env.WHATSAPP_TEMPLATE_CANCELLED
  };
  const template = templateMap[event];
  if (!token || !phoneNumberId || !graphVersion || !template) return false;
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: String(record.customer_phone || '').replace(/^\+/, ''),
      type: 'template',
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'tr' },
        components: [{ type: 'body', parameters: [
          { type: 'text', text: record.customer_name },
          { type: 'text', text: record.reference },
          { type: 'text', text: record.requested_date },
          { type: 'text', text: String(record.requested_time).slice(0, 5) }
        ] }]
      }
    }),
    signal: AbortSignal.timeout(9000)
  });
  return response.ok;
}

module.exports = { notifyCustomerWhatsApp, notifyOwnerCallMeBot };
