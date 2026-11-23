const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
function node(name, attrs = {}, text = '') {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  if (text) element.textContent = text;
  return element;
}
const colors = ['#6ce5d4', '#8daeff', '#ffad8a', '#e9d28a'];
const fields = ['value', 'velocity', 'acceleration', 'jerk'];
const format = value => Number.isFinite(value) ? (Math.abs(value) < 1e-9 ? '0.000' : Math.abs(value) > 9999 ? value.toExponential(2) : value.toFixed(3)) : '—';

try {
  const { catalog, evaluate, derivatives, sample, toCSS, breakpoints } = await import('../src/curves.mjs');
  let current = catalog.find(curve => curve.id === decodeURIComponent(location.hash.slice(1))) || catalog.find(curve => curve.id === 'smootherstep') || catalog[0];
  let params = {};
  let referenceId = 'linear';
  let t = 0;
  let playing = false;
  let frame = 0;
  let previousTime = null;
  let plotBounds = [-0.08, 1.08];
  let currentSamples = [];
  let selectedBreaks = [];
  const cursorMaps = [];

  function resetParams() {
    params = Object.fromEntries(current.parameters.map(param => [param.key, param.default]));
  }
  function descriptor() {
    return {
      format: 'curve-system/selection@0.1',
      curve: { id: current.id, parameters: { ...params } },
      playback: { durationSeconds: duration() },
      domain: [0, 1],
      outputPolicy: 'preserve'
    };
  }
  function duration() {
    const value = Number($('duration').value);
    return Number.isFinite(value) && value >= 0.1 && value <= 30 ? value : 1.6;
  }
  function metadataNotes() {
    const notes = current.notes;
    return Array.isArray(notes) ? notes.join(' ') : typeof notes === 'string' ? notes : '';
  }
  function miniature(curve) {
    const values = Array.from({ length: 41 }, (_, i) => evaluate(curve.id, i / 40));
    const low = Math.min(0, ...values), high = Math.max(1, ...values);
    const points = values.map((value, i) => `${4 + i / 40 * 42},${32 - (value - low) / (high - low) * 25}`).join(' ');
    const svg = node('svg', { viewBox: '0 0 50 38', width: '44', height: '34', 'aria-hidden': 'true' });
    svg.append(node('path', { d: 'M4 4V33H47', stroke: '#34465c', fill: 'none' }));
    svg.append(node('polyline', { points, fill: 'none', stroke: colors[0], 'stroke-width': '1.8', 'stroke-linejoin': 'round' }));
    return svg;
  }
  const miniatures = new Map(catalog.map(curve => [curve.id, miniature(curve)]));
  function renderList() {
    const query = $('search').value.toLocaleLowerCase().trim();
    const family = $('family').value;
    const matching = catalog.filter(curve => (family === 'all' || curve.family === family) && [curve.id, curve.name, curve.nameRu, curve.family].filter(Boolean).join(' ').toLocaleLowerCase().includes(query));
    $('count').textContent = `${matching.length} / ${catalog.length}`;
    $('curve-list').replaceChildren();
    for (const curve of matching) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'curve-choice';
      button.dataset.curve = curve.id;
      button.setAttribute('aria-pressed', String(curve.id === current.id));
      const label = document.createElement('span');
      const name = document.createElement('b');
      name.textContent = curve.nameRu || curve.name;
      const sub = document.createElement('small');
      sub.textContent = curve.id;
      label.append(name, sub);
      button.append(miniatures.get(curve.id).cloneNode(true), label);
      button.addEventListener('click', () => select(curve.id));
      $('curve-list').append(button);
    }
    if (!matching.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Кривых по этому запросу нет.'; $('curve-list').append(empty);
    }
  }
  function select(id) {
    stop();
    current = catalog.find(curve => curve.id === id);
    resetParams();
    history.replaceState(null, '', `#${encodeURIComponent(current.id)}`);
    t = 0;
    renderList();
    renderParameters();
    renderCharts();
  }
  function renderParameters() {
    $('parameters').replaceChildren();
    if (!current.parameters.length) {
      const p = document.createElement('p'); p.className = 'no-params'; p.textContent = 'Форма задана формулой. Характер движения можно менять длительностью.'; $('parameters').append(p);
    }
    current.parameters.forEach(param => {
      const wrapper = document.createElement('div'); wrapper.className = 'parameter';
      const label = document.createElement('label'); label.htmlFor = `param-${param.key}`;
      const text = document.createElement('span'); text.textContent = param.label || param.key;
      const output = document.createElement('output'); output.textContent = params[param.key]; output.htmlFor = label.htmlFor;
      const input = document.createElement('input'); input.id = label.htmlFor; input.type = 'range'; input.min = param.min; input.max = param.max; input.step = param.step || 0.01; input.value = params[param.key];
      input.addEventListener('input', () => {
        const previous = params[param.key];
        params[param.key] = Number(input.value); output.textContent = input.value;
        try { renderCharts(); $('export-status').textContent = ''; }
        catch (error) { params[param.key] = previous; input.value = previous; output.textContent = previous; $('export-status').textContent = error.message; }
      });
      label.append(text, output); wrapper.append(label, input); $('parameters').append(wrapper);
    });
  }
  function enrichedSamples(id, parameters, breaks) {
    const points = sample(id, 241, parameters);
    // Include both one-sided limits near events; never bridge them with a false ramp.
    for (const { t: eventTime } of breaks) {
      for (const point of [eventTime - 1e-7, eventTime, eventTime + 1e-7]) {
        if (point > 0 && point < 1) points.push({ t: point, ...derivatives(id, point, parameters) });
      }
    }
    return points.sort((a, b) => a.t - b.t);
  }
  function graph(target, series, comparison, order, breaks, referenceBreaks) {
    const small = order > 0;
    const width = small ? 280 : 820, height = small ? 170 : 350;
    const pad = { left: small ? 35 : 48, right: 14, top: small ? 15 : 20, bottom: 28 };
    const field = fields[order];
    const values = [...series, ...comparison].map(point => point[field]).filter(Number.isFinite);
    let min = Math.min(0, ...values), max = Math.max(order === 0 ? 1 : 0, ...values);
    if (max - min < 1e-8) { min -= 0.5; max += 0.5; }
    const margin = (max - min) * 0.09; min -= margin; max += margin;
    if (order === 0) plotBounds = [min, max];
    const x = time => pad.left + time * (width - pad.left - pad.right);
    const y = value => height - pad.bottom - (value - min) / (max - min) * (height - pad.top - pad.bottom);
    const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, class: 'graph-svg', role: 'img', 'aria-label': `${['Значение', 'Скорость', 'Ускорение', 'Рывок'][order]}: ${current.nameRu || current.name}` });
    svg.append(node('title', {}, `${field} · ${current.id}`));
    for (const time of [0, 0.25, 0.5, 0.75, 1]) {
      svg.append(node('line', { x1: x(time), x2: x(time), y1: pad.top, y2: height - pad.bottom, stroke: '#223047', 'stroke-width': 1 }));
      if (!small || [0, 0.5, 1].includes(time)) svg.append(node('text', { x: x(time), y: height - 8, 'text-anchor': 'middle', fill: '#8395b0', 'font-size': small ? 10 : 11 }, String(time)));
    }
    const ticks = order === 0 ? [...new Set([min < -0.15 ? Number(min.toFixed(1)) : 0, 0, 0.5, 1, max > 1.15 ? Number(max.toFixed(1)) : 1])] : [min + margin, 0, max - margin];
    for (const value of [...new Set(ticks)]) {
      if (value < min || value > max) continue;
      svg.append(node('line', { x1: x(0), x2: x(1), y1: y(value), y2: y(value), stroke: value === 0 ? '#42516a' : '#223047', 'stroke-width': 1 }));
      svg.append(node('text', { x: pad.left - 8, y: y(value) + 4, 'text-anchor': 'end', fill: '#8395b0', 'font-size': small ? 10 : 11 }, Math.abs(value) >= 1000 ? value.toExponential(0) : String(Number(value.toFixed(2)))));
    }
    function path(points, discontinuities, stroke, dashed) {
      let commands = '', active = false, last = null;
      for (const point of points) {
        const crosses = last !== null && discontinuities.some(event => event.order <= order && event.t > last && event.t <= point.t);
        if (!Number.isFinite(point[field])) { active = false; last = point.t; continue; }
        if (crosses) active = false;
        commands += `${active ? 'L' : 'M'}${x(point.t).toFixed(3)},${y(point[field]).toFixed(3)}`;
        active = true; last = point.t;
      }
      svg.append(node('path', { d: commands, fill: 'none', stroke, 'stroke-width': small ? 2 : 2.8, ...(dashed ? { 'stroke-dasharray': '5 5', opacity: 0.65 } : {}), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    }
    if (comparison.length) path(comparison, referenceBreaks, '#8395b0', true);
    for (const event of breaks.filter(event => event.order <= order && event.t > 0 && event.t < 1)) svg.append(node('line', { x1: x(event.t), x2: x(event.t), y1: pad.top, y2: height - pad.bottom, stroke: '#9d6d57', 'stroke-dasharray': '2 5', opacity: 0.7 }));
    path(series, breaks, colors[order], false);
    const cursor = node('line', { x1: x(t), x2: x(t), y1: pad.top, y2: height - pad.bottom, stroke: '#a1b3c8', 'stroke-dasharray': '3 4', opacity: 0.45, class: 'chart-cursor' });
    const marker = node('circle', { cx: x(t), cy: y(0), r: small ? 3 : 4.5, fill: colors[order], stroke: '#0d1624', 'stroke-width': 2, class: 'chart-cursor' });
    svg.append(cursor, marker);
    target.replaceChildren(svg);
    cursorMaps.push({ cursor, marker, x, y, order });
  }
  function renderCharts() {
    selectedBreaks = breakpoints(current.id, params);
    currentSamples = enrichedSamples(current.id, params, selectedBreaks);
    const referenceBreaks = referenceId === 'none' ? [] : breakpoints(referenceId);
    const comparison = referenceId === 'none' ? [] : enrichedSamples(referenceId, {}, referenceBreaks);
    cursorMaps.length = 0;
    fields.forEach((field, index) => graph($(`${field}-chart`), currentSamples, comparison, index, selectedBreaks, referenceBreaks));
    $('curve-name').textContent = current.nameRu || current.name;
    $('curve-description').textContent = current.description;
    $('curve-family').textContent = current.family;
    $('formula').textContent = current.formula;
    $('curve-notes').textContent = metadataNotes() || 'Проверяйте значения и производные на стыках с соседними сегментами. Конец нормализованного отрезка не определяет поведение вне него.';
    const css = toCSS(current.id, params);
    $('copy-css').disabled = !css;
    $('css-note').textContent = css ? `Точное соответствие на [0, 1]: ${css}` : 'У этой кривой нет точного экспорта одной CSS-функцией в текущем прототипе. Доступны JSON и CSV.';
    $('json-preview').textContent = JSON.stringify(descriptor(), null, 2);
    updateFrame();
  }
  function updateFrame() {
    const reading = derivatives(current.id, t, params);
    $('time-value').textContent = `t = ${t.toFixed(3)}`;
    $('scrubber').value = t;
    fields.forEach(field => $(`${field}-reading`).textContent = format(reading[field]));
    for (const { cursor, marker, x, y, order } of cursorMaps) {
      cursor.setAttribute('x1', x(t)); cursor.setAttribute('x2', x(t));
      const value = reading[fields[order]];
      marker.style.display = Number.isFinite(value) ? '' : 'none';
      if (Number.isFinite(value)) { marker.setAttribute('cx', x(t)); marker.setAttribute('cy', y(value)); }
    }
    const [min, max] = plotBounds;
    const position = value => `${4 + (value - min) / (max - min) * 92}%`;
    $('motion-dot').style.left = position(reading.value);
    $('comparison-dot').hidden = referenceId === 'none';
    if (referenceId !== 'none') $('comparison-dot').style.left = position(evaluate(referenceId, t));
    document.querySelector('.start-guide').style.left = position(0);
    document.querySelector('.end-guide').style.left = position(1);
  }
  function stop() {
    playing = false; previousTime = null; cancelAnimationFrame(frame); $('play').textContent = '▶ Воспроизвести';
  }
  function tick(now) {
    if (!playing) return;
    if (previousTime !== null) t += Math.min((now - previousTime) / 1000, 0.25) / duration();
    previousTime = now;
    if (t >= 1) {
      if ($('loop').checked) t %= 1;
      else { t = 1; stop(); }
    }
    updateFrame();
    if (playing) frame = requestAnimationFrame(tick);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      $('export-status').textContent = 'Скопировано.';
    } catch {
      $('export-status').textContent = 'Браузер ограничил буфер обмена. JSON можно выделить ниже.';
      document.querySelector('details').open = true;
    }
  }
  for (const family of [...new Set(catalog.map(curve => curve.family))].sort()) {
    const option = document.createElement('option'); option.value = family; option.textContent = family; $('family').append(option);
  }
  for (const curve of catalog) {
    const option = document.createElement('option'); option.value = curve.id; option.textContent = curve.nameRu || curve.name; $('compare').append(option);
  }
  $('compare').value = referenceId;
  $('compare').addEventListener('change', () => { referenceId = $('compare').value; renderCharts(); });
  $('search').addEventListener('input', renderList);
  $('family').addEventListener('change', renderList);
  $('reset').addEventListener('click', () => { resetParams(); renderParameters(); renderCharts(); });
  $('scrubber').addEventListener('input', () => { stop(); t = Number($('scrubber').value); updateFrame(); });
  $('play').addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (t >= 1) t = 0;
    playing = true; previousTime = null; $('play').textContent = 'Ⅱ Пауза'; frame = requestAnimationFrame(tick);
  });
  $('restart').addEventListener('click', () => { stop(); t = 0; updateFrame(); });
  $('duration').addEventListener('change', () => { $('duration').value = duration(); $('json-preview').textContent = JSON.stringify(descriptor(), null, 2); });
  $('copy-json').addEventListener('click', () => copy(JSON.stringify(descriptor(), null, 2)));
  $('copy-css').addEventListener('click', () => { const css = toCSS(current.id, params); if (css) copy(css); });
  $('download-csv').addEventListener('click', () => {
    const points = sample(current.id, 241, params);
    const csv = ['t,value,velocity,acceleration,jerk', ...points.map(point => [point.t, ...fields.map(field => point[field])].map(value => value === null ? '' : value).join(','))].join('\n') + '\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${current.id}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('export-status').textContent = 'CSV содержит 241 отсчёт. Пустая ячейка — неопределённая производная.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  resetParams(); renderList(); renderParameters(); renderCharts();
  // Playback starts only on explicit input, including with reduced-motion enabled.
} catch (error) {
  $('boot-error').hidden = false;
  $('boot-error').textContent = `Не удалось загрузить лабораторию: ${error.message}. Запустите сервер из корня проекта: python3 -m http.server 8000 — и откройте /examples/playground.html.`;
  console.error(error);
}
