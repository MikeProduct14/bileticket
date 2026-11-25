import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canAddPassenger, hasAllSeats, seatChoices, totalFor, validationMessage } from '../src/passengers.js';
import { refundFor, sortTrips, tripsFor, routes } from '../src/data.js';

test('removing a passenger frees their seat and updates the order total', () => {
  const trip = { seatMap: true, seats: 3 };
  const booking = { price: 2490, passengers: [{ id: 1, seat: 2 }, { id: 2, seat: 3 }, { id: 3, seat: 5 }] };

  assert.equal(canAddPassenger(trip, booking), false);
  assert.equal(hasAllSeats(trip, booking), true);
  assert.equal(totalFor(booking), 7470);

  booking.passengers.splice(1, 1);
  assert.equal(canAddPassenger(trip, booking), true);
  assert.deepEqual(seatChoices(trip, booking), [3]);
  assert.deepEqual(seatChoices(trip, booking, booking.passengers[1]), [3, 5]);
  assert.equal(totalFor(booking), 4980);

  booking.passengers[1].seat = 2;
  assert.equal(hasAllSeats(trip, booking), false);
});

test('validates required fields and document format per passenger', () => {
  const date = '2026-12-10';
  assert.match(validationMessage('gender', '', {}, date), /Пол/);
  assert.equal(validationMessage('middleName', '', {}, date), '');
  assert.match(validationMessage('birth', '31.02.1990', {}, date), /действительную/);
  assert.equal(validationMessage('documentNumber', '0102 003456', { documentType: 'passport' }, date), '');
  assert.match(validationMessage('documentNumber', 'A0123456', { documentType: 'passport' }, date), /формат/);
  assert.equal(validationMessage('documentNumber', 'A0123456', { documentType: 'foreign' }, date), '');
});

test('sorts overnight trips by calendar arrival and applies the refund cutoff to the group', () => {
  const departure = '2026-12-10';
  const route = routes.find(item => item.from === 'moskva' && item.to === 'stavropol');
  const trips = tripsFor(route, departure, 'available');
  const sorted = sortTrips(trips, 'arrival');
  const arrival = trip => trip.arrivalDate + trip.arrival;
  assert.deepEqual(sorted.map(arrival), sorted.map(arrival).toSorted());

  const trip = trips.find(item => item.id === 'evening');
  const booking = { price: trip.price, passengers: [{ id: 1 }, { id: 2 }] };
  const total = totalFor(booking);
  const cutoff = Date.parse(departure + 'T18:30:00+03:00');
  const quote = refundFor(trip, total, cutoff);
  assert.equal(quote.available, true);
  assert.equal(Math.round((quote.withholding + quote.refund) * 100), total * 100);
  assert.equal(refundFor(trip, total, cutoff + 1).available, false);
});
