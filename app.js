document.addEventListener('DOMContentLoaded', function() {

  var map = L.map('map', {
    center: [39.5, -98.35],
    zoom: 4,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  var allMarkers = [];

  PHOTOS.forEach(function(photo, idx) {
    if (photo.lat === null || photo.lng === null) return;
    var el = document.createElement('div');
    el.className = 'photo-marker month-' + photo.month;
    var marker = L.marker([photo.lat, photo.lng], {
      icon: L.divIcon({ className: '', html: el.outerHTML, iconSize: [12,12], iconAnchor: [6,6] })
    });
    var popup = '<div class="popup-inner">'
      + '<img src="' + photo.file + '" alt="' + photo.label + '" loading="lazy" />'
      + '<p>' + photo.label + (photo.state ? ' - ' + photo.state : '') + '</p>'
      + '</div>';
    marker.bindPopup(popup, { maxWidth: 220 });
    marker.addTo(map);
    allMarkers.push({ marker: marker, month: photo.month });
  });

  var gpsCount = PHOTOS.filter(function(p){ return p.lat !== null; }).length;
  if (gpsCount === 0) {
    var notice = L.control({ position: 'topright' });
    notice.onAdd = function() {
      var div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(10,10,15,0.88);border:1px solid rgba(200,169,110,0.3);border-radius:10px;padding:12px 16px;color:#c8a96e;font-size:0.78rem;font-family:Inter,sans-serif;letter-spacing:0.05em;max-width:220px;line-height:1.6;backdrop-filter:blur(10px);';
      div.innerHTML = 'GPS pins loading...<br><span style="color:#7a7a9a;font-size:0.7rem;">EXIF extraction pending.<br>Map will populate automatically.</span>';
      return div;
    };
    notice.addTo(map);
  }

  var grid = document.getElementById('gallery-grid');
  var lightboxIndex = 0;
  var visiblePhotos = PHOTOS.slice();

  function renderGallery(photos) {
    grid.innerHTML = '';
    visiblePhotos = photos;
    if (photos.length === 0) {
      grid.innerHTML = '<p style="color:#7a7a9a;text-align:center;grid-column:1/-1;padding:60px 0;">No photos for this period.</p>';
      return;
    }
    photos.forEach(function(photo, idx) {
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.index = idx;
      var monthName = MONTH_NAMES[photo.month] || '';
      var stateStr = photo.state ? ' - ' + photo.state : '';
      item.innerHTML = '<img src="' + photo.file + '" alt="' + photo.label + '" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=\\\'placeholder-card\\\'><span>' + photo.label + '</span></div>\';" />'
        + '<div class="item-overlay"><div class="item-meta"><div class="item-date">' + photo.label + '</div><div>' + monthName + stateStr + '</div></div></div>';
      item.addEventListener('click', function() { openLightbox(idx); });
      grid.appendChild(item);
    });
  }

  var lightbox = document.getElementById('lightbox');
  var overlay = document.getElementById('lightbox-overlay');
  var lbImg = document.getElementById('lb-img');
  var lbDate = document.getElementById('lb-date');
  var lbLoc = document.getElementById('lb-location');

  function openLightbox(idx) {
    lightboxIndex = idx;
    updateLightbox();
    lightbox.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    var photo = visiblePhotos[lightboxIndex];
    if (!photo) return;
    lbImg.src = photo.file;
    lbImg.alt = photo.label;
    lbDate.textContent = (MONTH_NAMES[photo.month] || '') + ' ' + photo.day + ', 2024';
    lbLoc.textContent = photo.state || (photo.lat ? photo.lat.toFixed(3) + ', ' + photo.lng.toFixed(3) : '');
  }

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);

  document.getElementById('lb-prev').addEventListener('click', function() {
    lightboxIndex = (lightboxIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
    updateLightbox();
  });

  document.getElementById('lb-next').addEventListener('click', function() {
    lightboxIndex = (lightboxIndex + 1) % visiblePhotos.length;
    updateLightbox();
  });

  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { lightboxIndex = (lightboxIndex - 1 + visiblePhotos.length) % visiblePhotos.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % visiblePhotos.length; updateLightbox(); }
  });

  function applyFilter(month) {
    var filtered = month === 'all' ? PHOTOS.slice() : PHOTOS.filter(function(p){ return p.month === parseInt(month); });
    renderGallery(filtered);
    allMarkers.forEach(function(m) {
      if (month === 'all' || m.month === parseInt(month)) {
        m.marker.addTo(map);
      } else {
        map.removeLayer(m.marker);
      }
    });
    document.getElementById('stat-photos').textContent = filtered.length;
  }

  document.querySelectorAll('.tl-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tl-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var m = btn.dataset.month;
      document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.month === m); });
      applyFilter(m);
    });
  });

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var m = btn.dataset.month;
      document.querySelectorAll('.tl-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.month === m); });
      applyFilter(m);
    });
  });

  var heroBtn = document.querySelector('.hero-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  renderGallery(PHOTOS);
});
