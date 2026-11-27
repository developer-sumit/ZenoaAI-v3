# Security Policy

## Supported Versions

**Zenoa AI (v3.x)** is a legacy open-source release. Active development has moved to a newer version of the application, so security updates are no longer regularly published for v3.x.

| Version | Supported |
| ------- | --------- |
| `3.7.x` | :warning: Legacy / Maintenance Only |
| `< 3.7.0` | :x: Not Supported |

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please **do not** report it through public GitHub issues, discussions, or pull requests.

Instead, please report it privately using one of the following methods:

1. **GitHub Security Advisories:** Open a private vulnerability report via the **Security** tab of this repository.
2. **Direct Contact:** Reach out to the maintainer directly via [sumitrathore.web.app](https://sumitrathore.web.app).

Please include as much detail as possible to help reproduce and assess the issue:
- Description of the vulnerability and potential impact
- Steps to reproduce or proof-of-concept
- Affected files, components, or dependencies

## Security Best Practices for Contributors & Self-Hosters

- Never commit `.env`, `.env.production`, `android/keystore.properties`, or `.keystore`/`.jks` files.
- Rotate any API keys or Firebase credentials immediately if accidentally exposed.
- Review Firebase Firestore & Storage security rules before deploying to production.
