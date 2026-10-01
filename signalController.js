/**
 * SmartTraffic AI - Adaptive Traffic Signal Controller Engine
 *
 * Features:
 * - Fixed-time signal control
 * - Actuated signal control
 * - AI-inspired adaptive signal optimization
 * - Emergency green-wave preemption
 * - Live telemetry derived from traffic conditions
 */

class AdaptiveSignalController {
  constructor() {
    this.mode = 'ai';

    this.signalState = 'NS_GREEN';
    this.timer = 0;

    // Signal configuration (seconds)
    this.config = {
      minGreen: 10,
      maxGreen: 60,
      yellowTime: 4,
      fixedCycleNS: 30,
      fixedCycleEW: 30
    };

    // Live telemetry
    this.stats = {
      totalVehiclesProcessed: 0,
      avgWaitTimeReduction: 0,
      co2SavedKg: 0,
      fuelSavedLiters: 0,
      emergencyPreemptions: 0
    };

    this.currentGreenDuration = 30;

    // Internal counters
    this.totalGreenTime = 0;
    this.totalObservedVehicles = 0;
    this.previousQueue = 0;
    this.lastTelemetryUpdate = 0;
  }

  /**
   * Calculate adaptive green time based on traffic demand.
   */
  calculateAdaptiveGreenTime(
    nsQueue,
    ewQueue,
    nsArrivalRate = 5,
    ewArrivalRate = 5
  ) {
    nsQueue = Math.max(0, Number(nsQueue) || 0);
    ewQueue = Math.max(0, Number(ewQueue) || 0);

    nsArrivalRate = Math.max(0, Number(nsArrivalRate) || 0);
    ewArrivalRate = Math.max(0, Number(ewArrivalRate) || 0);

    // FIXED MODE
    if (this.mode === 'fixed') {
      return {
        nsGreen: this.config.fixedCycleNS,
        ewGreen: this.config.fixedCycleEW,
        optimalCycle:
          this.config.fixedCycleNS +
          this.config.fixedCycleEW +
          this.config.yellowTime * 2
      };
    }

    // ACTUATED MODE
    if (this.mode === 'actuated') {
      const nsGreen = Math.min(
        this.config.maxGreen,
        Math.max(
          this.config.minGreen,
          Math.round(nsQueue * 2)
        )
      );

      const ewGreen = Math.min(
        this.config.maxGreen,
        Math.max(
          this.config.minGreen,
          Math.round(ewQueue * 2)
        )
      );

      return {
        nsGreen,
        ewGreen,
        optimalCycle:
          nsGreen +
          ewGreen +
          this.config.yellowTime * 2
      };
    }

    // AI-INSPIRED ADAPTIVE MODE
    //
    // Demand is calculated from:
    // - Current queue
    // - Estimated arrival rate
    //
    // This is a deterministic optimization model,
    // not a trained machine-learning model.

    const nsDemand = nsQueue + nsArrivalRate * 1.5;
    const ewDemand = ewQueue + ewArrivalRate * 1.5;

    const totalDemand = Math.max(
      1,
      nsDemand + ewDemand
    );

    const targetCycleLength = Math.min(
      120,
      Math.max(
        40,
        1.5 * (nsQueue + ewQueue) + 20
      )
    );

    let nsGreen = Math.round(
      (nsDemand / totalDemand) *
      targetCycleLength
    );

    let ewGreen = Math.round(
      (ewDemand / totalDemand) *
      targetCycleLength
    );

    // Safety limits
    nsGreen = Math.min(
      this.config.maxGreen,
      Math.max(this.config.minGreen, nsGreen)
    );

    ewGreen = Math.min(
      this.config.maxGreen,
      Math.max(this.config.minGreen, ewGreen)
    );

    return {
      nsGreen,
      ewGreen,
      optimalCycle:
        nsGreen +
        ewGreen +
        this.config.yellowTime * 2
    };
  }

