## Prerequisites
- Node.js v18 or higher
- npm v10.9.2 or higher

## Installation

### Standard Installation (macOS/Linux)
In the root directory, run:
```bash
npm install
```

After installing the required dependencies, run:
```bash
npm run dev
```

### Windows Installation
If you encounter errors related to optional dependencies (e.g., `@rollup/rollup-win32-x64-msvc`), follow these steps:

1. **Clean installation:**
   ```bash
   # Remove existing dependencies
   rm -rf node_modules apps/*/node_modules
   rm -f package-lock.json apps/*/package-lock.json
   ```

2. **Reinstall dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

**Note:** The `.npmrc` file in the root directory is configured to handle optional dependencies correctly on all platforms. If you still encounter issues, ensure you're using npm v10.9.2 or higher by running `npm --version`.