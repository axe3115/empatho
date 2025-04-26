const { spawn } = require('child_process');
const path = require('path');

// Function to start the Python backend server
function startBackend() {
    console.log('\x1b[36m%s\x1b[0m', 'Starting Python backend server...');
    const pythonPath = path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(__dirname, 'backend', 'main.py');
    
    const backend = spawn(pythonPath, [scriptPath], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    backend.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', 'Failed to start backend:', err);
        process.exit(1);
    });

    backend.on('exit', (code) => {
        if (code !== 0) {
            console.error('\x1b[31m%s\x1b[0m', `Backend server exited with code ${code}`);
            process.exit(1);
        }
    });

    return backend;
}

// Function to start the Expo frontend server
function startFrontend() {
    console.log('\x1b[36m%s\x1b[0m', 'Starting Expo frontend server...');
    
    // Set environment variables for Expo
    const env = {
        ...process.env,
        EXPO_NO_DAEMON: '1',
        EXPO_OFFLINE: '0',  // Force online mode
        EXPO_DEBUG: '1'     // Enable debug logging
    };

    const frontend = spawn('npx', ['expo', 'start', '--clear'], {
        stdio: 'inherit',
        shell: true,
        env
    });

    frontend.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', 'Failed to start frontend:', err);
        process.exit(1);
    });

    frontend.on('exit', (code) => {
        if (code !== 0) {
            console.error('\x1b[31m%s\x1b[0m', `Frontend server exited with code ${code}`);
            process.exit(1);
        }
    });

    return frontend;
}

// Function to handle graceful shutdown
function handleShutdown(backend, frontend) {
    const shutdown = () => {
        console.log('\x1b[33m%s\x1b[0m', '\nShutting down servers...');
        if (backend) backend.kill('SIGINT');
        if (frontend) frontend.kill('SIGINT');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

// Main function to start both servers
async function startServers() {
    try {
        console.log('\x1b[32m%s\x1b[0m', 'Starting Empatho development servers...');
        
        // Start backend first
        const backend = startBackend();
        
        // Wait for backend to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Start frontend
        const frontend = startFrontend();
        
        // Set up shutdown handlers
        handleShutdown(backend, frontend);
        
        console.log('\x1b[32m%s\x1b[0m', '\nServers are running!');
        console.log('\x1b[33m%s\x1b[0m', 'Press Ctrl+C to stop all servers');
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Error starting servers:', error);
        process.exit(1);
    }
}

// Start the servers
startServers(); 