/**
 * Classic WeatherSTAR / TWC Condition Mapping Engine
 * Resolves NWS API shortForecast phrases, METAR weather tokens, and alert strings to animated classic TWC GIFs.
 */

(function(global) {
  const TWC_ICON_BASE_PATH = '/assets/twc-icons/';

  /**
   * Returns the URL of the classic TWC animated GIF for a given condition string and time of day.
   * @param {string} conditionString - e.g. "Partly Cloudy", "Thunderstorms", "RA", "Snow Showers"
   * @param {boolean} isNight - Whether current period is nighttime
   * @returns {string} Animated GIF URL (e.g. "/assets/twc-icons/sunny.gif")
   */
  function getTwcAnimatedIcon(conditionString, isNight = false) {
    if (!conditionString || typeof conditionString !== 'string') {
      return `${TWC_ICON_BASE_PATH}${isNight ? 'clearnight.gif' : 'sunny.gif'}`;
    }

    const c = conditionString.trim().toLowerCase();

    // 1. Thunderstorms / Severe Convective
    if (c.includes('thunder') || c.includes('tstorm') || c.includes('tsra') || c.includes('vcts') || c.includes('lightning') || c.includes('squall')) {
      return `${TWC_ICON_BASE_PATH}tstorm.gif`;
    }

    // 2. Winter Storm / Blizzard
    if (c.includes('blizzard')) {
      return `${TWC_ICON_BASE_PATH}blizzard.gif`;
    }

    // 3. Sleet / Freezing Rain / Wintry Mix / Ice Pellets
    if (c.includes('sleet') || c.includes('freezing rain') || c.includes('fzra') || c.includes('pl') || c.includes('ice pellet') || c.includes('wintry mix') || c.includes('rain and snow')) {
      return `${TWC_ICON_BASE_PATH}sleet.gif`;
    }

    // 4. Snow / Flurries
    if (c.includes('flurr')) {
      return `${TWC_ICON_BASE_PATH}flurries.gif`;
    }
    if (c.includes('snow') || c.includes('sn') || c.includes('heavy snow')) {
      return `${TWC_ICON_BASE_PATH}snow.gif`;
    }

    // 5. Heavy Rain / Rain Showers / Drizzle
    if (c.includes('drizzle') || c.includes('dz') || c.includes('light rain')) {
      return `${TWC_ICON_BASE_PATH}drizzle.gif`;
    }
    if (c.includes('shower') || c.includes('shra')) {
      return `${TWC_ICON_BASE_PATH}showers.gif`;
    }
    if (c.includes('rain') || c.includes('ra') || c.includes('downpour') || c.includes('precipitation')) {
      return `${TWC_ICON_BASE_PATH}rain.gif`;
    }

    // 6. Fog / Mist / Haze / Smoke
    if (c.includes('fog') || c.includes('dense fog') || c.includes('fg')) {
      return `${TWC_ICON_BASE_PATH}fog.gif`;
    }
    if (c.includes('haze') || c.includes('hz') || c.includes('smoke') || c.includes('fu') || c.includes('dust')) {
      return `${TWC_ICON_BASE_PATH}haze.gif`;
    }
    if (c.includes('mist') || c.includes('br')) {
      return `${TWC_ICON_BASE_PATH}mist.gif`;
    }

    // 7. Wind / Breezy / Windy
    if (c.includes('windy') || c.includes('breezy') || c.includes('blustery') || c.includes('gale')) {
      return `${TWC_ICON_BASE_PATH}windy.gif`;
    }

    // 8. Overcast / Mostly Cloudy / Cloudy
    if (c.includes('overcast') || c.includes('ovc')) {
      return `${TWC_ICON_BASE_PATH}overcast.gif`;
    }
    if (c.includes('mostly cloudy') || c.includes('mcloudy') || c.includes('bkn')) {
      return `${TWC_ICON_BASE_PATH}mcloudy.gif`;
    }
    if (c.includes('cloudy') || c.includes('clouds')) {
      return `${TWC_ICON_BASE_PATH}cloudy.gif`;
    }

    // 9. Partly Cloudy / Partly Sunny / Scattered Clouds
    if (c.includes('partly cloudy') || c.includes('pcloudy') || c.includes('partly sunny') || c.includes('sct') || c.includes('few')) {
      return `${TWC_ICON_BASE_PATH}${isNight ? 'pcloudynight.gif' : 'pcloudy.gif'}`;
    }

    // 10. Sunny / Clear / Fair
    if (c.includes('sunny') || c.includes('clear') || c.includes('fair') || c.includes('skc') || c.includes('clr') || c.includes('nsw') || c.includes('normal')) {
      return `${TWC_ICON_BASE_PATH}${isNight ? 'clearnight.gif' : 'sunny.gif'}`;
    }

    // Fallback
    return `${TWC_ICON_BASE_PATH}unknown.gif`;
  }

  // Export functions to global scope
  global.getTwcAnimatedIcon = getTwcAnimatedIcon;
  global.getTwcIconUrl = getTwcAnimatedIcon; // Backwards compatible alias
})(typeof window !== 'undefined' ? window : this);
