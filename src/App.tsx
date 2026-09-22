import { lazy, Suspense } from 'react';
import DemoApp from './demo/DemoApp';
const LiveApp=lazy(()=>import('./LiveApp'));
export default function App(){
 return new URLSearchParams(window.location.search).get('mode')==='live'
  ? <Suspense fallback={<div>正在載入…</div>}><LiveApp/></Suspense>
  : <DemoApp/>;
}
