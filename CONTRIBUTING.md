# Contributing to Zenoa AI (v3)

Thank you for your interest in contributing to **Zenoa AI (v3)**!

> [!NOTE]
> This repository contains the legacy **v3.x (React Native)** codebase and is no longer the active development branch of Zenoa AI. However, bug fixes, documentation improvements, localization updates, and community forks are always welcome!

## 📜 Code of Conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 How to Contribute

1. **Fork the repository** and clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/ZenoaAI-v3.git
   cd ZenoaAI-v3
   ```
2. **Create a new branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Install dependencies** and configure `.env` using `.env.example`:
   ```bash
   npm install --force
   cp .env.example .env
   ```
4. **Make your changes** following the project's TypeScript, ESLint, and Prettier conventions.
5. **Verify your changes** before committing:
   ```bash
   npm run lint
   npm test
   ```
6. **Commit using Conventional Commits**:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring without behavior changes
   - `docs:` - Documentation updates
   - `chore:` - Build, dependency, or tooling updates
7. **Push to your fork** and open a **Pull Request** against `main` using the PR template.

## 🌐 Localization Contributions

Translation files live in `src/localization/translations/`. If you are adding or updating translations, please ensure all keys match `src/localization/translations/en.ts`.

## 🐛 Reporting Bugs & Requesting Features

- Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template for reporting issues.
- Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template for suggesting enhancements.
- For security vulnerabilities, **do not** open a public issue - please follow [SECURITY.md](SECURITY.md).
