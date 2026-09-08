const TOOLS = [
  { id:"jwt", icon:"key-round", title:"JWT decoder", description:"Разбор заголовка и payload, проверка подписи", category:"Безопасность", shortcut:"⌘1" },
  { id:"base64", icon:"binary", title:"Base64", description:"Кодирование и декодирование строк и файлов", category:"Кодирование", shortcut:"⌘2" },
  { id:"qr", icon:"qr-code", title:"QR-генератор", description:"Ссылки, Wi-Fi, vCard, настройка коррекции", category:"Генераторы", shortcut:"⌘3", isNew:true },
  { id:"diff", icon:"file-diff", title:"Сравнение текстов", description:"Построчный и посимвольный diff", category:"Текст", shortcut:"⌘4" },
  { id:"json", icon:"braces", title:"JSON formatter", description:"Форматирование, минификация, валидация", category:"Кодирование", shortcut:"⌘5" },
  { id:"regex", icon:"regex", title:"Regex tester", description:"Проверка выражений и групп захвата", category:"Текст", shortcut:"⌘6" },
  { id:"hash", icon:"hash", title:"Хэши", description:"MD5, SHA-1, SHA-256, SHA-512", category:"Безопасность", shortcut:"⌘7" },
  { id:"uuid", icon:"fingerprint", title:"UUID / генераторы", description:"UUID v4/v7, случайные строки, пароли", category:"Генераторы", shortcut:"⌘8" },
  { id:"time", icon:"clock", title:"Timestamp", description:"Unix ↔ ISO 8601, часовые пояса", category:"Конвертеры", shortcut:"⌘9" },
  { id:"units", icon:"ruler", title:"Конвертер единиц", description:"Байты, длина, масса, температура", category:"Конвертеры" },
  { id:"color", icon:"palette", title:"Color tools", description:"HEX ↔ RGB ↔ OKLCH, контраст WCAG", category:"Дизайн" },
  { id:"url", icon:"link", title:"URL encode", description:"Percent-encoding и разбор query-строки", category:"Кодирование" }
];
const CATEGORIES = ["Все","Безопасность","Кодирование","Текст","Генераторы","Конвертеры","Дизайн"];
Object.assign(window, { TOOLS, CATEGORIES });
