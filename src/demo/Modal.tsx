import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({title,children,onClose,half=false}:{title:string;children:ReactNode;onClose:()=>void;half?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const node=ref.current;node?.showModal();return()=>node?.close();},[]);
 return <dialog ref={ref} className={`demo-dialog ${half?'half':''}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}>
  <div className="sheet-handle"/><header className="sheet-heading"><h2>{title}</h2><button className="round-button" aria-label="關閉" onClick={onClose}><X size={19}/></button></header>{children}
 </dialog>;
}
