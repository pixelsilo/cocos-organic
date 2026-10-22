// Stockists map: Leaflet map + nearest-first list, fed by the stockists Worker.
//
// Markup (inside the section):
//   [data-module="stockist-map"]       root; data-api = the Worker's /locations.json URL
//     [data-map]                       map container (needs a height)
//     [data-list]                      results list container
//     [data-input]                     text input (town or postcode)
//     [data-submit]                    search button
//     [data-locate]                    optional "use my location" button
//     [data-filter="Type,Type"]        optional chips; value is a comma list of location types
//                                      (empty value = All). The first chip is selected on load.
//     [data-radius="25"]               optional radius buttons, in miles (0 = no limit)
//     [data-status]                    one-line message ("12 stockists near SW1A")
//     [data-more]                      optional "show more" button
//
// Selected chips/radius buttons get the class "is-active" and aria-pressed="true".
// Reads ?q= from the URL (set by the stockist-search module on other pages).
// Leaflet is loaded from cdnjs on this page only.

const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet';
const CLUSTER = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/';
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const UK = { center: [54.2, -2.5], zoom: 5 };
const PAGE = 12;
const NEAR_ZOOM = 11;
const DEFAULT_RADIUS = 10; // miles, used when no radius buttons exist
const MILE = 1.609344;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}

