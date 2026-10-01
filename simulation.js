/**
 * SmartTraffic AI - Canvas 2D Live Traffic Simulation Engine
 * ------------------------------------------------------------
 * Manages:
 * - Intersections and road network
 * - Vehicle agent movement
 * - Dynamic congestion
 * - Traffic incidents
 * - Traffic signal integration
 * - Interactive road selection
 */

class TrafficSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.isRunning = true;
    this.simSpeed = 1.0;
    this.timeAcc = 0;

    // ---------------------------------------------------------
    // INTERSECTIONS
    // ---------------------------------------------------------
    this.nodes = [
      {
        id: 'N1',
        name: 'Downtown Center',
        x: 260,
        y: 150,
        queueNS: 8,
        queueEW: 4
      },
      {
        id: 'N2',
        name: 'Tech Hub Gate',
        x: 620,
        y: 150,
        queueNS: 12,
        queueEW: 15
      },
      {
        id: 'N3',
        name: 'Bay Interchange',
        x: 920,
        y: 280,
        queueNS: 5,
        queueEW: 7
      },
      {
        id: 'N4',
        name: 'Airport Parkway Jct',
        x: 260,
        y: 440,
        queueNS: 3,
        queueEW: 2
      },
      {
        id: 'N5',
        name: 'South Arterial Cross',
        x: 620,
        y: 440,
        queueNS: 18,
        queueEW: 9
      },
      {
        id: 'N6',
        name: 'East Ring Road',
        x: 920,
        y: 440,
        queueNS: 4,
        queueEW: 3
      }
    ];

    // ---------------------------------------------------------
    // ROADS
    // ---------------------------------------------------------
    this.edges = [
      {
        id: 'E1',
        from: 'N1',
        to: 'N2',
        corridorId: 'C1',
        speedLimit: 45,
        width: 14,
        incident: false,
        congestion: 0.3
      },
      {
        id: 'E2',
        from: 'N2',
        to: 'N3',
        corridorId: 'C2',
        speedLimit: 65,
        width: 18,
        incident: false,
        congestion: 0.5
      },
      {
        id: 'E3',
        from: 'N1',
        to: 'N4',
        corridorId: 'C3',
        speedLimit: 40,
        width: 12,
        incident: false,
        congestion: 0.8
      },
      {
        id: 'E4',
        from: 'N2',
        to: 'N5',
        corridorId: 'C4',
        speedLimit: 50,
        width: 14,
        incident: false,
        congestion: 0.4
      },
      {
        id: 'E5',
        from: 'N4',
        to: 'N5',
        corridorId: 'C5',
        speedLimit: 45,
        width: 12,
        incident: false,
        congestion: 0.2
      },
      {
        id: 'E6',
        from: 'N5',
        to: 'N6',
        corridorId: 'C6',
        speedLimit: 55,
        width: 14,
        incident: false,
        congestion: 0.3
      },
      {
        id: 'E7',
        from: 'N3',
        to: 'N6',
        corridorId: 'C2',
        speedLimit: 60,
        width: 14,
        incident: false,
        congestion: 0.4
      }
    ];

    // ---------------------------------------------------------
    // VEHICLES
    // ---------------------------------------------------------
    this.vehicles = [];
    this.maxVehicles = 90;
    this.selectedEdge = null;

    // Performance counters
    this.totalVehiclesCompleted = 0;
    this.totalDistance = 0;

    this.init();
  }

  // -----------------------------------------------------------
  // INITIALIZATION
  // -----------------------------------------------------------

  init() {
    if (!this.canvas) return;

    this.resizeCanvas();

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // Initial traffic
    this.spawnVehicles(60);

    // Canvas interaction
    this.canvas.addEventListener('click', (e) => {
      this.handleCanvasClick(e);
    });

    // Animation
    this.lastTime = performance.now();

    requestAnimationFrame((t) => this.loop(t));
  }

  // -----------------------------------------------------------
  // CANVAS SIZE
  // -----------------------------------------------------------

  resizeCanvas() {
    const parent = this.canvas.parentElement;

    if (parent) {
      this.canvas.width = parent.clientWidth || 1000;
      this.canvas.height = parent.clientHeight || 580;
    }
  }

  // -----------------------------------------------------------
  // VEHICLE CREATION
  // -----------------------------------------------------------

  spawnVehicles(count) {
    const availableEdges = this.edges.filter(
      edge => !edge.incident
    );

    for (let i = 0; i < count; i++) {
      const edge =
        availableEdges[
          Math.floor(Math.random() * availableEdges.length)
        ];

      const progress = Math.random();

      const randomType = Math.random();

      let type = 'car';

      if (randomType > 0.90) {
        type = 'emergency';
      } else if (randomType > 0.80) {
        type = 'bus';
      }

      this.vehicles.push({
        id: `v_${i}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        edgeId: edge.id,

        progress,

        // Base movement speed
        speed: 0.001 + Math.random() * 0.002,

        type,

        color:
          type === 'emergency'
            ? '#ff2a5f'
            : type === 'bus'
              ? '#ffb300'
              : '#00f2fe'
      });
    }
  }

  // -----------------------------------------------------------
  // CANVAS CLICK / INCIDENT
  // -----------------------------------------------------------

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (const edge of this.edges) {
      const n1 = this.nodes.find(
        n => n.id === edge.from
      );

      const n2 = this.nodes.find(
        n => n.id === edge.to
      );

      if (!n1 || !n2) continue;

      const dist = this.pointToSegmentDist(
        clickX,
        clickY,
        n1.x,
        n1.y,
        n2.x,
        n2.y
      );

      if (dist < 18) {
        edge.incident = !edge.incident;

        this.selectedEdge = edge;

        if (window.onIncidentToggled) {
          window.onIncidentToggled(edge);
        }

        return;
      }
    }
  }

  // -----------------------------------------------------------
  // POINT TO ROAD DISTANCE
  // -----------------------------------------------------------

  pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const l2 =
      (x2 - x1) ** 2 +
      (y2 - y1) ** 2;

    if (l2 === 0) {
      return Math.hypot(
        px - x1,
        py - y1
      );
    }

    let t =
      ((px - x1) * (x2 - x1) +
        (py - y1) * (y2 - y1)) /
      l2;

    t = Math.max(
      0,
      Math.min(1, t)
    );

    const nearestX =
      x1 + t * (x2 - x1);

    const nearestY =
      y1 + t * (y2 - y1);

    return Math.hypot(
      px - nearestX,
      py - nearestY
    );
  }

  // -----------------------------------------------------------
  // FIND NEXT CONNECTED ROAD
  // -----------------------------------------------------------

  getNextEdge(currentEdge) {
    const connectedEdges = this.edges.filter(
      edge =>
        edge.from === currentEdge.to &&
        edge.id !== currentEdge.id
    );

    // Prefer roads without incidents
    const safeEdges = connectedEdges.filter(
      edge => !edge.incident
    );

    if (safeEdges.length > 0) {
      return safeEdges[
        Math.floor(
          Math.random() * safeEdges.length
        )
      ];
    }

    if (connectedEdges.length > 0) {
      return connectedEdges[
        Math.floor(
          Math.random() * connectedEdges.length
        )
      ];
    }

    // If no outgoing road exists,
    // restart vehicle on a safe road.
    const fallbackEdges = this.edges.filter(
      edge => !edge.incident
    );

    if (fallbackEdges.length > 0) {
      return fallbackEdges[
        Math.floor(
          Math.random() * fallbackEdges.length
        )
      ];
    }

    return null;
  }

  // -----------------------------------------------------------
  // SIMULATION UPDATE
  // -----------------------------------------------------------

  update(dt) {
    if (!this.isRunning) return;

    // Prevent very large time steps
    dt = Math.min(dt, 0.1);

    const actualDt =
      dt * this.simSpeed;

    // ---------------------------------------------------------
    // TRAFFIC SIGNAL
    // ---------------------------------------------------------

    const activeNode = this.nodes[1];

    if (
      window.signalController &&
      activeNode
    ) {
      window.signalController.update(
        actualDt,
        activeNode.queueNS,
        activeNode.queueEW
      );
    }

    // ---------------------------------------------------------
    // VEHICLE PHYSICS
    // ---------------------------------------------------------

    this.vehicles.forEach(v => {
      const edge = this.edges.find(
        e => e.id === v.edgeId
      );

      if (!edge) return;

      // Congestion reduces vehicle speed
      let speedMult =
        1.0 -
        edge.congestion * 0.7;

      // Incident creates major slowdown
      if (edge.incident) {
        speedMult *= 0.15;
      }

      // Emergency vehicles receive priority
      if (v.type === 'emergency') {
        speedMult *= 1.15;
      }

      speedMult = Math.max(
        0.05,
        Math.min(1.2, speedMult)
      );

      const movement =
        v.speed *
        speedMult *
        (actualDt * 60);

      v.progress += movement;

      this.totalDistance += movement;

      // -------------------------------------------------------
      // VEHICLE REACHES INTERSECTION
      // -------------------------------------------------------

      if (v.progress >= 1.0) {
        v.progress = 0;

        const nextEdge =
          this.getNextEdge(edge);

        if (nextEdge) {
          v.edgeId = nextEdge.id;
        }

        this.totalVehiclesCompleted++;
      }
    });

    // ---------------------------------------------------------
    // DYNAMIC CONGESTION
    // ---------------------------------------------------------

    this.edges.forEach(edge => {
      const count =
        this.vehicles.filter(
          v => v.edgeId === edge.id
        ).length;

      // Vehicle density
      let targetCongestion =
        count / 18;

      // Incident penalty
      if (edge.incident) {
        targetCongestion =
          Math.min(
            1.0,
            targetCongestion + 0.65
          );
      }

      // Keep value between 0 and 1
      targetCongestion =
        Math.max(
          0,
          Math.min(
            1,
            targetCongestion
          )
        );

      // Smooth transition
      edge.congestion +=
        (targetCongestion -
          edge.congestion) *
        0.05;

      edge.congestion =
        Math.max(
          0,
          Math.min(
            1,
            edge.congestion
          )
        );
    });

    // ---------------------------------------------------------
    // UPDATE INTERSECTION QUEUES
    // ---------------------------------------------------------

    this.updateQueues();
  }

  // -----------------------------------------------------------
  // QUEUE CALCULATION
  // -----------------------------------------------------------

  updateQueues() {
    this.nodes.forEach(node => {
      let incomingVehicles = 0;

      this.edges.forEach(edge => {
        if (edge.to === node.id) {
          incomingVehicles +=
            this.vehicles.filter(
              v => v.edgeId === edge.id
            ).length;
        }
      });

      // Approximate directional queue
      node.queueNS = Math.max(
        0,
        Math.round(
          incomingVehicles * 0.55
        )
      );

      node.queueEW = Math.max(
        0,
        Math.round(
          incomingVehicles * 0.45
        )
      );
    });
  }

  // -----------------------------------------------------------
  // DRAW
  // -----------------------------------------------------------

  draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // ---------------------------------------------------------
    // BACKGROUND
    // ---------------------------------------------------------

    ctx.fillStyle = '#080c14';

    ctx.fillRect(
      0,
      0,
      w,
      h
    );

    // ---------------------------------------------------------
    // GRID
    // ---------------------------------------------------------

    ctx.strokeStyle =
      'rgba(30, 45, 75, 0.2)';

    ctx.lineWidth = 1;

    for (
      let x = 0;
      x < w;
      x += 40
    ) {
      ctx.beginPath();

      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);

      ctx.stroke();
    }

    for (
      let y = 0;
      y < h;
      y += 40
    ) {
      ctx.beginPath();

      ctx.moveTo(0, y);
      ctx.lineTo(w, y);

      ctx.stroke();
    }

    // ---------------------------------------------------------
    // ROADS / HEATMAP
    // ---------------------------------------------------------

    this.edges.forEach(edge => {
      const n1 =
        this.nodes.find(
          n => n.id === edge.from
        );

      const n2 =
        this.nodes.find(
          n => n.id === edge.to
        );

      if (!n1 || !n2) return;

      let strokeColor =
        '#00e676';

      if (edge.congestion > 0.70) {
        strokeColor =
          '#ff2a5f';
      } else if (
        edge.congestion > 0.40
      ) {
        strokeColor =
          '#ffb300';
      }

      // Incident
      if (edge.incident) {
        strokeColor =
          '#7000ff';
      }

      // -------------------------------------------------------
      // OUTER GLOW
      // -------------------------------------------------------

      ctx.save();

      ctx.shadowColor =
        strokeColor;

      ctx.shadowBlur =
        edge.congestion * 25 +
        (edge.incident ? 20 : 5);

      ctx.strokeStyle =
        strokeColor;

      ctx.lineWidth =
        edge.width;

      ctx.lineCap = 'round';

      ctx.beginPath();

      ctx.moveTo(
        n1.x,
        n1.y
      );

      ctx.lineTo(
        n2.x,
        n2.y
      );

      ctx.stroke();

      ctx.restore();

      // -------------------------------------------------------
      // ASPHALT
      // -------------------------------------------------------

      ctx.strokeStyle =
        '#121b2d';

      ctx.lineWidth =
        edge.width - 4;

      ctx.beginPath();

      ctx.moveTo(
        n1.x,
        n1.y
      );

      ctx.lineTo(
        n2.x,
        n2.y
      );

      ctx.stroke();

      // -------------------------------------------------------
      // LANE MARKING
      // -------------------------------------------------------

      ctx.setLineDash([
        8,
        8
      ]);

      ctx.strokeStyle =
        'rgba(255,255,255,0.25)';

      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(
        n1.x,
        n1.y
      );

      ctx.lineTo(
        n2.x,
        n2.y
      );

      ctx.stroke();

      ctx.setLineDash([]);

      // -------------------------------------------------------
      // INCIDENT ICON
      // -------------------------------------------------------

      if (edge.incident) {
        const midX =
          (n1.x + n2.x) / 2;

        const midY =
          (n1.y + n2.y) / 2;

        ctx.fillStyle =
          '#ff2a5f';

        ctx.beginPath();

        ctx.arc(
          midX,
          midY,
          14,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          '#ffffff';

        ctx.font =
          'bold 12px sans-serif';

        ctx.textAlign =
          'center';

        ctx.textBaseline =
          'middle';

        ctx.fillText(
          '⚠️',
          midX,
          midY
        );
      }
    });

    // ---------------------------------------------------------
    // INTERSECTIONS
    // ---------------------------------------------------------

    this.nodes.forEach(
      (node, idx) => {
        ctx.save();

        // Node
        ctx.fillStyle =
          '#101828';

        ctx.strokeStyle =
          '#00f2fe';

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
          node.x,
          node.y,
          18,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.stroke();

        // Traffic signal
        if (
          idx === 1 ||
          idx === 4
        ) {
          const sigState =
            window.signalController
              ? window.signalController
                  .signalState
              : 'NS_GREEN';

          let lightColor =
            '#00e676';

          if (
            sigState.includes(
              'YELLOW'
            )
          ) {
            lightColor =
              '#ffb300';
          } else if (
            sigState.includes(
              'EW_GREEN'
            )
          ) {
            lightColor =
              '#00e676';
          }

          ctx.fillStyle =
            lightColor;

          ctx.shadowColor =
            lightColor;

          ctx.shadowBlur = 15;

          ctx.beginPath();

          ctx.arc(
            node.x,
            node.y,
            8,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        // Label
        ctx.fillStyle =
          '#8e9bb4';

        ctx.font =
          '11px Outfit, sans-serif';

        ctx.textAlign =
          'center';

        ctx.fillText(
          node.name,
          node.x,
          node.y + 32
        );

        ctx.restore();
      }
    );

    // ---------------------------------------------------------
    // VEHICLES
    // ---------------------------------------------------------

    this.vehicles.forEach(v => {
      const edge =
        this.edges.find(
          e => e.id === v.edgeId
        );

      if (!edge) return;

      const n1 =
        this.nodes.find(
          n => n.id === edge.from
        );

      const n2 =
        this.nodes.find(
          n => n.id === edge.to
        );

      if (!n1 || !n2) return;

      const vx =
        n1.x +
        (n2.x - n1.x) *
          v.progress;

      const vy =
        n1.y +
        (n2.y - n1.y) *
          v.progress;

      ctx.save();

      ctx.fillStyle =
        v.color;

      ctx.shadowColor =
        v.color;

      ctx.shadowBlur = 10;

      if (
        v.type === 'emergency'
      ) {
        // Emergency vehicle
        ctx.beginPath();

        ctx.arc(
          vx,
          vy,
          6,
          0,
          Math.PI * 2
        );

        ctx.fill();

      } else if (
        v.type === 'bus'
      ) {
        // Bus
        ctx.fillRect(
          vx - 5,
          vy - 5,
          10,
          10
        );

      } else {
        // Car
        ctx.beginPath();

        ctx.arc(
          vx,
          vy,
          4,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      ctx.restore();
    });
  }

  // -----------------------------------------------------------
  // ANIMATION LOOP
  // -----------------------------------------------------------

  loop(timestamp) {
    const dt =
      (timestamp -
        this.lastTime) /
      1000;

    this.lastTime =
      timestamp;

    this.update(dt);

    this.draw();

    requestAnimationFrame(
      (t) => this.loop(t)
    );
  }

  // -----------------------------------------------------------
  // CONTROLS
  // -----------------------------------------------------------

  togglePause() {
    this.isRunning =
      !this.isRunning;

    return this.isRunning;
  }

  setSpeed(speed) {
    this.simSpeed =
      parseFloat(speed);

    if (
      !Number.isFinite(
        this.simSpeed
      )
    ) {
      this.simSpeed = 1.0;
    }
  }

  clearIncidents() {
    this.edges.forEach(
      edge => {
        edge.incident = false;
      }
    );

    this.selectedEdge = null;
  }

  // -----------------------------------------------------------
  // PUBLIC DATA FOR DASHBOARD / ANALYTICS
  // -----------------------------------------------------------

  getStats() {
    const totalVehicles =
      this.vehicles.length;

    const totalCongestion =
      this.edges.reduce(
        (sum, edge) =>
          sum + edge.congestion,
        0
      );

    const avgCongestion =
      this.edges.length > 0
        ? totalCongestion /
          this.edges.length
        : 0;

    const incidentCount =
      this.edges.filter(
        edge => edge.incident
      ).length;

    const avgSpeed =
      45 *
      (1 -
        avgCongestion * 0.65);

    const networkIndex =
      Math.max(
        0,
        Math.min(
          100,
          100 -
            avgCongestion * 65 -
            incidentCount * 8
        )
      );

    return {
      activeVehicles:
        totalVehicles,

      avgCongestion,

      avgSpeed,

      networkIndex,

      incidents:
        incidentCount,

      totalVehiclesCompleted:
        this.totalVehiclesCompleted,

      totalDistance:
        this.totalDistance
    };
  }
}

// -------------------------------------------------------------
// GLOBAL INITIALIZER
// -------------------------------------------------------------

window.initSimulation = (
  canvasId
) => {
  window.sim =
    new TrafficSimulation(
      canvasId
    );
};