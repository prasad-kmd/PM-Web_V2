# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

If you discover a potential security vulnerability within PM-Web V2, please report it immediately by opening a private security disclosure or reaching out directly to the maintainers.

Please do not disclose security vulnerabilities publicly until they have been addressed and patched.

### Security Architecture Highlights

- **Stateless OAuth**: Signed cookie JWT session caching prevents cookie manipulation.
- **CSRF Protection**: Trusted origins validation in BetterAuth.
- **Content Security Policy**: Profile images strictly restricted to OAuth provider domains (GitHub) to prevent third-party tracking or exploits.
