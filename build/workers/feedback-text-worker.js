self.addEventListener('message', function (event) {
    var _a = event.data, canvasWidth = _a.canvasWidth, canvasHeight = _a.canvasHeight, gap = _a.gap, pixels = _a.pixels;
    var particles = [];
    for (var y = 0; y < canvasHeight; y += gap) {
        for (var x = 0; x < canvasWidth; x += gap) {
            var index = (y * canvasWidth + x) * 4;
            var alpha = pixels[index + 3];
            if (alpha > 0) {
                var red = pixels[index];
                var green = pixels[index + 1];
                var blue = pixels[index + 2];
                var color = "rgb(".concat(red, ",").concat(green, ",").concat(blue, ")");
                particles.push({ x: x, y: y, color: color });
            }
        }
    }
    self.postMessage(particles);
});