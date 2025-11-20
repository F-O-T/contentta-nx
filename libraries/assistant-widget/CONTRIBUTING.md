# Contributing to Contenta Assistant Widget

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/contenta-assistant-widget.git
   cd contenta-assistant-widget
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your Contenta API credentials to .env
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── assistant-chat.tsx      # Main chat component
│   ├── assistant-chat-widget.tsx # Widget with popover
│   └── ui/                     # Reusable UI components
├── lib/
│   └── utils.ts                # Utility functions
└── index.ts                    # Library entry point
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Add comments for complex logic
- Ensure responsive design

### 3. Testing

```bash
# Run type checking
npm run build:lib

# Run linting
npm run lint

# Test the build
npm run build
```

### 4. Commit Changes

Use clear, descriptive commit messages:

```bash
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve mobile layout issue"
git commit -m "docs: update installation instructions"
```

### 5. Submit Pull Request

1. Push your branch to your fork
2. Create a pull request with a clear title and description
3. Link any relevant issues
4. Wait for review

## Code Style Guidelines

### TypeScript

- Use strict TypeScript settings
- Define interfaces for all props
- Avoid using `any` type
- Use proper type annotations

### React

- Use functional components with hooks
- Follow React best practices
- Use proper prop drilling or context for state
- Implement proper error boundaries

### Styling

- Use Tailwind CSS classes
- Follow responsive design patterns
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test in both light and dark themes

### File Naming

- Use kebab-case for component files: `my-component.tsx`
- Use PascalCase for component names: `MyComponent`
- Use descriptive names for utilities and hooks

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Build completes without errors
- [ ] Components are responsive
- [ ] Documentation is updated if needed
- [ ] Environment variables are documented

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test your changes?

## Screenshots
Add screenshots if applicable

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added comments for complex logic
- [ ] My changes generate no new warnings
```

## Bug Reports

When reporting bugs, please include:

- Environment details (OS, browser, Node version)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console errors if any

## Feature Requests

For feature requests:

- Use a clear title
- Describe the use case
- Explain why it would be valuable
- Consider implementation approach

## Questions

If you have questions:

- Check existing issues and discussions
- Look at the documentation
- Feel free to open a discussion

## Community

- Be respectful and constructive
- Help others when possible
- Follow the code of conduct
- Focus on what is best for the community

Thank you for contributing! 🎉