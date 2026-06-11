import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

/* ═══════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════ */
const R = { sm:"6px", md:"10px", lg:"14px", xl:"18px", full:"9999px" };
const FONT = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

const makeCSS = (theme) => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
:root {
  --bg:   ${theme==="dark" ? "#0a0a0a"              : "#f5f5f5"};
  --s0:   ${theme==="dark" ? "#141414"              : "#ffffff"};
  --s1:   ${theme==="dark" ? "#1e1e1e"              : "#f0f0f0"};
  --s2:   ${theme==="dark" ? "#2a2a2a"              : "#e4e4e4"};
  --s3:   ${theme==="dark" ? "#333333"              : "#d8d8d8"};
  --b0:   ${theme==="dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"};
  --b1:   ${theme==="dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.11)"};
  --b2:   ${theme==="dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.20)"};
  --t0:   ${theme==="dark" ? "#f2f2f2"              : "#111111"};
  --t1:   ${theme==="dark" ? "#a0a0a0"              : "#444444"};
  --t2:   ${theme==="dark" ? "#606060"              : "#888888"};
  --t3:   ${theme==="dark" ? "#383838"              : "#bbbbbb"};
  --red:#dc2626;    --redbg:${theme==="dark"?"#2d1212":"#fef2f2"};    --redborder:${theme==="dark"?"#7f1d1d":"#fecaca"};
  --amber:#d97706;  --amberbg:${theme==="dark"?"#292008":"#fffbeb"};  --amberborder:${theme==="dark"?"#78350f":"#fde68a"};
  --green:#059669;  --greenbg:${theme==="dark"?"#052e1c":"#ecfdf5"};  --greenborder:${theme==="dark"?"#065f46":"#a7f3d0"};
  --blue:#2563eb;   --bluebg:${theme==="dark"?"#0c1a3a":"#eff6ff"};   --blueborder:${theme==="dark"?"#1e3a8a":"#bfdbfe"};
  --purple:#7c3aed; --purplebg:${theme==="dark"?"#1e0a3c":"#f5f3ff"}; --purpleborder:${theme==="dark"?"#4c1d95":"#ddd6fe"};
  --nav-h: 68px;
}
*, *::before, *::after { box-sizing:border-box; -webkit-tap-highlight-color:transparent; margin:0; padding:0; }
html,body { background:var(--bg); color:var(--t0); font-family:${FONT}; }
input,select,textarea { font-family:${FONT}; font-size:15px!important; color:var(--t0); background:var(--s0); border:1px solid var(--b1); outline:none; width:100%; border-radius:${R.md}; padding:10px 12px; transition:border-color .15s,box-shadow .15s; }
input:focus,select:focus,textarea:focus { border-color:var(--b2); box-shadow:0 0 0 3px rgba(0,0,0,0.06); }
textarea { resize:vertical; line-height:1.6; }
button { font-family:${FONT}; cursor:pointer; border:none; }
::-webkit-scrollbar { display:none; }
@keyframes up    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes sheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes fade  { from{opacity:0} to{opacity:1} }
@keyframes toast { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
@keyframes spin  { to{transform:rotate(360deg)} }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
`;

/* ═══════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════ */
const LANGS = { fr:"Français", en:"English", tr:"Türkçe", es:"Español" };
const T = {
  fr:{ nav_home:"Accueil",nav_tickets:"Tickets",nav_new:"Nouveau",nav_team:"Équipe",brand_sub:"Service Après-Vente",login_who:"Qui êtes-vous ?",login_back:"← Retour",login_pin:"Code PIN",role_admin:"Administrateur",role_manager:"Responsable",role_tech:"Technicien",hello:"Bonjour",stat_ongoing:"En cours",stat_open:"Ouverts",stat_delivered:"Livrés",stat_total:"Total",stat_urgent:"Urgents",urgent_one:"1 urgente",urgent_many:"{n} urgentes",my_tickets:"Mes interventions",recent:"Interventions récentes",see_all:"Voir tout ({n})",search:"Rechercher…",all:"Toutes",no_results:"Aucun résultat",new_title:"Nouvelle intervention",f_client:"Client *",f_phone:"Téléphone",f_email:"Adresse e-mail",f_equip:"Équipement *",f_fault:"Panne constatée *",f_tech:"Technicien",f_dept:"Département",f_prio:"Priorité",f_status:"Statut",f_notes:"Notes internes",ph_client:"Nom du client",ph_equip:"Appareil concerné",ph_fault:"Description du problème",ph_notes:"Notes internes",btn_create:"Créer l'intervention",s_fault:"Panne",s_notes:"Notes et travaux",s_delivery:"Livraison confirmée",s_actions:"Actions",s_status:"Modifier le statut",s_note:"Ajouter une note",signed_by:"Signé par",dl_pdf:"Télécharger le rapport PDF",btn_photos:"Photos{n}",btn_deliver:"Livraison et signature",btn_qr:"QR Code / étiquette",btn_edit_ticket:"Modifier",btn_delete_ticket:"Supprimer",note_ph:"Note interne…",btn_note:"Ajouter",sheet_qr:"Étiquette QR",sheet_scan:"Scanner",sheet_deliver:"Livraison",sheet_sig:"Signature",sheet_photos:"Photos",sheet_new_user:"Nouvel utilisateur",sheet_edit_user:"Modifier",sheet_edit_ticket:"Modifier l'intervention",sheet_delete:"Confirmation",d_cname:"Nom du client *",d_ph:"M. Dupont",btn_sign:"Passer à la signature →",name_req:"Le nom est requis",sig_hint:"Signez avec le doigt ou le curseur",sig_done:"Signature enregistrée ✓",sig_clear:"Effacer",sig_confirm:"Confirmer",p_rec:"Réception",p_rep:"Réparation",p_aft:"Après",p_add:"Ajouter des photos",p_more:"Ajouter · {n}",qr_created:"✓ {n} créée",qr_date:"Ouvert le",qr_hint:"Scanner pour accéder au dossier",qr_print:"Imprimer",qr_png:"Enregistrer PNG",qr_saving:"…",qr_cut:"Découper et coller sur l'équipement",scan_point:"Pointez vers le QR Code",scan_nocam:"Caméra indisponible",scan_manual:"Numéro manuel",scan_active:"Interventions actives",settings:"Équipe",btn_new_user:"+ Ajouter",my_account:"Mon compte",btn_edit:"Modifier",btn_off:"Désactiver",btn_on:"Activer",f_name:"Nom",f_pin:"Code PIN",pin_hint:"4–6 chiffres",f_role:"Rôle",btn_save:"Enregistrer",btn_cancel:"Annuler",delete_confirm:"Supprimer cette intervention ?",delete_sub:"Action irréversible.",btn_confirm_delete:"Supprimer",t_created:"✓ {n} créée",t_photos:"{n} photo(s) ajoutée(s)",t_photo_rm:"Photo supprimée",t_delivery:"Livraison confirmée…",t_mail:"Rapport envoyé ✓",t_note:"Note ajoutée",t_modified:"Modifications enregistrées",t_user:"{n} ajouté(e)",t_pdf:"Génération PDF…",t_pdf_ok:"PDF téléchargé ✓",t_status:"→ {s}",t_on:"Activé",t_off:"Désactivé",t_deleted:"Supprimé",lbl_client:"Client",lbl_phone:"Téléphone",lbl_email:"E-mail",lbl_equip:"Équipement",lbl_tech:"Technicien",lbl_dept:"Département",lbl_open:"Ouverture",lbl_close:"Clôture",lbl_del:"Livraison",lbl_prio:"Priorité",pn:"Normale",ph:"Haute",pu:"Urgente",language:"Langue",theme:"Thème",theme_light:"Clair",theme_dark:"Sombre",theme_auto:"Auto",db_tech_perf:"Performance par technicien",db_open:"Ouvert",db_ongoing:"En cours",db_done:"Terminé",db_urgent:"Urgent",db_by_status:"Répartition par statut",db_recent:"Dernières interventions",db_no_tech:"Non assigné" },
  en:{ nav_home:"Home",nav_tickets:"Tickets",nav_new:"New",nav_team:"Team",brand_sub:"After-Sales Service",login_who:"Who are you?",login_back:"← Back",login_pin:"PIN Code",role_admin:"Administrator",role_manager:"Manager",role_tech:"Technician",hello:"Hello",stat_ongoing:"Ongoing",stat_open:"Open",stat_delivered:"Delivered",stat_total:"Total",stat_urgent:"Urgent",urgent_one:"1 urgent",urgent_many:"{n} urgent",my_tickets:"My jobs",recent:"Recent jobs",see_all:"See all ({n})",search:"Search…",all:"All",no_results:"No results",new_title:"New service job",f_client:"Customer *",f_phone:"Phone",f_email:"Email",f_equip:"Equipment *",f_fault:"Reported fault *",f_tech:"Technician",f_dept:"Department",f_prio:"Priority",f_status:"Status",f_notes:"Notes",ph_client:"Customer name",ph_equip:"Equipment",ph_fault:"Problem description",ph_notes:"Internal notes",btn_create:"Create job",s_fault:"Fault",s_notes:"Notes & work",s_delivery:"Delivery confirmed",s_actions:"Actions",s_status:"Update status",s_note:"Add note",signed_by:"Signed by",dl_pdf:"Download PDF",btn_photos:"Photos{n}",btn_deliver:"Delivery & signature",btn_qr:"QR Code / label",btn_edit_ticket:"Edit",btn_delete_ticket:"Delete",note_ph:"Internal note…",btn_note:"Add",sheet_qr:"QR Label",sheet_scan:"Scan",sheet_deliver:"Delivery",sheet_sig:"Signature",sheet_photos:"Photos",sheet_new_user:"New user",sheet_edit_user:"Edit",sheet_edit_ticket:"Edit job",sheet_delete:"Confirm",d_cname:"Customer name *",d_ph:"Mr Smith",btn_sign:"Go to signature →",name_req:"Name required",sig_hint:"Sign with finger or cursor",sig_done:"Signature saved ✓",sig_clear:"Clear",sig_confirm:"Confirm",p_rec:"Reception",p_rep:"Repair",p_aft:"After",p_add:"Add photos",p_more:"Add · {n}",qr_created:"✓ {n} created",qr_date:"Opened",qr_hint:"Scan to access job",qr_print:"Print",qr_png:"Save PNG",qr_saving:"…",qr_cut:"Cut and stick on equipment",scan_point:"Point at QR Code",scan_nocam:"Camera unavailable",scan_manual:"Manual entry",scan_active:"Active jobs",settings:"Team",btn_new_user:"+ Add",my_account:"My account",btn_edit:"Edit",btn_off:"Disable",btn_on:"Enable",f_name:"Name",f_pin:"PIN",pin_hint:"4–6 digits",f_role:"Role",btn_save:"Save",btn_cancel:"Cancel",delete_confirm:"Delete this job?",delete_sub:"This cannot be undone.",btn_confirm_delete:"Delete",t_created:"✓ {n} created",t_photos:"{n} photo(s) added",t_photo_rm:"Photo removed",t_delivery:"Delivery confirmed…",t_mail:"Report sent ✓",t_note:"Note added",t_modified:"Saved",t_user:"{n} added",t_pdf:"Generating PDF…",t_pdf_ok:"PDF downloaded ✓",t_status:"→ {s}",t_on:"Enabled",t_off:"Disabled",t_deleted:"Deleted",lbl_client:"Customer",lbl_phone:"Phone",lbl_email:"Email",lbl_equip:"Equipment",lbl_tech:"Technician",lbl_dept:"Department",lbl_open:"Opened",lbl_close:"Closed",lbl_del:"Delivered",lbl_prio:"Priority",pn:"Normal",ph:"High",pu:"Urgent",language:"Language",theme:"Theme",theme_light:"Light",theme_dark:"Dark",theme_auto:"Auto",db_tech_perf:"Technician performance",db_open:"Open",db_ongoing:"Ongoing",db_done:"Done",db_urgent:"Urgent",db_by_status:"By status",db_recent:"Recent jobs",db_no_tech:"Unassigned" },
  tr:{ nav_home:"Anasayfa",nav_tickets:"Servisler",nav_new:"Yeni",nav_team:"Ekip",brand_sub:"Satış Sonrası Servis",login_who:"Kimsiniz?",login_back:"← Geri",login_pin:"PIN Kodu",role_admin:"Yönetici",role_manager:"Sorumlu",role_tech:"Teknisyen",hello:"Merhaba",stat_ongoing:"Devam ediyor",stat_open:"Açık",stat_delivered:"Teslim",stat_total:"Toplam",stat_urgent:"Acil",urgent_one:"1 acil",urgent_many:"{n} acil",my_tickets:"Servislerim",recent:"Son servisler",see_all:"Tümü ({n})",search:"Ara…",all:"Tümü",no_results:"Sonuç yok",new_title:"Yeni Servis",f_client:"Müşteri *",f_phone:"Telefon",f_email:"E-posta",f_equip:"Ekipman *",f_fault:"Arıza *",f_tech:"Teknisyen",f_dept:"Departman",f_prio:"Öncelik",f_status:"Durum",f_notes:"Notlar",ph_client:"Müşteri adı",ph_equip:"Cihaz",ph_fault:"Arıza açıklaması",ph_notes:"İç notlar",btn_create:"Kaydı oluştur",s_fault:"Arıza",s_notes:"Notlar ve işlemler",s_delivery:"Teslim onaylandı",s_actions:"İşlemler",s_status:"Durum güncelle",s_note:"Not ekle",signed_by:"İmzalayan",dl_pdf:"PDF İndir",btn_photos:"Fotoğraflar{n}",btn_deliver:"Teslim ve imza",btn_qr:"QR Kod / etiket",btn_edit_ticket:"Düzenle",btn_delete_ticket:"Sil",note_ph:"İç not…",btn_note:"Ekle",sheet_qr:"QR Etiket",sheet_scan:"Tara",sheet_deliver:"Teslim",sheet_sig:"İmza",sheet_photos:"Fotoğraflar",sheet_new_user:"Yeni kullanıcı",sheet_edit_user:"Düzenle",sheet_edit_ticket:"Kaydı düzenle",sheet_delete:"Onay",d_cname:"Müşteri adı *",d_ph:"Ad Soyad",btn_sign:"İmza adımı →",name_req:"Ad zorunlu",sig_hint:"Parmak veya imleçle imzalayın",sig_done:"İmza alındı ✓",sig_clear:"Temizle",sig_confirm:"Onayla",p_rec:"Kabul",p_rep:"Tamir",p_aft:"Sonrası",p_add:"Fotoğraf ekle",p_more:"Ekle · {n}",qr_created:"✓ {n} oluşturuldu",qr_date:"Açılış:",qr_hint:"Servise erişmek için okutun",qr_print:"Yazdır",qr_png:"PNG Kaydet",qr_saving:"…",qr_cut:"Kesip cihaza yapıştırın",scan_point:"QR Koda doğrultun",scan_nocam:"Kamera yok",scan_manual:"Manuel giriş",scan_active:"Aktif servisler",settings:"Ekip",btn_new_user:"+ Ekle",my_account:"Hesabım",btn_edit:"Düzenle",btn_off:"Devre dışı",btn_on:"Etkinleştir",f_name:"Ad",f_pin:"PIN",pin_hint:"4–6 rakam",f_role:"Rol",btn_save:"Kaydet",btn_cancel:"İptal",delete_confirm:"Bu kayıt silinsin mi?",delete_sub:"Bu işlem geri alınamaz.",btn_confirm_delete:"Sil",t_created:"✓ {n} oluşturuldu",t_photos:"{n} fotoğraf eklendi",t_photo_rm:"Fotoğraf silindi",t_delivery:"Teslim onaylandı…",t_mail:"Rapor gönderildi ✓",t_note:"Not eklendi",t_modified:"Kaydedildi",t_user:"{n} eklendi",t_pdf:"PDF oluşturuluyor…",t_pdf_ok:"PDF indirildi ✓",t_status:"→ {s}",t_on:"Etkinleştirildi",t_off:"Devre dışı",t_deleted:"Silindi",lbl_client:"Müşteri",lbl_phone:"Telefon",lbl_email:"E-posta",lbl_equip:"Ekipman",lbl_tech:"Teknisyen",lbl_dept:"Departman",lbl_open:"Açılış",lbl_close:"Kapanış",lbl_del:"Teslim",lbl_prio:"Öncelik",pn:"Normal",ph:"Yüksek",pu:"Acil",language:"Dil",theme:"Tema",theme_light:"Açık",theme_dark:"Koyu",theme_auto:"Otomatik",db_tech_perf:"Teknisyen performansı",db_open:"Açık",db_ongoing:"Devam",db_done:"Bitti",db_urgent:"Acil",db_by_status:"Duruma göre",db_recent:"Son servisler",db_no_tech:"Atanmamış" },
  es:{ nav_home:"Inicio",nav_tickets:"Servicios",nav_new:"Nuevo",nav_team:"Equipo",brand_sub:"Servicio Posventa",login_who:"¿Quién es usted?",login_back:"← Volver",login_pin:"Código PIN",role_admin:"Administrador",role_manager:"Responsable",role_tech:"Técnico",hello:"Hola",stat_ongoing:"En curso",stat_open:"Abiertos",stat_delivered:"Entregados",stat_total:"Total",stat_urgent:"Urgentes",urgent_one:"1 urgente",urgent_many:"{n} urgentes",my_tickets:"Mis servicios",recent:"Servicios recientes",see_all:"Ver todos ({n})",search:"Buscar…",all:"Todos",no_results:"Sin resultados",new_title:"Nuevo servicio",f_client:"Cliente *",f_phone:"Teléfono",f_email:"Correo",f_equip:"Equipo *",f_fault:"Avería *",f_tech:"Técnico",f_dept:"Departamento",f_prio:"Prioridad",f_status:"Estado",f_notes:"Notas",ph_client:"Nombre del cliente",ph_equip:"Equipo",ph_fault:"Descripción",ph_notes:"Notas internas",btn_create:"Crear servicio",s_fault:"Avería",s_notes:"Notas y trabajos",s_delivery:"Entrega confirmada",s_actions:"Acciones",s_status:"Actualizar estado",s_note:"Añadir nota",signed_by:"Firmado por",dl_pdf:"Descargar PDF",btn_photos:"Fotos{n}",btn_deliver:"Entrega y firma",btn_qr:"Código QR",btn_edit_ticket:"Editar",btn_delete_ticket:"Eliminar",note_ph:"Nota interna…",btn_note:"Añadir",sheet_qr:"Etiqueta QR",sheet_scan:"Escanear",sheet_deliver:"Entrega",sheet_sig:"Firma",sheet_photos:"Fotos",sheet_new_user:"Nuevo usuario",sheet_edit_user:"Editar",sheet_edit_ticket:"Editar servicio",sheet_delete:"Confirmar",d_cname:"Nombre del cliente *",d_ph:"Sr. García",btn_sign:"Pasar a la firma →",name_req:"Nombre requerido",sig_hint:"Firme con el dedo",sig_done:"Firma guardada ✓",sig_clear:"Borrar",sig_confirm:"Confirmar",p_rec:"Recepción",p_rep:"Reparación",p_aft:"Después",p_add:"Añadir fotos",p_more:"Añadir · {n}",qr_created:"✓ {n} creado",qr_date:"Abierto el",qr_hint:"Escanear para acceder",qr_print:"Imprimir",qr_png:"Guardar PNG",qr_saving:"…",qr_cut:"Recortar y pegar",scan_point:"Apunte al QR",scan_nocam:"Cámara no disponible",scan_manual:"Entrada manual",scan_active:"Servicios activos",settings:"Equipo",btn_new_user:"+ Añadir",my_account:"Mi cuenta",btn_edit:"Editar",btn_off:"Desactivar",btn_on:"Activar",f_name:"Nombre",f_pin:"PIN",pin_hint:"4–6 dígitos",f_role:"Rol",btn_save:"Guardar",btn_cancel:"Cancelar",delete_confirm:"¿Eliminar este servicio?",delete_sub:"Acción irreversible.",btn_confirm_delete:"Eliminar",t_created:"✓ {n} creado",t_photos:"{n} foto(s) añadida(s)",t_photo_rm:"Foto eliminada",t_delivery:"Entrega confirmada…",t_mail:"Informe enviado ✓",t_note:"Nota añadida",t_modified:"Guardado",t_user:"{n} añadido",t_pdf:"Generando PDF…",t_pdf_ok:"PDF descargado ✓",t_status:"→ {s}",t_on:"Activado",t_off:"Desactivado",t_deleted:"Eliminado",lbl_client:"Cliente",lbl_phone:"Teléfono",lbl_email:"Correo",lbl_equip:"Equipo",lbl_tech:"Técnico",lbl_dept:"Departamento",lbl_open:"Apertura",lbl_close:"Cierre",lbl_del:"Entrega",lbl_prio:"Prioridad",pn:"Normal",ph:"Alta",pu:"Urgente",language:"Idioma",theme:"Tema",theme_light:"Claro",theme_dark:"Oscuro",theme_auto:"Auto",db_tech_perf:"Rendimiento técnicos",db_open:"Abierto",db_ongoing:"En curso",db_done:"Listo",db_urgent:"Urgente",db_by_status:"Por estado",db_recent:"Servicios recientes",db_no_tech:"Sin asignar" },
};
const tx=(lang,key,vars={})=>{let s=T[lang]?.[key]||T.fr[key]||key;Object.entries(vars).forEach(([k,v])=>{s=s.replaceAll(`{${k}}`,String(v));});return s;};

/* ═══════════════════════════════════════════
   EMAILJS
═══════════════════════════════════════════ */
const EJS={publicKey:"YOUR_PUBLIC_KEY",serviceId:"YOUR_SERVICE_ID",tplNew:"template_new_ticket",tplDelivery:"template_delivery",to:"france@pimak.com"};
async function loadJsPDF(){if(window.jspdf)return window.jspdf.jsPDF;await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});return window.jspdf.jsPDF;}
async function loadImage(src){return new Promise(res=>{const img=new Image();img.crossOrigin="anonymous";img.onload=()=>res(img);img.onerror=()=>res(null);img.src=src;});}
const fmtDT=iso=>iso?new Date(iso).toLocaleString("fr-FR"):"—";

async function buildPDF(t){
  const JsPDF=await loadJsPDF();const doc=new JsPDF({unit:"mm",format:"a4",compress:true});
  const W=210,ML=18,MR=18,TW=W-ML-MR;let y=0;
  const chk=(n=10)=>{if(y+n>272){doc.addPage();y=18;}};
  doc.setFillColor(17,17,17);doc.rect(0,0,W,18,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setCharSpace(2);doc.text("PIMAK FRANCE",ML,8);
  doc.setCharSpace(1);doc.setFont("helvetica","normal");doc.setFontSize(6.5);doc.setTextColor(180,180,180);doc.text("SERVICE APRÈS-VENTE",ML,13.5);
  doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setCharSpace(0);doc.text(t.numero,W-ML,10,{align:"right"});
  doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(180,180,180);doc.text(t.statut==="Livré"?"Livré ✓":t.statut,W-ML,15,{align:"right"});
  y=26;
  doc.setTextColor(17,17,17);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("Fiche d'intervention",ML,y);y+=5;
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(136,136,136);doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`,ML,y);y+=8;
  doc.setDrawColor(230,230,230);doc.setLineWidth(0.3);doc.line(ML,y,W-MR,y);y+=7;
  const rows=[["Client",t.client],["Téléphone",t.clientPhone||"—"],["E-mail",t.clientEmail||"—"],["Équipement",t.equipement],["Technicien",t.technicien||"—"],["Département",t.departement||"—"],["Priorité",t.priorite],["Date d'ouverture",t.date_ouverture],...(t.livreAt?[["Date de livraison",fmtDT(t.livreAt)]]:[])]
  rows.forEach(([label,val])=>{chk(8);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(153,153,153);doc.text(label.toUpperCase(),ML,y);doc.setTextColor(17,17,17);doc.setFontSize(9);const lines=doc.splitTextToSize(String(val),TW-42);doc.text(lines,ML+42,y);y+=Math.max(6,lines.length*4.5);doc.setDrawColor(242,242,242);doc.setLineWidth(0.2);doc.line(ML,y,W-MR,y);y+=4;});y+=3;
  chk(18);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(153,153,153);doc.text("PANNE CONSTATÉE",ML,y);y+=5;
  const pl=doc.splitTextToSize(t.panne,TW-6);doc.setFillColor(250,250,250);doc.rect(ML,y-3,TW,pl.length*5+6,"F");doc.setDrawColor(229,229,229);doc.setLineWidth(0.3);doc.rect(ML,y-3,2,pl.length*5+6,"F");doc.setTextColor(68,68,68);doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.text(pl,ML+5,y+1.5);y+=pl.length*5+8;
  if(t.commentaires){chk(18);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(153,153,153);doc.text("TRAVAUX EFFECTUÉS",ML,y);y+=5;const nl=doc.splitTextToSize(t.commentaires,TW-6);doc.setFillColor(250,250,250);doc.rect(ML,y-3,TW,nl.length*5+6,"F");doc.setDrawColor(17,17,17);doc.setLineWidth(0.4);doc.rect(ML,y-3,2,nl.length*5+6,"F");doc.setTextColor(68,68,68);doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.text(nl,ML+5,y+1.5);y+=nl.length*5+8;}
  const hasP=PHOTO_PHASES.some(p=>(t.photos?.[p.key]?.length||0)>0);
  if(hasP){chk(14);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(153,153,153);doc.text("PHOTOS D'INTERVENTION",ML,y);y+=6;
    for(const phase of PHOTO_PHASES){const imgs=t.photos?.[phase.key]||[];if(!imgs.length)continue;chk(12);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(136,136,136);doc.text(phase.label.toUpperCase(),ML,y);y+=4;
      const iW=52,iH=40,gap=4,perRow=3;let col=0,rY=y;
      for(const photo of imgs){if(col===0)chk(iH+12);const x=ML+col*(iW+gap);try{const ie=await loadImage(photo.src);if(ie){const fmt=photo.src.startsWith("data:image/png")?"PNG":"JPEG";doc.addImage(photo.src,fmt,x,rY,iW,iH,undefined,"MEDIUM");}}catch(_){}doc.setFontSize(5.5);doc.setTextColor(170,170,170);doc.text(photo.ts||"",x+iW/2,rY+iH+3,{align:"center"});doc.setDrawColor(229,229,229);doc.setLineWidth(0.2);doc.rect(x,rY,iW,iH);col++;if(col>=perRow){col=0;rY+=iH+8;y=rY;}}
      if(col>0){y=rY+iH+8;}y+=2;}}
  chk(44);y+=2;doc.setDrawColor(229,229,229);doc.setLineWidth(0.3);doc.line(ML,y,W-MR,y);y+=7;
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(153,153,153);doc.text("SIGNATURE DU CLIENT",ML,y);y+=5;
  if(t.signedBy){doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(17,17,17);doc.text(t.signedBy,ML,y);y+=4;doc.setFontSize(7.5);doc.setTextColor(136,136,136);doc.text(`Signé le ${fmtDT(t.signedAt)}`,ML,y);y+=5;}
  if(t.signature){const si=await loadImage(t.signature);if(si){doc.setFillColor(255,255,255);doc.setDrawColor(229,229,229);doc.setLineWidth(0.3);doc.roundedRect(ML,y,80,28,2,2,"FD");doc.addImage(t.signature,"PNG",ML+2,y+2,76,24,undefined,"MEDIUM");}y+=32;}
  const pc=doc.internal.getNumberOfPages();for(let i=1;i<=pc;i++){doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(187,187,187);doc.text(`Pimak France · Service Après-Vente · ${t.numero}`,ML,289);doc.text(`Page ${i}/${pc}`,W-ML,289,{align:"right"});}
  return doc.output("blob");
}
async function downloadPDF(t){const blob=await buildPDF(t);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${t.numero}-rapport.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function getPDFDataURL(t){const blob=await buildPDF(t);return new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(blob);});}
async function loadEJS(){if(window.emailjs)return;await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});window.emailjs.init({publicKey:EJS.publicKey});}
async function mailNewTicket(t){if(EJS.publicKey==="YOUR_PUBLIC_KEY")return;try{await loadEJS();await window.emailjs.send(EJS.serviceId,EJS.tplNew,{to_email:EJS.to,ticket_num:t.numero,client:t.client,telephone:t.clientPhone||"—",email:t.clientEmail||"—",equipement:t.equipement,panne:t.panne,technicien:t.technicien||"Non assigné",priorite:t.priorite,date:t.date_ouverture,message:`Nouvelle intervention.\nClient : ${t.client}\nÉquipement : ${t.equipement}\nPanne : ${t.panne}\nTechnicien : ${t.technicien||"—"}\nPriorité : ${t.priorite}`});}catch(e){console.warn("EmailJS new:",e);}}
async function mailDelivery(t){if(EJS.publicKey==="YOUR_PUBLIC_KEY")return;try{await loadEJS();const pdfB64=await getPDFDataURL(t);await window.emailjs.send(EJS.serviceId,EJS.tplDelivery,{to_email:EJS.to,ticket_num:t.numero,client:t.client,equipement:t.equipement,technicien:t.technicien||"—",panne:t.panne,travaux:t.commentaires||"—",signed_by:t.signedBy,livre_at:fmtDT(t.livreAt),message:`Intervention clôturée.\nClient : ${t.client}\nSigné par : ${t.signedBy}\nDate : ${fmtDT(t.livreAt)}`,pdf_content:pdfB64});}catch(e){console.warn("EmailJS delivery:",e);}}

