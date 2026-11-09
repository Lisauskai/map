/**
 * map.lisauskai.lt – „Lisauskų kelionės“ interaktyvus kelionių žemėlapis
 * Grynas Vanilla JS + Leaflet.js (CartoDB Voyager sluoksnis) + keliones.json + Pasaulio šalių GeoJSON + Admin režimas
 */

// Vieši patikimi pasaulio šalių GeoJSON šaltiniai iš raw.githubusercontent.com (atitinka CSP taisykles)
const WORLD_GEOJSON_URLS = [
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
    'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
];

// Lietuviški šalių pavadinimai pagal ISO-2 kodą (iškylantiems tooltip langams)
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
    EG: 'Egiptas'
};

// Pagalbinis ISO-3 -> ISO-2 žemėlapis (kai kuriuose GeoJSON šaltiniuose, pvz. Prancūzijai, ISO_A2 būna "-99")
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
    EGY: 'EG'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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
            youtubeUrl: 'https://www.youtube.com/@Lisauskukeliones'
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

// Būsena
const state = {
    visitedCountries: [],
    places: [],
    activeCategory: 'Visos',
    searchQuery: '',
    isAdminOpen: false,
    editingPlaceId: null,
    cachedWorldGeoJson: null
};

// Pagrindiniai DOM elementai
const statCountriesEl = document.getElementById('statCountries');
const statPlacesEl = document.getElementById('statPlaces');
const statVlogsEl = document.getElementById('statVlogs');
const searchInputEl = document.getElementById('searchInput');
const clearSearchBtnEl = document.getElementById('clearSearchBtn');
const categoryFiltersEl = document.getElementById('categoryFilters');
const emptyStateEl = document.getElementById('emptyState');
const resetFiltersBtnEl = document.getElementById('resetFiltersBtn');
const resetMapBtnEl = document.getElementById('resetMapBtn');

// Administravimo DOM elementai
const adminToggleBtnEl = document.getElementById('adminToggleBtn');
const adminPanelEl = document.getElementById('adminPanel');
const adminCloseBtnEl = document.getElementById('adminCloseBtn');
const downloadJsonBtnEl = document.getElementById('downloadJsonBtn');
const copyJsonBtnEl = document.getElementById('copyJsonBtn');
const copyJsonBtnTextEl = document.getElementById('copyJsonBtnText');

const placeFormEl = document.getElementById('placeForm');
const placeFormHeadingEl = document.getElementById('placeFormHeading');
const placeIdInputEl = document.getElementById('placeIdInput');
const placeLatInputEl = document.getElementById('placeLatInput');
const placeLngInputEl = document.getElementById('placeLngInput');
const placeTitleInputEl = document.getElementById('placeTitleInput');
const placeCountryInputEl = document.getElementById('placeCountryInput');
const placeDateInputEl = document.getElementById('placeDateInput');
const placeCategoryInputEl = document.getElementById('placeCategoryInput');
const placeDescInputEl = document.getElementById('placeDescInput');
const placeYoutubeInputEl = document.getElementById('placeYoutubeInput');
const savePlaceBtnEl = document.getElementById('savePlaceBtn');
const cancelEditBtnEl = document.getElementById('cancelEditBtn');

const countryFormEl = document.getElementById('countryForm');
const newCountryCodeInputEl = document.getElementById('newCountryCodeInput');
const adminCountriesListEl = document.getElementById('adminCountriesList');
const adminPlacesCountEl = document.getElementById('adminPlacesCount');
const adminPlacesListEl = document.getElementById('adminPlacesList');

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

// Nemokamas „CartoDB Voyager“ sluoksnis
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Sluoksniai: pasaulio šalys (apačioje), vietovių smeigtukai (viršuje) ir laikinas admin paspaudimo žymeklis
let countriesGeoJsonLayer = null;
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
        props.postal
    ];

    for (const code of candidates) {
        if (typeof code === 'string' && /^[A-Z]{2}$/i.test(code.trim()) && code.trim() !== '-99') {
            return code.trim().toUpperCase();
        }
    }

    const iso3Candidates = [props.ADM0_A3, props.ISO_A3, props.SOV_A3, props.GU_A3];
    for (const iso3 of iso3Candidates) {
        if (typeof iso3 === 'string' && ISO3_TO_ISO2[iso3.trim().toUpperCase()]) {
            return ISO3_TO_ISO2[iso3.trim().toUpperCase()];
        }
    }

    return '';
}

