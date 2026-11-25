import { cities, routesByPath, sitePath, today, offsetDate, dateLabel, validDate, rub, tripsFor, dayPrice, refundFor, sortTrips, searchPath, findRoute, resultHref, isReferenceSchedule } from './data.js';
import { icon, titleFor, escapeHTML, navLinks, documentButton, tripCard, tripDetails, timeLine, dateStrip, supportChannels, resultsContent, refundDetails as tripRefundDetails } from './views.js';
import {
  canAddPassenger, demoContacts, documentsByType, emptyDraft, examplePassenger, fieldId, genders,
  hasAllSeats, inputField, passengerCard, peopleLabel, seatChoices, selectedOption, selectOptions,
  totalFor, validationMessage
} from './passengers.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const button = (label, attrs, style = 'primary') => '<button type="button" class="button ' + style + '" ' + attrs + '>' + label + '</button>';
const priceText = value => escapeHTML(rub(value));
const tracker = {
  disable: 'Нет мест',
  empty: 'Нет рейсов',
  error: 'Цена неизвестна',
  loading: 'Уточняем…'
};
const documents = {
  refund: ['Условия возврата', [
    ['Добровольный возврат', 'Условия зависят от тарифа и времени до отправления. В личном заказе можно увидеть расчёт суммы и удержания, если его предоставляет перевозчик.'],
    ['Отмена рейса', 'В заказе появится информация об отмене и доступный способ обращения. Правила для отменённого рейса и добровольного отказа различаются.'],
    ['Как проверить статус', 'После подтверждения запроса в заказе отображаются статус и сумма. Подтверждение операции и зачисление денег банком могут происходить в разное время.']
  ]],
  bag: ['Ограничения перевозки багажа', [
    ['Ручная кладь', 'В тестовом тарифе ручная кладь включена в стоимость билета. Допустимые размеры и вес указывает перевозчик.'],
    ['Багаж в багажном отделении', 'В тестовом тарифе багаж оплачивается при посадке. Нормы и сумму нужно уточнять у перевозчика по конкретному рейсу.'],
    ['Нестандартный багаж', 'Возможность перевозки крупногабаритных вещей и животных зависит от правил перевозчика и вместимости автобуса.']
  ]],
  purchase: ['Условия покупки электронных билетов', [
    ['Рейс и тариф', 'Проверьте дату, местное время, адрес посадки, данные пассажира и итоговую сумму. Билет оформляется на указанный в анкете документ.'],
    ['Получение билета', 'После подтверждения платежа билет выпускается билетной системой. Состояние заказа и билет доступны владельцу заказа.'],
    ['Если оплата проверяется', 'Сохраните номер заказа. В заказе можно проверить состояние операции и перейти в справку.']
  ]],
  profile: ['Согласие на сохранение контактов', [
    ['Что сохраняется', 'Телефон и электронная почта могут использоваться для следующей покупки после входа в профиль и подтверждения контактов.'],
    ['Как используется согласие', 'Отметка отдельная и добровольная. В прототипе проверка контактов и профиль показаны в учебном режиме.']
  ]]
};

const params = () => new URLSearchParams(location.search);
const initial = params().get('date');
const chosenDate = validDate(initial) && initial >= today() ? initial : today();
const route = routesByPath[location.pathname] ||
  (location.pathname === searchPath() ? findRoute(params().get('from'), params().get('to')) : null);
const resultsHost = $('#search-results');
if (resultsHost && route) {
  resultsHost.innerHTML = resultsContent(route, chosenDate);
  document.title = 'Автобусы ' + titleFor(route) + ' — Туда‑сюда';
}
const routeView = $('#route-view');
const checkoutView = $('#checkout');
const search = $('#search-form');
let date = route ? chosenDate : '';
const emptyFilters = () => ({ available: false, fromStation: [], toStation: [], departurePeriod: [] });
let filters = emptyFilters();
let sort = 'price';
let scenario = '';
let searching = false;
let resultsScroll = 0;
let scheduleTimer;
let resultState = '';
let step = '';
let booking;
let formDraft = emptyDraft();
const fieldErrors = new Map();
let consentError = '';
let renderedTrip = new Map();
let stagedClose;

const dialog = $('#sheet');
let returnFocus;
const sheet = {
  open(title, content, footer = '', variant = '') {
    if (!dialog.open) {
      returnFocus = document.activeElement;
      history.pushState({ ...history.state, sheet: true }, '');
      document.body.classList.add('sheet-open');
      dialog.showModal();
    }
    dialog.className = 'sheet ' + variant;
    $('#sheet-title').textContent = title;
    $('.sheet-content', dialog).innerHTML = content;
    $('.sheet-content', dialog).scrollTop = 0;
    $('.sheet-footer', dialog).innerHTML = footer;
    $('.sheet-footer', dialog).hidden = !footer;
    $('[data-close]', dialog).focus({ preventScroll: true });
  },
  hide() {
    if (!dialog.open) return;
    dialog.close();
    document.body.classList.remove('sheet-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  },
  close(after) {
    stagedClose = after;
    if (history.state?.sheet) history.back();
    else {
      this.hide();
      stagedClose?.();
      stagedClose = null;
    }
  }
};
dialog.addEventListener('cancel', event => {
  event.preventDefault();
  sheet.close();
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom) sheet.close();
  }
});

const floatingSupport = $('[data-support]');
let supportFrame;
function placeSupport() {
  if (supportFrame) return;
  supportFrame = requestAnimationFrame(() => {
    supportFrame = 0;
    if (dialog.open || document.activeElement === floatingSupport) return;
    const dock = floatingSupport.getBoundingClientRect();
    const controls = $$('#main :is(.primary, .search-control, .results-control, .availability-switch, .checkout button, input:not([type=hidden]), select, textarea), .site-footer nav a');
    const overlaps = controls.some(control => {
      const bounds = control.getBoundingClientRect();
      return bounds.width && bounds.height && bounds.left < dock.right && bounds.right > dock.left &&
        bounds.top < dock.bottom && bounds.bottom > dock.top;
    });
    floatingSupport.toggleAttribute('data-obscured', overlaps);
  });
}
if (floatingSupport) {
  window.addEventListener('scroll', placeSupport, { passive: true });
  window.addEventListener('resize', placeSupport);
  window.visualViewport?.addEventListener('resize', placeSupport);
  floatingSupport.addEventListener('blur', placeSupport);
  new ResizeObserver(placeSupport).observe(document.body);
  placeSupport();
}

function setError(element, error, message) {
  error.textContent = message;
  error.hidden = !message;
  if (message) element.setAttribute('aria-invalid', 'true');
  else element.removeAttribute('aria-invalid');
}

const cityFields = ['from', 'to'].map(key => $('#' + key)).filter(Boolean);
function closeCity(input) {
  $('#' + input.id + '-options').hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}
