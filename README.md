# 🚦 SmartTraffic AI – Traffic Congestion Prediction & Dynamic Signal Control System

> **Autonomous Urban Mobility Platform** for real-time traffic congestion prediction, spatial-temporal graph modeling, adaptive AI signal control, and emergency wave routing.

---

## 🌟 Key Features

1. **Interactive City Network Simulation (Canvas 2D Engine)**
   - Live visual map featuring key arterial corridors, expressways, and intersections.
   - Real-time animated vehicle agents (cars, buses, emergency vehicles).
   - Dynamic glowing heatmap overlay (Green = Smooth, Yellow = Moderate, Red = Severe Gridlock, Neon Purple = Incident).
   - Click-to-place incident / accident simulator with real-time AI rerouting.

2. **Spatial-Temporal AI Congestion Prediction Engine**
   - Bureau of Public Roads (BPR) non-linear volume-delay curve computation.
   - Multi-feature input tuning: Hour of day, Weather condition (Rain, Fog, Snow, Storm), Special events (Stadium matches, Concerts, Protests), Roadwork, and Incident severity.
   - 24-hour congestion timeline forecasting and Level of Service (LOS A–F) risk breakdown.

3. **Adaptive AI Traffic Signal Control Optimization**
   - Compares **Fixed Schedule**, **Actuated Sensor**, and **Deep Q-Learning / Webster-based AI Signal Control**.
   - Live green/red/yellow light countdown timers with queue depth balancing.
   - Single-click **Emergency Vehicle Green Wave Preemption**.

4. **Telemetry & Sustainability Analytics**
   - Real-time delay reduction tracking (-38%+ improvement over fixed schedules).
   - Environmental impact counters: CO₂ emissions prevented (kg) and waste fuel saved (liters).
   - Canvas-rendered charts for hourly congestion timelines and delay comparisons.

---

## 📁 Architecture & File Structure

```
smarttraffic-ai/
├── index.html           # Main UI Dashboard & Layout
├── styles.css           # Metropolitan Cyberpunk Glassmorphic Styling System
├── app.js               # Main Coordinator & UI Event Bindings
├── simulation.js        # Canvas 2D Live Traffic Physics & Heatmap Engine
├── predictionEngine.js  # Machine Learning Spatial-Temporal Prediction Algorithms
├── signalController.js  # Adaptive Signal Optimization & Webster Timing Algorithm
├── analytics.js         # Canvas Charting & Telemetry Analytics Engine
└── README.md            # System Documentation
```

---

## 🚀 How to Run locally

### Option 1: Direct File Open
Simply open `index.html` in any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

Using Node.js:
```bash
npx serve .
```

---

## 🧠 Underlying Mathematical & AI Models

1. **Bureau of Public Roads (BPR) Delay Equation**:
   $$t = t_0 \cdot \left(1 + \alpha \cdot \left(\frac{V}{C}\right)^\beta\right)$$
   Where $V$ is volume demand, $C$ is road capacity, $t_0$ is free-flow travel time, $\alpha = 0.15$, and $\beta = 4.0$.

2. **Webster's Optimum Signal Cycle Formula**:
   $$C_{opt} = \frac{1.5 L + 5}{1 - \sum Y_i}$$
   Where $L$ is total lost time per cycle and $Y_i$ is the ratio of critical lane flow to saturation flow rate.
