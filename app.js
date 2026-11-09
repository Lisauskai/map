/**
 * map.lisauskai.lt – „Lisauskų kelionės“ interaktyvus kelionių žemėlapis
 * Grynas Vanilla JS + Leaflet.js (Esri World Street Map) + keliones.json + Pasaulio šalių GeoJSON + Admin režimas
 */

// Vieši patikimi pasaulio šalių GeoJSON šaltiniai iš raw.githubusercontent.com (atitinka CSP taisykles)
const WORLD_GEOJSON_URLS = [
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
    'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
];

// Standartinis šeimos narių sąrašas
const DEFAULT_TRAVELERS = ['Tomas', 'Sandra', 'Lukas', 'Linas'];

// Naršyklės Intl.DisplayNames API šalių ISO-2 kodų vertimui į lietuvių kalbą
const regionDisplayNamesLt =
    typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
        ? new Intl.DisplayNames(['lt'], { type: 'region' })
        : null;

// Atsarginis lietuviškų šalių pavadinimų žodynas pagal ISO-2 kodą
const COUNTRY_NAMES_LT = {
    LT: 'Lietuva',
    LV: 'Latvija',
    EE: 'Estija',
    FI: 'Suomija',
    PL: 'Lenkija',
    DE: 'Vokietija',
    CZ: 'Čekija',
    RS: 'Serbija',
    IT: 'Italija',
    MT: 'Malta',
    HR: 'Kroatija',
    GR: 'Graikija',
    FR: 'Prancūzija',
    ES: 'Ispanija',
    IL: 'Izraelis',
    EG: 'Egiptas',
    XK: 'Kosovas'
};

// Pagalbinis ISO-3 -> ISO-2 žemėlapis (kai kuriuose GeoJSON šaltiniuose, pvz. Prancūzijai ar Norvegijai, ISO_A2 būna "-99")
const ISO3_TO_ISO2 = {
    LTU: 'LT',
    LVA: 'LV',
    EST: 'EE',
    FIN: 'FI',
    POL: 'PL',
    DEU: 'DE',
    CZE: 'CZ',
    SRB: 'RS',
    ITA: 'IT',
    MLT: 'MT',
    HRV: 'HR',
    GRC: 'GR',
    FRA: 'FR',
    ESP: 'ES',
    ISR: 'IL',
    EGY: 'EG',
    NOR: 'NO',
    SWE: 'SE',
    DNK: 'DK',
    GBR: 'GB',
    IRL: 'IE',
    ISL: 'IS',
    NLD: 'NL',
    BEL: 'BE',
    LUX: 'LU',
    CHE: 'CH',
    AUT: 'AT',
    PRT: 'PT',
    SVK: 'SK',
    HUN: 'HU',
    SVN: 'SI',
    BIH: 'BA',
    MNE: 'ME',
    MKD: 'MK',
    ALB: 'AL',
    ROU: 'RO',
    BGR: 'BG',
    UKR: 'UA',
    BLR: 'BY',
    MDA: 'MD',
    TUR: 'TR',
    CYP: 'CY',
    GEO: 'GE',
    ARM: 'AM',
    AZE: 'AZ',
    MAR: 'MA',
    TUN: 'TN',
    DZA: 'DZ',
    LBY: 'LY',
    JOR: 'JO',
    LBN: 'LB',
    SYR: 'SY',
    SAU: 'SA',
    ARE: 'AE',
    XKX: 'XK',
    KOS: 'XK'
};

