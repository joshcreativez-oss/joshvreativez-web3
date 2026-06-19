/* ============================================================
   Helpers
   ============================================================ */
function applyMasonryAspect(grid){
  if(!grid || !grid.hasAttribute('data-masonry')) return;
  const imgs = Array.from(grid.querySelectorAll('img'));
  imgs.forEach(img=>{
    const parent = img.closest('.workItem');
    if(!parent) return;

    const setAR = ()=>{
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if(w && h){
        parent.style.setProperty('--ar', `${w} / ${h}`);
      }
    };

    if(img.complete){
      setAR();
    }else{
      img.addEventListener('load', setAR, { once:true });
    }
  });
}

(function(){
  const btn = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if(btn && menu){
    // a11y
    btn.setAttribute('aria-controls', 'siteMenu');
    btn.setAttribute('aria-expanded', 'false');
    menu.id = 'siteMenu';

    btn.addEventListener('click', ()=>{
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Active link
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = (a.getAttribute('href')||'').toLowerCase();
    if(href.endsWith(path)) a.classList.add('active');
  });
})();

// =============================================
// Mobile header hide/show on scroll
// - Hides completely when scrolling down
// - Shows when scrolling up
// =============================================
(function headerHideShowOnScroll(){
  const bar = document.querySelector('.topbar');
  if(!bar) return;

  // Floating menu button (for when header is hidden)
  let floatBtn = document.querySelector('.floatMenuToggle');
  if(!floatBtn){
    floatBtn = document.createElement('button');
    floatBtn.type = 'button';
    floatBtn.className = 'floatMenuToggle';
    floatBtn.setAttribute('aria-label', 'Open menu');
    floatBtn.innerHTML = '<span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>';
    document.body.appendChild(floatBtn);

    floatBtn.addEventListener('click', ()=>{
      // Reveal header and open the existing menu
      bar.classList.remove('is-hidden');
      const toggle = document.querySelector('[data-menu-toggle]');
      if(toggle) toggle.click();
    });
  }

  const mq = window.matchMedia('(max-width: 860px)');
  let lastY = window.scrollY || 0;
  let ticking = false;

  const update = ()=>{
    const y = window.scrollY || 0;

    // Desktop: ensure visible
    if(!mq.matches){
      bar.classList.remove('is-hidden');
      floatBtn.classList.remove('is-visible');
      lastY = y;
      return;
    }

    // If the mobile menu is open, keep header visible
    const menu = document.querySelector('[data-menu]');
    if(menu && menu.classList.contains('open')){
      bar.classList.remove('is-hidden');
      floatBtn.classList.remove('is-visible');
      lastY = y;
      return;
    }

    // Always show at the very top
    if(y <= 10){
      bar.classList.remove('is-hidden');
      floatBtn.classList.remove('is-visible');
      lastY = y;
      return;
    }

    const delta = y - lastY;

    // Add a small threshold to prevent flicker/jitter
    if(delta > 8 && y > 40){
      // scrolling down
      bar.classList.add('is-hidden');
    }else if(delta < -8){
      // scrolling up
      bar.classList.remove('is-hidden');
    }

    // Floating button visibility:
    // show only on mobile when header is hidden and menu is closed
    if(mq.matches){
      const isHidden = bar.classList.contains('is-hidden');
      const menuNow = document.querySelector('[data-menu]');
      const menuOpen = !!(menuNow && menuNow.classList.contains('open'));
      if(isHidden && !menuOpen){
        floatBtn.classList.add('is-visible');
      }else{
        floatBtn.classList.remove('is-visible');
      }
    }else{
      floatBtn.classList.remove('is-visible');
    }

    lastY = y;
  };

  window.addEventListener('scroll', ()=>{
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      update();
      ticking = false;
    });
  }, { passive:true });

  // Re-evaluate on resize / breakpoint change
  if(typeof mq.addEventListener === 'function') mq.addEventListener('change', update);
  else if(typeof mq.addListener === 'function') mq.addListener(update);

  update();
})();

