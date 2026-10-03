// Sayfa boyanmadan önce çalışan küçük script: kayıtlı açık/koyu mod tercihini <html>'e uygular.
// Böylece sayfa yenilendiğinde önce koyu açılıp sonra açığa dönme (yanıp sönme) olmaz.
const script = `(function(){try{
var saved=localStorage.getItem('theme');
var isLight=saved?saved==='light':window.matchMedia('(prefers-color-scheme: light)').matches;
var root=document.documentElement;
root.classList.toggle('light',isLight);
root.classList.toggle('dark',!isLight);
}catch(e){}})();`

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