function chooseCity(input, id) {
  input.value = cities[id].name;
  input.dataset.city = id;
  closeCity(input);
  setError(input, $('#' + input.id + '-error'), '');
  if (cityFields.every(field => field.dataset.city) && cityFields[0].dataset.city !== cityFields[1].dataset.city) {
    cityFields.forEach(field => setError(field, $('#' + field.id + '-error'), ''));
  }
}
function queryCities(input) {
  const normalize = value => value.toLowerCase().replaceAll('ё', 'е').trim();
  const query = input.dataset.city ? '' : normalize(input.value);
  const other = cityFields.find(field => field !== input)?.dataset.city;
  const linked = id => input.id === 'from' ? findRoute(id, other) : findRoute(other, id);
  const choices = Object.entries(cities).filter(([id, city]) =>
    (query || !other || linked(id)) && [city.name, ...(city.aliases || [])].some(name => normalize(name).includes(query)));
  if (query) {
    choices.sort(([leftId, left], [rightId, right]) =>
      Number(Boolean(linked(rightId))) - Number(Boolean(linked(leftId))) ||
      Number(normalize(right.name).startsWith(query)) - Number(normalize(left.name).startsWith(query)) ||
      left.name.localeCompare(right.name, 'ru'));
  }
  const list = $('#' + input.id + '-options');
  list.innerHTML = choices.map(([id, city]) => '<div id="' + input.id + '-opt-' + id + '" role="option" aria-selected="false" data-city-choice="' + id + '"><strong>' + escapeHTML(city.name) + '</strong><small>' + escapeHTML(city.region) + '</small></div>').join('') ||
    '<div class="no-cities" role="presentation"><span role="status">Город не найден. Измените запрос.</span></div>';
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  input.removeAttribute('aria-activedescendant');
}

for (const input of cityFields) {
  input.addEventListener('focus', () => queryCities(input));
  input.addEventListener('input', () => {
    input.dataset.city = '';
    setError(input, $('#' + input.id + '-error'), '');
    queryCities(input);
  });
  input.addEventListener('blur', () => closeCity(input));
  const list = $('#' + input.id + '-options');
  list.addEventListener('pointerdown', event => event.preventDefault());
  list.addEventListener('click', event => {
    const option = event.target.closest('[data-city-choice]');
    if (option) chooseCity(input, option.dataset.cityChoice);
  });
  input.addEventListener('keydown', event => {
    const options = $$('[data-city-choice]', list);
    const current = options.findIndex(option => option.getAttribute('aria-selected') === 'true');
    if (event.key === 'Escape') return closeCity(input);
    if (event.key === 'Enter' && !list.hidden && current >= 0) {
      event.preventDefault();
      chooseCity(input, options[current].dataset.cityChoice);
    }
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if (list.hidden) queryCities(input);
      const visible = $$('[data-city-choice]', list);
      if (!visible.length) return;
      const next = current === -1 ? (event.key === 'ArrowDown' ? 0 : visible.length - 1) : (current + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
      visible.forEach((option, i) => option.setAttribute('aria-selected', String(i === next)));
      input.setAttribute('aria-activedescendant', visible[next].id);
      visible[next].scrollIntoView({ block: 'nearest' });
    }
  });
}

let searchDate = date;
function setSearchDate(value) {
  searchDate = value;
  if (!search) return;
  $('[data-date-label]', search).textContent = value ? dateLabel(value) : 'Выберите дату';
  $$('[data-offset]', search).forEach(el => el.setAttribute('aria-pressed', String(offsetDate(today(), Number(el.dataset.offset)) === value)));
  setError($('[data-calendar]', search), $('#date-error', search), '');
}

function resolvePair() {
  const [from, to] = cityFields.map(input => input.dataset.city);
  return findRoute(from, to);
}

function verifySearch() {
  const invalid = [];
  const [from, to] = cityFields;
  for (const input of cityFields) {
    const message = input.dataset.city ? '' : input.value.trim() ? 'Выберите город из подсказок.' : 'Укажите город.';
    setError(input, $('#' + input.id + '-error'), message);
    if (message) invalid.push(input);
  }
  if (from.dataset.city && from.dataset.city === to.dataset.city) {
    setError(to, $('#to-error'), 'Выберите другой город прибытия.');
    invalid.push(to);
  }
  if (!searchDate) {
    const control = $('[data-calendar]', search);
    setError(control, $('#date-error', search), 'Выберите дату отправления.');
    invalid.push(control);
  }
  invalid[0]?.focus();
  return !invalid.length;
}

search?.addEventListener('submit', event => {
  event.preventDefault();
  if (searching || !verifySearch()) return;
  const error = $('[data-search-error]', search);
  const destination = resolvePair();
  const message = !destination ? 'Для этой пары пунктов нет расписания. Попробуйте выбрать другую остановку.' :
    !navigator.onLine ? 'Нет связи. Проверьте подключение и повторите поиск.' : '';
  error.textContent = message;
  error.hidden = !message;
  if (message) return;
  const submit = $('[type=submit]', search);
  searching = true;
  submit.disabled = true;
  submit.textContent = 'Ищем рейсы…';
  if (route && destination.from === route.from && destination.to === route.to) {
    setTimeout(() => {
      searching = false;
      submit.disabled = false;
      submit.innerHTML = icon('search') + ' Найти рейсы';
      $('#route-search').hidden = true;
      setDate(searchDate);
    }, 220);
  } else {
    const href = resultHref(destination, searchDate);
    setTimeout(() => location.assign(href), 200);
  }
});

let calendarMonth;
let calendarForResults;
function openCalendar(fromForm) {
  calendarForResults = !fromForm;
  calendarMonth = (fromForm ? searchDate : date) || today();
  renderCalendar();
}

function renderCalendar() {
  const selected = calendarForResults ? date : searchDate;
  const currentDay = today();
  const pair = calendarForResults ? route : resolvePair();
  const first = calendarMonth.slice(0, 7) + '-01';
  const start = new Date(first + 'T12:00:00Z');
  const offset = (start.getUTCDay() + 6) % 7;
  const month = dateLabel(first, { month: 'long', year: 'numeric' });
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const nextMonth = next.toISOString().slice(0, 10);
  const days = Number(offsetDate(nextMonth, -1).slice(-2));
  const activeScenario = calendarForResults || pair === route ? scenario : '';
  const reference = isReferenceSchedule(pair, activeScenario);
  const cells = Array.from({ length: offset }, () => '<span></span>');
  for (let i = 0; i < days; i++) {
    const value = offsetDate(first, i);
    const disabled = value < currentDay;
    let status = '';
    if (pair && !disabled && !reference) {
      const price = dayPrice(pair, value, activeScenario);
      const trips = tripsFor(pair, value, activeScenario);
      if (resultState === 'loading' && pair === route) status = tracker.loading;
      else if (['error', 'offline'].includes(activeScenario)) status = tracker.error;
      else if (price != null) status = 'от ' + rub(price);
      else if (trips.some(trip => trip.seats)) status = tracker.error;
      else status = trips.length ? tracker.disable : tracker.empty;
    }
    cells.push('<button type="button" class="calendar-day" data-pick-date="' + value + '" aria-label="' + dateLabel(value) + (status ? ', ' + status : '') + '" aria-pressed="' + (value === selected) + '"' + (value === currentDay ? ' aria-current="date"' : '') + (disabled ? ' disabled' : '') + '><strong>' + (i + 1) + '</strong>' + (status ? '<small>' + status + '</small>' : '') + '</button>');
  }
  sheet.open('Дата отправления', '<div class="calendar-nav">' +
    '<button type="button" class="icon-button" data-month="-1" aria-label="Предыдущий месяц"' + (first <= currentDay.slice(0, 7) + '-01' ? ' disabled' : '') + '>' + icon('prev') + '</button><strong>' + month +
    '</strong><button type="button" class="icon-button" data-month="1" aria-label="Следующий месяц">' + icon('next') + '</button></div><div class="calendar-grid"><div class="week" aria-hidden="true"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="days">' +
    cells.join('') + '</div></div>' + (reference ? '<p class="calendar-note">Дата используется для поиска. График и период действия указаны в карточках, отправление на выбранную дату не подтверждено.</p>' : pair ? '<p class="calendar-note">Цены «от» за одного взрослого. Цена рейса указана в карточке.</p>' : '<p class="calendar-note">Укажите города, чтобы выбрать направление.</p>') +
    (pair && ['error', 'offline'].includes(activeScenario) ? button('Повторить проверку', 'data-refresh-calendar', 'secondary') : ''), '', 'calendar-sheet');
  return nextMonth;
}

