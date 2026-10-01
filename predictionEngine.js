/**
 * SmartTraffic AI - Traffic Prediction Engine
 * --------------------------------------------
 * Simulation-based traffic prediction and
 * corridor risk analysis engine.
 *
 * Inputs:
 * - Time of day
 * - Weather
 * - Special events
 * - Day type
 * - Roadwork
 * - Incident severity
 *
 * Outputs:
 * - Congestion
 * - Predicted speed
 * - Flow rate
 * - Queue length
 * - Delay
 * - Level of Service
 * - Bottleneck risk
 */

class TrafficPredictionEngine {
  constructor() {
    // ============================================================
    // WEATHER IMPACT
    // ============================================================

    this.weatherWeights = {
      clear: 1.00,
      rain: 1.15,
      fog: 1.22,
      snow: 1.35,
      storm: 1.50
    };

    // ============================================================
    // SPECIAL EVENT IMPACT
    // ============================================================

    this.eventMultipliers = {
      none: 1.00,
      stadium: 1.20,
      concert: 1.15,
      protest: 1.28,
      marathon: 1.35
    };

    // ============================================================
    // DAY TYPE IMPACT
    // ============================================================

    this.dayMultipliers = {
      weekday: 1.00,
      friday: 1.08,
      weekend: 0.78
    };

    // ============================================================
    // HOURLY TRAFFIC DEMAND PROFILE
    // ============================================================

    this.hourlyProfile = [
      0.18, // 00
      0.14, // 01
      0.11, // 02
      0.10, // 03
      0.14, // 04
      0.28, // 05
      0.52, // 06
      0.78, // 07
      0.92, // 08
      0.80, // 09
      0.66, // 10
      0.62, // 11
      0.68, // 12
      0.64, // 13
      0.62, // 14
      0.72, // 15
      0.88, // 16
      0.96, // 17
      1.00, // 18
      0.86, // 19
      0.68, // 20
      0.52, // 21
      0.36, // 22
      0.25  // 23
    ];

    // ============================================================
    // ROAD CORRIDORS
    // ============================================================

    this.corridors = [
      {
        id: 'C1',
        name: 'Downtown Metro Hub',
        baseCapacity: 1400,
        speedLimit: 45,
        sensitivity: 1.30,
        baseDemandFactor: 0.95
      },

      {
        id: 'C2',
        name: 'Tech Ridge Expressway',
        baseCapacity: 2200,
        speedLimit: 65,
        sensitivity: 0.85,
        baseDemandFactor: 0.78
      },

      {
        id: 'C3',
        name: 'Bay Bridge Connector',
        baseCapacity: 1800,
        speedLimit: 55,
        sensitivity: 1.05,
        baseDemandFactor: 0.86
      },

      {
        id: 'C4',
        name: 'Airport Central Parkway',
        baseCapacity: 1600,
        speedLimit: 50,
        sensitivity: 0.92,
        baseDemandFactor: 0.72
      },

      {
        id: 'C5',
        name: 'Northern Industrial Belt',
        baseCapacity: 1200,
        speedLimit: 40,
        sensitivity: 1.10,
        baseDemandFactor: 0.68
      },

      {
        id: 'C6',
        name: 'University District Arterial',
        baseCapacity: 1000,
        speedLimit: 35,
        sensitivity: 1.18,
        baseDemandFactor: 0.82
      }
    ];
  }

  // ============================================================
  // UTILITY
  // ============================================================

  clamp(value, min, max) {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }

  // ============================================================
  // LEVEL OF SERVICE
  // ============================================================

  calculateLOS(congestion) {
    if (congestion >= 0.90) return 'F';
    if (congestion >= 0.75) return 'E';
    if (congestion >= 0.60) return 'D';
    if (congestion >= 0.45) return 'C';
    if (congestion >= 0.25) return 'B';

    return 'A';
  }

  // ============================================================
  // TRAFFIC STATUS
  // ============================================================

  calculateStatus(congestion) {
    if (congestion >= 0.82) {
      return 'Critical';
    }

    if (congestion >= 0.58) {
      return 'Heavy';
    }

    if (congestion >= 0.35) {
      return 'Moderate';
    }

    return 'Smooth';
  }

  // ============================================================
  // DELAY ESTIMATION
  // ============================================================

  calculateDelay(congestion) {
    /*
     * Delay increases progressively with congestion.
     * Maximum modeled delay is around 18 minutes.
     */

    const delay =
      0.8 +
      Math.pow(congestion, 2.0) * 17;

    return Number(
      this.clamp(
        delay,
        0.8,
        18
      ).toFixed(1)
    );
  }

  // ============================================================
  // MAIN PREDICTION
  // ============================================================

