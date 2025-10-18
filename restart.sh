#!/bin/bash

echo "🔄 Restarting Chatbot Server..."
echo ""

# Kill all node processes
echo "1️⃣ Killing old node processes..."
killall -9 node 2>/dev/null || pkill -9 node 2>/dev/null || true
sleep 2
echo "   ✅ Old processes killed"

# Clear any port 3000 usage
echo "2️⃣ Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "   ✅ Port cleared"

# Start fresh server
echo "3️⃣ Starting fresh server..."
npm start > startup.log 2>&1 &
sleep 5

# Check if server started successfully
if curl -s -m 2 http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"question":"test","sessionId":"restart_test"}' > /dev/null 2>&1; then
    echo "   ✅ Server started successfully"
    echo ""
    echo "════════════════════════════════════════════════"
    echo "✅ Server berhasil di-restart!"
    echo "🌐 URL: http://localhost:3000"
    echo "📝 Log: tail -f startup.log"
    echo "════════════════════════════════════════════════"
else
    echo "   ❌ Server failed to start"
    echo ""
    echo "Check startup.log for errors:"
    tail -20 startup.log
fi
