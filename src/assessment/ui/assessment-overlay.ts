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
    overlay.innerHTML = '';

    children.forEach((child) => {
      overlay.appendChild(child);
    });

    overlay.style.display = 'block';
  }

  public close(): void {
    const overlay = document.getElementById(this.overlayId);
    if (!overlay) {
      return;
    }

    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }
}
