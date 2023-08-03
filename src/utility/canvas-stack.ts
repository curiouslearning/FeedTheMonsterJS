export var CanvasStack;

class Layer {
  id: any;
  cElem: any;
  dragObjects: [];
  constructor({
    canvasID,
    canvasElement,
  }: {
    canvasID: any;
    canvasElement: any;
  }) {
    this.id = canvasID;
    this.cElem = canvasElement;
    this.dragObjects = [];
  }
}

CanvasStack = class {
  cId: any;
  stackLimit: any;
  bkgCanvas: any;
  rawWidth: number;
  rawHeight: number;
  constructor(cvsID: string, stackLimit: number) {
    const savThis = this;
    this.cId = cvsID;
    this.stackLimit = stackLimit || 12;
    this.bkgCanvas = <HTMLElement>document.getElementById(cvsID);
    this.rawWidth = this.bkgCanvas.offsetWidth;
    this.rawHeight = this.bkgCanvas.offsetHeight;
    this.bkgCanvas.resizeFns = [];

    if (!this.bkgCanvas.hasOwnProperty("layers")) {
      this.bkgCanvas.layers = [];
      let bkgL = new Layer({
        canvasID: this.cId,
        canvasElement: this.bkgCanvas,
      }); // bkgCanvas is always layer[0]
      this.bkgCanvas.layers[0] = bkgL;
    }
    if (!this.bkgCanvas.hasOwnProperty("unique")) {
      this.bkgCanvas.unique = 0;
    }
  }

  createLayer(height: string, width: string, layerId: any) {
    console.log(this.isLayerExist(layerId), " canvasisrendering2 ", layerId);
    if (!this.isLayerExist(layerId) && this.isLayerExist(layerId) != undefined) {
      const w = width + "px",
        h = height + "px",
        nLyrs = this.bkgCanvas.layers.length; // bkg is layer 0 so at least 1
      if (!(this.bkgCanvas && this.bkgCanvas.layers)) {
        return;
      }
      if (this.bkgCanvas.layers.length >= this.stackLimit) {
        console.error("CanvasStack: too many layers");
        return;
      }
      this.bkgCanvas.unique += 1; // a private static variable
      const ovlId = layerId;
      const ovlHTML =
        "<canvas id='" +
        ovlId +
        "' style='position:absolute' width='" +
        w +
        "' height='" +
        h +
        "'></canvas>";
      const topCvs = this.bkgCanvas.layers[nLyrs - 1].cElem;
      topCvs.insertAdjacentHTML("afterend", ovlHTML);
      const newCvs = document.getElementById(ovlId);
      newCvs.style.backgroundColor;// no sense
      newCvs.style.left = "50%";
      newCvs.style.transform = "translate(-50%, 0%)";
      newCvs.style.height = h;
      newCvs.style.width = w;
      let newL = new Layer({ canvasID: ovlId, canvasElement: newCvs });
      // save the ID in an array to facilitate removal
      this.bkgCanvas.layers.push(newL);
      return ovlId; // return the new canvas id
    }
    return layerId;
  }

  deleteLayer(ovlyId: any) {
    // check background canvas is still there
    if (!(this.bkgCanvas && this.bkgCanvas.layers)) {
      return;
    }
    for (let i = 1; i < this.bkgCanvas.layers.length; i++) {
      if (this.bkgCanvas.layers[i].id === ovlyId) {
        let ovlNode = this.bkgCanvas.layers[i].cElem;
        if (ovlNode) {
          ovlNode.parentNode.removeChild(ovlNode);
        }
        // now delete layers array element
        this.bkgCanvas.layers.splice(i, 1); // delete the Layer object
      }
    }
  }

  deleteAllLayers() {
    if (!(this.bkgCanvas && this.bkgCanvas.layers)) {
      return;
    }
    for (let i = this.bkgCanvas.layers.length - 1; i > 0; i--) {
      let ovlNode = this.bkgCanvas.layers[i].cElem;
      if (ovlNode) {
        let orphan = ovlNode.parentNode.removeChild(ovlNode);
        orphan = null;
      }
      // now delete layers array element
      this.bkgCanvas.layers.splice(i, 1);
    }
    // clear any resize callbacks, the layers are gone
    this.bkgCanvas.resizeFns.length = 0; // remove any added handlers, leave the basic
  }
  isLayerExist(layerID?: any) {
    console.log("isLayerExist : ", this.bkgCanvas.layers);
    for (let i = 1; i < this.bkgCanvas.layers.length; i++) {
      if (this.bkgCanvas.layers[i].id === layerID) {
        return true;
      } else {
        return false;
      }
    }
  }
};