// Atsarginiai duomenys (jei index.html atidaromas tiesiogiai per file:// protokolą be serverio)
const FALLBACK_DATA = {
    visitedCountries: [
        'LT', 'LV', 'EE', 'FI', 'SE', 'DK', 'PL', 'SK', 'DE', 'CZ',
        'RS', 'IT', 'VA', 'MT', 'HR', 'GR', 'FR', 'ES', 'IL', 'EG'
    ],
    places: [
        {
            id: 1,
            title: 'Talinas',
            country: 'Estija',
            lat: 59.437,
            lng: 24.7536,
            date: '2026-10-26',
            category: 'Automobiliu',
            description: 'PROTO atradimų centras, Talino jūrų muziejus „Lennusadam“ ir nusileidimas į tikrą povandeninį laivą, 314 m Talino televizijos bokštas, Kadriorgo rūmų parkas, zoologijos sodas ir senamiestis.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Talinas: PROTO atradimų centras ir jūrų muziejus Lennusadam',
                    url: 'https://www.youtube.com/watch?v=tisL0y7fcOw'
                },
                {
                    title: 'Talino TV bokštas, Kadriorgo parkas ir senamiestis',
                    url: 'https://www.youtube.com/watch?v=tisL0y7fcOw',
                    timestamp: '13:00'
                }
            ]
        },
        {
            id: 2,
            title: 'Jegalos krioklys (Jägala)',
            country: 'Estija',
            lat: 59.45,
            lng: 25.1786,
            date: '2026-10-26',
            category: 'Automobiliu',
            description: 'Estijos Niagara – pats plačiausias natūralus krioklys Estijoje, kurio galinga tamsaus vandens srovė per tūkstantmečius išgraužė gilų kanjoną.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Jegalos krioklys (Estijos Niagara)',
                    url: 'https://www.youtube.com/watch?v=tisL0y7fcOw',
                    timestamp: '17:22'
                }
            ]
        },
        {
            id: 3,
            title: 'Helsinkis',
            country: 'Suomija',
            lat: 60.1699,
            lng: 24.9384,
            date: '2026-10-26',
            category: 'Keltas',
            description: 'Kelionė didžiuliu keltu per Baltijos jūrą į Helsinkį: raudonų plytų Uspenskio soboras, sniego baltumo Helsinkio katedra ir tiesiog kietame granite iškalta Tempeliaukio (Uolos) bažnyčia.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Keltas į Suomiją ir didžioji parduotuvė ant vandens',
                    url: 'https://www.youtube.com/watch?v=tisL0y7fcOw',
                    timestamp: '07:55'
                },
                {
                    title: 'Helsinkio katedra ir Uspenskio soboras',
                    url: 'https://www.youtube.com/watch?v=tisL0y7fcOw',
                    timestamp: '08:55'
                }
            ]
        },
        {
            id: 4,
            title: 'Vanta (Mokslo centras „Heureka“)',
            country: 'Suomija',
            lat: 60.2876,
            lng: 25.044,
            date: '2026-10-26',
            category: 'Keltas',
            description: 'Interaktyvus Suomijos mokslo centras „Heureka“ Vantos mieste, kur viską privaloma liesti: Mėnulio gravitacijos simuliatorius ir judantys ledynmečio milžinai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: '„Heureka“ mokslo centras Suomijoje',
                    url: 'https://www.youtube.com/watch?v=tisL0y7fcOw',
                    timestamp: '09:12'
                }
            ]
        },
        {
            id: 5,
            title: 'Tartu',
            country: 'Estija',
            lat: 58.378,
            lng: 26.729,
            date: '2024-05-18',
            category: 'Automobiliu',
            description: 'Savaitgalio kelionė į Estijos mokslo sostinę Tartu: Tartu universiteto muziejus, interaktyvus AHHAA mokslo centras ir Estijos aviacijos muziejus.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Savaitgalio kelionė į Tartu Estijoje',
                    url: 'https://www.youtube.com/watch?v=4M7GnncBZ_w'
                }
            ]
        },
        {
            id: 6,
            title: 'Genuja',
            country: 'Italija',
            lat: 44.4056,
            lng: 8.9463,
            date: '2026-04-03',
            category: 'Kruizas',
            description: 'Senasis Genujos uostas, povandeninis laivas „Nazario Sauro“, Galata jūrų muziejus, Vaikų miestas, didžiausias Italijoje akvariumas, stiklinė „Biosfera“, Šv. Lauryno katedra ir įlaipinimas į „Costa Pacifica“.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Genuja: akvariumas, povandeninis laivas ir senamiestis',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ'
                },
                {
                    title: 'Lipame į „Costa Pacifica“ laivą! Laivo apžvalga',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ',
                    timestamp: '09:01'
                }
            ]
        },
        {
            id: 7,
            title: 'Marselis',
            country: 'Prancūzija',
            lat: 43.2965,
            lng: 5.3698,
            date: '2026-04-04',
            category: 'Kruizas',
            description: 'Seniausias Prancūzijos miestas: Senasis uostas (Vieux-Port), ant karinio forto pamatų stovinti „Notre-Dame de la Garde“ bazilika, Marselio katedra ir įspūdingi Longšano rūmai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Marselis: pavasariška katedra ir Longšano rūmai',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ',
                    timestamp: '12:58'
                },
                {
                    title: 'Didžioji kelionė laivu: Marselio uostas ir senamiestis',
                    url: 'https://www.youtube.com/watch?v=Dzx40lPQNEw'
                }
            ]
        },
        {
            id: 8,
            title: 'Valensija',
            country: 'Ispanija',
            lat: 39.4699,
            lng: -0.3763,
            date: '2026-04-05',
            category: 'Kruizas',
            description: 'Serranų vartai, prancūziška vintažinė saldumynų krautuvėlė „La Cure Gourmande“, Valensijos rotušė ir katedra, kurioje saugomas Šventasis Gralis.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Valensija: Katedra, Šventasis Gralis ir Serranų vartai',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ',
                    timestamp: '15:15'
                }
            ]
        },
        {
            id: 9,
            title: 'Roma ir Vatikanas',
            country: 'Italija',
            lat: 41.8902,
            lng: 12.4922,
            date: '2026-04-06',
            category: 'Kruizas',
            description: 'Didysis penktadienis Romoje: Švč. Mergelės Marijos Didžioji bazilika, Koliziejus, Trevi fontanas, Šv. Ignaco Lojolos bažnyčia su optine kupolo iliuzija ir Vatikanas su Berninio kolonada.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Romos šurmulys: Koliziejaus inžinerija ir fontanai',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ',
                    timestamp: '16:58'
                },
                {
                    title: 'Vatikanas ir Šv. Petro aikštė',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ',
                    timestamp: '19:44'
                }
            ]
        },
        {
            id: 10,
            title: 'Komo (Komo ežeras)',
            country: 'Italija',
            lat: 45.8081,
            lng: 9.0852,
            date: '2026-04-08',
            category: 'Kruizas',
            description: 'Ramybės oazė prie Komo ežero: kėlimasis istoriniu funikulieriumi į Brunate ir Komo katedra, kurios erdvę užpildo 6500 vargonų vamzdžių.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Komo ežeras: istorinis funikulierius ir katedra',
                    url: 'https://www.youtube.com/watch?v=2OGoZGgiStQ',
                    timestamp: '20:31'
                }
            ]
        },
        {
            id: 11,
            title: 'Neapolis ir Pompėja',
            country: 'Italija',
            lat: 40.8518,
            lng: 14.2681,
            date: '2025-11-12',
            category: 'Kruizas',
            description: 'Sustojęs laikas Pompėjoje po Vezuvijaus pelenais bei chaotiškas, bet nuostabus Neapolis: Castel Nuovo pilis, Galleria Umberto I ir Piazza del Plebiscito.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Pompėja ir Neapolis kruizo su Costa metu',
                    url: 'https://www.youtube.com/watch?v=Dzx40lPQNEw'
                }
            ]
        },
        {
            id: 12,
            title: 'Piza',
            country: 'Italija',
            lat: 43.7228,
            lng: 10.4017,
            date: '2025-11-14',
            category: 'Kruizas',
            description: 'Stebuklų aikštė (Piazza dei Miracoli), garsusis pasviręs Pizos bokštas ir didžiausia Italijos krikštykla.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Piza: Stebuklų aikštė ir pasviręs bokštas',
                    url: 'https://www.youtube.com/watch?v=Dzx40lPQNEw'
                }
            ]
        },
        {
            id: 13,
            title: 'Milanas',
            country: 'Italija',
            lat: 45.4642,
            lng: 9.19,
            date: '2025-11-15',
            category: 'Kruizas',
            description: 'Stiliaus ir architektūros sostinė: didingoji Milano katedra (Duomo), Galleria Vittorio Emanuele II ir Leonardo da Vinčio mokslo bei technikos muziejus su povandeniniu laivu.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Milanas: Duomo katedra ir Leonardo da Vinčio muziejus',
                    url: 'https://www.youtube.com/watch?v=Dzx40lPQNEw'
                }
            ]
        },
        {
            id: 14,
            title: 'Tel Avivas ir Jafa',
            country: 'Izraelis',
            lat: 32.0853,
            lng: 34.7818,
            date: '2026-06-14',
            category: 'Lėktuvu',
            description: 'Atostogos karo fone: kontrastingi Tel Avivo kvartalai, Jafos senamiestis, požeminės slėptuvės ir skubus išvykimas autobusu per Eilatą link Egipto sienos.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Tel Avivas: Atostogos karo fone ir pabėgimas namo',
                    url: 'https://www.youtube.com/watch?v=kDnEL0Dql9E'
                }
            ]
        },
        {
            id: 15,
            title: 'Šarm el Šeichas',
            country: 'Egiptas',
            lat: 27.9158,
            lng: 34.3299,
            date: '2026-06-16',
            category: 'Lėktuvu',
            description: 'Naktinė kelionė per Sinajaus pusiasalio kalnus iš Eilato į Šarm el Šeichą: Koptų bažnyčia, Senasis turgus, Raudonosios jūros pakrantė ir skrydis namo.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Kelionė per Egiptą ir Šarm el Šeicho kontrastai',
                    url: 'https://www.youtube.com/watch?v=kDnEL0Dql9E'
                }
            ]
        },
        {
            id: 16,
            title: 'Gdanskas ir Gdynė',
            country: 'Lenkija',
            lat: 54.352,
            lng: 18.6466,
            date: '2025-08-10',
            category: 'Automobiliu',
            description: 'Antrojo pasaulinio karo muziejus, Europos Solidarumo centras, Hevelianum, Gintaro muziejus, piratų kruizas ir zoologijos sodas Gdanske bei Experyment mokslo centras, akvariumas ir laivai „Dar Pomorza“ bei „Błyskawica“ Gdynėje.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Šeimos nuotykiai Gdanske ir Gdynėje: geriausi muziejai',
                    url: 'https://www.youtube.com/watch?v=J05wRJiTrCU'
                }
            ]
        },
        {
            id: 17,
            title: 'Pieninų nacionalinis parkas (Červeny Klaštor)',
            country: 'Slovakija',
            lat: 49.3906,
            lng: 20.415,
            date: '2025-07-15',
            category: 'Automobiliu',
            description: '14 km plaukimas mediniais plaustais Dunajeco upe su vietiniais guraliais, Trijų Karūnų ir Sokolicos kalnų panoramos bei tradicinė vakaronė „Chata Pieniny“.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Slovakija, Pieninų nacionalinis parkas | Plaustais per Dunajeco upę',
                    url: 'https://www.youtube.com/watch?v=EDL2-X0IWQY'
                }
            ]
        },
        {
            id: 18,
            title: 'Belianskos urvas (Tatranská Kotlina)',
            country: 'Slovakija',
            lat: 49.2289,
            lng: 20.3119,
            date: '2025-07-16',
            category: 'Automobiliu',
            description: 'Vienas lankomiausių urvų Slovakijoje su įspūdingais kalcito dariniais ir požeminiais kriokliais: 1370 m apžvalginis maršrutas ir 874 laipteliai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Belianskos urvas (Belianska jaskyňa), Slovakija',
                    url: 'https://www.youtube.com/watch?v=e50utBjoJKI'
                }
            ]
        },
        {
            id: 19,
            title: 'Aukštieji Tatrai (Skalnaté Pleso, Hrebienok)',
            country: 'Slovakija',
            lat: 49.1892,
            lng: 20.2342,
            date: '2025-07-17',
            category: 'Automobiliu',
            description: 'Žygis pėsčiomis Aukštuosiuose Tatruose nuo Skalnaté Pleso (1751 m) iki kalnų trobelės „Zamkovského chata“, Mala Studena slėnio kriokliai ir nusileidimas funikulieriumi iš Hrebienok.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Slovakija, Aukštieji Tatrai: Skalnaté Pleso, Zamkovského, Hrebienok',
                    url: 'https://www.youtube.com/watch?v=9oYXBmTmT2M'
                }
            ]
        },
        {
            id: 20,
            title: 'Bratislava',
            country: 'Slovakija',
            lat: 48.1486,
            lng: 17.1077,
            date: '2024-07-20',
            category: 'Automobiliu',
            description: 'Pažintis su Slovakijos sostine Bratislava: pasivaikščiojimas po jaukų senamiestį, Dunojaus pakrantę ir Bratislavos pilies apylinkes.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Bratislava, Slovakija',
                    url: 'https://www.youtube.com/watch?v=lt1ehqjNtys'
                }
            ]
        },
        {
            id: 21,
            title: 'Dortmundas',
            country: 'Vokietija',
            lat: 51.5136,
            lng: 7.4653,
            date: '2025-05-10',
            category: 'Lėktuvu',
            description: 'Savaitgalio išvyka į Dortmundą: Alaus gamykla-muziejus, Vokietijos futbolo muziejus, Westfalenpark ir Florianturm TV bokštas, PACE automobilių muziejus bei „Phoenix des Lumières“ šviesų instaliacija.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Dortmundas, Vokietija',
                    url: 'https://www.youtube.com/watch?v=eM8Rk7kEekU'
                }
            ]
        },
        {
            id: 22,
            title: 'Karlshamnas',
            country: 'Švedija',
            lat: 56.1703,
            lng: 14.8631,
            date: '2025-04-12',
            category: 'Keltas',
            description: 'Kelionė DFDS keltu „Luna Seaways“ į Karlshamną Švedijoje – 2 naktų mini kruizas Baltijos jūra.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Kelionė keltu į Karlshamną Švedijoje',
                    url: 'https://www.youtube.com/watch?v=TWs07oxyASM'
                }
            ]
        },
        {
            id: 23,
            title: 'Stokholmas',
            country: 'Švedija',
            lat: 59.3293,
            lng: 18.0686,
            date: '2024-08-18',
            category: 'Keltas',
            description: 'Nuotykiai Švedijos sostinėje: unikalus „Vasa“ karališkojo laivo muziejus, „Junibacken“ Astridos Lindgren pasakų herojų namai ir Stokholmo technikos muziejus.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Švedija, Stokholmas 2024',
                    url: 'https://www.youtube.com/watch?v=3G-jDRVWUew'
                }
            ]
        },
        {
            id: 24,
            title: 'Sigulda ir Cėsys',
            country: 'Latvija',
            lat: 57.1537,
            lng: 24.8598,
            date: '2025-03-22',
            category: 'Automobiliu',
            description: 'Turininga išvyka į kaimyninę Latviją: Cėsių kosmoso pažinimo centras, Sigulda ir Gaujos nacionalinio parko apylinkės.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Latvija: Sigulda ir Cėsys',
                    url: 'https://www.youtube.com/watch?v=L7lAUAuukuU'
                }
            ]
        },
        {
            id: 25,
            title: 'Ventspilis ir Kuldyga',
            country: 'Latvija',
            lat: 57.3937,
            lng: 21.5647,
            date: '2026-01-25',
            category: 'Automobiliu',
            description: 'Aktyvus savaitgalis Ventspilyje: naujasis VIZIUM mokslo centras, Ventspilio vandens parkas, „Lemberga hūte“ slidinėjimo trasa, uosto krantinė ir istorinė Kuldyga pakeliui namo.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Pramogų pripildytas Ventspilis: VIZIUM, vandens parkas ir slidinėjimas',
                    url: 'https://www.youtube.com/watch?v=2lw_jcTL2ww'
                },
                {
                    title: 'Pakeliui namo: lankytinos vietos Kuldygoje',
                    url: 'https://www.youtube.com/watch?v=2lw_jcTL2ww',
                    timestamp: '09:00'
                }
            ]
        },
        {
            id: 26,
            title: 'Bilundas (LEGO House ir Legolendas)',
            country: 'Danija',
            lat: 55.7358,
            lng: 9.1153,
            date: '2024-05-12',
            category: 'Lėktuvu',
            description: 'Mažų ir didelių svajonių išsipildymas Danijoje, Bilunde: interaktyvus „LEGO House“ kūrybos namas ir legendinis „Legoland Billund“ pramogų parkas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'LEGO namas (LEGO House) 2024',
                    url: 'https://www.youtube.com/watch?v=0W3F341_xZM'
                },
                {
                    title: 'Legolendas 2024',
                    url: 'https://www.youtube.com/watch?v=9yvzSzQUrRU'
                }
            ]
        },
        {
            id: 27,
            title: 'Krokuva, Zakopanė ir Energylandia',
            country: 'Lenkija',
            lat: 50.0647,
            lng: 19.945,
            date: '2024-06-20',
            category: 'Automobiliu',
            description: 'Įspūdinga kelionė per Lenkiją: Tatrų kalnai Zakopanėje, istorinė Krokuva, didžiausias atrakcionų parkas „Energylandia“ ir modernioji Varšuva.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Lenkija: Zakopanė, Krokuva, Energylandia, Varšuva',
                    url: 'https://www.youtube.com/watch?v=zW_2heKUlmM'
                },
                {
                    title: 'Hario Poterio paroda netoli Krokuvos',
                    url: 'https://www.youtube.com/watch?v=uaiAngaRj9o'
                }
            ]
        },
        {
            id: 28,
            title: 'Suntago vandens parkas (Vrenča)',
            country: 'Lenkija',
            lat: 51.9997,
            lng: 20.4392,
            date: '2026-07-12',
            category: 'Automobiliu',
            description: 'Didžiausias Europoje dengtas vandens pramogų parkas „Suntago“ (Park of Poland) netoli Varšuvos su tikromis palmėmis iš Floridos bei Kosta Rikos ir įspūdingomis čiuožyklomis.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Ar verta važiuoti į „Suntago“? Pažintinis filmukas',
                    url: 'https://www.youtube.com/watch?v=dz51vJ8b3xo'
                }
            ]
        },
        {
            id: 29,
            title: 'Hossoland pramogų parkas (Brojcai)',
            country: 'Lenkija',
            lat: 53.9722,
            lng: 15.3885,
            date: '2025-08-14',
            category: 'Automobiliu',
            description: 'Didžiausias teminis parkas šiaurės Lenkijoje „Hossoland“, įkvėptas Baltijos legendų ir šiaurės kultūrų: 4 amerikietiški kalneliai ir teminės zonos visai šeimai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Hossoland: naujas Lenkijos atrakcionų parkas visai šeimai!',
                    url: 'https://www.youtube.com/watch?v=-mPqXmFq8bI'
                }
            ]
        },
        {
            id: 30,
            title: 'Lodzė (Fala Aquapark, Mandoria, Orientarium ZOO)',
            country: 'Lenkija',
            lat: 51.7592,
            lng: 19.456,
            date: '2025-03-08',
            category: 'Automobiliu',
            description: 'Smagus šeimos savaitgalis Lodzėje: vandens atrakcionų parkas „Fala Aquapark“, didžiausias Lenkijoje uždaras pramogų parkas „Mandoria“ ir modernusis „Orientarium ZOO Łódź“.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Savaitgalis Lodzėje: Fala Aquapark, Orientarium ZOO, Mandoria',
                    url: 'https://www.youtube.com/watch?v=YKxCavYMbAc'
                }
            ]
        },
        {
            id: 31,
            title: 'Raubonių pramogų parkas',
            country: 'Lietuva',
            lat: 56.1228,
            lng: 24.4714,
            date: '2026-08-02',
            category: 'Lietuva',
            description: 'Didžiausias Baltijos šalyse Raubonių pramogų parkas: interaktyvus Dinozaurų parkas, „Tarzano takas“ virš zoologijos sodo gyvūnų aptvarų, karuselės ir batutai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Raubonių pramogų parkas: Dinozaurai, Tarzano takas ir atrakcionai',
                    url: 'https://www.youtube.com/watch?v=zEtaNkGktic'
                },
                {
                    title: 'Tarzano trasa virš zoologijos sodo',
                    url: 'https://www.youtube.com/watch?v=zEtaNkGktic',
                    timestamp: '05:11'
                }
            ]
        },
        {
            id: 32,
            title: 'Druskininkai (Druskininkų vandens parkas)',
            country: 'Lietuva',
            lat: 54.0189,
            lng: 23.9725,
            date: '2025-12-06',
            category: 'Lietuva',
            description: 'Šeimos savaitgalis Druskininkų vandens parke: tropinis +30 °C klimatas su palmėmis, jūros bangų baseinas, sraunioji upė, vaikų erdvė ir greičio nusileidimo kalneliai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Šeimos savaitgalis Druskininkų akvaparke',
                    url: 'https://www.youtube.com/watch?v=YCYJCxpcFo4'
                }
            ]
        },
        {
            id: 33,
            title: 'Akmenės ir Karpėnų karjerai',
            country: 'Lietuva',
            lat: 56.3075,
            lng: 22.8669,
            date: '2026-05-16',
            category: 'Lietuva',
            description: 'Lietuviškasis Marsas ir Didysis kanjonas: Karpėnų klinčių karjeras su 720 tonų žingsniuojančiais ekskavatoriais, Ventos regioninio parko dinozaurų ekspozicija, molio karjeras ir Jurakalnio bokštas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Karpėnų klinčių karjeras | Žygis kartu su Trenkturas',
                    url: 'https://www.youtube.com/watch?v=cASIxvMcKic'
                },
                {
                    title: 'Ekskursija po Akmenės karjerus: 4 val. nuotykis',
                    url: 'https://www.youtube.com/watch?v=yXP0pl5rd5s'
                }
            ]
        },
        {
            id: 34,
            title: 'Nida ir Kuršių nerija',
            country: 'Lietuva',
            lat: 55.3033,
            lng: 21.0056,
            date: '2025-07-28',
            category: 'Lietuva',
            description: 'Kelionė po pasakiškąją Kuršių neriją: Mirusios kopos, aukščiausioji Vecekrugo kopa, Preilos kopos, Avikalnis, kormoranų kolonija ir šventinis savaitgalis Nidoje.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Epas per Kuršių Neriją: Vecekrugo kopa, Preila ir daugiau!',
                    url: 'https://www.youtube.com/watch?v=y7V2OgWE2sI'
                },
                {
                    title: 'Nida 2024',
                    url: 'https://www.youtube.com/watch?v=twVxXWnhIwc'
                }
            ]
        },
        {
            id: 35,
            title: 'Kaunas (Mokslo sala, VI fortas, Zoologijos sodas, Baseinas)',
            country: 'Lietuva',
            lat: 54.8962,
            lng: 23.9044,
            date: '2025-04-19',
            category: 'Lietuva',
            description: 'Kauno atradimai visai šeimai: naujasis mokslo ir inovacijų centras „Mokslo sala“, Kauno tvirtovės VI forto karo technikos ekspozicija, Lietuvos zoologijos sodas ir „Žalgirio“ arenos baseinas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Mokslo sala, Kaunas',
                    url: 'https://www.youtube.com/watch?v=jBRU8xayDBA'
                },
                {
                    title: 'Kauno tvirtovės VI fortas – Karo technikos ekspozicija',
                    url: 'https://www.youtube.com/watch?v=wMrPq4As1VY'
                },
                {
                    title: 'Lietuvos zoologijos sodas',
                    url: 'https://www.youtube.com/watch?v=bcN1MYmJ6uU'
                },
                {
                    title: '„Žalgirio“ arenos baseinas. Luko nardymas',
                    url: 'https://www.youtube.com/watch?v=BwC7Tv47O7E'
                }
            ]
        },
        {
            id: 36,
            title: 'Vilnius (Energetikos ir technikos muziejus, LITEXPO)',
            country: 'Lietuva',
            lat: 54.6939,
            lng: 25.2869,
            date: '2025-03-01',
            category: 'Lietuva',
            description: 'Energetikos ir technikos muziejaus interaktyvi „Virsmo salė“ su Tesla šou Faradėjaus narve bei 25-oji tarptautinė Vilniaus knygų mugė LITEXPO parodų centre.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Energetikos ir technikos muziejus, Virsmo salė, Tesla šou',
                    url: 'https://www.youtube.com/watch?v=LQ0fFWJjduQ'
                },
                {
                    title: 'Vilniaus knygų mugė 2025',
                    url: 'https://www.youtube.com/watch?v=qK9njNc_l40'
                }
            ]
        },
        {
            id: 37,
            title: 'Mūšos tyrelio pažintinis takas',
            country: 'Lietuva',
            lat: 56.2185,
            lng: 23.257,
            date: '2025-05-04',
            category: 'Lietuva',
            description: 'Ilgiausias medinis lentų takas per pelkę Lietuvoje: Mūšos tyrelio telmologinis draustinis, vienintelis natūralus Joniškio rajone Miknaičių ežeras ir partizanų stovyklavietė.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Mūšos tyrelio takas: pelkė Lietuvoje, kurioje pajusite gamtos galybę',
                    url: 'https://www.youtube.com/watch?v=LVK0-C2JvNQ'
                }
            ]
        },
        {
            id: 38,
            title: 'Tytuvėnai ir Šiaulės kalnas (Akmenų rūžos takas)',
            country: 'Lietuva',
            lat: 55.6033,
            lng: 23.1994,
            date: '2025-05-11',
            category: 'Lietuva',
            description: 'Tytuvėnų regioninis parkas: mistiškas Akmenų rūžos pažintinis takas, 21 m Šiaulės kalno apžvalgos bokštas ir 15 m Tytuvėnų apžvalgos bokštas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Akmenų rūža, Šiaulės kalnas ir Tytuvėnų apžvalgos bokštai',
                    url: 'https://www.youtube.com/watch?v=3bA2R27bN7M'
                }
            ]
        },
        {
            id: 39,
            title: 'Kurtuvėnų regioninis parkas',
            country: 'Lietuva',
            lat: 55.8267,
            lng: 23.0475,
            date: '2025-02-09',
            category: 'Lietuva',
            description: 'Kurtuvėnų regioninio parko pažintiniai takai ir paveldas: Targių ozų ledyniniai kalvagūbriai, Juodlės, Vainagių ir Pageluvio pažintiniai takai, Svilės šaltiniai bei XVIII a. Kurtuvėnų dvaro svirnas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Targių ozų takas, Kurtuvėnų regioninis parkas',
                    url: 'https://www.youtube.com/watch?v=roFVMdWpDh0'
                },
                {
                    title: 'Juodlės pažintinis takas (žiema 2025)',
                    url: 'https://www.youtube.com/watch?v=bBd6SzJe4Bs'
                },
                {
                    title: 'Juodlės pažintinis takas',
                    url: 'https://www.youtube.com/watch?v=4obVDV2dEGk'
                },
                {
                    title: 'Svilės kraštovaizdžio takas',
                    url: 'https://www.youtube.com/watch?v=YUweSjKZnVo'
                },
                {
                    title: 'Vainagių pažintinis takas',
                    url: 'https://www.youtube.com/watch?v=E30hn1ylTJs'
                },
                {
                    title: 'Pageluvio pažintinis takas',
                    url: 'https://www.youtube.com/watch?v=RaQRQ531Xj0'
                },
                {
                    title: 'Šventė Kurtuvėnų dvaro svirne su Dubysos mokyklos bendruomene',
                    url: 'https://www.youtube.com/watch?v=IYXbrfBFH4Q'
                }
            ]
        },
        {
            id: 40,
            title: 'Bubiai (Ventos–Dubysos perkasas)',
            country: 'Lietuva',
            lat: 55.8542,
            lng: 23.1361,
            date: '2025-04-05',
            category: 'Lietuva',
            description: '2 km Bubių istorinis pažintinis takas: XIX a. Ventos–Dubysos perkaso ir žiemos uosto liekanos, Zubovo ąžuolų alėja, Perkaso pušys, seniausias tiltas ir 5 Bubių tuopos.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Ventos–Dubysos perkasas, Bubių istorinis takas',
                    url: 'https://www.youtube.com/watch?v=jVGKmhN6tJA'
                },
                {
                    title: 'Pirmas sniegas, 2024 Bubiai',
                    url: 'https://www.youtube.com/watch?v=_wLTOVbFpgc'
                }
            ]
        },
        {
            id: 41,
            title: 'Šiauliai',
            country: 'Lietuva',
            lat: 55.9349,
            lng: 23.3137,
            date: '2026-05-29',
            category: 'Lietuva',
            description: 'Saulės miestas Šiauliai: berniukų ir jaunuolių choro „Dagilėlis“ pasirodymai Šiaulių katedroje, darželio bei mokyklos šventės, edukacijos ir šeimos laisvalaikis.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Dagilėlio pirmokai festivalyje „Džiaugsmo šventė jau atėjo“',
                    url: 'https://www.youtube.com/watch?v=chMemEvNcf0'
                },
                {
                    title: 'Dagilėlio dainavimo mokykla | Pasirodymas #1',
                    url: 'https://www.youtube.com/watch?v=xYvpsL6qI3g'
                },
                {
                    title: 'Dagilėlio dainavimo mokykla | Pasirodymas #2',
                    url: 'https://www.youtube.com/watch?v=4e_Wh-OXCqY'
                },
                {
                    title: 'Dagilėlio dainavimo mokykla | Pasirodymas #3',
                    url: 'https://www.youtube.com/watch?v=hkR_BmNPbPU'
                },
                {
                    title: 'Dagilėlio dainavimo mokykla | Pasirodymas #4',
                    url: 'https://www.youtube.com/watch?v=ZRexVX7u0VA'
                },
                {
                    title: 'Drugelių grupės išleistuvės',
                    url: 'https://www.youtube.com/watch?v=_HbCBTMtq7A'
                },
                {
                    title: 'Boružiukų edukacija „Stebuklingas augalų kilimas“',
                    url: 'https://www.youtube.com/watch?v=a_nGROIl1xY'
                },
                {
                    title: 'Boružiukų Kalėdų šventė',
                    url: 'https://www.youtube.com/watch?v=tnIm-0paDxc'
                },
                {
                    title: 'Pirmokų Kalėdų laukimas',
                    url: 'https://www.youtube.com/watch?v=U91dsOl22Go'
                },
                {
                    title: 'Boružiukai, eglutės puošimas 2024',
                    url: 'https://www.youtube.com/watch?v=q87BXAFlQE8'
                },
                {
                    title: 'Penktadienio vakaras Šiauliuose',
                    url: 'https://www.youtube.com/watch?v=gYnWVjdjAMc'
                },
                {
                    title: 'Giedrės ir Urtės fotosesija',
                    url: 'https://www.youtube.com/watch?v=zqB9vlgdRuY'
                }
            ]
        },
        {
            id: 42,
            title: 'Plungė',
            country: 'Lietuva',
            lat: 55.9114,
            lng: 21.8442,
            date: '2024-09-22',
            category: 'Lietuva',
            description: 'Plungė iš paukščio skrydžio 2024 – Žemaitijos miesto panorama ir Diena be automobilio užfiksuota dronu.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Plungė iš paukščio skrydžio 2024, diena be automobilio',
                    url: 'https://www.youtube.com/watch?v=-R6g4mcsXII'
                }
            ]
        },
        {
            id: 43,
            title: 'Perlinių danielių parkas',
            country: 'Lietuva',
            lat: 55.5256,
            lng: 25.1026,
            date: '2025-06-15',
            category: 'Lietuva',
            description: 'Trumpa išvyka į gamtą pasigrožėti perlinių danielių parko gyventojais ir susipažinti su šiais grakščiais gyvūnais iš arti.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: [
                {
                    title: 'Perlinių danielių parkas',
                    url: 'https://www.youtube.com/watch?v=Hx_FbGS14Wk'
                }
            ]
        },
        {
            id: 44,
            title: 'Berlynas',
            country: 'Vokietija',
            lat: 52.52,
            lng: 13.405,
            date: '2023-09-22',
            category: 'Automobiliu',
            description: 'Kelionė automobiliu į Vokietijos sostinę: Brandenburgo vartai, Reichstagas ir Berlyno sienos galerija.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 45,
            title: 'Praha',
            country: 'Čekija',
            lat: 50.0755,
            lng: 14.4378,
            date: '2023-09-25',
            category: 'Automobiliu',
            description: 'Šimto bokštų miestas: Karolio tiltas, Prahos pilis, Senamiesčio aikštė ir astronominis laikrodis.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 46,
            title: 'Liberecas (Ještedo bokštas)',
            country: 'Čekija',
            lat: 50.7327,
            lng: 14.9847,
            date: '2023-09-27',
            category: 'Automobiliu',
            description: 'Futuristinis Ještedo televizijos bokštas ir viešbutis kalno viršūnėje su kvapą gniaužiančia panorama.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 47,
            title: 'Belgradas',
            country: 'Serbija',
            lat: 44.8125,
            lng: 20.4612,
            date: '2023-11-10',
            category: 'Lėktuvu',
            description: 'Kalemegdano tvirtovė prie Dunojaus ir Savos santakos, bohemiškasis Skadarlija kvartalas ir Šv. Savos soboras.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 48,
            title: 'Sirakūzai',
            country: 'Italija',
            lat: 37.0755,
            lng: 15.2866,
            date: '2024-04-15',
            category: 'Kruizas',
            description: 'Antikinė Sicilijos dvasia: Ortidžijos sala, katedros aikštė, Arethusa šaltinis ir Neapolio archeologinis parkas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 49,
            title: 'Valeta',
            country: 'Malta',
            lat: 35.8989,
            lng: 14.5146,
            date: '2024-04-16',
            category: 'Kruizas',
            description: 'Kruizinio laivo sustojimas saulėtoje Maltoje: Didysis uostas, Aukštutiniai Barrakka sodai ir senamiesčio gatvelės.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 50,
            title: 'Splitas',
            country: 'Kroatija',
            lat: 43.5081,
            lng: 16.4402,
            date: '2024-06-04',
            category: 'Kruizas',
            description: 'Adrijos jūros perlas: imperatoriaus Diokletiano rūmai, Riva promenada ir Marjan kalvos apžvalgos aikštelė.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 51,
            title: 'Korfu',
            country: 'Graikija',
            lat: 39.6243,
            lng: 19.9217,
            date: '2024-06-06',
            category: 'Kruizas',
            description: 'Žalioji Jonijos jūros sala: venecijietiškas Kerkyros senamiestis, Senoji tvirtovė ir žydros įlankos.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 52,
            title: 'Triestas',
            country: 'Italija',
            lat: 45.6495,
            lng: 13.7768,
            date: '2024-06-08',
            category: 'Kruizas',
            description: "Kruizo uostas Adrijos šiaurėje: Piazza Unità d'Italia aikštė, Didysis kanalas ir Miramare pilis.",
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        }
    ]
};

