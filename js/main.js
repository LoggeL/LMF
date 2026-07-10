(() => {
  'use strict'

  document.documentElement.classList.add('js')

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const state = {
    projects: [],
    filter: 'all',
    limit: 9,
    batchSize: 9,
    activeProjectTrigger: null,
  }

  let revealObserver = null

  document.addEventListener('DOMContentLoaded', () => {
    initTheme()
    initMobileMenu()
    initHeader()
    initSectionSpy()
    initRevealObserver()
    initMeaningCycle()
    initProfileCycle()
    initProjectDialog()
    initProjectControls()
    setCurrentYear()
    Promise.allSettled([loadProjects(), loadPartners(), loadSocialLinks()]).then(syncInitialHashPosition)
  })

  function initTheme() {
    const toggle = document.getElementById('theme-toggle')
    const label = toggle?.querySelector('.theme-toggle__label')
    const themeMeta = document.querySelector('meta[name="theme-color"]')

    let storedTheme = null
    try {
      storedTheme = localStorage.getItem('lmf-theme')
    } catch (error) {
      console.warn('Theme preference could not be read.', error)
    }

    const applyTheme = (theme) => {
      const nextTheme = theme === 'light' ? 'light' : 'dark'
      document.documentElement.dataset.theme = nextTheme

      if (toggle) {
        const upcomingTheme = nextTheme === 'dark' ? 'light' : 'dark'
        toggle.setAttribute('aria-label', `Switch to ${upcomingTheme} theme`)
        if (label) label.textContent = upcomingTheme
      }

      if (themeMeta) {
        themeMeta.setAttribute('content', nextTheme === 'dark' ? '#0a0a0b' : '#f4f0e8')
      }
    }

    applyTheme(storedTheme || 'dark')

    toggle?.addEventListener('click', () => {
      const currentTheme = document.documentElement.dataset.theme
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      applyTheme(nextTheme)

      try {
        localStorage.setItem('lmf-theme', nextTheme)
      } catch (error) {
        console.warn('Theme preference could not be saved.', error)
      }
    })
  }

  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle')
    const nav = document.querySelector('.site-nav')
    const links = document.querySelectorAll('.nav-links a')

    if (!toggle || !nav) return

    const closeMenu = () => {
      toggle.classList.remove('active')
      nav.classList.remove('active')
      toggle.setAttribute('aria-expanded', 'false')
      toggle.setAttribute('aria-label', 'Open navigation')
      document.body.classList.remove('menu-open')
    }

    const openMenu = () => {
      toggle.classList.add('active')
      nav.classList.add('active')
      toggle.setAttribute('aria-expanded', 'true')
      toggle.setAttribute('aria-label', 'Close navigation')
      document.body.classList.add('menu-open')
    }

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true'
      if (isOpen) closeMenu()
      else openMenu()
    })

    links.forEach((link) => link.addEventListener('click', closeMenu))

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu()
    })

    window.addEventListener('resize', () => {
      if (window.innerWidth > 928) closeMenu()
    })
  }

  function initHeader() {
    const header = document.getElementById('site-header')
    if (!header) return

    const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 24)
    window.addEventListener('scroll', updateHeader, { passive: true })
    updateHeader()
  }

  function initSectionSpy() {
    if (!('IntersectionObserver' in window)) return

    const links = Array.from(document.querySelectorAll('.nav-links a[data-section]'))
    const sections = links
      .map((link) => document.getElementById(link.dataset.section))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visible) return

        links.forEach((link) => {
          link.classList.toggle('active', link.dataset.section === visible.target.id)
        })
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: [0, 0.15, 0.4] }
    )

    sections.forEach((section) => observer.observe(section))
  }

  function initRevealObserver() {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'))
      return
    }

    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.08 }
    )

    registerReveals()
  }

  function registerReveals(scope = document) {
    const elements = scope.querySelectorAll('.reveal:not([data-reveal-ready])')

    elements.forEach((element) => {
      element.dataset.revealReady = 'true'
      if (prefersReducedMotion || !revealObserver) {
        element.classList.add('is-visible')
      } else {
        revealObserver.observe(element)
      }
    })
  }

  function initMeaningCycle() {
    const target = document.getElementById('lmf-meaning')
    if (!target || prefersReducedMotion) return

    const meanings = [
      'Logge Media Forge',
      "Let's Make Fun",
      'Lights, Motion, Film',
      'Learning Machines & Frames',
      'Lovingly Made Films',
      'Logic Meets Flair',
    ]
    let index = 0

    window.setInterval(() => {
      target.classList.add('is-switching')
      window.setTimeout(() => {
        index = (index + 1) % meanings.length
        target.textContent = meanings[index]
        target.classList.remove('is-switching')
      }, 160)
    }, 3200)
  }

  function initProfileCycle() {
    const images = Array.from(document.querySelectorAll('.profile-image'))
    if (images.length < 2 || prefersReducedMotion) return

    let currentIndex = 0
    let timer = null

    const showNextImage = () => {
      images[currentIndex].classList.remove('active')
      currentIndex = (currentIndex + 1) % images.length
      images[currentIndex].classList.add('active')
    }

    const startCycle = () => {
      if (!timer) timer = window.setInterval(showNextImage, 4800)
    }

    const stopCycle = () => {
      window.clearInterval(timer)
      timer = null
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCycle()
      else startCycle()
    })

    startCycle()
  }

  async function fetchJson(path) {
    const response = await fetch(path)
    if (!response.ok) throw new Error(`${path} returned ${response.status}`)
    return response.json()
  }

  async function loadProjects() {
    const container = document.getElementById('projects-container')
    if (!container) return

    try {
      const projects = await fetchJson('data/projects.json')
      state.projects = Array.isArray(projects)
        ? projects.slice().sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
        : []
      renderProjects(container)
      updateProjectTotal()
    } catch (error) {
      console.error('Error loading projects:', error)
      container.innerHTML = '<p class="loading-note">The project archive could not be loaded.</p>'
      const count = document.getElementById('project-count')
      if (count) count.textContent = 'Archive unavailable'
    }
  }

  function renderProjects(container) {
    if (!state.projects.length) {
      container.innerHTML = '<p class="loading-note">No projects found.</p>'
      return
    }

    container.innerHTML = state.projects.map(createProjectCard).join('')
    container.addEventListener('click', handleProjectClick)
    applyProjectView()
    registerReveals(container)
  }

  function createProjectCard(project, index) {
    const number = String(index + 1).padStart(2, '0')
    const tags = Array.isArray(project.tags) ? project.tags : []
    const tagMarkup = tags
      .slice(0, 3)
      .map((tag) => `<span class="project-tag">${escapeHtml(tag)}</span>`)
      .join('')
    const picturePath = escapeAttribute(getProjectPictureBase(project))
    const title = escapeHtml(project.title || 'Untitled project')
    const category = escapeHtml(project.category || 'Project')
    const description = escapeHtml(project.description || '')
    const projectId = escapeAttribute(project.id || String(index))
    const wrapperClass = project.archived ? 'project-card__static' : 'project-card__trigger'
    const wrapperOpen = project.archived
      ? `<div class="${wrapperClass}" aria-label="${title}, archived project">`
      : `<button class="${wrapperClass}" type="button" data-project-id="${projectId}" aria-label="View ${title}">`
    const wrapperClose = project.archived ? '</div>' : '</button>'

    return `
      <article class="project-card reveal${project.featured ? ' featured' : ''}${project.archived ? ' archived' : ''}" data-project-id="${projectId}" style="--reveal-delay: ${(index % 3) * 55}ms">
        ${wrapperOpen}
          <div class="project-card__media">
            <picture>
              <source srcset="${picturePath}.avif" type="image/avif">
              <source srcset="${picturePath}.webp" type="image/webp">
              <img src="${picturePath}.jpg" alt="${title}" loading="${index < 3 ? 'eager' : 'lazy'}" width="1200" height="750">
            </picture>
            <span class="project-card__number">${number} / ${String(state.projects.length).padStart(2, '0')}</span>
            ${project.featured ? '<span class="featured-badge">Featured</span>' : ''}
            ${project.archived ? '<span class="archived-badge">Archived</span>' : ''}
          </div>
          <div class="project-card__content">
            <div class="project-card__meta"><span>${category}</span><span>LMF / ${number}</span></div>
            <h3>${title}</h3>
            <p class="project-card__description">${description}</p>
            <div class="project-card__footer">
              <div class="project-tags">${tagMarkup}</div>
              <span class="project-card__open">${project.archived ? 'Filed' : 'View ↗'}</span>
            </div>
          </div>
        ${wrapperClose}
      </article>`
  }

  function initProjectControls() {
    const buttons = document.querySelectorAll('.filter-btn')
    const loadMore = document.getElementById('load-more')

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter || 'all'
        state.limit = state.batchSize

        buttons.forEach((candidate) => {
          const isActive = candidate === button
          candidate.classList.toggle('active', isActive)
          candidate.setAttribute('aria-pressed', String(isActive))
        })

        applyProjectView()
      })
    })

    loadMore?.addEventListener('click', () => {
      state.limit += state.batchSize
      applyProjectView()
    })
  }

  function getProjectGroups(project) {
    const haystack = [project.category, ...(project.tags || [])].join(' ').toLowerCase()
    const groups = new Set()

    if (/game|multiplayer|sudoku|canvas/.test(haystack)) groups.add('games')
    if (/movie|aftermovie|film|video|cinematic|vfx|editing/.test(haystack)) groups.add('film')
    if (/website|web|app|tool|data|dashboard|pwa|visualization|typescript|react|nextjs|astro/.test(haystack)) groups.add('web')
    if (/\bai\b|\bml\b|llm|agent|gemini|model|rag|transcription/.test(haystack)) groups.add('ai')
    if (!groups.size) groups.add('web')

    return groups
  }

  function projectMatchesFilter(project) {
    return state.filter === 'all' || getProjectGroups(project).has(state.filter)
  }

  function applyProjectView() {
    if (!state.projects.length) return

    const container = document.getElementById('projects-container')
    const count = document.getElementById('project-count')
    const loadMore = document.getElementById('load-more')
    if (!container) return

    const filteredProjects = state.projects.filter(projectMatchesFilter)
    const visibleProjects = filteredProjects.slice(0, state.limit)
    const visibleIds = new Set(visibleProjects.map((project) => String(project.id)))
    const cards = Array.from(container.querySelectorAll('.project-card'))

    cards.forEach((card) => {
      card.hidden = !visibleIds.has(card.dataset.projectId)
      card.classList.remove('project-card--lead')
    })

    const visibleCards = cards.filter((card) => !card.hidden)
    visibleCards[0]?.classList.add('project-card--lead')
    visibleCards.forEach((card) => {
      if (!card.dataset.revealReady) registerReveals(card.parentElement || container)
    })

    if (count) {
      const suffix = state.filter === 'all' ? 'projects' : `${state.filter} projects`
      count.textContent = `Showing ${visibleProjects.length} / ${filteredProjects.length} ${suffix}`
    }

    if (loadMore) loadMore.hidden = visibleProjects.length >= filteredProjects.length
  }

  function updateProjectTotal() {
    document.querySelectorAll('[data-project-count]').forEach((element) => {
      element.textContent = String(state.projects.length).padStart(2, '0')
    })
  }

  function handleProjectClick(event) {
    const trigger = event.target.closest('.project-card__trigger')
    if (!trigger) return

    const project = state.projects.find((item) => String(item.id) === trigger.dataset.projectId)
    if (!project) return

    state.activeProjectTrigger = trigger
    openProjectDialog(project)
  }

  function initProjectDialog() {
    const dialog = document.getElementById('project-modal')
    const closeButton = dialog?.querySelector('.close-modal')
    if (!dialog || !closeButton) return

    const closeDialog = () => {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }

    closeButton.addEventListener('click', closeDialog)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog()
    })
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open')
      state.activeProjectTrigger?.focus({ preventScroll: true })
    })
    dialog.addEventListener('cancel', () => {
      document.body.classList.remove('modal-open')
    })
  }

  function openProjectDialog(project) {
    const dialog = document.getElementById('project-modal')
    const image = document.getElementById('modal-image')
    const title = document.getElementById('modal-title')
    const category = document.getElementById('modal-category')
    const description = document.getElementById('modal-description')
    const tags = document.getElementById('modal-tags')
    const link = document.getElementById('modal-link')
    const index = document.getElementById('modal-index')

    if (!dialog || !image || !title || !category || !description || !tags || !link || !index) return

    const projectIndex = state.projects.findIndex((item) => item.id === project.id) + 1
    image.src = `${getProjectPictureBase(project)}.jpg`
    image.alt = project.title
    title.textContent = project.title
    category.textContent = project.category
    description.textContent = project.description
    index.textContent = String(projectIndex).padStart(2, '0')
    tags.innerHTML = (project.tags || [])
      .map((tag) => `<span class="project-tag">${escapeHtml(tag)}</span>`)
      .join('')
    link.href = project.link

    document.body.classList.add('modal-open')
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
  }

  async function loadPartners() {
    const container = document.getElementById('partners-container')
    if (!container) return

    try {
      const partners = await fetchJson('data/partners.json')
      const visiblePartners = partners.filter((partner) => !partner.archived)
      container.innerHTML = visiblePartners.map(createPartnerCard).join('')
      registerReveals(container)
    } catch (error) {
      console.error('Error loading partners:', error)
      container.innerHTML = '<p class="loading-note">The partner network could not be loaded.</p>'
    }
  }

  function createPartnerCard(partner, index) {
    const title = escapeHtml(partner.title || 'Partner')
    const media = partner.video
      ? `<video autoplay loop muted playsinline preload="metadata" aria-label="${title} logo animation"><source src="${escapeAttribute(partner.video)}" type="video/webm"></video>`
      : `<img src="${escapeAttribute(partner.image || '')}" alt="${title} logo" loading="lazy">`

    return `
      <article class="partner-card reveal" style="--reveal-delay: ${(index % 4) * 60}ms">
        <span class="partner-card__index">${String(index + 1).padStart(2, '0')} / Partner</span>
        <div class="partner-logo">${media}</div>
        <h3>${title}</h3>
        <p>${escapeHtml(partner.description || '')}</p>
        <a class="partner-link" href="${escapeAttribute(partner.link || '#')}" target="_blank" rel="noopener noreferrer">Visit partner <span aria-hidden="true">↗</span></a>
      </article>`
  }

  async function loadSocialLinks() {
    const container = document.getElementById('connect-links-container')
    if (!container) return

    try {
      const socials = await fetchJson('data/socials.json')
      container.innerHTML = socials.map(createSocialLink).join('')
      registerReveals(container)
    } catch (error) {
      console.error('Error loading social links:', error)
      container.innerHTML = '<p class="loading-note">The contact channels could not be loaded.</p>'
    }
  }

  function createSocialLink(social, index) {
    const titleParts = String(social.title || 'Contact').split(' - ')
    const platform = titleParts.shift() || 'Contact'
    const handle = titleParts.join(' - ') || 'Open channel'
    const href = escapeAttribute(social.link || '#')
    const externalAttributes = href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''

    return `
      <a class="social-link reveal" href="${href}"${externalAttributes} aria-label="Open ${escapeAttribute(social.title || platform)}" style="--reveal-delay: ${(index % 4) * 60}ms">
        <div class="social-link__top"><span>${String(index + 1).padStart(2, '0')} / Channel</span><span class="social-link__arrow" aria-hidden="true">↗</span></div>
        <div class="social-link__bottom">
          <div><h3>${escapeHtml(platform)}</h3><p>${escapeHtml(handle)}</p></div>
        </div>
      </a>`
  }

  function getProjectPictureBase(project) {
    const rawPath = String(project.picture || '')
    const filename = rawPath.split('/').pop()
    return `assets/img/${filename}`
  }

  function setCurrentYear() {
    const year = document.getElementById('current-year')
    if (year) year.textContent = new Date().getFullYear()
  }

  function syncInitialHashPosition() {
    if (!window.location.hash) return

    const target = document.querySelector(window.location.hash)
    if (!target) return

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#096;')
  }
})()
