// Apify integration.
//
// Uses Apify's "compass/crawler-google-places" actor (the standard Google Maps
// scraper actor) via Apify's REST API. We poll for run completion rather than
// using webhooks, to keep local dev simple.

const axios = require('axios');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = process.env.APIFY_ACTOR_ID || 'compass~crawler-google-places';
const APIFY_BASE = 'https://api.apify.com/v2';

if (!APIFY_TOKEN) {
  console.warn(
    '[apifyService] WARNING: APIFY_TOKEN is not set. Scrapes will fail until you add it to server/.env'
  );
}

function client() {
  return axios.create({
    baseURL: APIFY_BASE,
    params: { token: APIFY_TOKEN },
  });
}

/**
 * Starts an Apify actor run for scraping Google Maps businesses.
 * Returns the Apify run object (contains run.id, run.defaultDatasetId, etc).
 */
async function startGoogleMapsScrape({ niche, city, maxResults }) {
  const searchTerm = `${niche} in ${city}`;

  const input = {
    searchStringsArray: [searchTerm],
    maxCrawledPlacesPerSearch: maxResults,
    language: 'en',
    skipClosedPlaces: true,
  };

  const { data } = await client().post(
    `/acts/${encodeURIComponent(ACTOR_ID)}/runs`,
    input
  );

  // data.data contains the run object per Apify's API shape
  return data.data;
}

/**
 * Fetches the current status of an Apify run.
 */
async function getRunStatus(runId) {
  const { data } = await client().get(`/actor-runs/${runId}`);
  return data.data; // { status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | ..., defaultDatasetId, ... }
}

/**
 * Fetches the dataset items produced by a finished run.
 */
async function getDatasetItems(datasetId) {
  const { data } = await client().get(`/datasets/${datasetId}/items`, {
    params: { token: APIFY_TOKEN, format: 'json', clean: true },
  });
  return data; // array of place objects
}

/**
 * Maps a raw Apify Google Places item into our Prospect shape.
 */
function mapPlaceToProspect(place, { niche, city }) {
  return {
    placeId: place.placeId || place.place_id || place.cid || place.url,
    name: place.title || place.name || 'Unknown',
    phone: place.phone || place.phoneUnformatted || null,
    email: place.email || null, // Google Maps actor usually doesn't return email
    website: place.website || null,
    address: place.address || place.fullAddress || null,
    rating: typeof place.totalScore === 'number' ? place.totalScore : place.rating || null,
    reviewsCount: place.reviewsCount || null,
    niche,
    city,
  };
}

module.exports = {
  startGoogleMapsScrape,
  getRunStatus,
  getDatasetItems,
  mapPlaceToProspect,
};
