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
        'LT', 'LV', 'EE', 'FI', 'PL', 'DE', 'CZ', 'RS',
        'IT', 'MT', 'HR', 'GR', 'FR', 'ES', 'IL', 'EG'
    ],
    places: [
        {
            id: 1,
            title: 'Šiauliai',
            country: 'Lietuva',
            lat: 55.9349,
            lng: 23.3137,
            date: '2023-05-14',
            category: 'Lietuva',
            description: 'Saulės miestas: Talkšos ežero pakrantė, Geležinė lapė, Frenkelio vila ir Kryžių kalnas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 2,
            title: 'Anykščiai',
            country: 'Lietuva',
            lat: 55.5256,
            lng: 25.1026,
            date: '2023-06-18',
            category: 'Lietuva',
            description: 'Medžių lajų takas, Puntuko akmuo, Kalitos kalnas ir Šventosios upės slėnio atradimai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 3,
            title: 'Ventspilis',
            country: 'Latvija',
            lat: 57.3937,
            lng: 21.5647,
            date: '2023-07-08',
            category: 'Automobiliu',
            description: 'Šeimos kelionė į Latvijos pajūrį: Mėlynosios vėliavos paplūdimys, uosto molas ir karvučių paradas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 4,
            title: 'Talinas',
            country: 'Estija',
            lat: 59.437,
            lng: 24.7536,
            date: '2023-08-12',
            category: 'Automobiliu',
            description: 'Viduramžių dvasia alsuojantis Talino senamiestis, Tompea kalva, Telliskivi ir jūros muziejus.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 5,
            title: 'Helsinkis',
            country: 'Suomija',
            lat: 60.1699,
            lng: 24.9384,
            date: '2023-08-14',
            category: 'Kruizas',
            description: 'Keltu per Suomijos įlanką į Helsinkį: Senato aikštė, Uolų bažnyčia ir Suomenlinna tvirtovė.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 6,
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
            id: 7,
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
            id: 8,
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
            id: 9,
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
            id: 10,
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
            id: 11,
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
            id: 12,
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
            id: 13,
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
            id: 14,
            title: 'Triestas',
            country: 'Italija',
            lat: 45.6495,
            lng: 13.7768,
            date: '2024-06-08',
            category: 'Kruizas',
            description: "Kruizo uostas Adrijos šiaurėje: Piazza Unità d'Italia aikštė, Didysis kanalas ir Miramare pilis.",
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 15,
            title: 'Milanas',
            country: 'Italija',
            lat: 45.4642,
            lng: 9.19,
            date: '2024-09-14',
            category: 'Lėktuvu',
            description: 'Stiliaus ir architektūros sostinė: didingoji Milano katedra (Duomo), Vittorio Emanuele II galerija ir Navigli kanalai.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 16,
            title: 'Marselis',
            country: 'Prancūzija',
            lat: 43.2965,
            lng: 5.3698,
            date: '2024-10-20',
            category: 'Kruizas',
            description: 'Prancūzijos Rivjeros vartai: Senasis uostas (Vieux-Port), Notre-Dame de la Garde bazilika ir Le Panier kvartalas.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 17,
            title: 'Valensija',
            country: 'Ispanija',
            lat: 39.4699,
            lng: -0.3763,
            date: '2024-10-22',
            category: 'Kruizas',
            description: 'Menų ir mokslo miestelis, Turijos sodai, Valensijos senamiestis ir autentiškos paelijos gimtinė.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 18,
            title: 'Jeruzalė',
            country: 'Izraelis',
            lat: 31.7683,
            lng: 35.2137,
            date: '2023-03-11',
            category: 'Lėktuvu',
            description: 'Tūkstantmetė istorija: Jeruzalės senamiestis, Raudų siena, Alyvų kalnas ir rytietiški turgūs.',
            travelers: ['Tomas', 'Sandra', 'Lukas', 'Linas'],
            videos: []
        },
        {
            id: 19,
            title: 'Šarm el Šeichas',
            country: 'Egiptas',
            lat: 27.9158,
            lng: 34.3299,
            date: '2024-02-05',
            category: 'Lėktuvu',
            description: 'Raudonosios jūros koraliniai rifai, Naama Bay, Farsha kavinė ant uolos ir Sinajaus pusiasalio saulėlydžiai.',
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
    Automobiliu: {
        pinClass: 'custom-pin--car',
        badgeClass: 'popup-card__category--car',
        emoji: '🚗'
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
 * Patikrina ir grąžina saugų išorinį http/https URL (arba tuščią eilutę, jei netinkamas)
 */
function getValidHttpUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
        const parsed = new URL(rawUrl.trim());
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
 * Grąžina tikrus, patikrintus vietos YouTube video objektus iš „videos“ masyvo: [{ title, url }]
 */
function getValidVideos(place) {
    if (!place || !Array.isArray(place.videos)) {
        return [];
    }

    const result = [];
    for (const item of place.videos) {
        if (!item || typeof item !== 'object') continue;
        const validUrl = getValidHttpUrl(item.url);
        if (!validUrl) continue;

        result.push({
            title: String(item.title || '').trim(),
            url: validUrl
        });
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
            const safeUrl = escapeHtml(video.url);
            const videoId = extractYouTubeVideoId(video.url);
            const videoTitle =
                video.title ||
                (validVideos.length === 1
                    ? `${place.title} – kelionės vlogas`
                    : `${place.title} – vlogas #${idx + 1}`);
            const btnLabel =
                validVideos.length === 1 || !video.title
                    ? 'Žiūrėti vlogą YouTube'
                    : video.title;

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
 * Atvaizduoja „videos“ įvesties eilutes admin formoje
 */
function renderAdminVideoRows(videos = []) {
    if (!Array.isArray(videos) || videos.length === 0) {
        adminVideosContainerEl.innerHTML =
            '<div class="admin-videos-empty">Video nuorodų dar nepridėta (videos: []).</div>';
        return;
    }

    adminVideosContainerEl.innerHTML = videos
        .map(
            (video, idx) => `
            <div class="admin-video-row" data-video-idx="${idx}">
                <input
                    type="text"
                    class="admin-video-title"
                    placeholder="Pvz., 2026 m. kruizas"
                    value="${escapeHtml(video.title || '')}"
                >
                <input
                    type="url"
                    class="admin-video-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value="${escapeHtml(video.url || '')}"
                    required
                >
                <button
                    type="button"
                    class="admin-video-row__remove"
                    data-remove-video-idx="${idx}"
                    title="Pašalinti video"
                    aria-label="Pašalinti video"
                >✕</button>
            </div>
        `
        )
        .join('');
}

/**
 * Nuskaito šiuo metu admin formoje įvestas „videos“ eilutes
 */
function readAdminVideoRowsFromDom() {
    const rows = adminVideosContainerEl.querySelectorAll('.admin-video-row');
    const result = [];
    rows.forEach((row) => {
        const titleInput = row.querySelector('.admin-video-title');
        const urlInput = row.querySelector('.admin-video-url');
        result.push({
            title: titleInput ? titleInput.value.trim() : '',
            url: urlInput ? urlInput.value.trim() : ''
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

/**
 * Pagal lietuvišką šalies pavadinimą suranda jos ISO-2 kodą (jei įmanoma)
 */
function findIso2ByCountryName(countryName) {
    const target = normalizeText(countryName);
    if (!target) return '';

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

    const commonIsoCodes = [
        'LT', 'LV', 'EE', 'PL', 'DE', 'AT', 'IT', 'ES', 'FR', 'GR', 'TR', 'EG', 'MT', 'FI', 'SE',
        'NO', 'DK', 'NL', 'BE', 'CH', 'CZ', 'SK', 'HU', 'HR', 'SI', 'RO', 'BG', 'PT', 'GB', 'IE',
        'IS', 'CY', 'US', 'CA', 'AE', 'TH', 'JP', 'GE', 'AL', 'ME', 'BA', 'RS', 'MK', 'UA'
    ];
    for (const code of commonIsoCodes) {
        if (normalizeText(getCountryDisplayName(null, code)) === target) {
            return code;
        }
    }

    return '';
}

// Paskutiniai Nominatim paieškos rezultatai
let lastNominatimResults = [];
let nominatimDebounceTimer = null;

/**
 * Iš Nominatim objekto ištraukia lietuvišką vietos pavadinimą, šalies pavadinimą (per Intl.DisplayNames), ISO-2 kodą ir lat/lng
 */
function parseNominatimItem(item) {
    const addr = item.address || {};
    const rawIso2 = addr.country_code ? String(addr.country_code).trim().toUpperCase() : '';
    const iso2 = /^[A-Z]{2}$/.test(rawIso2) ? rawIso2 : '';

    // Šalies pavadinimas lietuviškai per Intl.DisplayNames
    const countryLt = iso2
        ? getCountryDisplayName(null, iso2)
        : addr.country || '';

    // Vietos pavadinimas lietuviškai
    const displayParts = String(item.display_name || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    const placeTitle =
        item.name ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.tourism ||
        addr.attraction ||
        addr.island ||
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
 * Pasirinkus vietą iš Nominatim sąrašo, automatiškai užpildo formos laukelius
 */
function applyGeocodeResult(result) {
    if (!result) return;

    placeTitleInputEl.value = result.title;
    placeCountryInputEl.value = result.countryLt;
    placeCountryCodeInputEl.value = result.iso2 || '';
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
    placeFormEl.reset();
    placeIdInputEl.value = '';
    if (placeGeocodeInputEl) placeGeocodeInputEl.value = '';
    if (placeGeocodeResultsEl) {
        placeGeocodeResultsEl.hidden = true;
        placeGeocodeResultsEl.innerHTML = '';
    }
    if (placeCountryCodeInputEl) placeCountryCodeInputEl.value = '';
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
    const place = state.places.find((item) => item.id === placeId);
    if (!place) return;

    state.editingPlaceId = place.id;
    placeIdInputEl.value = String(place.id);
    placeLatInputEl.value = place.lat;
    placeLngInputEl.value = place.lng;
    placeTitleInputEl.value = place.title;
    placeCountryInputEl.value = place.country;
    if (placeCountryCodeInputEl) {
        placeCountryCodeInputEl.value =
            place.countryCode || findIso2ByCountryName(place.country) || '';
    }
    placeDateInputEl.value = place.date || '';
    placeCategoryInputEl.value = place.category;
    placeDescInputEl.value = place.description;
    setAdminTravelerCheckboxes(getPlaceTravelers(place));
    renderAdminVideoRows(getValidVideos(place));
    updateCoordsPreviewBadge();

    if (placeGeocodeResultsEl) {
        placeGeocodeResultsEl.hidden = true;
    }

    placeFormHeadingEl.textContent = `Redaguoti: ${place.title}`;
    savePlaceBtnEl.textContent = 'Išsaugoti pakeitimus';
    cancelEditBtnEl.hidden = false;

    setAdminPickMarker(place.lat, place.lng);
    map.flyTo([place.lat, place.lng], 9, { duration: 0.7 });
    renderAdminPanel();
    placeTitleInputEl.focus();
}

/**
 * Ištrina tašką pagal ID
 */
function deletePlace(placeId) {
    state.places = state.places.filter((item) => item.id !== placeId);
    if (state.editingPlaceId === placeId) {
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
    currentVideos.push({ title: '', url: '' });
    renderAdminVideoRows(currentVideos);
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

    const selectedTravelers = readAdminTravelerCheckboxes();

    const rawVideos = readAdminVideoRowsFromDom();
    const cleanedVideos = rawVideos
        .map((v) => ({
            title: v.title.trim(),
            url: getValidHttpUrl(v.url)
        }))
        .filter((v) => Boolean(v.url));

    const countryName = placeCountryInputEl.value.trim();
    const rawIso2 = placeCountryCodeInputEl
        ? placeCountryCodeInputEl.value.trim().toUpperCase()
        : '';
    const resolvedIso2 = /^[A-Z]{2}$/.test(rawIso2)
        ? rawIso2
        : findIso2ByCountryName(countryName);

    // Išsaugant vietą, automatiškai įtraukiame jos šalies ISO-2 kodą į visitedCountries, jei jo ten dar nėra
    if (/^[A-Z]{2}$/.test(resolvedIso2) && !state.visitedCountries.includes(resolvedIso2)) {
        state.visitedCountries.push(resolvedIso2);
    }

    const placePayload = {
        id:
            state.editingPlaceId !== null
                ? state.editingPlaceId
                : state.places.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1,
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

    if (state.editingPlaceId !== null) {
        state.places = state.places.map((item) =>
            item.id === state.editingPlaceId ? placePayload : item
        );
    } else {
        state.places.push(placePayload);
    }

    resetPlaceForm();
    renderMap({ fitBounds: false });
    renderCountriesLayer();
    renderAdminPanel();

    map.flyTo([placePayload.lat, placePayload.lng], Math.max(map.getZoom(), 7), {
        duration: 0.7
    });
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
