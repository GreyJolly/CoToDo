window.addEventListener('pageshow', function(event) {
  // Check if page is loaded from cache
  if (event.persisted) {
    // Update your content
    loadFreshContent();
  }
});