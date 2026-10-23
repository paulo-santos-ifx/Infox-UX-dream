#!/usr/bin/env node
/**
 * Refactoring Scan Tool
 *
 * Automates the SCAN phase of large-scale refactoring:
 * - Lists project structure
 * - Extracts imports/exports
 * - Detects code smells
 * - Generates .refactor/scan.json
 *
 * Usage:
 *   node scripts/scan.js src/
 *   node scripts/scan.js src/ --output .refactor/scan.json
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 600,
  LARGE_FILE_THRESHOLD: 300,
  IGNORED_DIRS: new Set([".git", "node_modules", ".next", "dist", "build", ".refactor"]),
  SUPPORTED_EXTENSIONS: new Set([".ts", ".tsx", ".js", ".jsx"]),
};

class CodeSmellDetector {
  static checkFileSize(lines) {
    if (lines > CONFIG.MAX_FILE_SIZE) {
      return `Large file (${lines} lines, max ${CONFIG.MAX_FILE_SIZE})`;
    }
    if (lines > CONFIG.LARGE_FILE_THRESHOLD) {
      return `Medium-large file (${lines} lines, consider refactoring)`;
    }
    return null;
  }

  static detectDuplicatedPattern(content, pattern) {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    return (content.match(regex) || []).length;
  }
}

class CodeExtractor {
  // Regex patterns
  static PATTERNS = {
    IMPORT: /^(?:import|from)\s+.*/,
    EXPORT: /^export\s+(?:const|function|interface|type|class|enum)/,
    FUNCTION: /^(?:export\s+)?(?:async\s+)?(?:function|const)\s+([a-zA-Z_]\w*)/,
    INTERFACE: /^(?:export\s+)?interface\s+([a-zA-Z_]\w*)/,
    TYPE: /^(?:export\s+)?type\s+([a-zA-Z_]\w*)/,
    CLASS: /^(?:export\s+)?class\s+([a-zA-Z_]\w*)/,
  };

  static extractFromFile(filepath) {
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      const lines = content.split("\n");
      const lineCount = lines.length;

      const imports = this._extractImports(lines);
      const exports = this._extractExports(lines);
      const symbols = this._extractSymbols(lines);

      return {
        path: filepath,
        lines: lineCount,
        imports,
        exports,
        symbols,
        smell: CodeSmellDetector.checkFileSize(lineCount),
      };
    } catch (error) {
      return {
        path: filepath,
        error: error.message,
      };
    }
  }

  static _extractImports(lines) {
    const imports = new Set();

    lines.forEach((line) => {
      if (this.PATTERNS.IMPORT.test(line)) {
        if (line.includes("from")) {
          // from 'path' import X
          const match = line.match(/from\s+['"]([^'"]+)['"]/);
          if (match) imports.add(match[1]);
        } else {
          // import X from 'path'
          const match = line.match(/['"]([^'"]+)['"]/);
          if (match) imports.add(match[1]);
        }
      }
    });

    return Array.from(imports);
  }

  static _extractExports(lines) {
    const exports = new Set();

    lines.forEach((line) => {
      if (line.includes("export")) {
        // export const X, export function Y, etc
        let match = line.match(/\b(?:const|function|class|interface|type)\s+([a-zA-Z_]\w*)/);
        if (match) {
          exports.add(match[1]);
        }

        // export { A, B, C }
        match = line.match(/export\s*{([^}]+)}/);
        if (match) {
          const items = match[1]
            .split(",")
            .map((x) => x.trim().split(" as ")[0])
            .filter((x) => x);
          items.forEach((item) => exports.add(item));
        }
      }
    });

    return Array.from(exports);
  }

  static _extractSymbols(lines) {
    const symbols = {
      functions: new Set(),
      interfaces: new Set(),
      types: new Set(),
      classes: new Set(),
    };

    lines.forEach((line) => {
      let match;

      match = line.match(this.PATTERNS.FUNCTION);
      if (match) symbols.functions.add(match[1]);

      match = line.match(this.PATTERNS.INTERFACE);
      if (match) symbols.interfaces.add(match[1]);

      match = line.match(this.PATTERNS.TYPE);
      if (match) symbols.types.add(match[1]);

      match = line.match(this.PATTERNS.CLASS);
      if (match) symbols.classes.add(match[1]);
    });

    return {
      functions: Array.from(symbols.functions),
      interfaces: Array.from(symbols.interfaces),
      types: Array.from(symbols.types),
      classes: Array.from(symbols.classes),
    };
  }
}