function loadStyle(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

async function loadLeaflet() {
  if (window.L?.markerClusterGroup) return;
  loadStyle(LEAFLET + '.min.css');
  loadStyle(CLUSTER + 'MarkerCluster.css');
  loadStyle(CLUSTER + 'MarkerCluster.Default.css');
  if (!window.L) await loadScript(LEAFLET + '.min.js');
  await loadScript(CLUSTER + 'leaflet.markercluster.js');
}

function miles(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return (12742 * Math.asin(Math.sqrt(h))) / MILE;
}

// Postcode, outcode, then place name, via postcodes.io. Returns [lat, lon] or null.
async function geocode(q) {
  const get = async (path) => {
    try {
      const res = await fetch('https://api.postcodes.io' + path);
      return res.ok ? (await res.json()).result : null;
    } catch {
      return null;
    }
  };
  const squashed = encodeURIComponent(q.replace(/\s+/g, ''));
  const pc = await get('/postcodes/' + squashed);
  if (pc) return [pc.latitude, pc.longitude];
  const out = await get('/outcodes/' + squashed);
  if (out) return [out.latitude, out.longitude];
  const places = await get('/places?limit=1&q=' + encodeURIComponent(q));
  if (places?.[0]) return [places[0].latitude, places[0].longitude];
  return null;
}

function row(loc, dist) {
  const li = document.createElement('div');
  li.className = 'finder_item';
  const name = document.createElement('div');
  name.className = 'finder_name';
  name.textContent = loc.r && loc.r !== loc.n ? `${loc.r} – ${loc.n}` : loc.n;
  const meta = document.createElement('div');
  meta.className = 'finder_meta';
  const addr = [loc.a, loc.c, loc.p].filter(Boolean).join(', ');
  meta.textContent = dist == null ? addr : `${addr} · ${dist < 10 ? dist.toFixed(1) : Math.round(dist)} miles`;
  li.append(name, meta);

  const a = document.createElement('a');
  a.className = 'finder_link';
  a.target = '_blank';
  a.rel = 'noopener';
  if (loc.y != null && loc.x != null) {
    a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(`${loc.n} ${loc.a} ${loc.p}`);
    a.textContent = 'Directions';
    li.append(a);
  } else if (loc.w && /^https?:\/\//.test(loc.w)) {
    a.href = loc.w;
    a.textContent = 'Shop online';
    li.append(a);
  }
  return li;
}

function setActive(group, active) {
  group.forEach((el) => {
    const on = el === active;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

export default async function stockistMap(root) {
  const api = root.getAttribute('data-api');
  const mapEl = root.querySelector('[data-map]');
  const listEl = root.querySelector('[data-list]');
  const input = root.querySelector('[data-input]');
  const submit = root.querySelector('[data-submit]');
  const locate = root.querySelector('[data-locate]');
  const status = root.querySelector('[data-status]');
  const more = root.querySelector('[data-more]');
  const chips = [...root.querySelectorAll('[data-filter]')];
  const radii = [...root.querySelectorAll('[data-radius]')];
  if (!api || !mapEl || !listEl) return;

  const say = (t) => status && (status.textContent = t);
  say('Loading stockists…');

  let data;
  try {
    [data] = await Promise.all([fetch(api).then((r) => r.json()), loadLeaflet()]);
  } catch (err) {
    say('Sorry, we could not load the stockists. Please try again later.');
    throw err;
  }

  const all = data.locations;
  const L = window.L;
  const map = L.map(mapEl, { scrollWheelZoom: false }).setView(UK.center, UK.zoom);
  L.tileLayer(TILES, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
  map.addLayer(cluster);

  // Current state
  let types = null; // null = all, else array of allowed types
  let radius = radii.length ? parseFloat((radii.find((r) => r.classList.contains('is-active')) || radii[0]).getAttribute('data-radius')) : DEFAULT_RADIUS;
  let point = null; // [lat, lon] of the current search, or null
  let query = '';
  let shown = [];
  let pageEnd = 0;

  const allowed = (loc) => !types || types.includes(loc.t);

  function drawPins(list) {
    cluster.clearLayers();
    list.forEach(({ loc }) => {
      if (loc.y == null || loc.x == null) return;
      const m = L.marker([loc.y, loc.x], { title: loc.n });
      const pop = document.createElement('div');
      const b = document.createElement('strong');
      b.textContent = loc.n;
      pop.append(b, document.createElement('br'), document.createTextNode([loc.a, loc.c, loc.p].filter(Boolean).join(', ')));
      m.bindPopup(pop);
      cluster.addLayer(m);
    });
  }

  function render(reset) {
    if (reset) {
      listEl.textContent = '';
      pageEnd = 0;
    }
    shown.slice(pageEnd, pageEnd + PAGE).forEach(({ loc, dist }) => listEl.appendChild(row(loc, dist)));
    pageEnd += PAGE;
    if (more) more.hidden = pageEnd >= shown.length;
  }

  function update() {
    const pool = all.filter(allowed);
    if (point) {
      const ranked = pool
        .filter((l) => l.y != null && l.x != null)
        .map((loc) => ({ loc, dist: miles(point, [loc.y, loc.x]) }))
        .sort((a, b) => a.dist - b.dist);
      const within = radius > 0 ? ranked.filter((r) => r.dist <= radius) : ranked;
      if (within.length) {
        shown = within;
        say(`${within.length} stockist${within.length === 1 ? '' : 's'} within ${radius} miles of ${query}`);
      } else {
        shown = ranked.slice(0, PAGE);
        say(`Nothing within ${radius} miles of ${query}. Here are the nearest stockists.`);
      }
      drawPins(shown);
      map.setView(point, NEAR_ZOOM);
      if (shown.length) map.fitBounds(L.latLngBounds(shown.slice(0, PAGE).map(({ loc }) => [loc.y, loc.x]).concat([point])), { padding: [30, 30], maxZoom: 13 });
    } else if (query) {
      const needle = query.toLowerCase();
      shown = pool.filter((l) => [l.n, l.r, l.c, l.p].some((s) => s.toLowerCase().includes(needle))).map((loc) => ({ loc, dist: null }));
      say(shown.length ? `${shown.length} stockists matching "${query}"` : `No stockists found for "${query}". Try a postcode or nearby town.`);
      drawPins(shown);
    } else {
      shown = pool.map((loc) => ({ loc, dist: null }));
      say(`${shown.length} stockists across the UK`);
      drawPins(shown);
      map.setView(UK.center, UK.zoom);
    }
    render(true);
  }

  async function search(q) {
    query = q.trim();
    point = null;
    if (!query) return update();
    say('Searching…');
    point = await geocode(query);
    update();
  }

  submit?.addEventListener('click', (e) => {
    e.preventDefault();
    search(input.value);
  });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search(input.value);
    }
  });
  more?.addEventListener('click', (e) => {
    e.preventDefault();
    render(false);
  });

  chips.forEach((chip) =>
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const v = (chip.getAttribute('data-filter') || '').trim();
      types = v ? v.split(',').map((s) => s.trim()) : null;
      setActive(chips, chip);
      update();
    }),
  );
  if (chips.length) setActive(chips, chips.find((c) => c.classList.contains('is-active')) || chips[0]);

  radii.forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      radius = parseFloat(btn.getAttribute('data-radius'));
      setActive(radii, btn);
      update();
    }),
  );
  if (radii.length) setActive(radii, radii.find((r) => r.classList.contains('is-active')) || radii[0]);

  locate?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!navigator.geolocation) return say('Your browser cannot share your location. Try a postcode instead.');
    say('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        point = [pos.coords.latitude, pos.coords.longitude];
        query = 'you';
        if (input) input.value = '';
        update();
      },
      () => say('We could not get your location. Try a postcode instead.'),
      { timeout: 10000 },
    );
  });

  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    if (input) input.value = q;
    search(q);
  } else {
    update();
  }
}
