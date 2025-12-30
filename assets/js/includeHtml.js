export async function includeHtml() {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  const fetchHtml = async (path) => {
    try {
      const res = await fetch(path, {cache: 'no-store'});
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    }
  };

  const promises = [];
  if (headerEl) promises.push(fetchHtml('/header.html').then(h => { if (h) headerEl.innerHTML = h; headerEl.classList.add('site-top'); }));
  if (footerEl) promises.push(fetchHtml('/footer.html').then(f => { if (f) footerEl.innerHTML = f; footerEl.classList.add('site-footer'); }));

  await Promise.all(promises);
}