/**
 * Grąžina šalies pavadinimą lietuviškai (arba iš GeoJSON, jei nėra žodyne)
 */
function getCountryDisplayName(feature, iso2) {
    if (iso2 && COUNTRY_NAMES_LT[iso2]) {
        return COUNTRY_NAMES_LT[iso2];
    }
    const props = (feature && feature.properties) || {};
    return props.NAME_LT || props.NAME || props.ADMIN || props.name || iso2 || 'Šalis';
}

/**
 * Stilius aplankytoms ir neaplankytoms šalims
 */
function getCountryBaseStyle(isVisited) {
    if (isVisited) {
        return {
            color: '#0891b2',      // Akcentinis mėlynai žalsvas rėmelis
            weight: 1.4,
            opacity: 0.85,
            fillColor: '#06b6d4',  // Pusiau permatomas mėlynai žalsvas užpildas
            fillOpacity: 0.24
        };
    }

    // Neaplankytos šalys lieka neutralios
    return {
        color: '#94a3b8',
        weight: 0.5,
        opacity: 0.25,
        fillColor: '#cbd5e1',
        fillOpacity: 0.03
    };
}

/**
 * Atvaizduoja pasaulio šalių GeoJSON sluoksnį pagal esamą visitedCountries masyvą
 */
function renderCountriesLayer() {
    if (!state.cachedWorldGeoJson) return;

    const visitedSet = new Set(
        state.visitedCountries.map((code) => String(code).trim().toUpperCase())
    );

    if (countriesGeoJsonLayer) {
        map.removeLayer(countriesGeoJsonLayer);
    }

    countriesGeoJsonLayer = L.geoJSON(state.cachedWorldGeoJson, {
        style: (feature) => {
            const iso2 = getCountryIso2(feature);
            const isVisited = visitedSet.has(iso2);
            return getCountryBaseStyle(isVisited);
        },
        onEachFeature: (feature, layer) => {
            const iso2 = getCountryIso2(feature);
            const isVisited = visitedSet.has(iso2);

            if (!isVisited) {
                return;
            }

            const countryName = getCountryDisplayName(feature, iso2);

            // Priskiriame iškylantį šalies pavadinimą (tooltip)
            layer.bindTooltip(`✓ ${escapeHtml(countryName)}`, {
                sticky: true,
                direction: 'top',
                offset: [0, -8],
                className: 'country-tooltip'
            });

            // Hover efektas: paryškiname rėmelį ir užpildą
            layer.on({
                mouseover: (event) => {
                    const targetLayer = event.target;
                    targetLayer.setStyle({
                        color: '#0284c7',
                        weight: 2.8,
                        opacity: 1,
                        fillColor: '#06b6d4',
                        fillOpacity: 0.42
                    });

                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        targetLayer.bringToFront();
                    }
                },
                mouseout: (event) => {
                    const targetLayer = event.target;
                    targetLayer.setStyle(getCountryBaseStyle(true));
                }
            });
        }
    }).addTo(map);

    // Užtikriname, kad šalių poligonai liktų po žymekliais
    countriesGeoJsonLayer.bringToBack();
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
 * Patikrina, kad išorinė nuoroda naudotų tik saugų http/https protokolą
 */
function sanitizeExternalUrl(rawUrl) {
    try {
        const parsed = new URL(String(rawUrl || ''), window.location.origin);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return parsed.href;
        }
    } catch {
        // Neteisingas URL formatas
    }
    return 'https://www.youtube.com/@Lisauskukeliones';
}

/**
 * Sukuria stilingą iššokančią kortelę (Popup) su vietos pavadinimu, kelionės data,
 * trumpu aprašymu ir ryškiu mygtuku „Žiūrėti vlogą YouTube“
 */
