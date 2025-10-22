// backend/server.js
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..")));

function runPython(script, args = []) {
    return new Promise((resolve, reject) => {
        const py = spawn("python", [script, ...args]);
        let output = "";
        let error = "";

        py.stdout.on("data", (data) => (output += data.toString()));
        py.stderr.on("data", (data) => (error += data.toString()));

        py.on("close", (code) => {
        if (code !== 0 || error) return reject(error || "Python failed");
        try {
            resolve(JSON.parse(output));
        } catch {
            reject("Invalid JSON from Python script");
        }
        });
    });
}

app.post("/api/load", async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  const yFinancePath = path.join(__dirname, "scripts", "yFinanceCall.py");
  const betaPath = path.join(__dirname, "scripts", "systematicrisk.py");

    try {
        const historyData = await runPython(yFinancePath, [symbol]);

        const closes = historyData.history.map((d) => d.close);
        const betaInput = JSON.stringify({ prices: closes });
        const betaProcess = spawn("python", [betaPath, betaInput]);

        let betaOut = "";
        let betaErr = "";
        betaProcess.stdout.on("data", (d) => (betaOut += d.toString()));
        betaProcess.stderr.on("data", (d) => (betaErr += d.toString()));

        betaProcess.on("close", (code) => {
            if (code !== 0 || betaErr) {
                console.error(betaErr);
                return res.json({ ...historyData, beta: null, betaError: betaErr });
            }
            let betaVal = null;
            try {
                const parsed = JSON.parse(betaOut);
                betaVal = parsed.beta ?? null;
            } catch {
                const num = parseFloat(betaOut);
                if (!isNaN(num)) betaVal = num;
            }
            res.json({ ...historyData, beta: betaVal });
        });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: err.toString() });
    }
});

app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
);
