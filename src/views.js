import {
  cities, routes, routePath, sitePath, today, offsetDate, dateLabel, rub, durationLabel, tripsFor, dayPrice,
  sortTrips, localDateTime, refundFor, refundRules, resultHref, findRoute, isReferenceSchedule
} from './data.js';

const iconPaths = {
  route: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h8a4 4 0 0 0 0-8H9a2 2 0 0 1 0-4h8"/>',
  origin: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/>',
  pin: '<path d="M20 10c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h1m6 0h1m-8 3h1"/>',
  swap: '<path d="M8 4v15m0 0-4-4m4 4 4-4m4 5V5m0 0-4 4m4-4 4 4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  prev: '<path d="m15 5-7 7 7 7"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16m-5-14v4m-6 2v4m5 2v4"/>',
  bus: '<rect x="4" y="3" width="16" height="16" rx="4"/><path d="M4 11h16m-12 4h.01m8 0h.01M7 19v2m10-2v2"/>',
  ticket: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6Z"/><path d="M14 8v1m0 3h.01M14 15v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.3 2c-1.2.7-1.8 1.2-1.8 2.5m0 3h.01"/>',
  bag: '<rect x="5" y="8" width="14" height="13" rx="2"/><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-5 3v7m4-7v7"/>',
  doc: '<path d="M6 3h8l4 4v14H6zM14 3v5h4m-9 5h6m-6 4h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  star: '<path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.3-5.6-3-5.6 3 1-6.3L3 9.6l6.2-.9Z"/>',
  message: '<path d="M20 11a7 7 0 0 1-7 7H9l-4 3v-5a7 7 0 0 1 0-10 7 7 0 0 1 5-2h3a7 7 0 0 1 7 7Z"/><path d="M8 11h7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  seat: '<path d="M7 12V5a3 3 0 0 1 6 0v5h4a3 3 0 0 1 3 3v5H9l-4-5a2 2 0 0 1 2-3m0 8v3m11-3v3"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18m-14 5h4"/>'
};
export const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + iconPaths[name] + '</svg>';
export const titleFor = route => cities[route.from].name + ' — ' + cities[route.to].name;
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const brand = '<a class="brand" href="/" aria-label="Туда-сюда, главная"><span class="brand-mark">' + icon('route') + '</span><span>туда<span class="brand-dot">·</span>сюда</span></a>';
const links = '<a href="/avtobusy/">Направления</a><a href="/vozvrat/">Вернуть билет</a><a href="/pomosh/posadka/">Помощь</a><a href="/perevozchikam/">Для перевозчиков</a>';
export const header = '<header class="site-header"><div class="wrap header-inner">' + brand + '<nav class="desktop-nav" aria-label="Основная навигация">' + links + '</nav><button type="button" class="icon-button menu-toggle" data-menu aria-label="Открыть меню" aria-haspopup="dialog">' + icon('menu') + '</button></div></header>';
const footer = '<footer class="site-footer"><div class="wrap footer-inner"><div>' + brand + '<p>Расписание из документов носит справочный характер. Оформление билетов демонстрационное.</p></div><nav aria-label="Ссылки в подвале">' + links + '</nav></div></footer>';

export function page({ title, description, body, path = '/', pageType, route }) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="${escapeHTML(description)}">
  <link rel="canonical" href="${path}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/styles.css">
  ${pageType === 'route' ? '<link rel="stylesheet" href="/assets/results.css">' : ''}
  ${pageType === 'carriers' ? '<link rel="stylesheet" href="/assets/carriers.css">' : ''}
  <title>${escapeHTML(title)}</title>
  <script type="module" src="/assets/app.js"></script>