class ProjectScanner {
  static scan(rootPath) {
    const root = path.resolve(rootPath);
    const files = [];
    const largeFiles = [];
    const codeSmells = [];

    const codeFiles = this._findCodeFiles(root);

    codeFiles.forEach((filepath) => {
      const extracted = CodeExtractor.extractFromFile(filepath);

      if (!extracted.error) {
        files.push(extracted);

        if (extracted.smell) {
          largeFiles.push({
            path: extracted.path,
            lines: extracted.lines,
            issue: extracted.smell,
          });
        }
      }
    });

    // Detect duplication patterns
    const duplicatedPatterns = this._detectDuplications(files);
    if (duplicatedPatterns.length > 0) {
      codeSmells.push({
        type: "potential_duplication",
        patterns: duplicatedPatterns,
      });
    }

    return {
      scan_timestamp: new Date().toISOString(),
      root,
      total_files: files.length,
      by_extension: this._countByExtension(files),
      files,
      large_files: largeFiles,
      code_smells: codeSmells,
    };
  }

  static _findCodeFiles(root) {
    const files = [];

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (this._isIgnored(fullPath)) {
          return;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (CONFIG.SUPPORTED_EXTENSIONS.has(ext)) {
            files.push(fullPath);
          }
        }
      });
    };

    walk(root);
    return files;
  }

  static _isIgnored(filepath) {
    const parts = filepath.split(path.sep);
    return parts.some((part) => CONFIG.IGNORED_DIRS.has(part));
  }

  static _detectDuplications(files) {
    const importCounts = {};

    files.forEach((file) => {
      file.imports.forEach((imp) => {
        if (imp.startsWith(".")) {
          importCounts[imp] = (importCounts[imp] || 0) + 1;
        }
      });
    });

    const common = Object.entries(importCounts)
      .filter(([_, count]) => count > 5)
      .map(([imp, count]) => ({ import: imp, count }));

    return common;
  }

  static _countByExtension(files) {
    const counts = {};

    files.forEach((file) => {
      const ext = path.extname(file.path);
      counts[ext] = (counts[ext] || 0) + 1;
    });

    return counts;
  }
}

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log("Usage: node scripts/scan.js <path> [--output <file>] [--pretty]");
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/scan.js src/");
    console.log("  node scripts/scan.js src/ --output .refactor/scan.json --pretty");
    process.exit(0);
  }

  const scanPath = args[0];
  let outputFile = ".refactor/scan.json";
  let pretty = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[++i];
    } else if (args[i] === "--pretty") {
      pretty = true;
    }
  }

  // Check path exists
  if (!fs.existsSync(scanPath)) {
    console.error(`Error: Path '${scanPath}' does not exist`);
    process.exit(1);
  }

  console.log(`Scanning ${scanPath}...`);
  const result = ProjectScanner.scan(scanPath);

  // Create .refactor directory if needed
  const refactorDir = ".refactor";
  if (!fs.existsSync(refactorDir)) {
    fs.mkdirSync(refactorDir, { recursive: true });
  }

  // Save result
  fs.writeFileSync(outputFile, JSON.stringify(result, null, pretty ? 2 : 0));

  console.log("\nScan complete!");
  console.log(`Total files: ${result.total_files}`);
  console.log(`Large files: ${result.large_files.length}`);
  console.log(`Code smells detected: ${result.code_smells.length}`);
  console.log(`Output: ${outputFile}`);

  if (result.large_files.length > 0) {
    console.log("\n⚠️  Large files found:");
    result.large_files.slice(0, 5).forEach((lf) => {
      console.log(`  ${lf.path}: ${lf.lines} lines (${lf.issue})`);
    });
  }
}

main();
