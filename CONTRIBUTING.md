# Contributing to Personal Link Tree

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/rraeyz/kunye_ynh.git
   cd kunye_ynh
   ```
3. **Install dependencies (Node.js 20):**
   ```bash
   npm ci --legacy-peer-deps
   ```
4. **Create the database and run the setup wizard:**
   ```bash
   export DATABASE_URL="file:./prisma/dev.db"
   npx prisma generate
   npx prisma db push
   npm run dev
   # Visit http://localhost:3000/setup
   ```
5. **Before opening a PR, run the checks** (CI runs the same ones plus end-to-end tests against a Docker container, see README):
   ```bash
   npx tsc --noEmit && npm run lint && npm run build
   ```
6. **Schema changes:** add new fields with a default value (`@default(...)`). Existing installs are upgraded automatically by `db-migrate.js`, which only adds missing tables/columns/indexes.

## 📝 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clear, commented code
- Follow the existing code style
- Test your changes thoroughly
- Update documentation if needed

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug in component"
```

### Commit Message Format

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🏗️ Project Structure

```
personal-linktree/
├── src/
│   ├── app/              # Next.js pages and API routes
│   │   ├── api/          # REST API endpoints
│   │   ├── admin/        # Admin dashboard pages
│   │   └── setup/        # Setup wizard
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   └── types/            # TypeScript type definitions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── yunohost/             # Yunohost deployment package
```

## 💻 Code Style Guidelines

### TypeScript

- Use TypeScript for all new files
- Define interfaces for props and data structures
- Avoid `any` type when possible
- Use `const` over `let` when possible

### React Components

```tsx
// Good
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export default function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  )
}
```

### API Routes

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    )
  }
}
```

## 🧪 Testing

Before submitting a PR:

1. **Test locally:**
   ```bash
   npm run build
   npm start
   ```

2. **Test setup wizard:**
   - Delete `.env` file
   - Visit `/setup`
   - Complete setup
   - Verify all features work

3. **Test Docker build:**
   ```bash
   docker-compose build
   docker-compose up
   ```

4. **Check for errors:**
   - No console errors
   - No TypeScript errors
   - All features functional

## 📚 Documentation

When adding features:
- Update README.md if needed
- Add JSDoc comments for complex functions
- Update API documentation
- Include examples in comments

## 🐛 Bug Reports

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, Docker version)
- Screenshots if applicable

## ✨ Feature Requests

When requesting features:
- Explain the use case
- Describe the expected behavior
- Suggest implementation approach (optional)
- Include mockups or examples (optional)

## 🔍 Code Review Process

All PRs will be reviewed for:
- Code quality and style
- Test coverage
- Documentation
- Performance impact
- Security considerations

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions help make this project better for everyone!
