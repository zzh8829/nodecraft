
import ImprovedNoise from './ImprovedNoise.js';

const worldWidth = 64;
const worldDepth = 64;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;

/*eslint-disable */
function generateMap() {
  const data = generateHeight(worldWidth, worldDepth);
  const getY = ((x, z) => {
    return (data[x + z * worldWidth] * 0.18) | 0;
  });

  const blocks = {};
  for (let z = 0; z < worldDepth; z++) {
    for (let x = 0; x < worldWidth; x++) {
      const pos = [x - worldHalfWidth, getY(x, z), z - worldHalfDepth];
      blocks[pos] = true;
    }
  }
  return blocks;
}

function generateHeight(width, height) {
  var data = [], perlin = ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;
  for (var j = 0; j < 4; j++) {
    if (j === 0) for (var i = 0; i < size; i++) data[i] = 0;
    for (var i = 0; i < size; i++) {
      var x = i % width, y = (i / width) | 0;
      data[i] += perlin.noise(x / quality, y / quality, z) * quality;
    }
    quality *= 4;
  }
  return data;
}
/*eslint-enable */

export { generateMap }
