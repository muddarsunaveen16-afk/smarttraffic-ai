/**
 * SmartTraffic AI - Performance Telemetry & Canvas Charts Engine
 * ---------------------------------------------------------------
 * Dynamic analytics based on the prediction engine and
 * live application conditions.
 *
 * Charts:
 * 1. 24-hour congestion timeline
 * 2. Fixed Schedule vs AI Adaptive delay comparison
 */

class TrafficAnalytics {
  constructor() {
    this.historyData = [];
    this.maxHistory = 24;

    this.initMockHistory();
  }

  // ================================================================
  // INITIALIZE 24-HOUR HISTORY
  // ================================================================

  initMockHistory() {
    this.historyData = [];

    if (!window.predictionEngine) {
      return;
    }

    for (let h = 0; h < 24; h++) {
      const prediction =
        window.predictionEngine.predictCorridorMetrics({
          hour: h,
          weather: 'clear',
          event: 'none',
          dayType: 'weekday',
          roadwork: false,
          incidentLevel: 0
        });

      const congestion =
        Number(prediction.avgCongestion) || 0;

      const flow =
        Math.round(
          prediction.corridors.reduce(
            (sum, corridor) =>
              sum + Number(corridor.flowRate || 0),
            0
          )
        );

      const avgDelay =
        Number(prediction.avgDelay) || 0;

      /*
       * Fixed schedule represents a less optimized
       * signal configuration.
       */

      const delayFixed =
        Number(
          (
            avgDelay * 1.25
          ).toFixed(1)
        );

      /*
       * AI Adaptive represents optimized signal timing.
       */

      const delayAi =
        Number(
          (
            avgDelay * 0.78
          ).toFixed(1)
        );

      this.historyData.push({
        hour:
          `${String(h).padStart(2, '0')}:00`,

        congestion,

        flow,

        delayAi,

        delayFixed
      });
    }
  }

  // ================================================================
  // GET CURRENT APPLICATION CONDITIONS
  // ================================================================

  getCurrentConditions() {
    const hour =
      parseInt(
        document
          .getElementById('sliderTimeOfDay')
          ?.value || 17
      );

    const weather =
      document
        .getElementById('selWeather')
        ?.value || 'clear';

    const event =
      document
        .getElementById('selEvent')
        ?.value || 'none';

    const incidentLevel =
      parseInt(
        document
          .getElementById('sliderIncidentSev')
          ?.value || 0
      );

    const roadwork =
      window.app
        ? Boolean(window.app.roadworkActive)
        : false;

    return {
      hour,
      weather,
      event,
      dayType: 'weekday',
      roadwork,
      incidentLevel
    };
  }

  // ================================================================
  // GET CURRENT PREDICTION
  // ================================================================

  getCurrentPrediction() {
    if (!window.predictionEngine) {
      return null;
    }

    const conditions =
      this.getCurrentConditions();

    return window.predictionEngine
      .predictCorridorMetrics(
        conditions
      );
  }

  // ================================================================
  // REFRESH 24-HOUR HISTORY
  // ================================================================

  refreshHistory() {
    this.initMockHistory();
  }

  // ================================================================
  // 24-HOUR CONGESTION TIMELINE
  // ================================================================

  renderTimelineChart(canvasId) {
    const canvas =
      document.getElementById(canvasId);

    if (!canvas) {
      return;
    }

    const parent =
      canvas.parentElement;

    const w =
      parent?.clientWidth || 500;

    const h =
      parent?.clientHeight || 240;

    canvas.width = w;
    canvas.height = h;

    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      w,
      h
    );

    if (
      !this.historyData.length
    ) {
      return;
    }

    // ------------------------------------------------------------
    // Layout
    // ------------------------------------------------------------

    const padding = 40;

    const chartW =
      w - padding * 2;

    const chartH =
      h - padding * 2;

    // ------------------------------------------------------------
    // Grid
    // ------------------------------------------------------------

    ctx.strokeStyle =
      'rgba(45, 62, 95, 0.4)';

    ctx.lineWidth = 1;

    ctx.font =
      '10px Outfit, sans-serif';

    ctx.fillStyle =
      '#8e9bb4';

    ctx.textAlign =
      'left';

    for (
      let i = 0;
      i <= 4;
      i++
    ) {
      const percentage =
        i * 25;

      const y =
        h -
        padding -
        (i / 4) *
          chartH;

      ctx.beginPath();

      ctx.moveTo(
        padding,
        y
      );

      ctx.lineTo(
        w - padding,
        y
      );

      ctx.stroke();

      ctx.fillText(
        `${percentage}%`,
        8,
        y + 3
      );
    }

    // ------------------------------------------------------------
    // Build points
    // ------------------------------------------------------------