// Kategorijų meta duomenys CSS smeigtukams ir kortelėms
const CATEGORY_META = {
    Kruizas: {
        pinClass: 'custom-pin--cruise',
        badgeClass: 'popup-card__category--cruise',
        emoji: '🚢'
    },
    Keltas: {
        pinClass: 'custom-pin--ferry',
        badgeClass: 'popup-card__category--ferry',
        emoji: '⛴️'
    },
    Automobiliu: {
        pinClass: 'custom-pin--car',
        badgeClass: 'popup-card__category--car',
        emoji: '🚗'
    },
    Autobusu: {
        pinClass: 'custom-pin--bus',
        badgeClass: 'popup-card__category--bus',
        emoji: '🚌'
    },
    Lėktuvu: {
        pinClass: 'custom-pin--plane',
        badgeClass: 'popup-card__category--plane',
        emoji: '✈️'
    },
    Lietuva: {
        pinClass: 'custom-pin--lt',
        badgeClass: 'popup-card__category--lt',
        emoji: '🇱🇹'
    }
};

// Administravimo prieigos nustatymai (slaptažodis „Lisauskai2026“)
const ADMIN_SESSION_KEY = 'lisauskai_admin_auth';
const ADMIN_PASSWORD_PLAIN = 'Lisauskai2026';
const ADMIN_PASSWORD_SHA256 = '5a5ca17e3c636d26a22f58b3702074e33d9b488a0cfbd659c147fce951579fcb';

// Būsena
const state = {
    visitedCountries: [],
    places: [],
    activeCategory: 'Visos',
    activeTraveler: 'Visi',
    mapMode: 'detailed', // 'detailed' | 'countries'
    searchQuery: '',
    isAdminOpen: false,
    isPickingCoords: false,
    editingPlaceId: null,
    adminTableSearch: '',
    adminTableCategory: 'Visos',
    cachedWorldGeoJson: null
};

// Pagrindiniai DOM elementai
const mapContainerEl = document.getElementById('map');
const statCountriesEl = document.getElementById('statCountries');
const statPlacesEl = document.getElementById('statPlaces');
const statVlogsEl = document.getElementById('statVlogs');
const searchInputEl = document.getElementById('searchInput');
const clearSearchBtnEl = document.getElementById('clearSearchBtn');
const categoryFiltersEl = document.getElementById('categoryFilters');
const travelerFiltersEl = document.getElementById('travelerFilters');
const mapModeSwitcherEl = document.getElementById('mapModeSwitcher');
const emptyStateEl = document.getElementById('emptyState');
const resetFiltersBtnEl = document.getElementById('resetFiltersBtn');
const resetMapBtnEl = document.getElementById('resetMapBtn');

// Administravimo DOM elementai (prisijungimo modalas ir pilno ekrano Admin Dashboard)
const adminToggleBtnEl = document.getElementById('adminToggleBtn');
const adminLoginModalEl = document.getElementById('adminLoginModal');
const adminLoginFormEl = document.getElementById('adminLoginForm');
const adminPasswordInputEl = document.getElementById('adminPasswordInput');
const adminLoginErrorEl = document.getElementById('adminLoginError');
const adminLoginCancelBtnEl = document.getElementById('adminLoginCancelBtn');

const adminDashboardModalEl = document.getElementById('adminDashboardModal');
const adminCloseBtnEl = document.getElementById('adminCloseBtn');
const adminLogoutBtnEl = document.getElementById('adminLogoutBtn');
const importHtmlBtnEl = document.getElementById('importHtmlBtn');
const importHtmlFileInputEl = document.getElementById('importHtmlFileInput');
const pickCoordsOnMapBtnEl = document.getElementById('pickCoordsOnMapBtn');
const inlinePickCoordsBtnEl = document.getElementById('inlinePickCoordsBtn');
const adminPickBannerEl = document.getElementById('adminPickBanner');
const returnToAdminBtnEl = document.getElementById('returnToAdminBtn');
const downloadJsonBtnEl = document.getElementById('downloadJsonBtn');
const copyJsonBtnEl = document.getElementById('copyJsonBtn');
const copyJsonBtnTextEl = document.getElementById('copyJsonBtnText');

const placeFormEl = document.getElementById('placeForm');
const placeFormHeadingEl = document.getElementById('placeFormHeading');
const placeIdInputEl = document.getElementById('placeIdInput');
const placeGeocodeInputEl = document.getElementById('placeGeocodeInput');
const placeGeocodeBtnEl = document.getElementById('placeGeocodeBtn');
const placeGeocodeResultsEl = document.getElementById('placeGeocodeResults');
const placeLatInputEl = document.getElementById('placeLatInput');
const placeLngInputEl = document.getElementById('placeLngInput');
const placeTitleInputEl = document.getElementById('placeTitleInput');
const placeCountryInputEl = document.getElementById('placeCountryInput');
const placeCountryCodeInputEl = document.getElementById('placeCountryCodeInput');
const placeAdvancedDetailsEl = document.getElementById('placeAdvancedDetails');
const coordsPreviewBadgeEl = document.getElementById('coordsPreviewBadge');
const placeDateInputEl = document.getElementById('placeDateInput');
const placeCategoryInputEl = document.getElementById('placeCategoryInput');
const placeDescInputEl = document.getElementById('placeDescInput');
const adminTravelersCheckboxesEl = document.getElementById('adminTravelersCheckboxes');
const addVideoRowBtnEl = document.getElementById('addVideoRowBtn');
const adminVideosContainerEl = document.getElementById('adminVideosContainer');
const savePlaceBtnEl = document.getElementById('savePlaceBtn');
const cancelEditBtnEl = document.getElementById('cancelEditBtn');

const countryFormEl = document.getElementById('countryForm');
const newCountryCodeInputEl = document.getElementById('newCountryCodeInput');
const adminCountriesListEl = document.getElementById('adminCountriesList');
const adminPlacesCountEl = document.getElementById('adminPlacesCount');
const adminTableSearchInputEl = document.getElementById('adminTableSearchInput');
const adminTableCategoryFilterEl = document.getElementById('adminTableCategoryFilter');
const adminPlacesTableBodyEl = document.getElementById('adminPlacesTableBody');

// Inicializuojame Leaflet žemėlapį
const map = L.map('map', {
    center: [46.5, 18.0],
    zoom: 4,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: false
});

// Pridedame priartinimo valdiklį dešiniame apatiniame kampe
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// 1) Nemokamas „Esri World Street Map“ sluoksnis, kuriame visi pavadinimai yra lotyniški
const baseTileLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    {
        attribution:
            'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, TomTom',
        maxZoom: 18
    }
).addTo(map);

// Sluoksniai: pasaulio šalys (apačioje), šalių centrų užrašai, vietovių smeigtukai (viršuje) ir laikinas admin žymeklis
let countriesGeoJsonLayer = null;
const countryLabelsLayer = L.layerGroup().addTo(map);
const markersLayer = L.layerGroup().addTo(map);
const markersByPlaceId = new Map();
let adminPickMarker = null;

/**
 * Pašalina lietuviškus diakritinius ženklus paieškai (pvz. „Šiauliai“ -> „siauliai“)
 */
function normalizeText(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Sukuria saugų tekstą HTML įterpimui
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

/**
 * Patikrina ir grąžina saugų išorinį http/https URL (arba tuščią eilutę, jei netinkamas).
 * Palaiko tiesiogiai įklijuotus YouTube adresus net ir be „https://“ pradžios.
 */
function getValidHttpUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let candidate = rawUrl.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    if (!candidate) return '';

    // Jei įklijuotas tekstas su nuoroda viduje, ištraukiame pačią nuorodą
    const urlMatch = candidate.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) {
        candidate = urlMatch[0];
    } else if (
        !/^https?:\/\//i.test(candidate) &&
        /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\//i.test(candidate)
    ) {
        candidate = `https://${candidate}`;
    }

    try {
        const parsed = new URL(candidate);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return parsed.href;
        }
    } catch {
        // Neteisingas URL formatas
    }
    return '';
}

/**
 * 1) Iš bet kokios YouTube nuorodos (youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/..., embed/..., live/...)
 * ištraukia 11 simbolių Video ID.
 */
function extractYouTubeVideoId(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();

    try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

        // 1. youtu.be/<11-char-id>
        if (host === 'youtu.be') {
            const seg = parsed.pathname.split('/').filter(Boolean)[0] || '';
            if (/^[A-Za-z0-9_-]{11}$/.test(seg)) {
                return seg;
            }
        }

        // 2. youtube.com arba m.youtube.com arba music.youtube.com
        if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
            const vParam = parsed.searchParams.get('v');
            if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) {
                return vParam;
            }

            // /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>
            const pathParts = parsed.pathname.split('/').filter(Boolean);
            if (
                pathParts.length >= 2 &&
                ['shorts', 'embed', 'live', 'v'].includes(pathParts[0].toLowerCase())
            ) {
                const candidate = pathParts[1];
                if (/^[A-Za-z0-9_-]{11}$/.test(candidate)) {
                    return candidate;
                }
            }
        }
    } catch {
        // Atsarginis reguliariosios išraiškos patikrinimas
    }

    const regexMatch = trimmed.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
    );
    return regexMatch ? regexMatch[1] : '';
}

/**
 * Grąžina vietos keliautojų (šeimos narių) sąrašą
 */
function getPlaceTravelers(place) {
    if (!place || !Array.isArray(place.travelers)) {
        return [...DEFAULT_TRAVELERS];
    }
    return place.travelers
        .map((name) => String(name || '').trim())
        .filter(Boolean);
}

/**
 * Paverčia įvairių formatų laiko žymą („03:45“, „01:02:15“, „3m30s“, „220“, „220s“) į sekundžių skaičių
 */
function parseTimestampToSeconds(timestampRaw) {
    if (timestampRaw === undefined || timestampRaw === null) return 0;
    const raw = String(timestampRaw).trim().toLowerCase();
    if (!raw) return 0;

    // 1. Tik skaičius arba skaičius su 's' gale (pvz., "220" arba "220s")
    if (/^\d+s?$/.test(raw)) {
        const secs = parseInt(raw, 10);
        return Number.isFinite(secs) && secs > 0 ? secs : 0;
    }

    // 2. MM:SS arba HH:MM:SS formatas (pvz., "03:45" arba "01:03:45")
    if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(raw)) {
        const parts = raw.split(':').map((p) => parseInt(p, 10));
        if (parts.some((n) => Number.isNaN(n))) return 0;
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
    }

    // 3. YouTube raidžių formatas (pvz., "3m30s", "1h2m10s", "4m")
    const hmsMatch = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
        const hours = parseInt(hmsMatch[1] || '0', 10);
        const mins = parseInt(hmsMatch[2] || '0', 10);
        const secs = parseInt(hmsMatch[3] || '0', 10);
        const total = hours * 3600 + mins * 60 + secs;
        return total > 0 ? total : 0;
    }

    return 0;
}

/**
 * Sugeneruoja skaitomą laiko žymos tekstą (pvz., 225 -> "03:45")
 */
