
class ScadaSystem {
    constructor() {
        this.state = {
            valves: {
                v101: false, // Feed Tank
                v102: false, // Additive
                v103: false, // Inlet to Reactor
                v104: false  // Drain
            },
            sensors: {
                pressure: 1.0, // bar
                temp: 24.0,    // C
                flow: 0.0      // m3/h
            },
            history: new Array(60).fill(0), // For graph
            inputs: Array(8).fill(false),
            outputs: Array(8).fill(false)
        };

        this.config = {
            maxPressure: 8.5,
            minPressure: 0.5,
            tickRate: 500, // ms (500ms * 60 = 30s history)
            noiseFactor: 0.05
        };

        this.init();
    }

    init() {
        this.log("SYSTEM BOOT SEQUENCE INITIATED...");
        this.log("PLC CONNECTION ESTABLISHED (S7-400).");
        this.renderIO();

        // Start Loops
        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.simulationLoop(), this.config.tickRate);

        this.log("SYSTEM READY. MODE: RUN");
    }

    log(msg) {
        const logPanel = document.getElementById('alarm-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const time = new Date().toLocaleTimeString('en-GB');
        entry.innerHTML = `<span class="timestamp">${time}</span> ${msg}`;

        logPanel.appendChild(entry);
        logPanel.scrollTop = logPanel.scrollHeight;

        // Keep log size simulated/manageable
        if (logPanel.children.length > 50) {
            logPanel.removeChild(logPanel.firstChild);
        }
    }

    toggleValve(id) {
        this.state.valves[id] = !this.state.valves[id];
        const status = this.state.valves[id] ? "OPENED" : "CLOSED";
        this.log(`COMMAND > VALVE ${id.toUpperCase()} ${status}`);
        this.renderValves();
    }

    updateClock() {
        const now = new Date();
        document.getElementById('system-clock').innerText = now.toLocaleTimeString('en-GB');
    }

    simulationLoop() {
        // 1. SIMULATE PHYSICS
        let flowIn = 0;
        let flowOut = 0;

        // V101 (Feed) and V102 (Additive) allow flow IF V103 (Inlet) is also open
        // Simplified: V103 controls flow INTO the reactor based on V101/V102 presence
        if (this.state.valves.v103) {
            if (this.state.valves.v101) flowIn += 50;
            if (this.state.valves.v102) flowIn += 20;
        }

        if (this.state.valves.v104) {
            // Drain depends on pressure
            flowOut = this.state.sensors.pressure * 10;
        }

        // Net Flow
        let netFlow = flowIn - flowOut;

        // Apply Physics to Pressure (Pressure ~ Level in simplified tank)
        // PV = nRT ... simplified: Pressure += netFlow * factor
        this.state.sensors.pressure += (netFlow * 0.001);

        // Natural pressure drop/settling if valves closed
        if (flowIn === 0 && flowOut === 0) {
            // leak/settle
        }

        // Limits
        if (this.state.sensors.pressure < 0) this.state.sensors.pressure = 0;

        // Temperature Logic (Reaction exothermic if pressure is high?)
        // Ambient 24C. rises with pressure.
        const targetTemp = 24 + (this.state.sensors.pressure * 5);
        this.state.sensors.temp += (targetTemp - this.state.sensors.temp) * 0.1;

        // Add Noise
        this.state.sensors.pressure += (Math.random() - 0.5) * this.config.noiseFactor;
        this.state.sensors.temp += (Math.random() - 0.5) * this.config.noiseFactor;
        this.state.sensors.flow = flowIn + (Math.random() * 2);
        if (!this.state.valves.v103) this.state.sensors.flow = 0; // No flow reading if inlet closed

        // 2. CHECK ALARMS
        this.checkAlarms();

        // 3. RENDER ALL
        this.renderSensors();
        this.renderGraph();
        this.renderIOState();
    }

    checkAlarms() {
        const p = this.state.sensors.pressure;
        const modeEl = document.getElementById('plc-mode');

        if (p > this.config.maxPressure) {
            if (modeEl.innerText !== "ALARM") {
                modeEl.innerText = "ALARM";
                modeEl.className = "value status-alarm";
                this.log("!!! HIGH PRESSURE ALARM TRIPPED !!!");
            }
        } else {
            if (modeEl.innerText === "ALARM") {
                modeEl.innerText = "RUN";
                modeEl.className = "value status-ok";
                this.log("PRESSURE NORMALIZED. ALARM CLEARED.");
            }
        }
    }

    renderValves() {
        for (const [id, isOpen] of Object.entries(this.state.valves)) {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = isOpen ? "[ ]" : "[X]";
                // Update Digital Outputs for valves (Q0.0 - Q0.3)
                const index = parseInt(id.slice(1)) % 8; // Simplified mapping
                this.state.outputs[index] = isOpen;
            }
        }
    }

    renderSensors() {
        document.getElementById('val-pressure').innerText = this.state.sensors.pressure.toFixed(2);
        document.getElementById('val-temp').innerText = this.state.sensors.temp.toFixed(1);
        document.getElementById('val-flow').innerText = this.state.sensors.flow.toFixed(0);
    }

    renderIO() {
        const inputList = document.getElementById('input-list');
        const outputList = document.getElementById('output-list');

        inputList.innerHTML = '';
        outputList.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            // Inputs
            const liIn = document.createElement('li');
            liIn.id = `I0.${i}`;
            liIn.innerHTML = `I0.${i} <span class="io-indicator">( )</span>`;
            inputList.appendChild(liIn);

            // Outputs
            const liOut = document.createElement('li');
            liOut.id = `Q0.${i}`;
            liOut.innerHTML = `Q0.${i} <span class="io-indicator">( )</span>`;
            outputList.appendChild(liOut);
        }
    }

    renderIOState() {
        // Inputs (Simulate random sensor bits for example)
        for (let i = 0; i < 8; i++) {
            // Just some dummy logic for inputs based on time or pressure
            const isOn = (i === 0 && this.state.sensors.pressure > 5);
            const char = isOn ? "(●)" : "( )";
            const color = isOn ? "var(--phosphor-bright)" : "inherit";

            const el = document.getElementById(`I0.${i}`);
            if (el) {
                el.querySelector('.io-indicator').innerText = char;
                el.style.color = color;
            }
        }

        // Outputs (Valve states)
        // Map v101->Q1, v102->Q2, etc. (Indices 1-4 for simplicity)
        const valveMap = { 'v101': 1, 'v102': 2, 'v103': 3, 'v104': 4 };

        for (let i = 0; i < 8; i++) {
            let isOn = false;
            // Reverse lookup if this output index matches a valve
            for (const [vid, qIdx] of Object.entries(valveMap)) {
                if (qIdx === i && this.state.valves[vid]) isOn = true;
            }

            const char = isOn ? "(●)" : "( )";
            const color = isOn ? "var(--phosphor-bright)" : "inherit";

            const el = document.getElementById(`Q0.${i}`);
            if (el) {
                el.querySelector('.io-indicator').innerText = char;
                el.style.color = color;
            }
        }
    }

    renderGraph() {
        // Push new value, shift old
        this.state.history.push(this.state.sensors.pressure);
        this.state.history.shift();

        // Simple ASCII Bar Graph (Sparkline style)
        // range 0 to 10 bar. Height 5 chars?
        // Let's do a scrolling single-line graph for simplicty or a multi-line graph if we can.
        // The prompt asked for "scrolling ASCII line graph".
        // Let's do a vertical bar graph:
        // P: 5.0 |#####
        // But scrolling usually means time is on X axis.
        // To do time on X axis in ASCII, we need a 2D grid.

        const height = 8;
        const width = this.state.history.length;
        let grid = Array(height).fill("").map(() => Array(width).fill(" "));

        const maxVal = 10;

        for (let x = 0; x < width; x++) {
            const val = this.state.history[x];
            // map val (0-10) to y (height-1 to 0)
            const barHeight = Math.floor((val / maxVal) * height);

            for (let y = 0; y < height; y++) {
                // y=0 is top. y=height-1 is bottom.
                // active area is from bottom up.
                const invY = height - 1 - y;
                if (invY < barHeight) {
                    if (invY === barHeight - 1) {
                        grid[y][x] = "."; // top of bar
                    } else {
                        grid[y][x] = ":"; // fill
                    }
                } else {
                    grid[y][x] = " ";
                }
            }
        }

        const lines = grid.map(row => row.join(""));
        document.getElementById('trend-graph').innerText = lines.join("\n");
    }
}

// Global instance
const scada = new ScadaSystem();
