// Simple telemetry simulator
const http = require('http');

const API_KEY = 'demo-key';
const HOST = 'localhost';
const PORT = 3001;

console.log('Starting Telemetry Simulator...');
console.log(`Target: http://${HOST}:${PORT}/api/ingest`);

// Simulating a truck driving around LA
let lat = 34.0522;
let lng = -118.2437;
let isIdling = false;
let idleCounter = 0;

function sendTelemetry() {
    // Logic to toggle state
    // 10% chance to switch state
    if (Math.random() > 0.90) {
        isIdling = !isIdling;
        if (isIdling) console.log("Vehicle stopped - Idling...");
        else console.log("Vehicle moving...");
    }

    let speed = 0;
    
    if (isIdling) {
        speed = 0;
        // Jitter location slightly due to GPS drift even when stopped
        lat += (Math.random() - 0.5) * 0.00001;
        lng += (Math.random() - 0.5) * 0.00001;
    } else {
        // Move normally
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;
        speed = 40 + Math.random() * 20; // 40-60 km/h
    }
    
    const fuel = 70 - (Math.random() * 0.1); 

    const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        lat,
        lng,
        speed: Math.round(speed),
        fuelLevel: Math.round(fuel),
        rpm: isIdling ? 700 + Math.random() * 50 : 1500 + Math.random() * 500
    });

    const options = {
        hostname: HOST,
        port: PORT,
        path: '/api/ingest',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
            'x-api-key': API_KEY
        }
    };

    const req = http.request(options, (res) => {
        // console.log(`Sent point: ${res.statusCode}`);
    });

    req.on('error', (error) => {
        console.error('Error sending telemetry:', error.message);
    });

    req.write(payload);
    req.end();
}

// Send every 2 seconds
setInterval(sendTelemetry, 2000);
console.log('Simulation running. Press Ctrl+C to stop.');