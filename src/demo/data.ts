import data from './places.json';
import type { POI } from '../types/poi';
export type Food = 'coffee' | 'bakery' | 'sweet' | 'chinese' | 'japanese' | 'western' | 'korean' | 'asian' | 'other';
export interface DemoPlace extends POI { food: Food; emoji: string; notes: string[]; priority: number; osmUrl: string; cuisineSource: string }
export const PLACES = data as DemoPlace[];
export const CENTER: [number, number] = [22.2861,114.1386];
export const FOODS: {id: Food; label: string; icon: string; color: string}[] = [
 {id:'coffee',label:'咖啡',icon:'☕',color:'#daf4ef'}, {id:'bakery',label:'烘焙',icon:'🥐',color:'#fff2d5'},
 {id:'chinese',label:'中餐',icon:'🍚',color:'#e2f8de'}, {id:'japanese',label:'日料',icon:'🍣',color:'#fce8ed'},
 {id:'western',label:'西餐',icon:'🍝',color:'#e2f0ff'}, {id:'korean',label:'韓料',icon:'🥘',color:'#ffece2'},
 {id:'sweet',label:'甜點',icon:'🍰',color:'#fbe8f5'}, {id:'asian',label:'東南亞',icon:'🍲',color:'#e9f6d8'},
 {id:'other',label:'其他餐廳',icon:'🍽️',color:'#eef2f5'},
];
export function project(lat: number, lng: number, zoom: number) {
 const s=256*2**zoom, sin=Math.sin(lat*Math.PI/180);
 return {x:(lng+180)/360*s,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*s};
}
export function screenPoint(p: DemoPlace, center: [number,number], zoom: number, width:number, height:number) {
 const a=project(p.coordinates.lat,p.coordinates.lng,zoom), b=project(center[0],center[1],zoom);
 return {x:a.x-b.x+width/2,y:a.y-b.y+height/2};
}
export function groupPlaces(places: DemoPlace[], zoom:number) {
 // Stable representatives; check neighboring positions, not just grid membership.
 const separation=zoom<17?68:50;
 const groups: {point:{x:number;y:number};places:DemoPlace[]}[]=[];
 for(const p of [...places].sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id))) {
  const pt=project(p.coordinates.lat,p.coordinates.lng,zoom);
  const group=groups.find(g=>Math.hypot(pt.x-g.point.x,pt.y-g.point.y)<separation);
  if(group)group.places.push(p);else groups.push({point:pt,places:[p]});
 }
 return groups.map(g=>g.places);
}
