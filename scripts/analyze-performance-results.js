// 🚀 Performance Results Analyzer
// Analyzes k6 performance test results and generates comparison reports

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
    constructor(resultsDir) {
        this.resultsDir = resultsDir;
        this.results = {};
        this.analysis = {};
    }

    // Load all JSON result files
    loadResults() {
        const files = fs.readdirSync(this.resultsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        jsonFiles.forEach(file => {
            const filePath = path.join(this.resultsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Extract test type from filename
            const testType = file.split('_')[0];
            this.results[testType] = data;
        });

        console.log(`📊 Loaded ${Object.keys(this.results).length} test result files`);
    }

    // Analyze response times
    analyzeResponseTimes(data) {
        const responseTimes = data.map(point => point.metric === 'http_req_duration' ? point.data.value : null)
            .filter(time => time !== null);

        if (responseTimes.length === 0) return null;

        responseTimes.sort((a, b) => a - b);

        return {
            min: Math.min(...responseTimes),
            max: Math.max(...responseTimes),
            avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            p50: this.percentile(responseTimes, 50),
            p95: this.percentile(responseTimes, 95),
            p99: this.percentile(responseTimes, 99),
            count: responseTimes.length
        };
    }

    // Calculate percentile
    percentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[index];
    }

    // Analyze error rates
    analyzeErrorRates(data) {
        const totalRequests = data.filter(point => point.metric === 'http_req_duration').length;
        const failedRequests = data.filter(point => point.metric === 'http_req_failed' && point.data.value === 1).length;
        
        return {
            total: totalRequests,
            failed: failedRequests,
            errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0
        };
    }

    // Analyze throughput
    analyzeThroughput(data) {
        const startTime = Math.min(...data.map(point => point.data.time));
        const endTime = Math.max(...data.map(point => point.data.time));
        const duration = (endTime - startTime) / 1000; // Convert to seconds
        
        const totalRequests = data.filter(point => point.metric === 'http_req_duration').length;
        
        return {
            duration: duration,
            totalRequests: totalRequests,
            requestsPerSecond: duration > 0 ? totalRequests / duration : 0
        };
    }

    // Analyze all test results
    analyzeAll() {
        Object.keys(this.results).forEach(testType => {
            const data = this.results[testType];
            
            this.analysis[testType] = {
                responseTimes: this.analyzeResponseTimes(data),
                errorRates: this.analyzeErrorRates(data),
                throughput: this.analyzeThroughput(data)
            };
        });
    }

    // Generate comparison report
    generateComparisonReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {},
            comparison: {},
            recommendations: []
        };

        // Generate summary
        Object.keys(this.analysis).forEach(testType => {
            const analysis = this.analysis[testType];
            report.summary[testType] = {
                avgResponseTime: analysis.responseTimes?.avg || 0,
                p95ResponseTime: analysis.responseTimes?.p95 || 0,
                errorRate: analysis.errorRates?.errorRate || 0,
                throughput: analysis.throughput?.requestsPerSecond || 0
            };
        });

        // Generate comparison
        const testTypes = Object.keys(this.analysis);
        if (testTypes.length >= 2) {
            report.comparison = this.compareTestTypes(testTypes);
        }

        // Generate recommendations
        report.recommendations = this.generateRecommendations();

        return report;
    }

    // Compare different test types
    compareTestTypes(testTypes) {
        const comparison = {};

        // Compare response times
        comparison.responseTime = {};
        testTypes.forEach(testType => {
            const p95 = this.analysis[testType].responseTimes?.p95 || 0;
            comparison.responseTime[testType] = p95;
        });

        // Compare error rates
        comparison.errorRate = {};
        testTypes.forEach(testType => {
            const errorRate = this.analysis[testType].errorRates?.errorRate || 0;
            comparison.errorRate[testType] = errorRate;
        });

        // Compare throughput
        comparison.throughput = {};
        testTypes.forEach(testType => {
            const throughput = this.analysis[testType].throughput?.requestsPerSecond || 0;
            comparison.throughput[testType] = throughput;
        });

        return comparison;
    }

    // Generate recommendations based on analysis
    generateRecommendations() {
        const recommendations = [];

        Object.keys(this.analysis).forEach(testType => {
            const analysis = this.analysis[testType];
            
            // Response time recommendations
            if (analysis.responseTimes?.p95 > 500) {
                recommendations.push({
                    type: 'performance',
                    testType: testType,
                    issue: 'High response time',
                    recommendation: 'Optimize database queries and add caching'
                });
            }

            // Error rate recommendations
            if (analysis.errorRates?.errorRate > 5) {
                recommendations.push({
                    type: 'reliability',
                    testType: testType,
                    issue: 'High error rate',
                    recommendation: 'Check service health and error handling'
                });
            }

            // Throughput recommendations
            if (analysis.throughput?.requestsPerSecond < 10) {
                recommendations.push({
                    type: 'scalability',
                    testType: testType,
                    issue: 'Low throughput',
                    recommendation: 'Consider horizontal scaling or optimization'
                });
            }
        });

        return recommendations;
    }

    // Save analysis report
    saveReport(report, filename) {
        const reportPath = path.join(this.resultsDir, filename);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📋 Analysis report saved: ${reportPath}`);
    }

    // Generate markdown report
    generateMarkdownReport(report) {
        let markdown = `# 🚀 Performance Analysis Report\n\n`;
        markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;

        // Summary section
        markdown += `## 📊 Performance Summary\n\n`;
        markdown += `| Test Type | Avg Response Time | P95 Response Time | Error Rate | Throughput |\n`;
        markdown += `|-----------|------------------|------------------|------------|------------|\n`;

        Object.keys(report.summary).forEach(testType => {
            const summary = report.summary[testType];
            markdown += `| ${testType} | ${summary.avgResponseTime.toFixed(2)}ms | ${summary.p95ResponseTime.toFixed(2)}ms | ${summary.errorRate.toFixed(2)}% | ${summary.throughput.toFixed(2)} req/s |\n`;
        });

        // Comparison section
        if (Object.keys(report.comparison).length > 0) {
            markdown += `\n## 🔍 Performance Comparison\n\n`;
            
            // Response time comparison
            markdown += `### Response Time (P95)\n\n`;
            Object.keys(report.comparison.responseTime).forEach(testType => {
                const time = report.comparison.responseTime[testType];
                markdown += `- **${testType}**: ${time.toFixed(2)}ms\n`;
            });

            // Error rate comparison
            markdown += `\n### Error Rate\n\n`;
            Object.keys(report.comparison.errorRate).forEach(testType => {
                const rate = report.comparison.errorRate[testType];
                markdown += `- **${testType}**: ${rate.toFixed(2)}%\n`;
            });

            // Throughput comparison
            markdown += `\n### Throughput\n\n`;
            Object.keys(report.comparison.throughput).forEach(testType => {
                const throughput = report.comparison.throughput[testType];
                markdown += `- **${testType}**: ${throughput.toFixed(2)} req/s\n`;
            });
        }

        // Recommendations section
        if (report.recommendations.length > 0) {
            markdown += `\n## 💡 Recommendations\n\n`;
            report.recommendations.forEach(rec => {
                markdown += `### ${rec.type.toUpperCase()} - ${rec.testType}\n`;
                markdown += `- **Issue**: ${rec.issue}\n`;
                markdown += `- **Recommendation**: ${rec.recommendation}\n\n`;
            });
        }

        // Performance thresholds
        markdown += `\n## 🎯 Performance Thresholds\n\n`;
        markdown += `| Metric | Excellent | Good | Acceptable | Poor |\n`;
        markdown += `|--------|-----------|------|------------|------|\n`;
        markdown += `| Response Time (P95) | < 100ms | < 200ms | < 500ms | > 500ms |\n`;
        markdown += `| Error Rate | < 1% | < 3% | < 5% | > 5% |\n`;
        markdown += `| Throughput | > 100 req/s | > 50 req/s | > 20 req/s | < 20 req/s |\n`;

        return markdown;
    }
}

// Main execution
function main() {
    const resultsDir = process.argv[2] || './performance-results';
    
    if (!fs.existsSync(resultsDir)) {
        console.error('❌ Results directory does not exist:', resultsDir);
        process.exit(1);
    }

    console.log('🚀 Starting Performance Analysis...');
    console.log(`📁 Results Directory: ${resultsDir}`);

    const analyzer = new PerformanceAnalyzer(resultsDir);
    
    try {
        // Load and analyze results
        analyzer.loadResults();
        analyzer.analyzeAll();
        
        // Generate reports
        const report = analyzer.generateComparisonReport();
        const markdown = analyzer.generateMarkdownReport(report);
        
        // Save reports
        analyzer.saveReport(report, 'performance_analysis.json');
        fs.writeFileSync(path.join(resultsDir, 'performance_analysis.md'), markdown);
        
        console.log('✅ Performance analysis completed!');
        console.log('📋 Reports generated:');
        console.log('  • performance_analysis.json');
        console.log('  • performance_analysis.md');
        
    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = PerformanceAnalyzer;
