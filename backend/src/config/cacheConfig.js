// // cache.js
import NodeCache from 'node-cache'
// const chaches = new NodeCache({ stdTTL: 1800 });  // Cache expires after 30 minutes
const caches = new NodeCache({ stdTTL: 3600, useClones: false });  // Cache expires after 1 hour (3600 seconds)

const cacheKeys = {
    auth: 'iway-auth',
    visa: 'visa',
    social: 'social',
    trip_filters: 'trip-filters',
    trips: 'trips',
    blogs: 'blogs',
    docs: 'docs',
}


function getCache(key) {
  return caches.get(key);
}

function setCache(key, data) {
  caches.set(key, data);
}

// Also clears derived entries such as "trips:1:20" (paged listings)
function deleteCache(key) {
  caches.del([key, ...caches.keys().filter((item) => item.startsWith(`${key}:`))]);
}

export { getCache, setCache, cacheKeys, deleteCache };