function formatSecondsToTimeLabel(totalSeconds) {
    const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    if (secs <= 0) return '';
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = secs % 60;

    if (hours > 0) {
        return `${hours}:${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
}

/**
 * Prideda laiko parametrą (pvz., &t=210s arba ?t=210s) prie YouTube nuorodos, jei timestamp nurodytas
 */
function buildYouTubeUrlWithTimestamp(rawUrl, timestampRaw) {
    const validUrl = getValidHttpUrl(rawUrl);
    if (!validUrl) return '';

    const seconds = parseTimestampToSeconds(timestampRaw);
    if (seconds <= 0) {
        return validUrl;
    }

    try {
        const urlObj = new URL(validUrl);
        urlObj.searchParams.set('t', `${seconds}s`);
        return urlObj.toString();
    } catch {
        const separator = validUrl.includes('?') ? '&' : '?';
        return `${validUrl}${separator}t=${seconds}s`;
    }
}

/**
 * Grąžina tikrus, patikrintus vietos YouTube video objektus iš „videos“ masyvo: [{ title, url, timestamp? }]
 */
function getValidVideos(place) {
    if (!place || !Array.isArray(place.videos)) {
        return [];
    }

    const fallbackBaseTitle =
        place && typeof place.title === 'string' && place.title.trim()
            ? place.title.trim()
            : 'Kelionės vlogas';

    const result = [];
    for (const item of place.videos) {
        if (!item || typeof item !== 'object') continue;
        const validUrl = getValidHttpUrl(item.url);
        if (!validUrl) continue;

        const rawTimestamp =
            item.timestamp !== undefined && item.timestamp !== null
                ? String(item.timestamp).trim()
                : item.t !== undefined && item.t !== null
                  ? String(item.t).trim()
                  : '';

        const customTitle = String(item.title || '').trim();
        const videoEntry = {
            title: customTitle || fallbackBaseTitle,
            url: validUrl
        };
        if (rawTimestamp && parseTimestampToSeconds(rawTimestamp) > 0) {
            videoEntry.timestamp = rawTimestamp;
        }
        result.push(videoEntry);
    }
    return result;
}

/**
 * Išgauna patikimą ISO-2 šalies kodą iš GeoJSON objekto savybių
 */
function getCountryIso2(feature) {
    const props = (feature && feature.properties) || {};

    const candidates = [
        props.ISO_A2_EH,
        props.ISO_A2,
        props.iso_a2,
        props['ISO3166-1-Alpha-2'],
        props.WB_A2,
        props.FIPS_10_,
        props.postal
    ];

    for (const code of candidates) {
        if (typeof code === 'string' && /^[A-Z]{2}$/i.test(code.trim()) && code.trim() !== '-99') {
            return code.trim().toUpperCase();
        }
    }

    const iso3Candidates = [
        props.ADM0_A3,
        props.ISO_A3,
        props.ISO_A3_EH,
        props.SOV_A3,
        props.GU_A3,
        props.SU_A3
    ];
    for (const iso3 of iso3Candidates) {
        if (typeof iso3 === 'string' && ISO3_TO_ISO2[iso3.trim().toUpperCase()]) {
            return ISO3_TO_ISO2[iso3.trim().toUpperCase()];
        }
    }

    return '';
}

/**
 * 2) Naudojant naršyklės API `new Intl.DisplayNames(['lt'], { type: 'region' })`,
 * verčia visus GeoJSON šalių ISO-2 kodus į lietuvių kalbą (pvz., DE -> Vokietija, HU -> Vengrija, EG -> Egiptas)
 */
function getCountryDisplayName(feature, iso2) {
    if (iso2 && regionDisplayNamesLt) {
        try {
            const translated = regionDisplayNamesLt.of(iso2);
            if (translated && translated.toUpperCase() !== iso2.toUpperCase()) {
                return translated;
            }
        } catch {
            // Jei nestandartinis kodas, naudojame žodyną žemiau
        }
    }

    if (iso2 && COUNTRY_NAMES_LT[iso2]) {
        return COUNTRY_NAMES_LT[iso2];
    }

    const props = (feature && feature.properties) || {};
    return props.NAME_LT || props.NAME || props.ADMIN || props.name || iso2 || 'Šalis';
}

/**
 * Stilius aplankytoms ir neaplankytoms šalims priklausomai nuo žemėlapio režimo („detailed“ arba „countries“)
 */
function getCountryBaseStyle(isVisited) {
    const isCountriesOnlyMode = state.mapMode === 'countries';

    if (isCountriesOnlyMode) {
        if (isVisited) {
            return {
                color: '#0369a1',
                weight: 1.5,
                opacity: 1,
                fillColor: '#22d3ee',
                fillOpacity: 0.85
            };
        }

        // Režime „Tik šalys“ neaplankytos šalys yra šviesiai pilkos
        return {
            color: '#cbd5e1',
            weight: 1,
            opacity: 1,
            fillColor: '#f1f5f9',
            fillOpacity: 1
        };
    }

    // Režimas „Detalus žemėlapis“
    if (isVisited) {
        return {
            color: '#0891b2',
            weight: 1.4,
            opacity: 0.85,
            fillColor: '#06b6d4',
            fillOpacity: 0.24
        };
    }

    return {
        color: '#94a3b8',
        weight: 0.5,
        opacity: 0.25,
        fillColor: '#cbd5e1',
        fillOpacity: 0.03
    };
}

/**
 * Patikrina, ar taškas (lng, lat) patenka į poligono žiedą (Ray-casting algoritmas)
 */
function isPointInRing(lng, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];

        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi;
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Patikrina, ar poligono dalyje (arba prie pat jos kranto) yra bent vienas realus kelionės smeigtukas iš „places“
 */
function hasPlaceInPolygon(polygonCoords, places) {
    const outerRing = polygonCoords && polygonCoords[0];
    if (!Array.isArray(outerRing) || outerRing.length === 0) return false;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const pt of outerRing) {
        const lng = pt[0];
        const lat = pt[1];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }

    const coastalMargin = 0.18;

    return places.some((place) => {
        const lat = Number(place.lat);
        const lng = Number(place.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return false;

        const inBoundingBox =
            lng >= minLng - coastalMargin &&
            lng <= maxLng + coastalMargin &&
            lat >= minLat - coastalMargin &&
            lat <= maxLat + coastalMargin;

        if (!inBoundingBox) return false;
        return isPointInRing(lng, lat, outerRing) || inBoundingBox;
    });
}

/**
 * Nusprendžia, ar piešti MultiPolygon šalies poligono dalį:
 * išfiltruoja užjūrio teritorijas už Europos/Viduržemio jūros ribų (ilguma < -11 arba platuma < 25),
 * nebent tame poligone yra realus kelionės smeigtukas iš „places“ sąrašo.
 */
function shouldKeepPolygonPart(polygonCoords, places) {
    const outerRing = polygonCoords && polygonCoords[0];
    if (!Array.isArray(outerRing) || outerRing.length === 0) return false;

    const isOutsideEuropeMedBounds = outerRing.some((pt) => {
        const lng = pt[0];
        const lat = pt[1];
        return lng < -11 || lat < 25;
    });

    if (!isOutsideEuropeMedBounds) {
        return true;
    }

    return hasPlaceInPolygon(polygonCoords, places);
}

/**
 * Paruošia GeoJSON duomenis išfiltruojant neaplankytas užjūrio teritorijas iš MultiPolygon šalių
 */
function prepareFilteredGeoJson(rawGeoJson, visitedSet, places) {
    if (!rawGeoJson || !Array.isArray(rawGeoJson.features)) {
        return rawGeoJson;
    }

    const filteredFeatures = rawGeoJson.features
        .map((feature) => {
            const geom = feature && feature.geometry;
            if (!geom || geom.type !== 'MultiPolygon' || !Array.isArray(geom.coordinates)) {
                return feature;
            }

            const iso2 = getCountryIso2(feature);
            const isVisited = visitedSet.has(iso2);

            // Užjūrio teritorijas filtruojame aplankytoms Europos/Viduržemio šalims (arba kai bent viena dalis yra Europoje)
            const hasPartInEurope = geom.coordinates.some((polyCoords) => {
                const ring = polyCoords && polyCoords[0];
                return Array.isArray(ring) && ring.some((pt) => pt[0] >= -11 && pt[1] >= 25);
            });

            if (!isVisited && !hasPartInEurope) {
                return feature;
            }

            const keptPolygons = geom.coordinates.filter((polyCoords) =>
                shouldKeepPolygonPart(polyCoords, places)
            );

            if (keptPolygons.length === 0) {
                return feature;
            }

            if (keptPolygons.length === geom.coordinates.length) {
                return feature;
            }

            return {
                ...feature,
                geometry: {
                    ...geom,
                    coordinates: keptPolygons
                }
            };
        })
        .filter(Boolean);

    return {
        ...rawGeoJson,
        features: filteredFeatures
    };
}

/**
 * Apskaičiuoja pagrindinio (didžiausio) šalies poligono centrą [lat, lng] ir apytikslį plotą
 */
function getCountryMainPolygonMetrics(feature) {
    const geom = feature && feature.geometry;
    if (!geom || !Array.isArray(geom.coordinates)) return null;

    const polygons =
        geom.type === 'Polygon'
            ? [geom.coordinates]
            : geom.type === 'MultiPolygon'
              ? geom.coordinates
              : [];

    let bestCenter = null;
    let maxBboxArea = -1;

    for (const poly of polygons) {
        const ring = poly && poly[0];
        if (!Array.isArray(ring) || ring.length === 0) continue;

        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;

        for (const pt of ring) {
            const lng = pt[0];
            const lat = pt[1];
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }

        const bboxArea = Math.abs((maxLng - minLng) * (maxLat - minLat));
        if (bboxArea > maxBboxArea) {
            maxBboxArea = bboxArea;
            bestCenter = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
    }

    if (!bestCenter) return null;
    return { center: bestCenter, bboxArea: maxBboxArea };
}

/**
 * Atvaizduoja lietuviškus šalių pavadinimus tiesiai ant šalių kontūrų centro režime „Tik šalys“
 */
function renderCountryCenterLabels(processedGeoJson, visitedSet) {
    countryLabelsLayer.clearLayers();

    if (state.mapMode !== 'countries' || !processedGeoJson || !Array.isArray(processedGeoJson.features)) {
        return;
    }

    const currentZoom = map.getZoom();

    processedGeoJson.features.forEach((feature) => {
        const iso2 = getCountryIso2(feature);
        const isVisited = visitedSet.has(iso2);
        const metrics = getCountryMainPolygonMetrics(feature);
        if (!metrics) return;

        // Neaplankytoms mažoms šalims rodome užrašus tik priartinus, kad nesusiklotų tekstas
        if (!isVisited) {
            if (currentZoom <= 3 && metrics.bboxArea < 12) return;
            if (currentZoom === 4 && metrics.bboxArea < 2.2) return;
            if (currentZoom === 5 && metrics.bboxArea < 0.4) return;
        }

        const countryName = getCountryDisplayName(feature, iso2);
        const modifierClass = isVisited
            ? 'country-center-label--visited'
            : 'country-center-label--unvisited';

        const labelMarker = L.marker(metrics.center, {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({
                className: 'country-center-label-icon',
                html: `<span class="country-center-label ${modifierClass}">${escapeHtml(countryName)}</span>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            })
        });

        countryLabelsLayer.addLayer(labelMarker);
    });
}

/**
 * Atvaizduoja pasaulio šalių GeoJSON sluoksnį pagal esamą visitedCountries masyvą ir žemėlapio režimą
 */
function renderCountriesLayer() {
    if (!state.cachedWorldGeoJson) return;

    const visitedSet = new Set(
        state.visitedCountries.map((code) => String(code).trim().toUpperCase())
    );

    if (countriesGeoJsonLayer) {
        map.removeLayer(countriesGeoJsonLayer);
    }

    const processedGeoJson = prepareFilteredGeoJson(
        state.cachedWorldGeoJson,
        visitedSet,
        state.places
    );

    countriesGeoJsonLayer = L.geoJSON(processedGeoJson, {
        style: (feature) => {
            const iso2 = getCountryIso2(feature);
            const isVisited = visitedSet.has(iso2);
            return getCountryBaseStyle(isVisited);
        },
        onEachFeature: (feature, layer) => {
            const iso2 = getCountryIso2(feature);
            const isVisited = visitedSet.has(iso2);
            const countryName = getCountryDisplayName(feature, iso2);

            // 2) Užvedus pelę ant bet kurios šalies – rodomas lietuviškas šalies pavadinimas
            const tooltipLabel = isVisited
                ? `✓ ${escapeHtml(countryName)}`
                : escapeHtml(countryName);

            layer.bindTooltip(tooltipLabel, {
                sticky: true,
                direction: 'top',
                offset: [0, -8],
                className: 'country-tooltip'
            });

            // Hover efektas: paryškiname rėmelį
            layer.on({
                mouseover: (event) => {
                    const targetLayer = event.target;
                    if (isVisited) {
                        targetLayer.setStyle({
                            color: '#0284c7',
                            weight: 2.8,
                            opacity: 1,
                            fillColor: state.mapMode === 'countries' ? '#06b6d4' : '#06b6d4',
                            fillOpacity: state.mapMode === 'countries' ? 0.95 : 0.42
                        });
                    } else {
                        targetLayer.setStyle({
                            color: '#64748b',
                            weight: 1.8,
                            opacity: 0.9,
                            fillColor: state.mapMode === 'countries' ? '#e2e8f0' : '#94a3b8',
                            fillOpacity: state.mapMode === 'countries' ? 1 : 0.14
                        });
                    }

                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        targetLayer.bringToFront();
                    }
                },
                mouseout: (event) => {
                    const targetLayer = event.target;
                    targetLayer.setStyle(getCountryBaseStyle(isVisited));
                }
            });
        }
    }).addTo(map);

    // Užtikriname, kad šalių poligonai liktų po žymekliais
    countriesGeoJsonLayer.bringToBack();

    // Atvaizduojame šalių centrų užrašus (jei įjungtas režimas „Tik šalys“)
    renderCountryCenterLabels(processedGeoJson, visitedSet);
}

/**
 * 3) Perjungia žemėlapio režimą: „Detalus žemėlapis“ ('detailed') arba „Tik šalys“ ('countries')
 */
function setMapMode(mode) {
    state.mapMode = mode === 'countries' ? 'countries' : 'detailed';

    // Atnaujiname mygtukų aktyvią būseną
    const buttons = mapModeSwitcherEl.querySelectorAll('.mode-btn');
    buttons.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.mode === state.mapMode);
    });

    // Paslepiame arba parodome pagrindinį plytelių sluoksnį
    if (state.mapMode === 'countries') {
        if (map.hasLayer(baseTileLayer)) {
            map.removeLayer(baseTileLayer);
        }
        mapContainerEl.classList.add('map--countries-only');
    } else {
        if (!map.hasLayer(baseTileLayer)) {
            baseTileLayer.addTo(map);
            baseTileLayer.bringToBack();
        }
        mapContainerEl.classList.remove('map--countries-only');
    }

    renderCountriesLayer();
}

/**
 * Užkrauna pasaulio šalių GeoJSON kontūrus (polygons) iš viešo šaltinio
 */
async function loadWorldCountriesGeoJson() {
    for (const url of WORLD_GEOJSON_URLS) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                state.cachedWorldGeoJson = await response.json();
                break;
            }
        } catch (err) {
            console.warn(`Nepavyko užkrauti GeoJSON iš ${url}:`, err);
        }
    }

    if (!state.cachedWorldGeoJson) {
        console.error('Nepavyko užkrauti pasaulio šalių GeoJSON kontūrų iš nė vieno šaltinio.');
        return;
    }

    renderCountriesLayer();
}

/**
 * Sukuria skirtingų spalvų CSS smeigtuką (custom marker) pagal taško kategoriją
 */
function createCategoryIcon(category) {
    const meta = CATEGORY_META[category] || CATEGORY_META.Lėktuvu;
    return L.divIcon({
        className: 'custom-pin-wrapper',
        html: `
            <div class="custom-pin ${meta.pinClass}">
                <span class="custom-pin__inner">${meta.emoji}</span>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
}

/**
 * Sukuria keliautojų (šeimos narių) ženkliukų (badges) HTML vietos kortelei
 */
function createTravelersBadgesHtml(place) {
    const travelers = getPlaceTravelers(place);
    if (travelers.length === 0) {
        return '';
    }

    const badges = travelers
        .map(
            (name) => `
            <span class="popup-card__traveler-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${escapeHtml(name)}</span>
            </span>
        `
        )
        .join('');

    return `<div class="popup-card__travelers">${badges}</div>`;
}

/**
 * Sukuria YouTube video kortelės (arba kelių kompaktiškų kortelių su viršeliais) HTML pagal „videos“ masyvą:
 * - Jei „videos“ tuščias: nerodo nieko.
 * - Jei yra video: atvaizduoja sumažintą video viršelį (`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`),
 *   ant jo pusiau permatomą „Play“ ikoną, o po juo – video pavadinimą ir mygtuką.
 */
function createVideosButtonsHtml(place) {
    const validVideos = getValidVideos(place);
    if (validVideos.length === 0) {
        return '';
    }

    const ytIconSvg = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
    `;

    const playTriangleSvg = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4"></polygon>
        </svg>
    `;

    const cardsHtml = validVideos
        .map((video, idx) => {
            const finalPlaybackUrl = buildYouTubeUrlWithTimestamp(video.url, video.timestamp);
            const safeUrl = escapeHtml(finalPlaybackUrl || video.url);
            const videoId = extractYouTubeVideoId(video.url);
            const timestampSeconds = parseTimestampToSeconds(video.timestamp);
            const timeBadgeLabel = formatSecondsToTimeLabel(timestampSeconds);

            const videoTitle =
                video.title ||
                (validVideos.length === 1
                    ? `${place.title} – kelionės vlogas`
                    : `${place.title} – vlogas #${idx + 1}`);
            const baseBtnLabel =
                validVideos.length === 1 || !video.title
                    ? 'Žiūrėti vlogą YouTube'
                    : video.title;
            const btnLabel = timeBadgeLabel
                ? `${baseBtnLabel} (nuo ${timeBadgeLabel})`
                : baseBtnLabel;

            const timeBadgeHtml = timeBadgeLabel
                ? `<span class="popup-video-card__time-badge">⏱ ${escapeHtml(timeBadgeLabel)}</span>`
                : '';

            const thumbHtml = videoId
                ? `
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="popup-video-card__thumb-link" title="${escapeHtml(videoTitle)}">
                    <img
                        src="https://i.ytimg.com/vi/${escapeHtml(videoId)}/mqdefault.jpg"
                        alt="${escapeHtml(videoTitle)}"
                        class="popup-video-card__thumb"
                        loading="lazy"
                    >
                    <div class="popup-video-card__play" aria-hidden="true">
                        <span class="popup-video-card__play-circle">
                            ${playTriangleSvg}
                        </span>
                    </div>
                    ${timeBadgeHtml}
                </a>
                `
                : '';

            return `
                <div class="popup-video-card">
                    ${thumbHtml}
                    <div class="popup-video-card__info">
                        <div class="popup-video-card__title">${escapeHtml(videoTitle)}</div>
                        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="popup-card__yt-btn">
                            ${ytIconSvg}
                            <span>${escapeHtml(btnLabel)}</span>
                        </a>
                    </div>
                </div>
            `;
        })
        .join('');

    return `<div class="popup-card__videos">${cardsHtml}</div>`;
}