function setDate(value) {
  date = value;
  setSearchDate(value);
  const url = new URL(location.href);
  url.searchParams.set('date', value);
  url.searchParams.delete('step');
  if (url.href !== location.href) history.pushState({ scenario }, '', url);
  refreshResults();
}

const periods = { morning: 'До 12:00', afternoon: '12:00–17:59', evening: 'С 18:00' };
const sortLabels = { price: 'По цене', departure: 'По времени отправления', arrival: 'По времени прибытия' };
const filterGroups = ['fromStation', 'toStation', 'departurePeriod'];
const filterTitles = { sort: 'Сортировать', fromStation: 'Откуда', toStation: 'Куда', departurePeriod: 'Время отправления' };
const periodFor = departure => departure == null ? '' : departure < '12:00' ? 'morning' : departure < '18:00' ? 'afternoon' : 'evening';

function currentTrips() {
  return tripsFor(route, date, scenario === 'offline' ? 'available' : scenario);
}
function filteredTrips(list, active) {
  const matches = (values, value) => !values.length || values.includes(value);
  return list.filter(trip => (!active.available || (trip.seats > 0 && trip.price != null && scenario !== 'offline')) &&
    matches(active.departurePeriod, periodFor(trip.departure)) && matches(active.fromStation, trip.fromStation) && matches(active.toStation, trip.toStation));
}

function resultOptions(group) {
  if (group === 'sort') return Object.entries(sortLabels);
  if (group === 'departurePeriod') return Object.entries(periods);
  const source = isReferenceSchedule(route, scenario) ? '' : 'available';
  const stations = new Set(tripsFor(route, date, source).map(trip => trip[group]));
  const city = cities[group === 'fromStation' ? route.from : route.to].name;
  return [...stations].sort((a, b) => a.localeCompare(b, 'ru')).map(station => [station, source ? station : city + ' · ' + station]);
}

function restoreResultsControls() {
  const query = params();
  scenario = history.state?.scenario || (navigator.onLine || route.hasSchedule ? '' : 'offline');
  if (route.price == null) scenario = '';
  sort = Object.hasOwn(sortLabels, query.get('sort')) ? query.get('sort') : 'price';
  filters = emptyFilters();
  filters.available = query.get('available') === '1';
  for (const group of filterGroups) {
    const selected = query.getAll(group);
    filters[group] = resultOptions(group).map(([value]) => value).filter(value => selected.includes(value));
  }
}

function saveResultsControls({ render = true } = {}) {
  const url = new URL(location.href);
  const query = url.searchParams;
  query.delete('sort');
  query.delete('available');
  if (sort !== 'price') query.set('sort', sort);
  if (filters.available) query.set('available', '1');
  for (const group of filterGroups) {
    query.delete(group);
    for (const value of filters[group]) query.append(group, value);
  }
  if (url.href !== location.href) history.pushState({ scenario }, '', url);
  if (render) refreshResults({ loading: false });
}

function updateResultsControls() {
  for (const control of $$('[data-result-control]', routeView)) {
    const group = control.dataset.resultControl;
    const selected = group === 'sort' ? [sortLabels[sort]] : filters[group].map(value => group === 'departurePeriod' ? periods[value] : value);
    const summary = $('[data-result-value]', control);
    summary.textContent = selected.join(' · ');
    summary.hidden = !selected.length;
    control.toggleAttribute('data-active', group === 'sort' ? sort !== 'price' : selected.length > 0);
  }
  $('[data-available-only]', routeView).checked = filters.available;
  $('.results-filter-status [data-clear-filters]', routeView).hidden = !filters.available && !filterGroups.some(group => filters[group].length);
}
function resultsNote(title, copy, action) {
  return '<div class="panel empty-state"><span class="route-icon">' + icon('bus') + '</span><h3>' + title + '</h3><p>' + copy + '</p>' + action + '</div>';
}

function refreshResults({ loading = true } = {}) {
  if (!route) return;
  clearTimeout(scheduleTimer);
  const reference = isReferenceSchedule(route, scenario);
  $('[data-route-date]').textContent = dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' }) + (reference ? '' : ' · 1 взрослый');
  $('[data-dates-title]').textContent = reference ? 'Дата поездки' : 'Даты и цены';
  $('[data-schedule-copy]').hidden = !reference;
  $('[data-demo-note]').hidden = reference;
  const demoToggle = $('[data-demo-preview]');
  if (demoToggle) demoToggle.textContent = reference ? 'Показать деморейсы' : 'К расписанию перевозчиков';
  $('#trip-heading').textContent = reference ? 'Расписание из документов' : 'Рейсы на ' + dateLabel(date);
  if (!loading) return renderResults();
  resultState = 'loading';
  $('#results-count').textContent = 'Проверяем расписание…';
  $('#trip-list').innerHTML = '<div class="panel loading-state" aria-busy="true"><span class="spinner" aria-hidden="true"></span> Загружаем рейсы</div>';
  scheduleTimer = setTimeout(renderResults, 260);
}
function renderResults() {
  resultState = '';
  const strip = $('[data-date-strip]');
  if (['error', 'offline'].includes(scenario)) {
    strip.innerHTML = dateStrip(route, date, 'price-unknown');
  } else {
    strip.innerHTML = dateStrip(route, date, scenario);
  }
  updateResultsControls();
  const list = $('#trip-list');
  const caption = $('#results-count');
  const trips = currentTrips();
  const visible = sortTrips(filteredTrips(trips, filters), sort);
  renderedTrip = new Map(visible.map(trip => [trip.id, trip]));
  if (isReferenceSchedule(route, scenario)) {
    caption.textContent = 'Вариантов: ' + visible.length + ' · местное время';
    list.innerHTML = visible.length ? visible.map(trip => tripCard(trip, null, false)).join('') :
      resultsNote(filters.available ? 'Продажа по этому расписанию не подтверждена' : 'По фильтрам ничего не найдено',
        'Снимите фильтры, чтобы увидеть справочное расписание.', button('Сбросить фильтры', 'data-clear-filters'));
  } else if (scenario === 'error') {
    caption.textContent = 'Расписание недоступно';
    list.innerHTML = resultsNote('Не удалось загрузить рейсы', 'Проверьте подключение и повторите запрос. Направление и дата сохранены.', button('Повторить', 'data-retry'));
  } else if (!trips.length) {
    caption.textContent = 'На этот день нет отправлений';
    const alternatives = Array.from({ length: 14 }, (_, i) => offsetDate(date, i + 1));
    const next = scenario === 'empty' ? '' : alternatives.find(value => dayPrice(route, value) != null);
    list.innerHTML = resultsNote('Нет рейсов на выбранную дату', 'Посмотрите отправления на другие дни.', next ? button('Рейсы на ' + dateLabel(next), 'data-alternative="' + next + '"') + button('Открыть календарь', 'data-calendar', 'secondary') : button('Открыть календарь', 'data-calendar'));
  } else if (!visible.length) {
    caption.textContent = 'Подходящих рейсов: 0';
    list.innerHTML = resultsNote('По фильтрам ничего не найдено', 'Измените параметры или вернитесь ко всем рейсам.', button('Сбросить фильтры', 'data-clear-filters'));
  } else {
    const minimum = dayPrice(route, date, scenario);
    const allSold = !trips.some(trip => trip.seats);
    const flags = {
      offline: 'Показываем сохранённое расписание. Проверьте наличие и цену после подключения к сети.',
      'price-unknown': 'Цены уточняются. Можно посмотреть расписание или повторить проверку.'
    };
    caption.textContent = 'Рейсов: ' + visible.length + ' · местное время';
    list.innerHTML = (flags[scenario] ? '<div class="notice" role="status">' + flags[scenario] + button('Повторить', 'data-retry', 'secondary') + '</div>' : '') +
      (allSold ? '<div class="notice">На этот день все места проданы. ' + button('Выбрать другую дату', 'data-calendar', 'secondary') + '</div>' : '') +
      visible.map(trip => tripCard(trip, minimum, scenario !== 'offline')).join('');
  }
}

