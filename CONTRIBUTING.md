# Contributing to PM-Web V2

Thank you for taking the time to contribute to PM-Web V2!

## Getting Started

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Clone & Install**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pm-web_v2.git
   cd pm-web_v2
   pnpm install
   ```
3. **Environment Configuration**:
   Create `.env.local` based on `.env.example`.

## Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Run code formatting: `pnpm format`
3. Check linting: `pnpm lint`
4. Verify database schema changes: `pnpm db:push`
5. Submit a detailed Pull Request.

## Coding Guidelines

- Write clear, modern TypeScript code.
- Ensure components align with Tailwind CSS v4 and React Bits standards.
- Maintain accessible semantic HTML structure.
