/**
 * SmartTraffic AI - Main Application Coordinator & UI Controller
 * ---------------------------------------------------------------
 * Integrates:
 * - Live traffic simulation
 * - Prediction engine
 * - Adaptive signal controller
 * - Analytics
 * - Real-time dashboard telemetry
 */

// ================================================================
// NETWORK FLOW STATUS
// ================================================================

function getFlowStatus(networkIndex) {
  const index = Number(networkIndex) || 0;

  if (index >= 80) {
    return {
      label: 'Free Flow',
      symbol: '▲'
    };
  }

  if (index >= 55) {
    return {
      label: 'Moderate Flow',
      symbol: '◆'
    };
  }

  if (index >= 30) {
    return {
      label: 'Heavy Traffic',
      symbol: '▼'
    };
  }

  return {
    label: 'Critical Gridlock',
    symbol: '⚠️'
  };
}


// ================================================================
// MAIN APPLICATION
// ================================================================

class SmartTrafficApp {

  constructor() {

    this.currentTab = 'dashboard-tab';

    this.roadworkActive = false;

    this.incidentLevel = 0;

    // Previous values used for dashboard calculations
    this.previousCongestion = null;

    this.baseCongestion = null;
  }


  // ==============================================================
  // INITIALIZATION
  // ==============================================================

  init() {

    console.log(
      '⚡ Initializing SmartTraffic AI Platform...'
    );


    // ------------------------------------------------------------
    // 1. Initialize Simulation
    // ------------------------------------------------------------

    if (window.initSimulation) {

      window.initSimulation('simCanvas');

    } else {

      console.warn(
        '⚠️ Simulation engine unavailable'
      );

    }


    // ------------------------------------------------------------
    // 2. Setup Tabs
    // ------------------------------------------------------------

    this.setupTabs();


    // ------------------------------------------------------------
    // 3. Setup Controls
    // ------------------------------------------------------------

    this.setupControlListeners();


    // ------------------------------------------------------------
    // 4. Incident Callback
    // ------------------------------------------------------------

    window.onIncidentToggled = (edge) => {

      this.handleIncidentToggled(edge);

    };


    // ------------------------------------------------------------
    // 5. Initial Dashboard
    // ------------------------------------------------------------

    this.updateDashboard();


    // ------------------------------------------------------------
    // 6. Live Dashboard Refresh
    // ------------------------------------------------------------

    setInterval(() => {

      this.updateDashboard();

    }, 1000);


    // ------------------------------------------------------------
    // 7. Initial Analytics
    // ------------------------------------------------------------

    setTimeout(() => {

      if (window.trafficAnalytics) {

        window.trafficAnalytics.updateAllCharts();

      }

    }, 500);


    console.log(
      '✅ SmartTraffic AI Platform Online'
    );
  }


  // ==============================================================
  // TAB MANAGEMENT
  // ==============================================================

  setupTabs() {

    const tabBtns =
      document.querySelectorAll('.tab-btn');


    tabBtns.forEach(btn => {

      btn.addEventListener('click', () => {

        const targetTab =
          btn.getAttribute('data-tab');


        // Remove active button
        tabBtns.forEach(b => {

          b.classList.remove('active');

        });


        // Activate selected button
        btn.classList.add('active');


        // Hide all tabs
        document
          .querySelectorAll('.tab-content')
          .forEach(content => {

            content.classList.remove('active');

          });


        // Show selected tab
        const targetEl =
          document.getElementById(targetTab);


        if (targetEl) {

          targetEl.classList.add('active');

        }


        this.currentTab = targetTab;


        // Refresh analytics/predictions
        if (
          targetTab === 'prediction-tab' ||
          targetTab === 'analytics-tab' ||
          targetTab === 'signals-tab'
        ) {

          setTimeout(() => {

            if (window.trafficAnalytics) {

              window.trafficAnalytics
                .updateAllCharts();

            }

            this.runPrediction();

          }, 100);

        }

      });

    });

  }


