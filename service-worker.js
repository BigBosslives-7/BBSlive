self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(async function() {
      const preloadResponse = await event.preloadResponse;
      if (preloadResponse) {
        return preloadResponse;
      }
      const networkResponse = await fetch(event.request);
      return networkResponse;
    }());
  }
});