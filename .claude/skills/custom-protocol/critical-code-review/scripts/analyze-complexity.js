#!/usr/bin/env node

/**
 * Code Complexity Analyzer for Code Review
 *
 * Identifies potential code smells and complexity issues:
 * - Long functions (>30 lines)
 * - Deep nesting (>3 levels)
 * - High cyclomatic complexity
 * - Duplicate patterns
 * - Magic numbers
 *
 * Usage:
 *   node scripts/analyze-complexity.js src/
 *   node scripts/analyze-complexity.js --watch src/  // Watch mode
 */

const fs = require("fs");
const path = require("path");

class ComplexityIssue {
  constructor(file, lineNumber, severity, issueType, message, suggestion) {
    this.file = file;
    this.lineNumber = lineNumber;
    this.severity = severity; // LOW, MEDIUM, HIGH, CRITICAL
    this.issueType = issueType;
    this.message = message;
    this.suggestion = suggestion;
  }
}

class ComplexityAnalyzer {
  constructor() {
    this.issues = [];
  }

  analyzeFile(filepath) {
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      const lines = content.split("\n");
      const fileIssues = [];

      fileIssues.push(...this.checkFunctionLength(filepath, lines));
      fileIssues.push(...this.checkNestingDepth(filepath, lines));
      fileIssues.push(...this.checkMagicNumbers(filepath, lines));
      fileIssues.push(...this.checkDuplicates(filepath, lines));
      fileIssues.push(...this.checkComplexity(filepath, lines));

      return fileIssues;
    } catch (error) {
      console.error(`Error reading ${filepath}:`, error.message);
      return [];
    }
  }

  checkFunctionLength(filepath, lines) {
    const issues = [];
    let inFunction = false;
    let functionStart = 0;
    let functionName = "";
    let braceCount = 0;
    let functionContent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Detect function start
      const functionMatch = line.match(
        /(?:async\s+)?(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:async)?\s*(?:function)?\s*\(|function\s+(\w+)\s*\(|(\w+)\s*\([^)]*\)\s*{/,
      );

      if (functionMatch && !inFunction) {
        inFunction = true;
        functionStart = lineNum;
        functionName = functionMatch[1] || functionMatch[2] || functionMatch[3] || "anonymous";
        functionContent = "";
      }

      if (inFunction) {
        functionContent += line + "\n";
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // Function ends
        if (braceCount === 0 && inFunction && lineNum > functionStart) {
          const functionLength = lineNum - functionStart;

          if (functionLength > 30) {
            issues.push(
              new ComplexityIssue(
                filepath,
                functionStart,
                "MEDIUM",
                "LongFunction",
                `Function '${functionName}' is ${functionLength} lines (threshold: 30)`,
                "Extract logic into smaller functions. Each function should have one responsibility.",
              ),
            );
          }

          inFunction = false;
          braceCount = 0;
          functionContent = "";
        }
      }
    }

    return issues;
  }

  checkNestingDepth(filepath, lines) {
    const issues = [];
    const maxDepth = 3;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith("//") || line.trim().startsWith("/*")) {
        continue;
      }

      // Calculate indentation
      const match = line.match(/^(\s+)/);
      if (!match) continue;

      const indent = match[1].length;
      const nestLevel = Math.floor(indent / 2);

      if (nestLevel > maxDepth && line.trim().length > 0) {
        issues.push(
          new ComplexityIssue(
            filepath,
            lineNum,
            "MEDIUM",
            "DeepNesting",
            `Code nesting depth ${nestLevel} exceeds threshold (${maxDepth})`,
            "Extract nested logic into separate function or use early returns.",
          ),
        );
      }
    }

    return issues;
  }

  checkMagicNumbers(filepath, lines) {
    const issues = [];
    const magicNumbers = new Map();
    // Pattern for magic numbers (excluding 0, 1, 2, -1, common values)
    const pattern = /\b([3-9]|[1-9][0-9]+|0\.[1-9][0-9]*)\b/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments and string definitions
      if (
        line.trim().startsWith("//") ||
        line.trim().startsWith("#") ||
        line.includes("'") ||
        line.includes('"')
      ) {
        continue;
      }

      let match;
      while ((match = pattern.exec(line)) !== null) {
        const number = match[1];
        if (!magicNumbers.has(number)) {
          magicNumbers.set(number, lineNum);
        }
      }
    }

    // Report only larger magic numbers
    for (const [number, lineNum] of magicNumbers) {
      if (number.length > 1 || parseFloat(number) > 9) {
        issues.push(
          new ComplexityIssue(
            filepath,
            lineNum,
            "LOW",
            "MagicNumber",
            `Magic number '${number}' should be a named constant`,
            `Define constant: const ${this.toConstantName(number)} = ${number}`,
          ),
        );
      }
    }

    return issues;
  }

  checkDuplicates(filepath, lines) {
    const issues = [];
    const patternCounts = new Map();
    const patternLines = new Map();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const stripped = line.trim();

      // Skip short lines, comments, and braces
      if (
        stripped.length < 20 ||
        stripped.startsWith("//") ||
        stripped.startsWith("/*") ||
        ["{", "}"].includes(stripped)
      ) {
        continue;
      }

      if (patternCounts.has(stripped)) {
        patternCounts.set(stripped, patternCounts.get(stripped) + 1);
      } else {
        patternCounts.set(stripped, 1);
        patternLines.set(stripped, lineNum);
      }
    }

    // Report patterns appearing 3+ times
    for (const [pattern, count] of patternCounts) {
      if (count >= 3) {
        issues.push(
          new ComplexityIssue(
            filepath,
            patternLines.get(pattern),
            "MEDIUM",
            "DuplicateCode",
            `Code pattern appears ${count} times in file`,
            "Extract into reusable function or component.",
          ),
        );
      }
    }

    return issues;
  }

  checkComplexity(filepath, lines) {
    const issues = [];

    // Check for multiple if/else chains
    const ifCount = 0;
    let currentLineIfCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      const ifMatches = (line.match(/\bif\s*\(/g) || []).length;
      const elseIfMatches = (line.match(/\belse\s*if\s*\(/g) || []).length;
      const switchMatches = (line.match(/\bswitch\s*\(/g) || []).length;

      currentLineIfCount += ifMatches + elseIfMatches + switchMatches;

      if (currentLineIfCount > 4) {
        issues.push(
          new ComplexityIssue(
            filepath,
            lineNum,
            "MEDIUM",
            "HighComplexity",
            `High cyclomatic complexity detected (${currentLineIfCount} conditional branches)`,
            "Consider refactoring with switch statements, early returns, or separate functions.",
          ),
        );
        currentLineIfCount = 0;
      }
    }

    return issues;
  }

  toConstantName(value) {
    return `MAGIC_${Math.abs(Math.floor(parseFloat(value)))}`.toUpperCase();
  }

  analyzeDirectory(directory) {
    const allIssues = [];
    const skipDirs = ["node_modules", ".git", "dist", "build", ".next", "coverage"];

    const walk = (dir) => {
      try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (!skipDirs.some((skip) => fullPath.includes(skip))) {
              walk(fullPath);
            }
          } else if ([".ts", ".tsx", ".js", ".jsx"].includes(path.extname(file))) {
            const issues = this.analyzeFile(fullPath);
            allIssues.push(...issues);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
      }
    };

    walk(directory);
    return allIssues;
  }

  generateReport(issues) {
    if (issues.length === 0) {
      return "✅ No complexity issues detected.";
    }

    // Sort by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const severityEmoji = {
      CRITICAL: "🔴",
      HIGH: "🟠",
      MEDIUM: "🟡",
      LOW: "🟢",
    };

    let report = "# Code Complexity Report\n\n";

    for (const severity of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
      const severityIssues = issues.filter((i) => i.severity === severity);
      if (severityIssues.length === 0) continue;

      report += `## ${severityEmoji[severity]} ${severity}\n\n`;

      for (const issue of severityIssues) {
        report += `**File:** \`${issue.file}:${issue.lineNumber}\`\n`;
        report += `**Type:** ${issue.issueType}\n`;
        report += `**Issue:** ${issue.message}\n`;
        report += `**Suggestion:** ${issue.suggestion}\n\n`;
      }
    }

    return report;
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: node analyze-complexity.js <directory>");
    console.log("Example: node analyze-complexity.js src/");
    process.exit(1);
  }

  const directory = args[0];

  if (!fs.existsSync(directory)) {
    console.error(`Error: ${directory} is not a valid directory`);
    process.exit(1);
  }

  const analyzer = new ComplexityAnalyzer();
  const issues = analyzer.analyzeDirectory(directory);

  console.log(analyzer.generateReport(issues));

  // Exit with non-zero if CRITICAL or HIGH issues found
  const criticalIssues = issues.filter((i) => ["CRITICAL", "HIGH"].includes(i.severity));
  if (criticalIssues.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
