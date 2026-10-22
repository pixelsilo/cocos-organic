// Stockists map: Google Map + nearest-first list, fed by the stockists Worker.
//
// Markup (inside the section):
//   [data-module="stockist-map"]       root; data-api = the Worker's /locations.json URL
//                                      data-maps-key = Google Maps JavaScript API key (HTTP-referrer restricted)
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
// The Google Maps API and marker clusterer are loaded on this page only.

const CLUSTERER = 'https://unpkg.com/@googlemaps/markerclusterer@2.5.3/dist/index.min.js';
const UK = { lat: 54.2, lng: -2.5, zoom: 5 };
const PAGE = 12;
const NEAR_ZOOM = 11;
const DEFAULT_RADIUS = 10; // miles, used when no radius buttons exist
const MILE = 1.609344;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function loadGoogle(key) {
  if (!window.google?.maps) {
    await new Promise((resolve, reject) => {
      window.__cocosMapsReady = resolve;
      loadScript('https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&callback=__cocosMapsReady&v=weekly').catch(reject);
    });
  }
  if (!window.markerClusterer) await loadScript(CLUSTERER);
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

// Arrow-right from the Figma icon set (same markup as the site's .button-icon embeds)
const ARROW =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="none" aria-hidden="true" style="display:block;width:100%;height:100%">' +
  '<path d="M2.625 9.45C6 8.7 10.125 9.15 14.625 8.85" stroke="currentColor" stroke-width="1.3125" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M10.65 4.65C12.15 6.45 13.65 7.8 15.225 8.925C13.725 10.35 12.075 11.775 10.5 13.5" stroke="currentColor" stroke-width="1.3125" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Text link label + arrow, with the label in .text_optical so Kit Rounded sits centred
function setLinkContent(a, text) {
  const label = document.createElement('div');
  label.className = 'text_optical';
  label.textContent = text;
  const icon = document.createElement('div');
  icon.className = 'finder_link-icon';
  icon.innerHTML = ARROW;
  a.append(label, icon);
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
    setLinkContent(a, 'Directions');
    li.append(a);
  } else if (loc.w && /^https?:\/\//.test(loc.w)) {
    a.href = loc.w;
    setLinkContent(a, 'Shop online');
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
  const key = root.getAttribute('data-maps-key');
  const mapEl = root.querySelector('[data-map]');
  const listEl = root.querySelector('[data-list]');
  const input = root.querySelector('[data-input]');
  const submit = root.querySelector('[data-submit]');
  const locate = root.querySelector('[data-locate]');
  const status = root.querySelector('[data-status]');
  const more = root.querySelector('[data-more]');
  const chips = [...root.querySelectorAll('[data-filter]')];
  const radii = [...root.querySelectorAll('[data-radius]')];
  if (!api || !key || !mapEl || !listEl) return;

  const say = (t) => status && (status.textContent = t);
  say('Loading stockists…');

  let data;
  try {
    [data] = await Promise.all([fetch(api).then((r) => r.json()), loadGoogle(key)]);
  } catch (err) {
    say('Sorry, we could not load the stockists. Please try again later.');
    throw err;
  }

  const all = data.locations;
  const gm = window.google.maps;
  const map = new gm.Map(mapEl, {
    center: { lat: UK.lat, lng: UK.lng },
    zoom: UK.zoom,
    gestureHandling: 'cooperative',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });
  const info = new gm.InfoWindow();
  const clusterer = new window.markerClusterer.MarkerClusterer({ map, markers: [] });

  // Current state
  let types = null; // null = all, else array of allowed types
  let radius = radii.length ? parseFloat((radii.find((r) => r.classList.contains('is-active')) || radii[0]).getAttribute('data-radius')) : DEFAULT_RADIUS;
  let point = null; // [lat, lon] of the current search, or null
  let query = '';
  let shown = [];
  let pageEnd = 0;

  const allowed = (loc) => !types || types.includes(loc.t);

  function drawPins(list) {
    clusterer.clearMarkers();
    info.close();
    const markers = [];
    list.forEach(({ loc }) => {
      if (loc.y == null || loc.x == null) return;
      const m = new gm.Marker({ position: { lat: loc.y, lng: loc.x }, title: loc.n });
      m.addListener('click', () => {
        const pop = document.createElement('div');
        const b = document.createElement('strong');
        b.textContent = loc.n;
        pop.append(b, document.createElement('br'), document.createTextNode([loc.a, loc.c, loc.p].filter(Boolean).join(', ')));
        info.setContent(pop);
        info.open({ map, anchor: m });
      });
      markers.push(m);
    });
    clusterer.addMarkers(markers);
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
      map.setCenter({ lat: point[0], lng: point[1] });
      map.setZoom(NEAR_ZOOM);
      if (shown.length) {
        const bounds = new gm.LatLngBounds({ lat: point[0], lng: point[1] });
        shown.slice(0, PAGE).forEach(({ loc }) => bounds.extend({ lat: loc.y, lng: loc.x }));
        map.fitBounds(bounds, 40);
      }
    } else if (query) {
      const needle = query.toLowerCase();
      shown = pool.filter((l) => [l.n, l.r, l.c, l.p].some((s) => s.toLowerCase().includes(needle))).map((loc) => ({ loc, dist: null }));
      say(shown.length ? `${shown.length} stockists matching "${query}"` : `No stockists found for "${query}". Try a postcode or nearby town.`);
      drawPins(shown);
    } else {
      shown = pool.map((loc) => ({ loc, dist: null }));
      say(`${shown.length} stockists across the UK`);
      drawPins(shown);
      map.setCenter({ lat: UK.lat, lng: UK.lng });
      map.setZoom(UK.zoom);
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
