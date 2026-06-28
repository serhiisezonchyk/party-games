import type { LocalizedText, SpyPackage, SpyPlace, SpyRole } from "./types";

type Labels = readonly [en: string, uk: string];

interface PackageSeed {
  id: string;
  items: readonly Labels[];
  label: Labels;
}

interface RoleTemplate {
  en: string;
  uk: string;
}

const defaultItemRoleTemplates: readonly RoleTemplate[] = [
  { en: "Visitor", uk: "Відвідувач" },
  { en: "Worker", uk: "Працівник" },
  { en: "Regular", uk: "Постійний гість" },
  { en: "Manager", uk: "Керівник" },
];

interface RoleTemplateRule {
  keywords: readonly string[];
  roles: readonly RoleTemplate[];
}

const roleTemplateRules: readonly RoleTemplateRule[] = [
  {
    keywords: ["airport", "airplane", "helicopter", "space shuttle"],
    roles: [
      { en: "Pilot", uk: "Пілот" },
      { en: "Passenger", uk: "Пасажир" },
      { en: "Flight attendant", uk: "Бортпровідник" },
      { en: "Ground crew", uk: "Наземний персонал" },
    ],
  },
  {
    keywords: ["ocean", "beach", "lake", "river", "harbor", "reef"],
    roles: [
      { en: "Lifeguard", uk: "Рятувальник" },
      { en: "Visitor", uk: "Відвідувач" },
      { en: "Fisher", uk: "Рибалка" },
      { en: "Guide", uk: "Гід" },
    ],
  },
  {
    keywords: [
      "forest",
      "park",
      "garden",
      "mountain",
      "cave",
      "desert",
      "island",
    ],
    roles: [
      { en: "Ranger", uk: "Рейнджер" },
      { en: "Tourist", uk: "Турист" },
      { en: "Guide", uk: "Гід" },
      { en: "Caretaker", uk: "Доглядач" },
    ],
  },
  {
    keywords: ["train", "metro", "tram"],
    roles: [
      { en: "Driver", uk: "Машиніст" },
      { en: "Passenger", uk: "Пасажир" },
      { en: "Ticket inspector", uk: "Контролер квитків" },
      { en: "Station worker", uk: "Працівник станції" },
    ],
  },
  {
    keywords: ["bus", "station", "terminal"],
    roles: [
      { en: "Driver", uk: "Водій" },
      { en: "Passenger", uk: "Пасажир" },
      { en: "Dispatcher", uk: "Диспетчер" },
      { en: "Station worker", uk: "Працівник станції" },
    ],
  },
  {
    keywords: ["car", "taxi", "bicycle", "truck"],
    roles: [
      { en: "Driver", uk: "Водій" },
      { en: "Passenger", uk: "Пасажир" },
      { en: "Mechanic", uk: "Механік" },
      { en: "Owner", uk: "Власник" },
    ],
  },
  {
    keywords: ["ship", "steamship", "titanic", "ferry", "submarine", "yacht"],
    roles: [
      { en: "Captain", uk: "Капітан" },
      { en: "Passenger", uk: "Пасажир" },
      { en: "Sailor", uk: "Моряк" },
      { en: "Engineer", uk: "Інженер" },
    ],
  },
  {
    keywords: ["school", "classroom", "kindergarten"],
    roles: [
      { en: "Teacher", uk: "Вчитель" },
      { en: "Student", uk: "Учень" },
      { en: "Parent", uk: "Батько або мати" },
      { en: "Principal", uk: "Директор" },
    ],
  },
  {
    keywords: ["playground"],
    roles: [
      { en: "Child", uk: "Дитина" },
      { en: "Parent", uk: "Батько або мати" },
      { en: "Caretaker", uk: "Доглядач" },
      { en: "Visitor", uk: "Відвідувач" },
    ],
  },
  {
    keywords: ["restaurant", "cafe", "bar", "kitchen", "bakery"],
    roles: [
      { en: "Guest", uk: "Гість" },
      { en: "Server", uk: "Офіціант" },
      { en: "Cook", uk: "Кухар" },
      { en: "Manager", uk: "Менеджер" },
    ],
  },
  {
    keywords: ["museum", "gallery", "library"],
    roles: [
      { en: "Curator", uk: "Куратор" },
      { en: "Visitor", uk: "Відвідувач" },
      { en: "Guide", uk: "Гід" },
      { en: "Archivist", uk: "Архіваріус" },
    ],
  },
  {
    keywords: ["zoo", "aquarium"],
    roles: [
      { en: "Keeper", uk: "Доглядач" },
      { en: "Visitor", uk: "Відвідувач" },
      { en: "Veterinarian", uk: "Ветеринар" },
      { en: "Guide", uk: "Гід" },
    ],
  },
  {
    keywords: ["casino"],
    roles: [
      { en: "Dealer", uk: "Круп'є" },
      { en: "Player", uk: "Гравець" },
      { en: "Security guard", uk: "Охоронець" },
      { en: "Manager", uk: "Менеджер" },
    ],
  },
  {
    keywords: ["spa", "sauna", "salon"],
    roles: [
      { en: "Client", uk: "Клієнт" },
      { en: "Specialist", uk: "Спеціаліст" },
      { en: "Receptionist", uk: "Адміністратор" },
      { en: "Manager", uk: "Менеджер" },
    ],
  },
  {
    keywords: ["garage"],
    roles: [
      { en: "Mechanic", uk: "Механік" },
      { en: "Owner", uk: "Власник" },
      { en: "Driver", uk: "Водій" },
      { en: "Inspector", uk: "Інспектор" },
    ],
  },
  {
    keywords: ["kitchen", "balcony", "basement", "elevator", "rooftop"],
    roles: [
      { en: "Resident", uk: "Мешканець" },
      { en: "Guest", uk: "Гість" },
      { en: "Neighbor", uk: "Сусід" },
      { en: "Caretaker", uk: "Доглядач" },
    ],
  },
  {
    keywords: ["theater", "theatre", "opera", "concert", "cinema"],
    roles: [
      { en: "Performer", uk: "Виконавець" },
      { en: "Audience member", uk: "Глядач" },
      { en: "Director", uk: "Режисер" },
      { en: "Technician", uk: "Технік" },
    ],
  },
  {
    keywords: ["gym", "stadium", "court", "pool", "arena"],
    roles: [
      { en: "Coach", uk: "Тренер" },
      { en: "Athlete", uk: "Спортсмен" },
      { en: "Referee", uk: "Суддя" },
      { en: "Spectator", uk: "Глядач" },
    ],
  },
  {
    keywords: ["hotel", "hostel"],
    roles: [
      { en: "Guest", uk: "Гість" },
      { en: "Receptionist", uk: "Адміністратор" },
      { en: "Housekeeper", uk: "Покоївка" },
      { en: "Manager", uk: "Менеджер" },
    ],
  },
  {
    keywords: ["bank", "office", "warehouse"],
    roles: [
      { en: "Employee", uk: "Співробітник" },
      { en: "Client", uk: "Клієнт" },
      { en: "Manager", uk: "Менеджер" },
      { en: "Security guard", uk: "Охоронець" },
    ],
  },
  {
    keywords: ["prison", "courtroom", "police"],
    roles: [
      { en: "Guard", uk: "Охоронець" },
      { en: "Visitor", uk: "Відвідувач" },
      { en: "Officer", uk: "Офіцер" },
      { en: "Lawyer", uk: "Адвокат" },
    ],
  },
  {
    keywords: ["factory", "plant"],
    roles: [
      { en: "Operator", uk: "Оператор" },
      { en: "Engineer", uk: "Інженер" },
      { en: "Inspector", uk: "Інспектор" },
      { en: "Manager", uk: "Менеджер" },
    ],
  },
  {
    keywords: ["market", "mall", "supermarket", "store"],
    roles: [
      { en: "Customer", uk: "Покупець" },
      { en: "Cashier", uk: "Касир" },
      { en: "Seller", uk: "Продавець" },
      { en: "Security guard", uk: "Охоронець" },
    ],
  },
  {
    keywords: ["castle", "palace", "church", "cathedral"],
    roles: [
      { en: "Guide", uk: "Гід" },
      { en: "Visitor", uk: "Відвідувач" },
      { en: "Caretaker", uk: "Доглядач" },
      { en: "Historian", uk: "Історик" },
    ],
  },
  {
    keywords: ["farm", "orchard", "field"],
    roles: [
      { en: "Farmer", uk: "Фермер" },
      { en: "Worker", uk: "Працівник" },
      { en: "Buyer", uk: "Покупець" },
      { en: "Inspector", uk: "Інспектор" },
    ],
  },
  {
    keywords: ["university"],
    roles: [
      { en: "Professor", uk: "Професор" },
      { en: "Student", uk: "Студент" },
      { en: "Dean", uk: "Декан" },
      { en: "Librarian", uk: "Бібліотекар" },
    ],
  },
  {
    keywords: ["hospital", "clinic", "pharmacy"],
    roles: [
      { en: "Doctor", uk: "Лікар" },
      { en: "Patient", uk: "Пацієнт" },
      { en: "Nurse", uk: "Медсестра" },
      { en: "Receptionist", uk: "Адміністратор" },
    ],
  },
];

