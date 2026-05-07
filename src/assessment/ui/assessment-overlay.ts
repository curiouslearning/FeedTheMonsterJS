const VISIBLE_CLASS = 'assessment-overlay--visible';
const FADE_MS = 400;

export class AssessmentOverlay {
  constructor(
    private readonly overlayId: string,
    private readonly parentSelector: string = '.game-scene'
  ) {}

  private getOverlayParent(): HTMLElement {
    return (document.querySelector(this.parentSelector) || document.body) as HTMLElement;
  }

  private applyStyles(overlay: HTMLElement, constrainToParent: boolean): void {
    overlay.style.position = constrainToParent ? 'absolute' : 'fixed';
    overlay.style.inset = '0';
    overlay.style.width = constrainToParent ? '100%' : '100vw';
    overlay.style.height = constrainToParent ? '100%' : '100vh';
    overlay.style.zIndex = '10000';
  }

  public ensure(): HTMLElement {
    let overlay = document.getElementById(this.overlayId);

    const overlayParent = this.getOverlayParent();
    const constrainToParent = overlayParent !== document.body;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = this.overlayId;
      overlay.style.display = 'none';
      overlayParent.appendChild(overlay);
    } else if (overlay.parentElement !== overlayParent) {
      overlayParent.appendChild(overlay);
    }

    this.applyStyles(overlay, constrainToParent);

    return overlay;
  }

  public openWithChildren(children: HTMLElement[]): void {
    const overlay = this.ensure();
    overlay.classList.remove(VISIBLE_CLASS);
    overlay.innerHTML = '';

    children.forEach((child) => {
      overlay.appendChild(child);
    });

    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.classList.add(VISIBLE_CLASS);
    });
  }

  public closeWithTransition(onComplete: () => void): void {
    const overlay = document.getElementById(this.overlayId);
    if (!overlay) {
      onComplete();
      return;
    }

    overlay.classList.remove(VISIBLE_CLASS);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      onComplete();
    };

    // In environments where CSS transitions are inactive (e.g. jsdom), finish immediately.
    const duration = parseFloat(getComputedStyle(overlay).transitionDuration || '0');
    if (!duration) {
      finish();
      return;
    }

    overlay.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, FADE_MS + 50);
  }

  public close(): void {
    const overlay = document.getElementById(this.overlayId);
    if (!overlay) {
      return;
    }

    overlay.classList.remove(VISIBLE_CLASS);
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }
}