  // ==============================================================
  // CONTROL LISTENERS
  // ==============================================================

  setupControlListeners() {


    // ------------------------------------------------------------
    // TIME OF DAY
    // ------------------------------------------------------------

    const sliderTime =
      document.getElementById(
        'sliderTimeOfDay'
      );


    const lblTime =
      document.getElementById(
        'lblTimeOfDay'
      );


    if (sliderTime && lblTime) {

      sliderTime.addEventListener(
        'input',
        (e) => {

          const val =
            parseInt(e.target.value);


          const timeStr =
            `${val
              .toString()
              .padStart(2, '0')}:00`;


          let tag = '(Off-Peak)';


          if (val >= 7 && val <= 9) {

            tag = '(Morning Rush)';

          }


          if (val >= 16 && val <= 18) {

            tag = '(Peak Rush)';

          }


          lblTime.textContent =
            `${timeStr} ${tag}`;


          this.updateDashboard();

        }
      );

    }


    // ------------------------------------------------------------
    // WEATHER
    // ------------------------------------------------------------

    const selWeather =
      document.getElementById(
        'selWeather'
      );


    if (selWeather) {

      selWeather.addEventListener(
        'change',
        () => {

          this.updateDashboard();


          console.log(
            `🌦️ Weather changed: ${selWeather.value}`
          );

        }
      );

    }


    // ------------------------------------------------------------
    // SPECIAL EVENT
    // ------------------------------------------------------------

    const selEvent =
      document.getElementById(
        'selEvent'
      );


    if (selEvent) {

      selEvent.addEventListener(
        'change',
        () => {

          this.updateDashboard();


          console.log(
            `🏟️ Event changed: ${selEvent.value}`
          );

        }
      );

    }


    // ------------------------------------------------------------
    // ROADWORK
    // ------------------------------------------------------------

    const btnRoadwork =
      document.getElementById(
        'btnToggleRoadwork'
      );


    if (btnRoadwork) {

      btnRoadwork.addEventListener(
        'click',
        () => {

          this.roadworkActive =
            !this.roadworkActive;


          btnRoadwork.style.borderColor =
            this.roadworkActive
              ? '#ff2a5f'
              : 'var(--bg-card-border)';


          btnRoadwork.style.background =
            this.roadworkActive
              ? 'rgba(255, 42, 95, 0.15)'
              : 'rgba(255, 255, 255, 0.05)';


          console.log(
            `🚧 Roadwork: ${
              this.roadworkActive
                ? 'ACTIVE'
                : 'INACTIVE'
            }`
          );


          this.updateDashboard();

        }
      );

    }


    // ------------------------------------------------------------
    // CLEAR INCIDENTS
    // ------------------------------------------------------------

    const btnClearInc =
      document.getElementById(
        'btnClearIncidents'
      );


    if (btnClearInc) {

      btnClearInc.addEventListener(
        'click',
        () => {

          if (window.sim) {

            window.sim.clearIncidents();

          }


          this.incidentLevel = 0;


          const sliderInc =
            document.getElementById(
              'sliderIncidentSev'
            );


          const lblInc =
            document.getElementById(
              'lblIncidentSev'
            );


          if (sliderInc) {

            sliderInc.value = 0;

          }


          if (lblInc) {

            lblInc.textContent =
              'Level 0';

          }


          this.updateDashboard();


          console.log(
            '🧹 All traffic incidents cleared'
          );

        }
      );

    }


    // ------------------------------------------------------------
    // PLAY / PAUSE
    // ------------------------------------------------------------

    const btnPlayPause =
      document.getElementById(
        'btnPlayPause'
      );


    if (btnPlayPause) {

      btnPlayPause.addEventListener(
        'click',
        () => {

          if (!window.sim) return;


          const running =
            window.sim.togglePause();


          btnPlayPause.textContent =
            running
              ? '⏸️'
              : '▶️';


          console.log(
            running
              ? '▶️ Simulation resumed'
              : '⏸️ Simulation paused'
          );

        }
      );

    }


    // ------------------------------------------------------------
    // PREDICTION BUTTON
    // ------------------------------------------------------------

    const btnRunPred =
      document.getElementById(
        'btnRunPrediction'
      );


    if (btnRunPred) {

      btnRunPred.addEventListener(
        'click',
        () => {

          this.runPrediction();

        }
      );

    }


    // ------------------------------------------------------------
    // INCIDENT SEVERITY
    // ------------------------------------------------------------

    const sliderInc =
      document.getElementById(
        'sliderIncidentSev'
      );


    const lblInc =
      document.getElementById(
        'lblIncidentSev'
      );


    if (sliderInc && lblInc) {

      sliderInc.addEventListener(
        'input',
        (e) => {

          this.incidentLevel =
            parseInt(e.target.value);


          lblInc.textContent =
            `Level ${this.incidentLevel}` +
            (
              this.incidentLevel > 2
                ? ' (Severe Blockage)'
                : ''
            );


          this.updateDashboard();

        }
      );

    }


    // ------------------------------------------------------------
    // EMERGENCY GREEN WAVE
    // ------------------------------------------------------------

    const btnEmerg =
      document.getElementById(
        'btnEmergencyWave'
      );


    if (btnEmerg) {

      btnEmerg.addEventListener(
        'click',
        () => {

          if (window.signalController) {

            window.signalController
              .triggerEmergencyWave();


            alert(
              '🚨 EMERGENCY GREEN WAVE PREEMPTION ACTIVATED!\n\n' +
              'Signals cleared along Downtown Corridor.'
            );


            this.updateDashboard();

          }

        }
      );

    }

  }


