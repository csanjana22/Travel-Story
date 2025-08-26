const axios = require('axios');

async function geocodeLocation(placeName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`;
    const res = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'travel-story-app/1.0 (localhost)' }
    });
    if (res.data?.length) {
      return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}
module.exports = { geocodeLocation };