  /**
   * Estimate environmental savings.
   *
   * These values are simulation estimates based on reduced
   * waiting/queue conditions, not real-world measurements.
   */
  updateTelemetry(dt, nsQueue, ewQueue) {
    const totalQueue =
      Math.max(0, Number(nsQueue) || 0) +
      Math.max(0, Number(ewQueue) || 0);

    const queueReduction = Math.max(
      0,
      this.previousQueue - totalQueue
    );

    this.previousQueue = totalQueue;

    /*
     * Estimate vehicles processed.
     *
     * Instead of Math.random(), vehicle throughput is
     * derived from queue conditions and simulation time.
     */
    const throughputRate = Math.max(
      0,
      Math.min(
        12,
        4 +
        queueReduction * 0.5 +
        (this.mode === 'ai' ? 2 : 0)
      )
    );

    const processed =
      (throughputRate * dt) / 60;

    this.stats.totalVehiclesProcessed += processed;

    /*
     * Estimate benefit of adaptive control.
     *
     * Higher queue reduction = greater benefit.
     */
    const controlEfficiency =
      this.mode === 'ai'
        ? 1.0
        : this.mode === 'actuated'
          ? 0.65
          : 0.25;

    const baseReduction =
      Math.min(60, Math.max(0, 25 + queueReduction * 2));

    this.stats.avgWaitTimeReduction =
      Math.min(
        60,
        Math.max(
          0,
          baseReduction * controlEfficiency
        )
      );

    /*
     * Environmental estimates.
     *
     * Approximate savings from smoother traffic flow.
     */
    const co2PerVehicle =
      0.008 * controlEfficiency;

    const fuelPerVehicle =
      0.003 * controlEfficiency;

    this.stats.co2SavedKg +=
      processed * co2PerVehicle;

    this.stats.fuelSavedLiters +=
      processed * fuelPerVehicle;
  }

  /**
   * Advance signal controller.
   */
  update(dt, nsQueue, ewQueue) {
    dt = Math.max(0, Number(dt) || 0);

    this.timer += dt;
    this.totalGreenTime += dt;

    const timings =
      this.calculateAdaptiveGreenTime(
        nsQueue,
        ewQueue,
        5,
        5
      );

    // NORTH-SOUTH GREEN
    if (this.signalState === 'NS_GREEN') {
      this.currentGreenDuration =
        timings.nsGreen;

      if (
        this.timer >=
        this.currentGreenDuration
      ) {
        this.signalState = 'NS_YELLOW';
        this.timer = 0;
      }
    }

    // NORTH-SOUTH YELLOW
    else if (this.signalState === 'NS_YELLOW') {
      if (
        this.timer >=
        this.config.yellowTime
      ) {
        this.signalState = 'EW_GREEN';
        this.timer = 0;
      }
    }

    // EAST-WEST GREEN
    else if (this.signalState === 'EW_GREEN') {
      this.currentGreenDuration =
        timings.ewGreen;

      if (
        this.timer >=
        this.currentGreenDuration
      ) {
        this.signalState = 'EW_YELLOW';
        this.timer = 0;
      }
    }

    // EAST-WEST YELLOW
    else if (this.signalState === 'EW_YELLOW') {
      if (
        this.timer >=
        this.config.yellowTime
      ) {
        this.signalState = 'NS_GREEN';
        this.timer = 0;
      }
    }

    // Update live telemetry
    this.updateTelemetry(
      dt,
      nsQueue,
      ewQueue
    );

    const duration =
      this.signalState.includes('GREEN')
        ? this.currentGreenDuration
        : this.config.yellowTime;

    return {
      state: this.signalState,

      timeRemaining: Math.max(
        0,
        Math.ceil(
          duration - this.timer
        )
      ),

      mode: this.mode,

      nsGreen: timings.nsGreen,
      ewGreen: timings.ewGreen
    };
  }

  /**
   * Change signal control mode.
   */
  setMode(newMode) {
    if (
      ['fixed', 'actuated', 'ai'].includes(
        newMode
      )
    ) {
      this.mode = newMode;
      this.timer = 0;

      console.log(
        `Signal control mode changed to: ${newMode}`
      );
    }
  }

  /**
   * Emergency green-wave preemption.
   */
  triggerEmergencyWave() {
    this.signalState = 'NS_GREEN';
    this.timer = 0;

    this.stats.emergencyPreemptions++;

    console.log(
      '🚨 Emergency green wave activated'
    );
  }

  /**
   * Return telemetry for dashboard.
   */
  getStats() {
    return {
      totalVehiclesProcessed:
        Math.round(
          this.stats.totalVehiclesProcessed
        ),

      avgWaitTimeReduction:
        Number(
          this.stats.avgWaitTimeReduction.toFixed(1)
        ),

      co2SavedKg:
        Number(
          this.stats.co2SavedKg.toFixed(2)
        ),

      fuelSavedLiters:
        Number(
          this.stats.fuelSavedLiters.toFixed(2)
        ),

      emergencyPreemptions:
        this.stats.emergencyPreemptions
    };
  }

  /**
   * Return current signal information.
   */
  getState() {
    return {
      state: this.signalState,
      mode: this.mode,
      timer: this.timer,
      currentGreenDuration:
        this.currentGreenDuration
    };
  }

  /**
   * Reset telemetry.
   */
  resetStats() {
    this.stats = {
      totalVehiclesProcessed: 0,
      avgWaitTimeReduction: 0,
      co2SavedKg: 0,
      fuelSavedLiters: 0,
      emergencyPreemptions: 0
    };

    this.previousQueue = 0;
    this.totalGreenTime = 0;
  }
}

// Global controller
window.signalController =
  new AdaptiveSignalController();