    const points =
      this.historyData.map(
        (point, idx) => {

          const x =
            padding +
            (
              idx /
              (this.historyData.length - 1)
            ) *
            chartW;

          const congestion =
            this.clamp(
              Number(point.congestion) || 0,
              0,
              100
            );

          const y =
            h -
            padding -
            (
              congestion / 100
            ) *
              chartH;

          return {
            x,
            y,
            congestion
          };
        }
      );

    // ------------------------------------------------------------
    // Area fill
    // ------------------------------------------------------------

    ctx.beginPath();

    points.forEach(
      (point, idx) => {

        if (idx === 0) {
          ctx.moveTo(
            point.x,
            point.y
          );
        } else {
          ctx.lineTo(
            point.x,
            point.y
          );
        }
      }
    );

    ctx.lineTo(
      w - padding,
      h - padding
    );

    ctx.lineTo(
      padding,
      h - padding
    );

    ctx.closePath();

    const gradient =
      ctx.createLinearGradient(
        0,
        padding,
        0,
        h - padding
      );

    gradient.addColorStop(
      0,
      'rgba(0, 242, 254, 0.35)'
    );

    gradient.addColorStop(
      1,
      'rgba(0, 242, 254, 0.02)'
    );

    ctx.fillStyle =
      gradient;

    ctx.fill();

    // ------------------------------------------------------------
    // Main line
    // ------------------------------------------------------------

    ctx.beginPath();

    points.forEach(
      (point, idx) => {

        if (idx === 0) {
          ctx.moveTo(
            point.x,
            point.y
          );
        } else {
          ctx.lineTo(
            point.x,
            point.y
          );
        }
      }
    );

    ctx.strokeStyle =
      '#00f2fe';

    ctx.lineWidth = 3;

    ctx.stroke();

    // ------------------------------------------------------------
    // Hour labels
    // ------------------------------------------------------------

    ctx.fillStyle =
      '#8e9bb4';

    ctx.font =
      '9px Outfit, sans-serif';

    ctx.textAlign =
      'center';

    this.historyData.forEach(
      (point, idx) => {

        if (
          idx % 3 !== 0
        ) {
          return;
        }

        const x =
          padding +
          (
            idx /
            (this.historyData.length - 1)
          ) *
            chartW;

        ctx.fillText(
          point.hour,
          x,
          h - 10
        );
      }
    );

    // ------------------------------------------------------------
    // Current selected hour
    // ------------------------------------------------------------

    const selectedHour =
      this.getCurrentConditions()
        .hour;

    const currentIndex =
      this.clamp(
        Math.round(selectedHour),
        0,
        23
      );

    const currentPoint =
      points[currentIndex];

    if (currentPoint) {

      ctx.fillStyle =
        '#ff2a5f';

      ctx.shadowColor =
        '#ff2a5f';

      ctx.shadowBlur = 12;

      ctx.beginPath();

      ctx.arc(
        currentPoint.x,
        currentPoint.y,
        6,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.shadowBlur = 0;

      // Current value label

      ctx.fillStyle =
        '#ffffff';

      ctx.font =
        'bold 10px Outfit, sans-serif';

      ctx.fillText(
        `${currentPoint.congestion}%`,
        currentPoint.x,
        currentPoint.y - 12
      );
    }
  }

  // ================================================================
  // FIXED VS AI ADAPTIVE DELAY COMPARISON
  // ================================================================

  renderDelayComparisonChart(canvasId) {
    const canvas =
      document.getElementById(canvasId);

    if (!canvas) {
      return;
    }

    const parent =
      canvas.parentElement;

    const w =
      parent?.clientWidth || 500;

    const h =
      parent?.clientHeight || 240;

    canvas.width = w;
    canvas.height = h;

    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      w,
      h
    );

    const prediction =
      this.getCurrentPrediction();

    if (
      !prediction ||
      !Array.isArray(
        prediction.corridors
      )
    ) {
      return;
    }

    // ------------------------------------------------------------
    // Prepare corridor data
    // ------------------------------------------------------------

    const corridors =
      prediction.corridors.map(
        corridor => {

          const baseDelay =
            Number(
              corridor.delayMinutes
            ) || 0;

          /*
           * Fixed schedule:
           * less responsive to traffic demand.
           */

          const fixed =
            Number(
              (
                baseDelay * 1.28
              ).toFixed(1)
            );

          /*
           * AI Adaptive:
           * optimized signal timing.
           */

          const ai =
            Number(
              (
                baseDelay * 0.78
              ).toFixed(1)
            );

          return {
            name:
              this.shortCorridorName(
                corridor.name
              ),

            fixed,

            ai
          };
        }
      );

