# 🧪 Comprehensive Testing Suite

This project features an absolutely comprehensive testing infrastructure designed to catch bugs, performance issues, security vulnerabilities, and ensure reliability across all platforms and use cases.

## 📋 Table of Contents

- [Testing Overview](#testing-overview)
- [Test Types](#test-types)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Running Tests Locally](#running-tests-locally)
- [Test Configuration](#test-configuration)
- [Adding New Tests](#adding-new-tests)
- [Troubleshooting](#troubleshooting)

## 🎯 Testing Overview

Our testing strategy covers:
- **Unit Tests**: Core functionality testing
- **Integration Tests**: End-to-end workflows
- **Performance Tests**: Speed and efficiency benchmarks
- **Stress Tests**: System limits and breaking points
- **Memory Tests**: Memory leak detection
- **Security Tests**: Vulnerability and attack prevention
- **Compatibility Tests**: JavaScript feature compatibility
- **Cross-Platform Tests**: Windows, macOS, Linux compatibility
- **Smoke Tests**: Basic functionality verification

## 🧪 Test Types

### Unit Tests (`*.test.ts`)
- Test individual functions and components
- Fast execution (< 1 second per test)
- Mock external dependencies
- High coverage requirements (70%+)

```bash
npm run test:unit
```

### End-to-End Tests (`*.e2etest.ts`)
- Test complete user workflows
- Use real CLI commands
- Verify actual file outputs
- Sequential execution to avoid conflicts

```bash
npm run test:e2e
```

### LLM Tests (`*.llmtest.ts`)
- Test AI model integrations
- Require local model downloads
- Validate AI output quality
- Slower execution (30+ seconds)

```bash
npm run test:llm
```

### Performance Tests (`*.perftest.ts`)
- Benchmark processing speeds
- Memory usage monitoring
- Scalability testing
- Performance regression detection

```bash
npm run test:performance
```

### Stress Tests (`*.stress.ts`)
- Push system to breaking points
- Large file processing
- Edge case handling
- Graceful failure testing

```bash
npm run test:stress
```

### Memory Tests
- Memory leak detection
- RSS monitoring
- Garbage collection testing
- Long-running stability

```bash
npm run test:memory
```

### Security Tests
- Input validation testing
- Path traversal prevention
- Code injection protection
- Dependency vulnerability scanning

```bash
npm run test:security
```

## 🚀 GitHub Actions Workflows

### Main Comprehensive Test (`comprehensive-test.yml`)
**Triggers**: Every push to main, PRs, daily at 2 AM UTC

**Jobs**:
1. **Setup & Validation** - Dependencies and build
2. **Code Quality** - Linting, formatting, TypeScript
3. **Unit Tests & Coverage** - Core tests with coverage reporting
4. **Security Tests** - Vulnerability scanning and CodeQL
5. **Cross-Platform** - Ubuntu, Windows, macOS across Node 18-21
6. **Integration & E2E** - Full workflow testing
7. **Performance Tests** - Speed benchmarks
8. **Stress & Memory** - System limits testing
9. **Test Summary** - Comprehensive results overview

### Nightly Extended Tests (`nightly-extended.yml`)
**Triggers**: Daily at 1 AM UTC, manual dispatch

**Features**:
- Extended stress testing with configurable multipliers
- Massive file processing (50MB+ files)
- Long-running marathon tests (3+ hours)
- Boundary condition testing
- Detailed nightly reports

### Dependency Update Testing (`dependency-update-test.yml`)
**Triggers**: Weekly on Sundays, manual dispatch

**Features**:
- Automatic dependency update testing
- Multiple Node.js version compatibility
- Security audit automation
- Update impact assessment

## 💻 Running Tests Locally

### Prerequisites
```bash
npm install
npm run build
npm run download-ci-model  # For LLM tests
```

### Quick Test Commands
```bash
# Run all tests
npm run test:all

# Individual test suites
npm run test:unit           # Unit tests only
npm run test:e2e            # End-to-end tests
npm run test:llm            # LLM integration tests
npm run test:integration    # Integration tests
npm run test:performance    # Performance benchmarks
npm run test:stress         # Stress testing
npm run test:memory         # Memory leak detection
npm run test:security       # Security tests
npm run test:smoke          # Smoke tests

# With coverage
npm run test:coverage
```

### Test File Patterns
- `src/**/*.test.ts` - Unit tests
- `src/**/*.e2etest.ts` - End-to-end tests
- `src/**/*.llmtest.ts` - LLM tests
- `src/**/*.perftest.ts` - Performance tests
- `src/**/*.stress.ts` - Stress tests
- `src/test/*.test.ts` - Integration/special tests

## ⚙️ Test Configuration

### Coverage Configuration (`.c8rc.json`)
- **Minimum Coverage**: 70% lines, functions, statements; 60% branches
- **Included**: All `src/**/*.ts` files
- **Excluded**: Test files, dist, coverage directories
- **Reporters**: Text, HTML, LCOV, JSON summary

### Security Audit (`audit-ci.json`)
- **Level**: Moderate severity and above
- **Format**: Text output with summaries
- **Registry**: npm registry
- **Allowlist**: None (strict security)

## 🆕 Adding New Tests

### 1. Unit Test Example
```typescript
// src/my-module.test.ts
import test from "node:test";
import assert from "node:assert";
import { myFunction } from "./my-module.js";

test("My function should do something", () => {
  const result = myFunction("input");
  assert.strictEqual(result, "expected");
});
```

### 2. Integration Test Example
```typescript
// src/test/my-integration.test.ts
import test from "node:test";
import assert from "node:assert";
import { humanify } from "../test-utils.js";

test("Integration: My workflow", async () => {
  const result = await humanify("local", "test.js");
  assert(result.stdout.includes("Success"));
});
```

### 3. Performance Test Example
```typescript
// src/my-perf.perftest.ts
import test from "node:test";
import assert from "node:assert";
import { performance } from "perf_hooks";

test("Performance: My operation", async () => {
  const start = performance.now();
  await myOperation();
  const duration = performance.now() - start;
  assert(duration < 1000, "Should complete under 1 second");
});
```

## 🐛 Troubleshooting

### Common Issues

**Tests fail locally but pass in CI**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Ensure models are downloaded for LLM tests

**Memory tests failing**
- Run with `--expose-gc` flag
- Increase `--max-old-space-size` if needed
- Check for actual memory leaks in code

**Performance tests timing out**
- Adjust timeout values in test files
- Consider hardware differences
- Use appropriate test sizes

**Security tests false positives**
- Review audit-ci.json configuration
- Check for known false positives
- Update allowlist if necessary

### Debug Commands
```bash
# Run single test file
tsx --test src/path/to/test.test.ts

# Run with verbose output
tsx --test --verbose src/**/*.test.ts

# Run with inspector (for debugging)
node --inspect-brk $(which tsx) --test src/test.test.ts

# Memory debugging
node --expose-gc --inspect $(which tsx) --test src/memory.test.ts
```

### CI Debugging
- Check GitHub Actions logs for specific job failures
- Review test summary reports
- Compare local vs CI environments
- Check cache invalidation if builds are stale

## 📊 Coverage Reports

Coverage reports are generated automatically and include:
- **HTML Reports**: `coverage/index.html`
- **LCOV Data**: `coverage/lcov.info`
- **JSON Summary**: `coverage/coverage-summary.json`
- **Text Output**: Console summary

## 🎯 Best Practices

1. **Write tests first** - TDD approach recommended
2. **Keep tests focused** - One assertion per test when possible
3. **Use descriptive names** - Tests should be self-documenting
4. **Mock external dependencies** - Keep unit tests isolated
5. **Test edge cases** - Boundary conditions and error paths
6. **Monitor performance** - Include timing assertions
7. **Clean up resources** - Use afterEach/afterAll hooks
8. **Test across platforms** - Consider OS differences

## 🔧 Maintenance

### Regular Tasks
- Review and update dependency versions
- Monitor test execution times
- Analyze coverage trends
- Update test data and fixtures
- Refactor slow or flaky tests

### Monthly Reviews
- Performance benchmark analysis
- Security audit results
- Test suite execution time optimization
- Coverage gap identification
- Platform compatibility verification

---

This comprehensive testing suite ensures the highest quality and reliability for the reverse-machine project. For questions or improvements, please open an issue or submit a pull request. 