// =============================================
// Album Prev/Next navigation (static HTML)
// =============================================
(function albumPager(){
  const mount = document.getElementById('albumPager');
  if(!mount) return;

  const currentFile = (window.location.pathname || '').split('/').pop();
  if(!currentFile) return;

  // Ordered album collections. Update this list as you add real client albums.
  const collections = {
    weddings: [
      { file: 'weddings-amina-and-kevin.html', name: 'Amina Kevin' },
      { file: 'weddings-faith-and-chama.html', name: 'Faith Chama' },
      { file: 'weddings-nia-and-tramel.html', name: 'Nia Tramel' },
      { file: 'weddings-bishop-and-sarah.html', name: 'Bishop Sarah' },
      { file: 'weddings-danielle-and-dennis.html', name: 'Danielle Dennis' },
      { file: 'weddings-alexis-and-nik.html', name: 'Alexis Nik' },
    ],
    engagements: [
      { file: 'engagements-city-love.html', name: 'Downtown Stroll' },
      { file: 'engagements-golden-hour-field.html', name: 'Golden Hour Field' },
      { file: 'engagements-at-home-story.html', name: 'At‑Home Story' },
      { file: 'engagements-coastal-romance.html', name: 'Coastal Session' },
      { file: 'engagements-studio-editorial.html', name: 'Studio Editorial' },
      { file: 'engagements-mara-escape.html', name: 'Mara Escape' },
    ],
    decor: [
      { file: 'decor-detail-royal-setup.html', name: 'Royal Setup' },
      { file: 'decor-detail-garden-theme.html', name: 'Garden Theme' },
    ],
    portraits: [
      { file: 'portraits-studio-elegance.html', name: 'Studio Elegance' },
      { file: 'portraits-outdoor-golden.html', name: 'Outdoor Golden' },
    ],
  };

  let list = null;
  for(const key of Object.keys(collections)){
    if(collections[key].some(a => a.file === currentFile)){
      list = collections[key];
      break;
    }
  }
  if(!list) return;

  const idx = list.findIndex(a => a.file === currentFile);
  const prev = idx > 0 ? list[idx-1] : null;
  const next = idx < list.length-1 ? list[idx+1] : null;

  const linkHtml = (dir, item) => {
    const isPrev = dir === 'prev';
    const label = isPrev ? 'Previous' : 'Next';
    const arrow = isPrev ? '←' : '→';
    if(!item){
      return `<a class="isDisabled" href="#" aria-disabled="true">
        <span class="stack"><span class="label">${label}</span><span class="name">—</span></span>
        <span class="arrow">${arrow}</span>
      </a>`;
    }
    return `<a href="${item.file}" aria-label="${label} album: ${item.name}">
      <span class="stack"><span class="label">${label}</span><span class="name">${item.name}</span></span>
      <span class="arrow">${arrow}</span>
    </a>`;
  };

  mount.innerHTML = `${linkHtml('prev', prev)}${linkHtml('next', next)}`;
})();

