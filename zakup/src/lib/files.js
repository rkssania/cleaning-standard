// Подготовка файла-подтверждения (фото или документ) для хранения в общей таблице.
// Документ базы не больше 256 КиБ, поэтому фото сжимаются, а большие PDF не принимаются.
const MAX_CHARS = 230000; // длина строки data:, чтобы уложиться в лимит документа

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Не удалось прочитать файл'));
    r.readAsDataURL(blob);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось открыть фото'));
    img.src = url;
  });
}

export async function prepareFile(file) {
  const base = { name: file.name || 'файл', mime: file.type || '' };
  if (/^image\//.test(file.type)) {
    const img = await loadImage(await readAsDataUrl(file));
    let scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    for (let attempt = 0; attempt < 8; attempt++) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      for (const q of [0.72, 0.6, 0.5, 0.4]) {
        const data = c.toDataURL('image/jpeg', q);
        if (data.length <= MAX_CHARS) return { ...base, mime: 'image/jpeg', data, size: Math.round(data.length * 0.75) };
      }
      scale *= 0.75;
    }
    throw new Error('Фото слишком большое. Сделайте снимок поменьше.');
  }
  const data = await readAsDataUrl(file);
  if (data.length > MAX_CHARS) throw new Error('Документ больше 170 КБ. Прикрепите фото или файл поменьше.');
  return { ...base, data, size: file.size };
}
