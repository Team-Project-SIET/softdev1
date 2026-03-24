/**
 * Finance Routes Testing Script
 * 
 * Run with: bun test-finance.ts
 * 
 * Tests all finance endpoints with mock data:
 * - Dashboard Summary
 * - SCB Sync
 * - List Transactions
 * - Record Transaction
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT = 5000;

interface TestResult {
  endpoint: string;
  method: string;
  status: string;
  statusCode?: number;
  duration: number;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// ============================================
// Test Utilities
// ============================================

async function testEndpoint(
  name: string,
  method: 'GET' | 'POST',
  endpoint: string,
  data?: any
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;

  try {
    console.log(`\n📡 Testing: ${method} ${endpoint}`);
    console.log(`   URL: ${url}`);

    let response;

    if (method === 'GET') {
      response = await axios.get(url, { timeout: TIMEOUT });
    } else {
      console.log(`   Payload: ${JSON.stringify(data, null, 2)}`);
      response = await axios.post(url, data, { timeout: TIMEOUT });
    }

    const duration = Date.now() - startTime;

    console.log(`   ✅ Status: ${response.status} OK`);
    console.log(`   ⏱️  Duration: ${duration}ms`);

    if (response.data?.data) {
      console.log(`   📦 Response: ${JSON.stringify(response.data.data, null, 2).substring(0, 200)}...`);
    } else {
      console.log(`   📦 Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    }

    return {
      endpoint,
      method,
      status: 'PASSED',
      statusCode: response.status,
      duration,
      success: true,
      data: response.data,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(`   ❌ Error: ${errorMessage}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);

    return {
      endpoint,
      method,
      status: 'FAILED',
      statusCode: (error as any)?.response?.status,
      duration,
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// Test Cases
// ============================================

async function runTests() {
  console.log(`
╔════════════════════════════════════════════╗
║   🧪 Finance Routes Test Suite             ║
║   Base URL: ${BASE_URL.padEnd(30)} ║
╚════════════════════════════════════════════╝
  `);

  // Test 1: Health Check
  console.log('\n\n🔍 Test Suite 1: Health Check');
  console.log('━'.repeat(50));
  results.push(
    await testEndpoint(
      'Health Check',
      'GET',
      '/api/health'
    )
  );

  // Test 2: Dashboard Summary - Default (last 30 days)
  console.log('\n\n🔍 Test Suite 2: Dashboard Summary');
  console.log('━'.repeat(50));

  results.push(
    await testEndpoint(
      'Dashboard Summary - Last 30 Days',
      'GET',
      '/api/finance/dashboard/summary'
    )
  );

  // Test 3: Dashboard Summary - Date Range
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fromDate = sevenDaysAgo.toISOString();
  const toDate = now.toISOString();

  results.push(
    await testEndpoint(
      'Dashboard Summary - 7 Days',
      'GET',
      `/api/finance/dashboard/summary?from=${fromDate}&to=${toDate}`
    )
  );

  // Test 4: List Transactions - Default
  console.log('\n\n🔍 Test Suite 3: List Transactions');
  console.log('━'.repeat(50));

  results.push(
    await testEndpoint(
      'List Transactions - Page 1, Limit 10',
      'GET',
      '/api/finance/transactions?page=1&limit=10'
    )
  );

  // Test 5: List Transactions - INCOME only
  results.push(
    await testEndpoint(
      'List Transactions - INCOME only',
      'GET',
      '/api/finance/transactions?type=INCOME&limit=10'
    )
  );

  // Test 6: List Transactions - EXPENSE only
  results.push(
    await testEndpoint(
      'List Transactions - EXPENSE only',
      'GET',
      '/api/finance/transactions?type=EXPENSE&limit=10'
    )
  );

  // Test 7: Record Transaction - INCOME
  console.log('\n\n🔍 Test Suite 4: Record Transaction');
  console.log('━'.repeat(50));

  results.push(
    await testEndpoint(
      'Record Transaction - INCOME (CASH)',
      'POST',
      '/api/finance/transactions/record',
      {
        type: 'INCOME',
        paymentMethod: 'CASH',
        amount: 500.50,
        currency: 'THB',
        description: 'Test transaction - walk-in payment',
        category: 'LAUNDRY_SERVICE',
      }
    )
  );

  // Test 8: Record Transaction - EXPENSE
  results.push(
    await testEndpoint(
      'Record Transaction - EXPENSE (UTILITY)',
      'POST',
      '/api/finance/transactions/record',
      {
        type: 'EXPENSE',
        paymentMethod: 'BANK_TRANSFER',
        amount: 1500.00,
        currency: 'THB',
        description: 'Test transaction - electricity bill',
        category: 'OPERATING_COST',
      }
    )
  );

  // Test 9: SCB Sync - Default (last 7 days)
  console.log('\n\n🔍 Test Suite 5: SCB Synchronization');
  console.log('━'.repeat(50));

  results.push(
    await testEndpoint(
      'SCB Sync - Last 7 Days (Mock)',
      'POST',
      '/api/finance/scb/sync',
      {
        limit: 25,
      }
    )
  );

  // Test 10: SCB Sync - Custom date range
  const scbStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  results.push(
    await testEndpoint(
      'SCB Sync - Custom Date Range',
      'POST',
      '/api/finance/scb/sync',
      {
        startDate: scbStartDate.toISOString(),
        endDate: now.toISOString(),
        limit: 10,
      }
    )
  );

  // Test 11: SCB Sync - Max limit
  results.push(
    await testEndpoint(
      'SCB Sync - Max Limit (50)',
      'POST',
      '/api/finance/scb/sync',
      {
        limit: 50,
      }
    )
  );

  // Test 12: Error handling - Invalid date format
  console.log('\n\n🔍 Test Suite 6: Error Handling');
  console.log('━'.repeat(50));

  results.push(
    await testEndpoint(
      'Error: Invalid Date Format',
      'GET',
      '/api/finance/dashboard/summary?from=invalid-date'
    )
  );

  // Test 13: Error handling - Limit exceeds maximum
  results.push(
    await testEndpoint(
      'Error: Limit Exceeds Maximum (Transactions)',
      'GET',
      '/api/finance/transactions?limit=200'
    )
  );

  // Test 14: Error handling - Missing required field
  results.push(
    await testEndpoint(
      'Error: Missing Required Field',
      'POST',
      '/api/finance/transactions/record',
      {
        type: 'INCOME',
        // Missing required fields
      }
    )
  );

  // ============================================
  // Summary Report
  // ============================================

  console.log('\n\n');
  console.log('═'.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`\n📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  // Detailed results table
  console.log('\n\n📋 DETAILED RESULTS:');
  console.log('─'.repeat(90));
  console.log(
    `${'Endpoint'.padEnd(30)} ${'Method'.padEnd(6)} ${'Status'.padEnd(10)} ${'Duration'.padEnd(10)} ${'Result'.padEnd(10)}`
  );
  console.log('─'.repeat(90));

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusStr = result.success ? 'OK' : 'ERROR';

    console.log(
      `${(result.endpoint || 'N/A').substring(0, 30).padEnd(30)} ${result.method.padEnd(6)} ${statusStr.padEnd(10)} ${result.duration.toString().padEnd(10)}ms ${status.padEnd(10)}`
    );

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('─'.repeat(90));

  // Performance analysis
  console.log('\n\n⚡ PERFORMANCE ANALYSIS:');
  console.log('─'.repeat(50));

  const slowRequests = results
    .filter(r => r.duration > 1000)
    .sort((a, b) => b.duration - a.duration);

  if (slowRequests.length > 0) {
    console.log('\n🐌 Slow Requests (>1000ms):');
    slowRequests.forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.duration}ms`);
    });
  } else {
    console.log('\n✨ All requests completed within 1000ms');
  }

  const fastestRequest = results.reduce((prev, current) =>
    prev.duration < current.duration ? prev : current
  );
  const slowestRequest = results.reduce((prev, current) =>
    prev.duration > current.duration ? prev : current
  );

  console.log(`\n🚀 Fastest: ${fastestRequest.endpoint} (${fastestRequest.duration}ms)`);
  console.log(`🐢 Slowest: ${slowestRequest.endpoint} (${slowestRequest.duration}ms)`);

  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:');
  console.log('─'.repeat(50));

  if (failed === 0) {
    console.log('✅ All tests passed! Your Finance API is working correctly.');
    console.log('   Next steps:');
    console.log('   1. Integrate into your main app (see app.example.ts)');
    console.log('   2. Add authentication middleware');
    console.log('   3. Setup automated testing in CI/CD');
    console.log('   4. Configure real SCB API integration');
  } else {
    console.log('⚠️  Some tests failed. Review errors above and fix issues.');
    console.log('   Common issues:');
    console.log('   - Database connection not established');
    console.log('   - Invalid request parameters');
    console.log('   - Server not running (start with: bun run dev)');
  }

  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// ============================================
// Run Tests
// ============================================

console.log('Connecting to API server...');
setTimeout(() => {
  runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
}, 1000);
