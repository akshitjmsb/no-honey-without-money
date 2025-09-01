# Contributing to No Honey Without Money

Thank you for your interest in contributing to our portfolio management application! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- A Google Gemini API key for testing

### Local Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/no-honey-without-money.git
   cd no-honey-without-money
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   # Edit .env.local and add your Gemini API key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔒 Security Guidelines

### Never Commit Sensitive Information
- ❌ API keys
- ❌ Passwords
- ❌ Database credentials
- ❌ Personal portfolio data
- ❌ Environment files (.env*)

### Always Use Environment Variables
```typescript
// ✅ Good - Use environment variables
const apiKey = process.env.GEMINI_API_KEY;

// ❌ Bad - Hardcoded values
const apiKey = "sk-1234567890abcdef";
```

### Check Your Changes
Before committing, ensure:
- No API keys are in your code
- No personal data is included
- Environment files are not tracked
- Sensitive information is not in commit messages

## 📝 Code Style

### TypeScript
- Use strict TypeScript settings
- Define proper interfaces for all data structures
- Avoid `any` types when possible
- Use meaningful variable and function names

### React
- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use TypeScript for props and state

### CSS
- Follow BEM methodology for custom CSS
- Use Tailwind CSS classes when possible
- Maintain consistent spacing and colors
- Ensure responsive design

## 🧪 Testing

### Before Submitting
- [ ] Code runs without errors
- [ ] No console errors in browser
- [ ] Responsive design works on mobile
- [ ] All features function correctly
- [ ] No sensitive data is exposed

### Testing Checklist
- [ ] Portfolio cards display correctly
- [ ] AI chat functionality works
- [ ] Deep dive reports generate
- [ ] Editable fields function properly
- [ ] Currency conversion works
- [ ] Progress bars update correctly

## 📋 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, descriptive commit messages
   - Keep commits focused and atomic
   - Test thoroughly before committing

3. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Provide a clear description of changes
   - Include screenshots if UI changes
   - Reference any related issues
   - Ensure CI checks pass

## 🐛 Bug Reports

When reporting bugs, please include:

- **Description**: Clear explanation of the issue
- **Steps to reproduce**: Detailed steps to recreate the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, device information
- **Screenshots**: Visual evidence if applicable

## 💡 Feature Requests

For new features, please:

- **Describe the feature**: What you want to add
- **Explain the benefit**: Why this feature is useful
- **Provide examples**: How it would work
- **Consider implementation**: Any technical considerations

## 📚 Code Documentation

### Comments
- Comment complex business logic
- Explain non-obvious code decisions
- Document API integrations
- Keep comments up-to-date

### README Updates
- Update README.md for new features
- Document new environment variables
- Update installation instructions
- Add screenshots for UI changes

## 🔄 Release Process

1. **Version bumping**
   - Update package.json version
   - Update CHANGELOG.md
   - Tag the release

2. **Testing**
   - Run full test suite
   - Test on multiple browsers
   - Verify mobile responsiveness

3. **Deployment**
   - Build production version
   - Test build output
   - Deploy to hosting platform

## 🆘 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Security**: Report security issues privately to maintainers

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making this portfolio management tool better for everyone! 🎉