    // ------------------------------------------------------------
    // Chart layout
    // ------------------------------------------------------------

    const padding = 42;

    const chartH =
      h - padding * 2;

    const chartW =
      w - padding * 2;

    const groupW =
      chartW /
      Math.max(
        1,
        corridors.length
      );

    const barWidth =
      Math.min(
        14,
        groupW * 0.18
      );

    // ------------------------------------------------------------
    // Find max value
    // ------------------------------------------------------------

    const maxDelay =
      Math.max(
        5,
        ...corridors.map(
          c =>
            Math.max(
              c.fixed,
              c.ai
            )
        )
      );

    const chartMax =
      Math.ceil(
        maxDelay / 5
      ) * 5;

    // ------------------------------------------------------------
    // Horizontal grid
    // ------------------------------------------------------------

    ctx.strokeStyle =
      'rgba(45, 62, 95, 0.35)';

    ctx.lineWidth = 1;

    ctx.font =
      '10px Outfit, sans-serif';

    ctx.fillStyle =
      '#8e9bb4';

    ctx.textAlign =
      'left';

    for (
      let i = 0;
      i <= 4;
      i++
    ) {

      const value =
        (
          chartMax / 4
        ) *
        i;

      const y =
        h -
        padding -
        (
          value /
          chartMax
        ) *
          chartH;

      ctx.beginPath();

      ctx.moveTo(
        padding,
        y
      );

      ctx.lineTo(
        w - padding,
        y
      );

      ctx.stroke();

      ctx.fillText(
        `${value.toFixed(0)}m`,
        8,
        y + 3
      );
    }

    // ------------------------------------------------------------
    // Draw bars
    // ------------------------------------------------------------

    corridors.forEach(
      (corridor, idx) => {

        const centerX =
          padding +
          idx * groupW +
          groupW / 2;

        const fixedHeight =
          (
            corridor.fixed /
            chartMax
          ) *
          chartH;

        const aiHeight =
          (
            corridor.ai /
            chartMax
          ) *
          chartH;

        // Fixed

        ctx.fillStyle =
          '#ff2a5f';

        ctx.fillRect(
          centerX -
            barWidth -
            3,

          h -
            padding -
            fixedHeight,

          barWidth,

          fixedHeight
        );

        // AI

        ctx.fillStyle =
          '#00f2fe';

        ctx.fillRect(
          centerX + 3,

          h -
            padding -
            aiHeight,

          barWidth,

          aiHeight
        );

        // Label

        ctx.fillStyle =
          '#8e9bb4';

        ctx.font =
          '9px Outfit, sans-serif';

        ctx.textAlign =
          'center';

        ctx.fillText(
          corridor.name,
          centerX,
          h - 12
        );
      }
    );

    // ------------------------------------------------------------
    // Legend
    // ------------------------------------------------------------

    ctx.textAlign =
      'left';

    ctx.fillStyle =
      '#ff2a5f';

    ctx.fillRect(
      w - 145,
      12,
      10,
      10
    );

    ctx.fillStyle =
      '#8e9bb4';

    ctx.fillText(
      'Fixed Timer',
      w - 130,
      21
    );

    ctx.fillStyle =
      '#00f2fe';

    ctx.fillRect(
      w - 145,
      30,
      10,
      10
    );

    ctx.fillStyle =
      '#8e9bb4';

    ctx.fillText(
      'AI Adaptive',
      w - 130,
      39
    );
  }

  // ================================================================
  // SHORT CORRIDOR NAME
  // ================================================================

  shortCorridorName(name) {

    const names = {
      'Downtown Metro Hub':
        'Downtown',

      'Tech Ridge Expressway':
        'Tech Ridge',

      'Bay Bridge Connector':
        'Bay Bridge',

      'Airport Central Parkway':
        'Airport',

      'Northern Industrial Belt':
        'Industrial',

      'University District Arterial':
        'University'
    };

    return (
      names[name] ||
      name.substring(
        0,
        12
      )
    );
  }

  // ================================================================
  // UTILITY
  // ================================================================

  clamp(value, min, max) {
    return Math.min(
      max,
      Math.max(
        min,
        value
      )
    );
  }

  // ================================================================
  // UPDATE ALL CHARTS
  // ================================================================

  updateAllCharts() {

    /*
     * Rebuild the baseline 24-hour
     * forecast before rendering.
     */

    this.refreshHistory();

    this.renderTimelineChart(
      'timelineCanvas'
    );

    this.renderDelayComparisonChart(
      'delayCanvas'
    );
  }
}

// ================================================================
// GLOBAL ANALYTICS INSTANCE
// ================================================================

window.trafficAnalytics =
  new TrafficAnalytics();