</head>
<body data-page="${pageType}"${route ? ' data-from="' + route.from + '" data-to="' + route.to + '"' : ''}>
<a href="#main" class="skip-link">Перейти к содержанию</a>
${header}
<main id="main" tabindex="-1">${body}</main>
${footer}
${supportButton()}
<dialog id="sheet" class="sheet" aria-labelledby="sheet-title"><div class="sheet-frame"><header class="sheet-header"><h2 id="sheet-title"></h2><button type="button" class="icon-button" data-close aria-label="Закрыть">${icon('close')}</button></header><div class="sheet-content"></div><footer class="sheet-footer" hidden></footer></div></dialog>
</body>
</html>`;
}

const searchFields = (route, date) => `<form class="search-form" id="search-form" novalidate>
  <div class="search-points">
    <div class="search-control"><span class="field-icon">${icon('origin')}</span><div><label for="from">Откуда</label><input id="from" name="from" type="text" autocomplete="off" placeholder="Город отправления" value="${route ? cities[route.from].name : ''}" data-city="${route?.from || ''}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="from-options" aria-describedby="from-error" required></div><div class="city-options" id="from-options" role="listbox" aria-label="Город отправления" hidden></div><p class="error" id="from-error" hidden></p></div>
    <button type="button" class="swap icon-button" data-swap aria-label="Поменять города местами">${icon('swap')}</button>
    <div class="search-control"><span class="field-icon">${icon('pin')}</span><div><label for="to">Куда</label><input id="to" name="to" type="text" autocomplete="off" placeholder="Город прибытия" value="${route ? cities[route.to].name : ''}" data-city="${route?.to || ''}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="to-options" aria-describedby="to-error" required></div><div class="city-options" id="to-options" role="listbox" aria-label="Город прибытия" hidden></div><p class="error" id="to-error" hidden></p></div>
  </div>
  <div class="search-control search-date">${icon('calendar')}<button type="button" data-calendar aria-haspopup="dialog" aria-describedby="date-error"><span>Когда</span><strong data-date-label>${date ? dateLabel(date) : 'Выберите дату'}</strong></button><p class="error" id="date-error" hidden></p></div>
  <div class="quick-dates" aria-label="Ближайшие даты"><button type="button" data-offset="0">Сегодня</button><button type="button" data-offset="1">Завтра</button><button type="button" data-offset="2">Послезавтра</button></div>
  <button type="submit" class="button primary search-submit">${icon('search')} Найти рейсы</button>
  <p class="error form-error" data-search-error role="status" hidden></p>
</form>`;

const popular = routes.filter(route => route.from === 'stavropol' && route.price != null);
const directionsList = (selection = popular) => `<ul class="directions-list">${selection.map(route =>
  '<li><a href="' + escapeHTML(resultHref(route)) + '"><span class="route-icon">' + icon('bus') + '</span><span><strong>' + titleFor(route) + '</strong><small>' + (route.region.startsWith('Ставропольский') ? 'Междугородний маршрут' : route.region) + '</small></span><span class="route-arrow">' + icon('next') + '</span></a></li>').join('')}</ul>`;

const helpLinks = [
  ['/pomosh/posadka/', 'Посадка и документы', 'Что взять с собой и где сесть в автобус', 'doc'],
  ['/pomosh/bagazh/', 'Багаж', 'Как проверить, что входит в билет', 'bag'],
  ['/vozvrat/', 'Возврат билета', 'Правила и расчёт по номеру заказа', 'ticket']
];
const supportTiles = () => '<ul class="directions-list help-links">' + helpLinks.map(([path, title, desc, symbol]) => '<li><a href="' + path + '"><span class="route-icon">' + icon(symbol) + '</span><span><strong>' + title + '</strong><small>' + desc + '</small></span><span class="route-arrow">' + icon('next') + '</span></a></li>').join('') + '</ul>';
export const navLinks = links
  .replace(/href="\//g, 'href="' + sitePath('/'));

const benefits = [
  ['route', 'Рейс под ваши планы', 'Сравните время выезда и прибытия, остановки и пункты посадки.'],
  ['ticket', 'Билет и заказ под рукой', 'После оформления откройте билет и номер заказа на одном экране.'],
  ['clock', 'Планы изменились?', 'Посмотрите условия и сумму возврата по номеру заказа.', '/vozvrat/']
];

export function home() {
  return page({ title: 'Билеты на междугородние автобусы — Туда‑сюда', description: 'Поиск междугородних автобусных рейсов по направлению и дате.', pageType: 'home', body: `
    <div class="wrap">
      <section class="hero" aria-labelledby="home-heading">
        <div class="hero-copy">
          <h1 id="home-heading">Билеты на<br class="desktop-break"> междугородние<br class="desktop-break"> автобусы</h1>
          <p>Введите маршрут и выберите удобный рейс.</p>
          ${searchFields()}
        </div>
        <figure class="hero-photo"><img src="/assets/coast.webp" alt="Междугородний автобус едет вдоль черноморского побережья" width="1200" height="800" fetchpriority="high"></figure>
      </section>
      <section class="home-section" aria-labelledby="benefits-heading">
        <div class="section-header"><h2 id="benefits-heading">От поиска до поездки</h2></div>
        <ul class="benefits-list">${benefits.map(([symbol, title, copy, path]) => `<li class="panel"><span class="route-icon">${icon(symbol)}</span><div><h3>${title}</h3><p>${copy}</p>${path ? `<a class="text-link" href="${path}">Вернуть билет ${icon('arrow')}</a>` : ''}</div></li>`).join('')}</ul>
      </section>
      <section class="home-section" aria-labelledby="popular-heading">
        <div class="section-header"><h2 id="popular-heading">Популярные направления</h2><a href="/avtobusy/" class="text-link">Все направления ${icon('arrow')}</a></div>
        ${directionsList()}
      </section>
      <section class="home-section" aria-labelledby="help-heading"><div class="section-header"><h2 id="help-heading">Перед поездкой</h2></div>${supportTiles()}</section>
    </div>` });
}

export const documentButton = (key, label) => '<button type="button" class="text-link doc-link" data-doc="' + key + '">' + label + '</button>';
const supportButton = () => '<button type="button" class="button support-action" data-support aria-haspopup="dialog" aria-controls="sheet">' + icon('message') + ' Связаться</button>';
export const demoSupportEmail = 'support@example.invalid';
export const supportChannels = () => `<div class="support-channels">
  <p class="field-hint">Демонстрационные способы связи</p>
  <ul aria-label="Тестовые каналы">
    <li><span class="route-icon">${icon('message')}</span><div><strong>Чат поддержки</strong><span>Тестовый канал</span></div></li>
    <li><span class="route-icon">${icon('mail')}</span><div><strong>Электронная почта</strong><span>${demoSupportEmail}</span></div></li>
  </ul>
  <a class="text-link" href="${sitePath('/pomosh/posadka/')}">Открыть справку ${icon('arrow')}</a>
