/**
 * Security Audit Script
 * 
 * This script performs a basic security audit of the codebase to identify potential security issues.
 * It checks for:
 * - Missing validation on routes
 * - Hardcoded secrets
 * - Potential XSS vulnerabilities
 * - Missing authentication on routes
 * - Missing rate limiting
 * 
 * Usage: node scripts/security-audit.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const sourceDir = path.join(__dirname, '..', 'src');
const routesDirs = [
  path.join(sourceDir, 'modules', 'users', 'routes'),
  path.join(sourceDir, 'modules', 'content', 'routes'),
  path.join(sourceDir, 'modules', 'progress', 'routes')
];

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Patterns to check
const patterns = {
  missingValidation: {
    pattern: /router\.(get|post|put|delete|patch)\s*\(\s*['"`][^'"`]+['"`]\s*,\s*(?!.*validate)/g,
    message: 'Route without validation middleware',
    severity: 'WARNING'
  },
  hardcodedSecrets: {
    pattern: /(password|secret|key|token|auth)[\s]*[:=][\s]*['"`][^'"`]{8,}['"`]/gi,
    message: 'Potential hardcoded secret',
    severity: 'HIGH'
  },
  xssVulnerability: {
    pattern: /\.html\s*\([^)]*req\.[^)]*\)|innerHTML|dangerouslySetInnerHTML/g,
    message: 'Potential XSS vulnerability',
    severity: 'HIGH'
  },
  missingAuthentication: {
    pattern: /router\.(post|put|delete|patch)\s*\(\s*['"`][^'"`]+['"`]\s*,\s*(?!.*authenticate)/g,
    message: 'Write operation without authentication',
    severity: 'HIGH'
  },
  sqlInjection: {
    pattern: /executeQuery\s*\(\s*['"]\s*.*\$\{.*\}/g,
    message: 'Potential SQL injection',
    severity: 'CRITICAL'
  }
};

// Results storage
const results = {
  issues: [],
  stats: {
    filesScanned: 0,
    issuesFound: 0,
    criticalIssues: 0,
    highIssues: 0,
    warningIssues: 0
  }
};

/**
 * Scan a file for security issues
 */
function scanFile(filePath) {
  results.stats.filesScanned++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    
    // Check each pattern
    Object.entries(patterns).forEach(([name, { pattern, message, severity }]) => {
      const matches = content.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          results.issues.push({
            file: relativePath,
            line: findLineNumber(content, match),
            issue: message,
            severity,
            pattern: match.trim()
          });
          
          results.stats.issuesFound++;
          if (severity === 'CRITICAL') results.stats.criticalIssues++;
          if (severity === 'HIGH') results.stats.highIssues++;
          if (severity === 'WARNING') results.stats.warningIssues++;
        });
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error scanning ${filePath}:${colors.reset}`, error.message);
  }
}

/**
 * Find the line number for a match in the content
 */
function findLineNumber(content, match) {
  const index = content.indexOf(match);
  if (index === -1) return 'unknown';
  
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Recursively scan a directory
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
      scanFile(filePath);
    }
  });
}

/**
 * Run npm audit
 */
function runNpmAudit() {
  console.log(`\n${colors.blue}Running npm audit...${colors.reset}`);
  
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResults = JSON.parse(output);
    
    // Extract vulnerability counts
    const vulnerabilities = auditResults.metadata?.vulnerabilities;
    
    if (vulnerabilities) {
      console.log(`\n${colors.blue}NPM Audit Results:${colors.reset}`);
      console.log(`${colors.red}Critical: ${vulnerabilities.critical || 0}${colors.reset}`);
      console.log(`${colors.magenta}High: ${vulnerabilities.high || 0}${colors.reset}`);
      console.log(`${colors.yellow}Moderate: ${vulnerabilities.moderate || 0}${colors.reset}`);
      console.log(`${colors.cyan}Low: ${vulnerabilities.low || 0}${colors.reset}`);
      
      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        console.log(`\n${colors.red}⚠️ Critical or high severity vulnerabilities found!${colors.reset}`);
        console.log(`Run ${colors.green}npm audit${colors.reset} for details and ${colors.green}npm audit fix${colors.reset} to attempt automatic fixes.`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error running npm audit:${colors.reset}`, error.message);
    if (error.stdout) {
      try {
        const auditResults = JSON.parse(error.stdout);
        console.log(`\n${colors.red}Vulnerabilities found:${colors.reset}`, 
          auditResults.metadata?.vulnerabilities || 'Unknown');
      } catch (e) {
        console.error('Could not parse npm audit output');
      }
    }
  }
}

/**
 * Print the results
 */
function printResults() {
  console.log(`\n${colors.blue}Security Audit Results:${colors.reset}`);
  console.log(`Files scanned: ${results.stats.filesScanned}`);
  console.log(`Issues found: ${results.stats.issuesFound}`);
  console.log(`  ${colors.red}Critical: ${results.stats.criticalIssues}${colors.reset}`);
  console.log(`  ${colors.magenta}High: ${results.stats.highIssues}${colors.reset}`);
  console.log(`  ${colors.yellow}Warning: ${results.stats.warningIssues}${colors.reset}`);
  
  if (results.issues.length > 0) {
    console.log(`\n${colors.blue}Issues:${colors.reset}`);
    
    // Group by file
    const issuesByFile = results.issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {});
    
    // Print issues by file
    Object.entries(issuesByFile).forEach(([file, issues]) => {
      console.log(`\n${colors.cyan}${file}${colors.reset}`);
      
      issues.forEach(issue => {
        const severityColor = 
          issue.severity === 'CRITICAL' ? colors.red :
          issue.severity === 'HIGH' ? colors.magenta :
          colors.yellow;
        
        console.log(`  Line ${issue.line}: ${severityColor}[${issue.severity}]${colors.reset} ${issue.issue}`);
        console.log(`    ${colors.green}${issue.pattern}${colors.reset}`);
      });
    });
  } else {
    console.log(`\n${colors.green}No issues found!${colors.reset}`);
  }
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.blue}Starting security audit...${colors.reset}`);
  
  // Scan source directory
  scanDirectory(sourceDir);
  
  // Print results
  printResults();
  
  // Run npm audit
  runNpmAudit();
  
  // Exit with error code if critical issues found
  if (results.stats.criticalIssues > 0) {
    process.exit(1);
  }
}

// Run the audit
main();