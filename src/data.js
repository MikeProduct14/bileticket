import { scheduleCities, servicePairs, serviceEndpoints, serviceSegments, operatorNames, minutesOf } from './schedules.js';

export const cities = {
  stavropol: { name: 'Ставрополь', region: 'Ставропольский край', station: 'Автостанция Северная', address: 'проспект Кулакова, 18а', alternate: 'Центральный автовокзал', alternateAddress: 'улица Маршала Жукова, 27' },
  moskva: { name: 'Москва', region: 'Москва', station: 'Автовокзал Красногвардейский', address: 'Ореховый бульвар, 24, к. 1', alternate: 'Международный автовокзал Саларьево', alternateAddress: 'Киевское шоссе, 23-й километр' },
  sochi: { name: 'Сочи', region: 'Краснодарский край', station: 'Автовокзал Сочи', address: 'улица Горького, 56а' },
  anapa: { name: 'Анапа', region: 'Краснодарский край', station: 'Автовокзал Анапа', address: 'улица Красноармейская, 11' },
  novorossiysk: { name: 'Новороссийск', region: 'Краснодарский край', station: 'Автовокзал Новороссийск', address: 'улица Чайковского, 15' },
  gelendzhik: { name: 'Геленджик', region: 'Краснодарский край', station: 'Верхний автовокзал', address: 'объездная улица, 3' },
  ...Object.fromEntries(Object.entries(scheduleCities).filter(([id]) => !['stavropol', 'moskva', 'sochi', 'anapa', 'novorossiysk', 'gelendzhik'].includes(id)))
};

const destinations = [
  ['moskva', 2490, 1185, 'Ставропольский край ↔ Москва'],
  ['sochi', 1890, 690, 'Черноморское побережье'],
  ['anapa', 1690, 510, 'Черноморское побережье'],
  ['novorossiysk', 1590, 480, 'Черноморское побережье'],
  ['gelendzhik', 1790, 525, 'Черноморское побережье']
];

const demoRoutes = destinations.flatMap(([city, price, duration, region]) => [
  { from: city, to: 'stavropol', price, duration, region },
  { from: 'stavropol', to: city, price, duration, region }
]);
const pairKey = (from, to) => from + '/' + to;
const canonical = new Map(demoRoutes.map(route => [pairKey(route.from, route.to), {
  ...route, hasSchedule: servicePairs.has(pairKey(route.from, route.to))
}]));
for (const key of [...serviceEndpoints, 'lazarevskoe/sochi', 'sochi/lazarevskoe', 'gelendzhik/novorossiysk', 'novorossiysk/gelendzhik']) {
  if (canonical.has(key) || !servicePairs.has(key)) continue;
  const [from, to] = key.split('/');
  canonical.set(key, { from, to, region: cities[to].region, hasSchedule: true });
}
export const routes = [...canonical.values()];
export function findRoute(from, to) {
  const key = pairKey(from, to);
  return canonical.get(key) || (servicePairs.has(key) ? { from, to, region: cities[to].region, hasSchedule: true } : null);
}
export const siteBase = typeof window === 'undefined' ? '' : new URL('../', import.meta.url).pathname.replace(/\/$/, '');
export const sitePath = path => siteBase + path;
export const routePath = (from, to) => sitePath('/avtobusy/' + from + '/' + to + '/');
export const routesByPath = Object.fromEntries(routes.map(route => [routePath(route.from, route.to), route]));
export const searchPath = () => sitePath('/avtobusy/poisk/');
export function resultHref(route, date) {
  const query = new URLSearchParams();
  const isCanonical = canonical.has(pairKey(route.from, route.to));
  if (!isCanonical) {
    query.set('from', route.from);
    query.set('to', route.to);
  }
  if (date) query.set('date', date);
  const path = isCanonical ? routePath(route.from, route.to) : searchPath();
  return path + (query.size ? '?' + query : '');
}
export const isReferenceSchedule = (route, scenario = '') => Boolean(route?.hasSchedule && (!scenario || route.price == null));
export const demoCarrier = 'Демо‑перевозчик';
const carriers = [
  { name: 'Южная линия Экспресс', rating: 4.7, reviews: 128 },
  { name: 'Автоход Круг', rating: 4.4, reviews: 74 },
  { name: 'Магистраль Лазурь', rating: 4.8, reviews: 213 },
  { name: 'Вечерний Меридиан', rating: 4.6, reviews: 96 }
];
const amenities = ['Кондиционер', 'Комфортабельные сиденья', 'Дезинфекция салона'];
const fares = [
  { name: 'Базовый', earlyHours: 24, earlyPercent: 95, latePercent: 75, cutoffMinutes: 15 },
  { name: 'Гибкий', earlyHours: 4, earlyPercent: 100, latePercent: 85, cutoffMinutes: 15 }
];
const intermediateStops = {
  moskva: [
    { name: 'Воронеж', region: 'Воронежская область', station: 'Центральный автовокзал' },
    { name: 'Павловск', region: 'Воронежская область' },
    { name: 'Ростов-на-Дону', region: 'Ростовская область', station: 'Главный автовокзал' }
  ],
  sochi: [
    { name: 'Туапсе', region: 'Краснодарский край', station: 'Автовокзал Туапсе' },
    { name: 'Армавир', region: 'Краснодарский край', station: 'Автовокзал Армавир' }
  ],
  anapa: [
    { name: 'Краснодар', region: 'Краснодарский край', station: 'Автовокзал Краснодар-1' },
    { name: 'Кропоткин', region: 'Краснодарский край' }
  ],
  novorossiysk: [
    { name: 'Краснодар', region: 'Краснодарский край', station: 'Автовокзал Краснодар-1' },
    { name: 'Кропоткин', region: 'Краснодарский край' }
  ],
  gelendzhik: [
    { name: 'Горячий Ключ', region: 'Краснодарский край' },
    { name: 'Кропоткин', region: 'Краснодарский край' }
  ]
};