function getItemRoleTemplates(placeName: string): readonly RoleTemplate[] {
  const lowerName = placeName.toLowerCase();
  const rule = roleTemplateRules.find(({ keywords }) =>
    keywords.some((keyword) => lowerName.includes(keyword))
  );

  return rule?.roles ?? defaultItemRoleTemplates;
}

const packageSeeds: readonly PackageSeed[] = [
  {
    id: "easy",
    label: ["Easy", "Легкий"],
    items: [
      ["Theater", "Театр"],
      ["Ocean", "Океан"],
      ["Cinema", "Кінотеатр"],
      ["School", "Школа"],
      ["Airport", "Аеропорт"],
      ["Beach", "Пляж"],
      ["Hospital", "Лікарня"],
      ["Hotel", "Готель"],
      ["Bank", "Банк"],
      ["Prison", "В'язниця"],
      ["Factory", "Завод"],
      ["Museum", "Музей"],
      ["Library", "Бібліотека"],
      ["Zoo", "Зоопарк"],
      ["Aquarium", "Океанаріум"],
      ["Park", "Парк"],
      ["Cafe", "Кафе"],
      ["Bar", "Бар"],
      ["Restaurant", "Ресторан"],
      ["Kitchen", "Кухня"],
      ["Garage", "Гараж"],
      ["Office", "Офіс"],
      ["Market", "Ринок"],
      ["Stadium", "Стадіон"],
      ["Gym", "Спортзал"],
      ["Pool", "Басейн"],
      ["Train", "Потяг"],
      ["Bus", "Автобус"],
      ["Metro", "Метро"],
      ["Taxi", "Таксі"],
      ["Ship", "Корабель"],
      ["Airplane", "Літак"],
      ["Castle", "Замок"],
      ["Farm", "Ферма"],
      ["Forest", "Ліс"],
      ["Lake", "Озеро"],
      ["Mountain", "Гора"],
      ["Cave", "Печера"],
      ["Desert", "Пустеля"],
      ["Island", "Острів"],
      ["Station", "Станція"],
      ["Church", "Церква"],
      ["Casino", "Казино"],
      ["Mall", "Мол"],
      ["Supermarket", "Супермаркет"],
      ["Pharmacy", "Аптека"],
      ["Bakery", "Пекарня"],
      ["University", "Університет"],
      ["Classroom", "Клас"],
      ["Playground", "Майданчик"],
      ["Sauna", "Сауна"],
      ["Spa", "Спа"],
      ["Salon", "Салон"],
      ["Basement", "Підвал"],
      ["Elevator", "Ліфт"],
      ["Rooftop", "Дах"],
      ["Balcony", "Балкон"],
      ["Harbor", "Гавань"],
      ["Garden", "Сад"],
      ["Warehouse", "Склад"],
    ],
  },
  {
    id: "countries",
    label: ["Countries", "Країни"],
    items: [
      ["Egypt", "Єгипет"],
      ["Ukraine", "Україна"],
      ["New Zealand", "Нова Зеландія"],
      ["Japan", "Японія"],
      ["Brazil", "Бразилія"],
      ["Canada", "Канада"],
      ["Iceland", "Ісландія"],
      ["Morocco", "Марокко"],
      ["India", "Індія"],
      ["Mexico", "Мексика"],
      ["Norway", "Норвегія"],
      ["Kenya", "Кенія"],
      ["Italy", "Італія"],
      ["Argentina", "Аргентина"],
      ["South Korea", "Південна Корея"],
      ["Australia", "Австралія"],
      ["France", "Франція"],
      ["Greece", "Греція"],
      ["Turkey", "Туреччина"],
      ["Portugal", "Португалія"],
    ],
  },
  {
    id: "time-machine",
    label: ["Time Machine", "Машина часу"],
    items: [
      ["Ancient Greece", "Стародавня Греція"],
      ["Ancient Rome", "Стародавній Рим"],
      ["Medieval castle", "Середньовічний замок"],
      ["Viking village", "Селище вікінгів"],
      ["Renaissance workshop", "Майстерня Ренесансу"],
      ["Wild West town", "Містечко Дикого Заходу"],
      ["USSR apartment", "Квартира в СРСР"],
      ["1980s arcade", "Ігровий зал 1980-х"],
      ["1990s office", "Офіс 1990-х"],
      ["Stone Age cave", "Печера кам'яної доби"],
      ["Pirate port", "Піратський порт"],
      ["Victorian London", "Вікторіанський Лондон"],
      ["Future colony", "Колонія майбутнього"],
      ["Moon landing", "Висадка на Місяць"],
      ["Pharaoh palace", "Палац фараона"],
      ["Cossack Sich", "Козацька Січ"],
      ["Disco club", "Диско-клуб"],
      ["First railway station", "Перша залізнична станція"],
      ["Cold war bunker", "Бункер холодної війни"],
      ["Ancient library", "Стародавня бібліотека"],
    ],
  },
  {
    id: "ukraine",
    label: ["Ukraine Places", "Місця України"],
    items: [
      ["Kyiv", "Київ"],
      ["Chernihiv", "Чернігів"],
      ["Kharkiv", "Харків"],
      ["Odesa", "Одеса"],
      ["Lviv", "Львів"],
      ["Dnipro", "Дніпро"],
      ["Zaporizhzhia", "Запоріжжя"],
      ["Ivano-Frankivsk", "Івано-Франківськ"],
      ["Uzhhorod", "Ужгород"],
      ["Chernivtsi", "Чернівці"],
      ["Vinnytsia", "Вінниця"],
      ["Poltava", "Полтава"],
      ["Ternopil", "Тернопіль"],
      ["Lutsk", "Луцьк"],
      ["Rivne", "Рівне"],
      ["Kherson", "Херсон"],
      ["Mykolaiv", "Миколаїв"],
      ["Sumy", "Суми"],
      ["Zhytomyr", "Житомир"],
      ["Cherkasy", "Черкаси"],
      ["Hoverla", "Говерла"],
      ["Synevyr Lake", "Озеро Синевир"],
      ["Bukovel", "Буковель"],
      ["Carpathian mountains", "Карпати"],
      ["Shatsky Lakes", "Шацькі озера"],
      ["Dniester Canyon", "Дністровський каньйон"],
      ["Askania-Nova", "Асканія-Нова"],
      ["Sofiyivka Park", "Парк Софіївка"],
      ["Kamianets-Podilskyi Castle", "Кам'янець-Подільська фортеця"],
      ["Khotyn Fortress", "Хотинська фортеця"],
      ["Akkerman Fortress", "Аккерманська фортеця"],
      ["Olesko Castle", "Олеський замок"],
      ["Palanok Castle", "Замок Паланок"],
      ["Kyiv Pechersk Lavra", "Києво-Печерська лавра"],
      ["Saint Sophia Cathedral", "Софійський собор"],
      ["Andriivskyi Descent", "Андріївський узвіз"],
      ["Maidan Nezalezhnosti", "Майдан Незалежності"],
      ["Khreshchatyk", "Хрещатик"],
      ["Deribasivska Street", "Дерибасівська"],
      ["Odesa Opera House", "Одеський оперний театр"],
      ["Potemkin Stairs", "Потьомкінські сходи"],
      ["Lviv Rynok Square", "Площа Ринок у Львові"],
      ["Lviv Opera House", "Львівський оперний театр"],
      ["High Castle Park", "Парк Високий Замок"],
      ["Khortytsia Island", "Острів Хортиця"],
      ["Dnipro embankment", "Набережна Дніпра"],
      ["Tunnel of Love", "Тунель кохання"],
      ["Pysanka Museum", "Музей писанки"],
      ["Palanok viewpoint", "Оглядовий майданчик Паланка"],
      ["Vylkove", "Вилкове"],
    ],
  },
  {
    id: "sports",
    label: ["Sports", "Спорт"],
    items: [
      ["Gym", "Тренажерний зал"],
      ["Swimming pool", "Басейн"],
      ["Football stadium", "Футбольний стадіон"],
      ["Tennis court", "Тенісний корт"],
      ["Basketball court", "Баскетбольний майданчик"],
      ["Boxing ring", "Боксерський ринг"],
      ["Ice rink", "Льодова арена"],
      ["Ski resort", "Гірськолижний курорт"],
      ["Running track", "Бігова доріжка"],
      ["Yoga studio", "Студія йоги"],
      ["Climbing wall", "Скеледром"],
      ["Bowling alley", "Боулінг"],
      ["Golf course", "Поле для гольфу"],
      ["Surf beach", "Пляж для серфінгу"],
      ["Cycling track", "Велотрек"],
      ["Martial arts dojo", "Додзьо єдиноборств"],
      ["Volleyball court", "Волейбольний майданчик"],
      ["Horse arena", "Кінна арена"],
      ["Skate park", "Скейт-парк"],
      ["E-sports arena", "Арена кіберспорту"],
    ],
  },
  {
    id: "children",
    label: ["Children", "Дитинство"],
    items: [
      ["School", "Школа"],
      ["Kindergarten", "Дитячий садок"],
      ["Playground", "Дитячий майданчик"],
      ["Toy store", "Магазин іграшок"],
      ["Birthday party", "День народження"],
      ["Summer camp", "Літній табір"],
      ["Classroom", "Класна кімната"],
      ["School cafeteria", "Шкільна їдальня"],
      ["Tree house", "Будиночок на дереві"],
      ["Puppet theater", "Ляльковий театр"],
      ["Water park", "Аквапарк"],
      ["Amusement park", "Парк атракціонів"],
      ["Kids museum", "Дитячий музей"],
      ["Music school", "Музична школа"],
      ["Dance class", "Танцювальний гурток"],
      ["Cartoon studio", "Мультстудія"],
      ["Board game club", "Клуб настільних ігор"],
      ["Petting zoo", "Контактний зоопарк"],
      ["Ice cream stand", "Кіоск морозива"],
      ["Science fair", "Науковий ярмарок"],
    ],
  },
  {
    id: "leisure",
    label: ["Leisure", "Дозвілля"],
    items: [
      ["Lake", "Озеро"],
      ["Forest park", "Лісопарк"],
      ["Bar", "Бар"],
      ["Cafe", "Кафе"],
      ["Picnic meadow", "Галявина для пікніка"],
      ["Karaoke room", "Караоке-зал"],
      ["Spa", "Спа"],
      ["Sauna", "Сауна"],
      ["Beach", "Пляж"],
      ["Rooftop terrace", "Тераса на даху"],
      ["Board game cafe", "Кафе настільних ігор"],
      ["Quest room", "Квест-кімната"],
      ["Night market", "Нічний ринок"],
      ["Wine tasting", "Дегустація вина"],
      ["Camping site", "Кемпінг"],
      ["Fishing pier", "Рибальський пірс"],
      ["Open-air cinema", "Кінотеатр просто неба"],
      ["Jazz club", "Джаз-клуб"],
      ["Bowling lounge", "Боулінг-лаунж"],
      ["Botanical garden", "Ботанічний сад"],
    ],
  },
  {
    id: "culture",
    label: ["Culture", "Культура"],
    items: [
      ["Theater", "Театр"],
      ["Movie theater", "Кінотеатр"],
      ["Art gallery", "Галерея"],
      ["Museum", "Музей"],
      ["Opera house", "Оперний театр"],
      ["Concert hall", "Концертна зала"],
      ["Book festival", "Книжковий фестиваль"],
      ["Library", "Бібліотека"],
      ["Poetry reading", "Поетичні читання"],
      ["Film set", "Знімальний майданчик"],
      ["Street art wall", "Стіна стріт-арту"],
      ["Photo studio", "Фотостудія"],
      ["Ballet rehearsal", "Репетиція балету"],
      ["Sculpture park", "Парк скульптур"],
      ["Folk festival", "Фольклорний фестиваль"],
      ["Design studio", "Дизайн-студія"],
      ["Architecture tour", "Архітектурна екскурсія"],
      ["Circus tent", "Цирковий намет"],
      ["Recording studio", "Студія звукозапису"],
      ["Auction house", "Аукціонний дім"],
    ],
  },
  {
    id: "hardcore",
    label: ["Hardcore", "Хардкор"],
    items: [
      ["Cat cafe", "Котокафе"],
      ["Casino", "Казино"],
      ["Moon base", "Місячна база"],
      ["Prison", "В'язниця"],
      ["Factory", "Завод"],
      ["Abandoned hospital", "Покинута лікарня"],
      ["Secret laboratory", "Таємна лабораторія"],
      ["Nuclear plant", "Атомна станція"],
      ["Courtroom", "Зала суду"],
      ["Police station", "Поліцейський відділок"],
      ["Military base", "Військова база"],
      ["Haunted hotel", "Готель з привидами"],
      ["Underground bunker", "Підземний бункер"],
      ["Oil rig", "Нафтова платформа"],
      ["Space station", "Космічна станція"],
      ["Cyber arena", "Кібер-арена"],
      ["Black market", "Чорний ринок"],
      ["Volcano station", "Станція біля вулкана"],
      ["Deep sea lab", "Глибоководна лабораторія"],
      ["Arctic outpost", "Арктична станція"],
    ],
  },
  {
    id: "transport",
    label: ["Transport", "Транспорт"],
    items: [
      ["Train", "Потяг"],
      ["Car", "Автомобіль"],
      ["Steamship", "Пароплав"],
      ["Titanic", "Титанік"],
      ["Airplane", "Літак"],
      ["Airport", "Аеропорт"],
      ["Metro station", "Станція метро"],
      ["Bus", "Автобус"],
      ["Tram", "Трамвай"],
      ["Taxi", "Таксі"],
      ["Bicycle rental", "Прокат велосипедів"],
      ["Ferry", "Пором"],
      ["Submarine", "Підводний човен"],
      ["Helicopter", "Гелікоптер"],
      ["Cable car", "Канатна дорога"],
      ["Space shuttle", "Космічний шатл"],
      ["Truck stop", "Стоянка вантажівок"],
      ["Sailing yacht", "Вітрильна яхта"],
      ["Border checkpoint", "Прикордонний пункт"],
      ["Train depot", "Залізничне депо"],
    ],
  },
  {
    id: "workplaces",
    label: ["Workplaces", "Робота"],
    items: [
      ["Open office", "Опенспейс"],
      ["Meeting room", "Переговорна"],
      ["Startup pitch", "Пітч стартапу"],
      ["Bank", "Банк"],
      ["Hospital", "Лікарня"],
      ["Pharmacy", "Аптека"],
      ["Bakery", "Пекарня"],
      ["Restaurant kitchen", "Кухня ресторану"],
      ["Newsroom", "Редакція"],
      ["Post office", "Пошта"],
      ["Warehouse", "Склад"],
      ["Construction site", "Будівництво"],
      ["Hair salon", "Перукарня"],
      ["Veterinary clinic", "Ветеринарна клініка"],
      ["Call center", "Кол-центр"],
      ["Flower shop", "Квіткова крамниця"],
      ["Supermarket", "Супермаркет"],
      ["Car service", "Автосервіс"],
      ["Tailor shop", "Ательє"],
      ["IT support room", "Кімната IT-підтримки"],
    ],
  },
  {
    id: "travel",
    label: ["Travel", "Подорожі"],
    items: [
      ["Hotel lobby", "Лобі готелю"],
      ["Hostel room", "Кімната хостелу"],
      ["Mountain cabin", "Гірська хатина"],
      ["Safari camp", "Сафарі-табір"],
      ["Cruise ship", "Круїзний лайнер"],
      ["Tour bus", "Туристичний автобус"],
      ["Souvenir shop", "Сувенірна крамниця"],
      ["Embassy", "Посольство"],
      ["Travel agency", "Туристична агенція"],
      ["Island resort", "Острівний курорт"],
      ["Desert camp", "Табір у пустелі"],
      ["Mountain pass", "Гірський перевал"],
      ["City tour", "Екскурсія містом"],
      ["Airport hotel", "Готель біля аеропорту"],
      ["Train hostel", "Хостел у потязі"],
      ["National park", "Національний парк"],
      ["Old town square", "Площа старого міста"],
      ["Harbor promenade", "Набережна порту"],
      ["Border motel", "Мотель біля кордону"],
      ["Backpacker kitchen", "Кухня бекпекерів"],
    ],
  },
  {
    id: "food",
    label: ["Food", "Їжа"],
    items: [
      ["Pizzeria", "Піцерія"],
      ["Sushi bar", "Суші-бар"],
      ["Street food truck", "Фудтрак"],
      ["Farmers market", "Фермерський ринок"],
      ["Coffee roastery", "Обсмажувальня кави"],
      ["Tea house", "Чайна"],
      ["Chocolate factory", "Шоколадна фабрика"],
      ["Cheese cellar", "Сирний льох"],
      ["Food court", "Фудкорт"],
      ["Fine dining restaurant", "Ресторан високої кухні"],
      ["Diner", "Дайнер"],
      ["Ramen shop", "Раменна"],
      ["Burger stand", "Бургерна"],
      ["Vineyard", "Виноградник"],
      ["Brewery", "Пивоварня"],
      ["Cooking class", "Кулінарний майстер-клас"],
      ["Banquet hall", "Банкетна зала"],
      ["Candy store", "Кондитерська крамниця"],
      ["Seafood market", "Рибний ринок"],
      ["Family kitchen", "Сімейна кухня"],
    ],
  },
  {
    id: "nature",
    label: ["Nature", "Природа"],
    items: [
      ["Waterfall", "Водоспад"],
      ["Cave", "Печера"],
      ["Rainforest", "Тропічний ліс"],
      ["Desert oasis", "Оаза в пустелі"],
      ["Coral reef", "Кораловий риф"],
      ["Mountain lake", "Гірське озеро"],
      ["Volcano crater", "Кратер вулкана"],
      ["Pine forest", "Сосновий ліс"],
      ["River island", "Річковий острів"],
      ["Meadow", "Луг"],
      ["Glacier", "Льодовик"],
      ["Canyon", "Каньйон"],
      ["Mangrove swamp", "Мангрове болото"],
      ["Cherry orchard", "Вишневий сад"],
      ["Sunflower field", "Соняшникове поле"],
      ["Salt lake", "Солоне озеро"],
      ["Cliff path", "Стежка над урвищем"],
      ["Bee farm", "Пасіка"],
      ["Bird reserve", "Пташиний заповідник"],
      ["Storm shelter", "Укриття від бурі"],
    ],
  },
  {
    id: "fantasy",
    label: ["Fantasy", "Фентезі"],
    items: [
      ["Dragon cave", "Печера дракона"],
      ["Wizard tower", "Вежа чарівника"],
      ["Elven forest", "Ельфійський ліс"],
      ["Dwarven mine", "Гном'яча шахта"],
      ["Royal court", "Королівський двір"],
      ["Potion shop", "Крамниця зілля"],
      ["Magic market", "Магічний ринок"],
      ["Floating island", "Летючий острів"],
      ["Crystal palace", "Кришталевий палац"],
      ["Haunted swamp", "Зачароване болото"],
      ["Magic academy", "Академія магії"],
      ["Oracle temple", "Храм оракула"],
      ["Sky harbor", "Небесна гавань"],
      ["Mermaid lagoon", "Лагуна русалок"],
      ["Clockwork city", "Місто механізмів"],
      ["Phoenix nest", "Гніздо фенікса"],
      ["Cursed library", "Проклята бібліотека"],
      ["Giant garden", "Сад велетнів"],
      ["Mirror maze", "Дзеркальний лабіринт"],
      ["Enchanted bakery", "Чарівна пекарня"],
    ],
  },
  {
    id: "public-places",
    label: ["Public Places", "Громадські місця"],
    items: [
      ["City hall", "Мерія"],
      ["Shopping mall", "Торговий центр"],
      ["Central park", "Центральний парк"],
      ["Zoo", "Зоопарк"],
      ["Aquarium", "Океанаріум"],
      ["Train station hall", "Зала вокзалу"],
      ["Bus terminal", "Автовокзал"],
      ["Public bath", "Громадська лазня"],
      ["Community center", "Будинок культури"],
      ["University campus", "Університетське містечко"],
      ["Stadium entrance", "Вхід на стадіон"],
      ["City beach", "Міський пляж"],
      ["Wedding registry", "РАЦС"],
      ["Public square", "Міська площа"],
      ["Fountain plaza", "Площа з фонтаном"],
      ["Parking garage", "Паркінг"],
      ["Laundromat", "Пральня самообслуговування"],
      ["Public clinic", "Поліклініка"],
      ["Exhibition center", "Виставковий центр"],
      ["Observation deck", "Оглядовий майданчик"],
    ],
  },
  {
    id: "home-life",
    label: ["Home Life", "Побут"],
    items: [
      ["Apartment kitchen", "Кухня у квартирі"],
      ["Living room", "Вітальня"],
      ["Balcony", "Балкон"],
      ["Garage", "Гараж"],
      ["Laundry room", "Пральна кімната"],
      ["Elevator", "Ліфт"],
      ["Rooftop", "Дах"],
      ["Basement", "Підвал"],
      ["Garden shed", "Садовий сарай"],
      ["Student dorm", "Студентський гуртожиток"],
      ["Family dinner", "Сімейна вечеря"],
      ["Home office", "Домашній офіс"],
      ["Kids bedroom", "Дитяча кімната"],
      ["House party", "Домашня вечірка"],
      ["Repair workshop", "Майстерня для ремонту"],
      ["Shared hallway", "Спільний коридор"],
      ["Backyard", "Задній двір"],
      ["Guest room", "Гостьова кімната"],
      ["Pantry", "Комора"],
      ["Smart home showroom", "Шоурум розумного дому"],
    ],
  },
  {
    id: "events",
    label: ["Events", "Події"],
    items: [
      ["Wedding", "Весілля"],
      ["Conference", "Конференція"],
      ["Music festival", "Музичний фестиваль"],
      ["Hackathon", "Хакатон"],
      ["Charity auction", "Благодійний аукціон"],
      ["Graduation ceremony", "Випускний"],
      ["Fashion show", "Показ мод"],
      ["Comic convention", "Комік-конвенція"],
      ["Press briefing", "Пресбрифінг"],
      ["Product launch", "Запуск продукту"],
      ["Street parade", "Вуличний парад"],
      ["Food festival", "Фестиваль їжі"],
      ["Science conference", "Наукова конференція"],
      ["Award ceremony", "Церемонія нагородження"],
      ["Town meeting", "Міські збори"],
      ["New year party", "Новорічна вечірка"],
      ["Book presentation", "Презентація книги"],
      ["Open mic night", "Відкритий мікрофон"],
      ["Trade fair", "Ярмарок-продаж"],
      ["Secret Santa party", "Таємний Санта"],
    ],
  },
];

