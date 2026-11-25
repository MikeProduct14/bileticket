import { cities, routes, routePath, sitePath, today, offsetDate, dateLabel, rub, durationLabel, tripsFor, dayPrice, sortTrips, localDateTime, refundFor, refundRules } from './data.js';

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
const links = '<a href="/avtobusy/">Направления</a><a href="/pomosh/posadka/">Помощь</a>';
export const header = '<header class="site-header"><div class="wrap header-inner">' + brand + '<nav class="desktop-nav" aria-label="Основная навигация">' + links + '</nav><button type="button" class="icon-button menu-toggle" data-menu aria-label="Открыть меню" aria-haspopup="dialog">' + icon('menu') + '</button></div></header>';
const footer = '<footer class="site-footer"><div class="wrap footer-inner"><div>' + brand + '<p>Расписание, цены и заказы в прототипе тестовые.</p></div><nav aria-label="Ссылки в подвале">' + links + '<a href="/perevozchikam/">Перевозчикам</a></nav></div></footer>';

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
  <title>${escapeHTML(title)}</title>
  <script type="module" src="/assets/app.js"></script>
</head>
<body data-page="${pageType}"${route ? ' data-from="' + route.from + '" data-to="' + route.to + '"' : ''}>
<a href="#main" class="skip-link">Перейти к содержанию</a>
${header}
<main id="main" tabindex="-1">${body}</main>
${footer}
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

const popular = routes.filter(route => route.from === 'stavropol');
const directionsList = (selection = popular) => `<ul class="directions-list">${selection.map(route =>
  '<li><a href="' + routePath(route.from, route.to) + '"><span class="route-icon">' + icon('bus') + '</span><span><strong>' + titleFor(route) + '</strong><small>' + (route.region.startsWith('Ставропольский') ? 'Междугородний маршрут' : route.region) + '</small></span><span class="route-arrow">' + icon('next') + '</span></a></li>').join('')}</ul>`;