  // ==============================================================
  // PRESET CITY SCENARIOS
  // ==============================================================

  loadPreset(scenario) {

    const sliderTime =
      document.getElementById(
        'sliderTimeOfDay'
      );


    const selWeather =
      document.getElementById(
        'selWeather'
      );


    const selEvent =
      document.getElementById(
        'selEvent'
      );


    // ------------------------------------------------------------
    // MORNING
    // ------------------------------------------------------------

    if (scenario === 'morning') {

      if (sliderTime) {

        sliderTime.value = 8;

      }


      if (selWeather) {

        selWeather.value = 'clear';

      }


      if (selEvent) {

        selEvent.value = 'none';

      }

    }


    // ------------------------------------------------------------
    // EVENING
    // ------------------------------------------------------------

    else if (scenario === 'evening') {

      if (sliderTime) {

        sliderTime.value = 17;

      }


      if (selWeather) {

        selWeather.value = 'clear';

      }


      if (selEvent) {

        selEvent.value = 'stadium';

      }

    }


    // ------------------------------------------------------------
    // STORM
    // ------------------------------------------------------------

    else if (scenario === 'storm') {

      if (sliderTime) {

        sliderTime.value = 18;

      }


      if (selWeather) {

        selWeather.value = 'storm';

      }


      if (selEvent) {

        selEvent.value = 'protest';

      }

    }


    // ------------------------------------------------------------
    // Update controls
    // ------------------------------------------------------------

    if (sliderTime) {

      sliderTime.dispatchEvent(
        new Event('input')
      );

    }


    if (selWeather) {

      selWeather.dispatchEvent(
        new Event('change')
      );

    }


    if (selEvent) {

      selEvent.dispatchEvent(
        new Event('change')
      );

    }


    console.log(
      `🎬 Scenario loaded: ${scenario}`
    );

  }


  // ==============================================================
  // MAIN DASHBOARD UPDATE
  // ==============================================================

