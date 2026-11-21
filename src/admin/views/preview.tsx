// Preview of the draft at several screen sizes: the real page (/admin/apercu/, the same components as
// the public site, with its animations) in a frame of the exact width and height, scaled to fit.
import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../ui';

const DEVICES = [
  { id: 'telephone', label: 'Téléphone', w: 390, h: 844 },
  { id: 'petit', label: 'Petit téléphone', w: 320, h: 568 },
  { id: 'tablette', label: 'Tablette portrait', w: 820, h: 1180 },
  { id: 'paysage', label: 'Tablette paysage', w: 1180, h: 820 },
  { id: 'ordinateur', label: 'Ordinateur', w: 1440, h: 900 },
  { id: 'large', label: 'Grand écran', w: 1920, h: 1080 },
] as const;

export function PreviewView() {
  const { status } = useStore();
  const url = status?.previewUrl ?? '/admin/apercu/';
  const [device, setDevice] = useState<(typeof DEVICES)[number]>(DEVICES[4]);
  const [stamp, setStamp] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const el = box.current;
      if (!el) return;
      setScale(Math.min(1, el.clientWidth / device.w, (innerHeight * 0.78) / device.h));
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [device]);
  return (
    <section class="view view--preview">
      <header class="view__head">
        <h1>Aperçu</h1>
        <div class="view__links">
          <button type="button" class="btn btn--small btn--ghost" onClick={() => setStamp(Date.now())}>
            Recharger
          </button>
          <a class="btn btn--small btn--ghost" href={url} target="_blank" rel="noopener">
            Ouvrir dans un onglet <Icon name="ext" size={14} />
          </a>
        </div>
      </header>
      <p class="lead">Le brouillon tel qu'il sera publié, avec les mêmes composants et les mêmes animations que le site. Les contenus masqués y apparaissent.</p>
      <fieldset class="device-picker">
        <legend class="visually-hidden">Taille d'écran</legend>
        {DEVICES.map((d) => (
          <button type="button" class={`btn btn--small${d.id === device.id ? '' : ' btn--ghost'}`} aria-pressed={d.id === device.id} onClick={() => setDevice(d)}>
            {d.label} <span class="device-picker__size">{d.w}×{d.h}</span>
          </button>
        ))}
      </fieldset>
      <div class="device-stage" ref={box}>
        <div class="device-frame" style={{ width: `${device.w * scale}px`, height: `${device.h * scale}px` }}>
          <iframe
            key={`${device.id}-${stamp}`}
            title={`Aperçu du brouillon, ${device.label} (${device.w}×${device.h})`}
            src={url}
            width={device.w}
            height={device.h}
            style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
          />
        </div>
      </div>
      <p class="hint">
        Limites de la simulation : la largeur et la hauteur sont exactes (les mises en page et les tailles de texte sont celles de l'appareil), mais le cadre reste piloté par la souris : le toucher, la densité de pixels, la barre d'adresse des téléphones et les performances de l'appareil ne sont pas reproduits. Pour une vérification finale, ouvrez l'aperçu sur un vrai téléphone (connecté à l'administration).
      </p>
    </section>
  );
}
