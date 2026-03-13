/**
 * Abu Abed Box - Accessibility Utilities V1
 * Focus trap, modal management, bidi helpers, reduced motion
 */

const A11y = {
  // Track active focus traps
  _activeTrap: null,
  _previousFocus: null,

  // ═══════════════════════════════════════════════════════════
  // FOCUS TRAP - for modals, pickers, overlays
  // ═══════════════════════════════════════════════════════════

  /**
   * Trap focus within a modal element.
   * @param {HTMLElement} modalEl - The modal container
   * @param {Object} opts - { onClose: Function }
   * @returns {Function} cleanup - call to release the trap
   */
  trapFocus(modalEl, opts) {
    if (!modalEl) return () => {};
    const onClose = opts && opts.onClose;

    // Save the element that triggered the modal
    this._previousFocus = document.activeElement;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    function getFocusable() {
      return Array.from(modalEl.querySelectorAll(focusableSelector))
        .filter(function(el) { return el.offsetParent !== null; });
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      var focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    modalEl.addEventListener('keydown', onKeyDown);

    // Set initial focus to first focusable element
    var focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      modalEl.setAttribute('tabindex', '-1');
      modalEl.focus();
    }

    var prevFocus = this._previousFocus;
    var released = false;

    // Cleanup function
    return function release() {
      if (released) return;
      released = true;
      modalEl.removeEventListener('keydown', onKeyDown);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        prevFocus.focus();
      }
    };
  },

  // ═══════════════════════════════════════════════════════════
  // MODAL MANAGER - open/close with a11y
  // ═══════════════════════════════════════════════════════════

  _modalCleanups: {},

  openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var self = this;
    this._modalCleanups[modalId] = this.trapFocus(modal, {
      onClose: function() { self.closeModal(modalId); }
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  },

  closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('hidden');

    if (this._modalCleanups[modalId]) {
      this._modalCleanups[modalId]();
      delete this._modalCleanups[modalId];
    }

    // Restore body scroll
    document.body.style.overflow = '';
  },

  // ═══════════════════════════════════════════════════════════
  // SCREEN READER ANNOUNCEMENTS
  // ═══════════════════════════════════════════════════════════

  /**
   * Announce a message to screen readers.
   * @param {string} message - The text to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority) {
    var elId = priority === 'assertive' ? 'sr-alerts' : 'sr-announcements';
    var el = document.getElementById(elId);
    if (!el) return;
    // Clear then set to trigger re-announcement
    el.textContent = '';
    setTimeout(function() { el.textContent = message; }, 50);
  },

  /**
   * Announce game phase change
   */
  announcePhase(phaseName, details) {
    var msg = phaseName;
    if (details) msg += ' - ' + details;
    this.announce(msg, 'polite');
  },

  /**
   * Announce score update
   */
  announceScore(playerName, score) {
    this.announce(playerName + ': ' + score + ' نقطة', 'polite');
  },

  /**
   * Announce timer warning
   */
  announceTimer(seconds) {
    if (seconds <= 5) {
      this.announce(seconds + ' ثواني متبقية', 'assertive');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // BIDI TEXT HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Wrap a string in bdi for safe bidi isolation.
   * Returns an HTML string: <bdi dir="auto">escaped content</bdi>
   */
  bdi(text) {
    if (!text || typeof text !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = text;
    return '<bdi dir="auto">' + div.innerHTML + '</bdi>';
  },

  /**
   * Create a bdi DOM element for safe insertion.
   */
  createBdi(text) {
    var bdi = document.createElement('bdi');
    bdi.setAttribute('dir', 'auto');
    bdi.textContent = text || '';
    return bdi;
  },

  // ═══════════════════════════════════════════════════════════
  // REDUCED MOTION DETECTION
  // ═══════════════════════════════════════════════════════════

  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Listen for reduced motion preference changes
   */
  onMotionPreferenceChange(callback) {
    if (!window.matchMedia) return;
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) {
      mq.addEventListener('change', function(e) { callback(e.matches); });
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SAFE DOM HELPERS (avoid innerHTML for user content)
  // ═══════════════════════════════════════════════════════════

  /**
   * Safely set text content of an element by ID.
   */
  setText(elementId, text) {
    var el = document.getElementById(elementId);
    if (el) el.textContent = text;
  },

  /**
   * Create an element with safe text content.
   */
  createElement(tag, className, textContent) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
  }
};
