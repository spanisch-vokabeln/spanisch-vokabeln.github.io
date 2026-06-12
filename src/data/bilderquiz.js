// Bilderquiz (babadum-Stil): Vokabeln mit Bild statt Text.
// Jedes Wort hat ENTWEDER `art` (handgecodetes animiertes SVG)
// ODER `emoji` (Fallback).
// Animations-Klassen (bq-pop, bq-blink, ...) sind in index.css definiert.

const svg = (inner) =>
  `<svg viewBox="0 0 100 100" width="100%" height="100%" class="bq-pop">${inner}</svg>`;

const ART = {
  perro: svg(`<g class="bq-an bq-sway"><ellipse cx="24" cy="42" rx="11" ry="20" fill="#8a5a32"/><ellipse cx="76" cy="42" rx="11" ry="20" fill="#8a5a32"/></g><circle cx="50" cy="50" r="30" fill="#b07d49"/><ellipse cx="50" cy="62" rx="20" ry="16" fill="#d9b48a"/><g class="bq-an bq-blink"><circle cx="40" cy="46" r="4.5" fill="#2c2118"/><circle cx="60" cy="46" r="4.5" fill="#2c2118"/></g><ellipse cx="50" cy="58" rx="6" ry="4.5" fill="#2c2118"/><path class="bq-an bq-tongue" d="M46 64 Q50 76 54 64 Z" fill="#e8728c"/>`),
  gato: svg(`<g class="bq-an bq-sway"><path d="M26 38 L20 14 L41 30 Z" fill="#e88c3a"/><path d="M74 38 L80 14 L59 30 Z" fill="#e88c3a"/></g><circle cx="50" cy="52" r="28" fill="#f0a04b"/><g class="bq-an bq-blink"><ellipse cx="40" cy="50" rx="4" ry="6" fill="#2c2118"/><ellipse cx="60" cy="50" rx="4" ry="6" fill="#2c2118"/></g><path d="M46 60 L54 60 L50 65 Z" fill="#e8728c"/><path d="M50 65 Q50 69 45 68 M50 65 Q50 69 55 68" stroke="#7a4a23" stroke-width="1.6" fill="none" stroke-linecap="round"/><g class="bq-an bq-wiggle" style="transform-origin:50px 62px" stroke="#9a8a7a" stroke-width="1.3" stroke-linecap="round"><line x1="38" y1="60" x2="18" y2="56"/><line x1="38" y1="63" x2="18" y2="64"/><line x1="62" y1="60" x2="82" y2="56"/><line x1="62" y1="63" x2="82" y2="64"/></g>`),
  pajaro: svg(`<g class="bq-an bq-float"><ellipse cx="48" cy="56" rx="26" ry="24" fill="#4ca6e0"/><circle cx="56" cy="40" r="15" fill="#4ca6e0"/><path d="M68 38 L88 33 L76 47 Z" fill="#f6a91b"/><circle cx="62" cy="36" r="4.5" fill="#fff"/><circle cx="63" cy="36" r="2.2" fill="#2c2118"/><g class="bq-an bq-flap" style="transform-origin:46px 52px"><ellipse cx="38" cy="58" rx="15" ry="9" fill="#2e8bc8"/></g><ellipse cx="26" cy="62" rx="10" ry="6" fill="#2e8bc8"/><path d="M44 79 L40 88 M54 79 L58 88" stroke="#f6a91b" stroke-width="3" stroke-linecap="round"/></g>`),
  pez: svg(`<g class="bq-an bq-float"><path d="M18 50 L36 36 L36 64 Z" fill="#e8702e"/><ellipse cx="58" cy="50" rx="28" ry="20" fill="#f2843c"/><path d="M56 31 L66 22 L72 35 Z" fill="#e8702e"/><path d="M40 50 Q49 44 49 50 Q49 56 40 50 Z" fill="#e8702e" opacity="0.5"/><circle cx="74" cy="46" r="4.8" fill="#fff"/><circle cx="75" cy="46" r="2.4" fill="#2c2118"/></g><g fill="#bfe6f5"><circle class="bq-an bq-rise" cx="84" cy="40" r="3"/><circle class="bq-an bq-rise" cx="90" cy="46" r="2.2" style="animation-delay:.7s"/></g>`),
  caballo: svg(`<g class="bq-an bq-sway"><path d="M34 30 L30 12 L43 26 Z" fill="#7a4a28"/><path d="M66 30 L70 12 L57 26 Z" fill="#7a4a28"/></g><path d="M36 30 Q35 70 50 82 Q65 70 64 30 Q50 22 36 30 Z" fill="#9c6233"/><ellipse cx="50" cy="71" rx="14" ry="12" fill="#b9824f"/><ellipse cx="44" cy="72" rx="2.5" ry="3.5" fill="#3a2414"/><ellipse cx="56" cy="72" rx="2.5" ry="3.5" fill="#3a2414"/><g class="bq-an bq-blink"><circle cx="42" cy="46" r="3.5" fill="#2c2118"/><circle cx="58" cy="46" r="3.5" fill="#2c2118"/></g><path d="M36 30 Q29 42 33 56 M50 23 Q49 38 50 52 M64 30 Q71 42 67 56" stroke="#5a3416" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  vaca: svg(`<g class="bq-an bq-sway"><ellipse cx="20" cy="42" rx="10" ry="7" fill="#f0d9c0"/><ellipse cx="80" cy="42" rx="10" ry="7" fill="#f0d9c0"/></g><path d="M35 26 Q32 17 39 19 Q41 26 39 31 Z" fill="#d8d2c8"/><path d="M65 26 Q68 17 61 19 Q59 26 61 31 Z" fill="#d8d2c8"/><ellipse cx="50" cy="52" rx="30" ry="28" fill="#fbfbf8"/><ellipse cx="35" cy="42" rx="9" ry="12" fill="#2c2c2a"/><ellipse cx="65" cy="58" rx="7" ry="6" fill="#2c2c2a"/><g class="bq-an bq-blink"><circle cx="40" cy="46" r="5" fill="#fbfbf8"/><circle cx="40" cy="46" r="3" fill="#2c2118"/><circle cx="60" cy="46" r="5" fill="#fbfbf8"/><circle cx="60" cy="46" r="3" fill="#2c2118"/></g><ellipse cx="50" cy="68" rx="18" ry="13" fill="#f2b8c6"/><ellipse cx="43" cy="67" rx="3" ry="4" fill="#c97a90"/><ellipse cx="57" cy="67" rx="3" ry="4" fill="#c97a90"/>`),
  conejo: svg(`<g class="bq-an bq-sway" style="transform-origin:50px 52px"><ellipse cx="40" cy="24" rx="7" ry="20" fill="#f2ece6"/><ellipse cx="40" cy="26" rx="3" ry="13" fill="#f2b8c6"/><ellipse cx="60" cy="24" rx="7" ry="20" fill="#f2ece6"/><ellipse cx="60" cy="26" rx="3" ry="13" fill="#f2b8c6"/></g><circle cx="50" cy="58" r="26" fill="#f6f1ec"/><g class="bq-an bq-blink"><circle cx="41" cy="54" r="4" fill="#2c2118"/><circle cx="59" cy="54" r="4" fill="#2c2118"/></g><path d="M47 62 L53 62 L50 66 Z" fill="#e88ca0"/><path d="M50 66 L50 69 M50 69 Q46 71 44 69 M50 69 Q54 71 56 69" stroke="#b89a86" stroke-width="1.4" fill="none" stroke-linecap="round"/><g class="bq-an bq-wiggle" style="transform-origin:50px 64px" stroke="#cbb8a8" stroke-width="1.2" stroke-linecap="round"><line x1="42" y1="64" x2="24" y2="60"/><line x1="42" y1="66" x2="24" y2="68"/><line x1="58" y1="64" x2="76" y2="60"/><line x1="58" y1="66" x2="76" y2="68"/></g>`)
};

export const bilderquizThemes = [
  {
    id: 'animales', title: 'Tiere', emoji: '🐾',
    words: [
      { es: 'el perro', de: 'der Hund', art: ART.perro },
      { es: 'el gato', de: 'die Katze', art: ART.gato },
      { es: 'el pájaro', de: 'der Vogel', art: ART.pajaro },
      { es: 'el pez', de: 'der Fisch', art: ART.pez },
      { es: 'el caballo', de: 'das Pferd', art: ART.caballo },
      { es: 'la vaca', de: 'die Kuh', art: ART.vaca },
      { es: 'el conejo', de: 'das Kaninchen', art: ART.conejo },
      { es: 'el ratón', de: 'die Maus', emoji: '🐭' },
      { es: 'el oso', de: 'der Bär', emoji: '🐻' },
      { es: 'el león', de: 'der Löwe', emoji: '🦁' },
      { es: 'el elefante', de: 'der Elefant', emoji: '🐘' },
      { es: 'el mono', de: 'der Affe', emoji: '🐵' },
      { es: 'el cerdo', de: 'das Schwein', emoji: '🐷' },
      { es: 'la oveja', de: 'das Schaf', emoji: '🐑' },
      { es: 'la gallina', de: 'das Huhn', emoji: '🐔' },
      { es: 'el pato', de: 'die Ente', emoji: '🦆' },
      { es: 'el tigre', de: 'der Tiger', emoji: '🐯' },
      { es: 'el zorro', de: 'der Fuchs', emoji: '🦊' },
      { es: 'el lobo', de: 'der Wolf', emoji: '🐺' },
      { es: 'la rana', de: 'der Frosch', emoji: '🐸' },
      { es: 'la tortuga', de: 'die Schildkröte', emoji: '🐢' },
      { es: 'la serpiente', de: 'die Schlange', emoji: '🐍' },
      { es: 'la abeja', de: 'die Biene', emoji: '🐝' },
      { es: 'la mariposa', de: 'der Schmetterling', emoji: '🦋' },
      { es: 'el pingüino', de: 'der Pinguin', emoji: '🐧' },
      { es: 'el delfín', de: 'der Delfin', emoji: '🐬' }
    ]
  },
  {
    id: 'comida', title: 'Essen', emoji: '🍎',
    words: [
      { es: 'la manzana', de: 'der Apfel', emoji: '🍎' },
      { es: 'el plátano', de: 'die Banane', emoji: '🍌' },
      { es: 'la naranja', de: 'die Orange', emoji: '🍊' },
      { es: 'las uvas', de: 'die Trauben', emoji: '🍇' },
      { es: 'la fresa', de: 'die Erdbeere', emoji: '🍓' },
      { es: 'la sandía', de: 'die Wassermelone', emoji: '🍉' },
      { es: 'el limón', de: 'die Zitrone', emoji: '🍋' },
      { es: 'la pera', de: 'die Birne', emoji: '🍐' },
      { es: 'la cereza', de: 'die Kirsche', emoji: '🍒' },
      { es: 'el melocotón', de: 'der Pfirsich', emoji: '🍑' },
      { es: 'la piña', de: 'die Ananas', emoji: '🍍' },
      { es: 'el coco', de: 'die Kokosnuss', emoji: '🥥' },
      { es: 'el pan', de: 'das Brot', emoji: '🍞' },
      { es: 'el queso', de: 'der Käse', emoji: '🧀' },
      { es: 'el huevo', de: 'das Ei', emoji: '🥚' },
      { es: 'la carne', de: 'das Fleisch', emoji: '🥩' },
      { es: 'la leche', de: 'die Milch', emoji: '🥛' },
      { es: 'el café', de: 'der Kaffee', emoji: '☕' },
      { es: 'la pizza', de: 'die Pizza', emoji: '🍕' },
      { es: 'la hamburguesa', de: 'der Hamburger', emoji: '🍔' },
      { es: 'el helado', de: 'das Eis', emoji: '🍦' },
      { es: 'el pastel', de: 'der Kuchen', emoji: '🍰' },
      { es: 'el tomate', de: 'die Tomate', emoji: '🍅' },
      { es: 'la zanahoria', de: 'die Karotte', emoji: '🥕' },
      { es: 'la patata', de: 'die Kartoffel', emoji: '🥔' },
      { es: 'el maíz', de: 'der Mais', emoji: '🌽' }
    ]
  },
  {
    id: 'cuerpo', title: 'Körper', emoji: '👁️',
    words: [
      { es: 'el ojo', de: 'das Auge', emoji: '👁️' },
      { es: 'la oreja', de: 'das Ohr', emoji: '👂' },
      { es: 'la nariz', de: 'die Nase', emoji: '👃' },
      { es: 'la boca', de: 'der Mund', emoji: '👄' },
      { es: 'la mano', de: 'die Hand', emoji: '✋' },
      { es: 'el pie', de: 'der Fuß', emoji: '🦶' },
      { es: 'el brazo', de: 'der Arm', emoji: '💪' },
      { es: 'la pierna', de: 'das Bein', emoji: '🦵' },
      { es: 'el diente', de: 'der Zahn', emoji: '🦷' },
      { es: 'la lengua', de: 'die Zunge', emoji: '👅' },
      { es: 'el cerebro', de: 'das Gehirn', emoji: '🧠' },
      { es: 'el corazón', de: 'das Herz', emoji: '❤️' },
      { es: 'el hueso', de: 'der Knochen', emoji: '🦴' }
    ]
  },
  {
    id: 'casa', title: 'Haus', emoji: '🏠',
    words: [
      { es: 'la casa', de: 'das Haus', emoji: '🏠' },
      { es: 'la puerta', de: 'die Tür', emoji: '🚪' },
      { es: 'la ventana', de: 'das Fenster', emoji: '🪟' },
      { es: 'la cama', de: 'das Bett', emoji: '🛏️' },
      { es: 'la silla', de: 'der Stuhl', emoji: '🪑' },
      { es: 'el sofá', de: 'das Sofa', emoji: '🛋️' },
      { es: 'la bañera', de: 'die Badewanne', emoji: '🛁' },
      { es: 'la ducha', de: 'die Dusche', emoji: '🚿' },
      { es: 'la lámpara', de: 'die Lampe', emoji: '💡' },
      { es: 'la llave', de: 'der Schlüssel', emoji: '🔑' },
      { es: 'el reloj', de: 'die Uhr', emoji: '🕐' },
      { es: 'la televisión', de: 'der Fernseher', emoji: '📺' },
      { es: 'el teléfono', de: 'das Telefon', emoji: '📱' },
      { es: 'el ordenador', de: 'der Computer', emoji: '💻' },
      { es: 'el libro', de: 'das Buch', emoji: '📚' },
      { es: 'la vela', de: 'die Kerze', emoji: '🕯️' },
      { es: 'el espejo', de: 'der Spiegel', emoji: '🪞' }
    ]
  },
  {
    id: 'ropa', title: 'Kleidung', emoji: '👕',
    words: [
      { es: 'la camiseta', de: 'das T-Shirt', emoji: '👕' },
      { es: 'el pantalón', de: 'die Hose', emoji: '👖' },
      { es: 'el vestido', de: 'das Kleid', emoji: '👗' },
      { es: 'el zapato', de: 'der Schuh', emoji: '👟' },
      { es: 'la bota', de: 'der Stiefel', emoji: '👢' },
      { es: 'el sombrero', de: 'der Hut', emoji: '🎩' },
      { es: 'la gorra', de: 'die Mütze', emoji: '🧢' },
      { es: 'el calcetín', de: 'die Socke', emoji: '🧦' },
      { es: 'el guante', de: 'der Handschuh', emoji: '🧤' },
      { es: 'la bufanda', de: 'der Schal', emoji: '🧣' },
      { es: 'el abrigo', de: 'der Mantel', emoji: '🧥' },
      { es: 'la corbata', de: 'die Krawatte', emoji: '👔' },
      { es: 'las gafas', de: 'die Brille', emoji: '👓' },
      { es: 'el bolso', de: 'die Handtasche', emoji: '👜' },
      { es: 'la mochila', de: 'der Rucksack', emoji: '🎒' },
      { es: 'el anillo', de: 'der Ring', emoji: '💍' },
      { es: 'el paraguas', de: 'der Regenschirm', emoji: '☂️' }
    ]
  },
  {
    id: 'naturaleza', title: 'Natur', emoji: '🌳',
    words: [
      { es: 'el árbol', de: 'der Baum', emoji: '🌳' },
      { es: 'la flor', de: 'die Blume', emoji: '🌸' },
      { es: 'el sol', de: 'die Sonne', emoji: '☀️' },
      { es: 'la luna', de: 'der Mond', emoji: '🌙' },
      { es: 'la estrella', de: 'der Stern', emoji: '⭐' },
      { es: 'la nube', de: 'die Wolke', emoji: '☁️' },
      { es: 'la lluvia', de: 'der Regen', emoji: '🌧️' },
      { es: 'la nieve', de: 'der Schnee', emoji: '❄️' },
      { es: 'el fuego', de: 'das Feuer', emoji: '🔥' },
      { es: 'la montaña', de: 'der Berg', emoji: '⛰️' },
      { es: 'el volcán', de: 'der Vulkan', emoji: '🌋' },
      { es: 'el mar', de: 'das Meer', emoji: '🌊' },
      { es: 'la hoja', de: 'das Blatt', emoji: '🍂' },
      { es: 'el cactus', de: 'der Kaktus', emoji: '🌵' },
      { es: 'la seta', de: 'der Pilz', emoji: '🍄' },
      { es: 'el arcoíris', de: 'der Regenbogen', emoji: '🌈' },
      { es: 'el rayo', de: 'der Blitz', emoji: '⚡' }
    ]
  },
  {
    id: 'transporte', title: 'Transport', emoji: '🚗',
    words: [
      { es: 'el coche', de: 'das Auto', emoji: '🚗' },
      { es: 'el autobús', de: 'der Bus', emoji: '🚌' },
      { es: 'el tren', de: 'der Zug', emoji: '🚆' },
      { es: 'el avión', de: 'das Flugzeug', emoji: '✈️' },
      { es: 'el barco', de: 'das Schiff', emoji: '🚢' },
      { es: 'la bicicleta', de: 'das Fahrrad', emoji: '🚲' },
      { es: 'la moto', de: 'das Motorrad', emoji: '🏍️' },
      { es: 'el camión', de: 'der Lastwagen', emoji: '🚚' },
      { es: 'el taxi', de: 'das Taxi', emoji: '🚕' },
      { es: 'el helicóptero', de: 'der Hubschrauber', emoji: '🚁' },
      { es: 'el cohete', de: 'die Rakete', emoji: '🚀' },
      { es: 'el tractor', de: 'der Traktor', emoji: '🚜' },
      { es: 'la ambulancia', de: 'der Krankenwagen', emoji: '🚑' },
      { es: 'el globo', de: 'der Luftballon', emoji: '🎈' }
    ]
  },
  {
    id: 'colores', title: 'Farben', emoji: '🎨',
    words: [
      { es: 'rojo', de: 'rot', emoji: '🔴' },
      { es: 'azul', de: 'blau', emoji: '🔵' },
      { es: 'verde', de: 'grün', emoji: '🟢' },
      { es: 'amarillo', de: 'gelb', emoji: '🟡' },
      { es: 'naranja', de: 'orange', emoji: '🟠' },
      { es: 'morado', de: 'lila', emoji: '🟣' },
      { es: 'negro', de: 'schwarz', emoji: '⚫' },
      { es: 'blanco', de: 'weiß', emoji: '⚪' },
      { es: 'marrón', de: 'braun', emoji: '🟤' }
    ]
  },
  {
    id: 'numeros', title: 'Zahlen', emoji: '🔢',
    words: [
      { es: 'cero', de: 'null', emoji: '0️⃣' },
      { es: 'uno', de: 'eins', emoji: '1️⃣' },
      { es: 'dos', de: 'zwei', emoji: '2️⃣' },
      { es: 'tres', de: 'drei', emoji: '3️⃣' },
      { es: 'cuatro', de: 'vier', emoji: '4️⃣' },
      { es: 'cinco', de: 'fünf', emoji: '5️⃣' },
      { es: 'seis', de: 'sechs', emoji: '6️⃣' },
      { es: 'siete', de: 'sieben', emoji: '7️⃣' },
      { es: 'ocho', de: 'acht', emoji: '8️⃣' },
      { es: 'nueve', de: 'neun', emoji: '9️⃣' },
      { es: 'diez', de: 'zehn', emoji: '🔟' }
    ]
  },
  {
    id: 'deportes', title: 'Sport', emoji: '⚽',
    words: [
      { es: 'el fútbol', de: 'Fußball', emoji: '⚽' },
      { es: 'el baloncesto', de: 'Basketball', emoji: '🏀' },
      { es: 'el tenis', de: 'Tennis', emoji: '🎾' },
      { es: 'el béisbol', de: 'Baseball', emoji: '⚾' },
      { es: 'el golf', de: 'Golf', emoji: '⛳' },
      { es: 'el boxeo', de: 'Boxen', emoji: '🥊' },
      { es: 'la natación', de: 'Schwimmen', emoji: '🏊' },
      { es: 'el ciclismo', de: 'Radfahren', emoji: '🚴' },
      { es: 'el esquí', de: 'Skifahren', emoji: '🎿' },
      { es: 'el surf', de: 'Surfen', emoji: '🏄' },
      { es: 'el trofeo', de: 'die Trophäe', emoji: '🏆' },
      { es: 'la medalla', de: 'die Medaille', emoji: '🏅' },
      { es: 'el ajedrez', de: 'Schach', emoji: '♟️' },
      { es: 'la diana', de: 'die Zielscheibe', emoji: '🎯' }
    ]
  },
  {
    id: 'musica', title: 'Musik', emoji: '🎸',
    words: [
      { es: 'la guitarra', de: 'die Gitarre', emoji: '🎸' },
      { es: 'el piano', de: 'das Klavier', emoji: '🎹' },
      { es: 'el tambor', de: 'die Trommel', emoji: '🥁' },
      { es: 'la trompeta', de: 'die Trompete', emoji: '🎺' },
      { es: 'el violín', de: 'die Geige', emoji: '🎻' },
      { es: 'el micrófono', de: 'das Mikrofon', emoji: '🎤' },
      { es: 'los auriculares', de: 'die Kopfhörer', emoji: '🎧' },
      { es: 'el saxofón', de: 'das Saxofon', emoji: '🎷' }
    ]
  }
];