function openResultControl(group) {
  const forSort = group === 'sort';
  const selected = forSort ? [sort] : filters[group];
  const choices = resultOptions(group).map(([value, label]) => `<label class="result-option">
    <input type="${forSort ? 'radio' : 'checkbox'}" name="choice" value="${escapeHTML(value)}"${selected.includes(value) ? ' checked' : ''}>
    <span>${escapeHTML(label)}</span></label>`).join('');
  sheet.open(filterTitles[group], '<form id="result-options" aria-labelledby="sheet-title">' + choices + '</form>',
    (forSort ? '' : button('Сбросить', 'data-reset-result-panel', 'secondary')) + button('Применить', `data-apply-result-control="${group}"`), 'results-sheet');
}

const steps = ['seat', 'passenger', 'review', 'order'];
const stageNames = ['Место', 'Пассажир', 'Проверка', 'Заказ'];
const storageKey = sitePath('tuda-suda-demo-booking');
const profileKey = sitePath('tuda-suda-demo-profile');

function storeBooking() {
  try {
    if (booking) sessionStorage.setItem(storageKey, JSON.stringify(booking));
    else sessionStorage.removeItem(storageKey);
  } catch {
    // The current checkout can continue if storage is unavailable.
  }
}

function loadBooking() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved?.path === location.pathname && saved.date === date &&
        tripsFor(route, date, 'available').some(trip => trip.id === saved.tripId)) {
      if (!Array.isArray(saved.passengers) || !saved.passengers.length) {
        saved.passengers = [{ id: 1, seat: saved.seat ?? null }];
        saved.nextPassengerId = 2;
        delete saved.seat;
      }
      if (saved.passengers.some(person => !Number.isInteger(person?.id) || person.id < 1 ||
          (person.seat !== null && !Number.isInteger(person.seat)))) return null;
      saved.nextPassengerId = Math.max(...saved.passengers.map(person => person.id)) + 1;
      return saved;
    }
  } catch {
    return null;
  }
  return null;
}

function chosenTrip() {
  if (!booking) return null;
  const trip = tripsFor(route, booking.date, 'available').find(item => item.id === booking.tripId);
  return trip && { ...trip, price: booking.price, refundPolicy: booking.refundPolicy ?? trip.refundPolicy };
}

function profileStatus(next) {
  try {
    if (next) sessionStorage.setItem(profileKey, next);
    return sessionStorage.getItem(profileKey);
  } catch {
    return null;
  }
}

function renderProfile() {
  const panel = $('#profile-panel');
  if (!panel) return;
  const status = profileStatus();
  panel.innerHTML = status === 'active'
    ? '<h2>Вы вошли в демопрофиль</h2><p>Доступны пример почты ' + demoContacts.email + ' и тестовый телефон ' + demoContacts.phone + '. При повторном оформлении их можно подставить и отредактировать.</p><a class="text-link" href="' + sitePath('/') + '">Найти рейс</a>' + button('Выйти', 'data-demo-signout', 'secondary')
    : status === 'eligible'
      ? '<p>В предыдущем демозаказе было отмечено согласие. Для проверки повторной покупки войдите в демопрофиль с вымышленными контактами.</p>' + button('Войти в демопрофиль', 'data-demo-signin')
      : '<p>Демопрофиль становится доступен после оформления билета с согласием на сохранение контактов.</p><a class="text-link" href="' + sitePath('/') + '">Найти рейс</a>';
}

function enableDemoProfile() {
  if (booking.profileOffered && !profileStatus()) profileStatus('eligible');
}
function showStep(next, replace = false) {
  const url = new URL(location.href);
  url.searchParams.set('date', date);
  if (next) url.searchParams.set('step', next);
  else url.searchParams.delete('step');
  const state = { ...history.state, sheet: false, previousStep: replace ? history.state?.previousStep : step };
  history[replace ? 'replaceState' : 'pushState'](state, '', url);
  renderStep(next);
}

function startBooking(id) {
  const trip = renderedTrip.get(id);
  if (!trip?.seats || trip.price == null || scenario === 'offline' || !navigator.onLine) {
    if (!navigator.onLine) {
      scenario = 'offline';
      refreshResults({ loading: false });
    }
    return;
  }
  resultsScroll = window.scrollY;
  history.replaceState({ ...history.state, resultsScroll, filters, sort, scenario }, '');
  booking = {
    path: location.pathname, date, tripId: id, scenario, passengers: [{ id: 1, seat: null }], nextPassengerId: 2, lostSeat: null,
    refundPolicy: trip.refundPolicy,
    price: trip.price, originalPrice: trip.price, reserveUntil: 0, orderId: null,
    status: '', returnStatus: '', profileOffered: false
  };
  formDraft = emptyDraft();
  fieldErrors.clear();
  consentError = '';
  storeBooking();
  showStep('seat');
}

function renderStep(next, { keepScroll = false } = {}) {
  if (!route) return;
  const previous = step;
  step = booking && steps.includes(next) ? next : '';
  routeView.hidden = Boolean(step);
  checkoutView.hidden = !step;
  if (!step) {
    if (!keepScroll && previous) {
      requestAnimationFrame(() => {
        const trigger = booking && $('[data-trip="' + booking.tripId + '"]');
        trigger?.focus({ preventScroll: true });
        window.scrollTo(0, history.state?.resultsScroll ?? resultsScroll);
      });
    }
    return;
  }
  const trip = chosenTrip();
  const heading = { seat: trip.seatMap ? 'Выберите место' : 'Место в автобусе', passenger: 'Данные пассажиров', review: 'Проверьте заказ', order: 'Ваш заказ' };
  const back = { seat: 'К рейсам', passenger: 'К выбору места', review: 'К данным пассажира', order: 'К рейсам' };
  const stamp = step === 'order' ? 'Заказ ' + escapeHTML(booking.orderId || '') : titleFor(route) + ' · ' + dateLabel(date);
  const views = { seat: seatView, passenger: passengerView, review: reviewView, order: orderView };
  checkoutView.innerHTML = '<div class="journey-header"><button class="text-link back-link" type="button" data-step-back>' + icon('back') + ' ' + back[step] + '</button><p class="journey-kicker">' + stamp + '</p><h1 id="checkout-heading" tabindex="-1">' + heading[step] + '</h1></div><ol class="stepper" aria-label="Шаги оформления">' +
    stageNames.map((name, i) => '<li class="' + (i <= steps.indexOf(step) ? 'reached' : '') + '"' +
      (steps[i] === step ? ' aria-current="step"' : '') + '><span>' + (i < steps.indexOf(step) ? icon('check') : i + 1) + '</span>' + name + '</li>').join('') +
    '</ol>' + views[step](trip);
  if (step === 'passenger') {
    for (const input of $$('[data-input]', checkoutView)) {
      if (fieldErrors.has(input.id)) setError(input, $('#' + input.id + '-error'), fieldErrors.get(input.id));
    }
  }
  if (step === 'review') highlightConsent(consentError);
  if (!keepScroll) {
    window.scrollTo(0, 0);
    $('#checkout-heading').focus({ preventScroll: true });
  }
  syncReserve();
}