function createPopupHtml(place) {
    const meta = CATEGORY_META[place.category] || {
        badgeClass: 'popup-card__category--plane',
        emoji: '📍'
    };

    const safeYoutubeUrl = escapeHtml(sanitizeExternalUrl(place.youtubeUrl));

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

    return `
        <div class="popup-card">
            <div class="popup-card__header">
                <div class="popup-card__badges">
                    <span class="popup-card__category ${meta.badgeClass}">${meta.emoji} ${escapeHtml(place.category)}</span>
                    <span class="popup-card__country">${escapeHtml(place.country)}</span>
                </div>
                <h3 class="popup-card__title">${escapeHtml(place.title)}</h3>
                ${dateHtml}
            </div>
            <div class="popup-card__body">
                <p class="popup-card__desc">${escapeHtml(place.description)}</p>
                <a href="${safeYoutubeUrl}" target="_blank" rel="noopener noreferrer" class="popup-card__yt-btn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>Žiūrėti vlogą YouTube</span>
                </a>
            </div>
        </div>
    `;
}

/**
 * Automatiškai atnaujina viršutinius statistikos skaitiklius (Šalys | Vietos | Vlogai)
 */
function updateStats(filteredPlaces) {
    const isUnfiltered =
        state.activeCategory === 'Visos' && state.searchQuery.trim() === '';

    const countriesCount =
        isUnfiltered && state.visitedCountries.length > 0
            ? state.visitedCountries.length
            : new Set(filteredPlaces.map((item) => item.country)).size;

    const totalPlaces = filteredPlaces.length;
    const totalVlogs = filteredPlaces.filter((item) => Boolean(item.youtubeUrl)).length;

    statCountriesEl.textContent = countriesCount;
    statPlacesEl.textContent = totalPlaces;
    statVlogsEl.textContent = totalVlogs;
}

/**
 * Filtruoja vietas pagal pasirinktą kategoriją ir paieškos tekstą
 */
