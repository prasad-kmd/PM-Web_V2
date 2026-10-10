# Contact form setup

The `/contact` page submits messages to a configured Telegram chat. The route validates input, compares same-origin request metadata when available, checks Cloudflare Turnstile, applies an in-memory rate limit, and sends plain-text fields through the Telegram Bot API. It does not store submissions in the application's database or Notion. Do not ask visitors to send passwords, payment details, or other sensitive information through the form.

## Configure Cloudflare Turnstile

1. Create a Turnstile widget in Cloudflare and allow the production hostname (and any intended test hostname).
2. Copy the site key and secret key into the host environment.
3. For local development, the code uses Cloudflare's published test keys when no keys are configured and `NODE_ENV` is not `production`. Never rely on test keys in production.

The site key is public and named `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the secret key must remain server-side as `TURNSTILE_SECRET_KEY`. The public key is embedded at build time, so rebuild after changing it.

## Configure Telegram delivery

1. Create a Telegram bot with BotFather and copy its token.
2. Add the bot to a private chat or group that should receive contact messages, with the minimum permissions it needs.
3. Obtain the destination chat ID and set it in `TELEGRAM_CHAT_ID`.
4. Set the bot token in `TELEGRAM_TOKEN`.

Never put the bot token in a `NEXT_PUBLIC_*` variable, source file, issue, screenshot, or client request. Rotate it if it is exposed. Restrict access to the receiving chat because form submissions include the sender's name, email, optional phone number, and message.

## Environment values

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_public_site_key
TURNSTILE_SECRET_KEY=your_server_secret_key
TELEGRAM_TOKEN=your_server_bot_token
TELEGRAM_CHAT_ID=your_private_chat_id
```

Set the values in `.env.local` locally and in the host's encrypted environment configuration in production. `docs/comments.env.example` includes the shared Turnstile variables used by guest comments; merge the values into your existing environment file rather than replacing it.

## Validation and limits

- The server checks same-origin request metadata, a hidden honeypot, Turnstile, email format, disposable-email domains, and inappropriate language.
- The in-memory contact limiter allows 3 submissions per IP per 60 seconds per running server instance. It is not a globally coordinated or durable quota.
- Optional attachments are limited to PDF, PNG, JPEG, or plain text and to 8 MB. The entire request is limited to 10 MB.
- If the message is delivered but attachment delivery fails, the visitor receives a warning and should send the file separately.

## Troubleshooting

- **Contact form is not configured:** confirm both Telegram variables exist in the server runtime and redeploy/restart.
- **Turnstile fails in production:** verify the secret matches the public site key and the widget permits the deployed hostname.
- **Telegram delivery fails:** confirm the bot token, chat ID, and that the bot can send to the receiving chat. Check server logs without logging visitor message contents.
- **The form remains disabled:** verify the public Turnstile key is present in the client build and rebuild after changing it.
