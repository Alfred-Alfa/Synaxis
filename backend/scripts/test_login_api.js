/**
 * Comprehensive Login Test Script
 * Tests the login API endpoint directly
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001/api/auth';

async function testLogin(email, password, label) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing: ${label}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ LOGIN SUCCESSFUL!');
            console.log(`   Token: ${data.token?.substring(0, 20)}...`);
            console.log(`   User Role: ${data.user?.role}`);
        } else {
            console.log('❌ LOGIN FAILED');
            console.log(`   Error: ${data.message}`);
        }

        return { success: response.ok, data };
    } catch (error) {
        console.log('💥 REQUEST FAILED');
        console.error('   Error:', error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('\n🚀 HRMS Login API Test Suite');
    console.log('━'.repeat(60));
    console.log(`Testing API at: ${API_URL}`);

    // Test all three user types
    const tests = [
        { email: 'superadmin@hrms.test', password: 'SuperAdmin@123', label: 'SuperAdmin' },
        { email: 'admin@hrms.test', password: 'Admin@123', label: 'Admin' },
        { email: 'staff@hrms.test', password: 'Staff@123', label: 'Staff' },
    ];

    const results = [];

    for (const test of tests) {
        const result = await testLogin(test.email, test.password, test.label);
        results.push({ ...test, ...result });
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    // Summary
    console.log(`\n\n${'═'.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'═'.repeat(60)}`);

    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${result.label} (${result.email})`);
    });

    const passCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\nTotal: ${results.length} tests`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`${'═'.repeat(60)}\n`);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