const seatPassenger = () => booking.passengers.find(person => !person.seat) || booking.passengers[0];
const savedDraft = person => formDraft.passengers[person.id] ??= {};
const hasPassengerDraft = () => booking.passengers.every(person => Boolean(savedDraft(person).firstName));

function seatView(trip) {
  const passenger = seatPassenger();
  const free = seatChoices(trip, booking, passenger);
  const grid = Array.from({ length: 20 }, (_, i) => {
    const number = i + 1;
    const taken = !free.includes(number);
    return '<button type="button" class="seat" data-seat="' + number + '" aria-pressed="' + (number === passenger.seat) +
      '" aria-label="Место ' + number + (taken ? ', занято' : '') + '"' + (taken ? ' disabled' : '') + '>' + number + '</button>';
  }).join('');
  const seatInstruction = booking.passengers.length > 1 ? 'Выберите место для пассажира ' + (booking.passengers.indexOf(passenger) + 1) + '.' : 'Выберите свободное место на схеме.';
  const layout = trip.seatMap ? '<p>' + seatInstruction + '</p><div class="bus-layout"><div class="bus-front">' + icon('bus') + '<span>Перед автобуса</span></div><div class="seat-grid">' + grid + '</div></div><div class="seat-legend"><span>Свободно</span><span>Занято</span><span>Выбрано</span></div>' :
    '<p>Место назначит перевозчик. Его номер появится в билете после оформления.</p>';
  return '<div class="checkout-grid"><section class="panel">' +
    (booking.lostSeat ? '<div class="notice" role="status">Место ' + booking.lostSeat + ' уже занято. Выберите другое.</div>' : '') +
    (booking.status === 'expired' ? '<div class="notice" role="status">Срок резерва истёк. Выберите место и подтвердите его снова.</div>' : '') +
    layout + '</section>' + summaryPanel(trip, button('Продолжить<span class="seat-total"> · ' + priceText(totalFor(booking)) + '</span>', 'data-reserve' + (!hasAllSeats(trip, booking) ? ' disabled' : ''))) + '</div>';
}

function passengerView(trip) {
  const addAvailable = canAddPassenger(trip, booking);
  const cards = booking.passengers.map((person, index) => passengerCard(trip, booking, person, index, savedDraft(person))).join('');
  return '<div class="checkout-grid"><form id="passenger-form" class="form-stack" novalidate>' +
    '<div class="notice">Используйте вымышленные данные. ' + button('Заполнить примером', 'data-fill-demo', 'secondary') + '</div>' +
    (booking.wasReloaded ? '<p class="notice">После обновления нужно заново заполнить личные данные. Рейс и выбранные места сохранены в этой вкладке.</p>' : '') +
    (booking.status === 'expired' ? '<div class="notice" role="status">Срок резерва истёк. Данные анкеты сохранены. ' + button('Вернуться к месту', 'data-renew-seat', 'secondary') + '</div>' : '') +
    '<p class="field-hint">Поля со звёздочкой обязательны. Демооформление доступно для взрослых пассажиров.</p>' + cards +
    button('Добавить пассажира', 'data-add-passenger' + (addAvailable ? '' : ' disabled'), 'secondary full') +
    (addAvailable ? '' : '<p class="field-hint" role="status">Все доступные места на этом рейсе выбраны.</p>') +
    '<section class="panel"><h2>Контакты покупателя</h2><div class="form-stack">' +
    (profileStatus() === 'active' ? button('Подставить контакты из демопрофиля', 'data-fill-profile', 'secondary') : '') +
    inputField('email', formDraft) + inputField('phone', formDraft) + '<label class="checkbox"><input type="checkbox" name="saveProfile"' + (formDraft.saveProfile ? ' checked' : '') + '><span>Сохранить почту и телефон для следующей покупки</span></label>' +
    documentButton('profile', 'Согласие на сохранение контактов') + '</div></section>' +
    '<button type="submit" class="button primary full">Проверить заказ</button></form>' + summaryPanel(trip) + '</div>';
}

function summaryPanel(trip, action = '') {
  const total = totalFor(booking);
  const fee = 190 * booking.passengers.length;
  return '<aside class="panel summary-panel"><h2>Ваша поездка</h2>' + timeLine(trip) +
    '<p class="field-hint">' + escapeHTML(trip.carrier.name) + ' · <span data-selected-seats>' + seatSummary(trip) + '</span></p>' +
    '<dl class="price-list"><div><dt>Билеты · ' + peopleLabel(booking.passengers.length) + '</dt><dd>' + priceText(total - fee) + '</dd></div><div><dt>Сервисный сбор</dt><dd>' + priceText(fee) + '</dd></div><div class="price-total"><dt>Итого</dt><dd>' + priceText(total) + '</dd></div></dl>' +
    '<p class="field-hint">Сбор включён. Багаж оплачивается при посадке.</p>' +
    (booking.reserveUntil && !booking.status ? '<p class="reserve-line">' + icon('clock') + ' <span data-reserve-time>Уточняем срок резерва</span></p>' : '') +
    '<div class="doc-links">' + documentButton('bag', 'Ограничения перевозки багажа') + '<button type="button" class="text-link doc-link" data-booking-refund>Условия возврата</button>' + documentButton('purchase', 'Условия покупки электронных билетов') + '</div>' +
    (action ? '<div class="summary-action">' + action + '</div>' : '') + '</aside>';
}

function seatSummary(trip) {
  if (!trip.seatMap) return 'Места назначит перевозчик';
  const seats = booking.passengers.map(person => person.seat).filter(Boolean);
  if (!seats.length) return 'Место ещё не выбрано';
  return (seats.length === 1 ? 'Место ' : 'Места ') + seats.join(', ');
}

