/* ==========================================================================
   Postcards from a founder · motion
   GSAP 3 (ScrollTrigger, SplitText, MotionPath) + Lenis.
   Every animation follows the postcard metaphor: mail is sorted and
   cancelled, the card is posted, turned over, stamped, flown and sent.
   Without GSAP, or with reduced motion, the page is complete and static.
   ========================================================================== */
(() => {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    const yearEl = $('[data-year]');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Mobile menu ---------- */
    const toggle = $('.nav-toggle');
    const menu = $('.menu');
    const setMenu = (open) => {
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menu.setAttribute('aria-hidden', String(!open));
        if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
        if (open && hasGSAP && !reduceMotion) {
            gsap.fromTo($$('.menu-links a, .menu-call', menu), { y: 40, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: .6, stagger: .06, delay: .15, ease: 'power3.out' });
        }
    };
    toggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    /* ---------- Postcards: tap to turn over (touch) ---------- */
    $$('.pc-flip').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        btn.closest('.pc').classList.toggle('is-flipped');
    }));
    $$('.pc:not(.pc-wip)').forEach(card => card.addEventListener('click', e => {
        if (finePointer || e.target.closest('a')) return;
        card.classList.toggle('is-flipped');
    }));

    initForm();

    const loader = $('.loader');
    if (!hasGSAP || reduceMotion) {
        loader?.remove();
        staticNav();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const hasSplit = typeof window.SplitText !== 'undefined';
    const hasPath = typeof window.MotionPathPlugin !== 'undefined';
    if (hasSplit) gsap.registerPlugin(SplitText);
    if (hasPath) gsap.registerPlugin(MotionPathPlugin);
    const fontsReady = document.fonts?.ready
        ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))])
        : Promise.resolve();

    /* ---------- Smooth scroll ---------- */
    let lenis = null;
    if (typeof window.Lenis !== 'undefined') {
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        window.__lenis = lenis;
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.stop();
    }

    const mm = gsap.matchMedia();
    let heroST = null;   // desktop turn-over trigger, used by the "Note" link

    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        let dest = id === '#home' ? 0 : $(id);
        if (dest === null) return;
        e.preventDefault();
        if (id === '#about' && heroST) dest = heroST.end;          // land on the turned card
        if (lenis) lenis.scrollTo(dest, { duration: 1.4 });
        else if (typeof dest === 'number') scrollTo({ top: dest, behavior: 'smooth' });
        else dest.scrollIntoView({ behavior: 'smooth' });
    }));

    /* ---------- Nav + airmail progress ---------- */
    const nav = $('.nav');
    ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: self => nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 400 && !document.body.classList.contains('menu-open'))
    });
    $$('.nav-links a[href^="#"]').forEach(link => {
        const sec = $(link.getAttribute('href'));
        if (!sec || link.getAttribute('href') === '#about') return;
        ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => link.classList.toggle('is-current', s.isActive) });
    });
    gsap.to('.progress-bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    /* ======================================================================
       1. LOADER: three letters are sorted, then cancelled with a postmark
       ====================================================================== */
    const card3d = $('.card3d');
    const cardIn = innerWidth > 900 ? card3d : $('.front');   // card3d is display:contents on small screens
    const letters = $$('.bl');
    gsap.set(cardIn, { y: 220, rotation: -8, autoAlpha: 0 });
    gsap.set(letters, { yPercent: -140, autoAlpha: 0 });
    gsap.set('.greet span', { yPercent: 60, autoAlpha: 0 });
    gsap.set('.ribbon', { scaleX: 0 });
    gsap.set('.hero-stamp', { scale: 2.6, rotation: -30, autoAlpha: 0 });
    gsap.set('.hero-postmark', { scale: 1.6, autoAlpha: 0 });
    gsap.set('.hero-foot > *', { y: 30, autoAlpha: 0 });
    gsap.set(['.nav', '.turn-hint'], { autoAlpha: 0 });

    const countEl = $('[data-count]');
    const count = { v: 0 };
    let ready = document.readyState === 'complete';
    addEventListener('load', () => { ready = true; }, { once: true });

    gsap.timeline()
        .from('.loader-letter', { y: -260, rotation: () => gsap.utils.random(-30, 30), duration: .7, stagger: .14, ease: 'back.out(1.4)' })
        .from('.loader-mark', { scale: 2.2, autoAlpha: 0, duration: .32, ease: 'power4.in' }, '+=.05')
        .to('.loader-stack', { x: 4, duration: .05, yoyo: true, repeat: 3 })
        .to(count, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = Math.round(count.v); } }, '<')
        .add(() => {
            if (ready) outro();
            else {
                const t = setTimeout(outro, 2500);
                addEventListener('load', () => { clearTimeout(t); outro(); }, { once: true });
            }
        });

    let outroDone = false;
    function outro() {
        if (outroDone) return; outroDone = true;
        gsap.timeline({ onComplete: () => { loader.remove(); lenis?.start(); ScrollTrigger.refresh(); } })
            .to('.loader-letter, .loader-mark', { y: -120, autoAlpha: 0, duration: .4, stagger: .04, ease: 'power2.in' })
            .to(loader, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '-=.15')
            .add(heroIntro(), '-=.45');
    }
    setTimeout(() => { if (!outroDone) outro(); }, 7000);

    /* ======================================================================
       2. HERO: the card is posted onto the page, letters printed, stamped
       ====================================================================== */
    function heroIntro() {
        return gsap.timeline()
            .to(cardIn, { y: 0, rotation: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out' })
            .to('.greet span', { yPercent: 0, autoAlpha: 1, duration: .6, stagger: .1, ease: 'back.out(2)' }, .3)
            .to(letters, { yPercent: 0, autoAlpha: 1, duration: .55, stagger: .07, ease: 'bounce.out' }, .45)
            .to('.ribbon', { scaleX: 1, duration: .6, ease: 'expo.out' }, 1.05)
            .to('.hero-stamp', { scale: 1, rotation: 6, autoAlpha: 1, duration: .35, ease: 'power4.in' }, 1.2)
            .to('.hero-postmark', { scale: 1, autoAlpha: .8, duration: .28, ease: 'power4.in' }, 1.5)
            .fromTo(cardIn, { x: -5 }, { x: 0, duration: .45, ease: 'elastic.out(1.2, .25)' }, 1.55)
            .fromTo('.hero-postmark .wave', { strokeDasharray: 140, strokeDashoffset: 140 }, { strokeDashoffset: 0, duration: .6, stagger: .05 }, 1.62)
            .to('.hero-foot > *', { y: 0, autoAlpha: 1, duration: .7, stagger: .1, ease: 'power3.out' }, 1.3)
            .to(['.nav', '.turn-hint'], { autoAlpha: 1, duration: .5 }, 1.6);
    }

    // Slow rotating print rays and the plane on its dotted route
    gsap.to('.rays', { rotation: 360, duration: 160, repeat: -1, ease: 'none' });
    if (hasPath && innerWidth > 600) {
        gsap.set('.plane', { visibility: 'visible' });
        gsap.to('.plane', {
            duration: 14, repeat: -1, ease: 'none', delay: 2.4,
            motionPath: { path: '#flightPath', align: '#flightPath', autoRotate: true, alignOrigin: [.5, .5] }
        });
        gsap.from('.flight path', { strokeDashoffset: 600, duration: 3, ease: 'power2.out', delay: 1.8 });
    }

    // Pointer: the card tilts like it's held, the pattern inside letters shifts
    if (finePointer) {
        const rx = gsap.quickTo('.card-stage', 'rotationX', { duration: .8, ease: 'power3' });
        const ry = gsap.quickTo('.card-stage', 'rotationY', { duration: .8, ease: 'power3' });
        $('.hero').addEventListener('pointermove', e => {
            if (!outroDone) return;
            const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
            rx(-ny * 6); ry(nx * 8);
            letters.forEach((l, i) => l.style.setProperty('--bx', `${50 + nx * 70 + (i - 2.5) * 5}%`));
        });
        $('.hero').addEventListener('pointerleave', () => { rx(0); ry(0); });
    }

    /* ---------- Desktop: scroll turns the postcard over ---------- */
    const sigPath = $('.signature path');
    const sigLen = sigPath ? sigPath.getTotalLength() : 0;
    if (sigPath) gsap.set(sigPath, { strokeDasharray: sigLen });
    gsap.set('.card-stage', { transformPerspective: 1600 });
    mm.add('(min-width: 901px)', () => {
        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: '+=130%', pin: true, scrub: .8, anticipatePin: 1 }
        });
        heroST = tl.scrollTrigger;
        tl.to(['.hero-foot', '.turn-hint'], { y: 40, autoAlpha: 0, duration: .15 }, 0)
          .to(card3d, { scale: .9, duration: .25, ease: 'power1.out' }, .05)
          .to(card3d, { rotationY: 180, duration: .5, ease: 'power2.inOut' }, .1)
          .to(card3d, { scale: 1, duration: .25, ease: 'power1.in' }, .35)
          .to('.rays', { scale: 1.25, duration: .6 }, 0)
          .fromTo('.signature path', { strokeDashoffset: () => sigLen }, { strokeDashoffset: 0, duration: .3 }, .62)
          .from('.back-postmark', { scale: 1.8, autoAlpha: 0, duration: .06, ease: 'power4.in' }, .6)
          .from('.back .stamp', { scale: 2, rotation: -20, autoAlpha: 0, duration: .06, ease: 'power4.in' }, .64)
          .to({}, { duration: .12 });
        return () => { heroST = null; };
    });
    mm.add('(max-width: 900px)', () => {
        gsap.fromTo(sigPath, { strokeDashoffset: sigLen }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.signature', start: 'top 90%', end: 'top 60%', scrub: .6 } });
        gsap.from('.back', { y: 80, rotation: 3, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.back', start: 'top 85%' } });
    });

    /* ======================================================================
       3. MARQUEE reacts to scroll speed and direction
       ====================================================================== */
    const loop = gsap.to('.marquee-track', { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
    let idle;
    ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: self => {
            const v = gsap.utils.clamp(-5, 5, self.getVelocity() / 350);
            gsap.to(loop, { timeScale: v || 1, duration: .25, overwrite: true });
            clearTimeout(idle);
            idle = setTimeout(() => gsap.to(loop, { timeScale: self.direction === -1 ? -1 : 1, duration: .6 }), 140);
        }
    });

    /* ======================================================================
       4. PROCESS: six tickets are torn off the book, one per scroll step
       ====================================================================== */
    gsap.from('.tk', {
        yPercent: -30, rotationX: -90, transformPerspective: 600, autoAlpha: 0, ease: 'power2.out', stagger: .5,
        scrollTrigger: { trigger: '.tickets', start: 'top 80%', end: 'top 35%', scrub: .6 }
    });

    /* ======================================================================
       5. TRACK RECORD: red route draws, plane flies it, passports are stamped
       ====================================================================== */
    gsap.timeline({ scrollTrigger: { trigger: '.route', start: 'top 60%', end: 'bottom 60%', scrub: .5 } })
        .to('.route-fill', { scaleY: 1, ease: 'none' }, 0)
        .to('.route-plane', { top: '100%', ease: 'none' }, 0);
    $$('.stop').forEach(stop => {
        const ticket = $('.ticket', stop), pass = $('.passport', stop);
        const finalRot = gsap.getProperty(pass, 'rotation');
        gsap.timeline({ scrollTrigger: { trigger: stop, start: 'top 72%' } })
            .from(ticket, { y: 50, autoAlpha: 0, duration: .7, ease: 'power3.out' })
            .fromTo(pass, { scale: 2.4, rotation: finalRot - 25, autoAlpha: 0 }, { scale: 1, rotation: finalRot, autoAlpha: 1, duration: .28, ease: 'power4.in' }, '-=.2')
            .to(ticket, { y: 5, duration: .06, yoyo: true, repeat: 1, ease: 'power1.inOut' });
    });

    /* ======================================================================
       6. PRODUCTS: a rack of postcards slides past (desktop, pinned)
       ====================================================================== */
    mm.add('(min-width: 901px)', () => {
        const track = $('.work-track');
        const distance = () => Math.max(0, track.scrollWidth - innerWidth);
        const slide = gsap.to(track, {
            x: () => -distance(), ease: 'none',                      // must be linear for containerAnimation
            scrollTrigger: { trigger: '.work-pin', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
        });
        $$('.pc', track).forEach(pc => {
            gsap.fromTo(pc, { y: 70, rotation: 7 }, {
                y: 0, rotation: 0, ease: 'power2.out',
                scrollTrigger: { trigger: pc, containerAnimation: slide, start: 'left 105%', end: 'left 60%', scrub: true }
            });
        });
    });
    mm.add('(max-width: 900px)', () => {
        $$('.pc').forEach((pc, i) => gsap.from(pc, {
            y: 80, rotation: i % 2 ? 5 : -5, autoAlpha: 0, duration: .9, ease: 'expo.out',
            scrollTrigger: { trigger: pc, start: 'top 88%' }
        }));
    });

    /* ======================================================================
       7. STACK: stamps are licked and stuck onto each sheet
       ====================================================================== */
    gsap.set('.skill', { autoAlpha: 0 });
    ScrollTrigger.batch('.sheet', {
        start: 'top 82%', once: true,
        onEnter: sheets => sheets.forEach((sheet, i) => {
            gsap.fromTo($$('.skill', sheet), { scale: 1.8, y: -30, autoAlpha: 0 }, {
                scale: 1, y: 0, autoAlpha: 1, duration: .32, ease: 'power4.in', stagger: .09, delay: i * .15,
                clearProps: 'transform'
            });
        })
    });

    /* ======================================================================
       8. FOOTER: "wish you were here" waves like handwriting on a card
       ====================================================================== */
    fontsReady.then(() => {
        if (hasSplit) {
            $$('.wave-line').forEach((line, idx) => {
                const s = SplitText.create(line, { type: 'chars' });
                gsap.from(s.chars, {
                    yPercent: 110, rotation: () => gsap.utils.random(-25, 25), autoAlpha: 0, duration: .9, stagger: .035, delay: idx * .2,
                    ease: 'back.out(1.8)', scrollTrigger: { trigger: '.footer', start: 'top 70%' }
                });
                s.chars.forEach((c, i) => gsap.to(c, { y: -8, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 + i * .07 }));
            });
        }
        ScrollTrigger.refresh();
    });

    /* ====================================================================== */
    function staticNav() {
        let lastY = 0;
        const navEl = $('.nav'), bar = $('.progress-bar');
        addEventListener('scroll', () => {
            const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
            navEl.classList.toggle('is-hidden', y > lastY && y > 400);
            lastY = y;
            if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        }, { passive: true });
    }

    function initForm() {
        const form = $('#contactForm');
        if (!form) return;
        const status = $('.form-status', form);
        const btn = $('button[type="submit"]', form);
        const btnText = $('.btn-text', form);
        const required = $$('[required]', form);
        const validate = el => {
            const v = el.value.trim();
            const ok = !!v && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
            el.classList.toggle('error', !ok);
            return ok;
        };
        required.forEach(el => el.addEventListener('input', () => el.classList.contains('error') && validate(el)));

        form.addEventListener('submit', async e => {
            e.preventDefault();
            if (!required.map(validate).every(Boolean)) {
                status.className = 'form-status err';
                status.textContent = 'Add your message, name and a valid email, then post it again.';
                if (hasGSAP && !reduceMotion) gsap.fromTo(form, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1.2, .25)' });
                return;
            }
            btn.disabled = true;
            btnText.textContent = 'Posting…';
            status.className = 'form-status';
            status.textContent = '';
            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                });
                const result = await res.json();
                if (!res.ok || !result.success) throw new Error(result.message || 'The message was not accepted.');
                await sentAnimation(form);
                form.reset();
                status.className = 'form-status ok';
                status.textContent = "Posted. I'll reply to your email soon.";
            } catch (err) {
                status.className = 'form-status err';
                status.textContent = err && err.message && err.message !== 'Failed to fetch'
                    ? err.message
                    : 'Could not reach the mail server. Email me at uppunuthula.rohith@gmail.com instead.';
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Post it';
            }
        });
    }

    function sentAnimation(form) {
        if (!hasGSAP || reduceMotion) return Promise.resolve();
        const mark = $('.sent-mark', form);
        return new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(form, { rotation: -4, scale: .95, duration: .25, ease: 'power2.out' })
                .to(form, { x: () => innerWidth, y: -200, rotation: 18, duration: .7, ease: 'power3.in' })
                .set(form, { x: () => -innerWidth * .5, y: 80, rotation: -8 })
                .to(form, { x: 0, y: 0, rotation: 0, scale: 1, duration: .9, ease: 'expo.out' })
                .fromTo(mark, { autoAlpha: 0, scale: 2.2, rotation: -40 }, { autoAlpha: .9, scale: 1, rotation: -14, duration: .3, ease: 'power4.in' })
                .to(mark, { autoAlpha: 0, duration: .5, delay: 1.6 });
        });
    }
})();