function toLocalizedText([en, uk]: Labels): LocalizedText {
  return { en, uk };
}

function createRole(
  packageId: string,
  placeIndex: number,
  roleIndex: number,
  label: Labels
): SpyRole {
  return {
    id: `${packageId}-place-${placeIndex + 1}-role-${roleIndex + 1}`,
    label: toLocalizedText(label),
  };
}

function createPlaceRoleLabel(
  template: RoleTemplate,
  placeLabel: Labels
): Labels {
  return [
    `${template.en}: ${placeLabel[0]}`,
    `${template.uk}: ${placeLabel[1]}`,
  ];
}

function createPlaceRoles(
  packageId: string,
  placeIndex: number,
  placeLabel: Labels
) {
  return getItemRoleTemplates(placeLabel[0]).map((template, roleIndex) =>
    createRole(
      packageId,
      placeIndex,
      roleIndex,
      createPlaceRoleLabel(template, placeLabel)
    )
  );
}

function createPlace(
  packageId: string,
  index: number,
  label: Labels
): SpyPlace {
  return {
    id: `${packageId}-place-${index + 1}`,
    label: toLocalizedText(label),
    roles: createPlaceRoles(packageId, index, label),
  };
}

function createPackage(seed: PackageSeed): SpyPackage {
  return {
    id: seed.id,
    label: toLocalizedText(seed.label),
    items: seed.items.map((item, index) => createPlace(seed.id, index, item)),
  };
}

export const builtinSpyPackages = packageSeeds.map(createPackage);

export const builtinSpyPackageIds = builtinSpyPackages.map(
  (contentPackage) => contentPackage.id
);

export function getBuiltinSpyPlaceCount() {
  return builtinSpyPackages.reduce(
    (total, contentPackage) => total + contentPackage.items.length,
    0
  );
}
