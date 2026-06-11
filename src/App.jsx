import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════ */
const R    = { sm:"6px", md:"10px", lg:"14px", xl:"18px", full:"9999px" };
const FONT = "'Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
:root{
  --bg:#f7f7f7;--s0:#ffffff;--s1:#f2f2f2;--s2:#e8e8e8;
  --b0:rgba(0,0,0,0.06);--b1:rgba(0,0,0,0.10);--b2:rgba(0,0,0,0.18);
  --t0:#111111;--t1:#444444;--t2:#888888;--t3:#bbbbbb;
  --red:#dc2626;--redbg:#fef2f2;--redborder:#fecaca;
  --amber:#d97706;--amberbg:#fffbeb;--amberborder:#fde68a;
  --green:#059669;--greenbg:#ecfdf5;--greenborder:#a7f3d0;
  --blue:#2563eb;--bluebg:#eff6ff;--blueborder:#bfdbfe;
  --purple:#7c3aed;--purplebg:#f5f3ff;--purpleborder:#ddd6fe;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#0d0d0d;--s0:#191919;--s1:#222222;--s2:#2c2c2c;
  --b0:rgba(255,255,255,0.05);--b1:rgba(255,255,255,0.09);--b2:rgba(255,255,255,0.16);
  --t0:#f5f5f5;--t1:#a0a0a0;--t2:#606060;--t3:#383838;
  --redbg:#2d1212;--redborder:#7f1d1d;
  --amberbg:#292008;--amberborder:#78350f;
  --greenbg:#052e1c;--greenborder:#065f46;
  --bluebg:#0c1a3a;--blueborder:#1e3a8a;
  --purplebg:#1e0a3c;--purpleborder:#4c1d95;
}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
html,body{background:var(--bg);color:var(--t0);font-family:${FONT}}
input,select,textarea{font-family:${FONT};font-size:15px!important;color:var(--t0);background:var(--s0);border:1px solid var(--b1);outline:none;width:100%;border-radius:${R.md};padding:10px 12px;transition:border-color .15s,box-shadow .15s}
input:focus,select:focus,textarea:focus{border-color:var(--b2);box-shadow:0 0 0 3px rgba(0,0,0,0.05)}
textarea{resize:vertical;line-height:1.5}
button{font-family:${FONT};cursor:pointer;border:none}
::-webkit-scrollbar{display:none}
@keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes toast{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

/* ═══════════════════════════════════════════
   EMAILJS  ← Buraya kendi bilgilerinizi girin
═══════════════════════════════════════════ */
const EJS = {
  publicKey:   "YOUR_PUBLIC_KEY",
  serviceId:   "YOUR_SERVICE_ID",
  tplNew:      "template_new_ticket",
  tplDelivery: "template_delivery",
  to:          "admin@pimak.fr",
};

async function loadEJS() {
  if (window.emailjs) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  window.emailjs.init({ publicKey: EJS.publicKey });
}

async function mailNewTicket(t) {
  if (EJS.publicKey === "YOUR_PUBLIC_KEY") return;
  try {
    await loadEJS();
    await window.emailjs.send(EJS.serviceId, EJS.tplNew, {
      to_email: EJS.to, ticket_num: t.numero, client: t.client,
      equipement: t.equipement, panne: t.panne,
      technicien: t.technicien || "Non assigné",
      priorite: t.priorite, date: t.date_ouverture,
    });
  } catch(e) { console.warn("EmailJS:", e); }
}

async function mailDelivery(t) {
  if (EJS.publicKey === "YOUR_PUBLIC_KEY") return;
  try {
    await loadEJS();
    const photoCount = PHOTO_PHASES.reduce((s,p)=>s+(t.photos?.[p.key]?.length||0),0);
    await window.emailjs.send(EJS.serviceId, EJS.tplDelivery, {
      to_email: EJS.to, ticket_num: t.numero, client: t.client,
      equipement: t.equipement, technicien: t.technicien || "—",
      panne: t.panne, travaux: t.commentaires || "—",
      signed_by: t.signedBy, livre_at: fmtDT(t.livreAt),
      photo_count: String(photoCount),
      report_html: buildReportHTML(t),
    });
  } catch(e) { console.warn("EmailJS:", e); }
}

function buildReportHTML(t) {
  const photoSections = PHOTO_PHASES.map(phase => {
    const imgs = t.photos?.[phase.key] || [];
    if (!imgs.length) return "";
    const cells = imgs.map(p =>
      `<td style="padding:0 6px 6px 0;vertical-align:top">
        <img src="${p.src}" style="width:130px;height:100px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;display:block"/>
        <div style="font-size:9px;color:#aaa;margin-top:2px;text-align:center">${p.ts}</div>
      </td>`
    ).join("");
    return `<tr><td colspan="2" style="padding:14px 0 6px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;font-weight:600;margin-bottom:6px">${phase.label}</div>
      <table cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
    </td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
  <body style="font-family:-apple-system,Arial,sans-serif;color:#111;font-size:13px;line-height:1.5;padding:40px;max-width:680px;margin:0 auto">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #111;padding-bottom:18px;margin-bottom:28px">
      <tr>
        <td><div style="font-size:11px;font-weight:700;letter-spacing:3px">PIMAK FRANCE</div><div style="font-size:9px;color:#aaa;letter-spacing:1px;margin-top:2px">SERVICE APRÈS-VENTE</div></td>
        <td style="text-align:right"><div style="font-size:22px;font-weight:700">${t.numero}</div><div style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:600;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0">Livré ✓</div></td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      ${[["Client",t.client],["Téléphone",t.clientPhone||"—"],["Email",t.clientEmail||"—"],["Équipement",t.equipement],["Technicien",t.technicien||"—"],["Priorité",t.priorite],["Ouverture",t.date_ouverture],["Livraison",fmtDT(t.livreAt)]].map(([l,v])=>`<tr><td style="padding:8px 0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;width:130px;border-bottom:1px solid #f5f5f5">${l}</td><td style="padding:8px 0;font-size:13px;border-bottom:1px solid #f5f5f5">${v}</td></tr>`).join("")}
    </table>
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;margin-bottom:6px">Panne</div>
    <div style="background:#fafafa;border-left:3px solid #e5e5e5;border-radius:4px;padding:12px 14px;font-size:13px;color:#555;margin-bottom:18px">${t.panne}</div>
    ${t.commentaires?`<div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;margin-bottom:6px">Travaux effectués</div><div style="background:#fafafa;border-left:3px solid #111;border-radius:4px;padding:12px 14px;font-size:13px;color:#555;margin-bottom:18px">${t.commentaires}</div>`:""}
    ${photoSections?`<div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;margin-bottom:8px">Photos</div><table width="100%" cellpadding="0" cellspacing="0">${photoSections}</table>`:""}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e5e5e5;border-radius:10px">
      <tr><td style="padding:16px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;margin-bottom:10px">Signature — ${t.signedBy||""}</div>
        ${t.signature?`<img src="${t.signature}" style="max-width:200px;border:1px solid #f0f0f0;border-radius:6px;display:block"/>`:`<div style="color:#ccc;font-size:12px">Aucune signature</div>`}
        <div style="font-size:10px;color:#aaa;margin-top:8px">Signé le ${fmtDT(t.signedAt)}</div>
      </td></tr>
    </table>
    <div style="margin-top:28px;padding-top:14px;border-top:1px solid #f0f0f0;font-size:10px;color:#ccc;text-align:center">Pimak France · ${new Date().toLocaleString("fr-FR")}</div>
  </body></html>`;
}

/* ═══════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════ */
const STATUSES = {
  Ouvert:       { label:"Ouvert",      tr:"Açık",       dot:"#dc2626", bg:"var(--redbg)",    border:"var(--redborder)"    },
  "En cours":   { label:"En cours",    tr:"Devam",      dot:"#d97706", bg:"var(--amberbg)",  border:"var(--amberborder)"  },
  "En attente": { label:"En attente",  tr:"Beklemede",  dot:"#7c3aed", bg:"var(--purplebg)", border:"var(--purpleborder)" },
  "Clôturé":    { label:"Clôturé",     tr:"Tamamlandı", dot:"#059669", bg:"var(--greenbg)",  border:"var(--greenborder)"  },
  "Livré":      { label:"Livré",       tr:"Teslim",     dot:"#2563eb", bg:"var(--bluebg)",   border:"var(--blueborder)"   },
};

const PHOTO_PHASES = [
  { key:"reception",  label:"Réception",  tr:"Kabul"    },
  { key:"reparation", label:"Réparation", tr:"Tamir"    },
  { key:"apres",      label:"Après",      tr:"Sonrası"  },
];

const INIT_USERS = [
  { id:"u1", name:"Admin",       email:"admin@pimak.fr",  pin:"1234", role:"admin",      active:true  },
  { id:"u2", name:"Jean-Pierre", email:"jp@pimak.fr",     pin:"2222", role:"technician", active:true  },
  { id:"u3", name:"Sophie",      email:"sophie@pimak.fr", pin:"3333", role:"technician", active:true  },
  { id:"u4", name:"Marc",        email:"marc@pimak.fr",   pin:"4444", role:"technician", active:true  },
  { id:"u5", name:"Ahmed",       email:"ahmed@pimak.fr",  pin:"5555", role:"technician", active:false },
];

const INIT_TICKETS = [
  { id:1,numero:"PI-001",client:"Restaurant Le Marais",  equipement:"Four convection GN 2/1",  panne:"Résistance défectueuse",    technicien:"Jean-Pierre",departement:"SAV",statut:"En cours",  priorite:"Haute",  commentaires:"Pièce commandée J+2", date_ouverture:"2026-05-20",date_cloture:"",          photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  { id:2,numero:"PI-002",client:"Hôtel Lumière Paris",   equipement:"Lave-vaisselle tunnel",    panne:"Fuite joint d'entrée",       technicien:"Sophie",     departement:"SAV",statut:"Ouvert",    priorite:"Haute",  commentaires:"",                    date_ouverture:"2026-05-24",date_cloture:"",          photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  { id:3,numero:"PI-003",client:"Brasserie du Port",     equipement:"Cellule refroidissement", panne:"Compresseur bruyant",        technicien:"Marc",       departement:"SAV",statut:"Livré",     priorite:"Normale",commentaires:"Compresseur remplacé",date_ouverture:"2026-05-15",date_cloture:"2026-05-22",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"M. Dupont",signedAt:"2026-05-22T14:30:00",livreAt:"2026-05-22T14:30:00"},
  { id:4,numero:"PI-004",client:"Café de Flore",         equipement:"Machine à café pro",      panne:"Chauffe-eau HS",             technicien:"Ahmed",      departement:"SAV",statut:"Clôturé",   priorite:"Urgente",commentaires:"Remplacé en urgence", date_ouverture:"2026-05-18",date_cloture:"2026-05-19",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  { id:5,numero:"PI-005",client:"Le Grand Véfour",       equipement:"Friteuse 2×15L",          panne:"Thermostat défaillant",      technicien:"Jean-Pierre",departement:"SAV",statut:"En attente",priorite:"Normale",commentaires:"Attente pièce",       date_ouverture:"2026-05-25",date_cloture:"",          photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
];

let _id = 6;
const uid    = () => Math.random().toString(36).slice(2,8);
const fmtD   = iso => iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
const fmtDT  = iso => iso ? new Date(iso).toLocaleString("fr-FR") : "—";
const toB64  = f => new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});
const totalP = t => PHOTO_PHASES.reduce((s,p)=>s+(t.photos?.[p.key]?.length||0),0);
const EMPTY  = { client:"",clientPhone:"",clientEmail:"",equipement:"",panne:"",technicien:"",departement:"",statut:"Ouvert",priorite:"Normale",commentaires:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:"" };

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function App() {
  const [user,   setUser]   = useState(null);
  const [users,  setUsers]  = useState(INIT_USERS);
  const [tix,    setTix]    = useState(INIT_TICKETS);
  const [view,   setView]   = useState("dashboard");
  const [sel,    setSel]    = useState(null);
  const [sheet,  setSheet]  = useState(null);
  const [toast,  setToast]  = useState(null);
  const [lb,     setLb]     = useState(null);
  const [phase,  setPhase]  = useState("reception");
  const [dname,  setDname]  = useState("");
  const [eUser,  setEUser]  = useState(null);
  const [sending,setSending]= useState(false);

  const say = (msg,err) => { setToast({msg,err}); setTimeout(()=>setToast(null),2800); };
  const closeSheet = () => { setSheet(null); setDname(""); setEUser(null); };
  const isAdmin = user?.role === "admin";
  const isTech  = user?.role === "technician";

  const mut = (id, patch) => {
    const fn = t => {
      if (t.id!==id) return t;
      const u={...t,...patch};
      if (patch.statut==="Clôturé"&&!t.date_cloture) u.date_cloture=new Date().toISOString().split("T")[0];
      return u;
    };
    setTix(p=>p.map(fn));
    setSel(p=>p?.id===id?fn(p):p);
  };

  const addPhotos = async (id,ph,files)=>{
    const arr=await Promise.all(Array.from(files).map(toB64));
    const photos=arr.map(src=>({src,id:uid(),ts:new Date().toLocaleString("fr-FR")}));
    const fn=t=>t.id!==id?t:{...t,photos:{...t.photos,[ph]:[...(t.photos[ph]||[]),...photos]}};
    setTix(p=>p.map(fn)); setSel(p=>p?.id===id?fn(p):p);
    say(`${photos.length} photo(s) ajoutée(s)`);
  };

  const rmPhoto=(id,ph,pid)=>{
    const fn=t=>t.id!==id?t:{...t,photos:{...t.photos,[ph]:t.photos[ph].filter(x=>x.id!==pid)}};
    setTix(p=>p.map(fn)); setSel(p=>p?.id===id?fn(p):p);
  };

  const createTicket = async (form) => {
    const newId=_id++;
    const t={...form,id:newId,numero:`PI-${String(newId).padStart(3,"0")}`,date_ouverture:new Date().toISOString().split("T")[0],date_cloture:""};
    setTix(p=>[t,...p]);
    setSel(t);
    setView("detail");
    setSheet("qr");
    say(`${t.numero} créé`);
    setSending(true);
    await mailNewTicket(t);
    setSending(false);
  };

  const confirmDelivery = async (sig) => {
    const now = new Date().toISOString();
    const updated = {...sel, signature:sig, signedBy:dname, signedAt:now, livreAt:now, statut:"Livré"};
    mut(sel.id,{signature:sig,signedBy:dname,signedAt:now,livreAt:now,statut:"Livré"});
    closeSheet();
    say("Livraison confirmée — envoi mail…");
    setSending(true);
    await mailDelivery(updated);
    setSending(false);
    say("Mail envoyé ✓");
  };

  const printQR = t => {
    const qr=`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(t.numero)}&bgcolor=ffffff&color=111111&margin=12`;
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>${t.numero}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:-apple-system,sans-serif}.c{border:1.5px solid #e5e5e5;border-radius:14px;padding:22px;text-align:center;width:240px}.b{font-size:10px;font-weight:700;letter-spacing:3px;color:#111;margin-bottom:2px}.s{font-size:8px;color:#aaa;letter-spacing:1px;margin-bottom:14px}img{width:156px;height:156px;display:block;margin:0 auto}.n{font-size:19px;font-weight:700;margin:12px 0 3px}.cl{font-size:11px;color:#555}.eq{font-size:10px;color:#aaa;margin-top:2px}.d{font-size:9px;color:#ccc;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body onload="window.print()"><div class="c"><div class="b">PIMAK FRANCE</div><div class="s">SERVICE APRÈS-VENTE</div><img src="${qr}"/><div class="n">${t.numero}</div><div class="cl">${t.client}</div><div class="eq">${t.equipement}</div><div class="d">Ouvert le ${t.date_ouverture}</div></div></body></html>`);
    w.document.close();
  };

  const printBL = t => {
    const w=window.open("","_blank");
    w.document.write(buildReportHTML(t));
    w.document.close();
    setTimeout(()=>w.print(),400);
  };

  const openTicket = t => { setSel(t); setPhase("reception"); setView("detail"); };
  const goBack     = () => { setView("list"); setSel(null); };

  const stats = {
    total:  tix.length,
    ouvert: tix.filter(t=>t.statut==="Ouvert").length,
    cours:  tix.filter(t=>t.statut==="En cours").length,
    urgent: tix.filter(t=>t.priorite==="Urgente"&&t.statut!=="Livré").length,
    livre:  tix.filter(t=>t.statut==="Livré").length,
  };

  const myTix = isTech ? tix.filter(t=>t.technicien===user.name&&t.statut!=="Livré") : [];

  if (!user) return <LoginScreen users={users} onLogin={u=>{setUser(u);setView("dashboard");}}/>;

  const sheetTitle = {qr:"Sticker QR Code",scan:"Scanner",deliver:"Livraison",sig:"Signature",photos:"Photos",newUser:"Nouveau",editUser:"Modifier"}[sheet]||"";

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh",paddingBottom:60,fontFamily:FONT}}>
      <style>{CSS}</style>

      {/* Lightbox */}
      {lb&&<div onClick={()=>setLb(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.96)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fade .2s ease"}}><img src={lb} alt="" style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:10,objectFit:"contain"}}/></div>}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:toast.err?"var(--red)":"var(--t0)",color:"#fff",padding:"9px 18px",borderRadius:R.full,fontSize:12,fontWeight:500,whiteSpace:"nowrap",animation:"toast .2s ease",boxShadow:"0 4px 16px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",gap:7}}>{sending&&<span style={{width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>}{toast.msg}</div>}

      {/* Sheet */}
      {sheet&&(
        <div onClick={e=>{if(e.target===e.currentTarget)closeSheet();}} style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",animation:"fade .2s ease"}}>
          <Sheet title={sheetTitle} onClose={closeSheet}>
            {sheet==="qr"&&sel&&<QRSheet t={sel} onPrint={()=>printQR(sel)}/>}
            {sheet==="scan"&&<ScanSheet tickets={tix} onSelect={t=>{openTicket(t);closeSheet();}}/>}
            {sheet==="deliver"&&sel&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:12,color:"var(--t1)",padding:"10px 12px",background:"var(--s1)",borderRadius:R.md}}>{sel.numero} · {sel.client}</div>
                <FL label="Nom du client"><input value={dname} onChange={e=>setDname(e.target.value)} placeholder="M. Dupont"/></FL>
                <Btn color="green" onClick={()=>{if(dname.trim())setSheet("sig");else say("Nom requis",true);}}>Passer à la signature →</Btn>
              </div>
            )}
            {sheet==="sig"&&<SigCanvas onDone={confirmDelivery} onBack={()=>setSheet("deliver")}/>}
            {sheet==="photos"&&sel&&(
              <div>
                <div style={{display:"flex",gap:4,marginBottom:14}}>
                  {PHOTO_PHASES.map(p=>{
                    const cnt=sel.photos?.[p.key]?.length||0;
                    const act=phase===p.key;
                    return <button key={p.key} onClick={()=>setPhase(p.key)} style={{flex:1,padding:"8px 6px",borderRadius:R.md,border:`1px solid ${act?"var(--b2)":"var(--b0)"}`,background:act?"var(--s0)":"transparent",color:act?"var(--t0)":"var(--t2)",fontSize:11,fontWeight:act?500:400,transition:"all .15s"}}>
                      {p.tr}{cnt>0&&<span style={{marginLeft:4,opacity:.55}}>·{cnt}</span>}
                    </button>;
                  })}
                </div>
                <PhotoZone photos={sel.photos?.[phase]||[]} onAdd={f=>addPhotos(sel.id,phase,f)} onRemove={pid=>rmPhoto(sel.id,phase,pid)} onView={setLb}/>
              </div>
            )}
            {sheet==="newUser"&&isAdmin&&<UserForm onSave={u=>{setUsers(p=>[...p,{...u,id:uid(),active:true}]);closeSheet();say(`${u.name} ajouté`);}}/>}
            {sheet==="editUser"&&eUser&&isAdmin&&<UserForm init={eUser} onSave={u=>{setUsers(p=>p.map(x=>x.id===eUser.id?{...x,...u}:x));closeSheet();say("Modifié");}}/>}
          </Sheet>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"var(--bg)",borderBottom:"1px solid var(--b0)",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {view==="detail"&&<button onClick={goBack} style={{background:"none",border:"none",color:"var(--t1)",fontSize:16,padding:"4px 8px 4px 0",lineHeight:1}}>←</button>}
          <span style={{fontSize:12,fontWeight:600,letterSpacing:"0.1em",color:"var(--t0)"}}>PIMAK</span>
          {view==="detail"&&sel&&<span style={{fontSize:12,color:"var(--t2)"}}>{sel.numero}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {view==="detail"&&sel&&<>
            <StatusPill s={STATUSES[sel.statut]}>{STATUSES[sel.statut]?.label}</StatusPill>
            <MiniBtn onClick={()=>setSheet("qr")}>QR</MiniBtn>
          </>}
          <MiniBtn onClick={()=>setSheet("scan")}>⌖ Scan</MiniBtn>
          <MiniBtn onClick={()=>{setUser(null);setView("dashboard");}}>⏻</MiniBtn>
        </div>
      </header>

      <main style={{maxWidth:560,margin:"0 auto",padding:"14px 12px"}}>

        {/* ── DASHBOARD ── */}
        {view==="dashboard"&&(
          <div style={{animation:"up .2s ease"}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:600,color:"var(--t0)"}}>Bonjour, {user.name}</div>
              <div style={{fontSize:12,color:"var(--t2)",marginTop:3}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
            </div>

            {/* Stat grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
              {[
                {label:"En cours",   value:stats.cours,  dot:"#d97706"},
                {label:"Ouverts",    value:stats.ouvert, dot:"#dc2626"},
                {label:"Livrés",     value:stats.livre,  dot:"#2563eb"},
                {label:"Total",      value:stats.total,  dot:"var(--t2)"},
              ].map(s=>(
                <div key={s.label} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:s.dot,display:"inline-block"}}/>
                    <span style={{fontSize:10,color:"var(--t2)",fontWeight:500,letterSpacing:"0.03em"}}>{s.label}</span>
                  </div>
                  <div style={{fontSize:28,fontWeight:600,color:"var(--t0)",lineHeight:1}}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Urgent banner */}
            {stats.urgent>0&&(
              <div onClick={()=>setView("list")} style={{background:"var(--redbg)",border:"1px solid var(--redborder)",borderRadius:R.lg,padding:"12px 14px",marginBottom:10,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:500,color:"var(--red)"}}>{stats.urgent} ticket{stats.urgent>1?"s":""} urgent{stats.urgent>1?"s":""}</div>
                <span style={{color:"var(--red)",fontSize:12}}>→</span>
              </div>
            )}

            {/* My tickets */}
            {isTech&&myTix.length>0&&<>
              <SL>Mes interventions</SL>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {myTix.slice(0,3).map(t=><TRow key={t.id} t={t} onSel={openTicket} np={totalP(t)}/>)}
              </div>
            </>}

            {/* Recent (admin) */}
            {isAdmin&&<>
              <SL>Récents</SL>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {tix.filter(t=>t.statut!=="Livré").slice(0,4).map(t=><TRow key={t.id} t={t} onSel={openTicket} np={totalP(t)}/>)}
              </div>
              {tix.filter(t=>t.statut!=="Livré").length>4&&<button onClick={()=>setView("list")} style={{width:"100%",marginTop:8,padding:"9px",borderRadius:R.md,border:"1px solid var(--b0)",background:"none",color:"var(--t1)",fontSize:11,cursor:"pointer"}}>Voir tout ({tix.filter(t=>t.statut!=="Livré").length}) →</button>}
            </>}
          </div>
        )}

        {/* ── LIST ── */}
        {view==="list"&&<TicketList tickets={isTech?tix.filter(t=>t.technicien===user.name):tix} onSel={openTicket}/>}

        {/* ── NEW ── */}
        {view==="new"&&<NewForm users={users} onCreate={createTicket}/>}

        {/* ── DETAIL ── */}
        {view==="detail"&&sel&&(
          <div style={{animation:"up .2s ease"}}>

            {/* Info */}
            <Card mb={8}>
              {[
                ["Client",      sel.client],
                ["Téléphone",   sel.clientPhone||"—"],
                ["Email",       sel.clientEmail||"—"],
                ["Équipement",  sel.equipement],
                ["Technicien",  sel.technicien||"—"],
                ["Département", sel.departement||"—"],
                ["Ouverture",   sel.date_ouverture],
                ["Priorité",    sel.priorite],
              ].map(([l,v],i,a)=>(
                <IRow key={l} label={l} last={i===a.length-1}>{v}</IRow>
              ))}
            </Card>

            <SL>Panne</SL>
            <Card mb={8}><div style={{padding:"11px 13px",fontSize:13,color:"var(--t1)",lineHeight:1.6}}>{sel.panne}</div></Card>

            {sel.commentaires&&<>
              <SL>Notes & travaux</SL>
              <Card mb={8}><div style={{padding:"11px 13px",fontSize:13,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-line"}}>{sel.commentaires}</div></Card>
            </>}

            {/* Delivery confirmation */}
            {sel.signature&&<>
              <SL>Livraison confirmée</SL>
              <Card mb={8}>
                <div style={{padding:"12px 13px"}}>
                  <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>Signé par <strong>{sel.signedBy}</strong> · {fmtDT(sel.signedAt)}</div>
                  <img src={sel.signature} onClick={()=>setLb(sel.signature)} style={{maxWidth:180,borderRadius:8,border:"1px solid var(--b0)",cursor:"pointer",display:"block",marginBottom:10}}/>
                  <button onClick={()=>printBL(sel)} style={{background:"none",border:"none",color:"var(--blue)",fontSize:12,cursor:"pointer",padding:0,fontFamily:FONT,fontWeight:500}}>Imprimer bon de livraison →</button>
                </div>
              </Card>
            </>}

            {/* Action buttons — coloured */}
            <SL>Actions</SL>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
              <Btn color="blue" onClick={()=>setSheet("photos")}>
                Photos{totalP(sel)>0?` · ${totalP(sel)} fichier${totalP(sel)>1?"s":""}` :""}
              </Btn>
              {!sel.signature&&(sel.statut==="Clôturé"||sel.statut==="En cours"||sel.statut==="Ouvert")&&(
                <Btn color="green" onClick={()=>setSheet("deliver")}>Livraison & signature client</Btn>
              )}
              <Btn color="amber" onClick={()=>setSheet("qr")}>Afficher / imprimer QR Code</Btn>
              {sel.signature&&<Btn color="purple" onClick={()=>printBL(sel)}>Bon de livraison PDF</Btn>}
            </div>

            {/* Status */}
            <SL>Statut</SL>
            <Card mb={8}>
              <div style={{padding:"11px 13px",display:"flex",flexWrap:"wrap",gap:5}}>
                {Object.entries(STATUSES).map(([k,v])=>{
                  const act=sel.statut===k;
                  return <button key={k} onClick={()=>{mut(sel.id,{statut:k});say(`→ ${v.label}`);}} style={{padding:"5px 11px",borderRadius:R.full,border:`1px solid ${act?v.dot:v.border}`,background:act?v.bg:"transparent",color:act?v.dot:"var(--t2)",fontSize:11,fontWeight:act?600:400,display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}>
                    {act&&<span style={{width:4,height:4,borderRadius:"50%",background:v.dot,display:"inline-block"}}/>}
                    {v.label}
                  </button>;
                })}
              </div>
            </Card>

            {/* Note */}
            <SL>Note rapide</SL>
            <Card>
              <NoteInput onAdd={txt=>{
                const d=new Date().toLocaleDateString("fr-FR");
                mut(sel.id,{commentaires:sel.commentaires?`${sel.commentaires}\n[${d}] ${txt}`:`[${d}] ${txt}`});
                say("Note ajoutée");
              }}/>
            </Card>
          </div>
        )}

        {/* ── TEAM / SETTINGS ── */}
        {view==="settings"&&(
          <div style={{animation:"up .2s ease"}}>
            <div style={{fontSize:18,fontWeight:600,marginBottom:16}}>Équipe</div>
            {isAdmin&&<Btn color="blue" style={{marginBottom:14}} onClick={()=>setSheet("newUser")}>+ Ajouter un utilisateur</Btn>}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {users.map(u=>(
                <div key={u.id} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:u.active?1:0.4}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"var(--t1)",flexShrink:0}}>{u.name[0]}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:"var(--t0)"}}>{u.name}</div>
                      <div style={{fontSize:11,color:"var(--t2)"}}>{u.role==="admin"?"Admin":"Technicien"} · {u.email}</div>
                    </div>
                  </div>
                  {isAdmin&&u.id!==user.id&&(
                    <div style={{display:"flex",gap:5}}>
                      <MiniBtn onClick={()=>{setEUser(u);setSheet("editUser");}}>Éditer</MiniBtn>
                      <MiniBtn onClick={()=>{setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x));say(u.active?"Désactivé":"Activé");}}>{u.active?"Off":"On"}</MiniBtn>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:"12px 14px",background:"var(--s1)",borderRadius:R.lg,fontSize:11,color:"var(--t2)",lineHeight:1.8}}>
              <div style={{fontWeight:600,color:"var(--t1)",marginBottom:3}}>Mon compte</div>
              {user.name} · {user.role==="admin"?"Administrateur":"Technicien"}<br/>
              {user.email} · PIN {"·".repeat(user.pin.length)}
            </div>
          </div>
        )}

      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"var(--bg)",borderTop:"1px solid var(--b0)",display:"flex",height:52,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {[
          {k:"dashboard",label:"Accueil"},
          {k:"list",     label:"Tickets"},
          ...(!isTech?[{k:"new",label:"Nouveau"}]:[]),
          {k:"settings", label:"Équipe"},
        ].map(nav=>(
          <button key={nav.k} onClick={()=>{setView(nav.k);setSel(null);}} style={{flex:1,background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,color:view===nav.k?"var(--t0)":"var(--t2)",transition:"color .15s",cursor:"pointer"}}>
            <span style={{fontSize:11,fontWeight:view===nav.k?600:400,letterSpacing:"0.02em"}}>{nav.label}</span>
            {view===nav.k&&<span style={{width:14,height:1.5,background:"var(--t0)",borderRadius:R.full,display:"block"}}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════ */
function LoginScreen({users,onLogin}){
  const [step,setStep]=useState("pick");
  const [picked,setPicked]=useState(null);
  const [pin,setPin]=useState("");
  const [shake,setShake]=useState(false);

  const tap=d=>{
    const next=pin+d;
    setPin(next);
    if(next.length===picked.pin.length){
      if(next===picked.pin) onLogin(picked);
      else{ setShake(true); setPin(""); setTimeout(()=>setShake(false),500); }
    }
  };

  return(
    <div style={{background:"var(--bg)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:FONT}}>
      <style>{CSS}</style>
      <div style={{marginBottom:36,textAlign:"center"}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.14em",color:"var(--t0)"}}>PIMAK FRANCE</div>
        <div style={{fontSize:10,color:"var(--t2)",marginTop:4,letterSpacing:"0.07em"}}>SERVICE APRÈS-VENTE</div>
      </div>

      {step==="pick"?(
        <div style={{width:"100%",maxWidth:300}}>
          <div style={{fontSize:11,color:"var(--t2)",marginBottom:10,textAlign:"center",letterSpacing:"0.03em"}}>Qui êtes-vous ?</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {users.filter(u=>u.active).map(u=>(
              <button key={u.id} onClick={()=>{setPicked(u);setStep("pin");setPin("");}} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"13px 14px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"border-color .15s",textAlign:"left"}}>
                <div style={{width:34,height:34,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"var(--t1)",flexShrink:0}}>{u.name[0]}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--t0)"}}>{u.name}</div>
                  <div style={{fontSize:11,color:"var(--t2)"}}>{u.role==="admin"?"Administrateur":"Technicien"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:260,textAlign:"center"}}>
          <button onClick={()=>{setStep("pick");setPin("");}} style={{background:"none",border:"none",color:"var(--t2)",fontSize:11,cursor:"pointer",marginBottom:20,fontFamily:FONT}}>← Retour</button>
          <div style={{width:44,height:44,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600,color:"var(--t1)",margin:"0 auto 10px"}}>{picked.name[0]}</div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{picked.name}</div>
          <div style={{fontSize:11,color:"var(--t2)",marginBottom:22}}>Entrez votre PIN</div>
          <div style={{display:"flex",gap:9,justifyContent:"center",marginBottom:26,animation:shake?"shake .4s ease":""}}  >
            {Array.from({length:picked.pin.length}).map((_,i)=>(
              <div key={i} style={{width:9,height:9,borderRadius:"50%",background:i<pin.length?(shake?"var(--red)":"var(--t0)"):"var(--b1)",transition:"background .1s"}}/>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
              <button key={i} onClick={()=>{if(d==="⌫")setPin(p=>p.slice(0,-1));else if(d!=="")tap(String(d));}} style={{padding:"15px 8px",borderRadius:R.md,border:"1px solid var(--b0)",background:d===""?"transparent":"var(--s0)",color:"var(--t0)",fontSize:17,cursor:d===""?"default":"pointer",opacity:d===""?0:1,fontFamily:FONT}}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TICKET LIST
═══════════════════════════════════════════ */
function TicketList({tickets,onSel}){
  const [q,setQ]=useState("");
  const [fs,setFs]=useState(null);
  const filtered=tickets.filter(t=>{
    if(fs&&t.statut!==fs)return false;
    if(q&&!`${t.client} ${t.numero} ${t.equipement}`.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  });
  return(
    <div style={{animation:"up .2s ease"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…" style={{marginBottom:10}}/>
      <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:12,paddingBottom:2}}>
        <FC active={!fs} onClick={()=>setFs(null)}>Tous</FC>
        {Object.entries(STATUSES).map(([k,v])=><FC key={k} active={fs===k} dot={v.dot} bg={v.bg} border={v.border} onClick={()=>setFs(fs===k?null:k)}>{v.label}</FC>)}
      </div>
      {filtered.length===0
        ?<div style={{textAlign:"center",padding:"40px 0",color:"var(--t2)",fontSize:12}}>Aucun résultat</div>
        :<div style={{display:"flex",flexDirection:"column",gap:6}}>{filtered.map((t,i)=><TRow key={t.id} t={t} onSel={onSel} np={totalP(t)} delay={i*20}/>)}</div>
      }
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEW TICKET FORM
═══════════════════════════════════════════ */
function NewForm({users,onCreate}){
  const [f,setF]=useState(EMPTY);
  const techs=users.filter(u=>u.role==="technician"&&u.active).map(u=>u.name);
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{animation:"up .2s ease"}}>
      <div style={{fontSize:18,fontWeight:600,marginBottom:14}}>Nouvelle intervention</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <FL label="Client *"><input value={f.client} onChange={e=>s("client")(e.target.value)} placeholder="Nom du client"/></FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <FL label="Téléphone"><input value={f.clientPhone} onChange={e=>s("clientPhone")(e.target.value)} placeholder="+33 6 00 00 00 00" type="tel"/></FL>
          <FL label="Email"><input value={f.clientEmail} onChange={e=>s("clientEmail")(e.target.value)} placeholder="client@email.com" type="email"/></FL>
        </div>
        <FL label="Équipement *"><input value={f.equipement} onChange={e=>s("equipement")(e.target.value)} placeholder="Appareil concerné"/></FL>
        <FL label="Panne *"><textarea value={f.panne} onChange={e=>s("panne")(e.target.value)} rows={3} placeholder="Description du problème"/></FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <FL label="Technicien"><select value={f.technicien} onChange={e=>s("technicien")(e.target.value)}><option value="">—</option>{techs.map(t=><option key={t}>{t}</option>)}</select></FL>
          <FL label="Département"><select value={f.departement} onChange={e=>s("departement")(e.target.value)}><option value="">—</option>{["SAV","Commercial","Direction","Logistique"].map(d=><option key={d}>{d}</option>)}</select></FL>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <FL label="Priorité"><select value={f.priorite} onChange={e=>s("priorite")(e.target.value)}>{["Normale","Haute","Urgente"].map(p=><option key={p}>{p}</option>)}</select></FL>
          <FL label="Statut"><select value={f.statut} onChange={e=>s("statut")(e.target.value)}>{Object.keys(STATUSES).map(k=><option key={k}>{k}</option>)}</select></FL>
        </div>
        <FL label="Notes"><textarea value={f.commentaires} onChange={e=>s("commentaires")(e.target.value)} rows={2} placeholder="Notes internes"/></FL>
        <Btn color="green" onClick={()=>{if(!f.client||!f.equipement||!f.panne)return;onCreate(f);}}>Créer et envoyer notification</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   USER FORM
═══════════════════════════════════════════ */
function UserForm({init,onSave}){
  const [f,setF]=useState(init||{name:"",email:"",pin:"",role:"technician"});
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <FL label="Nom"><input value={f.name} onChange={e=>s("name")(e.target.value)} placeholder="Jean-Pierre"/></FL>
      <FL label="Email"><input value={f.email} onChange={e=>s("email")(e.target.value)} placeholder="jp@pimak.fr" type="email"/></FL>
      <FL label="PIN"><input value={f.pin} onChange={e=>s("pin")(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="4 chiffres" type="password"/></FL>
      <FL label="Rôle"><select value={f.role} onChange={e=>s("role")(e.target.value)}><option value="technician">Technicien</option><option value="admin">Administrateur</option></select></FL>
      <Btn color="blue" onClick={()=>{if(!f.name||!f.pin)return;onSave(f);}}>Enregistrer</Btn>
    </div>
  );
}

/* ═══════════════════════════════════════════
   QR SHEET — Sticker baskı + PNG kayıt
═══════════════════════════════════════════ */
function QRSheet({t,onPrint}){
  const canvasRef = useRef();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(t.numero)}&bgcolor=ffffff&color=111111&margin=10`;

  // Draw sticker onto canvas
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 400, H = 480;
    canvas.width = W; canvas.height = H;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(0,0,W,H,16);
    ctx.fill();

    // Top bar
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.roundRect(0,0,W,52,{upperLeft:16,upperRight:16,lowerLeft:0,lowerRight:0});
    ctx.fill();

    // Brand
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 13px Inter,-apple-system,sans-serif";
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText("PIMAK FRANCE", W/2, 22);
    ctx.font = "400 9px Inter,-apple-system,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("SERVICE APRÈS-VENTE", W/2, 38);

    // QR image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 100, 68, 200, 200);

      // Ticket number
      ctx.fillStyle = "#111111";
      ctx.font = "600 22px Inter,-apple-system,sans-serif";
      ctx.letterSpacing = "1px";
      ctx.textAlign = "center";
      ctx.fillText(t.numero, W/2, 300);

      // Divider
      ctx.strokeStyle = "#f0f0f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, 316); ctx.lineTo(W-28, 316);
      ctx.stroke();

      // Client
      ctx.fillStyle = "#111111";
      ctx.font = "500 13px Inter,-apple-system,sans-serif";
      ctx.letterSpacing = "0px";
      ctx.textAlign = "center";
      const clientText = t.client.length > 32 ? t.client.slice(0,32)+"…" : t.client;
      ctx.fillText(clientText, W/2, 338);

      // Equipment
      ctx.fillStyle = "#888888";
      ctx.font = "400 11px Inter,-apple-system,sans-serif";
      const eqText = t.equipement.length > 38 ? t.equipement.slice(0,38)+"…" : t.equipement;
      ctx.fillText(eqText, W/2, 357);

      // Date
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "400 10px Inter,-apple-system,sans-serif";
      ctx.fillText(`Ouvert le ${t.date_ouverture}`, W/2, 376);

      // Border
      ctx.strokeStyle = "#e8e8e8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(0.75,0.75,W-1.5,H-1.5,16);
      ctx.stroke();

      // Bottom hint
      ctx.fillStyle = "#cccccc";
      ctx.font = "400 9px Inter,-apple-system,sans-serif";
      ctx.fillText("Scanner pour accéder au dossier", W/2, 456);

      setReady(true);
    };
    img.onerror = () => {
      // Fallback: draw placeholder
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(100,68,200,200);
      ctx.fillStyle = "#aaa";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR Code", W/2, 172);
      setReady(true);
    };
    img.src = qrUrl;
  },[t]);

  const savePNG = async () => {
    setSaving(true);
    const canvas = canvasRef.current;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.numero}-sticker.png`;
    a.click();
    setTimeout(()=>setSaving(false), 800);
  };

  const printSticker = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Sticker ${t.numero}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f0f0}
      .wrap{background:#fff;padding:24px;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,.1)}
      img{width:200px;height:240px;display:block}
      p{text-align:center;font-size:10px;color:#aaa;margin-top:10px;font-family:sans-serif}
      @media print{body{background:#fff}.wrap{box-shadow:none;padding:0}p{display:none}}
    </style></head>
    <body onload="window.print()">
      <div class="wrap">
        <img src="${dataUrl}"/>
        <p>Découper et coller sur l'équipement</p>
      </div>
    </body></html>`);
    w.document.close();
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
      {/* New ticket badge */}
      <div style={{background:"var(--greenbg)",border:"1px solid var(--greenborder)",borderRadius:R.full,padding:"4px 14px",fontSize:11,fontWeight:600,color:"var(--green)",marginBottom:14}}>
        ✓ {t.numero} créé
      </div>

      {/* Canvas sticker preview */}
      <div style={{borderRadius:R.lg,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",marginBottom:16,border:"1px solid var(--b0)"}}>
        <canvas ref={canvasRef} style={{display:"block",width:200,height:240}}/>
      </div>

      {/* Info */}
      <div style={{fontSize:11,color:"var(--t2)",textAlign:"center",marginBottom:16,lineHeight:1.6}}>
        {t.client}<br/>
        <span style={{color:"var(--t3)"}}>{t.equipement}</span>
      </div>

      {/* Action buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:7,width:"100%"}}>
        <Btn color="black" onClick={printSticker} disabled={!ready}>
          Imprimer le sticker
        </Btn>
        <Btn color="blue" onClick={savePNG} disabled={!ready||saving}>
          {saving ? "Enregistrement…" : "Enregistrer en PNG"}
        </Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCAN SHEET
═══════════════════════════════════════════ */
function ScanSheet({tickets,onSelect}){
  const [val,setVal]=useState("");
  const videoRef=useRef();
  const [camOn,setCamOn]=useState(false);
  const [camErr,setCamErr]=useState(false);

  useEffect(()=>{
    let stream;
    if(!navigator.mediaDevices?.getUserMedia){setCamErr(true);return;}
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})
      .then(s=>{stream=s;if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();setCamOn(true);}})
      .catch(()=>setCamErr(true));
    return()=>stream?.getTracks().forEach(t=>t.stop());
  },[]);

  const tryLookup=()=>{
    const found=tickets.find(t=>t.numero===val.trim().toUpperCase());
    if(found) onSelect(found);
  };

  return(
    <div>
      <div style={{borderRadius:R.lg,overflow:"hidden",background:"var(--s2)",aspectRatio:"4/3",marginBottom:12,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {!camErr?(
          <>
            <video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:camOn?"block":"none"}}/>
            {!camOn&&<div style={{fontSize:11,color:"var(--t2)"}}>Chargement caméra…</div>}
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
              <div style={{width:150,height:150,border:"2px solid rgba(255,255,255,.75)",borderRadius:R.md,boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"}}/>
            </div>
          </>
        ):(
          <div style={{textAlign:"center",padding:20,color:"var(--t2)",fontSize:11}}>Caméra non disponible<br/>Saisie manuelle ci-dessous</div>
        )}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={val} onChange={e=>setVal(e.target.value.toUpperCase())} placeholder="PI-001" onKeyDown={e=>e.key==="Enter"&&tryLookup()}/>
        <button onClick={tryLookup} style={{background:"var(--t0)",color:"var(--bg)",border:"none",borderRadius:R.md,padding:"0 16px",fontSize:14,fontWeight:500,flexShrink:0,fontFamily:FONT}}>→</button>
      </div>
      <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Tickets actifs</div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {tickets.filter(t=>t.statut!=="Livré").map(t=>(
          <button key={t.id} onClick={()=>onSelect(t)} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.md,padding:"10px 12px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:FONT}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:"var(--t0)",marginBottom:1}}>{t.numero} · {t.client}</div>
              <div style={{fontSize:11,color:"var(--t2)"}}>{t.equipement}</div>
            </div>
            <span style={{width:6,height:6,borderRadius:"50%",background:STATUSES[t.statut]?.dot,display:"inline-block",flexShrink:0}}/>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIGNATURE CANVAS
═══════════════════════════════════════════ */
function SigCanvas({onDone,onBack}){
  const ref=useRef();
  const drawing=useRef(false);
  const [drawn,setDrawn]=useState(false);
  const pos=(e,c)=>{const r=c.getBoundingClientRect(),t=e.touches?.[0]||e;return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)};};
  const start=e=>{e.preventDefault();drawing.current=true;const c=ref.current,ctx=c.getContext("2d"),p=pos(e,c);ctx.beginPath();ctx.moveTo(p.x,p.y);};
  const move=e=>{e.preventDefault();if(!drawing.current)return;setDrawn(true);const c=ref.current,ctx=c.getContext("2d"),p=pos(e,c);ctx.strokeStyle="#111";ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";ctx.lineTo(p.x,p.y);ctx.stroke();};
  const stop=e=>{e?.preventDefault();drawing.current=false;};
  const clear=()=>{ref.current.getContext("2d").clearRect(0,0,ref.current.width,ref.current.height);setDrawn(false);};
  return(
    <div>
      <div style={{border:"1px solid var(--b1)",borderRadius:R.md,overflow:"hidden",marginBottom:8,background:"#ffffff",touchAction:"none"}}>
        <canvas ref={ref} width={520} height={170} style={{width:"100%",height:155,display:"block",cursor:"crosshair"}}
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}/>
      </div>
      <div style={{fontSize:10,color:"var(--t2)",textAlign:"center",marginBottom:10}}>{drawn?"Signature enregistrée ✓":"Signez avec le doigt ou la souris"}</div>
      <div style={{display:"flex",gap:7}}>
        <button onClick={onBack} style={{padding:"10px 13px",borderRadius:R.md,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontSize:12,fontFamily:FONT}}>←</button>
        <button onClick={clear} style={{padding:"10px 13px",borderRadius:R.md,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontSize:12,fontFamily:FONT}}>Effacer</button>
        <button onClick={()=>drawn&&onDone(ref.current.toDataURL())} style={{flex:1,padding:"10px",borderRadius:R.md,border:"none",background:drawn?"#059669":"var(--s2)",color:drawn?"#fff":"var(--t2)",fontSize:12,fontWeight:500,transition:"all .15s",cursor:drawn?"pointer":"default",fontFamily:FONT}}>Confirmer</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PHOTO ZONE
═══════════════════════════════════════════ */
function PhotoZone({photos,onAdd,onRemove,onView}){
  const ref=useRef();
  return(
    <div>
      {photos.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:8}}>
          {photos.map(p=>(
            <div key={p.id} style={{position:"relative",aspectRatio:"1",borderRadius:R.md,overflow:"hidden"}}>
              <img src={p.src} alt="" onClick={()=>onView(p.src)} style={{width:"100%",height:"100%",objectFit:"cover",cursor:"pointer",display:"block"}}/>
              <button onClick={()=>onRemove(p.id)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",width:20,height:20,borderRadius:R.full,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          ))}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={e=>{if(e.target.files?.length){onAdd(e.target.files);e.target.value="";}}}/>
      <button onClick={()=>ref.current?.click()} style={{width:"100%",padding:"10px",borderRadius:R.md,border:"1px dashed var(--b1)",background:"var(--s1)",color:"var(--t1)",fontSize:12,cursor:"pointer",fontFamily:FONT}}>
        {photos.length===0?"Ajouter des photos":`Ajouter · ${photos.length} photo${photos.length>1?"s":""}`}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════ */
function TRow({t,onSel,np,delay=0}){
  const st=STATUSES[t.statut]||STATUSES.Ouvert;
  return(
    <div onClick={()=>onSel(t)} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",cursor:"pointer",animation:"up .2s ease both",animationDelay:`${delay}ms`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:st.dot,display:"inline-block",flexShrink:0}}/>
          <span style={{fontSize:11,fontWeight:600,color:"var(--t0)",fontVariantNumeric:"tabular-nums",letterSpacing:"0.02em"}}>{t.numero}</span>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {np>0&&<span style={{fontSize:10,color:"var(--t2)"}}>{np}↑</span>}
          {t.signature&&<span style={{fontSize:10,color:"var(--green)"}}>✓</span>}
          {t.priorite==="Urgente"&&<span style={{fontSize:10,color:"var(--red)",fontWeight:600}}>!</span>}
          <StatusPill s={st}>{st.label}</StatusPill>
        </div>
      </div>
      <div style={{fontSize:13,fontWeight:500,color:"var(--t0)",marginBottom:2}}>{t.client}</div>
      <div style={{fontSize:11,color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.equipement}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
        <span style={{fontSize:10,color:"var(--t2)"}}>{t.date_ouverture}</span>
        {t.technicien&&<span style={{fontSize:10,color:"var(--t2)"}}>{t.technicien}</span>}
      </div>
    </div>
  );
}

function Sheet({title,onClose,children}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:901,background:"var(--s0)",borderRadius:"18px 18px 0 0",maxHeight:"90vh",overflowY:"auto",animation:"sheet .25s ease",maxWidth:560,margin:"0 auto",paddingBottom:"env(safe-area-inset-bottom,16px)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 16px 12px"}}>
        <span style={{fontSize:13,fontWeight:600,color:"var(--t0)"}}>{title}</span>
        <button onClick={onClose} style={{background:"var(--s1)",border:"none",borderRadius:R.full,width:26,height:26,fontSize:12,color:"var(--t1)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>✕</button>
      </div>
      <div style={{padding:"0 16px 24px"}}>{children}</div>
    </div>
  );
}

function Card({children,mb=0}){
  return <div style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,overflow:"hidden",marginBottom:mb}}>{children}</div>;
}

function IRow({label,children,last}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 13px",borderBottom:last?"none":"1px solid var(--b0)"}}>
      <span style={{fontSize:10,color:"var(--t2)",flexShrink:0,marginRight:14,paddingTop:2,letterSpacing:"0.03em"}}>{label}</span>
      <span style={{fontSize:12,color:"var(--t0)",textAlign:"right",fontWeight:500}}>{children}</span>
    </div>
  );
}

const BTN_COLORS = {
  black:  { bg:"var(--t0)",       fg:"var(--bg)",      bdr:"transparent"      },
  green:  { bg:"var(--greenbg)",  fg:"var(--green)",   bdr:"var(--greenborder)"},
  blue:   { bg:"var(--bluebg)",   fg:"var(--blue)",    bdr:"var(--blueborder)" },
  amber:  { bg:"var(--amberbg)",  fg:"var(--amber)",   bdr:"var(--amberborder)"},
  red:    { bg:"var(--redbg)",    fg:"var(--red)",     bdr:"var(--redborder)"  },
  purple: { bg:"var(--purplebg)", fg:"var(--purple)",  bdr:"var(--purpleborder)"},
};

function Btn({children,onClick,color="black",disabled,style:ss}){
  const c=BTN_COLORS[color]||BTN_COLORS.black;
  return(
    <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"11px 14px",borderRadius:R.md,border:`1px solid ${disabled?"var(--b0)":c.bdr}`,background:disabled?"var(--s1)":c.bg,color:disabled?"var(--t2)":c.fg,fontSize:12,fontWeight:600,cursor:disabled?"default":"pointer",transition:"opacity .15s",fontFamily:FONT,letterSpacing:"0.01em",...ss}}>
      {children}
    </button>
  );
}

function MiniBtn({children,onClick}){
  return <button onClick={onClick} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.sm,padding:"4px 9px",fontSize:10,fontWeight:500,color:"var(--t1)",cursor:"pointer",fontFamily:FONT,letterSpacing:"0.02em"}}>{children}</button>;
}

function StatusPill({s,children}){
  if(!s)return null;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:R.full,border:`1px solid ${s.border}`,fontSize:10,color:s.dot,background:s.bg,fontWeight:500,whiteSpace:"nowrap"}}>{children}</span>;
}

function FC({children,active,dot,bg,border,onClick}){
  return(
    <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:R.full,border:active&&border?`1px solid ${border}`:"1px solid var(--b0)",fontSize:10,fontWeight:active?600:400,color:active&&dot?dot:"var(--t2)",background:active&&bg?bg:"transparent",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .15s",fontFamily:FONT}}>
      {dot&&active&&<span style={{width:4,height:4,borderRadius:"50%",background:dot,display:"inline-block"}}/>}
      {children}
    </button>
  );
}

function FL({label,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <div style={{fontSize:10,fontWeight:500,color:"var(--t2)",letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>
      {children}
    </div>
  );
}

function SL({children}){
  return <div style={{fontSize:10,fontWeight:500,color:"var(--t2)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5,marginTop:2}}>{children}</div>;
}

function NoteInput({onAdd}){
  const [v,setV]=useState("");
  return(
    <div style={{padding:"11px 13px"}}>
      <textarea value={v} onChange={e=>setV(e.target.value)} rows={2} placeholder="Note interne…" style={{marginBottom:7}}/>
      <Btn color="blue" onClick={()=>{if(v.trim()){onAdd(v.trim());setV("");}}}>Ajouter</Btn>
    </div>
  );
}