export function today() {
  if (typeof process !== 'undefined' && validDate(process.env.TUDASUDA_BUILD_DATE)) return process.env.TUDASUDA_BUILD_DATE;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(new Date());
}

export function offsetDate(date, days) {
  const time = new Date(date + 'T12:00:00Z');
  time.setUTCDate(time.getUTCDate() + days);
  return time.toISOString().slice(0, 10);
}

export function dateLabel(date, options = { day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('ru-RU', { ...options, timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
}

export function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const value = new Date(date + 'T12:00:00Z');
  return Number.isFinite(+value) && value.toISOString().slice(0, 10) === date;
}

export const rub = amount => typeof amount === 'number' ? new Intl.NumberFormat('ru-RU').format(amount) + ' ₽' : 'Цена уточняется';
export const durationLabel = minutes => Math.floor(minutes / 60) + ' ч' + (minutes % 60 ? ' ' + minutes % 60 + ' м' : '');
export const localDateTime = (date, time) => `${date}T${time}:00+03:00`;

export function refundRules(trip) {
  return trip?.refundPolicy ?? fares[0];
}

export function refundFor(trip, total, now = Date.now()) {
  const { earlyHours, earlyPercent, latePercent, cutoffMinutes } = refundRules(trip);
  const departure = Date.parse(localDateTime(trip.date, trip.departure));
  const cutoffAt = departure - cutoffMinutes * 60000;
  const percent = now <= departure - earlyHours * 3600000 ? earlyPercent : now <= cutoffAt ? latePercent : 0;
  const paidMinor = Math.round(total * 100);
  const refundMinor = Math.round(paidMinor * percent / 100);
  return { total, withholding: (paidMinor - refundMinor) / 100, refund: refundMinor / 100, percent, available: percent > 0, cutoffAt };
}

export function sortTrips(list, order = 'price') {
  return [...list].sort((a, b) => {
    const clock = (trip, dateKey, timeKey) => trip[timeKey] == null ? '\uffff' : trip[dateKey] + trip[timeKey];
    const departure = clock(a, 'date', 'departure').localeCompare(clock(b, 'date', 'departure'));
    if (order === 'price') return (a.price ?? Infinity) - (b.price ?? Infinity) || departure;
    if (order === 'arrival') return clock(a, 'arrivalDate', 'arrival').localeCompare(clock(b, 'arrivalDate', 'arrival')) || departure;
    return departure;
  });
}

function scheduleTrips(route, date) {
  return serviceSegments(route.from, route.to).map(({ service, start, end }) => {
    const from = service.stops[start];
    const to = service.stops[end];
    const arrivalDay = from.day == null || to.day == null ? null : to.day - from.day;
    const duration = arrivalDay == null ? null : arrivalDay * 1440 + minutesOf(to.time) - minutesOf(from.time);
    return {
      id: service.id + '-' + start + '-' + end,
      route, date, departure: from.time, arrival: to.time,
      arrivalDate: arrivalDay == null ? date : offsetDate(date, arrivalDay), arrivalDay, duration,
      fromStation: from.station || 'Пункт уточняется', fromOnRequest: Boolean(from.onRequest),
      toStation: to.station || 'Пункт уточняется', toOnRequest: Boolean(to.onRequest),
      stops: service.stops.slice(start + 1, end).map(stop => ({
        ...stop, name: stop.city, day: stop.day == null || from.day == null ? null : stop.day - from.day
      })),
      carrier: { name: operatorNames[service.carrier] },
      scheduled: true, source: service.source, frequency: service.frequency, notes: service.notes,
      terms: service.terms || [],
      price: null, seats: null, seatMap: false
    };
  });
}

export function tripsFor(route, date, scenario = '') {
  if (!route || !validDate(date)) return [];
  if (isReferenceSchedule(route, scenario)) return scheduleTrips(route, date);
  if (route.price == null) return [];
  const day = Number(date.slice(-2));
  if (scenario === 'empty' || (!scenario && day % 11 === 0)) return [];
  const allSold = scenario === 'sold' || (!scenario && day % 13 === 0);
  const allUnknown = scenario === 'price-unknown';
  const origin = cities[route.from];
  const destination = cities[route.to];
  const stopNames = intermediateStops[route.from === 'stavropol' ? route.to : route.from];
  const stopOrder = route.from === 'stavropol' ? [...stopNames].reverse() : stopNames;

  return [
    { id: 'morning', departure: '08:15', supplement: 400, duration: route.duration, seats: 8, seatMap: true },
    { id: 'afternoon', departure: '14:30', supplement: 0, duration: route.duration + 35, seats: 0, seatMap: true, alternate: true },
    { id: 'evening', departure: '18:45', supplement: 0, duration: route.duration - 30, seats: 12, seatMap: true },
    { id: 'night', departure: '21:10', supplement: 0, duration: route.duration + 15, seats: 5, seatMap: false, alternate: true }
  ].map((trip, carrierIndex) => {
    const [hours, minutes] = trip.departure.split(':').map(Number);
    const start = hours * 60 + minutes;
    const end = start + trip.duration;
    const pad = number => String(number).padStart(2, '0');
    const timeAt = minute => pad(Math.floor(minute / 60) % 24) + ':' + pad(minute % 60);
    return {
      ...trip, date, route, carrier: carriers[carrierIndex], amenities, refundPolicy: fares[carrierIndex % fares.length],
      arrival: timeAt(end),
      arrivalDate: offsetDate(date, Math.floor(end / 1440)),
      stops: (trip.id === 'morning' ? stopOrder.slice(0, 1) : stopOrder).map((stop, index, group) => {
        const minute = start + Math.round(trip.duration * (index + 1) / (group.length + 1));
        return { ...stop, time: timeAt(minute), date: offsetDate(date, Math.floor(minute / 1440)) };
      }),
      fromStation: (trip.alternate && origin.alternate) || origin.station,
      fromAddress: (trip.alternate && origin.alternateAddress) || origin.address,
      toStation: (trip.alternate && destination.alternate) || destination.station,
      toAddress: (trip.alternate && destination.alternateAddress) || destination.address,
      price: allUnknown || (scenario === 'mixed' && trip.id === 'night') ? null : route.price + trip.supplement + (day % 3) * 100,
      seats: allSold ? 0 : trip.seats
    };
  });
}

export function dayPrice(route, date, scenario) {
  const prices = tripsFor(route, date, scenario).filter(trip => trip.seats && trip.price != null).map(trip => trip.price);
  return prices.length ? Math.min(...prices) : null;
}
