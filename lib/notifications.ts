export async function sendAlertEmailNotification(payload: {
  subject: string;
  message: string;
  recipients: string[];
}) {
  if (!process.env.ALERT_EMAIL_WEBHOOK_URL) {
    return {
      mode: "demo",
      delivered: false
    };
  }

  const response = await fetch(process.env.ALERT_EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return {
    mode: "webhook",
    delivered: response.ok
  };
}