function reviewView(trip) {
  const fareChanged = booking.price !== booking.originalPrice && !booking.acceptedPrice;
  const people = booking.passengers.map((person, index) => {
    const draft = savedDraft(person);
    const fullname = [draft.lastName, draft.firstName, draft.middleName].filter(Boolean).join(' ');
    return '<div class="review-person"><h3>Пассажир ' + (index + 1) + '</h3><dl class="data-list"><div><dt>ФИО</dt><dd>' + escapeHTML(fullname) +
      '</dd></div><div><dt>Дата рождения</dt><dd>' + escapeHTML(draft.birth || '') + '</dd></div><div><dt>Пол</dt><dd>' + (genders[draft.gender] || '') +
      '</dd></div><div><dt>Документ</dt><dd>' + documentsByType[draft.documentType || 'passport'].name + ' · •••• ' + escapeHTML((draft.documentNumber || '').slice(-4)) +
      '</dd></div><div><dt>Место</dt><dd>' + (person.seat || 'Назначит перевозчик') + '</dd></div></dl></div>';
  }).join('');
  const traveller = '<section class="panel review-passenger"><div class="inline-head"><h2>Пассажиры и контакты</h2><button type="button" class="text-link" data-edit-passenger>Изменить</button></div>' +
    people + '<dl class="data-list"><div><dt>Электронная почта</dt><dd>' + escapeHTML(formDraft.email || '') + '</dd></div><div><dt>Телефон</dt><dd>' + escapeHTML(formDraft.phone || '') + '</dd></div></dl></section>';
  const payment = '<section class="panel form-stack review-payment"><h2>Оплата</h2><div class="pay-method">' + icon('card') + ' Демооплата картой</div><p class="field-hint">Тестовый платёж. Реквизиты карты вводить не нужно.</p>' +
    '<fieldset id="purchase-consent" class="purchase-consent"><legend class="sr-only">Согласие на покупку</legend><div class="consent-row"><input type="checkbox" id="purchase-agree"' + (formDraft.purchaseAgree ? ' checked' : '') + ' aria-describedby="purchase-error"><div><label for="purchase-agree">Принимаю условия покупки</label>' +
    documentButton('purchase', 'Условия покупки электронных билетов') + '</div></div><p class="error" id="purchase-error" hidden></p></fieldset>' +
    (fareChanged ? '<div class="notice" role="status">Цена изменилась: <del>' + priceText(totalFor(booking, booking.originalPrice)) + '</del> → <strong>' + priceText(totalFor(booking)) + '</strong>. ' +
      button('Принять новую цену', 'data-accept-price', 'secondary') + '</div>' : '') +
    (booking.status === 'expired' ? '<div class="notice" role="status">Срок резерва истёк. Подтвердите место заново. ' + button('Вернуться к месту', 'data-renew-seat', 'secondary') + '</div>' : '') +
    '<p class="error" data-pay-error hidden></p>' +
    button('Оплатить ' + rub(totalFor(booking)), 'data-pay' + (fareChanged || booking.status === 'expired' ? ' disabled' : '')) + '</section>';
  return '<div class="checkout-grid review-grid">' + traveller + summaryPanel(trip) + payment + '</div>';
}
function orderView(trip) {
  const single = booking.passengers.length === 1;
  const stage = {
    processing: ['Проверяем оплату', 'Запрос принят. Статус платежа обновится в этом заказе.', ''],
    pending: ['Проверяем оплату', 'Исход операции уточняется. Можно повторить проверку статуса в этом же заказе.', button('Проверить статус', 'data-check-status', 'secondary')],
    issuing: ['Билет оформляется', 'Демооплата подтверждена. Проверяем выдачу билета.', button('Обновить статус', 'data-check-status', 'secondary')],
    declined: ['Оплата отклонена', 'В демосценарии платёж не прошёл. Повторить оплату можно из проверки заказа.', button('Вернуться к оплате', 'data-retry-payment', 'secondary')],
    issued: [single ? 'Билет оформлен' : 'Билеты оформлены', 'Детали демонстрационной поездки доступны ниже.', button(single ? 'Открыть билет' : 'Открыть билеты', 'data-ticket')]
  }[booking.status] || ['Заказ сохранён', 'Статус можно проверить здесь.', button('Проверить статус', 'data-check-status', 'secondary')];
  const refund = booking.status !== 'issued' ? '' :
    '<section class="panel form-stack"><h2>Возврат</h2>' + (booking.returnStatus ?
      '<p role="status">' + (booking.returnStatus === 'complete' ? 'Тестовый возврат подтверждён · ' + priceText(booking.refundQuote?.refund ?? totalFor(booking)) : 'Тестовый запрос на возврат в обработке') + '</p>' +
      (booking.returnStatus !== 'complete' ? button('Проверить возврат', 'data-check-refund', 'secondary') : '') :
      '<p>Посмотрите условия для этого билета и тестовый расчёт.</p>' + button('Рассчитать возврат', 'data-refund', 'secondary')) + '</section>';
  const profile = booking.status === 'issued' && booking.profileOffered ? '<a href="' + sitePath('/profil/') + '" class="text-link">Открыть демопрофиль</a>' : '';
  return '<div class="checkout-grid"><div class="form-stack"><section class="panel form-stack order-status"><span class="route-icon">' + icon(booking.status === 'issued' ? 'check' : 'ticket') + '</span><h2>' + stage[0] + '</h2><p>' +
    stage[1] + '</p>' + stage[2] + '<a href="' + sitePath('/pomosh/vozvrat/') + '" class="text-link">Справка по заказу</a>' + profile + '</section>' + refund + '</div>' + summaryPanel(trip) + '</div>';
}

function passengerFor(control) {
  const id = Number(control.closest('[data-passenger]')?.dataset.passenger);
  return booking.passengers.find(person => person.id === id);
}

function setFieldError(input, message) {
  setError(input, $('#' + input.id + '-error'), message);
  if (message) fieldErrors.set(input.id, message);
  else fieldErrors.delete(input.id);
}

function checkField(input) {
  const key = input.dataset.input;
  const passenger = passengerFor(input);
  const draft = passenger ? savedDraft(passenger) : formDraft;
  const value = input.dataset.passengerSelect ? selectedOption(key, draft, passenger) : input.value.trim();
  const message = validationMessage(key, value, draft, date);
  setFieldError(input, message);
  return !message;
}

function verifyPassenger(event) {
  event.preventDefault();
  if (booking.status === 'expired' || !hasAllSeats(chosenTrip(), booking)) return showStep('seat', true);
  const invalid = $$('[data-input]', event.target).filter(input => !checkField(input));
  if (invalid.length) return invalid[0].focus();
  booking.wasReloaded = false;
  if (booking.scenario === 'repriced' && booking.price === booking.originalPrice) {
    booking.price += 240;
  }
  storeBooking();
  showStep('review');
}

function highlightConsent(message) {
  consentError = message;
  const control = $('#purchase-agree');
  setError(control, $('#purchase-error'), message);
  if (message) $('#purchase-consent').dataset.invalid = 'true';
  else delete $('#purchase-consent').dataset.invalid;
}

function updatePassengers(focusId) {
  storeBooking();
  renderStep('passenger', { keepScroll: true });
  const target = document.getElementById(focusId);
  (target || $('[data-add-passenger]')).focus();
}

function addPassenger() {
  const trip = chosenTrip();
  if (!canAddPassenger(trip, booking)) return;
  const person = { id: booking.nextPassengerId++, seat: trip.seatMap ? seatChoices(trip, booking)[0] : null };
  booking.passengers.push(person);
  updatePassengers(fieldId('lastName', person));
}

function removePassenger(control) {
  const person = passengerFor(control);
  const index = booking.passengers.indexOf(person);
  if (index < 1) return;
  for (const input of $$('[data-input]', control.closest('[data-passenger]'))) fieldErrors.delete(input.id);
  booking.passengers.splice(index, 1);
  delete formDraft.passengers[person.id];
  const adjacent = booking.passengers[Math.min(index, booking.passengers.length - 1)];
  updatePassengers(fieldId('lastName', adjacent));
}

function openPassengerOptions(control) {
  const person = passengerFor(control);
  const draft = savedDraft(person);
  const key = control.dataset.passengerSelect;
  const trip = chosenTrip();
  const selected = selectedOption(key, draft, person);
  const title = { gender: 'Пол пассажира', documentType: 'Документ пассажира', seat: 'Место пассажира' }[key];
  const choices = selectOptions(key, trip, booking, person).map(([value, label]) =>
    '<button type="button" class="option-choice" data-passenger-choice="' + value + '" aria-pressed="' + (selected === value) + '">' +
    '<span>' + label + '</span>' + (selected === value ? icon('check') : '') + '</button>').join('');
  sheet.open(title, '<div class="option-list">' + choices + '</div>', '', 'option-sheet');
  const buttons = $$('[data-passenger-choice]', dialog);
  (buttons.find(option => option.dataset.passengerChoice === selected) || buttons[0])?.focus();
}

function changePassengerOption(value) {
  const trigger = returnFocus;
  const person = passengerFor(trigger);
  const key = trigger.dataset.passengerSelect;
  const draft = savedDraft(person);
  if (!selectOptions(key, chosenTrip(), booking, person).some(([option]) => option === value)) return;
  sheet.close(() => {
    if (key === 'seat') person.seat = Number(value);
    else {
      if (key === 'documentType' && value !== selectedOption(key, draft, person)) {
        draft.documentNumber = '';
        fieldErrors.delete(fieldId('documentNumber', person));
      }
      draft[key] = value;
    }
    fieldErrors.delete(trigger.id);
    updatePassengers(trigger.id);
  });
}

