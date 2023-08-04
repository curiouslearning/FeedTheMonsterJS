self.addEventListener('message', function (event) {
    const { canvasWidth, canvasHeight, gap, pixels } = event.data;
    const particles: { x: number; y: number; color: string }[] = [];
    for (let y = 0; y < canvasHeight; y += gap) {
      for (let x = 0; x < canvasWidth; x += gap) {
        let index = (y * canvasWidth + x) * 4;
        const alpha = pixels[index + 3];
        if (alpha > 0) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const color = `rgb(${red},${green},${blue})`;
          particles.push({ x, y, color });
        }
      }
    }
    self.postMessage(particles);
  });