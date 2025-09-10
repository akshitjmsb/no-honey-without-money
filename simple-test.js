#!/usr/bin/env node

/**
 * Simple test to verify the Yahoo Finance integration structure
 * This tests the basic functionality without requiring dependencies
 */

console.log('🧪 Testing Yahoo Finance Integration Structure...\n');

// Test 1: Check if files exist
import fs from 'fs';
import path from 'path';

const filesToCheck = [
  'server/services/yahooFinanceService.js',
  'server/package.json',
  'server/index.js',
  'YAHOO_FINANCE_INTEGRATION.md'
];

console.log('📁 Checking required files:');
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Test 2: Check package.json structure
console.log('\n📦 Checking package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
  console.log(`  ✅ Name: ${packageJson.name}`);
  console.log(`  ✅ Type: ${packageJson.type || 'Not set'}`);
  console.log(`  ✅ Dependencies: ${Object.keys(packageJson.dependencies || {}).length} packages`);
  
  const hasAxios = packageJson.dependencies?.axios;
  const hasCheerio = packageJson.dependencies?.cheerio;
  console.log(`  ${hasAxios ? '✅' : '❌'} axios: ${hasAxios || 'Not found'}`);
  console.log(`  ${hasCheerio ? '✅' : '❌'} cheerio: ${hasCheerio || 'Not found'}`);
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
}

// Test 3: Check Yahoo Finance service structure
console.log('\n🔧 Checking Yahoo Finance service:');
try {
  const serviceContent = fs.readFileSync('server/services/yahooFinanceService.js', 'utf8');
  const hasClass = serviceContent.includes('class YahooFinanceService');
  const hasMethods = serviceContent.includes('getFinancialData');
  const hasExport = serviceContent.includes('export default');
  
  console.log(`  ${hasClass ? '✅' : '❌'} YahooFinanceService class`);
  console.log(`  ${hasMethods ? '✅' : '❌'} getFinancialData method`);
  console.log(`  ${hasExport ? '✅' : '❌'} ES module export`);
} catch (error) {
  console.log(`  ❌ Error reading service file: ${error.message}`);
}

// Test 4: Check server integration
console.log('\n🖥️ Checking server integration:');
try {
  const serverContent = fs.readFileSync('server/index.js', 'utf8');
  const hasImport = serverContent.includes('import yahooFinanceService');
  const hasEndpoint = serverContent.includes('/api/financial-data');
  const hasYahooCall = serverContent.includes('yahooFinanceService.getFinancialData');
  
  console.log(`  ${hasImport ? '✅' : '❌'} Yahoo Finance service import`);
  console.log(`  ${hasEndpoint ? '✅' : '❌'} Financial data endpoint`);
  console.log(`  ${hasYahooCall ? '✅' : '❌'} Yahoo Finance API call`);
} catch (error) {
  console.log(`  ❌ Error reading server file: ${error.message}`);
}

console.log('\n🎉 Structure test completed!');
console.log('\n📋 Next steps:');
console.log('1. Install dependencies: cd server && npm install');
console.log('2. Start the server: npm run dev');
console.log('3. Test with real data: curl -X POST http://localhost:3001/api/financial-data -H "Content-Type: application/json" -d \'{"ticker": "AAPL"}\'');
console.log('4. Check the browser to see real market data!');
