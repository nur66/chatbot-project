#!/bin/bash

echo "======================================"
echo "🔍 SQL Server Connection Test"
echo "======================================"
echo ""

# Test 1: Ping Windows host
echo "1️⃣ Testing network connectivity to Windows host..."
if ping -c 2 10.255.255.254 > /dev/null 2>&1; then
    echo "   ✅ Windows host reachable (10.255.255.254)"
else
    echo "   ❌ Cannot reach Windows host"
    exit 1
fi
echo ""

# Test 2: Check if port 1433 is open
echo "2️⃣ Testing SQL Server port 1433..."
if timeout 3 bash -c "echo > /dev/tcp/10.255.255.254/1433" 2>/dev/null; then
    echo "   ✅ Port 1433 is open and accessible"
else
    echo "   ❌ Port 1433 is closed or not accessible"
    echo "   💡 Check SQL Server Configuration Manager:"
    echo "      - Enable TCP/IP protocol"
    echo "      - Set TCP Port to 1433"
    echo "      - Restart SQL Server service"
    echo "   💡 Check Windows Firewall:"
    echo "      - Allow inbound connection on port 1433"
    exit 1
fi
echo ""

# Test 3: Try to connect via Node.js
echo "3️⃣ Testing Node.js connection..."
node -e "
import('mssql').then(sql => {
  const config = {
    server: '10.255.255.254',
    port: 1433,
    user: 'nur.iswanto',
    password: 'Cladtek@2020',
    database: 'global_dashboard',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 10000,
      requestTimeout: 10000
    }
  };

  console.log('   Attempting connection...');
  sql.connect(config)
    .then(() => {
      console.log('   ✅ Database connection successful!');
      sql.close();
      process.exit(0);
    })
    .catch(err => {
      console.log('   ❌ Database connection failed');
      console.log('   Error:', err.message);
      console.log('');
      console.log('   💡 Possible solutions:');
      console.log('      1. Check SQL Server Authentication Mode (must be Mixed Mode)');
      console.log('      2. Verify user credentials are correct');
      console.log('      3. Check if user has access to database');
      console.log('      4. Restart SQL Server service after changes');
      process.exit(1);
    });
}).catch(err => {
  console.log('   ❌ Error loading mssql module:', err.message);
  process.exit(1);
});
" 2>&1
echo ""

echo "======================================"
echo "✅ All tests passed!"
echo "======================================"
