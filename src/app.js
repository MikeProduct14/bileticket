import { cities, routePath, routesByPath, sitePath, today, offsetDate, dateLabel, validDate, rub, tripsFor, dayPrice, demoCarrier } from './data.js';
import { icon, titleFor, escapeHTML, navLinks, documentButton, tripCard, tripDetails, timeLine, dateStrip } from './views.js';

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

const route = routesByPath[location.pathname];
const routeView = $('#route-view');
const checkoutView = $('#checkout');
const search = $('#search-form');
const params = () => new URLSearchParams(location.search);
let date = routeView?.dataset.date || '';
const initial = params().get('date');
if (route && validDate(initial) && initial >= today()) date = initial;
let filters = { available: false, period: '', from: '', to: '' };
let sort = 'departure';
let scenario = '';
let searching = false;
let resultsScroll = 0;
let scheduleTimer;
let resultState = '';
let step = '';
let booking;
let formDraft = {};
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
  const choices = Object.entries(cities).filter(([, city]) => normalize(city.name).includes(query));
  const list = $('#' + input.id + '-options');
  list.innerHTML = choices.map(([id, city]) => '<div id="' + input.id + '-opt-' + id + '" role="option" aria-selected="false" data-city-choice="' + id + '"><strong>' + city.name + '</strong><small>' + city.region + '</small></div>').join('') ||
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
  return routesByPath[routePath(from, to)];
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
  const message = !destination ? 'Для этой пары городов нет демомаршрута. Выберите направление через Ставрополь.' :
    !navigator.onLine ? 'Нет связи. Проверьте подключение и повторите поиск.' : '';
  error.textContent = message;
  error.hidden = !message;
  if (message) return;
  const submit = $('[type=submit]', search);
  searching = true;
  submit.disabled = true;
  submit.textContent = 'Ищем рейсы…';
  if (destination === route) {
    setTimeout(() => {
      searching = false;
      submit.disabled = false;
      submit.innerHTML = icon('search') + ' Найти рейсы';
      $('#route-search').hidden = true;
      setDate(searchDate);
    }, 220);
  } else {
    const href = routePath(destination.from, destination.to) + '?date=' + searchDate;
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
  const cells = Array.from({ length: offset }, () => '<span></span>');
  for (let i = 0; i < days; i++) {
    const value = offsetDate(first, i);
    const price = dayPrice(pair, value, activeScenario);
    const trips = tripsFor(pair, value, activeScenario);
    const disabled = value < currentDay;
    let status = '';
    if (pair && !disabled) {
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
    cells.join('') + '</div></div>' + (pair ? '<p class="calendar-note">Цены «от» за одного взрослого. Цена рейса указана в карточке.</p>' : '<p class="calendar-note">Укажите города, чтобы увидеть цены на даты.</p>') +
    (pair && ['error', 'offline'].includes(activeScenario) ? button('Повторить проверку', 'data-refresh-calendar', 'secondary') : ''), '', 'calendar-sheet');
  return nextMonth;
}

function setDate(value) {
  date = value;
  setSearchDate(value);
  const url = new URL(location.href);
  url.searchParams.set('date', value);
  url.searchParams.delete('step');
  if (url.href !== location.href) history.pushState({}, '', url);
  refreshResults();
}

const periods = { morning: 'До 12:00', afternoon: '12:00–17:59', evening: 'С 18:00' };
const periodMatches = (departure, period) => !period ||
  (period === 'morning' && departure < '12:00') ||
  (period === 'afternoon' && departure >= '12:00' && departure < '18:00') ||
  (period === 'evening' && departure >= '18:00');

function currentTrips() {
  return tripsFor(route, date, scenario === 'offline' ? 'available' : scenario);
}
function filteredTrips(list, active) {
  return list.filter(trip => (!active.available || (trip.seats > 0 && trip.price != null)) &&
    periodMatches(trip.departure, active.period) && (!active.from || trip.fromStation === active.from) && (!active.to || trip.toStation === active.to));
}
function sortTrips(list) {
  return [...list].sort((a, b) => {
    const tie = a.departure.localeCompare(b.departure);
    if (sort === 'price') return (a.price ?? Infinity) - (b.price ?? Infinity) || tie;
    return sort === 'duration' ? a.duration - b.duration || tie : tie;
  });
}
function resultsNote(title, copy, action) {
  return '<div class="panel empty-state"><span class="route-icon">' + icon('bus') + '</span><h3>' + title + '</h3><p>' + copy + '</p>' + action + '</div>';
}

function refreshResults({ loading = true } = {}) {
  if (!route) return;
  clearTimeout(scheduleTimer);
  $('[data-route-date]').textContent = dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · 1 взрослый';
  $('#trip-heading').textContent = 'Рейсы на ' + dateLabel(date);
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
  const labels = [filters.available && 'Только с билетами', periods[filters.period], filters.from, filters.to].filter(Boolean);
  const count = $('[data-filter-count]');
  count.hidden = !labels.length;
  count.textContent = labels.length;
  const active = $('[data-active-filters]');
  active.hidden = !labels.length;
  active.innerHTML = labels.map(label => '<span>' + escapeHTML(label) + '</span>').join('') + (labels.length ? '<button class="text-link" type="button" data-clear-filters>Сбросить</button>' : '');
  const list = $('#trip-list');
  const caption = $('#results-count');
  const trips = currentTrips();
  const visible = sortTrips(filteredTrips(trips, filters));
  renderedTrip = new Map(visible.map(trip => [trip.id, trip]));
  if (scenario === 'error') {
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

function openFilters() {
  const stations = key => [...new Set(currentTrips().map(trip => trip[key]))];
  const select = (name, label, options) => '<label class="field">' + label + '<select name="' + name + '"><option value="">Любой вариант</option>' +
    options.map(([value, text]) => '<option value="' + escapeHTML(value) + '"' + (filters[name] === value ? ' selected' : '') + '>' + escapeHTML(text) + '</option>').join('') + '</select></label>';
  sheet.open('Фильтры', '<form id="filter-form" class="form-stack"><label class="checkbox"><input type="checkbox" name="available"' + (filters.available ? ' checked' : '') + '> <span>Только рейсы с билетами</span></label>' +
    select('period', 'Время отправления', Object.entries(periods)) +
    (stations('fromStation').length > 1 ? select('from', 'Пункт посадки', stations('fromStation').map(value => [value, value])) : '') +
    (stations('toStation').length > 1 ? select('to', 'Пункт высадки', stations('toStation').map(value => [value, value])) : '') +
    '</form>', button('Сбросить', 'data-reset-stage', 'secondary') + button('Показать рейсы', 'data-apply-filters'), 'filter-sheet');
  updateFilterCount();
}
function draftFilters() {
  const data = new FormData($('#filter-form'));
  return { available: data.has('available'), period: data.get('period') || '', from: data.get('from') || '', to: data.get('to') || '' };
}
function updateFilterCount() {
  $('[data-apply-filters]', dialog).textContent = 'Показать рейсы (' + filteredTrips(currentTrips(), draftFilters()).length + ')';
}
dialog.addEventListener('change', event => {
  if (event.target.closest('#filter-form')) updateFilterCount();
});

const steps = ['seat', 'passenger', 'review', 'order'];
const stageNames = ['Место', 'Пассажир', 'Проверка', 'Заказ'];
const storageKey = sitePath('tuda-suda-demo-booking');
const profileKey = sitePath('tuda-suda-demo-profile');
const documentsByType = {
  passport: { name: 'Паспорт РФ', hint: 'Например, 0102 003456', pattern: /^\d{4}\s?\d{6}$/, inputMode: 'numeric' },
  foreign: { name: 'Иностранный паспорт', hint: 'Например, A00123456', pattern: /^[A-Z0-9]{5,16}$/i, inputMode: 'text' }
};
const namePattern = /^\p{L}+(?:[ '’\-]\p{L}+)*$/u;
const demoFields = { lastName: 'Примеров', firstName: 'Иван', middleName: 'Иванович', birth: '17.06.1990', documentType: 'passport', documentNumber: '0102 003456', email: 'passenger@example.com', phone: '+7 900 000-00-00' };
const fields = {
  lastName: ['Фамилия', 'Как в документе'],
  firstName: ['Имя', 'Как в документе'],
  middleName: ['Отчество', '', 'text', 'text', '', false],
  birth: ['Дата рождения', 'ДД.ММ.ГГГГ', 'text', 'numeric', 'bday'],
  documentNumber: ['Серия и номер', '', 'text', 'numeric'],
  email: ['Электронная почта', 'Например, name@example.com. Сюда придёт билет.', 'email', 'email', 'email'],
  phone: ['Телефон', 'Например, +7 900 123-45-67. Для связи по рейсу.', 'tel', 'tel', 'tel']
};

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
        tripsFor(route, date, 'available').some(trip => trip.id === saved.tripId)) return saved;
  } catch {
    return null;
  }
  return null;
}

function chosenTrip() {
  return booking && tripsFor(route, booking.date, 'available').find(trip => trip.id === booking.tripId);
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
    ? '<h2>Вы вошли в демопрофиль</h2><p>Доступны пример почты ' + demoFields.email + ' и тестовый телефон ' + demoFields.phone + '. При повторном оформлении их можно подставить и отредактировать.</p><a class="text-link" href="' + sitePath('/') + '">Найти рейс</a>' + button('Выйти', 'data-demo-signout', 'secondary')
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
    path: location.pathname, date, tripId: id, scenario, seat: null, lostSeat: null,
    price: trip.price, originalPrice: trip.price, reserveUntil: 0, orderId: null,
    status: '', returnStatus: '', profileOffered: false
  };
  formDraft = {};
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
  const heading = { seat: trip.seatMap ? 'Выберите место' : 'Место в автобусе', passenger: 'Данные пассажира', review: 'Проверьте заказ', order: 'Ваш заказ' };
  const back = { seat: 'К рейсам', passenger: 'К выбору места', review: 'К данным пассажира', order: 'К рейсам' };
  const stamp = step === 'order' ? 'Заказ ' + escapeHTML(booking.orderId || '') : titleFor(route) + ' · ' + dateLabel(date);
  const views = { seat: seatView, passenger: passengerView, review: reviewView, order: orderView };
  checkoutView.innerHTML = '<div class="journey-header"><button class="text-link back-link" type="button" data-step-back>' + icon('back') + ' ' + back[step] + '</button><p class="journey-kicker">' + stamp + '</p><h1 id="checkout-heading" tabindex="-1">' + heading[step] + '</h1></div><ol class="stepper" aria-label="Шаги оформления">' +
    stageNames.map((name, i) => '<li class="' + (i <= steps.indexOf(step) ? 'reached' : '') + '"' +
      (steps[i] === step ? ' aria-current="step"' : '') + '><span>' + (i < steps.indexOf(step) ? icon('check') : i + 1) + '</span>' + name + '</li>').join('') +
    '</ol>' + views[step](trip);
  if (!keepScroll) {
    window.scrollTo(0, 0);
    $('#checkout-heading').focus({ preventScroll: true });
  }
  syncReserve();
}

function seatView(trip) {
  const free = [2, 3, 5, 6, 8, 9, 11, 12, 13, 15, 16, 17, 18, 20].slice(0, trip.seats);
  const grid = Array.from({ length: 20 }, (_, i) => {
    const number = i + 1;
    const taken = !free.includes(number) || number === booking.lostSeat;
    return '<button type="button" class="seat" data-seat="' + number + '" aria-pressed="' + (number === booking.seat) +
      '" aria-label="Место ' + number + (taken ? ', занято' : '') + '"' + (taken ? ' disabled' : '') + '>' + number + '</button>';
  }).join('');
  const layout = trip.seatMap ? '<p>Выберите свободное место на схеме.</p><div class="bus-layout"><div class="bus-front">' + icon('bus') + '<span>Перед автобуса</span></div><div class="seat-grid">' + grid + '</div></div><div class="seat-legend"><span>Свободно</span><span>Занято</span><span>Выбрано</span></div>' :
    '<p>Место назначит перевозчик. Его номер появится в билете после оформления.</p>';
  return '<div class="checkout-grid"><section class="panel">' +
    (booking.lostSeat ? '<div class="notice" role="status">Место ' + booking.lostSeat + ' уже занято. Выберите другое.</div>' : '') +
    (booking.status === 'expired' ? '<div class="notice" role="status">Срок резерва истёк. Выберите место и подтвердите его снова.</div>' : '') +
    layout + '</section>' + summaryPanel(trip, button('Продолжить<span class="seat-total"> · ' + priceText(booking.price) + '</span>', 'data-reserve' + (trip.seatMap && !booking.seat ? ' disabled' : ''))) + '</div>';
}

function documentOptions() {
  return Object.entries(documentsByType).map(([key, item]) => '<option value="' + key + '"' + ((formDraft.documentType || 'passport') === key ? ' selected' : '') + '>' + item.name + '</option>').join('');
}
function inputField(key) {
  let [label, hint, type = 'text', inputMode = 'text', auto = 'off', required = true] = fields[key];
  if (key === 'documentNumber') {
    const config = documentsByType[formDraft.documentType || 'passport'];
    hint = config.hint;
    inputMode = config.inputMode;
  }
  return '<div class="field" data-field="' + key + '"><label for="' + key + '">' + label + (required ? ' <span class="required" aria-hidden="true">*</span>' : '') + '</label>' +
    '<input id="' + key + '" type="' + type + '" name="' + key + '" inputmode="' + inputMode + '" autocomplete="' + auto + '" value="' + escapeHTML(formDraft[key] || '') + '" aria-describedby="' + key + '-hint ' + key + '-error"' + (required ? ' required' : '') + (key === 'middleName' && formDraft.noMiddleName ? ' disabled' : '') + '>' +
    '<small id="' + key + '-hint" class="field-hint"' + (!hint ? ' hidden' : '') + '>' + hint + '</small><p class="error" id="' + key + '-error" hidden></p></div>';
}

function passengerView(trip) {
  return '<div class="checkout-grid"><form id="passenger-form" class="form-stack" novalidate>' +
    '<div class="notice">Используйте вымышленные данные. ' + button('Заполнить примером', 'data-fill-demo', 'secondary') + '</div>' +
    (booking.wasReloaded && !formDraft.firstName ? '<p class="notice">После обновления нужно заново заполнить личные данные. Рейс и место сохранены в этой вкладке.</p>' : '') +
    (booking.status === 'expired' ? '<div class="notice" role="status">Срок резерва истёк. Данные анкеты сохранены. ' + button('Вернуться к месту', 'data-renew-seat', 'secondary') + '</div>' : '') +
    '<section class="panel"><h2>Пассажир</h2><p class="field-hint">Один взрослый. Поля со звёздочкой обязательны.</p><div class="form-stack">' + inputField('lastName') + inputField('firstName') + inputField('middleName') +
    '<label class="checkbox"><input type="checkbox" name="noMiddleName"' + (formDraft.noMiddleName ? ' checked' : '') + '><span>У меня нет отчества</span></label>' + inputField('birth') +
    '<label class="field" for="documentType">Документ <span class="required" aria-hidden="true">*</span><select id="documentType" name="documentType" required>' + documentOptions() + '</select></label>' +
    inputField('documentNumber') + '</div></section>' +
    '<section class="panel"><h2>Контакты покупателя</h2><div class="form-stack">' +
    (profileStatus() === 'active' ? button('Подставить контакты из демопрофиля', 'data-fill-profile', 'secondary') : '') +
    inputField('email') + inputField('phone') + '<label class="checkbox"><input type="checkbox" name="saveProfile"' + (formDraft.saveProfile ? ' checked' : '') + '><span>Сохранить почту и телефон для следующей покупки</span></label>' +
    documentButton('profile', 'Согласие на сохранение контактов') + '</div></section>' +
    '<button type="submit" class="button primary full">Проверить заказ</button></form>' + summaryPanel(trip) + '</div>';
}

function summaryPanel(trip, action = '') {
  const fare = booking.price - 190;
  return '<aside class="panel summary-panel"><h2>Ваша поездка</h2>' + timeLine(trip) +
    '<p class="field-hint">' + demoCarrier + ' · ' + (trip.seatMap ? booking.seat ? 'Место ' + booking.seat : 'Место ещё не выбрано' : 'Место назначит перевозчик') + '</p>' +
    '<dl class="price-list"><div><dt>Билет · 1 взрослый</dt><dd>' + priceText(fare) + '</dd></div><div><dt>Сервисный сбор</dt><dd>' + priceText(190) + '</dd></div><div class="price-total"><dt>Итого</dt><dd>' + priceText(booking.price) + '</dd></div></dl>' +
    '<p class="field-hint">Сбор включён. Багаж оплачивается при посадке.</p>' +
    (booking.reserveUntil && !booking.status ? '<p class="reserve-line">' + icon('clock') + ' <span data-reserve-time>Уточняем срок резерва</span></p>' : '') +
    '<div class="doc-links">' + documentButton('bag', 'Ограничения перевозки багажа') + documentButton('refund', 'Условия возврата') + documentButton('purchase', 'Условия покупки электронных билетов') + '</div>' +
    (action ? '<div class="summary-action">' + action + '</div>' : '') + '</aside>';
}
function reviewView(trip) {
  const fareChanged = booking.price !== booking.originalPrice && !booking.acceptedPrice;
  const fullname = [formDraft.lastName, formDraft.firstName, !formDraft.noMiddleName && formDraft.middleName].filter(Boolean).join(' ');
  const traveller = '<section class="panel review-passenger"><div class="inline-head"><h2>Пассажир и контакты</h2><button type="button" class="text-link" data-edit-passenger>Изменить</button></div>' +
    '<dl class="data-list"><div><dt>Пассажир</dt><dd>' + escapeHTML(fullname) + '</dd></div><div><dt>Дата рождения</dt><dd>' + escapeHTML(formDraft.birth || '') + '</dd></div><div><dt>Документ</dt><dd>' +
    documentsByType[formDraft.documentType || 'passport'].name + ' · •••• ' + escapeHTML((formDraft.documentNumber || '').slice(-4)) +
    '</dd></div><div><dt>Получатель билета</dt><dd>' + escapeHTML(formDraft.email || '') + '</dd></div><div><dt>Телефон</dt><dd>' + escapeHTML(formDraft.phone || '') + '</dd></div></dl></section>';
  const payment = '<section class="panel form-stack review-payment"><h2>Оплата</h2><div class="pay-method">' + icon('card') + ' Демооплата картой</div><p class="field-hint">Тестовый платёж. Реквизиты карты вводить не нужно.</p>' +
    '<label class="checkbox"><input type="checkbox" id="purchase-agree"' + (formDraft.purchaseAgree ? ' checked' : '') + ' aria-describedby="purchase-error"><span>Принимаю условия покупки</span></label>' +
    documentButton('purchase', 'Условия покупки электронных билетов') + '<p class="error" id="purchase-error" hidden></p>' +
    (fareChanged ? '<div class="notice" role="status">Цена изменилась: <del>' + priceText(booking.originalPrice) + '</del> → <strong>' + priceText(booking.price) + '</strong>. ' +
      button('Принять новую цену', 'data-accept-price', 'secondary') + '</div>' : '') +
    (booking.status === 'expired' ? '<div class="notice" role="status">Срок резерва истёк. Подтвердите место заново. ' + button('Вернуться к месту', 'data-renew-seat', 'secondary') + '</div>' : '') +
    '<p class="error" data-pay-error hidden></p>' +
    button('Оплатить ' + rub(booking.price), 'data-pay' + (fareChanged || booking.status === 'expired' ? ' disabled' : '')) + '</section>';
  return '<div class="checkout-grid review-grid">' + traveller + summaryPanel(trip) + payment + '</div>';
}
function orderView(trip) {
  const stage = {
    processing: ['Проверяем оплату', 'Запрос принят. Статус платежа обновится в этом заказе.', ''],
    pending: ['Проверяем оплату', 'Исход операции уточняется. Можно повторить проверку статуса в этом же заказе.', button('Проверить статус', 'data-check-status', 'secondary')],
    issuing: ['Билет оформляется', 'Демооплата подтверждена. Проверяем выдачу билета.', button('Обновить статус', 'data-check-status', 'secondary')],
    declined: ['Оплата отклонена', 'В демосценарии платёж не прошёл. Повторить оплату можно из проверки заказа.', button('Вернуться к оплате', 'data-retry-payment', 'secondary')],
    issued: ['Билет оформлен', 'Демонстрационный билет. Детали поездки доступны ниже.', button('Открыть билет', 'data-ticket')]
  }[booking.status] || ['Заказ сохранён', 'Статус можно проверить здесь.', button('Проверить статус', 'data-check-status', 'secondary')];
  const refund = booking.status !== 'issued' ? '' :
    '<section class="panel form-stack"><h2>Возврат</h2>' + (booking.returnStatus ?
      '<p role="status">' + (booking.returnStatus === 'complete' ? 'Тестовый возврат подтверждён · ' + priceText(booking.price) : 'Тестовый запрос на возврат в обработке') + '</p>' +
      (booking.returnStatus !== 'complete' ? button('Проверить возврат', 'data-check-refund', 'secondary') : '') :
      '<p>Посмотрите условия для этого билета и тестовый расчёт.</p>' + button('Рассчитать возврат', 'data-refund', 'secondary')) + '</section>';
  const profile = booking.status === 'issued' && booking.profileOffered ? '<a href="' + sitePath('/profil/') + '" class="text-link">Открыть демопрофиль</a>' : '';
  return '<div class="checkout-grid"><div class="form-stack"><section class="panel form-stack order-status"><span class="route-icon">' + icon(booking.status === 'issued' ? 'check' : 'ticket') + '</span><h2>' + stage[0] + '</h2><p>' +
    stage[1] + '</p>' + stage[2] + '<a href="' + sitePath('/pomosh/vozvrat/') + '" class="text-link">Справка по заказу</a>' + profile + '</section>' + refund + '</div>' + summaryPanel(trip) + '</div>';
}

function checkField(key) {
  const input = $('#' + key);
  if (!input) return true;
  const value = input.value.trim();
  let message = '';
  if (!input.disabled) {
    if (input.required && !value) message = 'Заполните поле «' + fields[key][0] + '».';
    else if (['lastName', 'firstName', 'middleName'].includes(key) && value && !namePattern.test(value)) message = 'Используйте буквы, пробел, дефис или апостроф.';
    else if (key === 'birth') {
      const [day, month, year] = value.split('.');
      const birthday = [year, month, day].join('-');
      if (!validDate(birthday) || birthday > today() || Number(year) < 1900) message = 'Введите действительную дату в формате ДД.ММ.ГГГГ.';
      else {
        const age = Number(date.slice(0, 4)) - Number(year) - Number(date.slice(5) < birthday.slice(5));
        if (age < 18) message = 'На дату поездки пассажиру должно исполниться 18 лет для этого тарифа.';
      }
    } else if (key === 'documentNumber' && !documentsByType[formDraft.documentType || 'passport'].pattern.test(value)) {
      message = 'Проверьте формат: ' + documentsByType[formDraft.documentType || 'passport'].hint.toLowerCase() + '.';
    } else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Введите электронную почту в формате name@example.com.';
    else if (key === 'phone' && !/^\+?[\d()\-\s.]+$/.test(value)) message = 'Введите номер телефона, используя цифры и обычные разделители.';
    else if (key === 'phone' && !/^\d{10,15}$/.test(value.replace(/\D/g, ''))) message = 'Проверьте номер: должно быть от 10 до 15 цифр.';
  }
  setError(input, $('#' + key + '-error'), message);
  return !message;
}

function verifyPassenger(event) {
  event.preventDefault();
  const invalid = Object.keys(fields).filter(key => !checkField(key));
  if (invalid.length) return $('#' + invalid[0]).focus();
  booking.wasReloaded = false;
  if (booking.scenario === 'repriced' && booking.price === booking.originalPrice) {
    booking.price += 240;
  }
  storeBooking();
  showStep('review');
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
  if (trip.seatMap && !booking.seat) return;
  if (!navigator.onLine) return sheet.open('Нет связи', '<p>Проверьте подключение и повторите резерв. Выбранное место и данные останутся в оформлении.</p>');
  if (booking.scenario === 'seat-lost' && !booking.lostSeat && trip.seatMap) {
    booking.lostSeat = booking.seat;
    booking.seat = null;
    storeBooking();
    return renderStep('seat', { keepScroll: true });
  }
  booking.status = '';
  booking.reserveUntil = Date.now() + (booking.scenario === 'expired' && !booking.didExpire ? 12 : 480) * 1000;
  if (booking.scenario === 'expired') booking.didExpire = true;
  formDraft.purchaseAgree = false;
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
  const agreement = $('#purchase-agree');
  if (!formDraft.purchaseAgree) {
    setError(agreement, $('#purchase-error'), 'Подтвердите согласие, чтобы перейти к оплате.');
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
  if (input.closest('#passenger-form') && input.name && input.type !== 'checkbox' && input.tagName !== 'SELECT') {
    formDraft[input.name] = input.value.trim();
    if (input.getAttribute('aria-invalid') === 'true') checkField(input.name);
  }
});
checkoutView?.addEventListener('focusout', event => {
  if (event.target.value && event.target.closest('[data-field]')) checkField(event.target.name);
});
checkoutView?.addEventListener('change', event => {
  const input = event.target;
  if (input.name === 'documentType') {
    formDraft.documentType = input.value;
    formDraft.documentNumber = '';
    const target = $('#documentNumber');
    target.value = '';
    target.inputMode = documentsByType[input.value].inputMode;
    $('#documentNumber-hint').textContent = documentsByType[input.value].hint;
    setError(target, $('#documentNumber-error'), '');
  } else if (input.name === 'noMiddleName') {
    formDraft.noMiddleName = input.checked;
    $('#middleName').disabled = input.checked;
    if (input.checked) setError($('#middleName'), $('#middleName-error'), '');
  } else if (input.name === 'saveProfile') formDraft.saveProfile = input.checked;
  else if (input.id === 'purchase-agree') {
    formDraft.purchaseAgree = input.checked;
    if (input.checked) setError(input, $('#purchase-error'), '');
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
  if (history.state?.filters) {
    filters = history.state.filters;
    sort = history.state.sort || 'departure';
    scenario = history.state.scenario || '';
    $('#sort').value = sort;
    $('#demo-scenario').value = scenario;
  }
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
    else if (next === 'review' && !formDraft.firstName) target = 'passenger';
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
  if (!route || step) return;
  scenario = 'offline';
  $('#demo-scenario').value = scenario;
  refreshResults({ loading: false });
});

function applyScenario(value) {
  scenario = value;
  $('#demo-scenario').value = value;
  refreshResults();
}

document.addEventListener('click', event => {
  const control = event.target.closest('button, [data-day]');
  if (!control || control.disabled) return;
  const data = control.dataset;
  if ('menu' in data) sheet.open('Меню', '<nav class="menu-links" aria-label="Основная навигация">' + navLinks + '</nav>');
  else if ('close' in data) sheet.close();
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
  } else if ('retry' in data) applyScenario(navigator.onLine ? '' : 'offline');
  else if ('refreshCalendar' in data) {
    if (navigator.onLine) applyScenario('');
    renderCalendar();
    setTimeout(() => { if (dialog.open && $('.calendar-nav', dialog)) renderCalendar(); }, 300);
  } else if ('filters' in data) openFilters();
  else if ('resetStage' in data) {
    $$('select, input', $('#filter-form')).forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
    updateFilterCount();
  } else if ('applyFilters' in data) {
    filters = draftFilters();
    sheet.close(renderResults);
  } else if ('clearFilters' in data) {
    filters = { available: false, period: '', from: '', to: '' };
    renderResults();
  } else if ('trip' in data) startBooking(data.trip);
  else if ('seat' in data) {
    booking.seat = Number(data.seat);
    $$('[data-seat]', checkoutView).forEach(el => el.setAttribute('aria-pressed', String(el === control)));
    $('[data-reserve]').disabled = false;
    $('.summary-panel > p', checkoutView).textContent = demoCarrier + ' · Место ' + booking.seat;
    storeBooking();
  } else if ('reserve' in data) reserveSeat();
  else if ('demoSignin' in data || 'demoSignout' in data) {
    profileStatus('demoSignin' in data ? 'active' : 'eligible');
    renderProfile();
    $('#profile-panel').setAttribute('tabindex', '-1');
    $('#profile-panel').focus();
  } else if ('fillProfile' in data) {
    for (const key of ['email', 'phone']) {
      formDraft[key] = demoFields[key];
      $('#' + key).value = formDraft[key];
      checkField(key);
    }
    $('#email').focus();
  } else if ('fillDemo' in data) {
    Object.assign(formDraft, demoFields, { noMiddleName: false });
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
    showStep(booking.reserveUntil > Date.now() && formDraft.firstName ? 'review' : 'seat', true);
  } else if ('ticket' in data) {
    const ticket = chosenTrip();
    sheet.open('Демонстрационный билет', '<p>Заказ ' + escapeHTML(booking.orderId) + '</p>' + timeLine(ticket) + tripDetails(ticket));
  } else if ('refund' in data) {
    sheet.open('Расчёт возврата', '<p>Тестовый расчёт для демонстрационного заказа.</p><dl class="price-list"><div><dt>Удержание</dt><dd>0 ₽</dd></div><div class="price-total"><dt>К возврату</dt><dd>' + priceText(booking.price) + '</dd></div></dl>', button('Подтвердить возврат', 'data-confirm-refund'), 'document-sheet');
  } else if ('confirmRefund' in data) {
    booking.returnStatus = 'pending';
    storeBooking();
    sheet.close(() => renderStep('order', { keepScroll: true }));
  } else if ('checkRefund' in data) {
    booking.returnStatus = 'complete';
    storeBooking();
    renderStep('order', { keepScroll: true });
  }
});

$('#sort')?.addEventListener('change', event => { sort = event.target.value; renderResults(); });
$('#demo-scenario')?.addEventListener('change', event => applyScenario(event.target.value));
if (history.state?.sheet) history.replaceState({ ...history.state, sheet: false }, '');
restoreFromURL({ initialLoad: true });
renderProfile();