/* ═══════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════ */
const STATUSES={
  Ouvert:      {label:"Ouvert",     dot:"#dc2626",bg:"var(--redbg)",   border:"var(--redborder)"   },
  "En cours":  {label:"En cours",   dot:"#d97706",bg:"var(--amberbg)", border:"var(--amberborder)" },
  "En attente":{label:"En attente", dot:"#7c3aed",bg:"var(--purplebg)",border:"var(--purpleborder)"},
  "Clôturé":   {label:"Clôturé",   dot:"#059669",bg:"var(--greenbg)", border:"var(--greenborder)" },
  "Livré":     {label:"Livré",      dot:"#2563eb",bg:"var(--bluebg)",  border:"var(--blueborder)"  },
};
const PHOTO_PHASES=[{key:"reception",label:"Réception"},{key:"reparation",label:"Réparation"},{key:"apres",label:"Après réparation"}];
const ROLES=["admin","manager","technician"];
const INIT_USERS=[
  {id:"u1",name:"Admin",      email:"admin@pimak.fr", pin:"1234",role:"admin",    active:true },
  {id:"u2",name:"Jean-Pierre",email:"jp@pimak.fr",    pin:"2222",role:"technician",active:true },
  {id:"u3",name:"Sophie",     email:"sophie@pimak.fr",pin:"3333",role:"technician",active:true },
  {id:"u4",name:"Marc",       email:"marc@pimak.fr",  pin:"4444",role:"technician",active:true },
  {id:"u5",name:"Ahmed",      email:"ahmed@pimak.fr", pin:"5555",role:"technician",active:false},
  {id:"u6",name:"Responsable",email:"resp@pimak.fr",  pin:"6666",role:"manager",   active:true },
];
const INIT_TICKETS=[
  {id:1,numero:"PI-001",client:"Restaurant Le Marais",equipement:"Four convection GN 2/1",panne:"Résistance défectueuse",technicien:"Jean-Pierre",departement:"SAV",statut:"En cours",priorite:"Haute",commentaires:"Pièce commandée J+2",date_ouverture:"2026-05-20",date_cloture:"",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:2,numero:"PI-002",client:"Hôtel Lumière Paris",equipement:"Lave-vaisselle tunnel",panne:"Fuite joint d'entrée",technicien:"Sophie",departement:"SAV",statut:"Ouvert",priorite:"Haute",commentaires:"",date_ouverture:"2026-05-24",date_cloture:"",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:3,numero:"PI-003",client:"Brasserie du Port",equipement:"Cellule refroidissement",panne:"Compresseur bruyant",technicien:"Marc",departement:"SAV",statut:"Livré",priorite:"Normale",commentaires:"Compresseur remplacé",date_ouverture:"2026-05-15",date_cloture:"2026-05-22",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"M. Dupont",signedAt:"2026-05-22T14:30:00",livreAt:"2026-05-22T14:30:00"},
  {id:4,numero:"PI-004",client:"Café de Flore",equipement:"Machine à café pro",panne:"Chauffe-eau HS",technicien:"Ahmed",departement:"SAV",statut:"Clôturé",priorite:"Urgente",commentaires:"Remplacé en urgence",date_ouverture:"2026-05-18",date_cloture:"2026-05-19",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:5,numero:"PI-005",client:"Le Grand Véfour",equipement:"Friteuse 2×15L",panne:"Thermostat défaillant",technicien:"Jean-Pierre",departement:"SAV",statut:"En attente",priorite:"Normale",commentaires:"Attente pièce",date_ouverture:"2026-05-25",date_cloture:"",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:6,numero:"PI-006",client:"Brasserie Lipp",equipement:"Salamandre pro",panne:"Résistance grillée",technicien:"Sophie",departement:"SAV",statut:"Ouvert",priorite:"Urgente",commentaires:"",date_ouverture:"2026-05-26",date_cloture:"",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
];
let _id=7;
const uid=()=>Math.random().toString(36).slice(2,8);
const fmtD=iso=>iso?new Date(iso).toLocaleDateString("fr-FR"):"—";
const toB64=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});
const totalP=t=>PHOTO_PHASES.reduce((s,p)=>s+(t.photos?.[p.key]?.length||0),0);
const EMPTY={client:"",clientPhone:"",clientEmail:"",equipement:"",panne:"",technicien:"",departement:"",statut:"Ouvert",priorite:"Normale",commentaires:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""};

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function App(){
  const [lang,   setLang]  = useState(()=>localStorage.getItem("pimak_lang")||"fr");
  const [theme,  setTheme] = useState(()=>localStorage.getItem("pimak_theme")||"auto");
  const [user,   setUser]  = useState(null);
  const [users,  setUsers] = useState(INIT_USERS);
  const [tix,    setTix]   = useState([]);
  const [dbReady,setDbR]   = useState(false);
  const [view,   setView]  = useState("dashboard");
  const [sel,    setSel]   = useState(null);
  const [sheet,  setSheet] = useState(null);
  const [toast,  setToast] = useState(null);
  const [lb,     setLb]    = useState(null);
  const [phase,  setPhase] = useState("reception");
  const [dname,  setDname] = useState("");
  const [eUser,  setEUser] = useState(null);
  const [sending,setSend]  = useState(false);

  // Persist prefs
  useEffect(()=>{localStorage.setItem("pimak_lang",lang);},[lang]);
  useEffect(()=>{localStorage.setItem("pimak_theme",theme);},[theme]);

  // Resolve actual theme
  const isDark = theme==="dark" || (theme==="auto" && window.matchMedia("(prefers-color-scheme:dark)").matches);
  const resolvedTheme = isDark ? "dark" : "light";
  const CSS = makeCSS(resolvedTheme);

  // Firebase: listen tickets
  useEffect(()=>{
    const q=query(collection(db,"tickets"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      const data=snap.docs.map(d=>({...d.data(),fireId:d.id}));
      setTix(data); setDbR(true);
      setSel(prev=>prev?(data.find(tk=>tk.fireId===prev.fireId)||prev):null);
    },()=>{setTix(INIT_TICKETS);setDbR(true);});
    return ()=>unsub();
  },[]);

  // Firebase: listen users
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"users"),snap=>{
      if(!snap.empty)setUsers(snap.docs.map(d=>({...d.data(),fireId:d.id})));
    },()=>{});
    return ()=>unsub();
  },[]);

  const t=(key,vars)=>tx(lang,key,vars);
  const say=(msg,err)=>{setToast({msg,err});setTimeout(()=>setToast(null),2800);};
  const closeSheet=()=>{setSheet(null);setDname("");setEUser(null);};

  const isAdmin   = user?.role==="admin";
  const isManager = user?.role==="manager" || isAdmin;
  const isTech    = user?.role==="technician";

  // Ticket mutation (local + Firebase)
  const mut=async(id,patch)=>{
    const fn=tk=>{
      if(tk.fireId!==id&&tk.id!==id)return tk;
      const u={...tk,...patch};
      if(patch.statut==="Clôturé"&&!tk.date_cloture)u.date_cloture=new Date().toISOString().split("T")[0];
      return u;
    };
    setTix(p=>p.map(fn)); setSel(p=>p?fn(p):p);
    try{
      const tk=tix.find(t=>t.fireId===id||t.id===id);
      if(tk?.fireId){
        const cp={...patch};
        if(patch.statut==="Clôturé"&&!tk.date_cloture)cp.date_cloture=new Date().toISOString().split("T")[0];
        await updateDoc(doc(db,"tickets",tk.fireId),cp);
      }
    }catch(e){console.warn("Firestore:",e);}
  };

  const addPhotos=async(id,ph,files)=>{
    const arr=await Promise.all(Array.from(files).map(toB64));
    const photos=arr.map(src=>({src,id:uid(),ts:new Date().toLocaleString("fr-FR")}));
    const tk=tix.find(t=>t.fireId===id||t.id===id);
    if(!tk)return;
    await mut(id,{photos:{...tk.photos,[ph]:[...(tk.photos[ph]||[]),...photos]}});
    say(t("t_photos",{n:photos.length}));
  };

  const rmPhoto=async(id,ph,pid)=>{
    const tk=tix.find(t=>t.fireId===id||t.id===id);
    if(!tk)return;
    await mut(id,{photos:{...tk.photos,[ph]:tk.photos[ph].filter(x=>x.id!==pid)}});
    say(t("t_photo_rm"));
  };

  const createTicket=async(form)=>{
    const ts=Date.now();
    const numero=`PI-${String(ts).slice(-5)}`;
    // If technician: force assign to self
    const finalForm = isTech ? {...form,technicien:user.name} : form;
    const tk={...finalForm,numero,date_ouverture:new Date().toISOString().split("T")[0],date_cloture:"",createdAt:serverTimestamp(),createdBy:user?.name||""};
    let saved=tk;
    try{
      const ref=await addDoc(collection(db,"tickets"),tk);
      saved={...tk,fireId:ref.id};
    }catch(e){saved={...tk,id:_id++};setTix(p=>[saved,...p]);}
    setSel(saved);setView("detail");setSheet("qr");
    say(t("t_created",{n:numero}));
    setSend(true);await mailNewTicket(saved);setSend(false);
  };

  const confirmDelivery=async(sig)=>{
    const now=new Date().toISOString();
    const patch={signature:sig,signedBy:dname,signedAt:now,livreAt:now,statut:"Livré"};
    const updated={...sel,...patch};
    await mut(sel.fireId||sel.id,patch);
    closeSheet();say(t("t_delivery"));
    setSend(true);await mailDelivery(updated);setSend(false);
    say(t("t_mail"));
  };

  const deleteTicket=async(tk)=>{
    try{
      if(tk.fireId)await deleteDoc(doc(db,"tickets",tk.fireId));
      setTix(p=>p.filter(x=>x.fireId!==tk.fireId&&x.id!==tk.id));
      if(sel?.fireId===tk.fireId||sel?.id===tk.id){setSel(null);setView("list");}
      closeSheet();say(t("t_deleted"));
    }catch(e){say("Erreur",true);}
  };

  const printQR=(tk,appUrl)=>{
    const ticketUrl=`${appUrl}?ticket=${tk.numero}`;
    const qr=`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticketUrl)}&bgcolor=ffffff&color=111111&margin=12`;
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>${tk.numero}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:-apple-system,sans-serif}.c{border:1.5px solid #e5e5e5;border-radius:14px;padding:22px;text-align:center;width:240px}.b{font-size:10px;font-weight:700;letter-spacing:3px;color:#111;margin-bottom:2px}.s{font-size:8px;color:#aaa;letter-spacing:1px;margin-bottom:14px}img{width:156px;height:156px;display:block;margin:0 auto}.n{font-size:19px;font-weight:700;margin:12px 0 3px}.cl{font-size:11px;color:#555}.eq{font-size:10px;color:#aaa;margin-top:2px}.d{font-size:9px;color:#ccc;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body onload="window.print()"><div class="c"><div class="b">PIMAK FRANCE</div><div class="s">SERVICE APRÈS-VENTE</div><img src="${qr}"/><div class="n">${tk.numero}</div><div class="cl">${tk.client}</div><div class="eq">${tk.equipement}</div><div class="d">Ouvert le ${tk.date_ouverture}</div></div></body></html>`);
    w.document.close();
  };

  // Handle ?ticket=PI-xxx deep link
  useEffect(()=>{
    if(!dbReady||!tix.length)return;
    const params=new URLSearchParams(window.location.search);
    const num=params.get("ticket");
    if(num){
      const found=tix.find(tk=>tk.numero===num);
      if(found){openTicket(found);window.history.replaceState({},"",window.location.pathname);}
    }
  },[dbReady,tix]);

  const openTicket=tk=>{setSel(tk);setPhase("reception");setView("detail");};
  const goBack=()=>{setView("list");setSel(null);};

  const visibleTix = isTech ? tix.filter(tk=>tk.technicien===user?.name) : tix;
  const stats={
    total:visibleTix.length,
    ouvert:visibleTix.filter(tk=>tk.statut==="Ouvert").length,
    cours:visibleTix.filter(tk=>tk.statut==="En cours").length,
    urgent:visibleTix.filter(tk=>tk.priorite==="Urgente"&&tk.statut!=="Livré").length,
    livre:visibleTix.filter(tk=>tk.statut==="Livré").length,
    cloture:visibleTix.filter(tk=>tk.statut==="Clôturé").length,
  };

  // Tech stats for admin dashboard
  const techStats=isManager ? users.filter(u=>u.role==="technician"&&u.active).map(u=>({
    name:u.name,
    open: tix.filter(tk=>tk.technicien===u.name&&tk.statut==="Ouvert").length,
    ongoing:tix.filter(tk=>tk.technicien===u.name&&tk.statut==="En cours").length,
    done:tix.filter(tk=>tk.technicien===u.name&&(tk.statut==="Clôturé"||tk.statut==="Livré")).length,
    urgent:tix.filter(tk=>tk.technicien===u.name&&tk.priorite==="Urgente"&&tk.statut!=="Livré").length,
  })) : [];

  const myTix=isTech?tix.filter(tk=>tk.technicien===user?.name&&tk.statut!=="Livré"):[];
  const appUrl=window.location.origin+window.location.pathname;

  const sheetTitles={qr:t("sheet_qr"),scan:t("sheet_scan"),deliver:t("sheet_deliver"),sig:t("sheet_sig"),photos:t("sheet_photos"),newUser:t("sheet_new_user"),editUser:t("sheet_edit_user"),editTicket:t("sheet_edit_ticket"),deleteConfirm:t("sheet_delete")};

  if(!user)return <LoginScreen users={users} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} CSS={CSS} onLogin={u=>{setUser(u);setView("dashboard");}}/>;

  if(!dbReady)return(
    <div style={{background:"var(--bg)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <style>{CSS}</style>
      <div style={{width:32,height:32,border:"2.5px solid var(--b1)",borderTopColor:"var(--t0)",borderRadius:"50%",animation:"spin .8s linear infinite",marginBottom:16}}/>
      <div style={{fontSize:12,color:"var(--t2)"}}>Connexion…</div>
    </div>
  );

  return(
    <div style={{background:"var(--bg)",minHeight:"100vh",paddingBottom:"var(--nav-h)",fontFamily:FONT}}>
      <style>{CSS}</style>

      {/* Lightbox */}
      {lb&&<div onClick={()=>setLb(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.96)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fade .2s ease"}}><img src={lb} alt="" style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:10,objectFit:"contain"}}/></div>}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:toast.err?"var(--red)":"var(--t0)",color:"#fff",padding:"9px 20px",borderRadius:R.full,fontSize:12,fontWeight:500,whiteSpace:"nowrap",animation:"toast .2s ease",boxShadow:"0 4px 20px rgba(0,0,0,0.25)",display:"flex",alignItems:"center",gap:8}}>{sending&&<span style={{width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>}{toast.msg}</div>}

      {/* Sheet overlay */}
      {sheet&&<div onClick={e=>{if(e.target===e.currentTarget)closeSheet();}} style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(10px)",animation:"fade .2s ease"}}>
        <Sheet title={sheetTitles[sheet]||""} onClose={closeSheet}>
          {sheet==="qr"&&sel&&<QRSticker t={sel} lang={lang} appUrl={appUrl} onPrint={()=>printQR(sel,appUrl)}/>}
          {sheet==="scan"&&<ScanSheet tickets={tix} lang={lang} onSelect={tk=>{openTicket(tk);closeSheet();}}/>}
          {sheet==="deliver"&&sel&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"var(--s1)",borderRadius:R.md,padding:"10px 12px",fontSize:12,color:"var(--t1)"}}>{sel.numero} · {sel.client}</div>
            <FL label={t("d_cname")}><input value={dname} onChange={e=>setDname(e.target.value)} placeholder={t("d_ph")}/></FL>
            <Btn color="green" onClick={()=>{if(dname.trim())setSheet("sig");else say(t("name_req"),true);}}>{t("btn_sign")}</Btn>
          </div>}
          {sheet==="sig"&&<SigCanvas lang={lang} onDone={confirmDelivery} onBack={()=>setSheet("deliver")}/>}
          {sheet==="photos"&&sel&&<div>
            <div style={{display:"flex",gap:4,marginBottom:14}}>
              {PHOTO_PHASES.map((p,i)=>{
                const labels=[t("p_rec"),t("p_rep"),t("p_aft")];
                const cnt=sel.photos?.[p.key]?.length||0;const act=phase===p.key;
                return <button key={p.key} onClick={()=>setPhase(p.key)} style={{flex:1,padding:"9px 4px",borderRadius:R.md,border:`1px solid ${act?"var(--b2)":"var(--b0)"}`,background:act?"var(--s0)":"transparent",color:act?"var(--t0)":"var(--t2)",fontSize:11,fontWeight:act?600:400,transition:"all .15s"}}>{labels[i]}{cnt>0&&<span style={{opacity:.6}}> ·{cnt}</span>}</button>;
              })}
            </div>
            <PhotoZone lang={lang} photos={sel.photos?.[phase]||[]} onAdd={f=>addPhotos(sel.fireId||sel.id,phase,f)} onRemove={pid=>rmPhoto(sel.fireId||sel.id,phase,pid)} onView={setLb}/>
          </div>}
          {sheet==="newUser"&&isAdmin&&<UserForm lang={lang} onSave={async u=>{try{await addDoc(collection(db,"users"),{...u,active:true});}catch(e){setUsers(p=>[...p,{...u,id:uid(),active:true}]);}closeSheet();say(t("t_user",{n:u.name}));}}/>}
          {sheet==="editUser"&&eUser&&isAdmin&&<UserForm lang={lang} init={eUser} onSave={async u=>{try{if(eUser.fireId)await updateDoc(doc(db,"users",eUser.fireId),u);else setUsers(p=>p.map(x=>x.id===eUser.id?{...x,...u}:x));}catch(e){setUsers(p=>p.map(x=>x.id===eUser.id?{...x,...u}:x));}closeSheet();say(t("t_modified"));}}/>}
          {sheet==="editTicket"&&sel&&isManager&&<TicketEditForm lang={lang} ticket={sel} users={users} onSave={async form=>{await mut(sel.fireId||sel.id,form);closeSheet();say(t("t_modified"));}}/>}
          {sheet==="deleteConfirm"&&sel&&isAdmin&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"var(--redbg)",border:"1px solid var(--redborder)",borderRadius:R.md,padding:"14px"}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--red)",marginBottom:3}}>{sel.numero}</div>
              <div style={{fontSize:12,color:"var(--t1)"}}>{sel.client} · {sel.equipement}</div>
              <div style={{fontSize:11,color:"var(--red)",marginTop:6,opacity:.7}}>{t("delete_sub")}</div>
            </div>
            <Btn color="red" onClick={()=>deleteTicket(sel)}>{t("btn_confirm_delete")}</Btn>
            <Btn variant="secondary" onClick={closeSheet}>{t("btn_cancel")}</Btn>
          </div>}
        </Sheet>
      </div>}

      {/* ── HEADER ── */}
      <header style={{position:"sticky",top:0,zIndex:100,background:isDark?"rgba(10,10,10,0.9)":"rgba(245,245,245,0.9)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:"1px solid var(--b0)",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {view==="detail"&&<button onClick={goBack} style={{background:"none",border:"none",color:"var(--t1)",fontSize:18,padding:"4px 8px 4px 0",lineHeight:1}}>←</button>}
          <span style={{fontSize:13,fontWeight:700,letterSpacing:"0.08em",color:"var(--t0)"}}>PIMAK</span>
          {view==="detail"&&sel&&<span style={{fontSize:12,color:"var(--t2)",fontVariantNumeric:"tabular-nums"}}>{sel.numero}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* Theme toggle */}
          <button onClick={()=>setTheme(t=>t==="auto"?"light":t==="light"?"dark":"auto")} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.full,padding:"4px 10px",fontSize:11,color:"var(--t1)",cursor:"pointer",fontFamily:FONT}}>
            {theme==="auto"?"●":theme==="light"?"☀":"☾"}
          </button>
          {/* Lang */}
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{fontSize:10,padding:"4px 7px",borderRadius:R.sm,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",width:"auto",fontFamily:FONT}}>
            {Object.entries(LANGS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          {view==="detail"&&sel&&<><StatusPill s={STATUSES[sel.statut]}>{STATUSES[sel.statut]?.label}</StatusPill><MiniBtn onClick={()=>setSheet("qr")}>QR</MiniBtn></>}
          <MiniBtn onClick={()=>setSheet("scan")}>⌖</MiniBtn>
          <MiniBtn onClick={()=>{setUser(null);setView("dashboard");}}>⏻</MiniBtn>
        </div>
      </header>

      <main style={{maxWidth:580,margin:"0 auto",padding:"14px 12px"}}>

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard"&&<div style={{animation:"up .2s ease"}}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:21,fontWeight:700,color:"var(--t0)"}}>{t("hello")}, {user.name}</div>
            <div style={{fontSize:12,color:"var(--t2)",marginTop:3}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>

          {/* KPI grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
            {[
              {label:t("stat_open"),    value:stats.ouvert, dot:"#dc2626"},
              {label:t("stat_ongoing"), value:stats.cours,  dot:"#d97706"},
              {label:t("stat_urgent"),  value:stats.urgent, dot:"#7c3aed"},
              {label:t("stat_delivered"),value:stats.livre, dot:"#2563eb"},
              {label:"Clôturés",        value:stats.cloture,dot:"#059669"},
              {label:t("stat_total"),   value:stats.total,  dot:"var(--t2)"},
            ].map(s=><div key={s.label} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"13px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{width:5,height:5,borderRadius:"50%",background:s.dot,display:"inline-block"}}/><span style={{fontSize:9,color:"var(--t2)",fontWeight:500,letterSpacing:"0.03em",textTransform:"uppercase"}}>{s.label}</span></div>
              <div style={{fontSize:27,fontWeight:700,color:"var(--t0)",lineHeight:1}}>{s.value}</div>
            </div>)}
          </div>

          {/* Urgent banner */}
          {stats.urgent>0&&<div onClick={()=>setView("list")} style={{background:"var(--redbg)",border:"1px solid var(--redborder)",borderRadius:R.lg,padding:"12px 14px",marginBottom:10,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--red)"}}>{stats.urgent===1?t("urgent_one"):t("urgent_many",{n:stats.urgent})}</div>
            <span style={{color:"var(--red)",fontSize:14}}>→</span>
          </div>}

          {/* Technician performance table (admin/manager) */}
          {isManager&&techStats.length>0&&<>
            <SL>{t("db_tech_perf")}</SL>
            <div style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,overflow:"hidden",marginBottom:10}}>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 44px 44px",gap:0,padding:"8px 12px",borderBottom:"1px solid var(--b0)"}}>
                {["",t("db_open"),t("db_ongoing"),t("db_done"),t("db_urgent")].map((h,i)=><div key={i} style={{fontSize:9,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:"0.05em",textAlign:i>0?"center":"left"}}>{h}</div>)}
              </div>
              {techStats.map((ts,i)=><div key={ts.name} style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 44px 44px",gap:0,padding:"10px 12px",borderBottom:i<techStats.length-1?"1px solid var(--b0)":"none",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:26,height:26,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"var(--t1)",flexShrink:0}}>{ts.name[0]}</div>
                  <span style={{fontSize:12,fontWeight:500,color:"var(--t0)"}}>{ts.name}</span>
                </div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:600,color:ts.open>0?"var(--red)":"var(--t2)"}}>{ts.open}</div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:600,color:ts.ongoing>0?"var(--amber)":"var(--t2)"}}>{ts.ongoing}</div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:600,color:ts.done>0?"var(--green)":"var(--t2)"}}>{ts.done}</div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:600,color:ts.urgent>0?"var(--purple)":"var(--t2)"}}>{ts.urgent||"—"}</div>
              </div>)}
            </div>
          </>}

          {/* My tickets (tech) */}
          {isTech&&myTix.length>0&&<><SL>{t("my_tickets")}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
              {myTix.slice(0,3).map(tk=><TRow key={tk.fireId||tk.id} t={tk} onSel={openTicket} np={totalP(tk)}/>)}
            </div>
          </>}

          {/* Recent (manager/admin) */}
          {isManager&&<><SL>{t("db_recent")}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {tix.filter(tk=>tk.statut!=="Livré").slice(0,5).map(tk=><TRow key={tk.fireId||tk.id} t={tk} onSel={openTicket} np={totalP(tk)}/>)}
            </div>
            {tix.filter(tk=>tk.statut!=="Livré").length>5&&<button onClick={()=>setView("list")} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:R.md,border:"1px solid var(--b0)",background:"none",color:"var(--t1)",fontSize:11,cursor:"pointer",fontFamily:FONT}}>{t("see_all",{n:tix.filter(tk=>tk.statut!=="Livré").length})}</button>}
          </>}
        </div>}

        {/* ══ LIST ══ */}
        {view==="list"&&<TicketListView tickets={visibleTix} onSel={openTicket} lang={lang}/>}

        {/* ══ NEW ══ */}
        {view==="new"&&<NewForm users={users} onCreate={createTicket} lang={lang} user={user}/>}

        {/* ══ DETAIL ══ */}
        {view==="detail"&&sel&&<div style={{animation:"up .2s ease"}}>
          <Card mb={8}>
            {[[t("lbl_client"),sel.client],[t("lbl_phone"),sel.clientPhone||"—"],[t("lbl_email"),sel.clientEmail||"—"],[t("lbl_equip"),sel.equipement],[t("lbl_tech"),sel.technicien||t("db_no_tech")],[t("lbl_dept"),sel.departement||"—"],[t("lbl_open"),sel.date_ouverture],[t("lbl_prio"),sel.priorite],...(sel.livreAt?[[t("lbl_del"),fmtDT(sel.livreAt)]]:[])]
              .map(([l,v],i,a)=><IRow key={l} label={l} last={i===a.length-1}>{v}</IRow>)}
          </Card>

          <SL>{t("s_fault")}</SL>
          <Card mb={8}><div style={{padding:"11px 13px",fontSize:13,color:"var(--t1)",lineHeight:1.7}}>{sel.panne}</div></Card>

          {sel.commentaires&&<><SL>{t("s_notes")}</SL>
            <Card mb={8}><div style={{padding:"11px 13px",fontSize:13,color:"var(--t1)",lineHeight:1.7,whiteSpace:"pre-line"}}>{sel.commentaires}</div></Card>
          </>}

          {sel.signature&&<><SL>{t("s_delivery")}</SL>
            <Card mb={8}><div style={{padding:"12px 13px"}}>
              <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>{t("signed_by")} <strong>{sel.signedBy}</strong> · {fmtDT(sel.signedAt)}</div>
              <img src={sel.signature} onClick={()=>setLb(sel.signature)} style={{maxWidth:180,borderRadius:8,border:"1px solid var(--b0)",cursor:"pointer",display:"block",marginBottom:10}}/>
              <button onClick={async()=>{say(t("t_pdf"));await downloadPDF(sel);say(t("t_pdf_ok"));}} style={{background:"none",border:"none",color:"var(--blue)",fontSize:12,cursor:"pointer",padding:0,fontFamily:FONT,fontWeight:500}}>{t("dl_pdf")} →</button>
            </div></Card>
          </>}

          <SL>{t("s_actions")}</SL>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
            <Btn color="blue" onClick={()=>setSheet("photos")}>{t("btn_photos").replace("{n}",totalP(sel)>0?` · ${totalP(sel)}`:"")} </Btn>
            {!sel.signature&&<Btn color="green" onClick={()=>setSheet("deliver")}>{t("btn_deliver")}</Btn>}
            <Btn color="amber" onClick={()=>setSheet("qr")}>{t("btn_qr")}</Btn>
            <Btn color="purple" onClick={async()=>{say(t("t_pdf"));await downloadPDF(sel);say(t("t_pdf_ok"));}}>{t("dl_pdf")}</Btn>
            {isManager&&<div style={{display:"grid",gridTemplateColumns:"1fr"+(isAdmin?" 1fr":""),gap:7,marginTop:2}}>
              <Btn color="black" onClick={()=>setSheet("editTicket")}>{t("btn_edit_ticket")}</Btn>
              {isAdmin&&<Btn color="red" onClick={()=>setSheet("deleteConfirm")}>{t("btn_delete_ticket")}</Btn>}
            </div>}
          </div>

          <SL>{t("s_status")}</SL>
          <Card mb={8}><div style={{padding:"11px 13px",display:"flex",flexWrap:"wrap",gap:6}}>
            {Object.entries(STATUSES).map(([k,v])=>{const act=sel.statut===k;return <button key={k} onClick={()=>{mut(sel.fireId||sel.id,{statut:k});say(t("t_status",{s:v.label}));}} style={{padding:"6px 12px",borderRadius:R.full,border:`1px solid ${act?v.dot:v.border}`,background:act?v.bg:"transparent",color:act?v.dot:"var(--t2)",fontSize:11,fontWeight:act?700:400,display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}>
              {act&&<span style={{width:4,height:4,borderRadius:"50%",background:v.dot,display:"inline-block"}}/>}{v.label}
            </button>;})}
          </div></Card>

          <SL>{t("s_note")}</SL>
          <Card><NoteInput lang={lang} onAdd={txt=>{const d=new Date().toLocaleDateString("fr-FR");mut(sel.fireId||sel.id,{commentaires:sel.commentaires?`${sel.commentaires}\n[${d}] ${txt}`:`[${d}] ${txt}`});say(t("t_note"));}}/></Card>
        </div>}

        {/* ══ SETTINGS ══ */}
        {view==="settings"&&<div style={{animation:"up .2s ease"}}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{t("settings")}</div>
          {isAdmin&&<Btn color="blue" style={{marginBottom:12}} onClick={()=>setSheet("newUser")}>{t("btn_new_user")}</Btn>}
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
            {users.map(u=><div key={u.id||u.fireId} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:u.active?1:0.4}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--t1)",flexShrink:0}}>{u.name[0]}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--t0)"}}>{u.name}</div>
                  <div style={{fontSize:11,color:"var(--t2)"}}>{u.role==="admin"?t("role_admin"):u.role==="manager"?t("role_manager"):t("role_tech")} · {u.email}</div>
                </div>
              </div>
              {isAdmin&&u.id!==user.id&&u.fireId!==user.fireId&&<div style={{display:"flex",gap:5}}>
                <MiniBtn onClick={()=>{setEUser(u);setSheet("editUser");}}>{t("btn_edit")}</MiniBtn>
                <MiniBtn onClick={()=>{const id=u.fireId||u.id;if(u.fireId)updateDoc(doc(db,"users",u.fireId),{active:!u.active}).catch(()=>{});setUsers(p=>p.map(x=>(x.id===id||x.fireId===id)?{...x,active:!x.active}:x));say(u.active?t("t_off"):t("t_on"));}}>{u.active?t("btn_off"):t("btn_on")}</MiniBtn>
              </div>}
            </div>)}
          </div>
          {/* Theme & Lang settings */}
          <SL>{t("theme")}</SL>
          <div style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",marginBottom:12,display:"flex",gap:8}}>
            {[["auto",t("theme_auto")],["light",t("theme_light")],["dark",t("theme_dark")]].map(([k,label])=><button key={k} onClick={()=>setTheme(k)} style={{flex:1,padding:"8px",borderRadius:R.md,border:`1px solid ${theme===k?"var(--b2)":"var(--b0)"}`,background:theme===k?"var(--s2)":"transparent",color:theme===k?"var(--t0)":"var(--t2)",fontSize:12,fontWeight:theme===k?600:400,fontFamily:FONT}}>{label}</button>)}
          </div>
          <div style={{padding:"12px 14px",background:"var(--s1)",borderRadius:R.lg,fontSize:11,color:"var(--t2)",lineHeight:1.9}}>
            <div style={{fontWeight:600,color:"var(--t1)",marginBottom:3}}>{t("my_account")}</div>
            {user.name} · {user.role==="admin"?t("role_admin"):user.role==="manager"?t("role_manager"):t("role_tech")}<br/>
            {user.email} · PIN {"·".repeat(user.pin?.length||4)}
          </div>
        </div>}

      </main>

      {/* ══ BOTTOM NAV ══ */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:isDark?"rgba(10,10,10,0.95)":"rgba(255,255,255,0.95)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid var(--b0)",height:"var(--nav-h)",paddingBottom:"env(safe-area-inset-bottom,8px)",display:"flex",alignItems:"stretch"}}>
        {[
          {k:"dashboard", icon:"⊞", label:t("nav_home")},
          {k:"list",      icon:"≡", label:t("nav_tickets")},
          ...(!isTech?[{k:"new",icon:"+",label:t("nav_new")}]:[]),
          {k:"settings",  icon:"⊙", label:t("nav_team")},
        ].map(nav=>{
          const active=view===nav.k;
          return <button key={nav.k} onClick={()=>{setView(nav.k);setSel(null);}} style={{flex:1,background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",position:"relative",paddingTop:6}}>
            {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:3,borderRadius:"0 0 3px 3px",background:"var(--t0)",display:"block"}}/>}
            <span style={{fontSize:nav.k==="new"?22:18,lineHeight:1,color:active?"var(--t0)":"var(--t2)",transition:"color .15s",fontWeight:nav.k==="new"?300:400}}>{nav.icon}</span>
            <span style={{fontSize:10,fontWeight:active?700:400,color:active?"var(--t0)":"var(--t2)",letterSpacing:"0.02em",transition:"color .15s"}}>{nav.label}</span>
          </button>;
        })}
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════ */
function LoginScreen({users,lang,setLang,theme,setTheme,CSS,onLogin}){
  const t=k=>tx(lang,k);
  const isDark=theme==="dark"||(theme==="auto"&&window.matchMedia("(prefers-color-scheme:dark)").matches);
  const [step,setStep]=useState("pick");const [picked,setPicked]=useState(null);const [pin,setPin]=useState("");const [shake,setShake]=useState(false);
  const tap=d=>{const next=pin+d;setPin(next);if(next.length===picked.pin.length){if(next===picked.pin)onLogin(picked);else{setShake(true);setPin("");setTimeout(()=>setShake(false),500);}}};
  return <div style={{background:"var(--bg)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:FONT}}>
    <style>{CSS}</style>
    <div style={{position:"absolute",top:16,right:16,display:"flex",gap:6}}>
      <button onClick={()=>setTheme(t=>t==="auto"?"light":t==="light"?"dark":"auto")} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.full,padding:"4px 10px",fontSize:11,color:"var(--t1)",cursor:"pointer",fontFamily:FONT}}>{theme==="auto"?"●":theme==="light"?"☀":"☾"}</button>
      <select value={lang} onChange={e=>setLang(e.target.value)} style={{fontSize:10,padding:"4px 7px",borderRadius:R.sm,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontFamily:FONT}}>
        {Object.entries(LANGS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
    </div>
    <div style={{marginBottom:36,textAlign:"center"}}>
      <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.14em",color:"var(--t0)"}}>PIMAK FRANCE</div>
      <div style={{fontSize:10,color:"var(--t2)",marginTop:4,letterSpacing:"0.08em"}}>{t("brand_sub").toUpperCase()}</div>
    </div>
    {step==="pick"
      ?<div style={{width:"100%",maxWidth:320}}>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:12,textAlign:"center"}}>{t("login_who")}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {users.filter(u=>u.active).map(u=><button key={u.id||u.fireId} onClick={()=>{setPicked(u);setStep("pin");setPin("");}} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
            <div style={{width:36,height:36,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--t1)",flexShrink:0}}>{u.name[0]}</div>
            <div><div style={{fontSize:13,fontWeight:600,color:"var(--t0)"}}>{u.name}</div><div style={{fontSize:11,color:"var(--t2)"}}>{u.role==="admin"?t("role_admin"):u.role==="manager"?t("role_manager"):t("role_tech")}</div></div>
          </button>)}
        </div>
       </div>
      :<div style={{width:"100%",maxWidth:270,textAlign:"center"}}>
        <button onClick={()=>{setStep("pick");setPin("");}} style={{background:"none",border:"none",color:"var(--t2)",fontSize:11,cursor:"pointer",marginBottom:20,fontFamily:FONT}}>{t("login_back")}</button>
        <div style={{width:46,height:46,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:"var(--t1)",margin:"0 auto 10px"}}>{picked.name[0]}</div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{picked.name}</div>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:22}}>{t("login_pin")}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:28,animation:shake?"shake .4s ease":""}}>
          {Array.from({length:picked.pin.length}).map((_,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:i<pin.length?(shake?"var(--red)":"var(--t0)"):"var(--b1)",transition:"background .1s"}}/>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=><button key={i} onClick={()=>{if(d==="⌫")setPin(p=>p.slice(0,-1));else if(d!=="")tap(String(d));}} style={{padding:"16px 8px",borderRadius:R.md,border:"1px solid var(--b0)",background:d===""?"transparent":"var(--s0)",color:"var(--t0)",fontSize:18,cursor:d===""?"default":"pointer",opacity:d===""?0:1,fontFamily:FONT}}>{d}</button>)}
        </div>
       </div>
    }
  </div>;
}