/**
 * Sukuria stilingą iššokančią kortelę (Popup) su vietos pavadinimu, kelionės data,
 * šeimos narių ženkliukais (badges), trumpu aprašymu ir dinaminiais YouTube vlogų mygtukais
 */
function createPopupHtml(place) {
    const meta = CATEGORY_META[place.category] || {
        badgeClass: 'popup-card__category--plane',
        emoji: '📍'
    };

    const dateHtml = place.date
        ? `<div class="popup-card__date">
               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                   <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                   <line x1="16" y1="2" x2="16" y2="6"></line>
                   <line x1="8" y1="2" x2="8" y2="6"></line>
                   <line x1="3" y1="10" x2="21" y2="10"></line>
               </svg>
               <span>Kelionės data: ${escapeHtml(place.date)}</span>
           </div>`
        : '';

    const travelersHtml = createTravelersBadgesHtml(place);
    const videosHtml = createVideosButtonsHtml(place);

    return `
        <div class="popup-card">
            <div class="popup-card__header">
                <div class="popup-card__badges">
                    <span class="popup-card__category ${meta.badgeClass}">${meta.emoji} ${escapeHtml(place.category)}</span>
                    <span class="popup-card__country">${escapeHtml(place.country)}</span>
                </div>
                <h3 class="popup-card__title">${escapeHtml(place.title)}</h3>
                ${dateHtml}
                ${travelersHtml}
            </div>
            <div class="popup-card__body">
                <p class="popup-card__desc">${escapeHtml(place.description)}</p>
                ${videosHtml}
            </div>
        </div>
    `;
}

/**
 * Automatiškai atnaujina viršutinius statistikos skaitiklius (Šalys | Vietos | Vlogai).
 * „Vlogai“ skaičiuojamas pagal realiai įvestų YouTube nuorodų skaičių „videos“ masyvuose.
 */
function updateStats(filteredPlaces) {
    const isUnfiltered =
        state.activeCategory === 'Visos' &&
        state.activeTraveler === 'Visi' &&
        state.searchQuery.trim() === '';

    const countriesCount =
        isUnfiltered && state.visitedCountries.length > 0
            ? state.visitedCountries.length
            : new Set(filteredPlaces.map((item) => item.country)).size;

    const totalPlaces = filteredPlaces.length;
    const totalVlogs = filteredPlaces.reduce(
        (sum, item) => sum + getValidVideos(item).length,
        0
    );

    statCountriesEl.textContent = countriesCount;
    statPlacesEl.textContent = totalPlaces;
    statVlogsEl.textContent = totalVlogs;
}

/**
 * Filtruoja vietas pagal pasirinktą kategoriją, šeimos narį ir paieškos tekstą
 */
function getFilteredPlaces() {
    const normalizedQuery = normalizeText(state.searchQuery);

    return state.places.filter((place) => {
        const matchesCategory =
            state.activeCategory === 'Visos' || place.category === state.activeCategory;
        if (!matchesCategory) return false;

        const travelers = getPlaceTravelers(place);
        const matchesTraveler =
            state.activeTraveler === 'Visi' || travelers.includes(state.activeTraveler);
        if (!matchesTraveler) return false;

        if (!normalizedQuery) return true;

        const videoTitles = getValidVideos(place)
            .map((v) => v.title)
            .join(' ');

        const searchableText = normalizeText(
            `${place.title} ${place.country} ${place.category} ${place.description} ${place.date || ''} ${travelers.join(' ')} ${videoTitles}`
        );
        return searchableText.includes(normalizedQuery);
    });
}

/**
 * Atvaizduoja smeigtukus žemėlapyje ir sklandžiai priartina (flyTo / flyToBounds)
 */
function renderMap({ fitBounds = true, isSearch = false } = {}) {
    const filtered = getFilteredPlaces();

    markersLayer.clearLayers();
    markersByPlaceId.clear();
    updateStats(filtered);

    if (filtered.length === 0) {
        emptyStateEl.hidden = false;
        return;
    }

    emptyStateEl.hidden = true;

    const latLngs = [];

    filtered.forEach((place) => {
        const coords = [place.lat, place.lng];
        const marker = L.marker(coords, {
            icon: createCategoryIcon(place.category),
            title: place.title
        });

        marker.bindPopup(createPopupHtml(place), {
            maxWidth: 300,
            closeButton: true
        });

        // Paspaudus ant smeigtuko sklandžiai centruojame
        marker.on('click', () => {
            map.flyTo(coords, Math.max(map.getZoom(), 7), {
                duration: 0.65
            });
        });

        markersLayer.addLayer(marker);
        markersByPlaceId.set(place.id, marker);
        latLngs.push(coords);
    });

    if (!fitBounds || latLngs.length === 0) {
        return;
    }

    const normalizedQuery = normalizeText(state.searchQuery);

    const exactTitleMatch =
        normalizedQuery.length >= 2
            ? filtered.find((p) => normalizeText(p.title).startsWith(normalizedQuery))
            : null;

    if (filtered.length === 1) {
        const targetPlace = filtered[0];
        const targetMarker = markersByPlaceId.get(targetPlace.id);
        map.flyTo([targetPlace.lat, targetPlace.lng], 10, {
            duration: 0.9
        });
        if (isSearch && normalizedQuery.length >= 2 && targetMarker) {
            targetMarker.openPopup();
        }
    } else if (isSearch && exactTitleMatch && filtered.length <= 3) {
        const targetMarker = markersByPlaceId.get(exactTitleMatch.id);
        map.flyTo([exactTitleMatch.lat, exactTitleMatch.lng], 9, {
            duration: 0.9
        });
        if (targetMarker) {
            targetMarker.openPopup();
        }
    } else {
        const bounds = L.latLngBounds(latLngs);
        map.flyToBounds(bounds, {
            padding: [55, 55],
            maxZoom: 9,
            duration: 0.85
        });
    }
}

/**
 * Nustato aktyvų kategorijos mygtuką
 */
function setActiveCategoryButton(category) {
    const buttons = categoryFiltersEl.querySelectorAll('.filter-chip');
    buttons.forEach((btn) => {
        const isCurrent = btn.dataset.category === category;
        btn.classList.toggle('is-active', isCurrent);
    });
}

/**
 * Nustato aktyvų šeimos nario filtro mygtuką
 */
function setActiveTravelerButton(traveler) {
    const buttons = travelerFiltersEl.querySelectorAll('.traveler-chip');
    buttons.forEach((btn) => {
        const isCurrent = btn.dataset.traveler === traveler;
        btn.classList.toggle('is-active', isCurrent);
    });
}

/* ==========================================================================
   ADMINISTRAVIMO REŽIMAS (Slaptažodis, sessionStorage, Admin Dashboard)
   ========================================================================== */

/**
 * Patikrina, ar vartotojas šioje naršyklės sesijoje jau įvedė teisingą slaptažodį
 */
