// =============================================================================
// MooOS v2 — Centralized Notification System (Convention #2)
// =============================================================================
// All user-facing feedback goes through this module.
// Rules: No console.error for user-facing failures. No alert().
// =============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number; // ms, default 4000
}

// ---------------------------------------------------------------------------
// Internal toast renderer
// ---------------------------------------------------------------------------

let toastContainer: HTMLElement | null = null;

function getToastContainer(): HTMLElement {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.id = 'mooos-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
    max-width: 24rem;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.95)',
    border: '1px solid rgba(5, 150, 105, 0.6)',
    icon: '✅',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.95)',
    border: '1px solid rgba(220, 38, 38, 0.6)',
    icon: '❌',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.95)',
    border: '1px solid rgba(217, 119, 6, 0.6)',
    icon: '⚠️',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.95)',
    border: '1px solid rgba(37, 99, 235, 0.6)',
    icon: 'ℹ️',
  },
};

function showToast(message: string, type: ToastType, options?: ToastOptions) {
  const container = getToastContainer();
  const style = TOAST_STYLES[type];
  const duration = options?.duration ?? 4000;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${style.bg};
    border: ${style.border};
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
    pointer-events: auto;
    cursor: pointer;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
  `;
  toast.textContent = `${style.icon} ${message}`;

  toast.addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Auto dismiss
  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast: HTMLElement) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  setTimeout(() => toast.remove(), 300);
}

// ---------------------------------------------------------------------------
// Public API — import these in components
// ---------------------------------------------------------------------------

export function toastSuccess(message: string, options?: ToastOptions) {
  showToast(message, 'success', options);
}

export function toastError(message: string, options?: ToastOptions) {
  showToast(message, 'error', options);
}

export function toastWarning(message: string, options?: ToastOptions) {
  showToast(message, 'warning', options);
}

export function toastInfo(message: string, options?: ToastOptions) {
  showToast(message, 'info', options);
}