</div>`;

export function timeLine(trip) {
  const dates = trip.scheduled
    ? ['', relativeDay(trip.arrivalDay)]
    : [trip.date, trip.arrivalDate].map(date => dateLabel(date, { day: 'numeric', month: 'short' }));
  const tripTime = (time, day) => time
    ? `<strong class="time">${time}</strong>${day ? `<span class="time-date">${day}</span>` : ''}`
    : '<span class="schedule-time-unknown">Уточняется</span>';
  const duration = trip.duration == null ? 'Время в пути уточняется' : durationLabel(trip.duration) + ' в пути';
  return `<div class="timeline">
      <div class="timeline-stop"><div>${tripTime(trip.departure, dates[0])}</div><i aria-hidden="true"></i><div><strong>${cities[trip.route.from].name}</strong><span>${escapeHTML(trip.fromStation)}${trip.fromOnRequest ? ' · по требованию' : ''}</span></div></div>
      <div class="timeline-duration"><span></span><i aria-hidden="true"></i><span>${duration}</span></div>
      <div class="timeline-stop"><div>${tripTime(trip.arrival, dates[1])}</div><i aria-hidden="true"></i><div><strong>${cities[trip.route.to].name}</strong><span>${escapeHTML(trip.toStation)}${trip.toOnRequest ? ' · по требованию' : ''}</span></div></div>
    </div>`;
}

const relativeDay = day => day > 0 ? '+' + day + ' дн.' : '';
const reviewNumber = new Intl.NumberFormat('ru-RU');
const reviewPlural = new Intl.PluralRules('ru-RU');
const reviewWords = { one: 'отзыв', few: 'отзыва', many: 'отзывов', other: 'отзыва' };
function carrierDetails(trip) {
  const { name, rating, reviews } = trip.carrier;
  if (trip.scheduled) return `<div class="carrier-details"><div class="carrier-identity">${icon('bus')}<strong>${escapeHTML(name)}</strong></div><p class="schedule-frequency">${escapeHTML(trip.frequency)}</p></div>`;
  return `<div class="carrier-details">
    <div class="carrier-identity">${icon('bus')}<strong>${escapeHTML(name)}</strong><span class="demo-data">Демоданные</span></div>
    <div class="carrier-rating">${icon('star')}<span><span class="sr-only">Рейтинг </span>${reviewNumber.format(rating)}<span class="sr-only"> из 5</span> · ${reviewNumber.format(reviews)} ${reviewWords[reviewPlural.select(reviews)]}</span></div>
  </div>
  <ul class="trip-amenities" aria-label="Удобства">${trip.amenities.map(amenity => `<li>${icon('check')} ${escapeHTML(amenity)}</li>`).join('')}</ul>`;
}

function itinerary(trip) {
  const origin = cities[trip.route.from];
  const destination = cities[trip.route.to];
  const stops = [
    { ...origin, station: trip.fromStation, address: trip.fromAddress, time: trip.departure, date: trip.date, day: 0, onRequest: trip.fromOnRequest, endpoint: 'Посадка' },
    ...trip.stops,
    { ...destination, station: trip.toStation, address: trip.toAddress, time: trip.arrival, date: trip.arrivalDate, day: trip.arrivalDay, onRequest: trip.toOnRequest, endpoint: 'Прибытие' }
  ];
  return `<p class="schedule-timezone">Местное время${trip.duration == null ? '' : ' · ' + durationLabel(trip.duration) + ' в пути'}</p>
  <ol class="itinerary" aria-label="Остановки по маршруту">${stops.map(stop => {
    const station = [stop.station, stop.address].filter(Boolean).join(', ');
    const region = stop.region === stop.name ? '' : stop.region;
    const day = trip.scheduled ? relativeDay(stop.day) : dateLabel(stop.date, { day: 'numeric', month: 'short' });
    const clock = stop.time
      ? `<time datetime="${trip.scheduled ? stop.time : localDateTime(stop.date, stop.time)}">${stop.time}${day ? `<span>${day}</span>` : ''}</time>`
      : `<span class="schedule-time-unknown">${stop.onRequest ? 'По требованию' : 'Уточняется'}</span>`;
    return `<li${stop.endpoint ? ' class="itinerary-endpoint"' : ''}>
      ${clock}
      <span class="itinerary-marker" aria-hidden="true"></span>
      <div>${stop.endpoint ? `<span class="itinerary-kind">${stop.endpoint}</span>` : ''}<strong>${escapeHTML(stop.name)}</strong>${station ? `<span>${escapeHTML(station)}</span>` : ''}${region ? `<span>${escapeHTML(region)}</span>` : ''}</div>
    </li>`;
  }).join('')}</ol>`;
}

export function refundDetails(trip, total = trip.price) {
  const { name, earlyHours, earlyPercent, latePercent, cutoffMinutes } = refundRules(trip);
  const departure = Date.parse(localDateTime(trip.date, trip.departure));
  const rows = [
    [`За ${earlyHours} ч и раньше`, earlyPercent, departure - earlyHours * 3600000],
    [`Менее чем за ${earlyHours} ч, но не позднее чем за ${cutoffMinutes} минут до отправления`, latePercent, departure - cutoffMinutes * 60000],
    [`Менее чем за ${cutoffMinutes} минут до отправления и позже`, 0, departure]
  ];
  return `<div class="fare-refund">
    <p><strong>Тариф «${escapeHTML(name)}»</strong> · Демонстрационные условия</p>
    <p>При добровольном возврате срок считают до отправления рейса по местному времени. Процент начисляют на полную оплаченную сумму заказа.</p>
    ${total == null ? '' : `<p class="fare-example">Пример для билета за <strong>${rub(total)}</strong></p>`}
    <dl>${rows.map(([label, percent, time]) => {
      const example = total == null ? '' : `<span class="fare-amount"> · ${rub(refundFor(trip, total, time).refund)}</span>`;
      return `<div><dt>${label}</dt><dd><strong>${percent}% к возврату</strong>${example}</dd></div>`;
    }).join('')}</dl>
  </div>`;
}

export function tripDetails(trip, { includeTimeline = true, includeCarrier = false, refundTotal = trip.price } = {}) {
  if (trip.scheduled) return `<div class="trip-details">
    ${includeTimeline ? itinerary(trip) : ''}
    <p class="field-hint">Источник · ${escapeHTML(trip.source)}</p>
    ${trip.notes ? `<p class="field-hint">${escapeHTML(trip.notes)}</p>` : ''}
    ${trip.terms.length ? `<ul class="schedule-terms">${trip.terms.map(term => `<li>${escapeHTML(term)}</li>`).join('')}</ul>` : ''}
  </div>`;
  return `<div class="trip-details">
    ${includeTimeline ? itinerary(trip) : ''}
    ${includeCarrier ? carrierDetails(trip) : ''}
    <p>Приезжайте за 20 минут и возьмите документ из билета.</p>
    <p>В демонстрационном тарифе ручная кладь включена, багаж оплачивается при посадке.</p>
    <section class="trip-refund"><h3>Возврат билета</h3>${refundDetails(trip, refundTotal)}</section>
    <div class="doc-links">${documentButton('bag', 'Ограничения перевозки багажа')}<button type="button" class="text-link doc-link" data-trip-refund="${trip.id}" aria-haspopup="dialog">Условия возврата</button></div>
  </div>`;
}

export function tripCard(trip, lowest, canBuy = true) {
  const available = trip.seats > 0 && trip.price != null && canBuy;
  const best = available && trip.price === lowest;
  const status = trip.scheduled ? 'По документу перевозчика' : !canBuy ? 'Сохранённое расписание' : trip.seats === 0 ? 'Мест нет' : trip.price == null ? 'Есть рейс · цена уточняется' : best ? 'Лучшая цена' : 'Есть билеты';
  return `<article class="trip-card" aria-label="${trip.departure ? 'Рейс в ' + trip.departure : 'Рейс, время отправления уточняется'}">
    <div class="trip-top"><span class="status ${available ? 'available' : ''}${best ? ' best-price' : ''}">${best ? icon('ticket') : ''}${status}</span></div>
    ${timeLine(trip)}
    ${carrierDetails(trip)}
    ${trip.scheduled ? '' : `<div class="trip-bottom"><div><strong class="trip-price">${rub(trip.price)}</strong>${trip.price != null ? '<small>за 1 взрослого</small>' : ''}</div>${available ? '<button type="button" class="button primary" data-trip="' + trip.id + '">Выбрать</button>' : '<span class="trip-availability">' + (trip.seats === 0 && canBuy ? 'Распродан' : '') + '</span>'}</div>`}
    <details><summary>Детали рейса</summary>${tripDetails(trip)}</details>
  </article>`;
}

const resultsControl = (group, label, initial = '') => `<button type="button" class="button secondary results-control" data-result-control="${group}" aria-haspopup="dialog"><span class="results-control-label">${label}</span><span class="results-selection" data-result-value${initial ? '' : ' hidden'}>${initial}</span>${icon('next')}</button>`;

export function dateStrip(route, date, scenario) {
  const start = date < today() ? today() : date;
  const reference = isReferenceSchedule(route, scenario);
  return Array.from({ length: 6 }, (_, i) => offsetDate(start, i)).map(value => {
    const trips = reference ? [] : tripsFor(route, value, scenario);
    const price = reference ? null : dayPrice(route, value, scenario);
    const hint = reference ? '' : price != null ? 'от ' + rub(price) : trips.some(trip => trip.seats) ? 'Уточняется' : trips.length ? 'Мест нет' : 'Нет рейсов';
    return `<a href="${escapeHTML(resultHref(route, value))}" data-day="${value}"${value === date ? ' aria-current="date"' : ''}><strong>${dateLabel(value, { day: 'numeric', month: 'short' })}</strong>${hint ? '<span>' + hint + '</span>' : ''}</a>`;
  }).join('');
}

export function resultsView(route, date = today()) {
  return page({
    title: 'Автобус ' + titleFor(route) + ': расписание, цены и билеты',
    description: 'Расписание автобусов ' + titleFor(route) + ', время отправления, пункты посадки и прибытия.',
    path: routePath(route.from, route.to), pageType: 'route', route, body: resultsContent(route, date)
  });
}

export function resultsContent(route, date = today()) {
  const list = sortTrips(tripsFor(route, date));
  const lowest = dayPrice(route, date);
  const reference = isReferenceSchedule(route);
  const reverse = findRoute(route.to, route.from);
  const contentTitle = reference ? 'Расписание из документов' : 'Рейсы на ' + dateLabel(date);
  const scheduleNotice = 'Показано расписание из документов перевозчиков. Отправление на выбранную дату, актуальные цены и места не подтверждены.';
  return `
    <div class="wrap journey" id="route-view" data-date="${date}">
      <div class="journey-header">
        <a class="text-link back-link" href="${sitePath('/avtobusy/')}">${icon('back')} Направления</a>
        <h1>Автобусы ${titleFor(route)}</h1>
        <div class="journey-meta"><p data-route-date>${dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' })}${reference ? '' : ' · 1 взрослый'}</p><button class="text-link" type="button" data-edit-search>Изменить поиск</button></div>
      </div>
      <div id="route-search" class="inline-search" hidden>${searchFields(route, date)}</div>
      <section class="dates-panel" aria-label="Даты отправления">
        <div class="dates-title"><h2 data-dates-title>${reference ? 'Дата поездки' : 'Даты и цены'}</h2><button type="button" class="text-link" data-calendar>${icon('calendar')} Календарь</button></div>
        <div class="date-strip" data-date-strip>${dateStrip(route, date)}</div>
      </section>
      <div class="results-controls" role="group" aria-label="Сортировка и фильтры рейсов">
        <div class="results-controls-grid">
          ${resultsControl('sort', 'Сортировать', 'По цене')}
          ${resultsControl('fromStation', 'Откуда')}
          ${resultsControl('toStation', 'Куда')}
          ${resultsControl('departurePeriod', 'Время отправления')}
        </div>
        <div class="results-filter-status"><label class="availability-switch"><input type="checkbox" role="switch" data-available-only><span>Только с билетами</span></label><button type="button" class="text-link" data-clear-filters hidden>Сбросить</button></div>
      </div>
      <section aria-labelledby="trip-heading"><h2 class="results-heading" id="trip-heading">${contentTitle}</h2>
        <div class="schedule-info" data-schedule-info${route.hasSchedule ? '' : ' hidden'}>
          <p class="field-hint" data-schedule-copy>${scheduleNotice}</p>
          ${route.price == null ? '' : '<button class="text-link" type="button" data-demo-preview>Показать деморейсы</button>'}
        </div>
        <p id="results-count" role="status" class="results-count">${list.length ? (reference ? 'Вариантов: ' : 'Рейсов: ') + list.length + ' · местное время' : 'Нет рейсов на выбранный день'}</p><div class="trip-list" id="trip-list">${list.map(trip => tripCard(trip, lowest)).join('') || '<div class="panel"><p>Выберите другую дату в календаре.</p></div>'}</div>
      </section>
      <p class="schedule-note" data-demo-note${reference ? ' hidden' : ''}>Расписание и цены приведены для демонстрации.</p>
      <nav class="related-links" aria-label="Ссылки по маршруту">${reverse ? '<a href="' + escapeHTML(resultHref(reverse, date)) + '">Обратно: ' + titleFor(reverse) + '</a>' : ''}<a href="${sitePath('/pomosh/posadka/')}">Как проходит посадка</a></nav>
      <details class="demo-controls"${route.price == null ? ' hidden' : ''}><summary>Демонстрационные состояния</summary><label for="demo-scenario">Сценарий для проверки интерфейса</label><select id="demo-scenario">
        <option value="">${route.hasSchedule ? 'Расписание перевозчиков' : 'Обычное расписание'}</option><option value="available">Все типы рейсов</option><option value="empty">Нет рейсов</option><option value="sold">Нет мест</option><option value="mixed">Один рейс без цены</option><option value="price-unknown">Цены уточняются</option><option value="error">Сбой расписания</option><option value="offline">Сохранённое расписание</option><option value="seat-lost">Потеря места при резерве</option><option value="expired">Истечение резерва</option><option value="repriced">Изменение цены</option><option value="pending">Оплата проверяется</option><option value="declined">Оплата отклонена</option><option value="issuing">Билет оформляется</option>
      </select></details>
    </div>
    <section class="wrap journey checkout" id="checkout" aria-label="Оформление заказа" hidden></section>`;
}

function contentPage(path, title, content) {
  return page({path, title: title + ' — Туда‑сюда', description: title + '. Справка по междугородним автобусным поездкам.', pageType: 'content', body: '<div class="wrap content-page"><a href="/" class="text-link back-link">' + icon('back') + ' На главную</a><h1>' + title + '</h1>' + content + '</div>'});
}

function returnPage() {
  return page({
    path: '/vozvrat/', pageType: 'refund', title: 'Вернуть билет — Туда‑сюда',
    description: 'Правила, расчёт и демонстрационный возврат автобусных билетов по номеру заказа.',
    body: `<div class="wrap content-page refund-page">
      <a href="/" class="text-link back-link">${icon('back')} На главную</a>
      <h1>Вернуть билет</h1>
      <div id="refund-intro">
        <p>Введите номер из билета или со страницы заказа.</p>
        <p class="notice">Демовозврат доступен для билета, оформленного в этой вкладке.</p>
      </div>
      <form class="panel form-stack refund-form" id="refund-form" novalidate>
        <div class="field">
          <label for="refund-number">Номер заказа</label>
          <input type="text" id="refund-number" placeholder="ТС-123456" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="refund-number-error" required>
          <p class="error" id="refund-number-error" hidden></p>
        </div>
        <button type="button" class="text-link" data-use-demo-order hidden>Подставить номер демозаказа</button>
        <div id="refund-quote" aria-live="polite"></div>
        <fieldset class="purchase-consent" id="refund-consent">
          <legend class="sr-only">Согласие на возврат</legend>
          <div class="consent-row"><input type="checkbox" id="refund-agree" aria-describedby="refund-consent-error" required><label for="refund-agree">Ознакомился с правилами возврата</label></div>
          <button type="button" class="text-link doc-link" data-refund-rules aria-haspopup="dialog">Правила возврата</button>
          <p class="error" id="refund-consent-error" hidden></p>
        </fieldset>
        <button type="submit" class="button primary full" data-submit-refund disabled>Оформить возврат</button>
        <noscript><p>Для возврата в демоверсии включите JavaScript.</p></noscript>
      </form>
      <section class="panel form-stack refund-result" id="refund-result" aria-labelledby="refund-result-title" hidden>
        <span class="route-icon">${icon('check')}</span>
        <h2 id="refund-result-title" tabindex="-1"></h2>
        <div id="refund-result-copy"></div>
        <p>Почта поддержки в демоверсии <strong>${demoSupportEmail}</strong></p>
        <button type="button" class="text-link" data-reset-refund>Проверить другой номер</button>
      </section>
      <p class="field-hint" id="refund-start" hidden>Для проверки оформите демобилет через <a href="/">поиск рейсов</a>.</p>
    </div>`
  });
}

function carrierPage() {
  return page({
    path: '/perevozchikam/',
    title: 'Для перевозчиков — Туда‑сюда',
    description: 'Заявка на подключение междугородних рейсов перевозчика к Туда‑сюда.',
    pageType: 'carriers',
    body: `<div class="wrap content-page carrier-page">
      <a href="/" class="text-link back-link">${icon('back')} На главную</a>
      <h1>Для перевозчиков</h1>
      <p class="carrier-intro">Предложите свои междугородние рейсы для подключения к «Туда‑сюда».</p>
      <form id="carrier-form" class="panel form-stack carrier-application" aria-labelledby="carrier-form-title" aria-describedby="carrier-demo" autocomplete="off" novalidate>
        <div>
          <h2 id="carrier-form-title">Заявка на подключение</h2>
          <p id="carrier-demo" class="field-hint">Демонстрационная форма. Для проверки введите вымышленные данные.</p>
          <p class="field-hint">Все поля обязательны.</p>
        </div>
        <div class="field"><label for="carrier-company">Компания или ИП</label><input id="carrier-company" type="text" required aria-describedby="carrier-company-error"><p class="error" id="carrier-company-error" hidden></p></div>
        <div class="field"><label for="carrier-contact">Имя контактного лица</label><input id="carrier-contact" type="text" required aria-describedby="carrier-contact-error"><p class="error" id="carrier-contact-error" hidden></p></div>
        <div class="field"><label for="carrier-phone">Телефон</label><input id="carrier-phone" type="tel" inputmode="tel" required aria-describedby="carrier-phone-error"><p class="error" id="carrier-phone-error" hidden></p></div>
        <div class="field"><label for="carrier-route">Город или маршрут</label><input id="carrier-route" type="text" required aria-describedby="carrier-route-error"><p class="error" id="carrier-route-error" hidden></p></div>
        <div class="field"><label for="carrier-proposal">Автопарк или предложение</label><textarea id="carrier-proposal" rows="4" required aria-describedby="carrier-proposal-hint carrier-proposal-error"></textarea><p class="field-hint" id="carrier-proposal-hint">Укажите, сколько автобусов и посадочных мест, или расскажите, какие рейсы хотите подключить.</p><p class="error" id="carrier-proposal-error" hidden></p></div>
        <button type="submit" class="button primary" disabled>Отправить заявку</button>
        <p class="carrier-confirmation" id="carrier-confirmation" role="status" tabindex="-1"></p>
        <noscript><p class="field-hint">Для проверки формы включите JavaScript.</p></noscript>
      </form>
      <section class="carrier-faq" aria-labelledby="carrier-faq-title">
        <h2 id="carrier-faq-title">Частые вопросы</h2>
        <details><summary>Кого можно подключить к пилоту?</summary><p>В первую очередь рассматриваются направления из Ставрополя в Москву, Сочи, Анапу, Новороссийск и Геленджик в обе стороны.</p></details>
        <details><summary>Что подготовить по первому рейсу?</summary><p>Дату и местное время, адреса посадки и высадки, тариф, доступные места и правила перевозки.</p></details>
        <details><summary>Если у билетной системы нет API?</summary><p>Для пилота требуется проверить способ обмена расписанием, остатками и резервами в конкретной учётной системе.</p></details>
      </section>
    </div>`
  });
}

export const articles = {
  '/pomosh/posadka/': ['Посадка и документы', '<p>Проверьте точку посадки, местное время отправления и документ в билете. У одного города может быть несколько автовокзалов.</p><h2>Что взять с собой</h2><p>Возьмите документ, данные которого указали при покупке. В каком виде принимают билет и за сколько времени нужно приехать, уточняйте в деталях рейса.</p><h2>Где сесть в автобус</h2><p>Откройте расписание, выберите дату и раскройте «Детали рейса». Там указан адрес посадки.</p>'],
  '/pomosh/bagazh/': ['Багаж в автобусе', '<p>Нормы по размеру, весу и количеству мест зависят от перевозчика и тарифа. В деталях рейса проверьте, включён ли багаж и где его оплачивать.</p>'],
  '/pomosh/vozvrat/': ['Возврат билета', '<p>Откройте свой заказ и проверьте правило тарифа. Условия добровольного возврата и порядок действий при отмене рейса могут отличаться.</p><p><a class="text-link" href="/vozvrat/">Вернуть билет по номеру заказа</a></p><p>Если расчёт недоступен, можно обратиться в поддержку.</p>']
};

export function publicPages() {
  const directory = [...new Set(routes.flatMap(route => [route.from, route.to]))];
  return {
    '/': home(),
    '/vozvrat/': returnPage(),
    '/avtobusy/': contentPage('/avtobusy/', 'Автобусные направления', '<p>Выберите город отправления и направление, чтобы посмотреть рейсы на нужную дату.</p>' +
      directory.map(id => '<section class="catalog-group"><h2><a href="/avtobusy/' + id + '/">' + cities[id].name + '</a></h2>' + directionsList(routes.filter(route => route.from === id)) + '</section>').join('')),
    ...Object.fromEntries(directory.map(id => {
      const city = cities[id];
      const path = '/avtobusy/' + id + '/';
      return [path, contentPage(path, 'Автобусы · ' + city.name, '<p>Пункты посадки указаны в деталях рейсов.</p><h2>Отправления</h2>' + directionsList(routes.filter(route => route.from === id)) + '<h2>Прибытия</h2>' + directionsList(routes.filter(route => route.to === id)))];
    })),
    '/avtobusy/poisk/': page({
      title: 'Поиск автобусных рейсов — Туда‑сюда',
      description: 'Поиск по населённым пунктам из расписаний перевозчиков.',
      path: '/avtobusy/poisk/', pageType: 'route',
      body: '<div id="search-results" class="content-placeholder"><div class="wrap content-page"><h1>Поиск рейсов</h1><p>Вернитесь к форме, чтобы выбрать направление.</p><a href="/" class="text-link">Перейти к поиску</a></div></div>'
    }),
    ...Object.fromEntries(routes.map(route => [routePath(route.from, route.to), resultsView(route)])),
    ...Object.fromEntries(Object.entries(articles).map(([path, [title, body]]) => [path, contentPage(path, title, body + '<h2>Проверить свой маршрут</h2>' + directionsList([routes[0], routes[1]]))])),
    '/perevozchikam/': carrierPage(),
    '/profil/': contentPage('/profil/', 'Демопрофиль', '<div class="panel form-stack" id="profile-panel"><p>Здесь можно проверить повторную покупку с тестовыми контактами.</p></div>')
  };
}