function isAdminAuthenticated() {
    try {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Išsaugo arba išvalo administravimo sesiją sessionStorage
 */
function setAdminAuthenticated(isAuthenticated) {
    try {
        if (isAuthenticated) {
            sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        } else {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
    } catch {
        // Ignoruojame, jei sessionStorage neprieinamas
    }
}

/**
 * Patikrina įvestą slaptažodį per SHA-256 (su konstantos palyginimo atsarginiu variantu)
 */
async function verifyAdminPassword(password) {
    const trimmed = String(password || '');
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        try {
            const msgBuffer = new TextEncoder().encode(trimmed);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
            return hashHex === ADMIN_PASSWORD_SHA256;
        } catch {
            return trimmed === ADMIN_PASSWORD_PLAIN;
        }
    }
    return trimmed === ADMIN_PASSWORD_PLAIN;
}

/**
 * Atidaro arba uždaro slaptažodžio prisijungimo modalinį langelį
 */
function setLoginModalOpen(isOpen) {
    adminLoginModalEl.hidden = !isOpen;
    adminLoginErrorEl.hidden = true;
    adminPasswordInputEl.value = '';
    if (isOpen) {
        setTimeout(() => adminPasswordInputEl.focus(), 50);
    }
}

/**
 * Iškviečia Admin prisijungimo langą arba (jei sesija galioja) atidaro Admin Dashboard
 */
function requestAdminAccess() {
    if (isAdminAuthenticated()) {
        setAdminMode(true);
    } else {
        setLoginModalOpen(true);
    }
}

/**
 * Nustato šeimos narių varneles (checkboxes) admin formoje
 */
function setAdminTravelerCheckboxes(selectedTravelers = DEFAULT_TRAVELERS) {
    const selectedSet = new Set(selectedTravelers);
    const checkboxes = adminTravelersCheckboxesEl.querySelectorAll('input[name="placeTraveler"]');
    checkboxes.forEach((cb) => {
        cb.checked = selectedSet.has(cb.value);
    });
}

/**
 * Nuskaito pažymėtus šeimos narius iš admin formos varnelių
 */
function readAdminTravelerCheckboxes() {
    const checkboxes = adminTravelersCheckboxesEl.querySelectorAll(
        'input[name="placeTraveler"]:checked'
    );
    return Array.from(checkboxes).map((cb) => cb.value);
}

/**
 * Atvaizduoja „videos“ įvesties eilutes admin formoje (Video URL, neprivalomas Pavadinimas ir neprivaloma Laiko žyma t).
 * Net jei video dar nėra, iškart parodoma 1 paruošta įvesties eilutė patogiam URL įklijavimui (Paste).
 */
function renderAdminVideoRows(videos = []) {
    const rowsToRender =
        Array.isArray(videos) && videos.length > 0
            ? videos
            : [{ title: '', url: '', timestamp: '' }];

    adminVideosContainerEl.innerHTML = rowsToRender
        .map((video, idx) => {
            const savedTimestamp =
                video && video.timestamp !== undefined && video.timestamp !== null
                    ? String(video.timestamp)
                    : video && video.t !== undefined && video.t !== null
                      ? String(video.t)
                      : '';
            return `
            <div class="admin-video-row" data-video-idx="${idx}">
                <input
                    type="text"
                    inputmode="url"
                    class="admin-video-url"
                    placeholder="Įklijuokite YouTube video URL (https://www.youtube.com/watch?v=...)"
                    value="${escapeHtml((video && video.url) || '')}"
                    autocomplete="off"
                    spellcheck="false"
                >
                <button
                    type="button"
                    class="admin-video-row__remove"
                    data-remove-video-idx="${idx}"
                    title="Išvalyti arba pašalinti video eilutę"
                    aria-label="Pašalinti video"
                >✕</button>
                <input
                    type="text"
                    class="admin-video-title"
                    placeholder="Video pavadinimas (neprivaloma – priskirs automatiškai)"
                    value="${escapeHtml((video && video.title) || '')}"
                    autocomplete="off"
                >
                <input
                    type="text"
                    class="admin-video-timestamp"
                    placeholder="Laiko žyma (neprivaloma, pvz. 03:45)"
                    title="Neprivaloma laiko žyma (t, pvz. 03:45, 3m30s arba sekundėmis)"
                    value="${escapeHtml(savedTimestamp)}"
                    autocomplete="off"
                >
            </div>
        `;
        })
        .join('');
}

/**
 * Nuskaito šiuo metu admin formoje įvestas „videos“ eilutes (su „timestamp“ laukeliu)
 */
function readAdminVideoRowsFromDom() {
    const rows = adminVideosContainerEl.querySelectorAll('.admin-video-row');
    const result = [];
    rows.forEach((row) => {
        const titleInput = row.querySelector('.admin-video-title');
        const urlInput = row.querySelector('.admin-video-url');
        const timestampInput = row.querySelector('.admin-video-timestamp');
        result.push({
            title: titleInput ? titleInput.value.trim() : '',
            url: urlInput ? urlInput.value.trim() : '',
            timestamp: timestampInput ? timestampInput.value.trim() : ''
        });
    });
    return result;
}

/**
 * Įjungia arba išjungia pilno ekrano Admin Dashboard modalinį langą
 */
function setAdminMode(isOpen) {
    state.isAdminOpen = Boolean(isOpen);
    if (state.isAdminOpen) {
        state.isPickingCoords = false;
        adminPickBannerEl.hidden = true;
    }
    adminDashboardModalEl.hidden = !state.isAdminOpen;
    adminToggleBtnEl.classList.toggle('is-active', state.isAdminOpen || state.isPickingCoords);
    adminToggleBtnEl.setAttribute('aria-expanded', String(state.isAdminOpen));

    if (!state.isAdminOpen && !state.isPickingCoords && adminPickMarker) {
        map.removeLayer(adminPickMarker);
        adminPickMarker = null;
    }

    if (state.isAdminOpen) {
        renderAdminPanel();
    }
}

/**
 * Įjungia koordinačių parinkimo iš žemėlapio režimą (laikinai paslepia modalą, kad būtų galima paspausti ant žemėlapio)
 */
function startPickingCoordsOnMap() {
    state.isAdminOpen = false;
    state.isPickingCoords = true;
    adminDashboardModalEl.hidden = true;
    adminPickBannerEl.hidden = false;
    adminToggleBtnEl.classList.add('is-active');
}

/**
 * Pastato arba perkelia laikiną taško parinkimo žymeklį žemėlapyje
 */
function setAdminPickMarker(lat, lng) {
    const coords = [lat, lng];
    if (!adminPickMarker) {
        adminPickMarker = L.marker(coords, {
            icon: L.divIcon({
                className: 'custom-pin-wrapper',
                html: '<div class="admin-pick-pin"></div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            })
        }).addTo(map);
    } else {
        adminPickMarker.setLatLng(coords);
    }
}

/**
 * Atnaujina „Smulkesni nustatymai“ antraštėje rodomą lat/lng santrauką
 */
function updateCoordsPreviewBadge() {
    if (!coordsPreviewBadgeEl) return;
    const lat = parseFloat(placeLatInputEl.value);
    const lng = parseFloat(placeLngInputEl.value);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        coordsPreviewBadgeEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } else {
        coordsPreviewBadgeEl.textContent = 'Koordinatės dar neparinktos';
    }
}

// Visų ISO-2 šalių kodų žemėlapis pagal lietuvišką (ir anglišką) pavadinimą
let countryNameToIso2Map = null;

function getCountryNameToIso2Map() {
    if (countryNameToIso2Map) return countryNameToIso2Map;
    countryNameToIso2Map = new Map();

    const enDisplayNames =
        typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
            ? new Intl.DisplayNames(['en'], { type: 'region' })
            : null;

    // Sugeneruojame visus galimus 2 raidžių ISO-3166-1 alpha-2 kodus (AA..ZZ)
    for (let i = 65; i <= 90; i++) {
        for (let j = 65; j <= 90; j++) {
            const code = String.fromCharCode(i) + String.fromCharCode(j);
            if (regionDisplayNamesLt) {
                try {
                    const ltName = regionDisplayNamesLt.of(code);
                    if (ltName && ltName.toUpperCase() !== code) {
                        countryNameToIso2Map.set(normalizeText(ltName), code);
                    }
                } catch {
                    // Ignoruojame negaliojančius kodus
                }
            }
            if (enDisplayNames) {
                try {
                    const enName = enDisplayNames.of(code);
                    if (enName && enName.toUpperCase() !== code) {
                        countryNameToIso2Map.set(normalizeText(enName), code);
                    }
                } catch {
                    // Ignoruojame negaliojančius kodus
                }
            }
        }
    }

    // Atsarginis žodynas iš COUNTRY_NAMES_LT
    Object.entries(COUNTRY_NAMES_LT).forEach(([code, name]) => {
        countryNameToIso2Map.set(normalizeText(name), code);
    });

    // Papildomi dažni sinonimai lietuvių kalba
    countryNameToIso2Map.set(normalizeText('Gruzija'), 'GE');
    countryNameToIso2Map.set(normalizeText('Sakartvelas'), 'GE');
    countryNameToIso2Map.set(normalizeText('Jungtinė Karalystė'), 'GB');
    countryNameToIso2Map.set(normalizeText('Didžioji Britanija'), 'GB');
    countryNameToIso2Map.set(normalizeText('Anglija'), 'GB');
    countryNameToIso2Map.set(normalizeText('JAV'), 'US');
    countryNameToIso2Map.set(normalizeText('Jungtinės Amerikos Valstijos'), 'US');
    countryNameToIso2Map.set(normalizeText('JAE'), 'AE');
    countryNameToIso2Map.set(normalizeText('Jungtiniai Arabų Emyratai'), 'AE');
    countryNameToIso2Map.set(normalizeText('Čekija'), 'CZ');

    return countryNameToIso2Map;
}

/**
 * Pagal lietuvišką (arba anglišką) šalies pavadinimą arba 2 raidžių kodą suranda jos ISO-2 kodą
 */
function findIso2ByCountryName(countryName) {
    const raw = String(countryName || '').trim();
    if (!raw) return '';

    if (/^[A-Za-z]{2}$/.test(raw)) {
        return raw.toUpperCase();
    }

    const target = normalizeText(raw);
    if (!target) return '';

    const isoMap = getCountryNameToIso2Map();
    if (isoMap.has(target)) {
        return isoMap.get(target);
    }

    if (state.cachedWorldGeoJson && Array.isArray(state.cachedWorldGeoJson.features)) {
        for (const feature of state.cachedWorldGeoJson.features) {
            const code = getFeatureIsoCode(feature);
            if (/^[A-Z]{2}$/.test(code)) {
                const ltName = normalizeText(getCountryDisplayName(feature, code));
                if (ltName === target) {
                    return code;
                }
            }
        }
    }

    return '';
}

/**
 * Įtraukia šalies ISO-2 kodą į state.visitedCountries, jei jo ten dar nėra
 */
function ensureVisitedCountryIso2(iso2Code) {
    const cleanCode = String(iso2Code || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cleanCode)) return false;

    const alreadyVisited = state.visitedCountries.some(
        (code) => String(code).trim().toUpperCase() === cleanCode
    );
    if (!alreadyVisited) {
        state.visitedCountries.push(cleanCode);
        return true;
    }
    return false;
}

// Paskutiniai Nominatim paieškos rezultatai ir pasirinktas ISO-2 kodas
let lastNominatimResults = [];
let nominatimDebounceTimer = null;
let selectedNominatimIso2 = '';

/**
 * Iš Nominatim objekto ištraukia lietuvišką vietos pavadinimą, šalies pavadinimą (per Intl.DisplayNames), ISO-2 kodą ir lat/lng
 */
function parseNominatimItem(item) {
    const addr = item.address || {};
    const displayParts = String(item.display_name || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    const rawIso2 = addr.country_code ? String(addr.country_code).trim().toUpperCase() : '';
    const fallbackCountryName =
        addr.country || (displayParts.length > 0 ? displayParts[displayParts.length - 1] : '');
    const iso2 = /^[A-Z]{2}$/.test(rawIso2)
        ? rawIso2
        : findIso2ByCountryName(fallbackCountryName);

    // Šalies pavadinimas lietuviškai per Intl.DisplayNames
    const countryLt = iso2
        ? getCountryDisplayName(null, iso2)
        : fallbackCountryName;

    // Vietos pavadinimas lietuviškai
    const placeTitle =
        item.name ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.tourism ||
        addr.attraction ||
        addr.island ||
        addr.county ||
        addr.state ||
        displayParts[0] ||
        '';

    const lat = Number(parseFloat(item.lat).toFixed(4));
    const lng = Number(parseFloat(item.lon).toFixed(4));

    return {
        title: placeTitle,
        countryLt,
        iso2,
        lat,
        lng,
        displayName: item.display_name || `${placeTitle}, ${countryLt}`
    };
}

/**
 * Kreipiasi į nemokamą Nominatim API ir atvaizduoja rastų vietų sąrašą
 */
async function searchNominatimPlaces(rawQuery) {
    const query = String(rawQuery || '').trim();
    if (query.length < 2) {
        placeGeocodeResultsEl.hidden = true;
        placeGeocodeResultsEl.innerHTML = '';
        lastNominatimResults = [];
        return;
    }

    placeGeocodeResultsEl.hidden = false;
    placeGeocodeResultsEl.innerHTML =
        '<div class="admin-geocode-status">Ieškoma vietų per OpenStreetMap Nominatim...</div>';

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=lt&limit=5&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'lt'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const items = await response.json();
        if (!Array.isArray(items) || items.length === 0) {
            lastNominatimResults = [];
            placeGeocodeResultsEl.innerHTML =
                '<div class="admin-geocode-status">Vietų nerasta. Pabandykite kitą pavadinimą.</div>';
            return;
        }

        lastNominatimResults = items.map(parseNominatimItem);

        placeGeocodeResultsEl.innerHTML = lastNominatimResults
            .map(
                (res, idx) => `
                <button
                    type="button"
                    class="admin-geocode-item"
                    role="option"
                    data-geocode-idx="${idx}"
                >
                    <div class="admin-geocode-item__main">
                        <div class="admin-geocode-item__title">
                            📍 ${escapeHtml(res.title)} ${res.countryLt ? `— ${escapeHtml(res.countryLt)}` : ''}
                        </div>
                        <div class="admin-geocode-item__sub">${escapeHtml(res.displayName)}</div>
                    </div>
                    <span class="admin-geocode-item__badge">
                        ${escapeHtml(res.iso2 || '—')} · ${res.lat}, ${res.lng}
                    </span>
                </button>
            `
            )
            .join('');
    } catch (error) {
        console.warn('Nominatim paieškos klaida:', error);
        placeGeocodeResultsEl.innerHTML =
            '<div class="admin-geocode-status">Nepavyko susisiekti su Nominatim paieška. Bandykite dar kartą.</div>';
    }
}

/**
 * Pasirinkus vietą iš Nominatim sąrašo, automatiškai užpildo formos laukelius (įskaitant ISO-2 kodą)
 */
function applyGeocodeResult(result) {
    if (!result) return;

    const resolvedIso2 = (
        result.iso2 ||
        findIso2ByCountryName(result.countryLt) ||
        ''
    ).toUpperCase();

    selectedNominatimIso2 = resolvedIso2;
    placeTitleInputEl.value = result.title;
    placeCountryInputEl.value = result.countryLt;
    if (placeCountryCodeInputEl) {
        placeCountryCodeInputEl.value = resolvedIso2;
    }
    if (newCountryCodeInputEl) {
        newCountryCodeInputEl.value = resolvedIso2;
    }
    placeLatInputEl.value = result.lat;
    placeLngInputEl.value = result.lng;

    updateCoordsPreviewBadge();
    setAdminPickMarker(result.lat, result.lng);
    map.flyTo([result.lat, result.lng], 8, { duration: 0.65 });

    placeGeocodeResultsEl.hidden = true;
}

/**
 * Atstato vietos formą į kūrimo būseną
 */
function resetPlaceForm() {
    state.editingPlaceId = null;
    selectedNominatimIso2 = '';
    placeFormEl.reset();
    placeIdInputEl.value = '';
    if (placeGeocodeInputEl) placeGeocodeInputEl.value = '';
    if (placeGeocodeResultsEl) {
        placeGeocodeResultsEl.hidden = true;
        placeGeocodeResultsEl.innerHTML = '';
    }
    if (placeCountryCodeInputEl) placeCountryCodeInputEl.value = '';
    if (newCountryCodeInputEl) newCountryCodeInputEl.value = '';
    if (placeAdvancedDetailsEl) placeAdvancedDetailsEl.open = false;

    placeFormHeadingEl.textContent = 'Pridėti naują vietą';
    savePlaceBtnEl.textContent = 'Pridėti vietą';
    cancelEditBtnEl.hidden = true;
    setAdminTravelerCheckboxes(DEFAULT_TRAVELERS);
    renderAdminVideoRows([]);
    updateCoordsPreviewBadge();

    if (adminPickMarker) {
        map.removeLayer(adminPickMarker);
        adminPickMarker = null;
    }
}

/**
 * Užpildo vietos formą pasirinkto taško redagavimui
 */
function startEditingPlace(placeId) {
    const place = state.places.find((item) => String(item.id) === String(placeId));
    if (!place) return;

    // 1) Iškart nustatome redaguojamo taško ID, kad išsaugant būtų atnaujinamas esamas įrašas
    state.editingPlaceId = place.id;
    placeIdInputEl.value = String(place.id);

    // 2) Užpildome visus formos laukelius esamo taško duomenimis
    placeTitleInputEl.value = place.title ?? '';
    placeCountryInputEl.value = place.country ?? '';
    placeDateInputEl.value = place.date ?? '';

    const categoryValue = place.category || 'Automobiliu';
    if (
        placeCategoryInputEl &&
        !Array.from(placeCategoryInputEl.options).some((opt) => opt.value === categoryValue)
    ) {
        const customOpt = document.createElement('option');
        customOpt.value = categoryValue;
        customOpt.textContent = categoryValue;
        placeCategoryInputEl.appendChild(customOpt);
    }
    placeCategoryInputEl.value = categoryValue;

    // Užpildome tikslų aprašymą (description)
    const descriptionText =
        typeof place.description === 'string'
            ? place.description
            : typeof place.desc === 'string'
              ? place.desc
              : '';
    placeDescInputEl.value = descriptionText;

    // Koordinatės
    placeLatInputEl.value = place.lat ?? '';
    placeLngInputEl.value = place.lng ?? '';
    updateCoordsPreviewBadge();

    // Šeimos narių varnelės (travelers) ir YouTube video nuorodos (videos)
    setAdminTravelerCheckboxes(getPlaceTravelers(place));
    const existingVideos =
        Array.isArray(place.videos) && place.videos.length > 0
            ? place.videos
            : getValidVideos(place);
    renderAdminVideoRows(existingVideos);

    // Šalies ISO-2 kodas
    let resolvedIso2 = '';
    try {
        resolvedIso2 = (
            place.countryCode ||
            findIso2ByCountryName(place.country) ||
            ''
        ).toUpperCase();
    } catch {
        resolvedIso2 = '';
    }
    selectedNominatimIso2 = resolvedIso2;
    if (placeCountryCodeInputEl) {
        placeCountryCodeInputEl.value = resolvedIso2;
    }
    if (newCountryCodeInputEl) {
        newCountryCodeInputEl.value = resolvedIso2;
    }

    if (placeGeocodeInputEl) {
        placeGeocodeInputEl.value = '';
    }
    if (placeGeocodeResultsEl) {
        placeGeocodeResultsEl.hidden = true;
    }

    placeFormHeadingEl.textContent = `Redaguoti: ${place.title}`;
    savePlaceBtnEl.textContent = 'Atnaujinti / Išsaugoti';
    cancelEditBtnEl.hidden = false;

    setAdminPickMarker(place.lat, place.lng);
    map.flyTo([place.lat, place.lng], 9, { duration: 0.7 });
    renderAdminPanel();

    const leftColumnEl = placeFormEl.closest('.admin-dashboard__left');
    if (leftColumnEl) {
        leftColumnEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    placeTitleInputEl.focus();
}

/**
 * Ištrina tašką pagal ID
 */
function deletePlace(placeId) {
    state.places = state.places.filter((item) => String(item.id) !== String(placeId));
    if (String(state.editingPlaceId) === String(placeId)) {
        resetPlaceForm();
    }
    renderMap({ fitBounds: false });
    renderCountriesLayer();
    renderAdminPanel();
}

/**
 * Grąžina Admin lentelės taškus pagal paieškos ir kategorijos filtrus
 */
function getAdminFilteredPlaces() {
    const query = normalizeText(state.adminTableSearch);
    const category = state.adminTableCategory;

    return state.places.filter((place) => {
        const matchesCategory = category === 'Visos' || place.category === category;
        if (!matchesCategory) return false;

        if (!query) return true;

        const searchable = normalizeText(
            `${place.id} ${place.title} ${place.country} ${place.date || ''} ${place.description || ''} ${getPlaceTravelers(place).join(' ')}`
        );
        return searchable.includes(query);
    });
}

/**
 * Atvaizduoja aplankytų šalių ISO kodus ir plačią esamų taškų lentelę Admin Dashboard modale
 */
function renderAdminPanel() {
    // 1) Aplankytos šalys (ISO-2 + lietuviškas pavadinimas)
    adminCountriesListEl.innerHTML = state.visitedCountries
        .map((code) => {
            const ltName = getCountryDisplayName(null, code);
            return `
            <span class="admin-country-chip" title="${escapeHtml(ltName)}">
                <span>${escapeHtml(code)} · ${escapeHtml(ltName)}</span>
                <button
                    type="button"
                    class="admin-country-chip__remove"
                    data-remove-country="${escapeHtml(code)}"
                    title="Pašalinti ${escapeHtml(ltName)} (${escapeHtml(code)})"
                    aria-label="Pašalinti šalį ${escapeHtml(code)}"
                >✕</button>
            </span>
        `;
        })
        .join('');

    // 2) Plačios esamų taškų lentelės atvaizdavimas
    const filteredPlaces = getAdminFilteredPlaces();
    adminPlacesCountEl.textContent = `${filteredPlaces.length} / ${state.places.length}`;

    if (filteredPlaces.length === 0) {
        adminPlacesTableBodyEl.innerHTML = `
            <tr>
                <td colspan="8" class="admin-table__empty">
                    Pagal pasirinktus paieškos ar kategorijos filtrus vietų nerasta.
                </td>
            </tr>
        `;
        return;
    }

    adminPlacesTableBodyEl.innerHTML = filteredPlaces
        .map((place) => {
            const meta = CATEGORY_META[place.category] || {
                emoji: '📍',
                badgeClass: 'popup-card__category--car'
            };
            const videosCount = getValidVideos(place).length;
            const travelers = getPlaceTravelers(place);
            const isEditing = state.editingPlaceId === place.id;

            const travelersHtml = travelers
                .map(
                    (name) =>
                        `<span class="admin-table__traveler-pill">${escapeHtml(name)}</span>`
                )
                .join('');

            const vlogsHtml =
                videosCount > 0
                    ? `<span class="admin-table__vlog-badge admin-table__vlog-badge--has">▶ ${videosCount} vlog.</span>`
                    : `<span class="admin-table__vlog-badge admin-table__vlog-badge--none">0</span>`;

            return `
                <tr class="${isEditing ? 'is-editing' : ''}">
                    <td class="admin-table__id">#${place.id}</td>
                    <td>
                        <div class="admin-table__place-title">${escapeHtml(place.title)}</div>
                        <div class="admin-table__place-country">${escapeHtml(place.country)}</div>
                    </td>
                    <td>
                        <span class="popup-card__category ${meta.badgeClass}">
                            ${meta.emoji} ${escapeHtml(place.category)}
                        </span>
                    </td>
                    <td>${escapeHtml(place.date || '—')}</td>
                    <td>
                        <div class="admin-table__travelers">${travelersHtml}</div>
                    </td>
                    <td class="admin-table__coords">${Number(place.lat).toFixed(4)}, ${Number(place.lng).toFixed(4)}</td>
                    <td>${vlogsHtml}</td>
                    <td>
                        <div class="admin-table__actions">
                            <button type="button" class="admin-icon-btn" data-edit-id="${place.id}">Redaguoti</button>
                            <button type="button" class="admin-icon-btn admin-icon-btn--danger" data-delete-id="${place.id}">Ištrinti</button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join('');
}

/**
 * Sugeneruoja pilną formatuotą keliones.json tekstą
 */
function generateKelionesJsonString() {
    const payload = {
        visitedCountries: state.visitedCountries,
        places: state.places
    };
    return JSON.stringify(payload, null, 2) + '\n';
}

// 1) Paspaudus bet kur ant žemėlapio (kai renkamos koordinatės arba sesija aktyvi) – įrašomos lat ir lng koordinatės į formą
map.on('click', (event) => {
    if (!state.isPickingCoords && !isAdminAuthenticated()) return;

    const lat = Number(event.latlng.lat.toFixed(4));
    const lng = Number(event.latlng.lng.toFixed(4));

    placeLatInputEl.value = lat;
    placeLngInputEl.value = lng;
    updateCoordsPreviewBadge();
    setAdminPickMarker(lat, lng);

    if (state.isPickingCoords) {
        setAdminMode(true);
    }
});

// Keičiant lat/lng rankiniu būdu po „Smulkesni nustatymai“ – atnaujiname santraukos ženkliuką
placeLatInputEl.addEventListener('input', updateCoordsPreviewBadge);
placeLngInputEl.addEventListener('input', updateCoordsPreviewBadge);

// Išmanios Nominatim vietos paieškos įvykiai (mygtukas „Rasti“, Enter ir teksto įvedimas)
placeGeocodeBtnEl.addEventListener('click', () => {
    if (nominatimDebounceTimer) clearTimeout(nominatimDebounceTimer);
    searchNominatimPlaces(placeGeocodeInputEl.value);
});

placeGeocodeInputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (nominatimDebounceTimer) clearTimeout(nominatimDebounceTimer);
        searchNominatimPlaces(placeGeocodeInputEl.value);
    }
});

placeGeocodeInputEl.addEventListener('input', (event) => {
    const query = event.target.value.trim();
    if (nominatimDebounceTimer) clearTimeout(nominatimDebounceTimer);

    if (query.length < 2) {
        placeGeocodeResultsEl.hidden = true;
        placeGeocodeResultsEl.innerHTML = '';
        return;
    }

    nominatimDebounceTimer = setTimeout(() => {
        searchNominatimPlaces(query);
    }, 420);
});

// Paspaudus ant rastos vietos iš Nominatim sąrašo – automatiškai užpildome formą
placeGeocodeResultsEl.addEventListener('click', (event) => {
    const optionBtn = event.target.closest('[data-geocode-idx]');
    if (!optionBtn) return;

    const idx = Number(optionBtn.dataset.geocodeIdx);
    const chosen = lastNominatimResults[idx];
    if (chosen) {
        applyGeocodeResult(chosen);
    }
});

// Keičiant šalies pavadinimą rankiniu būdu – automatiškai nustatome ISO-2 kodą
placeCountryInputEl.addEventListener('input', () => {
    const inferredIso2 = findIso2ByCountryName(placeCountryInputEl.value);
    if (inferredIso2) {
        selectedNominatimIso2 = inferredIso2;
        if (placeCountryCodeInputEl) {
            placeCountryCodeInputEl.value = inferredIso2;
        }
        if (newCountryCodeInputEl) {
            newCountryCodeInputEl.value = inferredIso2;
        }
    }
});

// Keičiant ISO-2 kodą formoje – sinchronizuojame su visitedCountries įvestimi ir (jei šalis tuščia) užpildome pavadinimą
if (placeCountryCodeInputEl) {
    placeCountryCodeInputEl.addEventListener('input', () => {
        const cleanIso2 = placeCountryCodeInputEl.value.trim().toUpperCase();
        selectedNominatimIso2 = cleanIso2;
        if (newCountryCodeInputEl) {
            newCountryCodeInputEl.value = cleanIso2;
        }
        if (/^[A-Z]{2}$/.test(cleanIso2) && !placeCountryInputEl.value.trim()) {
            placeCountryInputEl.value = getCountryDisplayName(null, cleanIso2);
        }
    });
}

// Keičiant priartinimą režime „Tik šalys“ – atnaujiname šalių centrų užrašus
map.on('zoomend', () => {
    if (state.mapMode === 'countries' && state.cachedWorldGeoJson) {
        const visitedSet = new Set(
            state.visitedCountries.map((code) => String(code).trim().toUpperCase())
        );
        const processedGeoJson = prepareFilteredGeoJson(
            state.cachedWorldGeoJson,
            visitedSet,
            state.places
        );
        renderCountryCenterLabels(processedGeoJson, visitedSet);
    }
});

// Spynos mygtuko paspaudimas kampe
adminToggleBtnEl.addEventListener('click', () => {
    if (state.isAdminOpen) {
        setAdminMode(false);
    } else {
        requestAdminAccess();
    }
});

// Prisijungimo formos pateikimas (slaptažodžio patikra)
adminLoginFormEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    const enteredPassword = adminPasswordInputEl.value;
    const isValid = await verifyAdminPassword(enteredPassword);

    if (isValid) {
        setAdminAuthenticated(true);
        setLoginModalOpen(false);
        setAdminMode(true);
    } else {
        adminLoginErrorEl.hidden = false;
        adminPasswordInputEl.select();
    }
});

adminLoginCancelBtnEl.addEventListener('click', () => {
    setLoginModalOpen(false);
});

// Atsijungimo mygtukas Admin Dashboard viršuje
adminLogoutBtnEl.addEventListener('click', () => {
    setAdminAuthenticated(false);
    state.isPickingCoords = false;
    adminPickBannerEl.hidden = true;
    setAdminMode(false);
});

// Admin Dashboard uždarymo mygtukas
adminCloseBtnEl.addEventListener('click', () => {
    setAdminMode(false);
});

// Koordinačių parinkimo iš žemėlapio mygtukai
pickCoordsOnMapBtnEl.addEventListener('click', () => {
    startPickingCoordsOnMap();
});

inlinePickCoordsBtnEl.addEventListener('click', () => {
    startPickingCoordsOnMap();
});

returnToAdminBtnEl.addEventListener('click', () => {
    setAdminMode(true);
});

// Escape klavišas uždaro prisijungimo arba Admin Dashboard langą
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!adminLoginModalEl.hidden) {
            setLoginModalOpen(false);
        } else if (state.isAdminOpen) {
            setAdminMode(false);
        } else if (state.isPickingCoords) {
            setAdminMode(true);
        }
    }
});

// Admin lentelės paieškos ir kategorijos filtrai
adminTableSearchInputEl.addEventListener('input', (event) => {
    state.adminTableSearch = event.target.value;
    renderAdminPanel();
});

adminTableCategoryFilterEl.addEventListener('change', (event) => {
    state.adminTableCategory = event.target.value;
    renderAdminPanel();
});

// „+ Pridėti video“ mygtukas admin formoje
addVideoRowBtnEl.addEventListener('click', () => {
    const currentVideos = readAdminVideoRowsFromDom();
    currentVideos.push({ title: '', url: '', timestamp: '' });
    renderAdminVideoRows(currentVideos);
    const urlInputs = adminVideosContainerEl.querySelectorAll('.admin-video-url');
    if (urlInputs.length > 0) {
        urlInputs[urlInputs.length - 1].focus();
    }
});

// Video eilutės pašalinimas admin formoje
adminVideosContainerEl.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-remove-video-idx]');
    if (!removeBtn) return;

    const idxToRemove = Number(removeBtn.dataset.removeVideoIdx);
    const currentVideos = readAdminVideoRowsFromDom().filter((_, idx) => idx !== idxToRemove);
    renderAdminVideoRows(currentVideos);
});

// 2) Vietos pridėjimo / redagavimo formos pateikimas
placeFormEl.addEventListener('submit', (event) => {
    event.preventDefault();

    const lat = parseFloat(placeLatInputEl.value);
    const lng = parseFloat(placeLngInputEl.value);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        if (placeAdvancedDetailsEl) {
            placeAdvancedDetailsEl.open = true;
        }
        placeLatInputEl.focus();
        return;
    }

    const placeTitle = placeTitleInputEl.value.trim();
    const selectedTravelers = readAdminTravelerCheckboxes();

    const rawVideos = readAdminVideoRowsFromDom();
    const nonEmptyVideos = rawVideos.filter((v) => String(v.url || '').trim().length > 0);
    const cleanedVideos = nonEmptyVideos
        .map((v, idx) => {
            const validUrl = getValidHttpUrl(v.url);
            if (!validUrl) return null;

            // 3) Išmanus video pavadinimas: jei neįvestas ranka, priskiriame vietos pavadinimą arba „Kelionės vlogas“
            const manualTitle = String(v.title || '').trim();
            const defaultBaseTitle = placeTitle || 'Kelionės vlogas';
            const smartTitle =
                manualTitle ||
                (nonEmptyVideos.length > 1 ? `${defaultBaseTitle} #${idx + 1}` : defaultBaseTitle);

            const entry = {
                title: smartTitle,
                url: validUrl
            };

            // 2) Laiko žyma (timestamp) yra neprivaloma: įrašoma tik jei įvesta ir galiojanti (> 0 s)
            const trimmedTimestamp = String(v.timestamp || '').trim();
            if (trimmedTimestamp && parseTimestampToSeconds(trimmedTimestamp) > 0) {
                entry.timestamp = trimmedTimestamp;
            }

            return entry;
        })
        .filter(Boolean);

    const countryName = placeCountryInputEl.value.trim();
    const formIso2 = placeCountryCodeInputEl
        ? placeCountryCodeInputEl.value.trim().toUpperCase()
        : '';
    const countryBoxIso2 = newCountryCodeInputEl
        ? newCountryCodeInputEl.value.trim().toUpperCase()
        : '';

    const resolvedIso2 =
        (/^[A-Z]{2}$/.test(formIso2) && formIso2) ||
        (/^[A-Z]{2}$/.test(selectedNominatimIso2) && selectedNominatimIso2) ||
        (/^[A-Z]{2}$/.test(countryBoxIso2) && countryBoxIso2) ||
        findIso2ByCountryName(countryName);

    // 3) Automatinis šalies pridėjimas: išsaugant vietą (naują arba redaguojamą), jos šalies ISO-2 kodas automatiškai įtraukiamas į visitedCountries
    if (resolvedIso2) {
        ensureVisitedCountryIso2(resolvedIso2);
    }

    // Nustatome, ar redaguojamas esamas taškas, ar kuriamas naujas
    const hiddenIdRaw = placeIdInputEl.value.trim();
    const editingId =
        state.editingPlaceId !== null
            ? state.editingPlaceId
            : hiddenIdRaw !== ''
              ? Number(hiddenIdRaw)
              : null;
    const isEditingExisting =
        editingId !== null &&
        !Number.isNaN(Number(editingId)) &&
        state.places.some((item) => String(item.id) === String(editingId));

    const targetId = isEditingExisting
        ? editingId
        : state.places.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;

    const placePayload = {
        id: Number(targetId),
        title: placeTitleInputEl.value.trim(),
        country: countryName,
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        date: placeDateInputEl.value,
        category: placeCategoryInputEl.value,
        description: placeDescInputEl.value.trim(),
        travelers: selectedTravelers.length > 0 ? selectedTravelers : [...DEFAULT_TRAVELERS],
        videos: cleanedVideos
    };

    if (isEditingExisting) {
        state.places = state.places.map((item) =>
            String(item.id) === String(editingId) ? placePayload : item
        );
    } else {
        state.places.push(placePayload);
    }

    resetPlaceForm();
    renderMap({ fitBounds: false });
    renderCountriesLayer();
    updateStats(getFilteredPlaces());
    renderAdminPanel();

    map.flyTo([placePayload.lat, placePayload.lng], Math.max(map.getZoom(), 7), {
        duration: 0.7
    });

    const updatedMarker = markersByPlaceId.get(placePayload.id);
    if (updatedMarker) {
        updatedMarker.openPopup();
    }
});

cancelEditBtnEl.addEventListener('click', () => {
    resetPlaceForm();
    renderAdminPanel();
});

// Esamų taškų lentelės paspaudimai (Redaguoti / Ištrinti)
adminPlacesTableBodyEl.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-edit-id]');
    if (editBtn) {
        const placeId = Number(editBtn.dataset.editId);
        startEditingPlace(placeId);
        return;
    }

    const deleteBtn = event.target.closest('[data-delete-id]');
    if (deleteBtn) {
        const placeId = Number(deleteBtn.dataset.deleteId);
        deletePlace(placeId);
    }
});

