import { rub, today, validDate } from './data.js';
import { escapeHTML, icon } from './views.js';

export const documentsByType = {
  passport: { name: 'Паспорт гражданина Российской Федерации', hint: 'Например, 0102 003456', pattern: /^\d{4}\s?\d{6}$/, inputMode: 'numeric' },
  foreign: { name: 'Иностранный паспорт', hint: 'Например, A00123456', pattern: /^[A-Z0-9]{5,16}$/i, inputMode: 'text' }
};
export const genders = { male: 'Мужской', female: 'Женский' };
export const demoContacts = { email: 'passenger@example.com', phone: '+7 900 000-00-00' };
const names = /^\p{L}+(?:[ '’\-]\p{L}+)*$/u;
const seatNumbers = [2, 3, 5, 6, 8, 9, 11, 12, 13, 15, 16, 17, 18, 20];
const fieldLabels = {
  lastName: 'Фамилия',
  firstName: 'Имя',
  middleName: 'Отчество',
  gender: 'Пол',
  birth: 'Дата рождения',
  documentType: 'Документ',
  documentNumber: 'Серия и номер',
  email: 'Электронная почта',
  phone: 'Телефон',
  seat: 'Место'
};

export const emptyDraft = () => ({ passengers: {} });
export const fieldId = (key, passenger) => passenger && passenger.id !== 1 ? key + '-' + passenger.id : key;
export const totalFor = (booking, price = booking.price) => price * booking.passengers.length;
export const peopleLabel = count => count === 1 ? '1 пассажир' : count < 5 ? count + ' пассажира' : count + ' пассажиров';

export function seatChoices(trip, booking, passenger) {
  const occupied = booking.passengers.filter(person => person !== passenger).map(person => person.seat);
  return seatNumbers.slice(0, trip.seats).filter(seat => seat !== booking.lostSeat && !occupied.includes(seat));
}

export function canAddPassenger(trip, booking) {
  return booking.passengers.length < trip.seats && (!trip.seatMap || seatChoices(trip, booking).length > 0);
}

export function hasAllSeats(trip, booking) {
  return booking.passengers.length <= trip.seats && (!trip.seatMap ||
    booking.passengers.every(person => seatChoices(trip, booking, person).includes(person.seat)));
}

export function examplePassenger(index) {
  const examples = [
    ['Примеров', 'Иван', 'Иванович', 'male'],
    ['Примерова', 'Анна', 'Петровна', 'female'],
    ['Примеров', 'Алексей', 'Сергеевич', 'male']
  ];
  const [lastName, firstName, middleName, gender] = examples[index % examples.length];
  return { lastName, firstName, middleName, gender, birth: '17.06.1990', documentType: 'passport', documentNumber: '0102 ' + String(3456 + index).padStart(6, '0') };
}

export function inputField(key, draft, passenger) {
  const id = fieldId(key, passenger);
  const config = documentsByType[draft.documentType || 'passport'];
  const fields = {
    lastName: { hint: 'Как в документе' },
    firstName: { hint: 'Как в документе' },
    middleName: {},
    birth: { hint: 'ДД.ММ.ГГГГ', mode: 'numeric', placeholder: 'ДД.ММ.ГГГГ' },
    documentNumber: { hint: config.hint, mode: config.inputMode },
    email: { hint: 'Например, name@example.com. Сюда придёт билет.', type: 'email', autocomplete: 'email' },
    phone: { hint: 'Например, +7 900 123-45-67. Для связи по рейсу.', type: 'tel', autocomplete: 'tel' }
  };
  const { hint, type = 'text', mode = type, autocomplete = 'off', placeholder = '' } = fields[key];
  const required = key !== 'middleName';
  return field(key, id, required, hint, `<input id="${id}" data-input="${key}" type="${type}" name="${id}" inputmode="${mode}" autocomplete="${autocomplete}" value="${escapeHTML(draft[key] || '')}"${placeholder ? ' placeholder="' + placeholder + '"' : ''} aria-describedby="${id}-hint ${id}-error"${required ? ' required' : ''}>`);
}

function field(key, id, required, hint, control) {
  return `<div class="field checkout-field" data-field="${key}">
    <label id="${id}-label" for="${id}">${fieldLabels[key]}${required ? ' <span class="required" aria-hidden="true">*</span>' : ''}</label>
    <p class="error field-error" id="${id}-error" hidden></p>
    ${control}
    <small id="${id}-hint" class="field-hint"${hint ? '' : ' hidden'}>${hint || ''}</small>
  </div>`;
}

export function selectOptions(key, trip, booking, passenger) {
  if (key === 'seat') return seatChoices(trip, booking, passenger).map(number => [String(number), 'Место ' + number]);
  if (key === 'gender') return Object.entries(genders);
  return Object.entries(documentsByType).map(([id, item]) => [id, item.name]);
}

export function selectedOption(key, draft, passenger) {
  if (key === 'documentType') return draft.documentType || 'passport';
  if (key === 'seat') return String(passenger.seat || '');
  return draft[key] || '';
}

export function selectField(key, trip, booking, passenger, draft) {
  const id = fieldId(key, passenger);
  const selected = selectedOption(key, draft, passenger);
  const label = selectOptions(key, trip, booking, passenger).find(([value]) => value === selected)?.[1];
  const required = key !== 'seat';
  return field(key, id, required, '', `<button id="${id}" class="select-trigger" type="button" data-input="${key}" data-passenger-select="${key}" aria-haspopup="dialog" aria-labelledby="${id}-label ${id}-value" aria-describedby="${id}-error">
    <span id="${id}-value"${label ? '' : ' class="select-placeholder"'}>${label || 'Выберите'}</span>${icon('next')}
  </button>`);
}

export function passengerCard(trip, booking, passenger, index, draft) {
  const deleted = index ? '<button type="button" class="text-link remove-passenger" data-remove-passenger aria-label="Удалить пассажира ' + (index + 1) + '">Удалить</button>' : '';
  const seat = trip.seatMap ? selectField('seat', trip, booking, passenger, draft) : '<p class="field-hint">Место назначит перевозчик</p>';
  return `<section class="panel passenger-card" data-passenger="${passenger.id}" aria-labelledby="passenger-${passenger.id}-title">
    <div class="inline-head"><h2 id="passenger-${passenger.id}-title">Пассажир ${index + 1}</h2>${deleted}</div>
    <div class="passenger-fare"><span>Цена за билет <strong>${rub(booking.price)}</strong></span>${seat}</div>
    <div class="form-stack">
      ${inputField('lastName', draft, passenger)}${inputField('firstName', draft, passenger)}${inputField('middleName', draft, passenger)}
      <div class="form-pair">${selectField('gender', trip, booking, passenger, draft)}${inputField('birth', draft, passenger)}</div>
      ${selectField('documentType', trip, booking, passenger, draft)}${inputField('documentNumber', draft, passenger)}
    </div>
  </section>`;
}

export function validationMessage(key, value, draft, date) {
  if (!value && key !== 'middleName') return 'Поле «' + fieldLabels[key] + '» должно быть заполнено.';
  if (['lastName', 'firstName', 'middleName'].includes(key) && value && !names.test(value)) return 'Используйте буквы, пробел, дефис или апостроф.';
  if (key === 'birth') {
    const [day, month, year] = value.split('.');
    const birthday = [year, month, day].join('-');
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value) || !validDate(birthday) || birthday > today() || Number(year) < 1900) return 'Введите действительную дату в формате ДД.ММ.ГГГГ.';
    const age = Number(date.slice(0, 4)) - Number(year) - Number(date.slice(5) < birthday.slice(5));
    if (age < 18) return 'На дату поездки пассажиру должно исполниться 18 лет для этого тарифа.';
  }
  if (key === 'documentNumber') {
    const config = documentsByType[draft.documentType || 'passport'];
    if (!config.pattern.test(value)) return 'Проверьте формат. ' + config.hint + '.';
  }
  if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите электронную почту в формате name@example.com.';
  if (key === 'phone' && (!/^\+?[\d()\-\s.]+$/.test(value) || !/^\d{10,15}$/.test(value.replace(/\D/g, '')))) {
    return 'Введите номер с 10–15 цифрами. Пробелы, дефисы и скобки допустимы.';
  }
  return '';
}
