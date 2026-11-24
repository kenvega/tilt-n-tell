// =====================================================================
//  CATEGORIES & WORDS
// =====================================================================
//  This is the file to edit when you want to change the game content.
//
//  - Categories appear on the home screen in the same order as here.
//    Reorder the blocks below to reorder the cards.
//  - `name`  -> shown to players (Spanish).
//  - `emoji` -> shown on the category card.
//  - `id`    -> internal only. Keep it unique, lowercase, no spaces.
//  - `words` -> shown to players (Spanish). Order does not matter,
//               words are shuffled at the start of every round.
//
//  To add a category, copy one block { ... }, paste it, and change it.
// =====================================================================

const CATEGORIES = [
  {
    id: "animals",
    name: "Animales",
    emoji: "🐘",
    words: [
      "Perro", "Gato", "Elefante", "Jirafa", "León", "Tigre", "Mono",
      "Cocodrilo", "Serpiente", "Tortuga", "Conejo", "Caballo", "Vaca",
      "Cerdo", "Gallina", "Pato", "Pingüino", "Delfín", "Tiburón",
      "Ballena", "Pulpo", "Cangrejo", "Medusa", "Águila", "Búho", "Loro",
      "Flamenco", "Murciélago", "Oso", "Oso panda", "Koala", "Canguro",
      "Cebra", "Hipopótamo", "Rinoceronte", "Camello", "Llama", "Perezoso",
      "Jaguar", "Lobo", "Zorro", "Ardilla", "Ratón", "Rana", "Mariposa",
      "Abeja", "Hormiga", "Araña", "Caracol", "Camaleón", "Avestruz",
      "Pavo real", "Colibrí", "Tucán", "Armadillo",
    ],
  },
  {
    id: "movies",
    name: "Películas",
    emoji: "🎬",
    words: [
      "Titanic", "El Rey León", "Toy Story", "Coco", "Intensa-Mente",
      "Buscando a Nemo", "Shrek", "Frozen", "Los Increíbles",
      "Monsters Inc.", "Up: Una Aventura de Altura", "Cars", "Ratatouille",
      "Mi Villano Favorito", "Minions", "La Era de Hielo", "Madagascar",
      "Kung Fu Panda", "Encanto", "Moana", "Enredados", "Zootopia",
      "La Sirenita", "La Bella y la Bestia", "Aladdín", "Mulán", "Hércules",
      "Tarzán", "Mi Pobre Angelito", "Volver al Futuro", "Jurassic Park",
      "Tiburón", "E.T.", "La Guerra de las Galaxias", "Harry Potter",
      "El Señor de los Anillos", "Piratas del Caribe", "Matrix",
      "El Padrino", "Rápidos y Furiosos", "Avengers", "Spider-Man",
      "Batman", "Superman", "Rocky", "Gladiador", "Avatar", "Jumanji",
      "Los Cazafantasmas", "Indiana Jones", "Terminator", "Forrest Gump",
      "Náufrago", "Hombres de Negro", "Barbie", "Roma", "Amores Perros",
      "No se Aceptan Devoluciones", "Relatos Salvajes",
    ],
  },
  {
    id: "actors",
    name: "Actores y actrices",
    emoji: "🌟",
    words: [
      "Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Johnny Depp",
      "Will Smith", "Tom Hanks", "Morgan Freeman", "Dwayne Johnson",
      "Arnold Schwarzenegger", "Sylvester Stallone", "Jackie Chan",
      "Jim Carrey", "Robin Williams", "Keanu Reeves", "Adam Sandler",
      "Robert Downey Jr.", "Chris Hemsworth", "Hugh Jackman",
      "Ryan Reynolds", "Vin Diesel", "Denzel Washington",
      "Samuel L. Jackson", "Tom Holland", "Daniel Radcliffe",
      "Jennifer Aniston", "Angelina Jolie", "Julia Roberts",
      "Scarlett Johansson", "Meryl Streep", "Nicole Kidman",
      "Margot Robbie", "Emma Watson", "Anne Hathaway", "Cameron Diaz",
      "Kate Winslet", "Zendaya", "Jenna Ortega", "Jennifer Lopez",
      "Salma Hayek", "Sofía Vergara", "Eugenio Derbez",
      "Gael García Bernal", "Diego Luna", "Pedro Pascal", "Oscar Isaac",
      "Zoe Saldaña", "Eva Longoria", "Ana de Armas", "Penélope Cruz",
      "Antonio Banderas", "Javier Bardem", "Ricardo Darín",
      "Benicio del Toro", "Danny Trejo", "Yalitza Aparicio",
      "Kate del Castillo", "Cantinflas", "Chespirito",
    ],
  },
  {
    id: "food",
    name: "Comida",
    emoji: "🌮",
    words: [
      "Tacos", "Empanadas", "Arepas", "Tamales", "Ceviche", "Pupusas",
      "Chilaquiles", "Guacamole", "Churros", "Dulce de leche", "Alfajores",
      "Mole", "Pozole", "Quesadilla", "Burrito", "Enchiladas", "Asado",
      "Choripán", "Milanesa", "Sushi", "Pizza", "Hamburguesa", "Hot dog",
      "Papas fritas", "Palomitas de maíz", "Helado", "Chocolate",
      "Pastel de cumpleaños", "Flan", "Gelatina", "Arroz con leche",
      "Pastel de tres leches", "Frijoles", "Huevo frito", "Panqueques",
      "Sandía", "Piña", "Mango", "Plátano", "Aguacate", "Fresa", "Limón",
      "Coco", "Uvas", "Manzana", "Cereal", "Sopa", "Ensalada", "Espagueti",
      "Lasaña", "Queso", "Tocino", "Pollo frito", "Camarones", "Nachos",
      "Donas", "Café", "Chicle", "Paleta",
    ],
  },
  {
    id: "actions",
    name: "Acciones",
    emoji: "🕺",
    words: [
      "Bailar", "Nadar", "Cocinar", "Dormir", "Roncar", "Estornudar",
      "Correr", "Saltar la cuerda", "Manejar", "Andar en bicicleta",
      "Cepillarse los dientes", "Bañarse", "Maquillarse", "Afeitarse",
      "Pescar", "Boxear", "Patinar", "Surfear", "Esquiar",
      "Tocar la guitarra", "Tocar el piano", "Tocar la batería", "Cantar",
      "Aplaudir", "Silbar", "Llorar", "Reír", "Bostezar", "Gritar",
      "Tomarse una selfie", "Escribir un mensaje", "Hablar por teléfono",
      "Barrer", "Lavar los platos", "Planchar", "Tender la cama",
      "Pintar una pared", "Jugar fútbol", "Jugar boliche", "Escalar",
      "Remar", "Montar a caballo", "Ordeñar una vaca", "Hacer yoga",
      "Hacer abdominales", "Meditar", "Levantar pesas", "Abrazar",
      "Hacer malabares", "Inflar un globo", "Cambiar un pañal",
      "Ponerse los zapatos",
    ],
  },
  {
    id: "places",
    name: "Lugares",
    emoji: "🗺️",
    words: [
      "Playa", "Hospital", "Escuela", "Aeropuerto", "Cine", "Supermercado",
      "Biblioteca", "Gimnasio", "Zoológico", "Museo", "Iglesia", "Estadio",
      "Parque de diversiones", "Circo", "Restaurante", "Panadería",
      "Farmacia", "Banco", "Cárcel", "Estación de bomberos", "Granja",
      "Bosque", "Desierto", "Montaña", "Volcán", "Isla", "Selva",
      "Machu Picchu", "Chichén Itzá", "Torre Eiffel",
      "Estatua de la Libertad", "Cristo Redentor", "Pirámides de Egipto",
      "Gran Muralla China", "Coliseo Romano", "Cataratas del Iguazú",
      "Torre de Pisa", "Disneylandia", "Las Vegas", "Nueva York", "París",
      "Tokio", "Polo Norte", "La Luna", "Antártida", "Río Amazonas",
      "Islas Galápagos", "Patagonia", "Hollywood", "Cancún",
    ],
  },
];