// Naujos šalies ISO-2 kodo pridėjimas į visitedCountries
countryFormEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const rawCode = newCountryCodeInputEl.value.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(rawCode)) return;

    if (!state.visitedCountries.includes(rawCode)) {
        state.visitedCountries.push(rawCode);
        renderCountriesLayer();
        updateStats(getFilteredPlaces());
        renderAdminPanel();
    }

    newCountryCodeInputEl.value = '';
});

// Šalies ISO-2 kodo pašalinimas iš visitedCountries
adminCountriesListEl.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-remove-country]');
    if (!removeBtn) return;

    const codeToRemove = removeBtn.dataset.removeCountry;
    state.visitedCountries = state.visitedCountries.filter((code) => code !== codeToRemove);
    renderCountriesLayer();
    updateStats(getFilteredPlaces());
    renderAdminPanel();
});

// 3) Eksportavimo mygtukas „Atsisiųsti keliones.json“
downloadJsonBtnEl.addEventListener('click', () => {
    const jsonString = generateKelionesJsonString();
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'keliones.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// 3) Eksportavimo mygtukas „Kopijuoti JSON“
copyJsonBtnEl.addEventListener('click', async () => {
    const jsonString = generateKelionesJsonString();
    try {
        await navigator.clipboard.writeText(jsonString);
        copyJsonBtnTextEl.textContent = 'Nukopijuota! ✓';
        setTimeout(() => {
            copyJsonBtnTextEl.textContent = 'Kopijuoti JSON';
        }, 2000);
    } catch (err) {
        console.error('Nepavyko nukopijuoti JSON:', err);
    }
});

/* ==========================================================================
   Automatinis duomenų importas iš seno HTML failo (pvz., lisausk_kelion_s (8).html)
   ========================================================================== */

// Žinomų miestų ir vietovių numatytųjų koordinačių žodynas automatiniam HTML importui
const LEGACY_HTML_KNOWN_LOCATIONS = [
    { match: /talin|proto|lennusadam/i, title: 'Talinas', country: 'Estija', iso2: 'EE', lat: 59.437, lng: 24.7536, category: 'Automobiliu' },
    { match: /jegal|jägala/i, title: 'Jegalos krioklys (Jägala)', country: 'Estija', iso2: 'EE', lat: 59.45, lng: 25.1786, category: 'Automobiliu' },
    { match: /heureka|vantos|vanta/i, title: 'Vanta (Mokslo centras „Heureka“)', country: 'Suomija', iso2: 'FI', lat: 60.2876, lng: 25.044, category: 'Keltas' },
    { match: /helsink|uspensk|suomij/i, title: 'Helsinkis', country: 'Suomija', iso2: 'FI', lat: 60.1699, lng: 24.9384, category: 'Keltas' },
    { match: /tartu|ahhaa/i, title: 'Tartu', country: 'Estija', iso2: 'EE', lat: 58.378, lng: 26.729, category: 'Automobiliu' },
    { match: /genuj|costa pacifica/i, title: 'Genuja', country: 'Italija', iso2: 'IT', lat: 44.4056, lng: 8.9463, category: 'Kruizas' },
    { match: /marsel|longšano/i, title: 'Marselis', country: 'Prancūzija', iso2: 'FR', lat: 43.2965, lng: 5.3698, category: 'Kruizas' },
    { match: /valensij|gralis|serran/i, title: 'Valensija', country: 'Ispanija', iso2: 'ES', lat: 39.4699, lng: -0.3763, category: 'Kruizas' },
    { match: /roma|romos|koliziej|vatikan/i, title: 'Roma ir Vatikanas', country: 'Italija', iso2: 'IT', lat: 41.8902, lng: 12.4922, category: 'Kruizas' },
    { match: /komo|brunate/i, title: 'Komo (Komo ežeras)', country: 'Italija', iso2: 'IT', lat: 45.8081, lng: 9.0852, category: 'Kruizas' },
    { match: /neapol|pompėj|vezuvij/i, title: 'Neapolis ir Pompėja', country: 'Italija', iso2: 'IT', lat: 40.8518, lng: 14.2681, category: 'Kruizas' },
    { match: /piza|pizos/i, title: 'Piza', country: 'Italija', iso2: 'IT', lat: 43.7228, lng: 10.4017, category: 'Kruizas' },
    { match: /milan|duomo/i, title: 'Milanas', country: 'Italija', iso2: 'IT', lat: 45.4642, lng: 9.19, category: 'Kruizas' },
    { match: /tel aviv|jafos|izrael/i, title: 'Tel Avivas ir Jafa', country: 'Izraelis', iso2: 'IL', lat: 32.0853, lng: 34.7818, category: 'Lėktuvu' },
    { match: /šarm el šeich|egipt/i, title: 'Šarm el Šeichas', country: 'Egiptas', iso2: 'EG', lat: 27.9158, lng: 34.3299, category: 'Lėktuvu' },
    { match: /gdansk|gdyn/i, title: 'Gdanskas ir Gdynė', country: 'Lenkija', iso2: 'PL', lat: 54.352, lng: 18.6466, category: 'Automobiliu' },
    { match: /pienin|dunajec|červeny/i, title: 'Pieninų nacionalinis parkas (Červeny Klaštor)', country: 'Slovakija', iso2: 'SK', lat: 49.3906, lng: 20.415, category: 'Automobiliu' },
    { match: /beliansk/i, title: 'Belianskos urvas (Tatranská Kotlina)', country: 'Slovakija', iso2: 'SK', lat: 49.2289, lng: 20.3119, category: 'Automobiliu' },
    { match: /aukštieji tatrai|skalnaté|hrebienok|zamkovského/i, title: 'Aukštieji Tatrai (Skalnaté Pleso, Hrebienok)', country: 'Slovakija', iso2: 'SK', lat: 49.1892, lng: 20.2342, category: 'Automobiliu' },
    { match: /bratislav/i, title: 'Bratislava', country: 'Slovakija', iso2: 'SK', lat: 48.1486, lng: 17.1077, category: 'Automobiliu' },
    { match: /dortmund/i, title: 'Dortmundas', country: 'Vokietija', iso2: 'DE', lat: 51.5136, lng: 7.4653, category: 'Lėktuvu' },
    { match: /karlshamn/i, title: 'Karlshamnas', country: 'Švedija', iso2: 'SE', lat: 56.1703, lng: 14.8631, category: 'Keltas' },
    { match: /stokholm|vasa|junibacken/i, title: 'Stokholmas', country: 'Švedija', iso2: 'SE', lat: 59.3293, lng: 18.0686, category: 'Keltas' },
    { match: /siguld|cėsys|cėsių/i, title: 'Sigulda ir Cėsys', country: 'Latvija', iso2: 'LV', lat: 57.1537, lng: 24.8598, category: 'Automobiliu' },
    { match: /ventspil|kuldyg|vizium/i, title: 'Ventspilis ir Kuldyga', country: 'Latvija', iso2: 'LV', lat: 57.3937, lng: 21.5647, category: 'Automobiliu' },
    { match: /lego|legolend|bilund/i, title: 'Bilundas (LEGO House ir Legolendas)', country: 'Danija', iso2: 'DK', lat: 55.7358, lng: 9.1153, category: 'Lėktuvu' },
    { match: /zakopan|krokuv|energylandia|hario poterio/i, title: 'Krokuva, Zakopanė ir Energylandia', country: 'Lenkija', iso2: 'PL', lat: 50.0647, lng: 19.945, category: 'Automobiliu' },
    { match: /suntago/i, title: 'Suntago vandens parkas (Vrenča)', country: 'Lenkija', iso2: 'PL', lat: 51.9997, lng: 20.4392, category: 'Automobiliu' },
    { match: /hossoland/i, title: 'Hossoland pramogų parkas (Brojcai)', country: 'Lenkija', iso2: 'PL', lat: 53.9722, lng: 15.3885, category: 'Automobiliu' },
    { match: /lodz|mandoria|orientarium|fala aquapark/i, title: 'Lodzė (Fala Aquapark, Mandoria, Orientarium ZOO)', country: 'Lenkija', iso2: 'PL', lat: 51.7592, lng: 19.456, category: 'Automobiliu' },
    { match: /raubon/i, title: 'Raubonių pramogų parkas', country: 'Lietuva', iso2: 'LT', lat: 56.1228, lng: 24.4714, category: 'Lietuva' },
    { match: /druskinink/i, title: 'Druskininkai (Druskininkų vandens parkas)', country: 'Lietuva', iso2: 'LT', lat: 54.0189, lng: 23.9725, category: 'Lietuva' },
    { match: /karpėn|akmenės karjer/i, title: 'Akmenės ir Karpėnų karjerai', country: 'Lietuva', iso2: 'LT', lat: 56.3075, lng: 22.8669, category: 'Lietuva' },
    { match: /kuršių nerij|vecekrug|preil|nida/i, title: 'Nida ir Kuršių nerija', country: 'Lietuva', iso2: 'LT', lat: 55.3033, lng: 21.0056, category: 'Lietuva' },
    { match: /kaun|mokslo sala|vi fortas|zoologijos sodas|žalgirio.*baseinas/i, title: 'Kaunas (Mokslo sala, VI fortas, Zoologijos sodas, Baseinas)', country: 'Lietuva', iso2: 'LT', lat: 54.8962, lng: 23.9044, category: 'Lietuva' },
    { match: /vilniaus knygų mugė|energetikos ir technikos|virsmo salė|litexpo/i, title: 'Vilnius (Energetikos ir technikos muziejus, LITEXPO)', country: 'Lietuva', iso2: 'LT', lat: 54.6939, lng: 25.2869, category: 'Lietuva' },
    { match: /mūšos tyrel/i, title: 'Mūšos tyrelio pažintinis takas', country: 'Lietuva', iso2: 'LT', lat: 56.2185, lng: 23.257, category: 'Lietuva' },
    { match: /akmenų rūž|šiaulės kaln|tytuvėn/i, title: 'Tytuvėnai ir Šiaulės kalnas (Akmenų rūžos takas)', country: 'Lietuva', iso2: 'LT', lat: 55.6033, lng: 23.1994, category: 'Lietuva' },
    { match: /kurtuvėn|targių oz|juodlės|svilės|vainagių|pageluvio/i, title: 'Kurtuvėnų regioninis parkas', country: 'Lietuva', iso2: 'LT', lat: 55.8267, lng: 23.0475, category: 'Lietuva' },
    { match: /ventos-dubysos|ventos–dubysos|bubių|bubiai/i, title: 'Bubiai (Ventos–Dubysos perkasas)', country: 'Lietuva', iso2: 'LT', lat: 55.8542, lng: 23.1361, category: 'Lietuva' },
    { match: /plungė/i, title: 'Plungė', country: 'Lietuva', iso2: 'LT', lat: 55.9114, lng: 21.8442, category: 'Lietuva' },
    { match: /perlinių danielių/i, title: 'Perlinių danielių parkas', country: 'Lietuva', iso2: 'LT', lat: 55.5256, lng: 25.1026, category: 'Lietuva' },
    { match: /dagilėl|šiaul|boružiuk|drugelių|pirmokų|giedrės/i, title: 'Šiauliai', country: 'Lietuva', iso2: 'LT', lat: 55.9349, lng: 23.3137, category: 'Lietuva' }
];

/**
 * Iš seno HTML failo turinio ištraukia video objektų masyvą (iš `const videoData = [...]` arba YouTube nuorodų)
 * @param {string} htmlText
 * @returns {Array<{title: string, id: string, category?: string, date?: string, description?: string}>}
 */
function parseLegacyHtmlVideoData(htmlText) {
    const results = [];
    if (!htmlText || typeof htmlText !== 'string') return results;

    // 1) Ieškome JS objektų su title, id, category, description (palaiko tiek "..." tiek `...` kabutes faile lisausk_kelion_s (8).html)
    const objectBlockRegex = /\{\s*title:\s*"((?:\\"|[^"])*)"\s*,\s*id:\s*"([^"]+)"[\s\S]*?description:\s*(?:`([^`]*)`|"((?:\\"|[^"])*)")\s*\}/g;
    let match = null;
    while ((match = objectBlockRegex.exec(htmlText)) !== null) {
        const rawBlock = match[0];
        const categoryMatch = rawBlock.match(/category:\s*"([^"]+)"/);
        const dateMatch = rawBlock.match(/date:\s*"([^"]+)"/);
        const rawDesc = match[3] !== undefined ? match[3] : match[4] || '';

        const unescapeJs = (str) =>
            String(str || '')
                .replace(/\\n/g, ' ')
                .replace(/\\"/g, '"')
                .replace(/\s+/g, ' ')
                .trim();

        results.push({
            title: unescapeJs(match[1]),
            id: match[2].trim(),
            category: categoryMatch ? categoryMatch[1].trim() : '',
            date: dateMatch ? dateMatch[1].trim() : '',
            description: unescapeJs(rawDesc)
        });
    }

    if (results.length > 0) {
        return results;
    }

    // 2) Atsarginis variantas: jei HTML faile yra tiesioginės YouTube nuorodos arba iframe
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = doc.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"], iframe[src*="youtube.com"]');
    links.forEach((el) => {
        const rawUrl = el.getAttribute('href') || el.getAttribute('src') || '';
        const videoId = extractYouTubeVideoId(rawUrl);
        if (!videoId) return;
        const title = (el.textContent || el.getAttribute('title') || 'Kelionės vlogas').trim();
        results.push({
            title,
            id: videoId,
            category: 'keliones',
            date: '',
            description: title
        });
    });

    return results;
}