const helpLinks = [
  ['posadka', 'Посадка и документы', 'Что взять с собой и где сесть в автобус', 'doc'],
  ['bagazh', 'Багаж', 'Как проверить, что входит в билет', 'bag'],
  ['vozvrat', 'Возврат билета', 'Где посмотреть условия и статус', 'ticket']
];
const supportTiles = () => '<ul class="directions-list help-links">' + helpLinks.map(([slug, title, desc, symbol]) => '<li><a href="/pomosh/' + slug + '/"><span class="route-icon">' + icon(symbol) + '</span><span><strong>' + title + '</strong><small>' + desc + '</small></span><span class="route-arrow">' + icon('next') + '</span></a></li>').join('') + '</ul>';
export const navLinks = (links + '<a href="/pomosh/vozvrat/">Возврат билета</a><a href="/perevozchikam/">Перевозчикам</a>')
  .replace(/href="\//g, 'href="' + sitePath('/'));

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
      <section class="home-section" aria-labelledby="popular-heading">
        <div class="section-header"><h2 id="popular-heading">Популярные направления</h2><a href="/avtobusy/" class="text-link">Все направления ${icon('arrow')}</a></div>
        ${directionsList()}
      </section>
      <section class="home-section" aria-labelledby="help-heading"><div class="section-header"><h2 id="help-heading">Перед поездкой</h2></div>${supportTiles()}</section>
    </div>` });
}

export const documentButton = (key, label) => '<button type="button" class="text-link doc-link" data-doc="' + key + '">' + label + '</button>';
export const supportButton = () => '<button type="button" class="button secondary support-action" data-support aria-haspopup="dialog">' + icon('message') + ' Связаться</button>';
export const supportChannels = () => `<div class="support-channels">
  <p class="field-hint">Демонстрационные способы связи</p>
  <ul aria-label="Тестовые каналы">
    <li><span class="route-icon">${icon('message')}</span><div><strong>Чат поддержки</strong><span>Тестовый канал</span></div></li>
    <li><span class="route-icon">${icon('mail')}</span><div><strong>Электронная почта</strong><span>support@example.invalid</span></div></li>
  </ul>
  <a class="text-link" href="${sitePath('/pomosh/posadka/')}">Открыть справку ${icon('arrow')}</a>
</div>`;

export function timeLine(trip) {
  const dates = [trip.date, trip.arrivalDate].map(date => dateLabel(date, { day: 'numeric', month: 'short' }));
  return `<div class="timeline">
      <div class="timeline-stop"><div><strong class="time">${trip.departure}</strong><span class="time-date">${dates[0]}</span></div><i aria-hidden="true"></i><div><strong>${cities[trip.route.from].name}</strong><span>${trip.fromStation}</span></div></div>
      <div class="timeline-duration"><span></span><i aria-hidden="true"></i><span>${durationLabel(trip.duration)} в пути</span></div>
      <div class="timeline-stop"><div><strong class="time">${trip.arrival}</strong><span class="time-date">${dates[1]}</span></div><i aria-hidden="true"></i><div><strong>${cities[trip.route.to].name}</strong><span>${trip.toStation}</span></div></div>
    </div>`;
}

const reviewNumber = new Intl.NumberFormat('ru-RU');
const reviewPlural = new Intl.PluralRules('ru-RU');
const reviewWords = { one: 'отзыв', few: 'отзыва', many: 'отзывов', other: 'отзыва' };
function carrierDetails(trip) {
  const { name, rating, reviews } = trip.carrier;
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
    { ...origin, station: trip.fromStation, address: trip.fromAddress, time: trip.departure, date: trip.date, endpoint: 'Посадка' },
    ...trip.stops,
    { ...destination, station: trip.toStation, address: trip.toAddress, time: trip.arrival, date: trip.arrivalDate, endpoint: 'Прибытие' }
  ];
  return `<p class="schedule-timezone">Местное время · ${durationLabel(trip.duration)} в пути</p>
  <ol class="itinerary" aria-label="Остановки по маршруту">${stops.map(stop => {
    const station = [stop.station, stop.address].filter(Boolean).join(', ');
    const region = stop.region === stop.name ? '' : stop.region;
    return `<li${stop.endpoint ? ' class="itinerary-endpoint"' : ''}>
      <time datetime="${localDateTime(stop.date, stop.time)}">${stop.time}<span>${dateLabel(stop.date, { day: 'numeric', month: 'short' })}</span></time>
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
  const status = !canBuy ? 'Сохранённое расписание' : trip.seats === 0 ? 'Мест нет' : trip.price == null ? 'Есть рейс · цена уточняется' : best ? 'Лучшая цена' : 'Есть билеты';
  return `<article class="trip-card" aria-label="Рейс в ${trip.departure}">
    <div class="trip-top"><span class="status ${available ? 'available' : ''}${best ? ' best-price' : ''}">${best ? icon('ticket') : ''}${status}</span></div>
    ${timeLine(trip)}
    ${carrierDetails(trip)}
    <div class="trip-bottom"><div><strong class="trip-price">${rub(trip.price)}</strong>${trip.price != null ? '<small>за 1 взрослого</small>' : ''}</div>${available ? '<button type="button" class="button primary" data-trip="' + trip.id + '">Выбрать</button>' : '<span class="trip-availability">' + (trip.seats === 0 && canBuy ? 'Распродан' : '') + '</span>'}</div>
    <details><summary>Детали рейса</summary>${tripDetails(trip)}</details>
  </article>`;
}

const resultsControl = (group, label, initial = '') => `<button type="button" class="button secondary results-control" data-result-control="${group}" aria-haspopup="dialog"><span class="results-control-label">${label}</span><span class="results-selection" data-result-value${initial ? '' : ' hidden'}>${initial}</span>${icon('next')}</button>`;

export function dateStrip(route, date, scenario) {
  const start = date < today() ? today() : date;
  return Array.from({ length: 6 }, (_, i) => offsetDate(start, i)).map(value => {
    const price = dayPrice(route, value, scenario);
    const trips = tripsFor(route, value, scenario);
    const hint = price != null ? 'от ' + rub(price) : trips.some(trip => trip.seats) ? 'Уточняется' : trips.length ? 'Мест нет' : 'Нет рейсов';
    return `<a href="${routePath(route.from, route.to)}?date=${value}" data-day="${value}"${value === date ? ' aria-current="date"' : ''}><strong>${dateLabel(value, { day: 'numeric', month: 'short' })}</strong><span>${hint}</span></a>`;
  }).join('');
}

export function resultsView(route, date = today()) {
  const list = sortTrips(tripsFor(route, date));
  const lowest = dayPrice(route, date);
  return page({ title: 'Автобус ' + titleFor(route) + ': расписание, цены и билеты', description: 'Расписание автобусов ' + titleFor(route) + ', время отправления, пункты посадки и прибытия.', path: routePath(route.from, route.to), pageType: 'route', route, body: `
    <div class="wrap journey" id="route-view" data-date="${date}">
      <div class="journey-header">
        <a class="text-link back-link" href="/avtobusy/">${icon('back')} Направления</a>
        <h1>Автобусы ${titleFor(route)}</h1>
        <div class="journey-meta"><p data-route-date>${dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' })} · 1 взрослый</p><div class="journey-actions"><button class="text-link" type="button" data-edit-search>Изменить поиск</button>${supportButton()}</div></div>
      </div>
      <div id="route-search" class="inline-search" hidden>${searchFields(route, date)}</div>
      <section class="dates-panel" aria-label="Даты отправления">
        <div class="dates-title"><h2>Даты и цены</h2><button type="button" class="text-link" data-calendar>${icon('calendar')} Календарь</button></div>
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
      <section aria-labelledby="trip-heading"><h2 class="results-heading" id="trip-heading">Рейсы на ${dateLabel(date)}</h2><p id="results-count" role="status" class="results-count">${list.length ? 'Рейсов: ' + list.length + ' · местное время' : 'Нет рейсов на выбранный день'}</p><div class="trip-list" id="trip-list">${list.map(trip => tripCard(trip, lowest)).join('') || '<div class="panel"><p>Выберите другую дату в календаре.</p></div>'}</div></section>
      <section class="panel station-panel"><h2>Основные пункты маршрута</h2><p>${cities[route.from].name} · ${cities[route.from].station}, ${cities[route.from].address}</p><p>${cities[route.to].name} · ${cities[route.to].station}, ${cities[route.to].address}</p><p class="field-hint">Точные пункты отправления и прибытия указаны в карточке рейса.</p></section>
      <p class="schedule-note">Расписание и цены приведены для демонстрации. Дата расписания — ${dateLabel(today())}.</p>
      <nav class="related-links" aria-label="Ссылки по маршруту"><a href="${routePath(route.to, route.from)}">Обратно: ${titleFor({from: route.to, to: route.from})}</a><a href="/pomosh/posadka/">Как проходит посадка</a></nav>
      <details class="demo-controls"><summary>Демонстрационные состояния</summary><label for="demo-scenario">Сценарий для проверки интерфейса</label><select id="demo-scenario">
        <option value="">Обычное расписание</option><option value="available">Все типы рейсов</option><option value="empty">Нет рейсов</option><option value="sold">Нет мест</option><option value="mixed">Один рейс без цены</option><option value="price-unknown">Цены уточняются</option><option value="error">Сбой расписания</option><option value="offline">Сохранённое расписание</option><option value="seat-lost">Потеря места при резерве</option><option value="expired">Истечение резерва</option><option value="repriced">Изменение цены</option><option value="pending">Оплата проверяется</option><option value="declined">Оплата отклонена</option><option value="issuing">Билет оформляется</option>
      </select></details>
    </div>
    <section class="wrap journey checkout" id="checkout" aria-label="Оформление заказа" hidden></section>` });
}

function contentPage(path, title, content) {
  return page({path, title: title + ' — Туда‑сюда', description: title + '. Справка по междугородним автобусным поездкам.', pageType: 'content', body: '<div class="wrap content-page"><a href="/" class="text-link back-link">' + icon('back') + ' На главную</a><h1>' + title + '</h1>' + content + '</div>'});
}

export const articles = {
  '/pomosh/posadka/': ['Посадка и документы', '<p>Проверьте точку посадки, местное время отправления и документ в билете. У одного города может быть несколько автовокзалов.</p><h2>Что взять с собой</h2><p>Возьмите документ, данные которого указали при покупке. В каком виде принимают билет и за сколько времени нужно приехать, уточняйте в деталях рейса.</p><h2>Где сесть в автобус</h2><p>Откройте расписание, выберите дату и раскройте «Детали рейса». Там указан адрес посадки.</p>'],
  '/pomosh/bagazh/': ['Багаж в автобусе', '<p>Нормы по размеру, весу и количеству мест зависят от перевозчика и тарифа. В деталях рейса проверьте, включён ли багаж и где его оплачивать.</p>'],
  '/pomosh/vozvrat/': ['Возврат билета', '<p>Откройте свой заказ и проверьте правило тарифа. Условия добровольного возврата и порядок действий при отмене рейса могут отличаться.</p><p>Если расчёт недоступен, в заказе можно выбрать обращение в поддержку.</p>']
};

export function publicPages() {
  return {
    '/': home(),
    '/avtobusy/': contentPage('/avtobusy/', 'Автобусные направления', '<p>Выберите город отправления и направление, чтобы посмотреть рейсы на нужную дату.</p>' +
      Object.entries(cities).map(([id, city]) => '<section class="catalog-group"><h2><a href="/avtobusy/' + id + '/">' + city.name + '</a></h2>' + directionsList(routes.filter(route => route.from === id)) + '</section>').join('')),
    ...Object.fromEntries(Object.entries(cities).map(([id, city]) => {
      const path = '/avtobusy/' + id + '/';
      return [path, contentPage(path, 'Автобусы · ' + city.name, '<p>Основной пункт посадки в деморасписании: ' + city.station + ', ' + city.address + '.</p><h2>Отправления</h2>' + directionsList(routes.filter(route => route.from === id)) + '<h2>Прибытия</h2>' + directionsList(routes.filter(route => route.to === id)))];
    })),
    ...Object.fromEntries(routes.map(route => [routePath(route.from, route.to), resultsView(route)])),
    ...Object.fromEntries(Object.entries(articles).map(([path, [title, body]]) => [path, contentPage(path, title, body + '<h2>Проверить свой маршрут</h2>' + directionsList([routes[0], routes[1]]))])),
    '/perevozchikam/': contentPage('/perevozchikam/', 'Перевозчикам', '<p>Для пилота нужны сведения о рейсах, тарифах, остатках мест и условиях посадки, багажа и возврата.</p><h2>Частые вопросы</h2><details><summary>Кого можно подключить к пилоту?</summary><p>В первую очередь рассматриваются направления из Ставрополя в Москву, Сочи, Анапу, Новороссийск и Геленджик в обе стороны.</p></details><details><summary>Что подготовить по первому рейсу?</summary><p>Дату и местное время, адреса посадки и высадки, тариф, доступные места и правила перевозки.</p></details><details><summary>Если у билетной системы нет API?</summary><p>Для пилота требуется проверить способ обмена расписанием, остатками и резервами в конкретной учётной системе.</p></details>'),
    '/profil/': contentPage('/profil/', 'Демопрофиль', '<div class="panel form-stack" id="profile-panel"><p>Здесь можно проверить повторную покупку с тестовыми контактами.</p></div>')
  };
}
