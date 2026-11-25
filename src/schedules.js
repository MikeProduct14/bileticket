import { carrierSchedules } from './carrier-schedules.js';

const alphabet = ['a', 'b', 'v', 'g', 'd', 'e', 'e', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'kh', 'ts', 'ch', 'sh', 'shch', '', 'y', '', 'e', 'yu', 'ya'];
const roman = Object.fromEntries(Array.from('абвгдеёжзийклмнопрстуфхцчшщъыьэюя', (char, index) => [char, alphabet[index]]));
const slug = name => name.toLowerCase().replace(/[а-яё]/g, char => roman[char]).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const regions = {
  'Ставропольский край': ['Ставрополь', 'Рыздвяный', 'Изобильный', 'Новотроицкая', 'Новоалександровск', 'Красногвардейское', 'Московское', 'Донское', 'Безопасное'],
  'Ростовская область': ['Песчанокопское', 'Егорлыкская', 'Зерноград', 'Ростов-на-Дону', 'Новочеркасск', 'Каменск-Шахтинский', 'Глубокий', 'Миллерово', 'Алексеево-Лозовское', 'Чертково'],
  'Воронежская область': ['Богучар', 'Верхний Мамон', 'Павловск', 'Лосево', 'Лиски', 'Воронеж'],
  'Липецкая область': ['Задонск', 'Елец'],
  'Тульская область': ['Ефремов', 'Богородицк', 'Тула'],
  'Москва': ['Москва']
};
const regionByCity = Object.fromEntries(Object.entries(regions).flatMap(([region, names]) => names.map(name => [name, region])));
const aliasesByCity = {
  'Ростов-на-Дону': ['Ростов', 'Аксай'],
  'Новотроицкая': ['Новотроицкое'],
  'Дивноморское': ['Дивноморск', 'Дивноморский'],
  'Весёлое': ['Весёлый'],
  'Вишнёвка': ['Шепси']
};
export const operatorNames = {
  transtur: 'ООО «Ставрополь-Транстур»',
  translux: '«Ставрополь-Транслюкс», ИП Гончаров'
};

export const minutesOf = time => time ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) : null;

const names = [...new Set(carrierSchedules.flatMap(service => service.stops.map(stop => stop.city)))];
export const scheduleCities = Object.fromEntries(names.map(name => [
  slug(name),
  { name, region: regionByCity[name] || 'Краснодарский край', aliases: aliasesByCity[name] || [] }
]));
const directions = carrierSchedules.map(service => {
  let day = 0;
  let previous = null;
  const stops = service.stops.map(stop => {
    const clock = minutesOf(stop.time);
    if (clock !== null) {
      if (previous !== null && clock < previous) day++;
      previous = clock;
    }
    const cityId = slug(stop.city);
    return { ...stop, cityId, region: scheduleCities[cityId].region, day: clock === null ? null : day };
  });
  return { ...service, stops };
});

export const servicePairs = new Set();
for (const { stops } of directions) {
  stops.forEach((origin, index) => {
    for (const destination of stops.slice(index + 1)) {
      if (origin.cityId !== destination.cityId) servicePairs.add(origin.cityId + '/' + destination.cityId);
    }
  });
}

export const serviceEndpoints = [...new Set(directions.map(({ stops }) => stops[0].cityId + '/' + stops.at(-1).cityId))];

export function serviceSegments(from, to) {
  const segments = [];
  for (const service of directions) {
    const { stops } = service;
    stops.forEach((origin, start) => {
      if (origin.cityId !== from) return;
      for (let end = start + 1; end < stops.length; end++) {
        if (stops[end].cityId !== to) continue;
        segments.push({ service, start, end });
      }
    });
  }
  return segments;
}
