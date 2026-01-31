const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [192, 512];

// Baby pink #ff9ec9
const bgColor = 'rgb(255, 158, 201)';

async function generateIcons() {
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    const image = PImage.make(size, size);
    const ctx = image.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    
    const filepath = path.join(iconsDir, `icon-${size}.png`);
    await PImage.encodePNGToStream(image, fs.createWriteStream(filepath));
    console.log(`Created ${filepath}`);
  }
}

generateIcons().catch(console.error);