  updateDashboard() {

    if (!window.predictionEngine) {

      console.warn(
        'Prediction engine unavailable'
      );

      return;

    }


    // ------------------------------------------------------------
    // Read controls
    // ------------------------------------------------------------

    const hour =
      parseInt(
        document
          .getElementById(
            'sliderTimeOfDay'
          )
          ?.value || 17
      );


    const weather =
      document
        .getElementById(
          'selWeather'
        )
        ?.value || 'clear';


    const event =
      document
        .getElementById(
          'selEvent'
        )
        ?.value || 'none';


    // ------------------------------------------------------------
    // Run prediction engine
    // ------------------------------------------------------------

    const predictions =
      window.predictionEngine
        .predictCorridorMetrics({

          hour,

          weather,

          event,

          dayType: 'weekday',

          roadwork:
            this.roadworkActive,

          incidentLevel:
            this.incidentLevel

        });


    // ------------------------------------------------------------
    // LIVE SIMULATION STATS
    // ------------------------------------------------------------

    let simStats = null;


    if (
      window.sim &&
      typeof window.sim.getStats === 'function'
    ) {

      simStats =
        window.sim.getStats();

    }


    // ------------------------------------------------------------
    // NETWORK INDEX
    // ------------------------------------------------------------

    const valNet =
      document.getElementById(
        'valNetworkIndex'
      );


    let networkIndex =
      Number(
        predictions.avgCongestion
      ) || 0;


    if (
      simStats &&
      Number.isFinite(
        simStats.networkIndex
      )
    ) {

      networkIndex =
        simStats.networkIndex;

    }


    networkIndex =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(networkIndex)
        )
      );


    if (valNet) {

      valNet.textContent =
        `${networkIndex}%`;

    }


    // ------------------------------------------------------------
    // ACTIVE VEHICLES
    // ------------------------------------------------------------

    const activeVehicles =
      document.getElementById(
        'statActiveVehicles'
      );


    if (
      activeVehicles &&
      simStats
    ) {

      activeVehicles.textContent =
        Number(
          simStats.activeVehicles || 0
        ).toFixed(0);

    }


    // ------------------------------------------------------------
    // AVERAGE SPEED
    // ------------------------------------------------------------

    const avgSpeed =
      document.getElementById(
        'statAvgSpeed'
      );


    if (
      avgSpeed &&
      simStats
    ) {

      avgSpeed.textContent =
        `${Math.round(
          Number(
            simStats.avgSpeed || 0
          )
        )} mph`;

    }


    // ------------------------------------------------------------
    // INCIDENTS
    // ------------------------------------------------------------

    const activeIncidents =
      window.sim &&
      Array.isArray(window.sim.edges)
        ? window.sim.edges.filter(
            e => e.incident
          ).length
        : 0;


    const statIncidents =
      document.getElementById(
        'statActiveIncidents'
      );


    if (statIncidents) {

      statIncidents.textContent =
        activeIncidents;

    }


    // ------------------------------------------------------------
    // NETWORK FLOW STATUS
    // ------------------------------------------------------------

    const networkStatus =
      document.getElementById(
        'networkFlowStatus'
      );


    if (networkStatus) {

      const flow =
        getFlowStatus(networkIndex);


      networkStatus.textContent =
        `${flow.symbol} ${flow.label}`;

    }


    // ------------------------------------------------------------
    // DELAY REDUCTION
    // ------------------------------------------------------------

    const valDelay =
      document.getElementById(
        'valDelayReduction'
      );


    if (valDelay) {

      let delayReduction = 0;


      // Prefer live signal-controller telemetry
      if (
        window.signalController &&
        typeof window.signalController.getStats ===
          'function'
      ) {

        const signalStats =
          window.signalController.getStats();


        if (
          signalStats &&
          Number.isFinite(
            signalStats.avgWaitTimeReduction
          )
        ) {

          delayReduction =
            signalStats.avgWaitTimeReduction;

        }

      }


      // Fallback calculation
      if (
        !Number.isFinite(delayReduction) ||
        delayReduction <= 0
      ) {

        const congestion =
          simStats &&
          Number.isFinite(
            simStats.avgCongestion
          )
            ? simStats.avgCongestion
            : 1;


        delayReduction =
          Math.max(
            0,
            Math.min(
              60,
              (1 - congestion) * 45
            )
          );

      }


      delayReduction =
        Math.max(
          0,
          Math.min(
            60,
            delayReduction
          )
        );


      // Display positive reduction
      valDelay.textContent =
        `${delayReduction.toFixed(1)}%`;

    }


    // ------------------------------------------------------------
    // CORRIDOR CARDS
    // ------------------------------------------------------------

    const container =
      document.getElementById(
        'corridorListContainer'
      );


    if (
      container &&
      predictions &&
      Array.isArray(
        predictions.corridors
      )
    ) {

      container.innerHTML =
        predictions.corridors
          .map(c => {

            let levelClass =
              'level-low';


            if (
              c.congestionPercentage > 70
            ) {

              levelClass =
                'level-high';

            }

            else if (
              c.congestionPercentage > 40
            ) {

              levelClass =
                'level-med';

            }


            return `
              <div class="corridor-item">

                <div>

                  <div class="corridor-name">
                    ${c.name}
                  </div>

                  <div class="corridor-sub">
                    Est Speed:
                    ${c.predictedSpeed} mph
                    (Limit ${c.speedLimit})
                  </div>

                </div>

                <div
                  class="congestion-pill ${levelClass}"
                >
                  ${c.congestionPercentage}%
                  ${c.los}
                </div>

              </div>
            `;

          })
          .join('');

    }


    // ------------------------------------------------------------
    // SIGNAL CONTROLLER
    // ------------------------------------------------------------

    if (window.signalController) {

      const valState =
        document.getElementById(
          'valSignalState'
        );


      const valTimer =
        document.getElementById(
          'valSignalTimer'
        );


      const controllerState =
        typeof window.signalController.getState ===
          'function'
          ? window.signalController.getState()
          : null;


      // Signal state
      if (valState) {

        valState.textContent =
          controllerState
            ? controllerState.state
            : window.signalController.signalState;

      }


      // Signal timer
      if (valTimer) {

        valTimer.textContent =
          `${Number(
            window.signalController.timer || 0
          ).toFixed(0)}s`;

      }


      // ----------------------------------------------------------
      // TELEMETRY
      // ----------------------------------------------------------

      const valCo2 =
        document.getElementById(
          'valCo2Saved'
        );


      const valFuel =
        document.getElementById(
          'valFuelSaved'
        );


      const valPre =
        document.getElementById(
          'valPreemptions'
        );


      let stats = null;


      if (
        typeof window.signalController.getStats ===
        'function'
      ) {

        stats =
          window.signalController.getStats();

      } else {

        stats =
          window.signalController.stats;

      }


      // CO2
      if (valCo2 && stats) {

        valCo2.innerHTML =
          `${Number(
            stats.co2SavedKg || 0
          ).toFixed(1)}
          <span class="metric-unit">
            kg
          </span>`;

      }


      // Fuel
      if (valFuel && stats) {

        valFuel.innerHTML =
          `${Number(
            stats.fuelSavedLiters || 0
          ).toFixed(1)}
          <span class="metric-unit">
            Liters
          </span>`;

      }


      // Emergency preemptions
      if (valPre && stats) {

        valPre.textContent =
          stats.emergencyPreemptions || 0;

      }

    }

  }


  // ==============================================================
  // PREDICTION TAB
  // ==============================================================

  runPrediction() {

    if (!window.predictionEngine) {

      console.warn(
        'Prediction engine unavailable'
      );

      return;

    }


    // ------------------------------------------------------------
    // Read current controls
    // ------------------------------------------------------------

    const hour =
      parseInt(
        document
          .getElementById(
            'sliderTimeOfDay'
          )
          ?.value || 17
      );


    const weather =
      document
        .getElementById(
          'selWeather'
        )
        ?.value || 'clear';


    const event =
      document
        .getElementById(
          'selEvent'
        )
        ?.value || 'none';


    const corridorId =
      document
        .getElementById(
          'selPredictCorridor'
        )
        ?.value || 'C1';


    // ------------------------------------------------------------
    // Run prediction
    // ------------------------------------------------------------

    const predictions =
      window.predictionEngine
        .predictCorridorMetrics({

          hour,

          weather,

          event,

          dayType: 'weekday',

          roadwork:
            this.roadworkActive,

          incidentLevel:
            this.incidentLevel

        });


    // ------------------------------------------------------------
    // Prediction table
    // ------------------------------------------------------------

    const tbody =
      document.getElementById(
        'tblPredictionBody'
      );


    if (
      tbody &&
      predictions &&
      Array.isArray(
        predictions.corridors
      )
    ) {

      tbody.innerHTML =
        predictions.corridors
          .map(c => {

            const levelClass =
              c.congestionPercentage > 70
                ? 'level-high'
                : c.congestionPercentage > 40
                  ? 'level-med'
                  : 'level-low';


            return `
              <tr
                style="
                  border-bottom:
                  1px solid
                  rgba(255,255,255,0.05);
                "
              >

                <td
                  style="
                    padding:10px;
                    font-weight:600;
                  "
                >
                  ${c.name}
                </td>


                <td
                  style="
                    padding:10px;
                    color:
                    var(--text-muted);
                  "
                >
                  ${c.speedLimit} mph
                </td>


                <td
                  style="
                    padding:10px;
                    font-family:
                    var(--font-mono);
                    color:
                    var(--accent-cyan);
                  "
                >
                  ${c.predictedSpeed} mph
                </td>


                <td
                  style="
                    padding:10px;
                    font-family:
                    var(--font-mono);
                  "
                >
                  ${c.queueMeters} m
                </td>


                <td
                  style="
                    padding:10px;
                  "
                >

                  <span
                    class="
                      congestion-pill
                      ${levelClass}
                    "
                  >
                    ${c.status}
                    (${c.congestionPercentage}%)
                  </span>

                </td>

              </tr>
            `;

          })
          .join('');

    }


    // ------------------------------------------------------------
    // Refresh analytics
    // ------------------------------------------------------------

    if (window.trafficAnalytics) {

      window.trafficAnalytics
        .updateAllCharts();

    }


    console.log(
      `🔮 Prediction updated for corridor ${corridorId} at ${hour}:00`
    );

  }


  // ==============================================================
  // SIGNAL MODE
  // ==============================================================

  setSignalMode(mode) {

    if (window.signalController) {

      window.signalController
        .setMode(mode);

    }


    // Remove active state
    document
      .querySelectorAll('.mode-btn')
      .forEach(btn => {

        btn.classList.remove('active');

      });


    // Activate selected mode button
    const buttons =
      document.querySelectorAll(
        '.mode-btn'
      );


    buttons.forEach(btn => {

      const btnMode =
        btn.dataset.mode ||
        btn.getAttribute(
          'data-mode'
        );


      if (btnMode === mode) {

        btn.classList.add(
          'active'
        );

      }

    });


    console.log(
      `🚦 Signal mode: ${mode}`
    );


    this.updateDashboard();

  }


  // ==============================================================
  // INCIDENT HANDLER
  // ==============================================================

  handleIncidentToggled(edge) {

    const modal =
      document.getElementById(
        'incidentModal'
      );


    const modalName =
      document.getElementById(
        'modalEdgeName'
      );


    if (
      modal &&
      modalName &&
      edge &&
      edge.incident
    ) {

      modalName.textContent =
        `${edge.id} (${edge.corridorId})`;


      modal.classList.add(
        'show'
      );


      console.log(
        `🚨 Incident detected on ${edge.id}`
      );

    }

  }


  // ==============================================================
  // CLOSE MODAL
  // ==============================================================

  closeModal() {

    const modal =
      document.getElementById(
        'incidentModal'
      );


    if (modal) {

      modal.classList.remove(
        'show'
      );

    }

  }

}


// ================================================================
// APPLICATION BOOTSTRAP
// ================================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    window.app =
      new SmartTrafficApp();

    window.app.init();

  }
);