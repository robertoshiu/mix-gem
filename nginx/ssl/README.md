# SSL Certificates Directory

This directory contains SSL/TLS certificates for the Nginx reverse proxy.

## Self-Signed Certificates (Development)

Generate self-signed certificates for development/testing:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Let's Encrypt (Production)

For production, use Certbot with Let's Encrypt:

```bash
docker-compose -f docker-compose.prod.yml --profile gateway up certbot
```

Certificates will be automatically placed in:
- `/etc/letsencrypt/live/your-domain/fullchain.pem` -> `cert.pem`
- `/etc/letsencrypt/live/your-domain/privkey.pem` -> `key.pem`

## DH Parameters (Optional)

Generate Diffie-Hellman parameters for enhanced security:

```bash
openssl dhparam -out dhparam.pem 2048
```

Then uncomment the `ssl_dhparam` line in `nginx/conf.d/ssl.conf`.

## File Permissions

Ensure proper permissions for security:

```bash
chmod 600 key.pem
chmod 644 cert.pem
```