  predictCorridorMetrics(params = {}) {

    // ------------------------------------------------------------
    // Read parameters
    // ------------------------------------------------------------

    const hour = this.clamp(
      Number.isFinite(Number(params.hour))
        ? Number(params.hour)
        : 12,
      0,
      23
    );

    const weather =
      params.weather || 'clear';

    const event =
      params.event || 'none';

    const dayType =
      params.dayType || 'weekday';

    const roadwork =
      Boolean(params.roadwork);

    const incidentLevel =
      this.clamp(
        Number.isFinite(
          Number(params.incidentLevel)
        )
          ? Number(params.incidentLevel)
          : 0,
        0,
        4
      );

    // ------------------------------------------------------------
    // Global multipliers
    // ------------------------------------------------------------

    const hourIndex =
      Math.floor(hour) % 24;

    const baseFlow =
      this.hourlyProfile[hourIndex];

    const weatherMult =
      this.weatherWeights[weather]
      || this.weatherWeights.clear;

    const eventMult =
      this.eventMultipliers[event]
      || this.eventMultipliers.none;

    const dayMult =
      this.dayMultipliers[dayType]
      || this.dayMultipliers.weekday;

    // ------------------------------------------------------------
    // Corridor predictions
    // ------------------------------------------------------------

    const predictions =
      this.corridors.map(
        corridor => {

          // ======================================================
          // 1. Traffic demand
          // ======================================================

          const demand =
            baseFlow *
            corridor.baseCapacity *
            corridor.baseDemandFactor *
            dayMult *
            eventMult;

          // ======================================================
          // 2. Capacity impact
          // ======================================================

          let capacityMultiplier = 1.0;

          // Weather
          capacityMultiplier /=
            weatherMult;

          // Roadwork
          if (roadwork) {
            capacityMultiplier *= 0.82;
          }

          // Incident
          if (incidentLevel > 0) {
            capacityMultiplier *=
              1 -
              incidentLevel * 0.06;
          }

          capacityMultiplier =
            this.clamp(
              capacityMultiplier,
              0.45,
              1.00
            );

          const effectiveCapacity =
            corridor.baseCapacity *
            capacityMultiplier;

          // ======================================================
          // 3. Demand / capacity ratio
          // ======================================================

          const utilization =
            demand /
            Math.max(
              1,
              effectiveCapacity
            );

          // ======================================================
          // 4. Base congestion
          // ======================================================

          /*
           * Instead of allowing utilization to explode
           * exponentially, we map it into a controlled
           * congestion curve.
           */

          const utilizationEffect =
            this.clamp(
              utilization,
              0,
              1.45
            );

          let congestion =
            0.10 +
            (
              utilizationEffect *
              0.48
            );

          // ======================================================
          // 5. Corridor sensitivity
          // ======================================================

          congestion *=
            (
              0.82 +
              corridor.sensitivity * 0.16
            );

          // ======================================================
          // 6. Weather impact
          // ======================================================

          congestion +=
            Math.max(
              0,
              weatherMult - 1
            ) * 0.12;

          // ======================================================
          // 7. Special event impact
          // ======================================================

          congestion +=
            Math.max(
              0,
              eventMult - 1
            ) * 0.08;

          // ======================================================
          // 8. Roadwork impact
          // ======================================================

          if (roadwork) {
            congestion += 0.08;
          }

          // ======================================================
          // 9. Incident impact
          // ======================================================

          congestion +=
            incidentLevel * 0.045;

          // ======================================================
          // 10. Peak-hour enhancement
          // ======================================================

          if (
            hour >= 7 &&
            hour <= 9
          ) {
            congestion += 0.04;
          }

          if (
            hour >= 16 &&
            hour <= 19
          ) {
            congestion += 0.06;
          }

          // ======================================================
          // Final congestion
          // ======================================================

          congestion =
            this.clamp(
              congestion,
              0.05,
              0.96
            );

          // ======================================================
          // Predicted speed
          // ======================================================

          let speedFactor;

          if (congestion < 0.30) {
            speedFactor = 0.92;
          }

          else if (congestion < 0.50) {
            speedFactor = 0.78;
          }

          else if (congestion < 0.70) {
            speedFactor = 0.62;
          }

          else if (congestion < 0.85) {
            speedFactor = 0.45;
          }

          else {
            speedFactor = 0.32;
          }

          const predictedSpeed =
            Math.max(
              8,
              Math.round(
                corridor.speedLimit *
                speedFactor
              )
            );

          // ======================================================
          // Flow rate
          // ======================================================

          const flowRate =
            Math.round(
              Math.min(
                demand,
                effectiveCapacity *
                0.92
              )
            );

          // ======================================================
          // Capacity utilization
          // ======================================================

          const capacityUtilization =
            this.clamp(
              utilization * 100,
              0,
              140
            );

          // ======================================================
          // Queue estimation
          // ======================================================

          /*
           * Queue is based on:
           * - congestion
           * - corridor demand
           * - capacity pressure
           *
           * Maximum queue intentionally capped
           * around 750m rather than forcing 850m.
           */

          const queueBase =
            congestion * 420;

          const pressureBonus =
            Math.max(
              0,
              utilization - 0.80
            ) * 280;

          const queueMeters =
            Math.round(
              this.clamp(
                queueBase +
                pressureBonus,
                25,
                750
              )
            );

          // ======================================================
          // Delay
          // ======================================================

          const delayMinutes =
            this.calculateDelay(
              congestion
            );

          // ======================================================
          // Percentage
          // ======================================================

          const congestionPercentage =
            Math.round(
              congestion * 100
            );

          // ======================================================
          // Risk score
          // ======================================================

          const riskScore =
            Math.round(
              this.clamp(
                congestion * 100 +
                incidentLevel * 3 +
                Math.max(
                  0,
                  weatherMult - 1
                ) * 10,
                0,
                100
              )
            );

          return {
            id: corridor.id,

            name: corridor.name,

            congestionIndex:
              Number(
                congestion.toFixed(2)
              ),

            congestionPercentage,

            predictedSpeed,

            speedLimit:
              corridor.speedLimit,

            flowRate,

            baseCapacity:
              corridor.baseCapacity,

            capacityUtilization:
              Number(
                capacityUtilization.toFixed(1)
              ),

            queueMeters,

            delayMinutes,

            los:
              this.calculateLOS(
                congestion
              ),

            status:
              this.calculateStatus(
                congestion
              ),

            riskScore
          };
        }
      );

    // ============================================================
    // NETWORK METRICS
    // ============================================================

    const avgCongestion =
      predictions.reduce(
        (sum, corridor) =>
          sum +
          corridor.congestionIndex,
        0
      ) /
      predictions.length;

    const avgSpeed =
      predictions.reduce(
        (sum, corridor) =>
          sum +
          corridor.predictedSpeed,
        0
      ) /
      predictions.length;

    const avgDelay =
      predictions.reduce(
        (sum, corridor) =>
          sum +
          corridor.delayMinutes,
        0
      ) /
      predictions.length;

    const totalQueue =
      predictions.reduce(
        (sum, corridor) =>
          sum +
          corridor.queueMeters,
        0
      );

    // ============================================================
    // INCIDENT RISK
    // ============================================================

    const predictedIncidentRisk =
      this.clamp(
        Math.round(
          avgCongestion * 70 +
          Math.max(
            0,
            weatherMult - 1
          ) * 25 +
          incidentLevel * 5
        ),
        5,
        95
      );

    // ============================================================
    // RETURN
    // ============================================================

    return {
      corridors: predictions,

      avgCongestion:
        Math.round(
          avgCongestion * 100
        ),

      networkHealth:
        Math.round(
          (1 - avgCongestion) * 100
        ),

      avgSpeed:
        Math.round(avgSpeed),

      avgDelay:
        Number(
          avgDelay.toFixed(1)
        ),

      totalQueueMeters:
        totalQueue,

      predictedIncidentRisk,

      demandProfile:
        Number(
          (
            baseFlow * 100
          ).toFixed(1)
        ),

      conditions: {
        hour,
        weather,
        event,
        dayType,
        roadwork,
        incidentLevel
      }
    };
  }

