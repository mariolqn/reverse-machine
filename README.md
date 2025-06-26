# Reverse Machine

**Next-generation JavaScript deobfuscation powered by AI**

[![npm version](https://badge.fury.io/js/reverse-machine.svg?v=2.1.2)](https://www.npmjs.com/package/reverse-machine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Transform minified, obfuscated, and bundled JavaScript into human-readable code using Large Language Models and advanced AST transformations.

## 🚀 What Makes Reverse Machine Different

Reverse Machine represents a paradigm shift in JavaScript reverse engineering. Unlike traditional tools that rely solely on pattern matching and heuristics, Reverse Machine leverages the contextual understanding of Large Language Models to intelligently rename variables and functions while maintaining 100% semantic equivalence through AST-level transformations.

### ✨ Key Features

- **🧠 AI-Powered Renaming**: Context-aware variable and function renaming using OpenAI GPT, Google Gemini, or Anthropic Claude
- **🔧 AST-Level Transformations**: Babel-powered structural improvements while preserving code semantics
- **📦 Bundle Unpacking**: Automatic webpack bundle extraction using WebCrack
- **⚡ Parallel Processing**: Concurrent file processing for optimal performance
- **🔒 Multi-Input Support**: Process single files, entire directories, or ZIP archives
- **🎨 Smart Formatting**: Integrated Prettier for consistent code style

## 📊 Before & After

**Input (minified):**
```javascript
function a(e,t){var n=[];var r=e.length;var i=0;for(;i<r;i+=t){if(i+t<r){n.push(e.substring(i,i+t))}else{n.push(e.substring(i,r))}}return n}
```

**Output (humanified):**
```javascript
function splitStringIntoChunks(inputString, chunkSize) {
  var chunks = [];
  var stringLength = inputString.length;
  var currentIndex = 0;
  for (; currentIndex < stringLength; currentIndex += chunkSize) {
    if (currentIndex + chunkSize < stringLength) {
      chunks.push(inputString.substring(currentIndex, currentIndex + chunkSize));
    } else {
      chunks.push(inputString.substring(currentIndex, stringLength));
    }
  }
  return chunks;
}
```

## 🛠 Installation

### Prerequisites
- **Node.js** ≥ 20.0.0
- **npm** or **yarn**

### Global Installation (Recommended)
```bash
npm install -g reverse-machine
```

### One-time Usage
```bash
npx reverse-machine [command] [options] <input>
```

## 📖 Usage Guide

### Command Overview

Reverse Machine offers three AI-powered processing modes, each optimized for different use cases and supports multiple input types:

```bash
reverse-machine <mode> [options] <input>

# Essential: Always estimate costs first (recommended)
reverse-machine <mode> --cost <input>
```

### 📁 Input Types

Reverse Machine supports three input types with intelligent output handling:

#### Single Files
```bash
reverse-machine openai script.min.js
# Creates: script.min - Deobfuscated.js (in same directory)
```

#### Project Directories  
```bash
reverse-machine openai ./my-project
# Creates: ./my-project-deobfuscated/ (copy of entire project with all JS/TS files processed)
```

#### ZIP Archives
```bash
reverse-machine openai project.zip
# Creates: ./project-deobfuscated/ (extracts and processes all files)
```

**Supported file types for processing:**
- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`
- TypeScript: `.ts`, `.tsx`
- HTML files with inline scripts: `.html`, `.htm`
- Component files: `.vue`, `.svelte`
- Configuration files: `.json` (if minified)

### 🤖 OpenAI Mode (Most Accurate)

Leverage OpenAI's GPT models for superior renaming accuracy:

```bash
# Estimate costs before processing (recommended)
reverse-machine openai --cost script.min.js
reverse-machine openai --cost --model="gpt-4o-mini" ./my-obfuscated-project

# Process a single minified file
reverse-machine openai --apiKey="sk-your-key" script.min.js

# Process an entire project directory
export OPENAI_API_KEY="sk-your-key"
reverse-machine openai ./my-obfuscated-project

# Process a ZIP archive
reverse-machine openai obfuscated-app.zip

# Advanced options for any input type
reverse-machine openai \
  --model="gpt-4o" \
  --concurrency=8 \
  --verbose \
  input-file-or-directory
```

**Environment Variables:**
- `OPENAI_API_KEY`: Your OpenAI API key

### 🌟 Gemini Mode (Fast & Efficient)

Use Google's Gemini models for cost-effective processing:

```bash
# Estimate costs before processing (recommended)
reverse-machine gemini --cost script.min.js
reverse-machine gemini --cost --model="gemini-2.5-flash" ./my-project

# Process a single file
reverse-machine gemini --apiKey="your-gemini-key" script.min.js

# Process a project directory
export GEMINI_API_KEY="your-gemini-key"
reverse-machine gemini --model="gemini-1.5-pro" ./my-project

# Process a ZIP archive
reverse-machine gemini obfuscated-bundle.zip
```

**Environment Variables:**
- `GEMINI_API_KEY`: Your Google AI Studio API key

### 🧠 Anthropic Mode (Advanced Reasoning)

Use Anthropic's Claude models for superior code understanding:

```bash
# Estimate costs before processing (recommended)
reverse-machine anthropic --cost script.min.js
reverse-machine anthropic --cost --model="claude-3-5-haiku-latest" ./my-project

# Process a single file with Claude 4 reasoning
reverse-machine anthropic --apiKey="your-anthropic-key" --model="claude-4-opus-20250514-reasoning" script.min.js

# Process a project directory with environment variable
export ANTHROPIC_API_KEY="your-anthropic-key"
reverse-machine anthropic --model="claude-4-sonnet-20250514" ./my-project

# Process a ZIP archive with Claude 3.5
reverse-machine anthropic --model="claude-3-5-sonnet-latest" obfuscated-app.zip

# Advanced options with Claude 4 reasoning model
reverse-machine anthropic \
  --model="claude-4-opus-20250514-reasoning" \
  --verbose \
  input-file-or-directory

# Fast processing with Claude 4 standard model  
reverse-machine anthropic \
  --model="claude-4-sonnet-20250514" \
  complex-project.zip
```

**Available Anthropic Models:**

**Claude 4 Family (Latest - May 2025):**
- `claude-4-opus-20250514-reasoning` - Most powerful with extended reasoning for complex code
- `claude-4-sonnet-20250514-reasoning` - Balanced with extended reasoning capabilities  
- `claude-4-opus-20250514` - Most powerful with near-instant responses
- `claude-4-sonnet-20250514` - Balanced with fast responses

**Claude 3.5 Family:**
- `claude-3-5-sonnet-latest` / `claude-3-5-sonnet-20241022` - Most capable Claude 3.5, best for complex code
- `claude-3-5-haiku-latest` / `claude-3-5-haiku-20241022` - Fast and efficient (default)

**Claude 3 Family:**
- `claude-3-opus-latest` / `claude-3-opus-20240229` - Highest accuracy for challenging code
- `claude-3-sonnet-20240229` - Balanced performance and speed
- `claude-3-haiku-20240307` - Fastest processing

**Claude 4 Reasoning vs Standard Models:**
- **Reasoning models** (`-reasoning` suffix): Use extended thinking for deeper code analysis and better variable naming
- **Standard models**: Provide near-instant responses for faster processing

**Environment Variables:**
- `ANTHROPIC_API_KEY`: Your Anthropic API key

#### 🧠 **Claude 4 Reasoning Models - Deep Code Understanding**

Claude 4 introduces revolutionary reasoning capabilities that dramatically improve variable naming quality:

**When to Use Reasoning Models:**
- **Complex, heavily obfuscated code** where context matters
- **Large codebases** with intricate dependencies  
- **Critical production systems** where naming accuracy is paramount
- **Educational purposes** where you want to understand the AI's thought process

**When to Use Standard Models:**
- **Quick prototyping** and fast iterations
- **Simple minified files** with straightforward patterns
- **Batch processing** where speed is more important than perfection
- **Cost-sensitive applications** with high volume processing

**Example: Claude 4 Reasoning in Action**

```bash
# Standard Claude 4 (fast)
reverse-machine anthropic --model="claude-4-sonnet-20250514" app.min.js
# Result: Variables renamed in ~2-3 seconds with good accuracy

# Claude 4 with Reasoning (thorough)  
reverse-machine anthropic --model="claude-4-sonnet-20250514-reasoning" app.min.js
# Result: Variables renamed in ~5-8 seconds with superior accuracy and context awareness
```

The reasoning models will internally analyze:
1. **Variable usage patterns** across the entire codebase
2. **Semantic relationships** between functions and data
3. **Domain-specific naming conventions** from the code context
4. **Potential conflicts** with existing variable names

### 📊 **Complete Model Comparison**

| Model Family | Model Name | Reasoning | Speed | Accuracy | Cost | Best For |
|--------------|------------|-----------|-------|----------|------|----------|
| **Claude 4** | `claude-4-opus-20250514-reasoning` | ✅ Extended | Slow | Highest | $$$ | Complex obfuscated code, critical systems |
| **Claude 4** | `claude-4-opus-20250514` | ❌ None | Fast | High | $$$ | Production code, high accuracy needs |
| **Claude 4** | `claude-4-sonnet-20250514-reasoning` | ✅ Extended | Medium | Very High | $$ | Balanced reasoning, most use cases |
| **Claude 4** | `claude-4-sonnet-20250514` | ❌ None | Fast | High | $$ | General purpose, good balance |
| **Claude 3.5** | `claude-3-5-sonnet-latest` | ❌ None | Fast | High | $$ | Proven reliability |
| **Claude 3.5** | `claude-3-5-haiku-latest` | ❌ None | Fastest | Good | $ | Quick processing (default) |
| **Claude 3** | `claude-3-opus-latest` | ❌ None | Medium | High | $$$ | Legacy complex code |

**💡 Recommendations:**
- **Start with**: `claude-4-sonnet-20250514-reasoning` for best balance of cost, speed, and accuracy
- **For speed**: `claude-3-5-haiku-latest` for fast batch processing  
- **For accuracy**: `claude-4-opus-20250514-reasoning` for the most challenging code
- **For cost**: `claude-3-5-haiku-latest` for budget-conscious projects

### 🚀 **Claude 4 Usage Examples**

```bash
# 1. Claude 4 Opus with Reasoning - Maximum accuracy for complex code
reverse-machine anthropic \
  --model="claude-4-opus-20250514-reasoning" \
  --verbose \
  complex-obfuscated-app.min.js

# 2. Claude 4 Sonnet with Reasoning - Best balance for most projects  
reverse-machine anthropic \
  --model="claude-4-sonnet-20250514-reasoning" \
  ./production-project

# 3. Claude 4 Opus Standard - Fast processing with high accuracy
reverse-machine anthropic \
  --model="claude-4-opus-20250514" \
  app-bundle.zip

# 4. Claude 4 Sonnet Standard - Balanced speed and performance
reverse-machine anthropic \
  --model="claude-4-sonnet-20250514" \
  ./entire-codebase
```

**🔄 Migration from Claude 3.5:**
```bash
# Old Claude 3.5 command
reverse-machine anthropic --model="claude-3-5-sonnet-latest" script.min.js

# New Claude 4 equivalent (better results)
reverse-machine anthropic --model="claude-4-sonnet-20250514-reasoning" script.min.js
```



## ⚙️ Advanced Configuration

### Processing Pipeline

Reverse Machine uses a sophisticated 4-stage pipeline:

1. **🔓 Bundle Extraction**: WebCrack unpacks webpack bundles
2. **🔧 AST Transformations**: Babel plugins normalize code structure
3. **🧠 AI Renaming**: LLMs provide context-aware variable names
4. **🎨 Formatting**: Prettier ensures consistent code style

### Performance Optimization

#### Parallel Processing
```bash
# Adjust concurrency based on your system
reverse-machine openai --concurrency=16 ./large-project  # High-end systems
reverse-machine openai --concurrency=4 single-file.js    # Standard systems

# For directories with many files, higher concurrency helps
reverse-machine openai --concurrency=12 project.zip      # Process ZIP archives faster
```



### Output Structure

The output structure depends on your input type:

#### Single File Input
```
original-directory/
├── script.min.js                    # Original file
└── script.min - Deobfuscated.js    # Processed output
```

#### Directory Input
```
parent-directory/
├── my-project/                      # Original directory
└── my-project-deobfuscated/         # Processed copy
    ├── src/
    │   ├── app.js                   # All JS/TS files processed
    │   └── utils.ts                 # Maintains file structure
    ├── assets/                      # Non-JS files copied as-is
    └── package.json                 # Configuration preserved
```

#### ZIP Archive Input
```
archive-directory/
├── project.zip                      # Original archive
└── project-deobfuscated/            # Extracted and processed
    └── (same structure as directory input)
```

## 💰 Cost Estimation & Planning

### 🧮 Built-in Cost Calculator

Reverse Machine includes a comprehensive cost estimation feature to help you plan your deobfuscation budget **before** spending money:

```bash
# Estimate costs for any input without processing
reverse-machine openai --cost script.min.js
reverse-machine gemini --cost ./my-project  
reverse-machine anthropic --cost project.zip

# Combine with model selection for accurate estimates
reverse-machine openai --cost --model="gpt-4o-mini" large-project.zip
reverse-machine anthropic --cost --model="claude-4-opus-20250514-reasoning" complex-code.js
```

### 📊 Cost Estimation Features

The `--cost` flag provides detailed cost breakdowns including:

- **📁 File Discovery**: Automatically scans directories and ZIP archives
- **📏 Token Estimation**: Conservative estimates based on file sizes and minification
- **💡 Processing Mode Analysis**: Separate estimates for basic vs advanced processing
- **💰 Multi-Model Comparison**: Compare costs across different AI providers
- **⚠️ Reality Warnings**: Alerts about potential cost overruns and exponential scaling

### 🎯 Example Cost Estimation Output

```bash
$ reverse-machine openai --cost ./typescript-project

Cost Estimation Report
======================

📁 Discovery Results:
- Total files found: 42 JavaScript/TypeScript files
- Total size: 2.8 MB
- Estimated tokens: ~1,120,000 tokens

💰 OpenAI GPT-4o Cost Estimates:
- Basic Processing: $28.00
- Advanced Processing: $156.80

⚠️  Important Warnings:
- Advanced mode may cost 2-5x more than estimates
- Large files (>100KB) have exponential cost scaling
- Consider using budget models for initial testing

💡 Recommendations:
- Try gpt-4o-mini first ($1.68 estimated)
- Use basic mode for 99% of use cases
- Test with small samples before full processing
```

### 💸 Real-World Cost Accuracy

**⚠️ IMPORTANT**: Cost estimates are **conservative approximations** and real costs may be **2-5x higher** due to:

- **Multi-phase processing**: Advanced mode uses exponential token growth
- **Context accumulation**: Each phase builds on previous results
- **Retry mechanisms**: Failed attempts still consume tokens
- **Model-specific overhead**: Provider-specific reasoning and safety checks

**Recommendation**: Always start with the smallest possible test to validate costs.

### 🏷️ Current AI Model Pricing (2025)

#### OpenAI Models
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| GPT-4o | $2.50 | $10.00 | Production quality |
| GPT-4.1 | $2.00 | $8.00 | Balanced performance |
| GPT-4o-mini | $0.15 | $0.60 | **Budget-friendly** |
| o1-mini | $3.00 | $12.00 | Complex reasoning |
| o3-mini | $15.00 | $60.00 | Advanced reasoning |

#### Anthropic Claude Models  
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| Claude 4 Opus | $15.00 | $75.00 | Maximum accuracy |
| Claude 4 Sonnet | $3.00 | $15.00 | **Balanced choice** |
| Claude 3.5 Sonnet | $3.00 | $15.00 | Proven reliability |
| Claude 3.5 Haiku | $0.80 | $4.00 | Fast processing |

#### Google Gemini Models
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| Gemini 2.5 Pro | $1.25 | $10.00 | High performance |
| Gemini 2.5 Flash | $0.30 | $2.50 | **Most affordable** |
| Gemini 1.5 Pro | $1.25 | $5.00 | Legacy compatibility |
| Gemini 1.5 Flash | $0.075 | $0.30 | Ultra budget |

### 💡 Cost Optimization Strategies

#### 🎯 Choose the Right Model
```bash
# For budget-conscious projects
reverse-machine openai --model="gpt-4o-mini" project.zip        # ~$5-15 typical
reverse-machine gemini --model="gemini-2.5-flash" project.zip   # ~$3-10 typical

# For production quality  
reverse-machine anthropic --model="claude-4-sonnet-20250514" project.zip  # ~$20-60 typical
reverse-machine openai --model="gpt-4o" project.zip                       # ~$25-75 typical
```

#### 📏 Start Small, Scale Up
```bash
# 1. Test with cost estimation first
reverse-machine openai --cost ./large-project

# 2. Process a small sample
reverse-machine openai ./large-project/src/single-file.js

# 3. If satisfied, process incrementally
reverse-machine openai ./large-project/src/         # Just src folder
reverse-machine openai ./large-project              # Full project
```

#### ⚡ Use Basic Mode by Default
- **Basic processing**: Single-pass renaming (recommended for 99% of use cases)
- **Advanced processing**: Multi-agent analysis (only for critical production code)

```bash
# Basic mode (default) - cost-effective
reverse-machine openai script.min.js

# Advanced mode - expensive but thorough
reverse-machine openai --advanced script.min.js
```

### 📈 Scaling Cost Examples

Real-world cost examples based on project sizes:

| Project Size | Files | Estimated Cost (Budget) | Estimated Cost (Premium) | Reality Check |
|--------------|-------|------------------------|--------------------------|---------------|
| **Small** (1-5 files, <1MB) | 3 | $2-5 | $10-25 | Usually accurate |
| **Medium** (10-50 files, 1-10MB) | 25 | $15-40 | $75-200 | May be 2x higher |
| **Large** (50+ files, 10MB+) | 100 | $60-150 | $300-800 | Often 3-5x higher |

**Budget Models**: OpenAI GPT-4o-mini, Gemini 2.5 Flash  
**Premium Models**: Claude 4 Opus, OpenAI o3-mini

### 🚨 Cost Safety Tips

1. **Always estimate first**: Use `--cost` before processing
2. **Set spending limits**: Configure API billing limits
3. **Test incrementally**: Start with single files
4. **Monitor spending**: Check API usage dashboards regularly
5. **Use budget models**: Start with cheaper options for experimentation

## 🔧 Technical Architecture

### Core Technologies

- **AST Processing**: Babel ecosystem for semantic-preserving transformations
- **Bundle Analysis**: WebCrack for webpack bundle extraction
- **AI Integration**: OpenAI API, Google Generative AI, Anthropic SDK
- **Language Models**: GPT-4o, Claude-4 (with reasoning), Claude-3.5, Gemini-1.5
- **Performance**: Parallel processing and concurrent file handling

### Babel Transformations

Reverse Machine includes custom Babel plugins for:

- Converting `void 0` → `undefined`
- Normalizing comparison operators (`5 === x` → `x === 5`)
- Expanding scientific notation (`5e3` → `5000`)
- Code beautification and structure improvement

### AI Prompt Engineering

The tool uses sophisticated prompting strategies:

- **Context-aware analysis**: Provides surrounding code context to LLMs
- **Incremental processing**: Processes variables in scope-aware batches
- **Conflict resolution**: Automatically handles naming conflicts
- **Structured output**: Uses JSON formatting for consistent AI responses

## 🧪 Testing & Quality Assurance

Reverse Machine includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit      # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:llm       # LLM integration tests
npm run test:openai    # OpenAI API tests
npm run test:gemini    # Gemini API tests
```

## 🤝 Contributing

We welcome contributions! The codebase is designed for maintainability:

### Development Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/reverse-machine.git
cd reverse-machine
npm install

# Development commands
npm run start          # Run from source
npm run build          # Build for distribution
npm run lint           # Code quality checks
```

### Project Structure

```
src/
├── commands/          # CLI command implementations
├── plugins/           # Processing plugins (Babel, LLM, etc.)
├── security/          # Input validation and security
├── test/             # Test suites
├── babel-utils.ts    # AST transformation utilities
├── input-handler.ts  # Multi-input type handling (files/dirs/zip)
├── unminify.ts       # Legacy processing pipeline
└── unminify-enhanced.ts # Enhanced processing pipeline
```

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 🙏 Acknowledgments

- **WebCrack** team for bundle extraction capabilities
- **Babel** ecosystem for AST transformations
- **OpenAI**, **Google**, and **Anthropic** for AI APIs
- **Open source community** for the foundational tools

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/mariolqn/reverse-machine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mariolqn/reverse-machine/discussions)
- **Blog**: [Introduction Blog Post](https://thejunkland.com/blog/using-llms-to-reverse-javascript-minification)

---

<div align="center">

**Made with ❤️ for the reverse engineering community**

[⭐ Star on GitHub](https://github.com/mariolqn/reverse-machine) • [📦 npm Package](https://www.npmjs.com/package/reverse-machine) • [📖 Documentation](https://github.com/mariolqn/reverse-machine/wiki)

</div>
