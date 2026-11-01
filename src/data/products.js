




export const products = [
  {
    id: 1,
    name: 'Геймпад Aurora X Pro',
    price: 7990,
    image: '/images/gamepad.svg',
    category: 'Геймпады',
    tag: 'Хит',
    rating: 4.8,
    description:
      'Беспроводной контроллер с триггерами Hall-эффекта, подсветкой RGB и батареей до 40 часов. Совместим с PC, Android и iOS.',
  },
  {
    id: 2,
    name: 'Игровая гарнитура Void 7.1',
    price: 6490,
    image: '/images/headset.svg',
    category: 'Аудио',
    tag: 'Скидка',
    oldPrice: 7490,
    rating: 4.6,
    description:
      'Объёмный звук 7.1, съёмный микрофон с шумоподавлением и мягкие амбушюры из искусственной кожи для многочасовых сессий.',
  },
  {
    id: 3,
    name: 'Механическая клавиатура Nova TKL',
    price: 9990,
    image: '/images/keyboard.svg',
    category: 'Периферия',
    tag: 'Новинка',
    rating: 4.9,
    description:
      'Switches Red, hot-swap, алюминиевый корпус, смазанные стабилизаторы и съёмный кабель USB-C. Формат TKL без цифрового блока.',
  },
  {
    id: 4,
    name: 'Игровая мышь Phantom 26K',
    price: 4590,
    image: '/images/mouse.svg',
    category: 'Периферия',
    rating: 4.7,
    description:
      'Сенсор 26 000 DPI, вес 58 г, оптические переключатели на 100 млн нажатий и 100 % PTFE-ножки для идеального скольжения.',
  },
  {
    id: 5,
    name: 'VR-шлем Nebula One',
    price: 34990,
    image: '/images/vr.svg',
    category: 'VR',
    tag: 'Хит',
    rating: 4.5,
    description:
      'Разрешение 2160×2160 на глаз, 90 Гц, встроенные наушники и трекинг внутри-наружу без внешних базовых станций.',
  },
  {
    id: 6,
    name: 'Монитор Titan 240 Гц',
    price: 27490,
    image: '/images/monitor.svg',
    category: 'Мониторы',
    rating: 4.8,
    description:
      '27", Full HD, матрица IPS 240 Гц, время отклика 1 мс, поддержка FreeSync/G-Sync и регулируемая подставка с VESA.',
  },
  {
    id: 7,
    name: 'Игровое кресло Throne GT',
    price: 18990,
    image: '/images/chair.svg',
    category: 'Комфорт',
    tag: 'Скидка',
    oldPrice: 21990,
    rating: 4.4,
    description:
      'Каркас из стали, подголовник и поясничная подушка, регулировка наклона до 155° и газлифт класса 4 на 150 кг.',
  },
  {
    id: 8,
    name: 'Стрим-микрофон Cast Pro',
    price: 8290,
    image: '/images/mic.svg',
    category: 'Аудио',
    tag: 'Новинка',
    rating: 4.7,
    description:
      'Конденсаторный USB-микрофон с кардиоидной направленностью, стойкой-«пауком», тап-контролем и гнездом для наушников.',
  },
  {
    id: 9,
    name: 'Коврик HyperGlide XL',
    price: 1990,
    image: '/images/mousepad.svg',
    category: 'Периферия',
    rating: 4.6,
    description:
      'Тканевая поверхность 900×400 мм с прошитым краем и влагостойким покрытием. Держится на столе за счёт резинового основания.',
  },
]


export const categories = ['Все', ...new Set(products.map((p) => p.category))]


export function getProductById(id) {
  return products.find((p) => p.id === Number(id))
}