/* ═══════════════════════════════════════════
   TICKET LIST VIEW
═══════════════════════════════════════════ */
function TicketListView({tickets,onSel,lang}){
  const [q,setQ]=useState("");const [fs,setFs]=useState(null);
  const filtered=tickets.filter(tk=>{if(fs&&tk.statut!==fs)return false;if(q&&!`${tk.client} ${tk.numero} ${tk.equipement}`.toLowerCase().includes(q.toLowerCase()))return false;return true;});
  return <div style={{animation:"up .2s ease"}}>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder={tx(lang,"search")} style={{marginBottom:10}}/>
    <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:12,paddingBottom:2}}>
      <FC active={!fs} onClick={()=>setFs(null)}>{tx(lang,"all")}</FC>
      {Object.entries(STATUSES).map(([k,v])=><FC key={k} active={fs===k} dot={v.dot} bg={v.bg} border={v.border} onClick={()=>setFs(fs===k?null:k)}>{v.label}</FC>)}
    </div>
    {filtered.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"var(--t2)",fontSize:12}}>{tx(lang,"no_results")}</div>
    :<div style={{display:"flex",flexDirection:"column",gap:7}}>{filtered.map((tk,i)=><TRow key={tk.fireId||tk.id} t={tk} onSel={onSel} np={totalP(tk)} delay={i*15}/>)}</div>}
  </div>;
}

