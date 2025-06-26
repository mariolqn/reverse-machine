# HumanifyJS

**Next-generation JavaScript deobfuscation powered by AI**

[![npm version](https://badge.fury.io/js/humanifyjs.svg)](https://www.npmjs.com/package/humanifyjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Transform minified, obfuscated, and bundled JavaScript into human-readable code using Large Language Models and advanced AST transformations.

## 🚀 What Makes HumanifyJS Different

HumanifyJS represents a paradigm shift in JavaScript reverse engineering. Unlike traditional tools that rely solely on pattern matching and heuristics, HumanifyJS leverages the contextual understanding of Large Language Models to intelligently rename variables and functions while maintaining 100% semantic equivalence through AST-level transformations.

### ✨ Key Features

- **🧠 AI-Powered Renaming**: Context-aware variable and function renaming using OpenAI GPT, Google Gemini, or local LLMs
- **🔧 AST-Level Transformations**: Babel-powered structural improvements while preserving code semantics
- **📦 Bundle Unpacking**: Automatic webpack bundle extraction using WebCrack
- **⚡ Parallel Processing**: Concurrent file processing for optimal performance
- **🎯 Local GPU Support**: Native Apple Silicon optimization and CUDA support
- **🔒 Privacy-First**: Complete offline processing with local models
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
npm install -g humanifyjs
```

### One-time Usage
```bash
npx humanifyjs [command] [options] <file>
```

## 📖 Usage Guide

### Command Overview

HumanifyJS offers three processing modes, each optimized for different use cases:

```bash
humanify <mode> [options] <input-file>
```

### 🤖 OpenAI Mode (Most Accurate)

Leverage OpenAI's GPT models for superior renaming accuracy:

```bash
# Using API key directly
humanify openai --apiKey="sk-your-key" script.min.js

# Using environment variable
export OPENAI_API_KEY="sk-your-key"
humanify openai script.min.js

# Advanced options
humanify openai \
  --model="gpt-4o" \
  --outputDir="./humanified" \
  --concurrency=8 \
  --verbose \
  script.min.js
```

**Environment Variables:**
- `OPENAI_API_KEY`: Your OpenAI API key

### 🌟 Gemini Mode (Fast & Efficient)

Use Google's Gemini models for cost-effective processing:

```bash
# Using API key directly
humanify gemini --apiKey="your-gemini-key" script.min.js

# Using environment variable
export GEMINI_API_KEY="your-gemini-key"
humanify gemini --model="gemini-1.5-pro" script.min.js
```

**Environment Variables:**
- `GEMINI_API_KEY`: Your Google AI Studio API key

### 🧠 Anthropic Mode (Advanced Reasoning)

Use Anthropic's Claude models for superior code understanding:

```bash
# Using API key directly
humanify anthropic --apiKey="your-anthropic-key" script.min.js

# Using environment variable
export ANTHROPIC_API_KEY="your-anthropic-key"
humanify anthropic --model="claude-3-5-sonnet-latest" script.min.js

# Advanced options with specific model versions
humanify anthropic \
  --model="claude-3-5-sonnet-20241022" \
  --outputDir="./humanified" \
  --verbose \
  script.min.js
```

**Available Anthropic Models:**
- `claude-3-5-sonnet-latest` / `claude-3-5-sonnet-20241022` - Most capable, best for complex code
- `claude-3-5-haiku-latest` / `claude-3-5-haiku-20241022` - Fast and efficient (default)
- `claude-3-opus-latest` / `claude-3-opus-20240229` - Highest accuracy for challenging code
- `claude-3-sonnet-20240229` - Balanced performance and speed
- `claude-3-haiku-20240307` - Fastest processing

**Environment Variables:**
- `ANTHROPIC_API_KEY`: Your Anthropic API key

### 💻 Local Mode (Private & Free)

Process files entirely offline using local LLMs:

```bash
# First-time setup: download a model
humanify download 2b    # 4GB Phi-3.1 model (recommended for most users)
humanify download 8b    # 5GB Llama-3.1 model (better accuracy, requires more RAM)

# Process files locally
humanify local script.min.js

# Advanced local processing
humanify local \
  --model="8b" \
  --outputDir="./output" \
  --seed=42 \
  --verbose \
  script.min.js
```

### Available Local Models

| Model | Size | Architecture | RAM Required | Best For |
|-------|------|-------------|--------------|----------|
| `2b` | 4GB | Phi-3.1-mini | 8GB+ | General use, faster processing |
| `8b` | 5GB | Llama-3.1 | 16GB+ | Higher accuracy, complex code |

### 📊 Model Management

```bash
# List available models
humanify download

# Download specific model
humanify download 2b

# Check model status
ls ~/.humanifyjs/models/
```

## ⚙️ Advanced Configuration

### Processing Pipeline

HumanifyJS uses a sophisticated 4-stage pipeline:

1. **🔓 Bundle Extraction**: WebCrack unpacks webpack bundles
2. **🔧 AST Transformations**: Babel plugins normalize code structure
3. **🧠 AI Renaming**: LLMs provide context-aware variable names
4. **🎨 Formatting**: Prettier ensures consistent code style

### Performance Optimization

#### Parallel Processing
```bash
# Adjust concurrency based on your system
humanify openai --concurrency=16 large-bundle.js  # High-end systems
humanify openai --concurrency=4 large-bundle.js   # Standard systems
```

#### GPU Acceleration (Local Mode)
```bash
# Enable GPU acceleration (default)
humanify local script.min.js

# Force CPU-only processing
humanify local --disableGpu script.min.js
```

### Output Structure

```
output/
├── deobfuscated.js         # Main processed file
├── chunk-[hash].js         # Extracted chunks
├── vendor-[hash].js        # Vendor bundles
└── ...                     # Additional extracted files
```

## 💰 Cost Estimation

### Cloud APIs

For cost planning with cloud providers:

```bash
# Estimate tokens for OpenAI/Gemini/Anthropic
echo "$((2 * $(wc -c < yourscript.min.js))) tokens approximately"
```

**Example costs (approximate):**

| File Size | OpenAI (GPT-4o) | Gemini (1.5-Pro) | Anthropic (Claude-3.5) |
|-----------|----------------|-------------------|------------------------|
| Small (10KB) | ~$0.02 - $0.05 | ~$0.01 - $0.03 | ~$0.02 - $0.04 |
| Medium (100KB) | ~$0.20 - $0.50 | ~$0.10 - $0.30 | ~$0.15 - $0.40 |
| Large (1MB) | ~$2.00 - $5.00 | ~$1.00 - $3.00 | ~$1.50 - $4.00 |

*Costs vary by model tier and usage patterns*

### Local Processing

Local mode is completely free but requires:
- **Initial download**: 4-5GB per model
- **Processing time**: 2-10x slower than cloud APIs
- **Hardware**: GPU recommended for acceptable speed

## 🔧 Technical Architecture

### Core Technologies

- **AST Processing**: Babel ecosystem for semantic-preserving transformations
- **Bundle Analysis**: WebCrack for webpack bundle extraction
- **AI Integration**: OpenAI API, Google Generative AI, Anthropic SDK, node-llama-cpp
- **Language Models**: 
  - **Cloud**: GPT-4o, Claude-3.5, Gemini-1.5
  - **Local**: Phi-3.1, Llama-3.1 with GGUF quantization
- **Performance**: Worker threads and GPU acceleration

### Babel Transformations

HumanifyJS includes custom Babel plugins for:

- Converting `void 0` → `undefined`
- Normalizing comparison operators (`5 === x` → `x === 5`)
- Expanding scientific notation (`5e3` → `5000`)
- Code beautification and structure improvement

### AI Prompt Engineering

The tool uses sophisticated prompting strategies:

- **Context-aware analysis**: Provides surrounding code context to LLMs
- **Incremental processing**: Processes variables in scope-aware batches
- **Conflict resolution**: Automatically handles naming conflicts
- **Grammar constraints**: Uses GBNF for structured local model output

## 🧪 Testing & Quality Assurance

HumanifyJS includes comprehensive test suites:

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
git clone https://github.com/yourusername/humanifyjs.git
cd humanifyjs
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
├── test/             # Test suites
├── babel-utils.ts    # AST transformation utilities
├── unminify.ts       # Core processing pipeline
└── local-models.ts   # Model management
```

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 🙏 Acknowledgments

- **WebCrack** team for bundle extraction capabilities
- **Babel** ecosystem for AST transformations
- **node-llama-cpp** for local LLM inference
- **OpenAI** and **Google** for cloud AI APIs

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/humanifyjs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/humanifyjs/discussions)
- **Blog**: [Introduction Blog Post](https://thejunkland.com/blog/using-llms-to-reverse-javascript-minification)

---

<div align="center">

**Made with ❤️ for the reverse engineering community**

[⭐ Star on GitHub](https://github.com/yourusername/humanifyjs) • [📦 npm Package](https://www.npmjs.com/package/humanifyjs) • [📖 Documentation](https://github.com/yourusername/humanifyjs/wiki)

</div>
