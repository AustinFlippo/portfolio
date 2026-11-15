const stationURL = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
const tripsURL = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';
const bikeLanes = {
  boston: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
  cambridge: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson',
};

const slider = document.querySelector('#time-slider');
const selectedTime = document.querySelector('#selected-time');
const anyTime = document.querySelector('#any-time');
const status = document.querySelector('#map-status');
const dayMinutes = 1440;

function addBikeLanes(map) {
  for (const [city, url] of Object.entries(bikeLanes)) {
    map.addSource(city, { type: 'geojson', data: url, attribution: `City of ${city === 'boston' ? 'Boston' : 'Cambridge'}` });
    map.addLayer({
      id: `${city}-bike-lanes`,
      source: city,
      type: 'line',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#16804c',
        'line-opacity': 0.65,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4],
      },
    });
  }
}

function createTrafficIndex(stationIndices) {
  const byMinute = Array.from({ length: dayMinutes }, () => []);
  const allTime = new Uint32Array(stationIndices.size);
  const filtered = new Uint32Array(stationIndices.size);

  return {
    add(stationId, timestamp) {
      const station = stationIndices.get(stationId);
      if (station === undefined || !timestamp) return;
      // The CSV uses Boston wall-clock time. Reading HH:MM preserves it in every browser timezone.
      const minute = Number(timestamp.slice(11, 13)) * 60 + Number(timestamp.slice(14, 16));
      if (!byMinute[minute]) return;
      byMinute[minute].push(station);
      allTime[station] += 1;
    },
    counts(time) {
      if (time === -1) return allTime;
      filtered.fill(0);
      for (let offset = -60; offset <= 60; offset += 1) {
        const minute = (time + offset + dayMinutes) % dayMinutes;
        for (const station of byMinute[minute]) filtered[station] += 1;
      }
      return filtered;
    },
  };
}

async function addStations(map) {
  const { data } = await d3.json(stationURL);
  const stations = data.stations;
  const stationIndices = new Map(stations.map((station, index) => [String(station.short_name), index]));
  const departures = createTrafficIndex(stationIndices);
  const arrivals = createTrafficIndex(stationIndices);

  await d3.csv(tripsURL, (trip) => {
    departures.add(trip.start_station_id, trip.started_at);
    arrivals.add(trip.end_station_id, trip.ended_at);
    return null;
  });

  const tooltip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'station-tooltip' });
  const overlay = d3.select(map.getCanvasContainer()).append('svg')
    .attr('class', 'station-overlay')
    .attr('aria-label', 'Bluebikes stations');
  const circles = overlay.selectAll('circle').data(stations, (station) => station.short_name).join('circle');
  const radius = d3.scaleSqrt();
  const flow = d3.scaleQuantize().domain([0, 1]).range(['arrivals', 'balanced', 'departures']);
  const allDepartures = departures.counts(-1);
  const allArrivals = arrivals.counts(-1);
  radius.domain([0, d3.max(stations, (_, index) => allDepartures[index] + allArrivals[index])]);

  function positionStations() {
    circles.each(function (station) {
      const point = map.project([station.lon, station.lat]);
      this.setAttribute('cx', point.x);
      this.setAttribute('cy', point.y);
    });
  }

  function updateTraffic() {
    const time = Number(slider.value);
    const allTimes = time === -1;
    if (!allTimes) {
      const clock = new Date(2000, 0, 1, 0, time);
      selectedTime.textContent = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      selectedTime.dateTime = `${String(clock.getHours()).padStart(2, '0')}:${String(clock.getMinutes()).padStart(2, '0')}`;
    }
    selectedTime.hidden = allTimes;
    anyTime.hidden = !allTimes;
    slider.setAttribute('aria-valuetext', allTimes ? 'Any time' : selectedTime.textContent);

    const departureCounts = departures.counts(time);
    const arrivalCounts = arrivals.counts(time);
    radius.range(allTimes ? [0, 25] : [0, 50]);
    tooltip.remove();
    circles.each(function (station, index) {
      station.departures = departureCounts[index];
      station.arrivals = arrivalCounts[index];
      const total = station.departures + station.arrivals;
      this.setAttribute('r', radius(total));
      this.setAttribute('class', flow(total ? station.departures / total : 0.5));
    });
  }

  circles.on('pointerenter', (_, station) => {
    const total = station.departures + station.arrivals;
    tooltip.setLngLat([station.lon, station.lat])
      .setText(`${station.name}\nTotal traffic: ${total.toLocaleString()}\nArrivals: ${station.arrivals.toLocaleString()}\nDepartures: ${station.departures.toLocaleString()}`)
      .addTo(map);
  }).on('pointerleave', () => tooltip.remove());

  map.on('move', positionStations);
  map.on('resize', positionStations);
  map.on('dragstart', () => tooltip.remove());
  slider.addEventListener('input', updateTraffic);
  positionStations();
  updateTraffic();
  slider.disabled = false;
}

try {
  const map = new mapboxgl.Map({
    container: 'map',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18,
    style: {
      version: 8,
      sources: {
        streets: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        },
      },
      layers: [{
        id: 'streets', type: 'raster', source: 'streets', paint: { 'raster-saturation': -0.7 },
      }],
    },
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

  const failedSources = new Set();
  map.on('error', (event) => {
    if (event.sourceId) {
      failedSources.add(event.sourceId);
      status.textContent = `Could not load ${[...failedSources].join(', ')} map data. Reload to try again.`;
      status.hidden = false;
    }
    console.error(event.error);
  });

  map.once('load', async () => {
    try {
      addBikeLanes(map);
      await addStations(map);
      status.hidden = failedSources.size === 0;
    } catch (error) {
      status.textContent = 'Station traffic could not load. Reload to try again.';
      console.error(error);
    }
  });
} catch (error) {
  status.textContent = 'The map could not open. Check your connection and make sure your browser supports WebGL.';
  console.error(error);
}
