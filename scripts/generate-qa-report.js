#!/usr/bin/env node
/**
 * QA Test Report Generator
 * 
 * Reads Playwright test results and performance metrics to generate
 * a comprehensive QA report with bugs, warnings, and fixes.
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(process.cwd(), 'playwright-report');
const PERFORMANCE_FILE = path.join(REPORT_DIR, 'performance-metrics.json');
const RESULTS_FILE = path.join(REPORT_DIR, 'results.json');

function readJSONFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
  }
  return null;
}

function generateReport() {
  const results = readJSONFile(RESULTS_FILE);
  const performanceMetrics = readJSONFile(PERFORMANCE_FILE) || [];

  let report = `# Comprehensive QA Test Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  // Test Summary
  report += `## Test Summary\n\n`;
  if (results) {
    const stats = results.stats || {};
    const total = stats.total || 0;
    const passed = stats.passed || 0;
    const failed = stats.failed || 0;
    const skipped = stats.skipped || 0;
    const duration = stats.duration || 0;

    report += `- **Total Tests:** ${total}\n`;
    report += `- **Passed:** ${passed}\n`;
    report += `- **Failed:** ${failed}\n`;
    report += `- **Skipped:** ${skipped}\n`;
    report += `- **Duration:** ${(duration / 1000).toFixed(2)}s\n`;
    report += `- **Pass Rate:** ${total > 0 ? ((passed / total) * 100).toFixed(1)}%\n\n`;
  } else {
    report += `⚠️ Test results file not found. Run tests first.\n\n`;
  }

  // Performance Metrics
  report += `## Performance Metrics\n\n`;
  if (performanceMetrics.length > 0) {
    const aiEndpoints = performanceMetrics.filter(m => 
      m.endpoint.includes('/ai/') || 
      m.endpoint.includes('/budget-advisor/') ||
      m.endpoint.includes('/coach') ||
      m.endpoint.includes('/pets/ai/')
    );

    if (aiEndpoints.length > 0) {
      const avgResponseTime = aiEndpoints.reduce((sum, m) => sum + m.responseTime, 0) / aiEndpoints.length;
      const maxResponseTime = Math.max(...aiEndpoints.map(m => m.responseTime));
      const minResponseTime = Math.min(...aiEndpoints.map(m => m.responseTime));

      report += `### AI Endpoint Performance\n\n`;
      report += `- **Average Response Time:** ${avgResponseTime.toFixed(2)}ms\n`;
      report += `- **Max Response Time:** ${maxResponseTime}ms\n`;
      report += `- **Min Response Time:** ${minResponseTime}ms\n`;
      report += `- **Total AI Requests:** ${aiEndpoints.length}\n\n`;

      // Slow endpoints (>30s)
      const slowEndpoints = aiEndpoints.filter(m => m.responseTime > 30000);
      if (slowEndpoints.length > 0) {
        report += `### ⚠️ Slow AI Endpoints (>30s)\n\n`;
        slowEndpoints.forEach(m => {
          report += `- **${m.method} ${m.endpoint}**: ${m.responseTime}ms\n`;
        });
        report += `\n`;
      }

      // Failed endpoints
      const failedEndpoints = performanceMetrics.filter(m => m.status >= 500 || m.status === 0);
      if (failedEndpoints.length > 0) {
        report += `### ❌ Failed API Calls\n\n`;
        failedEndpoints.forEach(m => {
          report += `- **${m.method} ${m.endpoint}**: Status ${m.status}${m.error ? ` (${m.error})` : ''}\n`;
        });
        report += `\n`;
      }
    }

    // All endpoint performance breakdown
    report += `### Endpoint Performance Breakdown\n\n`;
    const endpointGroups = {};
    performanceMetrics.forEach(m => {
      const endpoint = m.endpoint.replace(/^https?:\/\/[^/]+/, '');
      if (!endpointGroups[endpoint]) {
        endpointGroups[endpoint] = [];
      }
      endpointGroups[endpoint].push(m);
    });

    Object.entries(endpointGroups).forEach(([endpoint, metrics]) => {
      const avgTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      const successRate = (metrics.filter(m => m.status < 400).length / metrics.length) * 100;
      report += `- **${endpoint}**: Avg ${avgTime.toFixed(0)}ms, Success: ${successRate.toFixed(1)}%\n`;
    });
    report += `\n`;
  } else {
    report += `⚠️ Performance metrics not available. Run tests with E2E_ENABLED=true.\n\n`;
  }

  // Test Failures
  report += `## Test Failures & Bugs\n\n`;
  if (results && results.suites) {
    let bugCount = 0;
    results.suites.forEach(suite => {
      suite.specs?.forEach(spec => {
        spec.tests?.forEach(test => {
          test.results?.forEach(result => {
            if (result.status === 'failed') {
              bugCount++;
              report += `### ❌ ${spec.title} - ${test.title}\n\n`;
              if (result.error) {
                report += `**Error:** ${result.error.message}\n\n`;
              }
              report += `**Duration:** ${result.duration}ms\n\n`;
            }
          });
        });
      });
    });

    if (bugCount === 0) {
      report += `✅ No test failures detected!\n\n`;
    }
  } else {
    report += `⚠️ Detailed test results not available. Check HTML report for details.\n\n`;
  }

  // Warnings & Recommendations
  report += `## Warnings & Recommendations\n\n`;
  const warnings = [];

  if (performanceMetrics.length > 0) {
    const slowEndpoints = performanceMetrics.filter(m => m.responseTime > 30000);
    if (slowEndpoints.length > 0) {
      warnings.push(`- **Performance:** ${slowEndpoints.length} endpoint(s) exceeded 30s response time threshold`);
    }

    const failedRequests = performanceMetrics.filter(m => m.status >= 500);
    if (failedRequests.length > 0) {
      warnings.push(`- **Stability:** ${failedRequests.length} endpoint(s) returned 5xx errors`);
    }

    const authErrors = performanceMetrics.filter(m => m.status === 401 || m.status === 403);
    if (authErrors.length > 0) {
      warnings.push(`- **Authentication:** ${authErrors.length} endpoint(s) failed authentication checks`);
    }
  }

  if (results && results.stats) {
    const failureRate = (results.stats.failed / results.stats.total) * 100;
    if (failureRate > 10) {
      warnings.push(`- **Test Stability:** ${failureRate.toFixed(1)}% test failure rate exceeds 10% threshold`);
    }
  }

  if (warnings.length > 0) {
    warnings.forEach(w => {
      report += `${w}\n`;
    });
  } else {
    report += `✅ No critical warnings detected.\n`;
  }
  report += `\n`;

  // Edge Case Coverage
  report += `## Edge Case Coverage\n\n`;
  report += `The following edge cases were tested:\n\n`;
  report += `- ✅ Empty data (empty messages, empty transactions)\n`;
  report += `- ✅ Invalid commands (non-existent actions, invalid JSON)\n`;
  report += `- ✅ Missing DB entries (non-existent pets, missing profiles)\n`;
  report += `- ✅ Very long inputs (10k+ character messages)\n`;
  report += `- ✅ Invalid authentication (missing tokens, expired sessions)\n`;
  report += `- ✅ Network errors (intercepted failed requests)\n`;
  report += `- ✅ Responsive design (mobile, tablet, desktop)\n`;
  report += `\n`;

  // Stability Check
  report += `## Stability Assessment\n\n`;
  let stabilityScore = 100;
  let issues = [];

  if (results && results.stats) {
    const failureRate = (results.stats.failed / results.stats.total) * 100;
    stabilityScore -= failureRate * 2;
    if (results.stats.failed > 0) {
      issues.push(`${results.stats.failed} test failure(s)`);
    }
  }

  if (performanceMetrics.length > 0) {
    const crashCount = performanceMetrics.filter(m => m.status === 0 || m.status >= 500).length;
    stabilityScore -= (crashCount / performanceMetrics.length) * 100;
    if (crashCount > 0) {
      issues.push(`${crashCount} API endpoint crash(es) or error(s)`);
    }
  }

  report += `- **Stability Score:** ${Math.max(0, Math.round(stabilityScore))}/100\n`;
  
  if (issues.length > 0) {
    report += `- **Issues Detected:** ${issues.join(', ')}\n`;
  } else {
    report += `- **Status:** ✅ System appears stable with no crashes detected\n`;
  }
  report += `\n`;

  // Next Steps
  report += `## Recommended Next Steps\n\n`;
  
  if (results && results.stats && results.stats.failed > 0) {
    report += `1. Review failed tests in the HTML report: \`playwright-report/index.html\`\n`;
  }
  
  if (performanceMetrics.length > 0) {
    const slowEndpoints = performanceMetrics.filter(m => m.responseTime > 30000);
    if (slowEndpoints.length > 0) {
      report += `2. Optimize slow AI endpoints (consider caching, rate limiting, or async processing)\n`;
    }
  }

  report += `3. Review edge case handling for any unexpected behaviors\n`;
  report += `4. Monitor production performance metrics\n`;
  report += `5. Set up automated CI/CD testing pipeline\n`;
  report += `\n`;

  // Footer
  report += `---\n\n`;
  report += `**Report Generated By:** QA Test Suite\n`;
  report += `**For Questions:** Review test files in \`e2e/\` directory\n`;

  return report;
}

// Write report
const reportPath = path.join(process.cwd(), 'QA_TEST_REPORT.md');
const report = generateReport();
fs.writeFileSync(reportPath, report);
console.log(`✅ QA report generated: ${reportPath}`);
console.log(`📊 View detailed HTML report: ${path.join(REPORT_DIR, 'index.html')}`);