  // ============================================================
  // 24-HOUR FORECAST
  // ============================================================

  generate24HourForecast(
    corridorId,
    weather = 'clear',
    event = 'none',
    dayType = 'weekday'
  ) {

    const targetCorridor =
      this.corridors.find(
        corridor =>
          corridor.id === corridorId
      ) ||
      this.corridors[0];

    const forecast = [];

    for (
      let hour = 0;
      hour < 24;
      hour++
    ) {

      const prediction =
        this.predictCorridorMetrics({
          hour,
          weather,
          event,
          dayType,
          roadwork: false,
          incidentLevel: 0
        });

      const corridorPrediction =
        prediction.corridors.find(
          corridor =>
            corridor.id ===
            targetCorridor.id
        );

      forecast.push({
        hour:
          `${String(hour).padStart(2, '0')}:00`,

        congestionPercentage:
          corridorPrediction
            .congestionPercentage,

        predictedSpeed:
          corridorPrediction
            .predictedSpeed,

        flowRate:
          corridorPrediction
            .flowRate,

        queueMeters:
          corridorPrediction
            .queueMeters,

        delayMinutes:
          corridorPrediction
            .delayMinutes,

        los:
          corridorPrediction.los,

        status:
          corridorPrediction.status,

        riskScore:
          corridorPrediction.riskScore
      });
    }

    return forecast;
  }

  // ============================================================
  // CORRIDOR ACCESS
  // ============================================================

  getCorridors() {
    return this.corridors.map(
      corridor => ({
        ...corridor
      })
    );
  }

  getCorridor(corridorId) {
    return (
      this.corridors.find(
        corridor =>
          corridor.id === corridorId
      ) ||
      null
    );
  }
}

// ================================================================
// GLOBAL APPLICATION INSTANCE
// ================================================================

window.predictionEngine =
  new TrafficPredictionEngine();