/**
 * Pagal nuskaitytą HTML turinį sujungia ir atnaujina `state.places` bei `state.visitedCountries`
 * @param {string} htmlText
 * @returns {{addedPlaces: number, addedVideos: number, totalPlaces: number}}
 */
function importPlacesFromLegacyHtml(htmlText) {
    const parsedVideos = parseLegacyHtmlVideoData(htmlText);
    if (parsedVideos.length === 0) {
        return { addedPlaces: 0, addedVideos: 0, totalPlaces: state.places.length };
    }

    let addedPlaces = 0;
    let addedVideos = 0;

    parsedVideos.forEach((videoItem) => {
        const videoUrl = `https://www.youtube.com/watch?v=${videoItem.id}`;
        const combinedText = `${videoItem.title} ${videoItem.description || ''}`;

        // Randame atitinkančią vietą žodyne arba priskiriame numatytąsias Lietuvos koordinates (lengvai suderinamas per Admin)
        const matchedLoc = LEGACY_HTML_KNOWN_LOCATIONS.find((loc) => loc.match.test(combinedText)) || {
            title: videoItem.title.split('|')[0].split(':')[0].trim() || 'Nauja importuota vieta',
            country: 'Lietuva',
            iso2: 'LT',
            lat: 55.9349,
            lng: 23.3137,
            category: 'Lietuva'
        };

        if (matchedLoc.iso2) {
            ensureVisitedCountryIso2(matchedLoc.iso2);
        }

        // Patikriname, ar tokia vieta jau yra state.places sąraše
        let existingPlace = state.places.find(
            (p) => normalizeSearchText(p.title) === normalizeSearchText(matchedLoc.title)
        );

        if (!existingPlace) {
            const nextId =
                state.places.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
            existingPlace = {
                id: nextId,
                title: matchedLoc.title,
                country: matchedLoc.country,
                lat: matchedLoc.lat,
                lng: matchedLoc.lng,
                date: '2025-06-01',
                category: matchedLoc.category,
                description: videoItem.description || videoItem.title,
                travelers: [...DEFAULT_TRAVELERS],
                videos: []
            };
            state.places.push(existingPlace);
            addedPlaces += 1;
        } else if (!existingPlace.description && videoItem.description) {
            existingPlace.description = videoItem.description;
        }

        const alreadyHasVideo = existingPlace.videos.some(
            (v) => extractYouTubeVideoId(v.url) === videoItem.id
        );
        if (!alreadyHasVideo) {
            existingPlace.videos.push({
                title: videoItem.title,
                url: videoUrl
            });
            addedVideos += 1;
        }
    });

    renderMap({ fitBounds: true });
    renderCountriesLayer();
    updateStats(getFilteredPlaces());
    renderAdminPanel();

    return {
        addedPlaces,
        addedVideos,
        totalPlaces: state.places.length
    };
}

// Eksportuojame pagalbinę funkciją į window, kad būtų galima iškviesti ir tiesiai iš naršyklės konsolės
window.importFromLegacyHtml = async function (htmlFileName = 'lisausk_kelion_s (8).html') {
    const response = await fetch(htmlFileName);
    if (!response.ok) {
        throw new Error(`Nepavyko nuskaityti HTML failo: ${htmlFileName}`);
    }
    const htmlText = await response.text();
    return importPlacesFromLegacyHtml(htmlText);
};

if (importHtmlBtnEl && importHtmlFileInputEl) {
    importHtmlBtnEl.addEventListener('click', async () => {
        // Pirmiausia pabandome automatiškai nuskaityti šaknyje esantį „lisausk_kelion_s (8).html“, jei veikia serveris
        try {
            const res = await fetch('lisausk_kelion_s (8).html');
            if (res.ok) {
                const htmlText = await res.text();
                const summary = importPlacesFromLegacyHtml(htmlText);
                alert(
                    `Importas iš „lisausk_kelion_s (8).html“ baigtas!\n` +
                        `• Pridėta naujų vietų: ${summary.addedPlaces}\n` +
                        `• Pridėta naujų YouTube video: ${summary.addedVideos}\n` +
                        `• Iš viso vietų žemėlapyje: ${summary.totalPlaces}\n\n` +
                        `Nepamirškite paspausti „Atsisiųsti keliones.json“, jei norite išsaugoti pakeitimus faile.`
                );
                return;
            }
        } catch (_err) {
            // Jei atidaryta per file:// protokolą, atidarome failo pasirinkimo langą
        }
        importHtmlFileInputEl.click();
    });

    importHtmlFileInputEl.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const htmlText = String(reader.result || '');
            const summary = importPlacesFromLegacyHtml(htmlText);
            alert(
                `Importas iš failo „${file.name}“ baigtas!\n` +
                    `• Pridėta naujų vietų: ${summary.addedPlaces}\n` +
                    `• Pridėta naujų YouTube video: ${summary.addedVideos}\n` +
                    `• Iš viso vietų žemėlapyje: ${summary.totalPlaces}\n\n` +
                    `Visas vietas ir jų koordinates galite patogiai koreguoti dešinėje esančioje lentelėje paspaudę „Redaguoti“.`
            );
            importHtmlFileInputEl.value = '';
        };
        reader.readAsText(file, 'utf-8');
    });
}

/* ==========================================================================
   Paieškos, filtrų, žemėlapio režimo ir pradinio užkrovimo valdymas
   ========================================================================== */

/**
 * Užkrauna duomenis iš keliones.json, atnaujina statistiką, žymeklius, GeoJSON ir patikrina ?admin=1
 */
async function initApp() {
    try {
        const response = await fetch('keliones.json');
        if (!response.ok) {
            throw new Error(`HTTP klaida: ${response.status}`);
        }
        const data = await response.json();
        state.visitedCountries = Array.isArray(data.visitedCountries) ? data.visitedCountries : [];
        state.places = Array.isArray(data.places)
            ? data.places.map((place) => ({
                  ...place,
                  travelers: Array.isArray(place.travelers)
                      ? place.travelers
                      : [...DEFAULT_TRAVELERS],
                  videos: Array.isArray(place.videos) ? place.videos : []
              }))
            : [];
    } catch (error) {
        console.warn('Nepavyko užkrauti keliones.json per fetch, naudojami atsarginiai duomenys:', error);
        state.visitedCountries = [...FALLBACK_DATA.visitedCountries];
        state.places = FALLBACK_DATA.places.map((item) => ({
            ...item,
            travelers: Array.isArray(item.travelers) ? [...item.travelers] : [...DEFAULT_TRAVELERS],
            videos: Array.isArray(item.videos) ? [...item.videos] : []
        }));
    }

    resetPlaceForm();
    renderMap({ fitBounds: true });

    // Patikriname, ar URL turi ?admin=1 (jei sesija neaktyvi – paprašys slaptažodžio)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
        requestAdminAccess();
    }

    await loadWorldCountriesGeoJson();
}

// Kategorijų filtrų paspaudimai
categoryFiltersEl.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-chip');
    if (!button) return;

    const selectedCategory = button.dataset.category;
    if (selectedCategory === state.activeCategory) return;

    state.activeCategory = selectedCategory;
    setActiveCategoryButton(selectedCategory);
    renderMap({ fitBounds: true, isSearch: false });
});

// Šeimos narių filtrų paspaudimai (Tomas / Sandra / Lukas / Linas)
travelerFiltersEl.addEventListener('click', (event) => {
    const button = event.target.closest('.traveler-chip');
    if (!button) return;

    const selectedTraveler = button.dataset.traveler;
    const nextTraveler =
        selectedTraveler === state.activeTraveler && selectedTraveler !== 'Visi'
            ? 'Visi'
            : selectedTraveler;

    state.activeTraveler = nextTraveler;
    setActiveTravelerButton(nextTraveler);
    renderMap({ fitBounds: true, isSearch: false });
});

// Žemėlapio režimo perjungiklio paspaudimai („Detalus žemėlapis“ / „Tik šalys“)
mapModeSwitcherEl.addEventListener('click', (event) => {
    const button = event.target.closest('.mode-btn');
    if (!button) return;

    const selectedMode = button.dataset.mode;
    if (selectedMode === state.mapMode) return;

    setMapMode(selectedMode);
});

// Paieškos įvestis (su debounce sklandžiam flyTo priartinimui)
let searchDebounceTimer = null;
searchInputEl.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    clearSearchBtnEl.hidden = state.searchQuery.length === 0;

    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
        renderMap({ fitBounds: true, isSearch: true });
    }, 180);
});

// Paspaudus Enter paieškos laukelyje – priartiname prie pirmo rasto miesto ir atidarome kortelę
searchInputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const filtered = getFilteredPlaces();
        if (filtered.length > 0) {
            const firstPlace = filtered[0];
            const marker = markersByPlaceId.get(firstPlace.id);
            map.flyTo([firstPlace.lat, firstPlace.lng], 11, { duration: 0.85 });
            if (marker) {
                marker.openPopup();
            }
        }
    }
});

// Paieškos išvalymo mygtukas
clearSearchBtnEl.addEventListener('click', () => {
    state.searchQuery = '';
    searchInputEl.value = '';
    clearSearchBtnEl.hidden = true;
    searchInputEl.focus();
    renderMap({ fitBounds: true, isSearch: false });
});

// Visų filtrų atstatymas, kai nieko nerasta
resetFiltersBtnEl.addEventListener('click', () => {
    state.activeCategory = 'Visos';
    state.activeTraveler = 'Visi';
    state.searchQuery = '';
    searchInputEl.value = '';
    clearSearchBtnEl.hidden = true;
    setActiveCategoryButton('Visos');
    setActiveTravelerButton('Visi');
    renderMap({ fitBounds: true, isSearch: false });
});

// Paspaudus logotipą – atstatome bendrą vaizdą
resetMapBtnEl.addEventListener('click', (event) => {
    event.preventDefault();
    state.activeCategory = 'Visos';
    state.activeTraveler = 'Visi';
    state.searchQuery = '';
    searchInputEl.value = '';
    clearSearchBtnEl.hidden = true;
    setActiveCategoryButton('Visos');
    setActiveTravelerButton('Visi');
    renderMap({ fitBounds: true, isSearch: false });
});

// Užtikriname korektišką žemėlapio dydį keičiant lango matmenis
window.addEventListener('resize', () => {
    map.invalidateSize();
});

// Paleidžiame aplikaciją
initApp();
