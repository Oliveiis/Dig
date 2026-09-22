import { useState } from 'react';
import type { DemoPlace } from './data';
import photoData from './photos.json';

export interface ShopImage {
  src: string;
  source: string;
  credit: string;
  license: string;
  alt: string;
  position?: string;
}
export const SHOP_PHOTOS = photoData as Record<string, ShopImage>;

export function ShopPhoto({ place, hero = false }: { place: DemoPlace; hero?: boolean }) {
  const photo = SHOP_PHOTOS[place.id];
  const [failedSource, setFailedSource] = useState('');
  const available = photo && failedSource !== photo.src;
  return <span className={`shop-photo food-${place.food} ${hero ? 'shop-photo-hero' : ''} ${available ? 'has-photo' : 'no-photo'}`}>
    {available
      ? <img src={photo.src} alt={photo.alt} style={{ objectPosition: photo.position }} width={hero ? 400 : 80} height={hero ? 240 : 80} loading={hero ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSource(photo.src)} />
      : <span className="photo-placeholder"><span aria-hidden="true">{place.emoji}</span><small>{photo ? '照片載入失敗' : '待補實拍'}</small></span>}
    {available && <span className="photo-cuisine" aria-label={place.subcategory}>{place.emoji}</span>}
  </span>;
}
