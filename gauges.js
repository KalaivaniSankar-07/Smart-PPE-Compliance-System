/* global gauge drawing – light theme */
(function () {

  const COLORS = {
    temp: { track: '#F3E8D8', fill: '#E8730A', text: '#E8730A', label: 'TEMP'     },
    hum:  { track: '#DCEEF9', fill: '#0E6BB5', text: '#0E6BB5', label: 'HUMIDITY' },
    gas:  { track: '#EDE9FE', fill: '#6D28D9', text: '#6D28D9', label: 'GAS'      },
  };

  /**
   * drawRadial – arc gauge
   * @param {string} id       canvas element id
   * @param {number} ratio    0..1
   * @param {'temp'|'hum'|'gas'} type
   * @param {string} valueStr display string e.g. "32.1"
   * @param {string} unit     e.g. "°C"
   */
  function drawRadial(id, ratio, type, valueStr, unit) {
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 14;
    const col = COLORS[type];

    const SA = Math.PI * 0.75;
    const EA = Math.PI * 2.25;
    const FA = SA + (EA - SA) * Math.min(Math.max(ratio, 0), 1);

    ctx.clearRect(0, 0, W, H);

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, R, SA, EA);
    ctx.strokeStyle = col.track;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    if (ratio > 0.01) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, SA, FA);
      ctx.strokeStyle = col.fill;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Center value
    ctx.fillStyle = col.text;
    ctx.font = `500 1.05rem 'DM Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(valueStr, cx, cy - 6);

    // Unit
    ctx.fillStyle = '#9AA5B8';
    ctx.font = `400 0.58rem 'DM Mono', monospace`;
    ctx.fillText(unit, cx, cy + 11);

    // Label below
    ctx.fillStyle = '#9AA5B8';
    ctx.font = `500 0.58rem 'Sora', sans-serif`;
    ctx.fillText(col.label, cx, cy + 28);
  }

  /**
   * drawScoreRing – full circle score ring
   * @param {string} id    canvas id
   * @param {number} score 0..100
   */
  function drawScoreRing(id, score) {
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 12;

    let fillColor = '#16A34A';
    if (score < 50)      fillColor = '#DC2626';
    else if (score < 75) fillColor = '#D97706';

    ctx.clearRect(0, 0, W, H);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#EEF0F5';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Fill
    if (score > 0) {
      const end = -Math.PI / 2 + (Math.PI * 2 * score / 100);
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, end);
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Tick marks
    for (let i = 0; i < 24; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i / 24);
      const inner = R - 6;
      const outer = R - 12;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  window.drawRadial    = drawRadial;
  window.drawScoreRing = drawScoreRing;
})();