function getFilteredPlaces() {
    const normalizedQuery = normalizeText(state.searchQuery);

    return state.places.filter((place) => {
        const matchesCategory =
            state.activeCategory === 'Visos' || place.category === state.activeCategory;

        if (!matchesCategory) return false;
        if (!normalizedQuery) return true;

        const searchableText = normalizeText(
            `${place.title} ${place.country} ${place.category} ${place.description} ${place.date || ''}`
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

/* ==========================================================================
   ADMINISTRAVIMO REŽIMAS (?admin=1 arba spynos mygtukas kampe)
   ========================================================================== */

/**
 * Įjungia arba išjungia administravimo šoninį skydelį
 */
function setAdminMode(isOpen) {
    state.isAdminOpen = Boolean(isOpen);
    adminPanelEl.hidden = !state.isAdminOpen;
    adminToggleBtnEl.classList.toggle('is-active', state.isAdminOpen);
    adminToggleBtnEl.setAttribute('aria-expanded', String(state.isAdminOpen));

    if (!state.isAdminOpen && adminPickMarker) {
        map.removeLayer(adminPickMarker);
        adminPickMarker = null;
    }

    if (state.isAdminOpen) {
        renderAdminPanel();
    }
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
 * Atstato vietos formą į kūrimo būseną
 */
function resetPlaceForm() {
    state.editingPlaceId = null;
    placeFormEl.reset();
    placeIdInputEl.value = '';
    placeFormHeadingEl.textContent = 'Pridėti naują vietą';
    savePlaceBtnEl.textContent = 'Pridėti vietą';
    cancelEditBtnEl.hidden = true;
    placeYoutubeInputEl.value = 'https://www.youtube.com/@Lisauskukeliones';

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
    placeDateInputEl.value = place.date || '';
    placeCategoryInputEl.value = place.category;
    placeDescInputEl.value = place.description;
    placeYoutubeInputEl.value = place.youtubeUrl;

    placeFormHeadingEl.textContent = `Redaguoti: ${place.title}`;
    savePlaceBtnEl.textContent = 'Išsaugoti pakeitimus';
    cancelEditBtnEl.hidden = false;

    setAdminPickMarker(place.lat, place.lng);
    map.flyTo([place.lat, place.lng], 9, { duration: 0.7 });
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
    renderAdminPanel();
}

/**
 * Atvaizduoja aplankytų šalių ISO kodus ir esamus taškus admin skydelyje
 */
function renderAdminPanel() {
    // 1) Aplankytos šalys
    adminCountriesListEl.innerHTML = state.visitedCountries
        .map(
            (code) => `
            <span class="admin-country-chip">
                <span>${escapeHtml(code)}</span>
                <button
                    type="button"
                    class="admin-country-chip__remove"
                    data-remove-country="${escapeHtml(code)}"
                    title="Pašalinti ${escapeHtml(code)}"
                    aria-label="Pašalinti šalį ${escapeHtml(code)}"
                >✕</button>
            </span>
        `
        )
        .join('');

    // 2) Esami taškai
    adminPlacesCountEl.textContent = state.places.length;
    adminPlacesListEl.innerHTML = state.places
        .map((place) => {
            const meta = CATEGORY_META[place.category] || { emoji: '📍' };
            return `
                <div class="admin-place-item">
                    <div class="admin-place-item__info">
                        <div class="admin-place-item__title">${meta.emoji} ${escapeHtml(place.title)}</div>
                        <div class="admin-place-item__meta">${escapeHtml(place.country)} • ${escapeHtml(place.date || '')}</div>
                    </div>
                    <div class="admin-place-item__actions">
                        <button type="button" class="admin-icon-btn" data-edit-id="${place.id}">Redaguoti</button>
                        <button type="button" class="admin-icon-btn admin-icon-btn--danger" data-delete-id="${place.id}">Ištrinti</button>
                    </div>
                </div>
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

// 1) Paspaudus bet kur ant žemėlapio admin režime – įrašomos lat ir lng koordinatės į formą
map.on('click', (event) => {
    if (!state.isAdminOpen) return;

    const lat = Number(event.latlng.lat.toFixed(4));
    const lng = Number(event.latlng.lng.toFixed(4));

    placeLatInputEl.value = lat;
    placeLngInputEl.value = lng;
    setAdminPickMarker(lat, lng);
});

// Spynos mygtuko ir uždarymo mygtuko įvykiai
adminToggleBtnEl.addEventListener('click', () => {
    setAdminMode(!state.isAdminOpen);
});

adminCloseBtnEl.addEventListener('click', () => {
    setAdminMode(false);
});

// 2) Vietos pridėjimo / redagavimo formos pateikimas
placeFormEl.addEventListener('submit', (event) => {
    event.preventDefault();

    const lat = parseFloat(placeLatInputEl.value);
    const lng = parseFloat(placeLngInputEl.value);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
    }

    const placePayload = {
        id:
            state.editingPlaceId !== null
                ? state.editingPlaceId
                : state.places.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1,
        title: placeTitleInputEl.value.trim(),
        country: placeCountryInputEl.value.trim(),
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        date: placeDateInputEl.value,
        category: placeCategoryInputEl.value,
        description: placeDescInputEl.value.trim(),
        youtubeUrl: placeYoutubeInputEl.value.trim()
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
    renderAdminPanel();

    map.flyTo([placePayload.lat, placePayload.lng], Math.max(map.getZoom(), 7), {
        duration: 0.7
    });
});

cancelEditBtnEl.addEventListener('click', () => {
    resetPlaceForm();
});

// Esamų taškų sąrašo paspaudimai (Redaguoti / Ištrinti)
adminPlacesListEl.addEventListener('click', (event) => {
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
   Paieškos, filtrų ir pradinio užkrovimo valdymas
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
        state.places = Array.isArray(data.places) ? data.places : [];
    } catch (error) {
        console.warn('Nepavyko užkrauti keliones.json per fetch, naudojami atsarginiai duomenys:', error);
        state.visitedCountries = [...FALLBACK_DATA.visitedCountries];
        state.places = FALLBACK_DATA.places.map((item) => ({ ...item }));
    }

    resetPlaceForm();
    renderMap({ fitBounds: true });

    // Patikriname, ar URL turi ?admin=1
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
        setAdminMode(true);
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
    state.searchQuery = '';
    searchInputEl.value = '';
    clearSearchBtnEl.hidden = true;
    setActiveCategoryButton('Visos');
    renderMap({ fitBounds: true, isSearch: false });
});

// Paspaudus logotipą – atstatome bendrą vaizdą
resetMapBtnEl.addEventListener('click', (event) => {
    event.preventDefault();
    state.activeCategory = 'Visos';
    state.searchQuery = '';
    searchInputEl.value = '';
    clearSearchBtnEl.hidden = true;
    setActiveCategoryButton('Visos');
    renderMap({ fitBounds: true, isSearch: false });
});

// Užtikriname korektišką žemėlapio dydį keičiant lango matmenis
window.addEventListener('resize', () => {
    map.invalidateSize();
});

// Paleidžiame aplikaciją
initApp();
