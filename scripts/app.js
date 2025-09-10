

const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const result = document.getElementById('result');
const downloadBtn = document.getElementById('downloadBtn');
const info = document.getElementById('info');
const manualInputForm = document.getElementById('manualInputForm');
const manualLocation = document.getElementById('manualLocation');
const manualLatitude = document.getElementById('manualLatitude');
const manualLongitude = document.getElementById('manualLongitude');
const applyManualInput = document.getElementById('applyManualInput');
const manualDate = document.getElementById('manualDate');
const manualTime = document.getElementById('manualTime');
const textPosition = document.getElementById('textPosition');
const fontColor = document.getElementById('fontColor');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const mapPosition = document.getElementById('mapPosition');

function toDecimal(coord, ref) {
  const degrees = coord[0].numerator / coord[0].denominator;
  const minutes = coord[1].numerator / coord[1].denominator;
  const seconds = coord[2].numerator / coord[2].denominator;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") decimal *= -1;
  return decimal;
}

async function getLocation(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  return data.display_name || "Location not available";
}


let currentImage = null;
let currentImageDataUrl = null;
let manualMode = false;

function showManualForm(show) {
  manualInputForm.classList.toggle('hidden', !show);
}

upload.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  manualMode = false;
  showManualForm(false);
  info.innerHTML = '';
  downloadBtn.style.display = "none";

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = async function () {
      currentImage = img;
      currentImageDataUrl = e.target.result;
      EXIF.getData(img, async function () {
        const date = EXIF.getTag(this, "DateTimeOriginal") || "Date not available";
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef");

        let locationText = "Location not available";
        let latitudeText = "Latitude: tidak tersedia";
        let longitudeText = "Longitude: tidak tersedia";
        let latitude = null, longitude = null;

        if (lat && lon && latRef && lonRef) {
          latitude = toDecimal(lat, latRef);
          longitude = toDecimal(lon, lonRef);
          locationText = await getLocation(latitude, longitude);
          latitudeText = `Latitude: ${latitude.toFixed(6)}`;
          longitudeText = `Longitude: ${longitude.toFixed(6)}`;
        }

        // Jika metadata tidak ada, tampilkan form input manual
        if (!(lat && lon && latRef && lonRef) || date === "Date not available") {
          showManualForm(true);
          manualMode = true;
          info.innerHTML = `<span class='text-yellow-700'>Meta data tidak ditemukan. Silakan input manual di bawah.</span>`;
          return;
        }

        info.innerHTML = `
          <strong>Timestamp:</strong> ${date}<br>
          <strong>${latitudeText}</strong><br>
          <strong>${longitudeText}</strong>
        `;

        drawToCanvas({
          date,
          locationText,
          latitude,
          longitude
        });
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Fungsi untuk menggambar ke canvas (bisa dipakai ulang untuk manual)


function wrapTextLines(ctx, text, maxWidth) {
  // Membagi string panjang menjadi array baris sesuai maxWidth
  const words = text.split(' ');
  let lines = [], line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}


async function drawToCanvas({date, locationText, latitude, longitude}) {
  if (!currentImage) return;
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(currentImage, 0, 0);

  // Ambil preferensi user
  const pos = textPosition.value || 'bottom-left';
  const color = fontColor.value || '#ffe600';
  const fontSize = fontSizeSlider ? parseInt(fontSizeSlider.value, 10) : Math.max(24, Math.round(canvas.height * 0.035));
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  // Siapkan teks multi-baris, wrap jika terlalu panjang
  let lines = [];
  let latlonText = "Latitude: tidak tersedia, Longitude: tidak tersedia";
  if (latitude !== null && longitude !== null) {
    latlonText = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
  }
  const maxTextWidth = canvas.width * 0.5;
  lines = lines.concat(wrapTextLines(ctx, latlonText, maxTextWidth));
  lines = lines.concat(wrapTextLines(ctx, date, maxTextWidth));
  lines = lines.concat(wrapTextLines(ctx, locationText, maxTextWidth));

  // Hitung tinggi total
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const padding = 24;
  let x = padding, y = padding;

  // Posisi teks
  switch (pos) {
    case 'top-left':
      x = padding;
      y = padding;
      ctx.textAlign = 'left';
      break;
    case 'top-right':
      x = canvas.width - padding;
      y = padding;
      ctx.textAlign = 'right';
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - totalHeight - padding;
      ctx.textAlign = 'left';
      break;
    case 'bottom-right':
      x = canvas.width - padding;
      y = canvas.height - totalHeight - padding;
      ctx.textAlign = 'right';
      break;
    case 'center':
      x = canvas.width / 2;
      y = (canvas.height - totalHeight) / 2;
      ctx.textAlign = 'center';
      break;
    default:
      x = padding;
      y = canvas.height - totalHeight - padding;
      ctx.textAlign = 'left';
  }

  // Mini map
  const mapPos = mapPosition ? mapPosition.value : 'none';
  let mapImg = null;
  let mapSize = Math.round(Math.min(canvas.width, canvas.height) * 0.22); // 22% sisi terpendek
  if (latitude !== null && longitude !== null && mapPos !== 'none') {
    // OSM Static Map
    const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=${mapSize}x${mapSize}&markers=${latitude},${longitude},red-pushpin`;
    mapImg = await new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = mapUrl;
    });
    if (mapImg) {
      let mx = 0, my = 0;
      switch (mapPos) {
        case 'top-left':
          mx = padding;
          my = padding;
          break;
        case 'top-right':
          mx = canvas.width - mapSize - padding;
          my = padding;
          break;
        case 'bottom-left':
          mx = padding;
          my = canvas.height - mapSize - padding;
          break;
        case 'bottom-right':
          mx = canvas.width - mapSize - padding;
          my = canvas.height - mapSize - padding;
          break;
      }
      // Border putih
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(mx-2, my-2, mapSize+4, mapSize+4);
      ctx.drawImage(mapImg, mx, my, mapSize, mapSize);
      ctx.restore();
    }
  }

  // Background semi transparan agar teks lebih rapi/terbaca
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#222';
  let bgWidth = maxTextWidth + 24;
  let bgX = x - (ctx.textAlign === 'center' ? bgWidth/2 : 12);
  ctx.fillRect(bgX, y - 8, bgWidth, totalHeight + 16);
  ctx.restore();

  // Tulis tiap baris
  ctx.fillStyle = color;
  ctx.globalAlpha = 1;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight, maxTextWidth);
  }

  const dataURL = canvas.toDataURL("image/jpeg");
  result.src = dataURL;
  downloadBtn.href = dataURL;
  downloadBtn.style.display = "inline-block";
}


// Data terakhir yang digunakan untuk overlay (untuk update posisi/warna tanpa upload ulang)
let lastOverlayData = null;

// Event tombol apply manual input
applyManualInput.addEventListener('click', function() {
  if (!manualMode || !currentImage) return;
  // Ambil tanggal dan waktu manual jika diisi, jika tidak pakai waktu sekarang
  let dateStr = '';
  if (manualDate.value && manualTime.value) {
    dateStr = manualDate.value.split('-').reverse().join('-') + ' ' + manualTime.value;
  } else if (manualDate.value) {
    dateStr = manualDate.value.split('-').reverse().join('-');
  } else {
    dateStr = new Date().toLocaleString('id-ID');
  }
  const date = dateStr;
  const locationText = manualLocation.value || 'Lokasi manual';
  const latitude = manualLatitude.value ? parseFloat(manualLatitude.value) : null;
  const longitude = manualLongitude.value ? parseFloat(manualLongitude.value) : null;

  let latitudeText = latitude !== null ? `Latitude: ${latitude.toFixed(6)}` : 'Latitude: tidak tersedia';
  let longitudeText = longitude !== null ? `Longitude: ${longitude.toFixed(6)}` : 'Longitude: tidak tersedia';

  info.innerHTML = `
    <strong>Timestamp:</strong> ${date}<br>
    <strong>${latitudeText}</strong><br>
    <strong>${longitudeText}</strong>
    <br><span class='text-yellow-700'>Data manual digunakan.</span>
  `;

  lastOverlayData = {
    date,
    locationText,
    latitude,
    longitude
  };
  drawToCanvas(lastOverlayData);
  showManualForm(false);
});

// Simpan data overlay terakhir setiap kali drawToCanvas dipanggil
const _drawToCanvas = drawToCanvas;
drawToCanvas = function(data) {
  lastOverlayData = data;
  _drawToCanvas(data);
}

// Update hasil foto jika user mengubah posisi/warna font/ukuran font/letak map
textPosition.addEventListener('change', function() {
  if (lastOverlayData && currentImage) drawToCanvas(lastOverlayData);
});
fontColor.addEventListener('input', function() {
  if (lastOverlayData && currentImage) drawToCanvas(lastOverlayData);
});
if (fontSizeSlider) {
  fontSizeSlider.addEventListener('input', function() {
    fontSizeValue.textContent = fontSizeSlider.value + 'px';
    if (lastOverlayData && currentImage) drawToCanvas(lastOverlayData);
  });
}
if (mapPosition) {
  mapPosition.addEventListener('change', function() {
    if (lastOverlayData && currentImage) drawToCanvas(lastOverlayData);
  });
}

/**
 * Membagi teks menjadi beberapa baris agar tidak melebihi maxWidth
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

/**
 * Contoh penggunaan saat menggambar overlay di canvas
 */
function drawOverlayText(ctx, text, position, fontSize, fontFamily, fontColor, canvasWidth, canvasHeight) {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'top';

  // Padding dari tepi gambar
  const padding = 16;
  const maxWidth = canvasWidth - 2 * padding;
  const lineHeight = fontSize * 1.3;

  // Tentukan posisi X dan Y awal sesuai pilihan user
  let x = padding, y = padding;
  if (position.includes('bottom')) y = canvasHeight - padding - lineHeight; // akan disesuaikan di bawah
  if (position.includes('center')) x = canvasWidth / 2;
}

/**
 * Ketika menggambar teks di canvas, gunakan pengaturan ini:
 */
function getTextSettings() {
  const position = document.getElementById('textPosition').value;
  const showTimestamp = document.getElementById('showTimestamp').value === 'yes';
  const timestampFormat = document.getElementById('timestampFormat').value;
  let fontFamily = document.getElementById('fontFamily').value;
  if (fontFamily === 'custom') fontFamily = document.getElementById('customFont').value || 'Arial';
  const fontSize = parseInt(document.getElementById('fontSize').value, 10) || 22;
  let fontColor = document.getElementById('fontColor').value;
  if (fontColor === 'custom') fontColor = document.getElementById('customColor').value || '#000000';
  return { position, showTimestamp, timestampFormat, fontFamily, fontSize, fontColor };
}

document.getElementById('fontFamily').addEventListener('change', function() {
  document.getElementById('customFont').classList.toggle('hidden', this.value !== 'custom');
});
document.getElementById('fontColor').addEventListener('change', function() {
  document.getElementById('customColor').classList.toggle('hidden', this.value !== 'custom');
});