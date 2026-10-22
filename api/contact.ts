import { ContactFormSchema } from '../src/lib/schemas.ts';

interface ServerlessRequest {
  method?: string;
  body: unknown;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const parsed = ContactFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message || 'Invalid message payload',
    });
  }

  const { name, email, artistOrLabel, serviceType, budgetRange, message, honeypot } =
    parsed.data;

  // Honeypot spam guard
  if (honeypot && honeypot.trim().length > 0) {
    return res.json({
      ok: true,
      referenceId: `DM-BOT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return res.status(503).json({
      ok: false,
      error: 'Online booking delivery is unavailable. Please use direct email.',
    });
  }

  const referenceId = `DM-${Date.now().toString(36).toUpperCase()}`;
  const contactEmail = process.env.CONTACT_EMAIL?.trim() || 'menny@directormenny.com';

  try {
    const delivery = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DM OS Booking <menny@directormenny.com>',
        to: [contactEmail],
        reply_to: email,
        subject: `[DM OS Inquiry ${referenceId}] ${serviceType} — ${name}`,
        text: `Reference: ${referenceId}\nFrom: ${name} (${email})\nArtist/Label: ${artistOrLabel}\nService: ${serviceType}\nBudget: ${budgetRange}\n\nBrief:\n${message}`,
      }),
    });

    if (!delivery.ok) {
      return res.status(502).json({
        ok: false,
        error: 'Your inquiry could not be delivered. Please use direct email.',
      });
    }
  } catch {
    return res.status(502).json({
      ok: false,
      error: 'Delivery network error. Please use direct email.',
    });
  }

  return res.json({
    ok: true,
    referenceId,
    timestamp: new Date().toISOString(),
  });
}
