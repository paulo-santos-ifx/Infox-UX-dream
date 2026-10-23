#!/usr/bin/env node

/**
 * Code Review Integration Script
 *
 * Helps integrate the critical-code-review skill with the refactoring workflow.
 *
 * Usage:
 *   node scripts/review.js              # Review changes from git diff
 *   node scripts/review.js src/         # Review specific directory
 *   node scripts/review.js --quick      # Quick analysis without detailed suggestions
 *   node scripts/review.js --init       # Create review template
 */

const fs = require("fs");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

// Colors
const colors = {
  RED: "\x1b[0;31m",
  YELLOW: "\x1b[1;33m",
  GREEN: "\x1b[0;32m",
  BLUE: "\x1b[0;34m",
  NC: "\x1b[0m", // No Color
};

class ReviewHelper {
  constructor() {
    this.targetDir = ".";
    this.quickMode = false;
    this.refactorDir = ".refactor";
    this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);

    for (const arg of args) {
      if (arg === "--quick") {
        this.quickMode = true;
      } else if (arg === "--init") {
        this.createReviewTemplate();
        process.exit(0);
      } else if (arg === "--help" || arg === "-h") {
        this.printHelp();
        process.exit(0);
      } else if (fs.existsSync(arg)) {
        this.targetDir = arg;
      }
    }
  }

  printHelp() {
    console.log(`
Code Review Integration Script

Usage:
  node scripts/review.js [OPTIONS] [DIRECTORY]

Options:
  --quick       Quick analysis without detailed suggestions
  --init        Create review template
  --help, -h    Show this help message

Examples:
  node scripts/review.js                # Review current directory
  node scripts/review.js src/           # Review specific directory
  node scripts/review.js --quick        # Quick analysis
    `);
  }

  header(text) {
    console.log(`${colors.BLUE}═══════════════════════════════════════${colors.NC}`);
    console.log(`${colors.BLUE}${text}${colors.NC}`);
    console.log(`${colors.BLUE}═══════════════════════════════════════${colors.NC}`);
  }

  section(text) {
    console.log(`\n${colors.YELLOW}→ ${text}${colors.NC}`);
  }

  success(text) {
    console.log(`${colors.GREEN}✔ ${text}${colors.NC}`);
  }

  warning(text) {
    console.log(`${colors.YELLOW}⚠ ${text}${colors.NC}`);
  }

  error(text) {
    console.log(`${colors.RED}✗ ${text}${colors.NC}`);
  }

  readContext() {
    if (fs.existsSync(path.join(this.refactorDir, "task.md"))) {
      this.success("Found task.md");
      console.log("Objective:");

      const content = fs.readFileSync(path.join(this.refactorDir, "task.md"), "utf-8");
      const lines = content.split("\n").slice(0, 3);
      lines.forEach((line) => console.log(`  ${line}`));
    } else {
      this.warning("No .refactor/task.md found (skipping context)");
    }
  }

  getModifiedFiles() {
    try {
      const result = execSync("git diff --name-only", { encoding: "utf-8" });
      return result
        .trim()
        .split("\n")
        .filter((f) => f);
    } catch (error) {
      return [];
    }
  }

  analyzeChanges() {
    if (execSync("git status", { encoding: "utf-8", stdio: "pipe" }).length === 0) {
      return;
    }

    this.success("Git detected");

    const modifiedFiles = this.getModifiedFiles();

    if (modifiedFiles.length === 0) {
      this.warning("No modified files detected");
      return;
    }

    console.log("Modified files:");
    modifiedFiles.forEach((file) => console.log(`  ${file}`));

    // Group by type
    const byType = {};
    for (const file of modifiedFiles) {
      const ext = path.extname(file);
      if (!byType[ext]) byType[ext] = [];
      byType[ext].push(file);
    }

    console.log("\nSummary by file type:");
    for (const [ext, files] of Object.entries(byType)) {
      console.log(`  ${ext}: ${files.length} file(s)`);
    }
  }

  runComplexityAnalysis() {
    const analyzerPath = path.join(__dirname, "analyze-complexity.js");

    if (!fs.existsSync(analyzerPath)) {
      this.warning("analyze-complexity.js not found");
      return;
    }

    this.success("Running complexity analyzer");

    try {
      execFileSync(process.execPath, [analyzerPath, this.targetDir], { stdio: "inherit" });
    } catch (error) {
      // Script may exit with code 1 if issues found, which is expected
      if (error.status !== 1) {
        throw error;
      }
    }
  }

  printArchitectureChecklist() {
    console.log("Architecture Review:");
    const checks = [
      "Does this reduce coupling?",
      "Does this improve reuse?",
      "Does this respect project structure?",
      "Are SOLID principles followed?",
    ];
    checks.forEach((check) => console.log(`  ☐ ${check}`));
  }

  printCodeQualityChecklist() {
    console.log("Code Quality:");
    const checks = [
      "Any functions longer than 30 lines?",
      "Any nesting deeper than 3 levels?",
      "Any duplicate code patterns?",
      "Are variable names clear?",
      "Any unnecessary complexity?",
    ];
    checks.forEach((check) => console.log(`  ☐ ${check}`));
  }

  printMaintainabilityChecklist() {
    console.log("Maintainability:");
    const checks = [
      "Would a new dev understand this?",
      "Is the API clear?",
      "Will this scale?",
      "Is it easy to modify?",
      "Are error cases handled?",
    ];
    checks.forEach((check) => console.log(`  ☐ ${check}`));
  }

  printRiskChecklist() {
    console.log("Risk Analysis:");
    const checks = [
      "Any broken imports?",
      "Any circular dependencies?",
      "Backward compatibility broken?",
      "Any unexpected side effects?",
      "Missing error handling?",
    ];
    checks.forEach((check) => console.log(`  ☐ ${check}`));
  }

  printPerformanceChecklist() {
    console.log("Frontend concerns:");
    const frontendChecks = [
      "Inline functions in JSX?",
      "Unnecessary re-renders?",
      "Heavy imports?",
      "Memoization needed?",
    ];
    frontendChecks.forEach((check) => console.log(`  ☐ ${check}`));

    console.log("\nBackend concerns:");
    const backendChecks = [
      "N+1 query patterns?",
      "Unnecessary database calls?",
      "Inefficient loops?",
      "Missing indexes?",
    ];
    backendChecks.forEach((check) => console.log(`  ☐ ${check}`));
  }

  createReviewTemplate() {
    if (!fs.existsSync(this.refactorDir)) {
      fs.mkdirSync(this.refactorDir, { recursive: true });
    }

    const reviewPath = path.join(this.refactorDir, "review.md");

    if (fs.existsSync(reviewPath)) {
      this.warning(`Review template already exists at ${reviewPath}`);
      return;
    }

    const template = `# Code Review Report

## Context

**Objective:** [What was being done]

**Files modified:** [List files]

**Scope:** [How large is this change]

## Architecture Review

**Positive observations:**
- [Improvement 1]
- [Improvement 2]

**Warnings:**
- ⚠ [Issue 1]

**Critical issues:**
- ✗ [Issue that blocks merge]

## Code Quality Review

### Issue 1
- **Type:** [LongFunction/DeepNesting/etc]
- **Severity:** [CRITICAL/HIGH/MEDIUM/LOW]
- **Description:** [What's wrong]
- **Suggestion:** [How to fix]

## Maintainability Review

- **API Clarity:** ✔/⚠/✗ [Comment]
- **Scalability:** ✔/⚠/✗ [Comment]
- **Testability:** ✔/⚠/✗ [Comment]
- **Code Organization:** ✔/⚠/✗ [Comment]

## Risk Analysis

### Risk 1
- **Description:** [Potential regression]
- **Severity:** [LOW/MEDIUM/HIGH]
- **Mitigation:** [How to reduce risk]

## Performance Check

- **Concern:** [Possible performance issue]
- **Impact:** [When it matters]
- **Fix:** [Suggestion]

## Improvement Suggestions

### Priority 1 (Do This First)
1. [Specific action]
2. [Specific action]

### Priority 2 (Do This Soon)
1. [Specific action]
2. [Specific action]

### Priority 3 (Nice to Have)
1. [Specific action]

## Summary

**Verdict:** ✔ Approved / ⚠ Approved with concerns / ✗ Needs rework

**Key Takeaway:** [One sentence summary]

**Next Steps:** [What to do next]

---
Generated: ${new Date().toISOString()}
`;

    fs.writeFileSync(reviewPath, template);
    this.success(`Created review template: ${reviewPath}`);
  }

  run() {
    this.header("Code Review Analysis");

    this.section("Step 1: Reading context files");
    this.readContext();

    this.section("Step 2: Analyzing code changes");
    try {
      this.analyzeChanges();
    } catch (error) {
      this.warning("Git not available, will analyze directory instead");
    }

    this.section("Step 3: Running complexity analysis");
    this.runComplexityAnalysis();

    this.section("Step 4: Review checklist");
    this.printArchitectureChecklist();
    console.log();
    this.printCodeQualityChecklist();
    console.log();
    this.printMaintainabilityChecklist();
    console.log();
    this.printRiskChecklist();

    if (!this.quickMode) {
      console.log();
      this.section("Step 5: Performance check");
      this.printPerformanceChecklist();
    }

    this.header("Review Summary");

    const reviewPath = path.join(this.refactorDir, "review.md");
    if (fs.existsSync(reviewPath)) {
      this.success("Review file found:");
      const content = fs.readFileSync(reviewPath, "utf-8");
      const lines = content.split("\n");
      const lastLines = lines.slice(-15).join("\n");
      console.log(lastLines);
    } else {
      console.log(`Create review file at: ${reviewPath}`);
      console.log(`Run: node scripts/review.js --init`);
    }
  }
}

// Main
const helper = new ReviewHelper();
helper.run();