// =============================================
// Contact form fallback: mailto (no backend)
// Add attribute: data-mailto-form and data-to="email@example.com"
// =============================================
(function mailtoForm(){
  const form = document.querySelector('form[data-mailto-form]');
  if(!form) return;

  form.addEventListener('submit', (e)=>{
    // If an action exists, allow normal submission
    const action = (form.getAttribute('action') || '').trim();
    if(action) return;

    e.preventDefault();

    const to = (form.getAttribute('data-to') || '').trim();
    if(!to) return;

    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const type = (data.get('type') || '').toString().trim();
    const date = (data.get('date') || '').toString().trim();
    const location = (data.get('location') || '').toString().trim();
    const venue = (data.get('venue') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    const subject = encodeURIComponent(`Booking Inquiry${type ? ' — ' + type : ''}${name ? ' — ' + name : ''}`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone/WhatsApp: ${phone}`,
      `Type: ${type}`,
      `Date: ${date}`,
      `Location: ${location}`,
      `Venue: ${venue}`,
      '',
      'Message:',
      message
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
})();

// =============================================
// Fade-in on scroll (IntersectionObserver)
// Add class="fadeIn" to any element to animate in
// =============================================

/* Animations removed for simplicity: images always visible */
;







// =============================================
// Dropdown nav: hover to open (desktop), tap to open (mobile)
// Stays open until a submenu is selected, outside click, or ESC
// =============================================
(function dropdownNavHoverPersist(){
  const dds = Array.from(document.querySelectorAll('.dd'));
  if(!dds.length) return;

  function isTouch(){
    return window.matchMedia('(hover: none)').matches;
  }

  function closeAll(except){
    dds.forEach(dd=>{ if(dd!==except) dd.classList.remove('open'); });
  }

  // Desktop hover: open on mouseenter and KEEP open (no mouseleave close)
  dds.forEach(dd=>{
    dd.addEventListener('mouseenter', ()=>{
      if(isTouch()) return;
      closeAll(dd);
      dd.classList.add('open');
    });
  });

  // Toggle click: mobile tap opens/closes; desktop first click opens, second click navigates
  dds.forEach(dd=>{
    const toggle = dd.querySelector('.ddToggle');
    const menu = dd.querySelector('.ddMenu');
    if(!toggle || !menu) return;

    toggle.addEventListener('click', (e)=> {
      const open = dd.classList.contains('open');
      const href = (toggle.getAttribute('href') || '').trim();
      const noNav = toggle.dataset.noNav === '1' || href === '#' || href.toLowerCase().startsWith('javascript:');

      // Touch devices OR "no direct page" dropdowns: always toggle only (never navigate)
      if(isTouch() || noNav){
        e.preventDefault();
        closeAll(dd);
        dd.classList.toggle('open', !open);
        return;
      }

      // Desktop: first click opens, second click navigates (default behavior)
      if(!open){
        e.preventDefault();   // first click: open only
        closeAll(dd);
        dd.classList.add('open');
      }
    });

    // Close when selecting a submenu item
    menu.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', ()=>{
        dd.classList.remove('open');
      });
    });
  });

  // Close on outside click
  document.addEventListener('click', (e)=>{
    if(e.target.closest('.dd')) return;
    closeAll(null);
  });

  // Close on ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeAll(null);
  });
})();

// =============================================
// Site content loader
// - Edit assets/content.json to change About text + small site copy
// - Usage:
//    <span data-content="about.title"></span>
//    <img data-content-attr="alt" data-content="about.title" />
// =============================================
(function siteContentLoader(){
  const nodes = Array.from(document.querySelectorAll('[data-content]'));
  if(!nodes.length) return;

  const get = (obj, path) => {
    return path.split('.').reduce((acc, key)=> (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
  };

  fetch('assets/content.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if(!data) return;
      nodes.forEach(el => {
        const key = (el.getAttribute('data-content') || '').trim();
        if(!key) return;
        const val = get(data, key);
        if(val === undefined || val === null) return;

        const attr = (el.getAttribute('data-content-attr') || '').trim();
        if(attr){
          el.setAttribute(attr, String(val));
        } else {
          el.textContent = String(val);
        }
      });
    })
    .catch(()=>{});
})();

// =============================================
// Two-level Galleries
// - Category pages list client albums (cards)
// - Album page loads only that album's images
// Note: On static hosting, folders can't be read directly.
//       We use a small manifest below as the "backend".
// =============================================
(async function twoLevelGalleries(){


  const FALLBACK_GALLERIES = {
    weddings: {
      label: 'Weddings',
      base: 'assets/galleries/weddings',
      albums: {
        'chama-faith': {
          title: 'Chama & Faith',
          cover: 'assets/galleries/weddings/chama-faith/cover.jpg',
          images: [
            'assets/galleries/weddings/chama-faith/01.jpg',
            'assets/galleries/weddings/chama-faith/02.jpg'
          ]
        },
        'amina-kevin': {
          title: 'Amina & Kevin',
          cover: 'assets/galleries/weddings/amina-kevin/cover.jpg',
          images: [
            'assets/galleries/weddings/amina-kevin/01.jpg',
            'assets/galleries/weddings/amina-kevin/02.jpg'
          ]
        }
      }
    },
    engagements: {
      label: 'Engagements',
      base: 'assets/galleries/engagements',
      albums: {
        'sharon-nick': {
          title: 'Sharon & Nick',
          cover: 'assets/galleries/engagements/sharon-nick/cover.jpg',
          images: [
            'assets/galleries/engagements/sharon-nick/01.jpg',
            'assets/galleries/engagements/sharon-nick/02.jpg'
          ]
        },
        'coastal-romance': {
          title: 'Coastal Romance',
          cover: 'assets/galleries/engagements/coastal-romance/cover.jpg',
          images: [
            'assets/galleries/engagements/coastal-romance/01.jpg',
            'assets/galleries/engagements/coastal-romance/02.jpg'
          ]
        }
      }
    }
  };

  async function getGalleries(){
    // Prefer generated manifest (supports original filenames without renaming)
    try{
      const res = await fetch('assets/galleries/manifest.json', { cache: 'no-store' });
      if(!res.ok) throw new Error('Manifest fetch failed');
      const data = await res.json();

      // Convert manifest shape -> legacy shape expected by the renderer
      const out = {};
      const cats = (data && data.categories) ? data.categories : {};
      Object.entries(cats).forEach(([catKey, cat])=>{
        out[catKey] = {
          label: cat.label || catKey,
          base: cat.base || `assets/galleries/${catKey}`,
          albums: cat.albums || {},
          // For flat (no-album) galleries
          // - images: use `files`
          // - videos: use `videos` (fallback to `files` for older manifests)
          files: Array.isArray(cat.files) ? cat.files : [],
          videos: Array.isArray(cat.videos) ? cat.videos : (Array.isArray(cat.files) ? cat.files : [])
        };
      });
      return Object.keys(out).length ? out : FALLBACK_GALLERIES;
    }catch(e){
      return FALLBACK_GALLERIES;
    }
  }

  const GALLERIES = await getGalleries();

  // -----------------------------
  // Category hero backgrounds
  // -----------------------------
  // Category pages (weddings.html, engagements.html, portraits.html, decor-detail.html, videos.html)
  // include a section with: data-album-hero="<key>".
  
// We set a predictable hero image path so you can swap images later by replacing files in assets/heroes/.
// Supports multiple image formats (jpg/jpeg/png/webp/avif) and case variations.
async function resolveHeroPath(key){
  const exts = ['jpg','jpeg','png','webp','avif'];
  for(const ext of exts){
    const url = `assets/heroes/${key}-hero.${ext}`;
    // Probe existence by loading an Image (works on static hosts)
    const ok = await new Promise((resolve)=>{
      const img = new Image();
      img.onload = ()=>resolve(true);
      img.onerror = ()=>resolve(false);
      img.src = url + `?v=${Date.now()}`;
    });
    if(ok) return url;
  }
  // Fallback to jpg (most common)
  return `assets/heroes/${key}-hero.jpg`;
}

for(const hero of document.querySelectorAll('[data-album-hero]')){
  const key = hero.getAttribute('data-album-hero');
  if(!key) continue;
  // If the page already set a hero image, don't overwrite it.
  const current = (hero.style && hero.style.getPropertyValue('--hero-image')) || '';
  if(current && current.trim().length) continue;

  const resolved = await resolveHeroPath(key);
  hero.style.setProperty('--hero-image', `url('${resolved}')`);
  hero.classList.add('heroCinematic');
}


  function qs(name){
    return new URLSearchParams(window.location.search).get(name);
  }

// -----------------------------
// Category listing (album cards)
// -----------------------------
const listing = document.querySelector('[data-album-listing]');
if(listing){
  const categoryKey = listing.getAttribute('data-album-listing');
  const cat = GALLERIES[categoryKey];
  if(!cat){
    listing.innerHTML = '<div class="muted">No albums found.</div>';
    return;
  }

  const cards = Object.entries(cat.albums).map(([slug, album])=>{
    const href = `album.html?category=${encodeURIComponent(categoryKey)}&album=${encodeURIComponent(slug)}`;
    const bg = `url('${album.cover}')`;
    return `
      <div class="albumCard" style="--bg:${bg}">
        <a href="${href}" aria-label="Open album: ${album.title}"></a>
        <div class="albumTitle">${album.title}</div>
      </div>
    `;
  }).join('');

  listing.innerHTML = cards || '<div class="muted">No albums yet.</div>';
}

// -----------------------------

// -----------------------------
// Flat image galleries (no albums)
// -----------------------------
// Used by portraits.html and decor-detail.html.
// Requires assets/galleries/manifest.json to include category-level "files" (loose images).
function renderFlatImageGallery(gridEl, categoryKey){
  const cat = GALLERIES[categoryKey];
  const files = (cat && (cat.files || cat.images)) ? (cat.files || cat.images) : [];
  const base = (cat && cat.base) ? (cat.base.endsWith('/') ? cat.base : (cat.base + '/')) : `assets/galleries/${categoryKey}/`;

  if(!gridEl) return;
  if(!files.length){
    gridEl.innerHTML = '<div class="muted">No images yet. Add images to <b>' + base + '</b> and run <b>python tools/build_galleries_manifest.py</b>.</div>';
    return;
  }

  const items = files.map((src, i)=>{
    const resolved = (src.includes('/') ? src : (base + src));
    const safeAlt = `${categoryKey} photo ${i+1}`;
    return `
      <button class="workItem" data-lightbox-item type="button" data-src="${resolved}" aria-label="Open image ${i+1}">
        <img src="${resolved}" alt="${safeAlt}" loading="lazy" />
      </button>
    `;
  }).join('');

  gridEl.innerHTML = items;
  applyMasonryAspect(gridEl);
}

// Auto-render if these grids exist on the page
const portraitsGrid = document.getElementById('portraitsGrid');
if(portraitsGrid) renderFlatImageGallery(portraitsGrid, 'portraits');

const decorGrid = document.getElementById('decorGrid');
if(decorGrid) renderFlatImageGallery(decorGrid, 'decor-detail');


// Videos listing (flat files)
// -----------------------------
const videoListing = document.querySelector('[data-video-listing]');
if(videoListing){
  const categoryKey = videoListing.getAttribute('data-video-listing');
  const cat = GALLERIES[categoryKey];
  const files = (cat && (cat.videos || cat.files)) ? (cat.videos || cat.files) : [];
  const base = (cat && cat.base) ? (cat.base.endsWith('/') ? cat.base : (cat.base + '/')) : `assets/galleries/${categoryKey}/`;

  if(!files.length){
    videoListing.innerHTML = '<div class="muted">No videos yet. Add files to <b>assets/galleries/videos/</b> and run <b>python tools/build_galleries_manifest.py</b>.</div>';
    return;
  }

  const cards = files.map((src, i)=>{
    // src may be a filename or a full relative path
    const resolved = (src.includes('/') ? src : (base + src));
    const prettyName = (srcStr)=>{
      const raw = String(srcStr||'').split('?')[0].split('#')[0];
      const last = raw.split('/').pop() || raw;
      const noExt = last.replace(/\.[^/.]+$/,'');
      try{ return decodeURIComponent(noExt).replace(/[_-]+/g,' ').trim() || noExt; }catch(e){ return noExt; }
    };
    const label = prettyName(src);
    return `
      <div class="videoCard">
        <div class="videoFrame">
          <video controls preload="metadata" playsinline src="${resolved}"></video>
        </div>
        <div class="videoMeta">
          <div class="videoTitle">${label}</div>
        </div>
      </div>
    `;
  }).join('');

  videoListing.innerHTML = cards;
}


  // -----------------------------
  // Album page (loads images)
  // -----------------------------
  const albumGrid = document.getElementById('albumGrid');
  if(albumGrid && document.querySelector('[data-album-view]')){
    const categoryKey = qs('category');
    const albumSlug = qs('album');
    const cat = GALLERIES[categoryKey];
    const album = cat && cat.albums ? cat.albums[albumSlug] : null;

    const titleEl = document.getElementById('albumTitle');
    const crumbTitleEl = document.getElementById('albumTitleCrumb');
    const catLink = document.getElementById('albumCategoryLink');

    if(catLink && cat){
      catLink.textContent = cat.label;
      const catHrefMap = {
        weddings: 'weddings.html',
        engagements: 'engagements.html',
        portraits: 'portraits.html',
        decor: 'decor-detail.html',
        'decor-detail': 'decor-detail.html',
        'decor-details': 'decor-detail.html'
      };
      catLink.href = catHrefMap[categoryKey] || 'gallery.html';
    }

    if(!album){
      if(titleEl) titleEl.textContent = 'Album not found';
      if(crumbTitleEl) crumbTitleEl.textContent = 'Album not found';
      albumGrid.innerHTML = '<div class="muted">Sorry — this album is missing or the link is incorrect.</div>';
      return;
    }

    if(titleEl) titleEl.textContent = album.title;
    if(crumbTitleEl) crumbTitleEl.textContent = album.title;
    document.title = `${album.title} • ${cat ? cat.label : 'Album'} • JoshCreativez`;

    const items = (album.images || []).map((src, i)=>{
      const safeAlt = `${album.title} photo ${i+1}`;
      return `
        <button class="workItem" data-lightbox-item type="button" data-src="${src}" aria-label="Open image ${i+1}">
          <img src="${src}" alt="${safeAlt}" loading="lazy" />
        </button>
      `;
    }).join('');

    albumGrid.innerHTML = items || '<div class="muted">No images in this album yet.</div>';

    applyMasonryAspect(albumGrid);

    // -----------------------------
    // Album navigation (prev/next)
    // -----------------------------
    const navHost = document.getElementById('albumNav');
    if(navHost && cat && cat.albums){
      const slugs = Object.keys(cat.albums);
      const currentIndex = slugs.indexOf(albumSlug);
      const total = slugs.length;

      // If only one album, hide navigation
      if(total <= 1 || currentIndex === -1){
        navHost.innerHTML = '';
      }else{
        // Looping behavior (requested)
        const prevIndex = (currentIndex - 1 + total) % total;
        const nextIndex = (currentIndex + 1) % total;

        const prevSlug = slugs[prevIndex];
        const nextSlug = slugs[nextIndex];

        const prevAlbum = cat.albums[prevSlug];
        const nextAlbum = cat.albums[nextSlug];

        const makeCard = (dir, slug, alb) => {
          const href = `album.html?category=${encodeURIComponent(categoryKey)}&album=${encodeURIComponent(slug)}`;
          const thumb = alb && alb.cover ? alb.cover : 'assets/album-cover.jpg';
          const title = alb && alb.title ? alb.title : slug;
          const arrow = dir === 'prev' ? '←' : '→';
          const label = dir === 'prev' ? 'Previous Album' : 'Next Album';
          return `
            <a class="albumNavCard ${dir}" href="${href}" aria-label="${label}: ${title}">
              <div class="albumNavKicker">${label}</div>
              <div class="albumNavRow">
                <div class="albumNavThumb" style="background-image:url('${thumb}')"></div>
                <div class="albumNavTitle">${title}</div>
                <div class="albumNavArrow">${arrow}</div>
              </div>
            </a>
          `;
        };

        navHost.innerHTML = `
          <div class="albumNavHeader">
            <div class="kicker">Album Navigation</div>
          </div>
          <div class="albumNavGrid">
            ${makeCard('prev', prevSlug, prevAlbum)}
            ${makeCard('next', nextSlug, nextAlbum)}
          </div>
        `;
      }
    }


    // Lightbox
    const nodes = Array.from(document.querySelectorAll('[data-lightbox-item]'));
    if(!nodes.length) return;

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightboxInner" role="dialog" aria-modal="true" aria-label="Image viewer">
        <button class="lightboxClose" type="button" data-lb-close aria-label="Close">×</button>
        <button class="lightboxNav lightboxPrev" type="button" data-lb-prev aria-label="Previous">←</button>
        <img class="lightboxImg" alt="" />
        <button class="lightboxNav lightboxNext" type="button" data-lb-next aria-label="Next">→</button>
      </div>
    `;
    document.body.appendChild(lb);

    const img = lb.querySelector('.lightboxImg');
    let idx = 0;

    function openAt(i){
      idx = (i + nodes.length) % nodes.length;
      const src = nodes[idx].getAttribute('data-src');
      img.src = src;
      lb.classList.add('open');
      document.body.classList.add('noScroll');
    }
    function close(){
      lb.classList.remove('open');
      document.body.classList.remove('noScroll');
      img.removeAttribute('src');
    }
    function prev(){ openAt(idx - 1); }
    function next(){ openAt(idx + 1); }

    nodes.forEach((btn, i)=>{
      btn.addEventListener('click', ()=> openAt(i));
    });
    // Clicking outside the image closes the viewer
    lb.addEventListener('click', (e)=>{
      if(e.target === lb) close();
    });
    lb.querySelectorAll('[data-lb-close]').forEach(el=> el.addEventListener('click', close));
    lb.querySelector('[data-lb-prev]').addEventListener('click', prev);
    lb.querySelector('[data-lb-next]').addEventListener('click', next);

    document.addEventListener('keydown', (e)=>{
      if(!lb.classList.contains('open')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowLeft') prev();
      if(e.key === 'ArrowRight') next();
    });
  }

})();

/* ============================================================
   AUTO-GENERATE SEE OUR WORK (manifest-based)
   Put images into: assets/see-our-work/
   Then run: python tools/build_manifest.py
   This creates: assets/see-our-work/manifest.json
   ============================================================ */
(async function buildSeeOurWork(){
  const grid = document.getElementById('seeWorkGrid');
  const rail = document.getElementById('highlightsRail');
  const featured = document.getElementById('featuredImage');
  const base = 'assets/see-our-work/';
  if(!grid && !rail && !featured) return;

  try{
    const res = await fetch(base + 'manifest.json', {cache:'no-store'});
    const manifest = await res.json();

    // featured
    if(featured && manifest.featured){
      featured.src = base + manifest.featured;
    }

    // highlights strip (VIDEOS)
    // Auto-reads videos from:
    //   1) assets/cinematic-highlights/ (recommended), via assets/cinematic-highlights/manifest.json
    //   2) assets/see-our-work/manifest.json -> highlightsVideos (fallback)
    // To update manifests, run: python tools/build_manifest.py
    if(rail){
      const isVideo = (name)=> /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(String(name||''));
      const renderRail = (basePath, files)=>{
        rail.innerHTML = '';
        const vids = (files || []).filter(isVideo);
        if(!vids.length){
          rail.innerHTML = '<div class="muted">Add highlight videos to <b>assets/cinematic-highlights/</b> (or <b>assets/see-our-work/</b>) and run <b>python tools/build_manifest.py</b>.</div>';
          return;
        }
        vids.forEach((fn)=>{
          const wrap = document.createElement('div');
          wrap.className = 'hItem';

          const vid = document.createElement('video');
          vid.src = basePath + fn;
          vid.preload = 'metadata';
          vid.playsInline = true;
          vid.muted = true;
          vid.loop = true;
          vid.autoplay = true;
          vid.controls = true;

          wrap.appendChild(vid);
          rail.appendChild(wrap);
        });
      };

      // Try dedicated cinematic highlights manifest first
      try{
        const cineBase = 'assets/cinematic-highlights/';
        const cineRes = await fetch(cineBase + 'manifest.json', {cache:'no-store'});
        if(cineRes.ok){
          const cine = await cineRes.json();
          const cineFiles = Array.isArray(cine.files) ? cine.files : [];
          if(cineFiles.length){
            renderRail(cineBase, cineFiles);
          }else{
            // fallback to see-our-work manifest
            const picks = Array.isArray(manifest.highlightsVideos) ? manifest.highlightsVideos : (manifest.highlights || []);
            renderRail(base, picks);
          }
        }else{
          const picks = Array.isArray(manifest.highlightsVideos) ? manifest.highlightsVideos : (manifest.highlights || []);
          renderRail(base, picks);
        }
      }catch(e){
        const picks = Array.isArray(manifest.highlightsVideos) ? manifest.highlightsVideos : (manifest.highlights || []);
        renderRail(base, picks);
      }
    }

    // grid// grid
    if(grid){
      grid.innerHTML = '';
      (manifest.grid || []).forEach((fn)=>{
        const fig = document.createElement('figure');
        fig.className = 'workItem';
        const img = document.createElement('img');
        img.src = base + fn;
        img.loading='lazy';
        img.alt = 'Portfolio photo';

        // Masonry: preserve original aspect ratios while still allowing cover-crop
        // by syncing the card's aspect-ratio to the image's natural dimensions.
        const syncAR = ()=>{
          if(img.naturalWidth && img.naturalHeight){
            fig.style.setProperty('--ar', `${img.naturalWidth}/${img.naturalHeight}`);
          }
        };
        img.addEventListener('load', syncAR);
        // If the image is cached it may already be complete.
        if(img.complete) syncAR();

        fig.appendChild(img);
        grid.appendChild(fig);
      });
    }

  }catch(err){
    if(grid) grid.innerHTML = '<div class="muted">Add images to <b>assets/see-our-work/</b>, then run <b>python tools/build_manifest.py</b>.</div>';
    if(rail) rail.innerHTML = '<div class="muted">Add images to <b>assets/see-our-work/</b> to populate highlights.</div>';
  }
})();

/* ============================================================
   LIGHTBOX + KEYBOARD NAV (premium)
   Click any image in See Our Work / Highlights
   Keys: ESC close, ← → navigate
   ============================================================ */
(function lightboxInit(){
  const collectImages = () => Array.from(document.querySelectorAll('#seeWorkGrid img, #highlightsRail img'))
    .filter(img => img && img.src);

  let images = [];
  let idx = 0;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightboxInner">
      <img class="lightboxImg" alt="Preview">
      <button class="lightboxClose" type="button" aria-label="Close">✕</button>
      <button class="lightboxNav lightboxPrev" type="button" aria-label="Previous">‹</button>
      <button class="lightboxNav lightboxNext" type="button" aria-label="Next">›</button>
      <div class="lightboxCap"></div>
    </div>
  `;
  document.body.appendChild(lb);

  const imgEl = lb.querySelector('.lightboxImg');
  const cap = lb.querySelector('.lightboxCap');
  const closeBtn = lb.querySelector('.lightboxClose');
  const prevBtn = lb.querySelector('.lightboxPrev');
  const nextBtn = lb.querySelector('.lightboxNext');

  const openAt = (i) => {
    images = collectImages();
    if(!images.length) return;
    idx = (i + images.length) % images.length;
    imgEl.src = images[idx].src;
    cap.textContent = `Image ${idx+1} of ${images.length}`;
    lb.classList.add('open');
    document.documentElement.classList.add('noScroll');
    
  };

  const close = () => {
    lb.classList.remove('open');
    document.documentElement.classList.remove('noScroll');
    
  };

  const prev = () => openAt(idx - 1);
  const next = () => openAt(idx + 1);

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  lb.addEventListener('click', (e)=>{
    if(e.target === lb) close();
  });

  document.addEventListener('keydown', (e)=>{
    if(!lb.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') prev();
    if(e.key === 'ArrowRight') next();
  });

  const attach = () => {
    images = collectImages();
    images.forEach((img, i)=>{
      img.style.cursor = 'zoom-in';
      if(!img.dataset.lbBound){
        img.dataset.lbBound="1";
        img.addEventListener('click', (ev)=>{
          ev.preventDefault();
          openAt(i);
        });
      }
    });
  };

  window.addEventListener('load', ()=> setTimeout(attach, 700));
  setTimeout(attach, 1400);
  setTimeout(attach, 2200);
})();


(async function buildAlbumPage(){
  const grid = document.querySelector('[data-album]');
  if(!grid) return;
  const key = grid.getAttribute('data-album');
  const base = `assets/galleries/${key}/`;
  try{
    const res = await fetch(base + 'manifest.json', {cache:'no-store'});
    const manifest = await res.json();
    const list = manifest.grid || [];
    grid.innerHTML = '';
    list.forEach((fn)=>{
      const fig = document.createElement('figure');
      fig.className = 'workItem';
      const img = document.createElement('img');
      img.src = base + fn;
      img.loading='lazy';
      img.alt = key + ' photo';
      fig.appendChild(img);
      grid.appendChild(fig);
    });
    applyMasonryAspect(grid);
    // Set hero background if present
    const hero = document.querySelector(`[data-album-hero="${key}"]`);
    if(hero && manifest.featured){
      hero.style.setProperty('--hero-image', `url('${base + manifest.featured}')`);
      hero.classList.add('heroCinematic');
    }
  }catch(err){
    grid.innerHTML = '<div class="muted">Put images into <b>' + base + '</b> then run <b>python tools/build_album_manifests.py</b>.</div>';
  }
})();
