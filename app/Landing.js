'use client'
import { useState } from "react"

export default function Landing() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ fontFamily:"sans-serif", background:"#FAF7F2", minHeight:"100vh" }}>
      <nav style={{ background:"#1C2B4A", padding:"16px 32px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:"#fff", fontWeight:700, fontSize:20 }}>uNick Academy</span>
        <button onClick={() => setOpen(true)} style={{ background:"#C0392B", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontWeight:700, cursor:"pointer" }}>Zapisz się</button>
      </nav>
      <div style={{ maxWidth:700, margin:"80px auto", padding:"0 24px", textAlign:"center" }}>
        <h1 style={{ fontSize:48, fontWeight:800, color:"#1C2B4A", marginBottom:16 }}>Mów po angielsku.<br/><span style={{ color:"#C0392B" }}>Naprawdę.</span></h1>
        <p style={{ fontSize:18, color:"#6b7280", marginBottom:40, lineHeight:1.7 }}>uNick Academy to nie kolejna szkoła językowa. To miejsce, gdzie w końcu zaczniesz mówić. Ponad 10 lat doświadczenia, native speaker i metoda, która działa.</p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => setOpen(true)} style={{ background:"#C0392B", color:"#fff", border:"none", borderRadius:12, padding:"16px 40px", fontWeight:700, fontSize:16, cursor:"pointer" }}>Zapisz się na lekcję próbną</button>
          <a href="mailto:hello@unick-academy.pl" style={{ background:"transparent", color:"#1C2B4A", border:"2px solid #1C2B4A", borderRadius:12, padding:"16px 32px", fontWeight:600, fontSize:16, textDecoration:"none" }}>Napisz do nas</a>
        </div>
        <div style={{ display:"flex", gap:40, justifyContent:"center", marginTop:64 }}>
          {[["10+","lat"],["100+","studentów"],["5★","średnia"],["3","nauczycieli"]].map(([v,l],i) => (
            <div key={i}>
              <div style={{ fontSize:28, fontWeight:800, color:"#1C2B4A" }}>{v}</div>
              <div style={{ fontSize:13, color:"#6b7280" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:440 }}>
            <h2 style={{ color:"#1C2B4A", marginBottom:20 }}>Zapisz się</h2>
            <input placeholder="Imię i nazwisko" style={{ width:"100%", padding:"12px", borderRadius:8, border:"1.5px solid #ddd", marginBottom:12, fontSize:14, boxSizing:"border-box" }} />
            <input placeholder="Email" style={{ width:"100%", padding:"12px", borderRadius:8, border:"1.5px solid #ddd", marginBottom:12, fontSize:14, boxSizing:"border-box" }} />
            <input placeholder="Telefon" style={{ width:"100%", padding:"12px", borderRadius:8, border:"1.5px solid #ddd", marginBottom:20, fontSize:14, boxSizing:"border-box" }} />
            <button style={{ width:"100%", background:"#C0392B", color:"#fff", border:"none", borderRadius:10, padding:"14px", fontWeight:700, fontSize:15, cursor:"pointer" }}>Wyślij</button>
          </div>
        </div>
      )}
    </div>
  )
}