/* ═══════════════════════════════════════════
   NEW TICKET FORM
═══════════════════════════════════════════ */
function NewForm({users,onCreate,lang,user}){
  const t=k=>tx(lang,k);
  const isTech=user?.role==="technician";
  const [f,setF]=useState({...EMPTY,technicien:isTech?user.name:""});
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  const techs=users.filter(u=>u.role==="technician"&&u.active).map(u=>u.name);
  return <div style={{animation:"up .2s ease"}}>
    <div style={{fontSize:18,fontWeight:700,marginBottom:14}}>{t("new_title")}</div>
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      <FL label={t("f_client")}><input value={f.client} onChange={e=>s("client")(e.target.value)} placeholder={t("ph_client")}/></FL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <FL label={t("f_phone")}><input value={f.clientPhone} onChange={e=>s("clientPhone")(e.target.value)} placeholder="+33 6 …" type="tel"/></FL>
        <FL label={t("f_email")}><input value={f.clientEmail} onChange={e=>s("clientEmail")(e.target.value)} placeholder="@" type="email"/></FL>
      </div>
      <FL label={t("f_equip")}><input value={f.equipement} onChange={e=>s("equipement")(e.target.value)} placeholder={t("ph_equip")}/></FL>
      <FL label={t("f_fault")}><textarea value={f.panne} onChange={e=>s("panne")(e.target.value)} rows={3} placeholder={t("ph_fault")}/></FL>
      {/* Technician: if tech, locked to self; if manager/admin, can choose */}
      {isTech
        ?<FL label={t("f_tech")}><input value={user.name} disabled style={{opacity:.6}}/></FL>
        :<FL label={t("f_tech")}><select value={f.technicien} onChange={e=>s("technicien")(e.target.value)}><option value="">— {t("db_no_tech")} —</option>{techs.map(n=><option key={n}>{n}</option>)}</select></FL>
      }
      <FL label={t("f_dept")}><select value={f.departement} onChange={e=>s("departement")(e.target.value)}><option value="">—</option>{["SAV","Commercial","Direction","Logistique"].map(d=><option key={d}>{d}</option>)}</select></FL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <FL label={t("f_prio")}><select value={f.priorite} onChange={e=>s("priorite")(e.target.value)}>{["Normale","Haute","Urgente"].map(p=><option key={p}>{p}</option>)}</select></FL>
        <FL label={t("f_status")}><select value={f.statut} onChange={e=>s("statut")(e.target.value)}>{Object.keys(STATUSES).map(k=><option key={k}>{k}</option>)}</select></FL>
      </div>
      <FL label={t("f_notes")}><textarea value={f.commentaires} onChange={e=>s("commentaires")(e.target.value)} rows={2} placeholder={t("ph_notes")}/></FL>
      <Btn color="green" onClick={()=>{if(!f.client||!f.equipement||!f.panne)return;onCreate(f);}}>{t("btn_create")}</Btn>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════
   TICKET EDIT FORM
═══════════════════════════════════════════ */
function TicketEditForm({ticket,onSave,lang,users}){
  const t=k=>tx(lang,k);
  const [f,setF]=useState({client:ticket.client||"",clientPhone:ticket.clientPhone||"",clientEmail:ticket.clientEmail||"",equipement:ticket.equipement||"",panne:ticket.panne||"",technicien:ticket.technicien||"",departement:ticket.departement||"",priorite:ticket.priorite||"Normale",statut:ticket.statut||"Ouvert",commentaires:ticket.commentaires||""});
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  const techs=users.filter(u=>u.role==="technician"&&u.active).map(u=>u.name);
  return <div style={{display:"flex",flexDirection:"column",gap:9}}>
    <FL label={t("f_client")}><input value={f.client} onChange={e=>s("client")(e.target.value)}/></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <FL label={t("f_phone")}><input value={f.clientPhone} onChange={e=>s("clientPhone")(e.target.value)} type="tel"/></FL>
      <FL label={t("f_email")}><input value={f.clientEmail} onChange={e=>s("clientEmail")(e.target.value)} type="email"/></FL>
    </div>
    <FL label={t("f_equip")}><input value={f.equipement} onChange={e=>s("equipement")(e.target.value)}/></FL>
    <FL label={t("f_fault")}><textarea value={f.panne} onChange={e=>s("panne")(e.target.value)} rows={3}/></FL>
    <FL label={t("f_tech")}><select value={f.technicien} onChange={e=>s("technicien")(e.target.value)}><option value="">— {t("db_no_tech")} —</option>{techs.map(n=><option key={n}>{n}</option>)}</select></FL>
    <FL label={t("f_notes")}><textarea value={f.commentaires} onChange={e=>s("commentaires")(e.target.value)} rows={2}/></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <FL label={t("f_prio")}><select value={f.priorite} onChange={e=>s("priorite")(e.target.value)}>{["Normale","Haute","Urgente"].map(p=><option key={p}>{p}</option>)}</select></FL>
      <FL label={t("f_status")}><select value={f.statut} onChange={e=>s("statut")(e.target.value)}>{Object.keys(STATUSES).map(k=><option key={k}>{k}</option>)}</select></FL>
    </div>
    <Btn color="green" onClick={()=>onSave(f)}>{t("btn_save")}</Btn>
  </div>;
}

/* ═══════════════════════════════════════════
   USER FORM
═══════════════════════════════════════════ */
function UserForm({init,onSave,lang}){
  const t=k=>tx(lang,k);
  const [f,setF]=useState(init||{name:"",email:"",pin:"",role:"technician"});
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <FL label={t("f_name")}><input value={f.name} onChange={e=>s("name")(e.target.value)} placeholder="Jean-Pierre"/></FL>
    <FL label={t("f_email")}><input value={f.email} onChange={e=>s("email")(e.target.value)} placeholder="jp@pimak.fr" type="email"/></FL>
    <FL label={t("f_pin")}><input value={f.pin} onChange={e=>s("pin")(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder={t("pin_hint")} type="password"/></FL>
    <FL label={t("f_role")}><select value={f.role} onChange={e=>s("role")(e.target.value)}><option value="technician">{t("role_tech")}</option><option value="manager">{t("role_manager")}</option><option value="admin">{t("role_admin")}</option></select></FL>
    <Btn color="blue" onClick={()=>{if(!f.name||!f.pin)return;onSave(f);}}>{t("btn_save")}</Btn>
  </div>;
}

/* ═══════════════════════════════════════════
   QR STICKER
═══════════════════════════════════════════ */
function QRSticker({t:ticket,lang,appUrl,onPrint}){
  const tl=k=>tx(lang,k);
  const canvasRef=useRef();const [ready,setReady]=useState(false);const [saving,setSaving]=useState(false);
  // QR encodes the actual ticket URL
  const ticketUrl=`${appUrl}?ticket=${ticket.numero}`;
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticketUrl)}&bgcolor=ffffff&color=111111&margin=10`;
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");const W=400,H=500;canvas.width=W;canvas.height=H;
    ctx.fillStyle="#fff";ctx.beginPath();ctx.roundRect(0,0,W,H,16);ctx.fill();
    ctx.fillStyle="#111";ctx.beginPath();ctx.roundRect(0,0,W,54,{upperLeft:16,upperRight:16,lowerLeft:0,lowerRight:0});ctx.fill();
    ctx.fillStyle="#fff";ctx.font="700 12px Inter,sans-serif";ctx.letterSpacing="3px";ctx.textAlign="center";ctx.fillText("PIMAK FRANCE",W/2,22);
    ctx.font="400 9px Inter,sans-serif";ctx.fillStyle="rgba(255,255,255,0.5)";ctx.letterSpacing="1px";ctx.fillText("SERVICE APRÈS-VENTE",W/2,38);
    const img=new Image();img.crossOrigin="anonymous";
    img.onload=()=>{
      ctx.drawImage(img,100,70,200,200);
      ctx.fillStyle="#111";ctx.font="700 22px Inter,sans-serif";ctx.letterSpacing="0.5px";ctx.textAlign="center";ctx.fillText(ticket.numero,W/2,306);
      ctx.strokeStyle="#f0f0f0";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(28,322);ctx.lineTo(W-28,322);ctx.stroke();
      ctx.fillStyle="#111";ctx.font="500 13px Inter,sans-serif";ctx.letterSpacing="0px";
      ctx.fillText(ticket.client.length>32?ticket.client.slice(0,32)+"…":ticket.client,W/2,344);
      ctx.fillStyle="#888";ctx.font="400 11px Inter,sans-serif";
      ctx.fillText(ticket.equipement.length>40?ticket.equipement.slice(0,40)+"…":ticket.equipement,W/2,363);
      ctx.fillStyle="#aaa";ctx.font="400 10px Inter,sans-serif";ctx.fillText(`${tl("qr_date")} ${ticket.date_ouverture}`,W/2,382);
      ctx.strokeStyle="#e8e8e8";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(.75,.75,W-1.5,H-1.5,16);ctx.stroke();
      ctx.fillStyle="#ccc";ctx.font="400 9px Inter,sans-serif";ctx.fillText(tl("qr_hint"),W/2,468);
      setReady(true);
    };
    img.onerror=()=>{ctx.fillStyle="#f5f5f5";ctx.fillRect(100,70,200,200);ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText("QR Code",W/2,175);setReady(true);};
    img.src=qrUrl;
  },[ticket,lang]);
  const savePNG=()=>{setSaving(true);const url=canvasRef.current.toDataURL("image/png");const a=document.createElement("a");a.href=url;a.download=`${ticket.numero}-sticker.png`;a.click();setTimeout(()=>setSaving(false),800);};
  const printSticker=()=>{const dataUrl=canvasRef.current.toDataURL("image/png");const w=window.open("","_blank");w.document.write(`<html><head><title>Sticker ${ticket.numero}</title><style>*{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f0f0}.w{background:#fff;padding:20px;border-radius:10px}img{width:200px;height:250px;display:block}p{text-align:center;font-size:9px;color:#aaa;margin-top:8px}@media print{body{background:#fff}.w{box-shadow:none;padding:0}p{display:none}}</style></head><body onload="window.print()"><div class="w"><img src="${dataUrl}"/><p>${tl("qr_cut")}</p></div></body></html>`);w.document.close();};
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
    <div style={{background:"var(--greenbg)",border:"1px solid var(--greenborder)",borderRadius:R.full,padding:"4px 14px",fontSize:11,fontWeight:600,color:"var(--green)",marginBottom:14}}>
      {tl("qr_created").replace("{n}",ticket.numero)}
    </div>
    <div style={{borderRadius:R.lg,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",marginBottom:14,border:"1px solid var(--b0)"}}>
      <canvas ref={canvasRef} style={{display:"block",width:200,height:250}}/>
    </div>
    <div style={{fontSize:11,color:"var(--t2)",textAlign:"center",marginBottom:16,lineHeight:1.6}}>{ticket.client}<br/><span style={{color:"var(--t3)"}}>{ticket.equipement}</span></div>
    <div style={{display:"flex",flexDirection:"column",gap:7,width:"100%"}}>
      <Btn color="black" onClick={printSticker} disabled={!ready}>{tl("qr_print")}</Btn>
      <Btn color="blue" onClick={savePNG} disabled={!ready||saving}>{saving?tl("qr_saving"):tl("qr_png")}</Btn>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════
   SCAN SHEET
═══════════════════════════════════════════ */
function ScanSheet({tickets,onSelect,lang}){
  const t=k=>tx(lang,k);
  const [val,setVal]=useState("");const videoRef=useRef();const [camOn,setCamOn]=useState(false);const [camErr,setCamErr]=useState(false);
  useEffect(()=>{let stream;if(!navigator.mediaDevices?.getUserMedia){setCamErr(true);return;}navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(s=>{stream=s;if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();setCamOn(true);}}).catch(()=>setCamErr(true));return()=>stream?.getTracks().forEach(tk=>tk.stop());},[]);
  const tryLookup=()=>{const found=tickets.find(tk=>tk.numero===val.trim().toUpperCase());if(found)onSelect(found);};
  return <div>
    <div style={{borderRadius:R.lg,overflow:"hidden",background:"var(--s2)",aspectRatio:"4/3",marginBottom:12,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {!camErr?<><video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:camOn?"block":"none"}}/>{!camOn&&<div style={{fontSize:11,color:"var(--t2)"}}>…</div>}<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{width:148,height:148,border:"2px solid rgba(255,255,255,.8)",borderRadius:R.md,boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)"}}/></div></>
      :<div style={{textAlign:"center",padding:16,color:"var(--t2)",fontSize:11}}>{t("scan_nocam")}</div>}
    </div>
    <div style={{fontSize:10,color:"var(--t2)",textAlign:"center",marginBottom:10}}>{camOn?t("scan_point"):t("scan_manual")}</div>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <input value={val} onChange={e=>setVal(e.target.value.toUpperCase())} placeholder="PI-001" onKeyDown={e=>e.key==="Enter"&&tryLookup()}/>
      <button onClick={tryLookup} style={{background:"var(--t0)",color:"var(--bg)",border:"none",borderRadius:R.md,padding:"0 16px",fontSize:14,fontWeight:600,flexShrink:0,fontFamily:FONT}}>→</button>
    </div>
    <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{t("scan_active")}</div>
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {tickets.filter(tk=>tk.statut!=="Livré").map(tk=><button key={tk.fireId||tk.id} onClick={()=>onSelect(tk)} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.md,padding:"10px 12px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:FONT}}>
        <div><div style={{fontSize:12,fontWeight:600,color:"var(--t0)",marginBottom:1}}>{tk.numero} · {tk.client}</div><div style={{fontSize:11,color:"var(--t2)"}}>{tk.equipement}</div></div>
        <span style={{width:6,height:6,borderRadius:"50%",background:STATUSES[tk.statut]?.dot,display:"inline-block",flexShrink:0}}/>
      </button>)}
    </div>
  </div>;
}

/* ═══════════════════════════════════════════
   SIGNATURE CANVAS
═══════════════════════════════════════════ */
function SigCanvas({onDone,onBack,lang}){
  const t=k=>tx(lang,k);
  const ref=useRef();const drawing=useRef(false);const [drawn,setDrawn]=useState(false);
  const pos=(e,c)=>{const r=c.getBoundingClientRect(),tc=e.touches?.[0]||e;return{x:(tc.clientX-r.left)*(c.width/r.width),y:(tc.clientY-r.top)*(c.height/r.height)};};
  const start=e=>{e.preventDefault();drawing.current=true;const c=ref.current,ctx=c.getContext("2d"),p=pos(e,c);ctx.beginPath();ctx.moveTo(p.x,p.y);};
  const move=e=>{e.preventDefault();if(!drawing.current)return;setDrawn(true);const c=ref.current,ctx=c.getContext("2d"),p=pos(e,c);ctx.strokeStyle="#111";ctx.lineWidth=2.2;ctx.lineCap="round";ctx.lineJoin="round";ctx.lineTo(p.x,p.y);ctx.stroke();};
  const stop=e=>{e?.preventDefault();drawing.current=false;};
  const clear=()=>{ref.current.getContext("2d").clearRect(0,0,ref.current.width,ref.current.height);setDrawn(false);};
  return <div>
    <div style={{border:"1px solid var(--b1)",borderRadius:R.md,overflow:"hidden",marginBottom:8,background:"#fff",touchAction:"none"}}>
      <canvas ref={ref} width={520} height={170} style={{width:"100%",height:155,display:"block",cursor:"crosshair"}} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop}/>
    </div>
    <div style={{fontSize:10,color:"var(--t2)",textAlign:"center",marginBottom:10}}>{drawn?t("sig_done"):t("sig_hint")}</div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={onBack} style={{padding:"11px 14px",borderRadius:R.md,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontSize:12,fontFamily:FONT}}>←</button>
      <button onClick={clear} style={{padding:"11px 14px",borderRadius:R.md,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontSize:12,fontFamily:FONT}}>{t("sig_clear")}</button>
      <button onClick={()=>drawn&&onDone(ref.current.toDataURL())} style={{flex:1,padding:"11px",borderRadius:R.md,border:"none",background:drawn?"#059669":"var(--s2)",color:drawn?"#fff":"var(--t2)",fontSize:12,fontWeight:600,cursor:drawn?"pointer":"default",fontFamily:FONT}}>{t("sig_confirm")}</button>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════
   PHOTO ZONE
═══════════════════════════════════════════ */
function PhotoZone({photos,onAdd,onRemove,onView,lang}){
  const t=(k,v)=>tx(lang,k,v);const ref=useRef();
  return <div>
    {photos.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:8}}>
      {photos.map(p=><div key={p.id} style={{position:"relative",aspectRatio:"1",borderRadius:R.md,overflow:"hidden"}}>
        <img src={p.src} alt="" onClick={()=>onView(p.src)} style={{width:"100%",height:"100%",objectFit:"cover",cursor:"pointer",display:"block"}}/>
        <button onClick={()=>onRemove(p.id)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",width:20,height:20,borderRadius:R.full,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>)}
    </div>}
    <input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={e=>{if(e.target.files?.length){onAdd(e.target.files);e.target.value="";}}}/>
    <button onClick={()=>ref.current?.click()} style={{width:"100%",padding:"11px",borderRadius:R.md,border:"1px dashed var(--b1)",background:"var(--s1)",color:"var(--t1)",fontSize:12,cursor:"pointer",fontFamily:FONT}}>
      {photos.length===0?t("p_add"):t("p_more",{n:photos.length})}
    </button>
  </div>;
}

/* ═══════════════════════════════════════════
   BASE COMPONENTS
═══════════════════════════════════════════ */
function TRow({t:tk,onSel,np,delay=0}){
  const st=STATUSES[tk.statut]||STATUSES.Ouvert;
  return <div onClick={()=>onSel(tk)} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",cursor:"pointer",animation:"up .2s ease both",animationDelay:`${delay}ms`}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:st.dot,display:"inline-block",flexShrink:0}}/>
        <span style={{fontSize:11,fontWeight:700,color:"var(--t0)",fontVariantNumeric:"tabular-nums"}}>{tk.numero}</span>
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {np>0&&<span style={{fontSize:10,color:"var(--t2)"}}>{np}↑</span>}
        {tk.signature&&<span style={{fontSize:10,color:"var(--green)"}}>✓</span>}
        {tk.priorite==="Urgente"&&<span style={{fontSize:10,color:"var(--red)",fontWeight:700}}>!</span>}
        <StatusPill s={st}>{st.label}</StatusPill>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:600,color:"var(--t0)",marginBottom:2}}>{tk.client}</div>
    <div style={{fontSize:11,color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tk.equipement}</div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
      <span style={{fontSize:10,color:"var(--t2)"}}>{tk.date_ouverture}</span>
      {tk.technicien&&<span style={{fontSize:10,color:"var(--t2)"}}>{tk.technicien}</span>}
    </div>
  </div>;
}

function Sheet({title,onClose,children}){
  return <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:901,background:"var(--s0)",borderRadius:"20px 20px 0 0",maxHeight:"90vh",overflowY:"auto",animation:"sheet .25s ease",maxWidth:600,margin:"0 auto",paddingBottom:"env(safe-area-inset-bottom,20px)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 18px 14px"}}>
      <span style={{fontSize:14,fontWeight:700,color:"var(--t0)"}}>{title}</span>
      <button onClick={onClose} style={{background:"var(--s2)",border:"none",borderRadius:R.full,width:28,height:28,fontSize:13,color:"var(--t1)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>✕</button>
    </div>
    <div style={{padding:"0 18px 24px"}}>{children}</div>
  </div>;
}

function Card({children,mb=0}){return <div style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,overflow:"hidden",marginBottom:mb}}>{children}</div>;}
function IRow({label,children,last}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 13px",borderBottom:last?"none":"1px solid var(--b0)"}}><span style={{fontSize:10,color:"var(--t2)",flexShrink:0,marginRight:14,paddingTop:2}}>{label}</span><span style={{fontSize:12,color:"var(--t0)",textAlign:"right",fontWeight:500}}>{children}</span></div>;}

const BTN_COLORS={black:{bg:"var(--t0)",fg:"var(--bg)",bdr:"transparent"},green:{bg:"var(--greenbg)",fg:"var(--green)",bdr:"var(--greenborder)"},blue:{bg:"var(--bluebg)",fg:"var(--blue)",bdr:"var(--blueborder)"},amber:{bg:"var(--amberbg)",fg:"var(--amber)",bdr:"var(--amberborder)"},red:{bg:"var(--redbg)",fg:"var(--red)",bdr:"var(--redborder)"},purple:{bg:"var(--purplebg)",fg:"var(--purple)",bdr:"var(--purpleborder)"}};
function Btn({children,onClick,color="black",variant,disabled,style:ss}){
  const c=BTN_COLORS[color]||BTN_COLORS.black;
  const isSecondary=variant==="secondary";
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"12px 14px",borderRadius:R.md,border:`1px solid ${disabled?"var(--b0)":isSecondary?"var(--b1)":c.bdr}`,background:disabled?"var(--s1)":isSecondary?"transparent":c.bg,color:disabled?"var(--t2)":isSecondary?"var(--t1)":c.fg,fontSize:12,fontWeight:600,cursor:disabled?"default":"pointer",fontFamily:FONT,...ss}}>{children}</button>;
}
function MiniBtn({children,onClick}){return <button onClick={onClick} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.sm,padding:"4px 9px",fontSize:10,fontWeight:500,color:"var(--t1)",cursor:"pointer",fontFamily:FONT}}>{children}</button>;}
function StatusPill({s,children}){if(!s)return null;return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:R.full,border:`1px solid ${s.border}`,fontSize:10,color:s.dot,background:s.bg,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>;}
function FC({children,active,dot,bg,border,onClick}){return <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:R.full,border:active&&border?`1px solid ${border}`:"1px solid var(--b0)",fontSize:10,fontWeight:active?700:400,color:active&&dot?dot:"var(--t2)",background:active&&bg?bg:"transparent",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,fontFamily:FONT}}>{dot&&active&&<span style={{width:4,height:4,borderRadius:"50%",background:dot,display:"inline-block"}}/>}{children}</button>;}
function FL({label,children}){return <div style={{display:"flex",flexDirection:"column",gap:5}}><div style={{fontSize:10,fontWeight:600,color:"var(--t2)",letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>{children}</div>;}
function SL({children}){return <div style={{fontSize:10,fontWeight:600,color:"var(--t2)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6,marginTop:2}}>{children}</div>;}
function NoteInput({onAdd,lang}){const [v,setV]=useState("");return <div style={{padding:"11px 13px"}}><textarea value={v} onChange={e=>setV(e.target.value)} rows={2} placeholder={tx(lang,"note_ph")} style={{marginBottom:7}}/><Btn color="blue" onClick={()=>{if(v.trim()){onAdd(v.trim());setV("");}}}>{tx(lang,"btn_note")}</Btn></div>;}
