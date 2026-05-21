const sharp = require('sharp');
const path = require('path');

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Background circle with gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1565C0"/>
      <stop offset="100%" style="stop-color:#0D47A1"/>
    </linearGradient>
    <linearGradient id="truck" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF"/>
      <stop offset="100%" style="stop-color:#E3F2FD"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>

  <!-- Road / ground line -->
  <rect x="100" y="730" width="824" height="18" rx="9" fill="#1976D2" opacity="0.5"/>

  <!-- Delivery truck body -->
  <rect x="120" y="480" width="520" height="250" rx="24" fill="url(#truck)"/>

  <!-- Truck cab -->
  <rect x="640" y="540" width="240" height="190" rx="24" fill="#E3F2FD"/>

  <!-- Cab window -->
  <rect x="665" y="562" width="190" height="110" rx="14" fill="#4FC3F7" opacity="0.85"/>

  <!-- Driver silhouette in window -->
  <!-- Head -->
  <circle cx="770" cy="590" r="28" fill="#1565C0"/>
  <!-- Body -->
  <ellipse cx="770" cy="645" rx="32" ry="26" fill="#1565C0"/>

  <!-- Truck windshield stripes -->
  <line x1="665" y1="600" x2="855" y2="600" stroke="#B3E5FC" stroke-width="4" opacity="0.5"/>

  <!-- Cargo box details -->
  <rect x="140" y="500" width="480" height="210" rx="16" fill="none" stroke="#BBDEFB" stroke-width="6"/>
  <!-- Cargo door line -->
  <line x1="390" y1="500" x2="390" y2="710" stroke="#BBDEFB" stroke-width="5"/>
  <!-- Cargo handle -->
  <rect x="370" y="596" width="40" height="14" rx="7" fill="#90CAF9"/>

  <!-- Logo/text on cargo -->
  <rect x="175" y="560" width="185" height="100" rx="12" fill="#1565C0" opacity="0.25"/>
  <text x="268" y="618" font-family="Arial, sans-serif" font-size="52" font-weight="900"
        text-anchor="middle" fill="#1565C0" opacity="0.7">CAL</text>

  <!-- Wheels -->
  <!-- Front wheel -->
  <circle cx="750" cy="745" r="72" fill="#263238"/>
  <circle cx="750" cy="745" r="44" fill="#37474F"/>
  <circle cx="750" cy="745" r="20" fill="#B0BEC5"/>
  <!-- Rear wheel -->
  <circle cx="280" cy="745" r="72" fill="#263238"/>
  <circle cx="280" cy="745" r="44" fill="#37474F"/>
  <circle cx="280" cy="745" r="20" fill="#B0BEC5"/>
  <!-- Middle rear wheel -->
  <circle cx="460" cy="745" r="72" fill="#263238"/>
  <circle cx="460" cy="745" r="44" fill="#37474F"/>
  <circle cx="460" cy="745" r="20" fill="#B0BEC5"/>

  <!-- Bumper -->
  <rect x="870" y="670" width="40" height="70" rx="10" fill="#90CAF9"/>

  <!-- Headlight -->
  <rect x="875" y="580" width="30" height="60" rx="8" fill="#FFF176"/>

  <!-- Truck undercarriage -->
  <rect x="120" y="700" width="780" height="30" rx="10" fill="#BBDEFB" opacity="0.4"/>

  <!-- Speed lines (motion effect) -->
  <line x1="30" y1="580" x2="110" y2="580" stroke="#4FC3F7" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <line x1="30" y1="620" x2="95" y2="620" stroke="#4FC3F7" stroke-width="6" stroke-linecap="round" opacity="0.4"/>
  <line x1="30" y1="656" x2="80" y2="656" stroke="#4FC3F7" stroke-width="5" stroke-linecap="round" opacity="0.3"/>

  <!-- Calendar icon on top -->
  <rect x="390" y="160" width="244" height="244" rx="36" fill="#FFFFFF" opacity="0.15"/>
  <rect x="406" y="176" width="212" height="212" rx="28" fill="#FFFFFF"/>
  <!-- Calendar header -->
  <rect x="406" y="176" width="212" height="58" rx="28" fill="#1976D2"/>
  <rect x="406" y="204" width="212" height="30" fill="#1976D2"/>
  <!-- Calendar grid dots -->
  <circle cx="452" cy="294" r="10" fill="#1565C0"/>
  <circle cx="512" cy="294" r="10" fill="#1565C0"/>
  <circle cx="572" cy="294" r="10" fill="#1565C0"/>
  <circle cx="452" cy="340" r="10" fill="#1565C0"/>
  <circle cx="512" cy="340" r="14" fill="#FF6F00"/>
  <circle cx="572" cy="340" r="10" fill="#1565C0"/>
  <circle cx="452" cy="360" r="0" fill="#1565C0"/>
  <!-- Calendar rings -->
  <rect x="452" y="162" width="18" height="42" rx="9" fill="#90CAF9"/>
  <rect x="554" y="162" width="18" height="42" rx="9" fill="#90CAF9"/>
