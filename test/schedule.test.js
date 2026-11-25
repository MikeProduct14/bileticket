import assert from 'node:assert/strict';
import { test } from 'node:test';
import { carrierSchedules } from '../src/carrier-schedules.js';
import { cities, dayPrice, findRoute, resultHref, tripsFor } from '../src/data.js';
import { operatorNames } from '../src/schedules.js';

const date = '2026-12-10';

test('shows the carrier clock times without offering sale or a calendar fare', () => {
  const outward = findRoute('stavropol', 'moskva');
  const inward = findRoute('moskva', 'stavropol');
  const trips = tripsFor(outward, date);
  assert.deepEqual(trips.map(trip => [trip.departure, trip.arrival, trip.arrivalDay]), [
    ['09:00', '08:30', 1], ['18:00', '13:00', 1]
  ]);
  assert.deepEqual(tripsFor(inward, date).map(trip => trip.departure).sort(), ['11:15', '21:15']);
  assert.ok(trips.every(trip => trip.scheduled && trip.price === null && trip.seats === null));
  assert.equal(dayPrice(outward, date), null);
  assert.ok(tripsFor(outward, date, 'available').some(trip => !trip.scheduled && trip.seats > 0));
});

test('finds intermediate departure and arrival points in travel order', () => {
  const route = findRoute('tula', 'voronezh');
  assert.equal(resultHref(route, date), '/avtobusy/poisk/?from=tula&to=voronezh&date=' + date);
  const overnight = tripsFor(route, date).find(trip => trip.departure === '23:50');
  assert.equal(overnight.arrival, '04:10');
  assert.equal(overnight.arrivalDay, 1);
  assert.ok(overnight.stops.some(stop => stop.name === 'Богородицк'));
  assert.ok(findRoute('gelendzhik', 'novorossiysk').hasSchedule);
  assert.ok(findRoute('lazarevskoe', 'sochi').hasSchedule);
  assert.equal(findRoute('anapa', 'moskva'), null);
});

test('keeps the published conditions and unknown arrival time from the documents', () => {
  const result = tripsFor(findRoute('anapa', 'stavropol'), date)
    .find(trip => trip.carrier.name === operatorNames.translux);
  assert.equal(result.departure, '18:00');
  assert.equal(result.arrival, null);
  assert.equal(result.duration, null);
  assert.equal(new Set(carrierSchedules.map(line => line.source)).size, 8);
  assert.equal(carrierSchedules.length, 14);
  assert.equal(carrierSchedules.reduce((count, line) => count + line.stops.length, 0), 275);
  assert.equal(Object.keys(cities).length, 59);
});
