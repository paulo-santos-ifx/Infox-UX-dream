#!/usr/bin/env node

/**
 * Review Quality Validator
 *
 * Validates that code reviews meet quality standards:
 * - All CRITICAL/HIGH issues have specific suggestions
 * - Severity levels are justified
 * - Recommendations are actionable
 * - No generic criticism
 *
 * Usage:
 *   node scripts/validate-review.js .refactor/review.md
 */

const fs = require("fs");
const path = require("path");

class ReviewValidator {
  constructor(reviewPath) {
    this.reviewPath = reviewPath;
    this.issues = [];
    this.content = "";
  }

  validate() {
    if (!fs.existsSync(this.reviewPath)) {
      console.error(`Review file not found: ${this.reviewPath}`);
      process.exit(1);
    }

    this.content = fs.readFileSync(this.reviewPath, "utf-8");
    const validations = [
      this.validateStructure.bind(this),
      this.validateSeverityLevels.bind(this),
      this.validateActionability.bind(this),
      this.validateSpecificity.bind(this),
      this.validateSuggestions.bind(this),
    ];

    for (const validation of validations) {
      validation();
    }

    return this.generateReport();
  }

  validateStructure() {
    const requiredSections = [
      "## Context",
      "## Code Quality",
      "## Improvement Suggestions",
      "## Summary",
    ];

    for (const section of requiredSections) {
      if (!this.content.includes(section)) {
        this.issues.push({
          type: "STRUCTURE",
          severity: "MEDIUM",
          message: `Missing required section: "${section}"`,
          suggestion: `Add section: ${section}`,
        });
      }
    }
  }

  validateSeverityLevels() {
    const criticalHighPattern = /(\*\*Severity:\*\*\s*(CRITICAL|HIGH))|🔴|🟠/g;
    const matches = this.content.match(criticalHighPattern) || [];

    for (const match of matches) {
      // For each CRITICAL/HIGH, check if there's a specific suggestion nearby
      const sections = this.content.split(/(?=### |## )/);

      for (const section of sections) {
        if (
          ((section.includes("CRITICAL") || section.includes("HIGH")) && section.includes("🔴")) ||
          section.includes("🟠")
        ) {
          if (!section.match(/Suggestion:|Fix:|Recommendation:/i)) {
            this.issues.push({
              type: "SEVERITY",
              severity: "HIGH",
              message: "CRITICAL/HIGH severity issue without specific suggestion found",
              suggestion:
                'Every CRITICAL/HIGH issue must have a clear "Suggestion:" or "Fix:" line with specific actions',
            });
          }
        }
      }
    }
  }

  validateActionability() {
    const vaguePhrases = [
      /\bshould\s+be\b/i,
      /\bneeds?\s+to\s+be\b/i,
      /\bcould\s+be\b/i,
      /\bmight\s+want\s+to\b/i,
      /\bmake\s+it\s+better/i,
      /\bimprove\s+this/i,
      /\bthink\s+about/i,
      /\bconsider\s+this/i,
    ];

    let vagueCount = 0;

    for (const phrase of vaguePhrases) {
      const matches = this.content.match(phrase) || [];
      if (matches.length > 0) {
        vagueCount += matches.length;
      }
    }

    if (vagueCount > 3) {
      this.issues.push({
        type: "ACTIONABILITY",
        severity: "MEDIUM",
        message: `Found ${vagueCount} vague phrases instead of specific actions`,
        suggestion:
          "Replace vague language with specific recommendations:\n" +
          '  ❌ "should be refactored"\n' +
          '  ✅ "Extract renderButton into separate function"',
      });
    }
  }

  validateSpecificity() {
    const lines = this.content.split("\n");
    let hasGenericIssue = false;

    const genericPatterns = [
      /^- \w+\s*$/, // Single word items
      /this is (bad|wrong|not good)/i,
      /improve (this|the code)/i,
      /make it (better|cleaner)/i,
    ];

    for (const line of lines) {
      for (const pattern of genericPatterns) {
        if (pattern.test(line)) {
          hasGenericIssue = true;
          break;
        }
      }
    }

    if (hasGenericIssue) {
      this.issues.push({
        type: "SPECIFICITY",
        severity: "MEDIUM",
        message: "Review contains generic/vague criticism without specific details",
        suggestion:
          "Example of good criticism:\n" +
          '  "Function calculateTotal() has 35 lines and 5 nested conditions.\n' +
          '   Recommendation: Extract discount calculation logic into separate function."',
      });
    }
  }

  validateSuggestions() {
    const suggestionSections = this.content.split(/(?=###|##)/);
    let suggestionsCount = 0;

    for (const section of suggestionSections) {
      if (
        section.includes("Suggestion:") ||
        section.includes("Fix:") ||
        section.includes("Recommendation:") ||
        section.includes("Recommendation:")
      ) {
        suggestionsCount++;
      }
    }

    if (suggestionsCount === 0) {
      this.issues.push({
        type: "SUGGESTIONS",
        severity: "HIGH",
        message: "Review contains no improvement suggestions",
        suggestion: 'Add "## Improvement Suggestions" section with actionable items',
      });
    }
  }

  generateReport() {
    if (this.issues.length === 0) {
      return {
        valid: true,
        message: "✅ Review meets quality standards",
        issues: [],
      };
    }

    const byType = {};
    for (const issue of this.issues) {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    }

    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    this.issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      valid: !this.issues.some((i) => i.severity === "HIGH"),
      message: `Found ${this.issues.length} review quality issues`,
      issues: this.issues,
    };
  }

  printReport(report) {
    const colors = {
      RED: "\x1b[0;31m",
      YELLOW: "\x1b[1;33m",
      GREEN: "\x1b[0;32m",
      NC: "\x1b[0m",
    };

    if (report.valid) {
      console.log(`${colors.GREEN}${report.message}${colors.NC}`);
      return;
    }

    console.log(`${colors.YELLOW}Review Quality Validation${colors.NC}`);
    console.log(`${colors.YELLOW}═══════════════════════════${colors.NC}\n`);

    for (const issue of report.issues) {
      const icon = issue.severity === "HIGH" ? "🔴" : issue.severity === "MEDIUM" ? "🟡" : "🟢";
      console.log(`${icon} ${issue.type}`);
      console.log(`   ${issue.message}`);
      console.log(`   Suggestion: ${issue.suggestion.replace(/\n/g, "\n   ")}`);
      console.log();
    }

    console.log(`${colors.YELLOW}Summary:${colors.NC}`);
    console.log(`${report.message}`);
  }
}

// Main
const reviewPath = process.argv[2] || ".refactor/review.md";

const validator = new ReviewValidator(reviewPath);
const report = validator.validate();

validator.printReport(report);

if (!report.valid) {
  process.exit(1);
}
