export const cities = {
  stavropol: { name: 'Ставрополь', region: 'Ставропольский край', station: 'Автостанция Северная', address: 'проспект Кулакова, 18а', alternate: 'Центральный автовокзал', alternateAddress: 'улица Маршала Жукова, 27' },
  moskva: { name: 'Москва', region: 'Москва', station: 'Автовокзал Красногвардейский', address: 'Ореховый бульвар, 24, к. 1', alternate: 'Международный автовокзал Саларьево', alternateAddress: 'Киевское шоссе, 23-й километр' },
  sochi: { name: 'Сочи', region: 'Краснодарский край', station: 'Автовокзал Сочи', address: 'улица Горького, 56а' },
  anapa: { name: 'Анапа', region: 'Краснодарский край', station: 'Автовокзал Анапа', address: 'улица Красноармейская, 11' },
  novorossiysk: { name: 'Новороссийск', region: 'Краснодарский край', station: 'Автовокзал Новороссийск', address: 'улица Чайковского, 15' },
  gelendzhik: { name: 'Геленджик', region: 'Краснодарский край', station: 'Верхний автовокзал', address: 'объездная улица, 3' }
};

const destinations = [
  ['moskva', 2490, 1185, 'Ставропольский край ↔ Москва'],
  ['sochi', 1890, 690, 'Черноморское побережье'],
  ['anapa', 1690, 510, 'Черноморское побережье'],
  ['novorossiysk', 1590, 480, 'Черноморское побережье'],
  ['gelendzhik', 1790, 525, 'Черноморское побережье']
];

export const routes = destinations.flatMap(([city, price, duration, region]) => [
  { from: city, to: 'stavropol', price, duration, region },
  { from: 'stavropol', to: city, price, duration, region }
]);
export const siteBase = typeof window === 'undefined' ? '' : new URL('../', import.meta.url).pathname.replace(/\/$/, '');
export const sitePath = path => siteBase + path;
export const routePath = (from, to) => sitePath('/avtobusy/' + from + '/' + to + '/');
export const routesByPath = Object.fromEntries(routes.map(route => [routePath(route.from, route.to), route]));
export const demoCarrier = 'Демо‑перевозчик';
const intermediateStops = {
  moskva: ['Воронеж', 'Павловск', 'Ростов-на-Дону'],
  sochi: ['Армавир', 'Туапсе'],
  anapa: ['Кропоткин', 'Краснодар'],
  novorossiysk: ['Кропоткин', 'Краснодар'],
  gelendzhik: ['Кропоткин', 'Горячий Ключ']
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

export function tripsFor(route, date, scenario = '') {
  if (!route || !validDate(date)) return [];
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
    { id: 'night', departure: '21:10', supplement: 240, duration: route.duration + 15, seats: 5, seatMap: false, alternate: true }
  ].map(trip => {
    const [hours, minutes] = trip.departure.split(':').map(Number);
    const start = hours * 60 + minutes;
    const end = start + trip.duration;
    const pad = number => String(number).padStart(2, '0');
    const timeAt = minute => pad(Math.floor(minute / 60) % 24) + ':' + pad(minute % 60);
    return {
      ...trip, date, route,
      arrival: timeAt(end),
      arrivalDate: offsetDate(date, Math.floor(end / 1440)),
      stops: (trip.id === 'morning' ? stopOrder.slice(0, 1) : stopOrder).map((name, index, group) => {
        const minute = start + Math.round(trip.duration * (index + 1) / (group.length + 1));
        return { name, time: timeAt(minute), date: offsetDate(date, Math.floor(minute / 1440)) };
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
