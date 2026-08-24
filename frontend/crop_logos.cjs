const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImagePath = 'C:/Users/LENOVO/.gemini/antigravity/brain/a3543fe7-3abf-4bf7-bd7c-bb6c71a0108d/.user_uploaded/media_1787598831255.png';

const publicDir = path.resolve(__dirname, 'public/assets');
const srcDir = path.resolve(__dirname, 'src/assets');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

async function cropLogos() {
  // 1. Light Mode Full Logo (Globe + TrueBalance + tagline)
  await sharp(inputImagePath)
    .extract({ left: 30, top: 40, width: 450, height: 400 })
    .toFile(path.join(publicDir, 'logo_light.png'));

  // 2. Dark Mode Full Logo (Globe + TrueBalance + tagline)
  await sharp(inputImagePath)
    .extract({ left: 520, top: 40, width: 450, height: 400 })
    .toFile(path.join(publicDir, 'logo_dark.png'));

  // 3. Light App Icon (Bottom Left rounded app icon)
  await sharp(inputImagePath)
    .extract({ left: 30, top: 480, width: 160, height: 160 })
    .toFile(path.join(publicDir, 'logo_icon_light.png'));

  // 4. Dark App Icon (Bottom Right rounded app icon)
  await sharp(inputImagePath)
    .extract({ left: 530, top: 480, width: 160, height: 160 })
    .toFile(path.join(publicDir, 'logo_icon_dark.png'));

  // Copy to src/assets
  fs.copyFileSync(path.join(publicDir, 'logo_light.png'), path.join(srcDir, 'logo_light.png'));
  fs.copyFileSync(path.join(publicDir, 'logo_dark.png'), path.join(srcDir, 'logo_dark.png'));
  fs.copyFileSync(path.join(publicDir, 'logo_icon_light.png'), path.join(srcDir, 'logo_icon_light.png'));
  fs.copyFileSync(path.join(publicDir, 'logo_icon_dark.png'), path.join(srcDir, 'logo_icon_dark.png'));

  console.log('SUCCESSFULLY_CROPPED_TRUEBALANCE_LOGOS');
}

cropLogos().catch(console.error);