</svg>
`;

const svgAdaptive = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="truck2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF"/>
      <stop offset="100%" style="stop-color:#E3F2FD"/>
    </linearGradient>
  </defs>

  <!-- Delivery truck body -->
  <rect x="60" y="450" width="520" height="250" rx="24" fill="url(#truck2)"/>

  <!-- Truck cab -->
  <rect x="580" y="510" width="240" height="190" rx="24" fill="#E3F2FD"/>

  <!-- Cab window -->
  <rect x="605" y="532" width="190" height="110" rx="14" fill="#4FC3F7" opacity="0.85"/>

  <!-- Driver silhouette -->
  <circle cx="710" cy="560" r="28" fill="#1565C0"/>
  <ellipse cx="710" cy="615" rx="32" ry="26" fill="#1565C0"/>

  <!-- Cargo details -->
  <rect x="80" y="470" width="480" height="210" rx="16" fill="none" stroke="#BBDEFB" stroke-width="6"/>
  <line x1="330" y1="470" x2="330" y2="680" stroke="#BBDEFB" stroke-width="5"/>
  <rect x="310" y="566" width="40" height="14" rx="7" fill="#90CAF9"/>

  <!-- Wheels -->
  <circle cx="690" cy="715" r="72" fill="#263238"/>
  <circle cx="690" cy="715" r="44" fill="#37474F"/>
  <circle cx="690" cy="715" r="20" fill="#B0BEC5"/>
  <circle cx="220" cy="715" r="72" fill="#263238"/>
  <circle cx="220" cy="715" r="44" fill="#37474F"/>
  <circle cx="220" cy="715" r="20" fill="#B0BEC5"/>
  <circle cx="400" cy="715" r="72" fill="#263238"/>
  <circle cx="400" cy="715" r="44" fill="#37474F"/>
  <circle cx="400" cy="715" r="20" fill="#B0BEC5"/>

  <!-- Bumper/headlight -->
  <rect x="810" y="640" width="40" height="70" rx="10" fill="#90CAF9"/>
  <rect x="815" y="550" width="30" height="60" rx="8" fill="#FFF176"/>

  <!-- Speed lines -->
  <line x1="10" y1="550" x2="50" y2="550" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="0.7"/>
  <line x1="10" y1="590" x2="40" y2="590" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.5"/>

  <!-- Calendar icon top center -->
  <rect x="370" y="130" width="244" height="244" rx="36" fill="#FFFFFF" opacity="0.2"/>
  <rect x="386" y="146" width="212" height="212" rx="28" fill="#FFFFFF"/>
  <rect x="386" y="146" width="212" height="58" rx="28" fill="#1976D2"/>
  <rect x="386" y="174" width="212" height="30" fill="#1976D2"/>
  <circle cx="432" cy="264" r="10" fill="#1565C0"/>
  <circle cx="492" cy="264" r="10" fill="#1565C0"/>
  <circle cx="552" cy="264" r="10" fill="#1565C0"/>
  <circle cx="432" cy="310" r="10" fill="#1565C0"/>
  <circle cx="492" cy="310" r="14" fill="#FF6F00"/>
  <circle cx="552" cy="310" r="10" fill="#1565C0"/>
  <rect x="432" y="132" width="18" height="42" rx="9" fill="#90CAF9"/>
  <rect x="534" y="132" width="18" height="42" rx="9" fill="#90CAF9"/>
</svg>
`;

async function generate() {
  const assetsDir = path.join(__dirname, 'assets');

  // icon.png — 1024x1024 (with background)
  await sharp(Buffer.from(svgIcon))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png');

  // adaptive-icon.png — 1024x1024 foreground (transparent bg for adaptive)
  await sharp(Buffer.from(svgAdaptive))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // splash-icon.png — same as icon but smaller centered on white
  await sharp(Buffer.from(svgIcon))
    .resize(200, 200)
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ splash-icon.png');

  // favicon.png
  await sharp(Buffer.from(svgIcon))
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