let refundQuotePreview;
function openRefundQuote() {
  const trip = chosenTrip();
  refundQuotePreview = refundFor(trip, totalFor(booking));
  const { withholding, refund, available } = refundQuotePreview;
  const totals = '<dl class="price-list"><div><dt>Удержание</dt><dd>' + priceText(withholding) +
    '</dd></div><div class="price-total"><dt>К возврату</dt><dd>' + priceText(refund) + '</dd></div></dl>';
  sheet.open('Расчёт возврата', tripRefundDetails(trip, null) + totals +
    (available ? '' : '<p class="notice">Срок возврата по демотарифу истёк.</p>'),
    available ? button('Подтвердить возврат', 'data-confirm-refund') : '', 'document-sheet');
}

let reserveClock;
function syncReserve() {
  clearInterval(reserveClock);
  if (!booking?.reserveUntil || !step || booking.status) return;
  const update = () => {
    const label = $('[data-reserve-time]', checkoutView);
    const remaining = Math.ceil((booking.reserveUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      booking.status = 'expired';
      booking.reserveUntil = 0;
      storeBooking();
      renderStep(step, { keepScroll: true });
    } else if (label) {
      const time = Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
      label.textContent = 'Резерв места · ' + time;
    }
  };
  reserveClock = setInterval(update, 1000);
  update();
}

function reserveSeat() {
  const trip = chosenTrip();
  if (!hasAllSeats(trip, booking)) return;
  if (!navigator.onLine) return sheet.open('Нет связи', '<p>Проверьте подключение и повторите резерв. Выбранное место и данные останутся в оформлении.</p>');
  if (booking.scenario === 'seat-lost' && !booking.lostSeat && trip.seatMap) {
    const person = seatPassenger();
    booking.lostSeat = person.seat;
    person.seat = null;
    storeBooking();
    return renderStep('seat', { keepScroll: true });
  }
  booking.status = '';
  booking.reserveUntil = Date.now() + (booking.scenario === 'expired' && !booking.didExpire ? 12 : 480) * 1000;
  if (booking.scenario === 'expired') booking.didExpire = true;
  formDraft.purchaseAgree = false;
  consentError = '';
  storeBooking();
  showStep('passenger');
}

let paymentTimer;
function beginPayment() {
  if (!booking || booking.status || !booking.reserveUntil || Date.now() >= booking.reserveUntil) return;
  const payError = $('[data-pay-error]');
  if (!navigator.onLine) {
    payError.textContent = 'Нет связи. Проверьте подключение и повторите.';
    payError.hidden = false;
    return;
  }
  if (booking.price !== booking.originalPrice && !booking.acceptedPrice) return;
  if (!hasAllSeats(chosenTrip(), booking)) return showStep('seat', true);
  const agreement = $('#purchase-agree');
  if (!formDraft.purchaseAgree) {
    highlightConsent('Подтвердите согласие, чтобы перейти к оплате.');
    return agreement.focus();
  }
  booking.status = 'processing';
  booking.orderId ||= 'ТС‑' + String(Math.floor(Math.random() * 900000 + 100000));
  booking.profileOffered = Boolean(formDraft.saveProfile);
  storeBooking();
  showStep('order', true);
  waitForPayment();
}

function waitForPayment() {
  clearTimeout(paymentTimer);
  paymentTimer = setTimeout(() => {
    if (!booking || booking.status !== 'processing') return;
    const states = { pending: 'pending', declined: 'declined', issuing: 'issuing' };
    booking.status = states[booking.scenario] || 'issued';
    if (booking.retried && booking.status === 'declined') booking.status = 'issued';
    if (booking.status === 'issued') enableDemoProfile();
    storeBooking();
    if (step === 'order') renderStep('order', { keepScroll: true });
  }, 1100);
}

checkoutView?.addEventListener('input', event => {
  const input = event.target;
  if (input.matches('input[data-input]')) {
    const passenger = passengerFor(input);
    const draft = passenger ? savedDraft(passenger) : formDraft;
    draft[input.dataset.input] = input.value.trim();
    if (input.getAttribute('aria-invalid') === 'true') checkField(input);
  }
});
checkoutView?.addEventListener('focusout', event => {
  if (event.target.matches('input[data-input]') && event.target.value.trim()) checkField(event.target);
});
checkoutView?.addEventListener('change', event => {
  const input = event.target;
  if (input.name === 'saveProfile') formDraft.saveProfile = input.checked;
  else if (input.id === 'purchase-agree') {
    formDraft.purchaseAgree = input.checked;
    if (input.checked) highlightConsent('');
  }
});
checkoutView?.addEventListener('submit', event => {
  if (event.target.id === 'passenger-form') verifyPassenger(event);
});

function restoreFromURL({ initialLoad = false } = {}) {
  if (!route) return;
  const requestedDate = params().get('date');
  const currentDay = today();
  const defaultDate = routeView.dataset.date >= currentDay ? routeView.dataset.date : currentDay;
  const restoredDate = validDate(requestedDate) && requestedDate >= currentDay ? requestedDate : defaultDate;
  const next = params().get('step');
  restoreResultsControls();
  $('#demo-scenario').value = scenario;
  if (restoredDate !== date || initialLoad || !next) {
    date = restoredDate;
    setSearchDate(date);
    refreshResults({ loading: false });
  }
  if (next) {
    if (initialLoad) {
      booking = loadBooking();
      if (!booking) return showStep('', true);
      booking.wasReloaded = true;
    }
    if (!booking) return showStep('', true);
    let target = next;
    if (booking.orderId && ['processing', 'pending', 'issuing', 'issued'].includes(booking.status)) {
      if (!initialLoad && next !== 'order') return showStep('', true);
      target = 'order';
    }
    else if (next === 'review' && !hasPassengerDraft()) target = 'passenger';
    if (!steps.includes(target) || (target === 'order' && !booking.orderId)) return showStep('', true);
    if (target !== next) showStep(target, true);
    else renderStep(target);
    if (booking.status === 'processing') waitForPayment();
  } else {
    renderStep('', { keepScroll: initialLoad });
  }
}
history.scrollRestoration = 'manual';
window.addEventListener('popstate', () => {
  if (dialog.open) {
    sheet.hide();
    stagedClose?.();
    stagedClose = null;
    return;
  }
  restoreFromURL();
});
window.addEventListener('offline', () => {
  if (!route || step || isReferenceSchedule(route, scenario)) return;
  scenario = 'offline';
  $('#demo-scenario').value = scenario;
  refreshResults({ loading: false });
});

function applyScenario(value) {
  scenario = value;
  history.replaceState({ ...history.state, scenario: value }, '');
  $('#demo-scenario').value = value;
  for (const group of ['fromStation', 'toStation']) {
    const allowed = resultOptions(group).map(([station]) => station);
    filters[group] = filters[group].filter(station => allowed.includes(station));
  }
  saveResultsControls({ render: false });
  refreshResults();
}

document.addEventListener('click', event => {
  const control = event.target.closest('button, [data-day]');
  if (!control || control.disabled) return;
  const data = control.dataset;
  if ('menu' in data) sheet.open('Меню', '<nav class="menu-links" aria-label="Основная навигация">' + navLinks + '</nav>');
  else if ('close' in data) sheet.close();
  else if ('support' in data) {
    control.focus({ preventScroll: true });
    sheet.open('Связаться', supportChannels(), '', 'support-sheet');
  }
  else if ('tripRefund' in data) {
    const trip = step && booking ? chosenTrip() : renderedTrip.get(data.tripRefund);
    if (trip) sheet.open('Условия возврата', tripRefundDetails(trip), '', 'document-sheet');
  }
  else if ('doc' in data) {
    const [title, sections] = documents[data.doc];
    sheet.open(title, '<p class="field-hint">Условия демонстрационного заказа</p>' + sections.map(([heading, body]) => '<section class="document-section"><h3>' + heading + '</h3><p>' + body + '</p></section>').join(''), '', 'document-sheet');
  } else if ('swap' in data) {
    const [a, b] = cityFields;
    [a.value, b.value] = [b.value, a.value];
    [a.dataset.city, b.dataset.city] = [b.dataset.city, a.dataset.city];
    cityFields.forEach(field => setError(field, $('#' + field.id + '-error'), ''));
  } else if ('offset' in data) setSearchDate(offsetDate(today(), Number(data.offset)));
  else if ('calendar' in data) openCalendar(Boolean(control.closest('form')));
  else if ('month' in data) {
    const change = new Date(calendarMonth.slice(0, 7) + '-01T12:00:00Z');
    change.setUTCMonth(change.getUTCMonth() + Number(data.month));
    calendarMonth = change.toISOString().slice(0, 10);
    renderCalendar();
    const newControl = $('[data-month="' + data.month + '"]', dialog);
    if (!newControl.disabled) newControl.focus();
  } else if ('pickDate' in data) sheet.close(() => calendarForResults ? setDate(data.pickDate) : setSearchDate(data.pickDate));
  else if ('day' in data) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setDate(data.day);
    requestAnimationFrame(() => $('[data-day="' + data.day + '"]')?.focus({ preventScroll: true }));
  } else if ('alternative' in data) setDate(data.alternative);
  else if ('editSearch' in data) {
    const inline = $('#route-search');
    inline.hidden = !inline.hidden;
    control.setAttribute('aria-expanded', String(!inline.hidden));
    if (!inline.hidden) $('#from').focus();
  } else if ('demoPreview' in data) applyScenario(isReferenceSchedule(route, scenario) ? 'available' : '');
  else if ('retry' in data) applyScenario(navigator.onLine ? 'available' : 'offline');
  else if ('refreshCalendar' in data) {
    if (navigator.onLine) applyScenario('');
    renderCalendar();
    setTimeout(() => { if (dialog.open && $('.calendar-nav', dialog)) renderCalendar(); }, 300);
  } else if ('resultControl' in data) openResultControl(data.resultControl);
  else if ('resetResultPanel' in data) {
    $$('input[type="checkbox"]', $('#result-options')).forEach(input => { input.checked = false; });
  } else if ('applyResultControl' in data) {
    const group = data.applyResultControl;
    const selected = new FormData($('#result-options')).getAll('choice');
    control.disabled = true;
    sheet.close(() => {
      if (group === 'sort') sort = selected[0];
      else filters[group] = selected;
      saveResultsControls();
    });
  } else if ('clearFilters' in data) {
    filters = emptyFilters();
    saveResultsControls();
    $('[data-available-only]', routeView).focus({ preventScroll: true });
  } else if ('trip' in data) startBooking(data.trip);
  else if ('seat' in data) {
    const trip = chosenTrip();
    const person = seatPassenger();
    const seat = Number(data.seat);
    if (!seatChoices(trip, booking, person).includes(seat)) return;
    person.seat = seat;
    $$('[data-seat]', checkoutView).forEach(el => el.setAttribute('aria-pressed', String(el === control)));
    $('[data-reserve]').disabled = !hasAllSeats(trip, booking);
    $('[data-selected-seats]', checkoutView).textContent = seatSummary(trip);
    storeBooking();
  } else if ('reserve' in data) reserveSeat();
  else if ('addPassenger' in data) addPassenger();
  else if ('removePassenger' in data) removePassenger(control);
  else if ('passengerSelect' in data) openPassengerOptions(control);
  else if ('passengerChoice' in data) {
    control.disabled = true;
    changePassengerOption(data.passengerChoice);
  }
  else if ('demoSignin' in data || 'demoSignout' in data) {
    profileStatus('demoSignin' in data ? 'active' : 'eligible');
    renderProfile();
    $('#profile-panel').setAttribute('tabindex', '-1');
    $('#profile-panel').focus();
  } else if ('fillProfile' in data) {
    for (const [key, value] of Object.entries(demoContacts)) {
      formDraft[key] = value;
      $('#' + key).value = formDraft[key];
      checkField($('#' + key));
    }
    $('#email').focus();
  } else if ('fillDemo' in data) {
    booking.passengers.forEach((person, index) => Object.assign(savedDraft(person), examplePassenger(index)));
    Object.assign(formDraft, demoContacts);
    fieldErrors.clear();
    renderStep('passenger', { keepScroll: true });
    $('#lastName').focus({ preventScroll: true });
  } else if ('stepBack' in data) {
    const previous = { seat: '', passenger: 'seat', review: 'passenger', order: '' }[step];
    if (history.state?.previousStep === previous) history.back();
    else showStep(previous, true);
  } else if ('editPassenger' in data) {
    if (history.state?.previousStep === 'passenger') history.back();
    else showStep('passenger', true);
  }
  else if ('renewSeat' in data) showStep('seat', true);
  else if ('acceptPrice' in data) {
    booking.acceptedPrice = true;
    storeBooking();
    renderStep('review', { keepScroll: true });
    $('[data-pay]').focus();
  } else if ('pay' in data) beginPayment();
  else if ('checkStatus' in data) {
    booking.status = booking.status === 'pending' ? 'issuing' : 'issued';
    if (booking.status === 'issued') enableDemoProfile();
    storeBooking();
    renderStep('order', { keepScroll: true });
    $('.order-status h2').setAttribute('tabindex', '-1');
    $('.order-status h2').focus({ preventScroll: true });
  } else if ('retryPayment' in data) {
    booking.retried = true;
    booking.status = '';
    storeBooking();
    showStep(booking.reserveUntil > Date.now() && hasPassengerDraft() ? 'review' : 'seat', true);
  } else if ('ticket' in data) {
    const ticket = chosenTrip();
    const title = booking.passengers.length === 1 ? 'Демонстрационный билет' : 'Демонстрационные билеты';
    sheet.open(title, '<p>Заказ ' + escapeHTML(booking.orderId) + ' · ' + peopleLabel(booking.passengers.length) + '</p><p>' + seatSummary(ticket) + '</p>' +
      tripDetails(ticket, { includeCarrier: true, refundTotal: null }), '', 'document-sheet');
  } else if ('bookingRefund' in data) {
    sheet.open('Условия возврата', tripRefundDetails(chosenTrip(), null), '', 'document-sheet');
  } else if ('refund' in data) {
    openRefundQuote();
  } else if ('confirmRefund' in data) {
    const freshQuote = refundFor(chosenTrip(), totalFor(booking));
    if (!freshQuote.available || freshQuote.refund !== refundQuotePreview?.refund) return openRefundQuote();
    booking.refundQuote = freshQuote;
    booking.returnStatus = 'pending';
    storeBooking();
    sheet.close(() => renderStep('order', { keepScroll: true }));
  } else if ('checkRefund' in data) {
    booking.returnStatus = 'complete';
    storeBooking();
    renderStep('order', { keepScroll: true });
  }
});

$('[data-available-only]')?.addEventListener('change', event => {
  filters.available = event.target.checked;
  saveResultsControls();
});
$('#demo-scenario')?.addEventListener('change', event => applyScenario(event.target.value));
if (history.state?.sheet) history.replaceState({ ...history.state, sheet: false }, '');
restoreFromURL({ initialLoad: true });
renderProfile();
