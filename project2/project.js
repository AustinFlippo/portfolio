const rowsElement = document.querySelector('#country-rows');
const searchElement = document.querySelector('#country-search');
const statusElement = document.querySelector('#records-status');
let countryRecords = [];

function showRecords() {
  const query = searchElement.value.trim().toLocaleLowerCase();
  const matches = countryRecords.filter(country => `${country.name} ${country.code}`.toLocaleLowerCase().includes(query));
  rowsElement.replaceChildren();
  for (const country of matches) {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = country.name;
    row.append(label);
    for (const value of [country['2000'].share.toFixed(1) + '%', country['2018'].share.toFixed(1) + '%', (country['2000'].estimated_residents / 1e6).toFixed(2) + 'm', (country['2018'].estimated_residents / 1e6).toFixed(2) + 'm']) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    rowsElement.append(row);
  }
  statusElement.textContent = `${matches.length} of ${countryRecords.length} countries shown. Counts are estimated residents; m = million. Display rounding can make small changes look equal.`;
}

fetch('data/housing.json')
  .then(response => {
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    return response.json();
  })
  .then(data => {
    countryRecords = data.countries;
    showRecords();
    searchElement.addEventListener('input', showRecords);
  })
  .catch(() => {
    statusElement.textContent = 'The searchable table could not load. Download the CSV extract above to inspect every record.';
  });
