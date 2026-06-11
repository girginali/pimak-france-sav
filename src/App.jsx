import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

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
   TRADUCTIONS — 4 langues
═══════════════════════════════════════════ */
const LANGS = { fr:"Français", en:"English", tr:"Türkçe", es:"Español" };

const T = {
  fr: {
    /* Navigation */
    nav_home:"Accueil", nav_tickets:"Interventions", nav_new:"Nouvelle", nav_team:"Équipe",
    /* Login */
    brand_sub:"Service Après-Vente",
    login_who:"Qui êtes-vous ?",
    login_back:"← Retour",
    login_pin:"Saisir le code PIN",
    role_admin:"Administrateur", role_tech:"Technicien",
    /* Dashboard */
    hello:"Bonjour",
    stat_ongoing:"En cours", stat_open:"Ouverts", stat_delivered:"Livrés", stat_total:"Total",
    urgent_banner_one:"1 intervention urgente",
    urgent_banner_many:"{n} interventions urgentes",
    my_tickets:"Mes interventions",
    recent:"Interventions récentes",
    see_all:"Voir tout ({n})",
    /* Ticket list */
    search_placeholder:"Rechercher…",
    all:"Toutes",
    no_results:"Aucun résultat",
    /* New ticket */
    new_title:"Nouvelle intervention",
    new_required:"* Champ obligatoire",
    field_client:"Client *",
    field_phone:"Téléphone",
    field_email:"Adresse e-mail",
    field_equipment:"Équipement *",
    field_fault:"Panne constatée *",
    field_technician:"Technicien",
    field_department:"Département",
    field_priority:"Priorité",
    field_status:"Statut",
    field_notes:"Notes internes",
    placeholder_client:"Nom du client",
    placeholder_equipment:"Appareil concerné",
    placeholder_fault:"Description du problème",
    placeholder_notes:"Notes ou remarques internes",
    btn_create:"Créer et envoyer la notification",
    /* Detail */
    section_fault:"Panne",
    section_notes:"Notes et travaux effectués",
    section_delivery:"Livraison confirmée",
    section_actions:"Actions",
    section_status:"Modifier le statut",
    section_note_add:"Ajouter une note",
    signed_by:"Signé par",
    download_pdf:"Télécharger le rapport PDF",
    print_delivery:"Imprimer le bon de livraison →",
    btn_photos:"Photos",
    btn_deliver:"Livraison et signature client",
    btn_qr:"Afficher / imprimer le QR Code",
    note_placeholder:"Note interne…",
    btn_add_note:"Ajouter",
    /* Sheet titles */
    sheet_qr:"Étiquette QR Code",
    sheet_scan:"Scanner un QR Code",
    sheet_deliver:"Livraison",
    sheet_sig:"Signature",
    sheet_photos:"Photos d'intervention",
    sheet_new_user:"Nouvel utilisateur",
    sheet_edit_user:"Modifier l'utilisateur",
    /* Delivery sheet */
    delivery_client_name:"Nom du client *",
    delivery_placeholder:"M. Dupont",
    btn_to_sign:"Passer à la signature →",
    name_required:"Le nom du client est requis",
    /* Signature */
    sig_hint:"Signez avec le doigt ou le curseur",
    sig_done:"Signature enregistrée ✓",
    sig_clear:"Effacer",
    sig_confirm:"Confirmer",
    sig_back:"←",
    /* Photos */
    photo_phase_reception:"Réception",
    photo_phase_repair:"Réparation",
    photo_phase_after:"Après réparation",
    photo_add:"Ajouter des photos",
    photo_add_more:"Ajouter · {n} photo(s)",
    /* QR sticker */
    qr_created:"Intervention {n} créée",
    qr_open_date:"Ouvert le",
    qr_scan_hint:"Scanner pour accéder au dossier",
    qr_print:"Imprimer l'étiquette",
    qr_save_png:"Enregistrer en PNG",
    qr_saving:"Enregistrement…",
    qr_cut:"Découper et coller sur l'équipement",
    /* Scan */
    scan_point:"Pointez vers le QR Code",
    scan_no_cam:"Caméra indisponible — saisie manuelle",
    scan_manual:"Saisir manuellement",
    scan_active:"Interventions actives",
    /* Settings */
    settings_title:"Gestion des utilisateurs",
    btn_new_user:"+ Ajouter un utilisateur",
    my_account:"Mon compte",
    btn_edit:"Modifier",
    btn_disable:"Désactiver",
    btn_enable:"Activer",
    /* User form */
    field_name:"Nom complet",
    field_pin:"Code PIN",
    pin_hint:"4 à 6 chiffres",
    field_role:"Rôle",
    btn_save:"Enregistrer",
    /* Toast messages */
    toast_created:"Intervention {n} créée",
    toast_photos_added:"{n} photo(s) ajoutée(s)",
    toast_photo_removed:"Photo supprimée",
    toast_delivery_ok:"Livraison confirmée — envoi du rapport…",
    toast_mail_ok:"Rapport envoyé ✓",
    toast_note_ok:"Note ajoutée",
    toast_modified:"Modifications enregistrées",
    toast_user_added:"{n} ajouté(e)",
    toast_pdf:"Génération du PDF…",
    toast_pdf_ok:"PDF téléchargé ✓",
    toast_status:"Statut mis à jour : {s}",
    toast_activated:"Utilisateur activé",
    toast_deactivated:"Utilisateur désactivé",
    /* Info labels */
    lbl_client:"Client",
    lbl_phone:"Téléphone",
    lbl_email:"Adresse e-mail",
    lbl_equipment:"Équipement",
    lbl_technician:"Technicien",
    lbl_department:"Département",
    lbl_opening:"Date d'ouverture",
    lbl_closing:"Date de clôture",
    lbl_delivery:"Date de livraison",
    lbl_priority:"Priorité",
    /* Priorities */
    prio_normal:"Normale", prio_high:"Haute", prio_urgent:"Urgente",
    /* Departments */
    dept_sav:"SAV", dept_commercial:"Commercial", dept_direction:"Direction", dept_logistics:"Logistique",
    /* Lang picker */
    language:"Langue",
    btn_edit_ticket:"Modifier le ticket",
    btn_delete_ticket:"Supprimer le ticket",
    delete_confirm:"Supprimer cette intervention ?",
    delete_confirm_sub:"Cette action est irréversible.",
    btn_confirm_delete:"Supprimer définitivement",
    btn_cancel:"Annuler",
    toast_deleted:"Intervention supprimée",
    sheet_edit_ticket:"Modifier l'intervention",
  },
  en: {
    nav_home:"Home", nav_tickets:"Jobs", nav_new:"New", nav_team:"Team",
    brand_sub:"After-Sales Service",
    login_who:"Who are you?",
    login_back:"← Back",
    login_pin:"Enter your PIN",
    role_admin:"Administrator", role_tech:"Technician",
    hello:"Hello",
    stat_ongoing:"In progress", stat_open:"Open", stat_delivered:"Delivered", stat_total:"Total",
    urgent_banner_one:"1 urgent job",
    urgent_banner_many:"{n} urgent jobs",
    my_tickets:"My jobs",
    recent:"Recent jobs",
    see_all:"See all ({n})",
    search_placeholder:"Search…",
    all:"All",
    no_results:"No results",
    new_title:"New service job",
    new_required:"* Required field",
    field_client:"Customer *",
    field_phone:"Phone",
    field_email:"Email address",
    field_equipment:"Equipment *",
    field_fault:"Reported fault *",
    field_technician:"Technician",
    field_department:"Department",
    field_priority:"Priority",
    field_status:"Status",
    field_notes:"Internal notes",
    placeholder_client:"Customer name",
    placeholder_equipment:"Equipment concerned",
    placeholder_fault:"Description of the problem",
    placeholder_notes:"Internal notes or remarks",
    btn_create:"Create and send notification",
    section_fault:"Fault",
    section_notes:"Notes and work carried out",
    section_delivery:"Delivery confirmed",
    section_actions:"Actions",
    section_status:"Update status",
    section_note_add:"Add a note",
    signed_by:"Signed by",
    download_pdf:"Download PDF report",
    print_delivery:"Print delivery note →",
    btn_photos:"Photos",
    btn_deliver:"Delivery and customer signature",
    btn_qr:"View / print QR Code",
    note_placeholder:"Internal note…",
    btn_add_note:"Add",
    sheet_qr:"QR Code label",
    sheet_scan:"Scan a QR Code",
    sheet_deliver:"Delivery",
    sheet_sig:"Signature",
    sheet_photos:"Job photos",
    sheet_new_user:"New user",
    sheet_edit_user:"Edit user",
    delivery_client_name:"Customer name *",
    delivery_placeholder:"Mr Smith",
    btn_to_sign:"Proceed to signature →",
    name_required:"Customer name is required",
    sig_hint:"Sign with your finger or cursor",
    sig_done:"Signature saved ✓",
    sig_clear:"Clear",
    sig_confirm:"Confirm",
    sig_back:"←",
    photo_phase_reception:"Reception",
    photo_phase_repair:"Repair",
    photo_phase_after:"After repair",
    photo_add:"Add photos",
    photo_add_more:"Add · {n} photo(s)",
    qr_created:"Job {n} created",
    qr_open_date:"Opened on",
    qr_scan_hint:"Scan to access the job file",
    qr_print:"Print label",
    qr_save_png:"Save as PNG",
    qr_saving:"Saving…",
    qr_cut:"Cut out and stick on the equipment",
    scan_point:"Point at the QR Code",
    scan_no_cam:"Camera unavailable — manual entry",
    scan_manual:"Enter manually",
    scan_active:"Active jobs",
    settings_title:"User management",
    btn_new_user:"+ Add user",
    my_account:"My account",
    btn_edit:"Edit",
    btn_disable:"Disable",
    btn_enable:"Enable",
    field_name:"Full name",
    field_pin:"PIN code",
    pin_hint:"4 to 6 digits",
    field_role:"Role",
    btn_save:"Save",
    toast_created:"Job {n} created",
    toast_photos_added:"{n} photo(s) added",
    toast_photo_removed:"Photo removed",
    toast_delivery_ok:"Delivery confirmed — sending report…",
    toast_mail_ok:"Report sent ✓",
    toast_note_ok:"Note added",
    toast_modified:"Changes saved",
    toast_user_added:"{n} added",
    toast_pdf:"Generating PDF…",
    toast_pdf_ok:"PDF downloaded ✓",
    toast_status:"Status updated: {s}",
    toast_activated:"User enabled",
    toast_deactivated:"User disabled",
    lbl_client:"Customer",
    lbl_phone:"Phone",
    lbl_email:"Email address",
    lbl_equipment:"Equipment",
    lbl_technician:"Technician",
    lbl_department:"Department",
    lbl_opening:"Opening date",
    lbl_closing:"Closing date",
    lbl_delivery:"Delivery date",
    lbl_priority:"Priority",
    prio_normal:"Normal", prio_high:"High", prio_urgent:"Urgent",
    dept_sav:"ASS", dept_commercial:"Commercial", dept_direction:"Management", dept_logistics:"Logistics",
    language:"Language",
    btn_edit_ticket:"Edit ticket",
    btn_delete_ticket:"Delete ticket",
    delete_confirm:"Delete this job?",
    delete_confirm_sub:"This action cannot be undone.",
    btn_confirm_delete:"Delete permanently",
    btn_cancel:"Cancel",
    toast_deleted:"Job deleted",
    sheet_edit_ticket:"Edit job",
  },
  tr: {
    nav_home:"Anasayfa", nav_tickets:"Servisler", nav_new:"Yeni", nav_team:"Ekip",
    brand_sub:"Satış Sonrası Servis",
    login_who:"Kimsiniz?",
    login_back:"← Geri",
    login_pin:"PIN kodunuzu girin",
    role_admin:"Yönetici", role_tech:"Teknisyen",
    hello:"Merhaba",
    stat_ongoing:"Devam ediyor", stat_open:"Açık", stat_delivered:"Teslim edildi", stat_total:"Toplam",
    urgent_banner_one:"1 acil servis",
    urgent_banner_many:"{n} acil servis",
    my_tickets:"Servislerim",
    recent:"Son servisler",
    see_all:"Tümünü gör ({n})",
    search_placeholder:"Ara…",
    all:"Tümü",
    no_results:"Sonuç bulunamadı",
    new_title:"Yeni servis kaydı",
    new_required:"* Zorunlu alan",
    field_client:"Müşteri *",
    field_phone:"Telefon",
    field_email:"E-posta adresi",
    field_equipment:"Ekipman *",
    field_fault:"Bildirilen arıza *",
    field_technician:"Teknisyen",
    field_department:"Departman",
    field_priority:"Öncelik",
    field_status:"Durum",
    field_notes:"İç notlar",
    placeholder_client:"Müşteri adı",
    placeholder_equipment:"İlgili cihaz",
    placeholder_fault:"Arıza açıklaması",
    placeholder_notes:"İç notlar veya açıklamalar",
    btn_create:"Kaydet ve bildirim gönder",
    section_fault:"Arıza",
    section_notes:"Notlar ve yapılan işlemler",
    section_delivery:"Teslim onaylandı",
    section_actions:"İşlemler",
    section_status:"Durumu güncelle",
    section_note_add:"Not ekle",
    signed_by:"İmzalayan",
    download_pdf:"PDF raporu indir",
    print_delivery:"Teslim belgesini yazdır →",
    btn_photos:"Fotoğraflar",
    btn_deliver:"Teslim ve müşteri imzası",
    btn_qr:"QR Kodu görüntüle / yazdır",
    note_placeholder:"İç not…",
    btn_add_note:"Ekle",
    sheet_qr:"QR Kod etiketi",
    sheet_scan:"QR Kod tara",
    sheet_deliver:"Teslim",
    sheet_sig:"İmza",
    sheet_photos:"Servis fotoğrafları",
    sheet_new_user:"Yeni kullanıcı",
    sheet_edit_user:"Kullanıcıyı düzenle",
    delivery_client_name:"Müşteri adı *",
    delivery_placeholder:"Ad Soyad",
    btn_to_sign:"İmza adımına geç →",
    name_required:"Müşteri adı zorunludur",
    sig_hint:"Parmağınızla veya imleçle imzalayın",
    sig_done:"İmza kaydedildi ✓",
    sig_clear:"Temizle",
    sig_confirm:"Onayla",
    sig_back:"←",
    photo_phase_reception:"Kabul",
    photo_phase_repair:"Tamir",
    photo_phase_after:"Tamir sonrası",
    photo_add:"Fotoğraf ekle",
    photo_add_more:"Ekle · {n} fotoğraf",
    qr_created:"{n} kaydı oluşturuldu",
    qr_open_date:"Açılış tarihi",
    qr_scan_hint:"Servise erişmek için okutun",
    qr_print:"Etiketi yazdır",
    qr_save_png:"PNG olarak kaydet",
    qr_saving:"Kaydediliyor…",
    qr_cut:"Kesip cihaza yapıştırın",
    scan_point:"QR Koda doğrultun",
    scan_no_cam:"Kamera kullanılamıyor — manuel giriş",
    scan_manual:"Manuel giriş",
    scan_active:"Aktif servisler",
    settings_title:"Kullanıcı yönetimi",
    btn_new_user:"+ Kullanıcı ekle",
    my_account:"Hesabım",
    btn_edit:"Düzenle",
    btn_disable:"Devre dışı",
    btn_enable:"Etkinleştir",
    field_name:"Ad Soyad",
    field_pin:"PIN kodu",
    pin_hint:"4 ila 6 rakam",
    field_role:"Rol",
    btn_save:"Kaydet",
    toast_created:"{n} kaydı oluşturuldu",
    toast_photos_added:"{n} fotoğraf eklendi",
    toast_photo_removed:"Fotoğraf silindi",
    toast_delivery_ok:"Teslim onaylandı — rapor gönderiliyor…",
    toast_mail_ok:"Rapor gönderildi ✓",
    toast_note_ok:"Not eklendi",
    toast_modified:"Değişiklikler kaydedildi",
    toast_user_added:"{n} eklendi",
    toast_pdf:"PDF oluşturuluyor…",
    toast_pdf_ok:"PDF indirildi ✓",
    toast_status:"Durum güncellendi: {s}",
    toast_activated:"Kullanıcı etkinleştirildi",
    toast_deactivated:"Kullanıcı devre dışı bırakıldı",
    lbl_client:"Müşteri",
    lbl_phone:"Telefon",
    lbl_email:"E-posta",
    lbl_equipment:"Ekipman",
    lbl_technician:"Teknisyen",
    lbl_department:"Departman",
    lbl_opening:"Açılış tarihi",
    lbl_closing:"Kapanış tarihi",
    lbl_delivery:"Teslim tarihi",
    lbl_priority:"Öncelik",
    prio_normal:"Normal", prio_high:"Yüksek", prio_urgent:"Acil",
    dept_sav:"SAT", dept_commercial:"Ticari", dept_direction:"Yönetim", dept_logistics:"Lojistik",
    language:"Dil",
    btn_edit_ticket:"Kaydı düzenle",
    btn_delete_ticket:"Kaydı sil",
    delete_confirm:"Bu servis kaydı silinsin mi?",
    delete_confirm_sub:"Bu işlem geri alınamaz.",
    btn_confirm_delete:"Kalıcı olarak sil",
    btn_cancel:"İptal",
    toast_deleted:"Kayıt silindi",
    sheet_edit_ticket:"Kaydı düzenle",
  },
  es: {
    nav_home:"Inicio", nav_tickets:"Servicios", nav_new:"Nuevo", nav_team:"Equipo",
    brand_sub:"Servicio Posventa",
    login_who:"¿Quién es usted?",
    login_back:"← Volver",
    login_pin:"Introduzca su PIN",
    role_admin:"Administrador", role_tech:"Técnico",
    hello:"Hola",
    stat_ongoing:"En curso", stat_open:"Abiertos", stat_delivered:"Entregados", stat_total:"Total",
    urgent_banner_one:"1 servicio urgente",
    urgent_banner_many:"{n} servicios urgentes",
    my_tickets:"Mis servicios",
    recent:"Servicios recientes",
    see_all:"Ver todos ({n})",
    search_placeholder:"Buscar…",
    all:"Todos",
    no_results:"Sin resultados",
    new_title:"Nuevo servicio técnico",
    new_required:"* Campo obligatorio",
    field_client:"Cliente *",
    field_phone:"Teléfono",
    field_email:"Correo electrónico",
    field_equipment:"Equipo *",
    field_fault:"Avería notificada *",
    field_technician:"Técnico",
    field_department:"Departamento",
    field_priority:"Prioridad",
    field_status:"Estado",
    field_notes:"Notas internas",
    placeholder_client:"Nombre del cliente",
    placeholder_equipment:"Equipo afectado",
    placeholder_fault:"Descripción del problema",
    placeholder_notes:"Notas o comentarios internos",
    btn_create:"Crear y enviar notificación",
    section_fault:"Avería",
    section_notes:"Notas y trabajos realizados",
    section_delivery:"Entrega confirmada",
    section_actions:"Acciones",
    section_status:"Actualizar estado",
    section_note_add:"Añadir una nota",
    signed_by:"Firmado por",
    download_pdf:"Descargar informe PDF",
    print_delivery:"Imprimir albarán →",
    btn_photos:"Fotos",
    btn_deliver:"Entrega y firma del cliente",
    btn_qr:"Ver / imprimir código QR",
    note_placeholder:"Nota interna…",
    btn_add_note:"Añadir",
    sheet_qr:"Etiqueta QR",
    sheet_scan:"Escanear QR",
    sheet_deliver:"Entrega",
    sheet_sig:"Firma",
    sheet_photos:"Fotos del servicio",
    sheet_new_user:"Nuevo usuario",
    sheet_edit_user:"Editar usuario",
    delivery_client_name:"Nombre del cliente *",
    delivery_placeholder:"Sr. García",
    btn_to_sign:"Pasar a la firma →",
    name_required:"El nombre del cliente es obligatorio",
    sig_hint:"Firme con el dedo o el ratón",
    sig_done:"Firma guardada ✓",
    sig_clear:"Borrar",
    sig_confirm:"Confirmar",
    sig_back:"←",
    photo_phase_reception:"Recepción",
    photo_phase_repair:"Reparación",
    photo_phase_after:"Tras reparación",
    photo_add:"Añadir fotos",
    photo_add_more:"Añadir · {n} foto(s)",
    qr_created:"Servicio {n} creado",
    qr_open_date:"Abierto el",
    qr_scan_hint:"Escanear para acceder al expediente",
    qr_print:"Imprimir etiqueta",
    qr_save_png:"Guardar como PNG",
    qr_saving:"Guardando…",
    qr_cut:"Recortar y pegar en el equipo",
    scan_point:"Apunte al código QR",
    scan_no_cam:"Cámara no disponible — entrada manual",
    scan_manual:"Entrada manual",
    scan_active:"Servicios activos",
    settings_title:"Gestión de usuarios",
    btn_new_user:"+ Añadir usuario",
    my_account:"Mi cuenta",
    btn_edit:"Editar",
    btn_disable:"Desactivar",
    btn_enable:"Activar",
    field_name:"Nombre completo",
    field_pin:"Código PIN",
    pin_hint:"4 a 6 dígitos",
    field_role:"Rol",
    btn_save:"Guardar",
    toast_created:"Servicio {n} creado",
    toast_photos_added:"{n} foto(s) añadida(s)",
    toast_photo_removed:"Foto eliminada",
    toast_delivery_ok:"Entrega confirmada — enviando informe…",
    toast_mail_ok:"Informe enviado ✓",
    toast_note_ok:"Nota añadida",
    toast_modified:"Cambios guardados",
    toast_user_added:"{n} añadido/a",
    toast_pdf:"Generando PDF…",
    toast_pdf_ok:"PDF descargado ✓",
    toast_status:"Estado actualizado: {s}",
    toast_activated:"Usuario activado",
    toast_deactivated:"Usuario desactivado",
    lbl_client:"Cliente",
    lbl_phone:"Teléfono",
    lbl_email:"Correo electrónico",
    lbl_equipment:"Equipo",
    lbl_technician:"Técnico",
    lbl_department:"Departamento",
    lbl_opening:"Fecha de apertura",
    lbl_closing:"Fecha de cierre",
    lbl_delivery:"Fecha de entrega",
    lbl_priority:"Prioridad",
    prio_normal:"Normal", prio_high:"Alta", prio_urgent:"Urgente",
    dept_sav:"SAT", dept_commercial:"Comercial", dept_direction:"Dirección", dept_logistics:"Logística",
    language:"Idioma",
    btn_edit_ticket:"Editar servicio",
    btn_delete_ticket:"Eliminar servicio",
    delete_confirm:"¿Eliminar este servicio?",
    delete_confirm_sub:"Esta acción no se puede deshacer.",
    btn_confirm_delete:"Eliminar definitivamente",
    btn_cancel:"Cancelar",
    toast_deleted:"Servicio eliminado",
    sheet_edit_ticket:"Editar servicio",
  },
};

/* helper: t("key") or t("key",{n:3,s:"foo"}) */
function tx(lang, key, vars={}) {
  let s = T[lang]?.[key] || T.fr[key] || key;
  Object.entries(vars).forEach(([k,v])=>{ s=s.replaceAll(`{${k}}`,v); });
  return s;
}

/* ═══════════════════════════════════════════
   EMAILJS  ← À configurer
═══════════════════════════════════════════ */
const EJS = {
  publicKey:   "YOUR_PUBLIC_KEY",
  serviceId:   "YOUR_SERVICE_ID",
  tplNew:      "template_new_ticket",
  tplDelivery: "template_delivery",
  to:          "france@pimak.com",
};

async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.jspdf.jsPDF;
}

async function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

async function buildPDF(t) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit:"mm", format:"a4", compress:true });
  const W=210, ML=18, MR=18, TW=W-ML-MR;
  let y=0;
  const checkPage=(n=10)=>{ if(y+n>272){doc.addPage();y=18;} };

  doc.setFillColor(17,17,17); doc.rect(0,0,W,18,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setCharSpace(2); doc.text("PIMAK FRANCE",ML,8);
  doc.setCharSpace(1); doc.setFont("helvetica","normal"); doc.setFontSize(6.5);
  doc.setTextColor(180,180,180); doc.text("SERVICE APRÈS-VENTE",ML,13.5);
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(13);
  doc.setCharSpace(0); doc.text(t.numero,W-ML,10,{align:"right"});
  doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,180,180);
  doc.text(t.statut==="Livré"?"Livré ✓":t.statut,W-ML,15,{align:"right"});
  y=26;

  doc.setTextColor(17,17,17); doc.setFont("helvetica","bold"); doc.setFontSize(14);
  doc.text("Fiche d'intervention",ML,y); y+=5;
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(136,136,136);
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`,ML,y); y+=8;
  doc.setDrawColor(230,230,230); doc.setLineWidth(0.3); doc.line(ML,y,W-MR,y); y+=7;

  const rows=[
    ["Client",t.client],["Téléphone",t.clientPhone||"—"],["E-mail",t.clientEmail||"—"],
    ["Équipement",t.equipement],["Technicien",t.technicien||"—"],["Département",t.departement||"—"],
    ["Priorité",t.priorite],["Date d'ouverture",t.date_ouverture],
    ...(t.livreAt?[["Date de livraison",fmtDT(t.livreAt)]]:[]),
    ...(t.date_cloture?[["Date de clôture",t.date_cloture]]:[]),
  ];
  rows.forEach(([label,val])=>{
    checkPage(8);
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(153,153,153);
    doc.text(label.toUpperCase(),ML,y);
    doc.setTextColor(17,17,17); doc.setFontSize(9);
    const lines=doc.splitTextToSize(String(val),TW-42);
    doc.text(lines,ML+42,y);
    y+=Math.max(6,lines.length*4.5);
    doc.setDrawColor(242,242,242); doc.setLineWidth(0.2); doc.line(ML,y,W-MR,y); y+=4;
  });
  y+=3;

  checkPage(18);
  doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(153,153,153);
  doc.text("PANNE CONSTATÉE",ML,y); y+=5;
  doc.setFillColor(250,250,250);
  const panneLines=doc.splitTextToSize(t.panne,TW-6);
  doc.rect(ML,y-3,TW,panneLines.length*5+6,"F");
  doc.setDrawColor(229,229,229); doc.setLineWidth(0.3); doc.rect(ML,y-3,2,panneLines.length*5+6,"F");
  doc.setTextColor(68,68,68); doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
  doc.text(panneLines,ML+5,y+1.5); y+=panneLines.length*5+8;

  if(t.commentaires){
    checkPage(18);
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(153,153,153);
    doc.text("TRAVAUX EFFECTUÉS",ML,y); y+=5;
    doc.setFillColor(250,250,250);
    const notesLines=doc.splitTextToSize(t.commentaires,TW-6);
    doc.rect(ML,y-3,TW,notesLines.length*5+6,"F");
    doc.setDrawColor(17,17,17); doc.setLineWidth(0.4); doc.rect(ML,y-3,2,notesLines.length*5+6,"F");
    doc.setTextColor(68,68,68); doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
    doc.text(notesLines,ML+5,y+1.5); y+=notesLines.length*5+8;
  }

  const hasPhotos=PHOTO_PHASES.some(p=>(t.photos?.[p.key]?.length||0)>0);
  if(hasPhotos){
    checkPage(14);
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(153,153,153);
    doc.text("PHOTOS D'INTERVENTION",ML,y); y+=6;
    for(const phase of PHOTO_PHASES){
      const imgs=t.photos?.[phase.key]||[];
      if(!imgs.length)continue;
      checkPage(12);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(136,136,136);
      doc.text(phase.label.toUpperCase(),ML,y); y+=4;
      const imgW=52,imgH=40,gap=4,perRow=3;
      let col=0,rowY=y;
      for(const photo of imgs){
        if(col===0)checkPage(imgH+12);
        const x=ML+col*(imgW+gap);
        try{
          const imgEl=await loadImage(photo.src);
          if(imgEl){
            const fmt=photo.src.startsWith("data:image/png")?"PNG":"JPEG";
            doc.addImage(photo.src,fmt,x,rowY,imgW,imgH,undefined,"MEDIUM");
          }
        }catch(_){}
        doc.setFontSize(5.5); doc.setTextColor(170,170,170);
        doc.text(photo.ts||"",x+imgW/2,rowY+imgH+3,{align:"center"});
        doc.setDrawColor(229,229,229); doc.setLineWidth(0.2); doc.rect(x,rowY,imgW,imgH);
        col++;
        if(col>=perRow){col=0;rowY+=imgH+8;y=rowY;}
      }
      if(col>0){y=rowY+imgH+8;}
      y+=2;
    }
  }

  checkPage(44); y+=2;
  doc.setDrawColor(229,229,229); doc.setLineWidth(0.3); doc.line(ML,y,W-MR,y); y+=7;
  doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(153,153,153);
  doc.text("SIGNATURE DU CLIENT",ML,y); y+=5;
  if(t.signedBy){
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(17,17,17);
    doc.text(t.signedBy,ML,y); y+=4;
    doc.setFontSize(7.5); doc.setTextColor(136,136,136);
    doc.text(`Signé le ${fmtDT(t.signedAt)}`,ML,y); y+=5;
  }
  if(t.signature){
    const sigImg=await loadImage(t.signature);
    if(sigImg){
      doc.setFillColor(255,255,255); doc.setDrawColor(229,229,229); doc.setLineWidth(0.3);
      doc.roundedRect(ML,y,80,28,2,2,"FD");
      doc.addImage(t.signature,"PNG",ML+2,y+2,76,24,undefined,"MEDIUM");
    }
    y+=32;
  }

  const pc=doc.internal.getNumberOfPages();
  for(let i=1;i<=pc;i++){
    doc.setPage(i); doc.setFont("helvetica","normal"); doc.setFontSize(7);
    doc.setTextColor(187,187,187);
    doc.text(`Pimak France · Service Après-Vente · ${t.numero}`,ML,289);
    doc.text(`Page ${i}/${pc}`,W-ML,289,{align:"right"});
  }
  return doc.output("blob");
}

async function downloadPDF(t){
  const blob=await buildPDF(t);
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`${t.numero}-rapport.pdf`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

async function getPDFDataURL(t){
  const blob=await buildPDF(t);
  return new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(blob);});
}

async function loadEJS(){
  if(window.emailjs)return;
  await new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload=res;s.onerror=rej;document.head.appendChild(s);
  });
  window.emailjs.init({publicKey:EJS.publicKey});
}

async function mailNewTicket(t){
  if(EJS.publicKey==="YOUR_PUBLIC_KEY")return;
  try{
    await loadEJS();
    await window.emailjs.send(EJS.serviceId,EJS.tplNew,{
      to_email:EJS.to, ticket_num:t.numero, client:t.client,
      telephone:t.clientPhone||"—", email:t.clientEmail||"—",
      equipement:t.equipement, panne:t.panne,
      technicien:t.technicien||"Non assigné",
      priorite:t.priorite, date:t.date_ouverture,
      message:`Nouvelle intervention enregistrée.\nClient : ${t.client}\nÉquipement : ${t.equipement}\nPanne : ${t.panne}\nTechnicien : ${t.technicien||"—"}\nPriorité : ${t.priorite}`,
    });
  }catch(e){console.warn("EmailJS new:",e);}
}

async function mailDelivery(t){
  if(EJS.publicKey==="YOUR_PUBLIC_KEY")return;
  try{
    await loadEJS();
    const pdfB64=await getPDFDataURL(t);
    await window.emailjs.send(EJS.serviceId,EJS.tplDelivery,{
      to_email:EJS.to, ticket_num:t.numero, client:t.client,
      telephone:t.clientPhone||"—", email_client:t.clientEmail||"—",
      equipement:t.equipement, technicien:t.technicien||"—",
      panne:t.panne, travaux:t.commentaires||"—",
      signed_by:t.signedBy, livre_at:fmtDT(t.livreAt),
      message:`Intervention clôturée et livrée.\nClient : ${t.client}\nÉquipement : ${t.equipement}\nTechnicien : ${t.technicien||"—"}\nSigné par : ${t.signedBy}\nDate : ${fmtDT(t.livreAt)}\n\nLe rapport PDF complet (avec photos et signature) est joint à ce message.`,
      pdf_content:pdfB64,
    });
  }catch(e){console.warn("EmailJS delivery:",e);}
}

/* ═══════════════════════════════════════════
   DONNÉES STATIQUES
═══════════════════════════════════════════ */
const STATUSES = {
  Ouvert:       {label:"Ouvert",      dot:"#dc2626",bg:"var(--redbg)",   border:"var(--redborder)"   },
  "En cours":   {label:"En cours",    dot:"#d97706",bg:"var(--amberbg)", border:"var(--amberborder)" },
  "En attente": {label:"En attente",  dot:"#7c3aed",bg:"var(--purplebg)",border:"var(--purpleborder)"},
  "Clôturé":    {label:"Clôturé",     dot:"#059669",bg:"var(--greenbg)", border:"var(--greenborder)" },
  "Livré":      {label:"Livré",       dot:"#2563eb",bg:"var(--bluebg)",  border:"var(--blueborder)"  },
};

const PHOTO_PHASES = [
  {key:"reception", label:"Réception"},
  {key:"reparation",label:"Réparation"},
  {key:"apres",     label:"Après réparation"},
];

const INIT_USERS = [
  {id:"u1",name:"Admin",      email:"admin@pimak.fr", pin:"1234",role:"admin",     active:true },
  {id:"u2",name:"Jean-Pierre",email:"jp@pimak.fr",    pin:"2222",role:"technician",active:true },
  {id:"u3",name:"Sophie",     email:"sophie@pimak.fr",pin:"3333",role:"technician",active:true },
  {id:"u4",name:"Marc",       email:"marc@pimak.fr",  pin:"4444",role:"technician",active:true },
  {id:"u5",name:"Ahmed",      email:"ahmed@pimak.fr", pin:"5555",role:"technician",active:false},
];

const INIT_TICKETS = [
  {id:1,numero:"PI-001",client:"Restaurant Le Marais",equipement:"Four convection GN 2/1",  panne:"Résistance défectueuse",   technicien:"Jean-Pierre",departement:"SAV",statut:"En cours",  priorite:"Haute",  commentaires:"Pièce commandée, livraison J+2",date_ouverture:"2026-05-20",date_cloture:"",          clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:2,numero:"PI-002",client:"Hôtel Lumière Paris", equipement:"Lave-vaisselle à tunnel", panne:"Fuite au niveau du joint d'entrée",technicien:"Sophie",     departement:"SAV",statut:"Ouvert",    priorite:"Haute",  commentaires:"",                              date_ouverture:"2026-05-24",date_cloture:"",          clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:3,numero:"PI-003",client:"Brasserie du Port",   equipement:"Cellule de refroidissement rapide",panne:"Compresseur bruyant, température instable",technicien:"Marc",departement:"SAV",statut:"Livré",priorite:"Normale",commentaires:"Compresseur remplacé, tests OK",date_ouverture:"2026-05-15",date_cloture:"2026-05-22",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"M. Dupont",signedAt:"2026-05-22T14:30:00",livreAt:"2026-05-22T14:30:00"},
  {id:4,numero:"PI-004",client:"Café de Flore",       equipement:"Machine à café professionnelle",panne:"Chauffe-eau hors service",technicien:"Ahmed",      departement:"SAV",statut:"Clôturé",   priorite:"Urgente",commentaires:"Chauffe-eau remplacé en urgence",  date_ouverture:"2026-05-18",date_cloture:"2026-05-19",clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
  {id:5,numero:"PI-005",client:"Le Grand Véfour",     equipement:"Friteuse double bac 2×15 L",panne:"Thermostat défaillant",    technicien:"Jean-Pierre",departement:"SAV",statut:"En attente",priorite:"Normale",commentaires:"En attente de pièce détachée",       date_ouverture:"2026-05-25",date_cloture:"",          clientPhone:"",clientEmail:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""},
];

let _id=6;
const uid   =()=>Math.random().toString(36).slice(2,8);
const fmtD  =iso=>iso?new Date(iso).toLocaleDateString("fr-FR"):"—";
const fmtDT =iso=>iso?new Date(iso).toLocaleString("fr-FR"):"—";
const toB64 =f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});
const totalP=t=>PHOTO_PHASES.reduce((s,p)=>s+(t.photos?.[p.key]?.length||0),0);
const EMPTY ={client:"",clientPhone:"",clientEmail:"",equipement:"",panne:"",technicien:"",departement:"",statut:"Ouvert",priorite:"Normale",commentaires:"",photos:{reception:[],reparation:[],apres:[]},signature:null,signedBy:"",signedAt:"",livreAt:""};

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function App(){
  const [lang,   setLang]  = useState("fr");
  const [user,   setUser]  = useState(null);
  const [users,  setUsers] = useState(INIT_USERS);
  const [tix,    setTix]   = useState([]);
  const [dbReady,setDbReady]= useState(false);
  const [view,   setView]  = useState("dashboard");
  const [sel,    setSel]   = useState(null);
  const [sheet,  setSheet] = useState(null);
  const [toast,  setToast] = useState(null);
  const [lb,     setLb]    = useState(null);
  const [phase,  setPhase] = useState("reception");
  const [dname,  setDname] = useState("");
  const [eUser,  setEUser] = useState(null);
  const [sending,setSend]  = useState(false);

  /* ── Firebase: tickets gerçek zamanlı dinle ── */
  useEffect(()=>{
    const q = query(collection(db,"tickets"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{
      const data = snap.docs.map(d=>({...d.data(), fireId:d.id}));
      setTix(data);
      setDbReady(true);
      setSel(prev=>prev ? (data.find(tk=>tk.fireId===prev.fireId)||prev) : null);
    }, ()=>{ setTix(INIT_TICKETS); setDbReady(true); });
    return ()=>unsub();
  },[]);

  /* ── Firebase: kullanıcıları dinle ── */
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"users"), snap=>{
      if(!snap.empty) setUsers(snap.docs.map(d=>({...d.data(), fireId:d.id})));
    }, ()=>{});
    return ()=>unsub();
  },[]);

  const t=(key,vars)=>tx(lang,key,vars);
  const say=(msg,err)=>{setToast({msg,err});setTimeout(()=>setToast(null),2800);};
  const closeSheet=()=>{setSheet(null);setDname("");setEUser(null);};
  const isAdmin=user?.role==="admin";
  const isTech =user?.role==="technician";

  /* ── Ticket güncelle ── */
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
        const cleanPatch={...patch};
        if(patch.statut==="Clôturé"&&!tk.date_cloture) cleanPatch.date_cloture=new Date().toISOString().split("T")[0];
        await updateDoc(doc(db,"tickets",tk.fireId), cleanPatch);
      }
    }catch(e){console.warn("Firestore update:",e);}
  };

  /* ── Fotoğraf ekle ── */
  const addPhotos=async(id,ph,files)=>{
    const arr=await Promise.all(Array.from(files).map(toB64));
    const photos=arr.map(src=>({src,id:uid(),ts:new Date().toLocaleString("fr-FR")}));
    const tk=tix.find(t=>t.fireId===id||t.id===id);
    if(!tk)return;
    const updatedPhotos={...tk.photos,[ph]:[...(tk.photos[ph]||[]),...photos]};
    await mut(id,{photos:updatedPhotos});
    say(t("toast_photos_added",{n:photos.length}));
  };

  /* ── Fotoğraf sil ── */
  const rmPhoto=async(id,ph,pid)=>{
    const tk=tix.find(t=>t.fireId===id||t.id===id);
    if(!tk)return;
    const updatedPhotos={...tk.photos,[ph]:tk.photos[ph].filter(x=>x.id!==pid)};
    await mut(id,{photos:updatedPhotos});
    say(t("toast_photo_removed"));
  };

  /* ── Yeni ticket oluştur ── */
  const createTicket=async(form)=>{
    const ts=Date.now();
    const numero=`PI-${String(ts).slice(-5)}`;
    const tk={...form,numero,date_ouverture:new Date().toISOString().split("T")[0],date_cloture:"",createdAt:serverTimestamp(),createdBy:user?.name||""};
    let fireId=null;
    try{
      const ref=await addDoc(collection(db,"tickets"),tk);
      fireId=ref.id; tk.fireId=fireId;
    }catch(e){ tk.id=_id++; setTix(p=>[tk,...p]); }
    setSel(tk); setView("detail"); setSheet("qr");
    say(t("toast_created",{n:numero}));
    setSend(true); await mailNewTicket(tk); setSend(false);
  };

  /* ── Teslim onayla ── */
  const confirmDelivery=async(sig)=>{
    const now=new Date().toISOString();
    const patch={signature:sig,signedBy:dname,signedAt:now,livreAt:now,statut:"Livré"};
    const updated={...sel,...patch};
    await mut(sel.fireId||sel.id, patch);
    closeSheet(); say(t("toast_delivery_ok"));
    setSend(true); await mailDelivery(updated); setSend(false);
    say(t("toast_mail_ok"));
  };

  /* ── Ticket sil (sadece admin) ── */
  const deleteTicket=async(tk)=>{
    try{
      if(tk.fireId) await deleteDoc(doc(db,"tickets",tk.fireId));
      setTix(p=>p.filter(x=>x.fireId!==tk.fireId&&x.id!==tk.id));
      if(sel?.fireId===tk.fireId||sel?.id===tk.id){ setSel(null); setView("list"); }
      closeSheet();
      say(t("toast_deleted"));
    }catch(e){ say("Erreur suppression",true); }
  };

  const printQR=tk=>{
    const qr=`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(tk.numero)}&bgcolor=ffffff&color=111111&margin=12`;
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>${tk.numero}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:-apple-system,sans-serif}.c{border:1.5px solid #e5e5e5;border-radius:14px;padding:22px;text-align:center;width:240px}.b{font-size:10px;font-weight:700;letter-spacing:3px;color:#111;margin-bottom:2px}.s{font-size:8px;color:#aaa;letter-spacing:1px;margin-bottom:14px}img{width:156px;height:156px;display:block;margin:0 auto}.n{font-size:19px;font-weight:700;margin:12px 0 3px}.cl{font-size:11px;color:#555}.eq{font-size:10px;color:#aaa;margin-top:2px}.d{font-size:9px;color:#ccc;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body onload="window.print()"><div class="c"><div class="b">PIMAK FRANCE</div><div class="s">SERVICE APRÈS-VENTE</div><img src="${qr}"/><div class="n">${tk.numero}</div><div class="cl">${tk.client}</div><div class="eq">${tk.equipement}</div><div class="d">Ouvert le ${tk.date_ouverture}</div></div></body></html>`);
    w.document.close();
  };

  const openTicket=tk=>{setSel(tk);setPhase("reception");setView("detail");};
  const goBack=()=>{setView("list");setSel(null);};

  const stats={
    total:tix.length,
    ouvert:tix.filter(tk=>tk.statut==="Ouvert").length,
    cours:tix.filter(tk=>tk.statut==="En cours").length,
    urgent:tix.filter(tk=>tk.priorite==="Urgente"&&tk.statut!=="Livré").length,
    livre:tix.filter(tk=>tk.statut==="Livré").length,
  };
  const myTix=isTech?tix.filter(tk=>tk.technicien===user.name&&tk.statut!=="Livré"):[];

  if(!user) return <LoginScreen users={users} lang={lang} setLang={setLang} onLogin={u=>{setUser(u);setView("dashboard");}}/>;

  if(!dbReady) return(
    <div style={{background:"var(--bg)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <style>{CSS}</style>
      <div style={{width:32,height:32,border:"2px solid var(--b1)",borderTopColor:"var(--t0)",borderRadius:"50%",animation:"spin .8s linear infinite",marginBottom:16}}/>
      <div style={{fontSize:12,color:"var(--t2)"}}>Connexion à la base de données…</div>
    </div>
  );

  const sheetTitles={qr:t("sheet_qr"),scan:t("sheet_scan"),deliver:t("sheet_deliver"),sig:t("sheet_sig"),photos:t("sheet_photos"),newUser:t("sheet_new_user"),editUser:t("sheet_edit_user"),editTicket:t("sheet_edit_ticket"),deleteConfirm:t("delete_confirm")};

  const PRIOS=()=>[t("prio_normal"),t("prio_high"),t("prio_urgent")];
  const PRIO_MAP={"Normale":t("prio_normal"),"Haute":t("prio_high"),"Urgente":t("prio_urgent")};
  const DEPTS=()=>[t("dept_sav"),t("dept_commercial"),t("dept_direction"),t("dept_logistics")];

  return(
    <div style={{background:"var(--bg)",minHeight:"100vh",paddingBottom:60,fontFamily:FONT}}>
      <style>{CSS}</style>

      {lb&&<div onClick={()=>setLb(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.96)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fade .2s ease"}}><img src={lb} alt="" style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:10,objectFit:"contain"}}/></div>}

      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:toast.err?"var(--red)":"var(--t0)",color:"#fff",padding:"9px 18px",borderRadius:R.full,fontSize:12,fontWeight:500,whiteSpace:"nowrap",animation:"toast .2s ease",boxShadow:"0 4px 16px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",gap:7}}>{sending&&<span style={{width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>}{toast.msg}</div>}

      {sheet&&(
        <div onClick={e=>{if(e.target===e.currentTarget)closeSheet();}} style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",animation:"fade .2s ease"}}>
          <Sheet title={sheetTitles[sheet]||""} onClose={closeSheet}>
            {sheet==="qr"&&sel&&<QRSheet t={sel} lang={lang} onPrint={()=>printQR(sel)}/>}
            {sheet==="scan"&&<ScanSheet tickets={tix} lang={lang} onSelect={tk=>{openTicket(tk);closeSheet();}}/>}
            {sheet==="deliver"&&sel&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:12,color:"var(--t1)",padding:"10px 12px",background:"var(--s1)",borderRadius:R.md}}>{sel.numero} · {sel.client}</div>
                <FL label={t("delivery_client_name")}><input value={dname} onChange={e=>setDname(e.target.value)} placeholder={t("delivery_placeholder")}/></FL>
                <Btn color="green" onClick={()=>{if(dname.trim())setSheet("sig");else say(t("name_required"),true);}}>{t("btn_to_sign")}</Btn>
              </div>
            )}
            {sheet==="sig"&&<SigCanvas lang={lang} onDone={confirmDelivery} onBack={()=>setSheet("deliver")}/>}
            {sheet==="photos"&&sel&&(
              <div>
                <div style={{display:"flex",gap:4,marginBottom:14}}>
                  {PHOTO_PHASES.map((p,i)=>{
                    const labels=[t("photo_phase_reception"),t("photo_phase_repair"),t("photo_phase_after")];
                    const cnt=sel.photos?.[p.key]?.length||0;
                    const act=phase===p.key;
                    return <button key={p.key} onClick={()=>setPhase(p.key)} style={{flex:1,padding:"8px 6px",borderRadius:R.md,border:`1px solid ${act?"var(--b2)":"var(--b0)"}`,background:act?"var(--s0)":"transparent",color:act?"var(--t0)":"var(--t2)",fontSize:11,fontWeight:act?500:400,transition:"all .15s"}}>
                      {labels[i]}{cnt>0&&<span style={{marginLeft:4,opacity:.55}}>·{cnt}</span>}
                    </button>;
                  })}
                </div>
                <PhotoZone lang={lang} photos={sel.photos?.[phase]||[]} onAdd={f=>addPhotos(sel.id,phase,f)} onRemove={pid=>rmPhoto(sel.id,phase,pid)} onView={setLb}/>
              </div>
            )}
            {sheet==="newUser"&&isAdmin&&<UserForm lang={lang} onSave={async u=>{try{await addDoc(collection(db,"users"),{...u,active:true});}catch(e){setUsers(p=>[...p,{...u,id:uid(),active:true}]);}closeSheet();say(t("toast_user_added",{n:u.name}));}}/>}
            {sheet==="editUser"&&eUser&&isAdmin&&<UserForm lang={lang} init={eUser} onSave={async u=>{try{if(eUser.fireId)await updateDoc(doc(db,"users",eUser.fireId),u);else setUsers(p=>p.map(x=>x.id===eUser.id?{...x,...u}:x));}catch(e){setUsers(p=>p.map(x=>x.id===eUser.id?{...x,...u}:x));}closeSheet();say(t("toast_modified"));}}/>}
            {sheet==="editTicket"&&sel&&isAdmin&&<TicketEditForm lang={lang} ticket={sel} onSave={async form=>{await mut(sel.fireId||sel.id,form);closeSheet();say(t("toast_modified"));}}/>}
            {sheet==="deleteConfirm"&&sel&&isAdmin&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"var(--redbg)",border:"1px solid var(--redborder)",borderRadius:R.md,padding:"14px"}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--red)",marginBottom:4}}>{sel.numero} — {sel.client}</div>
                  <div style={{fontSize:12,color:"var(--red)",opacity:.8}}>{t("delete_confirm_sub")}</div>
                </div>
                <Btn color="red" onClick={()=>deleteTicket(sel)}>{t("btn_confirm_delete")}</Btn>
                <Btn variant="secondary" onClick={closeSheet}>{t("btn_cancel")}</Btn>
              </div>
            )}
          </Sheet>
        </div>
      )}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"var(--bg)",borderBottom:"1px solid var(--b0)",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {view==="detail"&&<button onClick={goBack} style={{background:"none",border:"none",color:"var(--t1)",fontSize:16,padding:"4px 8px 4px 0",lineHeight:1}}>←</button>}
          <span style={{fontSize:12,fontWeight:600,letterSpacing:"0.1em",color:"var(--t0)"}}>PIMAK</span>
          {view==="detail"&&sel&&<span style={{fontSize:12,color:"var(--t2)"}}>{sel.numero}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* Language picker */}
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{fontSize:10,padding:"3px 6px",borderRadius:R.sm,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",width:"auto",fontFamily:FONT}}>
            {Object.entries(LANGS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          {view==="detail"&&sel&&<>
            <StatusPill s={STATUSES[sel.statut]}>{STATUSES[sel.statut]?.label}</StatusPill>
            <MiniBtn onClick={()=>setSheet("qr")}>QR</MiniBtn>
          </>}
          <MiniBtn onClick={()=>setSheet("scan")}>⌖</MiniBtn>
          <MiniBtn onClick={()=>{setUser(null);setView("dashboard");}}>⏻</MiniBtn>
        </div>
      </header>

      <main style={{maxWidth:560,margin:"0 auto",padding:"14px 12px"}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div style={{animation:"up .2s ease"}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:600,color:"var(--t0)"}}>{t("hello")}, {user.name}</div>
              <div style={{fontSize:12,color:"var(--t2)",marginTop:3}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
              {[
                {label:t("stat_ongoing"),value:stats.cours, dot:"#d97706"},
                {label:t("stat_open"),   value:stats.ouvert,dot:"#dc2626"},
                {label:t("stat_delivered"),value:stats.livre,dot:"#2563eb"},
                {label:t("stat_total"),  value:stats.total, dot:"var(--t2)"},
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
            {stats.urgent>0&&(
              <div onClick={()=>setView("list")} style={{background:"var(--redbg)",border:"1px solid var(--redborder)",borderRadius:R.lg,padding:"12px 14px",marginBottom:10,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:500,color:"var(--red)"}}>{stats.urgent===1?t("urgent_banner_one"):t("urgent_banner_many",{n:stats.urgent})}</div>
                <span style={{color:"var(--red)",fontSize:12}}>→</span>
              </div>
            )}
            {isTech&&myTix.length>0&&<>
              <SL>{t("my_tickets")}</SL>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {myTix.slice(0,3).map(tk=><TRow key={tk.id} t={tk} onSel={openTicket} np={totalP(tk)}/>)}
              </div>
            </>}
            {isAdmin&&<>
              <SL>{t("recent")}</SL>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {tix.filter(tk=>tk.statut!=="Livré").slice(0,4).map(tk=><TRow key={tk.id} t={tk} onSel={openTicket} np={totalP(tk)}/>)}
              </div>
              {tix.filter(tk=>tk.statut!=="Livré").length>4&&<button onClick={()=>setView("list")} style={{width:"100%",marginTop:8,padding:"9px",borderRadius:R.md,border:"1px solid var(--b0)",background:"none",color:"var(--t1)",fontSize:11,cursor:"pointer"}}>{t("see_all",{n:tix.filter(tk=>tk.statut!=="Livré").length})}</button>}
            </>}
          </div>
        )}

        {/* LIST */}
        {view==="list"&&<TicketList tickets={isTech?tix.filter(tk=>tk.technicien===user.name):tix} onSel={openTicket} lang={lang}/>}

        {/* NEW */}
        {view==="new"&&<NewForm users={users} onCreate={createTicket} lang={lang}/>}

        {/* DETAIL */}
        {view==="detail"&&sel&&(
          <div style={{animation:"up .2s ease"}}>
            <Card mb={8}>
              {[
                [t("lbl_client"),     sel.client],
                [t("lbl_phone"),      sel.clientPhone||"—"],
                [t("lbl_email"),      sel.clientEmail||"—"],
                [t("lbl_equipment"),  sel.equipement],
                [t("lbl_technician"), sel.technicien||"—"],
                [t("lbl_department"), sel.departement||"—"],
                [t("lbl_opening"),    sel.date_ouverture],
                [t("lbl_priority"),   PRIO_MAP[sel.priorite]||sel.priorite],
              ].map(([l,v],i,a)=><IRow key={l} label={l} last={i===a.length-1}>{v}</IRow>)}
            </Card>

            <SL>{t("section_fault")}</SL>
            <Card mb={8}><div style={{padding:"11px 13px",fontSize:13,color:"var(--t1)",lineHeight:1.6}}>{sel.panne}</div></Card>

            {sel.commentaires&&<>
              <SL>{t("section_notes")}</SL>
              <Card mb={8}><div style={{padding:"11px 13px",fontSize:13,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-line"}}>{sel.commentaires}</div></Card>
            </>}

            {sel.signature&&<>
              <SL>{t("section_delivery")}</SL>
              <Card mb={8}>
                <div style={{padding:"12px 13px"}}>
                  <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>{t("signed_by")} <strong>{sel.signedBy}</strong> · {fmtDT(sel.signedAt)}</div>
                  <img src={sel.signature} onClick={()=>setLb(sel.signature)} style={{maxWidth:180,borderRadius:8,border:"1px solid var(--b0)",cursor:"pointer",display:"block",marginBottom:10}}/>
                  <button onClick={async()=>{say(t("toast_pdf"));await downloadPDF(sel);say(t("toast_pdf_ok"));}} style={{background:"none",border:"none",color:"var(--blue)",fontSize:12,cursor:"pointer",padding:0,fontFamily:FONT,fontWeight:500}}>{t("print_delivery")}</button>
                </div>
              </Card>
            </>}

            <SL>{t("section_actions")}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
              <Btn color="blue" onClick={()=>setSheet("photos")}>{t("btn_photos")}{totalP(sel)>0?` · ${totalP(sel)}`:""}</Btn>
              {!sel.signature&&(sel.statut==="Clôturé"||sel.statut==="En cours"||sel.statut==="Ouvert")&&(
                <Btn color="green" onClick={()=>setSheet("deliver")}>{t("btn_deliver")}</Btn>
              )}
              <Btn color="amber" onClick={()=>setSheet("qr")}>{t("btn_qr")}</Btn>
              <Btn color="purple" onClick={async()=>{say(t("toast_pdf"));await downloadPDF(sel);say(t("toast_pdf_ok"));}}>{t("download_pdf")}</Btn>
              {isAdmin&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:4}}>
                <Btn color="black" onClick={()=>setSheet("editTicket")}>{t("btn_edit_ticket")}</Btn>
                <Btn color="red" onClick={()=>setSheet("deleteConfirm")}>{t("btn_delete_ticket")}</Btn>
              </div>}
            </div>

            <SL>{t("section_status")}</SL>
            <Card mb={8}>
              <div style={{padding:"11px 13px",display:"flex",flexWrap:"wrap",gap:5}}>
                {Object.entries(STATUSES).map(([k,v])=>{
                  const act=sel.statut===k;
                  return <button key={k} onClick={()=>{mut(sel.id,{statut:k});say(t("toast_status",{s:v.label}));}} style={{padding:"5px 11px",borderRadius:R.full,border:`1px solid ${act?v.dot:v.border}`,background:act?v.bg:"transparent",color:act?v.dot:"var(--t2)",fontSize:11,fontWeight:act?600:400,display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}>
                    {act&&<span style={{width:4,height:4,borderRadius:"50%",background:v.dot,display:"inline-block"}}/>}
                    {v.label}
                  </button>;
                })}
              </div>
            </Card>

            <SL>{t("section_note_add")}</SL>
            <Card>
              <NoteInput lang={lang} onAdd={txt=>{
                const d=new Date().toLocaleDateString("fr-FR");
                mut(sel.id,{commentaires:sel.commentaires?`${sel.commentaires}\n[${d}] ${txt}`:`[${d}] ${txt}`});
                say(t("toast_note_ok"));
              }}/>
            </Card>
          </div>
        )}

        {/* SETTINGS */}
        {view==="settings"&&(
          <div style={{animation:"up .2s ease"}}>
            <div style={{fontSize:18,fontWeight:600,marginBottom:16}}>{t("settings_title")}</div>
            {isAdmin&&<Btn color="blue" style={{marginBottom:14}} onClick={()=>setSheet("newUser")}>{t("btn_new_user")}</Btn>}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {users.map(u=>(
                <div key={u.id} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:u.active?1:0.4}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"var(--t1)",flexShrink:0}}>{u.name[0]}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:"var(--t0)"}}>{u.name}</div>
                      <div style={{fontSize:11,color:"var(--t2)"}}>{u.role==="admin"?t("role_admin"):t("role_tech")} · {u.email}</div>
                    </div>
                  </div>
                  {isAdmin&&u.id!==user.id&&(
                    <div style={{display:"flex",gap:5}}>
                      <MiniBtn onClick={()=>{setEUser(u);setSheet("editUser");}}>{t("btn_edit")}</MiniBtn>
                      <MiniBtn onClick={()=>{setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x));say(u.active?t("toast_deactivated"):t("toast_activated"));}}>{u.active?t("btn_disable"):t("btn_enable")}</MiniBtn>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:"12px 14px",background:"var(--s1)",borderRadius:R.lg,fontSize:11,color:"var(--t2)",lineHeight:1.8}}>
              <div style={{fontWeight:600,color:"var(--t1)",marginBottom:3}}>{t("my_account")}</div>
              {user.name} · {user.role==="admin"?t("role_admin"):t("role_tech")}<br/>
              {user.email} · PIN {"·".repeat(user.pin.length)}
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"var(--bg)",borderTop:"1px solid var(--b0)",display:"flex",height:52,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {[
          {k:"dashboard",label:t("nav_home")},
          {k:"list",     label:t("nav_tickets")},
          ...(!isTech?[{k:"new",label:t("nav_new")}]:[]),
          {k:"settings", label:t("nav_team")},
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
function LoginScreen({users,lang,setLang,onLogin}){
  const t=(k,v)=>tx(lang,k,v);
  const [step, setStep]   = useState("pick");
  const [picked,setPicked]= useState(null);
  const [pin,  setPin]    = useState("");
  const [shake,setShake]  = useState(false);

  const tap=d=>{
    const next=pin+d; setPin(next);
    if(next.length===picked.pin.length){
      if(next===picked.pin)onLogin(picked);
      else{setShake(true);setPin("");setTimeout(()=>setShake(false),500);}
    }
  };

  return(
    <div style={{background:"var(--bg)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:FONT}}>
      <style>{CSS}</style>
      {/* Lang picker */}
      <div style={{position:"absolute",top:16,right:16}}>
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{fontSize:11,padding:"4px 8px",borderRadius:R.sm,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontFamily:FONT}}>
          {Object.entries(LANGS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={{marginBottom:36,textAlign:"center"}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.14em",color:"var(--t0)"}}>PIMAK FRANCE</div>
        <div style={{fontSize:10,color:"var(--t2)",marginTop:4,letterSpacing:"0.07em"}}>{t("brand_sub").toUpperCase()}</div>
      </div>

      {step==="pick"?(
        <div style={{width:"100%",maxWidth:300}}>
          <div style={{fontSize:11,color:"var(--t2)",marginBottom:10,textAlign:"center",letterSpacing:"0.03em"}}>{t("login_who")}</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {users.filter(u=>u.active).map(u=>(
              <button key={u.id} onClick={()=>{setPicked(u);setStep("pin");setPin("");}} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"13px 14px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"border-color .15s",textAlign:"left"}}>
                <div style={{width:34,height:34,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"var(--t1)",flexShrink:0}}>{u.name[0]}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--t0)"}}>{u.name}</div>
                  <div style={{fontSize:11,color:"var(--t2)"}}>{u.role==="admin"?t("role_admin"):t("role_tech")}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:260,textAlign:"center"}}>
          <button onClick={()=>{setStep("pick");setPin("");}} style={{background:"none",border:"none",color:"var(--t2)",fontSize:11,cursor:"pointer",marginBottom:20,fontFamily:FONT}}>{t("login_back")}</button>
          <div style={{width:44,height:44,borderRadius:R.full,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600,color:"var(--t1)",margin:"0 auto 10px"}}>{picked.name[0]}</div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{picked.name}</div>
          <div style={{fontSize:11,color:"var(--t2)",marginBottom:22}}>{t("login_pin")}</div>
          <div style={{display:"flex",gap:9,justifyContent:"center",marginBottom:26,animation:shake?"shake .4s ease":""}}>
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
function TicketList({tickets,onSel,lang}){
  const t=(k,v)=>tx(lang,k,v);
  const [q,setQ]=useState("");
  const [fs,setFs]=useState(null);
  const filtered=tickets.filter(tk=>{
    if(fs&&tk.statut!==fs)return false;
    if(q&&!`${tk.client} ${tk.numero} ${tk.equipement}`.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  });
  return(
    <div style={{animation:"up .2s ease"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t("search_placeholder")} style={{marginBottom:10}}/>
      <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:12,paddingBottom:2}}>
        <FC active={!fs} onClick={()=>setFs(null)}>{t("all")}</FC>
        {Object.entries(STATUSES).map(([k,v])=><FC key={k} active={fs===k} dot={v.dot} bg={v.bg} border={v.border} onClick={()=>setFs(fs===k?null:k)}>{v.label}</FC>)}
      </div>
      {filtered.length===0
        ?<div style={{textAlign:"center",padding:"40px 0",color:"var(--t2)",fontSize:12}}>{t("no_results")}</div>
        :<div style={{display:"flex",flexDirection:"column",gap:6}}>{filtered.map((tk,i)=><TRow key={tk.id} t={tk} onSel={onSel} np={totalP(tk)} delay={i*20}/>)}</div>
      }
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEW TICKET FORM
═══════════════════════════════════════════ */
function NewForm({users,onCreate,lang}){
  const t=(k,v)=>tx(lang,k,v);
  const [f,setF]=useState(EMPTY);
  const techs=users.filter(u=>u.role==="technician"&&u.active).map(u=>u.name);
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{animation:"up .2s ease"}}>
      <div style={{fontSize:18,fontWeight:600,marginBottom:14}}>{t("new_title")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <FL label={t("field_client")}><input value={f.client} onChange={e=>s("client")(e.target.value)} placeholder={t("placeholder_client")}/></FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <FL label={t("field_phone")}><input value={f.clientPhone} onChange={e=>s("clientPhone")(e.target.value)} placeholder="+33 6 00 00 00 00" type="tel"/></FL>
          <FL label={t("field_email")}><input value={f.clientEmail} onChange={e=>s("clientEmail")(e.target.value)} placeholder="client@email.com" type="email"/></FL>
        </div>
        <FL label={t("field_equipment")}><input value={f.equipement} onChange={e=>s("equipement")(e.target.value)} placeholder={t("placeholder_equipment")}/></FL>
        <FL label={t("field_fault")}><textarea value={f.panne} onChange={e=>s("panne")(e.target.value)} rows={3} placeholder={t("placeholder_fault")}/></FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <FL label={t("field_technician")}><select value={f.technicien} onChange={e=>s("technicien")(e.target.value)}><option value="">—</option>{techs.map(tk=><option key={tk}>{tk}</option>)}</select></FL>
          <FL label={t("field_department")}><select value={f.departement} onChange={e=>s("departement")(e.target.value)}><option value="">—</option>{["SAV","Commercial","Direction","Logistique"].map(d=><option key={d}>{d}</option>)}</select></FL>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <FL label={t("field_priority")}><select value={f.priorite} onChange={e=>s("priorite")(e.target.value)}>{["Normale","Haute","Urgente"].map(p=><option key={p}>{p}</option>)}</select></FL>
          <FL label={t("field_status")}><select value={f.statut} onChange={e=>s("statut")(e.target.value)}>{Object.keys(STATUSES).map(k=><option key={k}>{k}</option>)}</select></FL>
        </div>
        <FL label={t("field_notes")}><textarea value={f.commentaires} onChange={e=>s("commentaires")(e.target.value)} rows={2} placeholder={t("placeholder_notes")}/></FL>
        <Btn color="green" onClick={()=>{if(!f.client||!f.equipement||!f.panne)return;onCreate(f);}}>{t("btn_create")}</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   USER FORM
═══════════════════════════════════════════ */
function UserForm({init,onSave,lang}){
  const t=(k,v)=>tx(lang,k,v);
  const [f,setF]=useState(init||{name:"",email:"",pin:"",role:"technician"});
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <FL label={t("field_name")}><input value={f.name} onChange={e=>s("name")(e.target.value)} placeholder="Jean-Pierre"/></FL>
      <FL label={t("field_email")}><input value={f.email} onChange={e=>s("email")(e.target.value)} placeholder="jp@pimak.fr" type="email"/></FL>
      <FL label={t("field_pin")}><input value={f.pin} onChange={e=>s("pin")(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder={t("pin_hint")} type="password"/></FL>
      <FL label={t("field_role")}><select value={f.role} onChange={e=>s("role")(e.target.value)}><option value="technician">{t("role_tech")}</option><option value="admin">{t("role_admin")}</option></select></FL>
      <Btn color="blue" onClick={()=>{if(!f.name||!f.pin)return;onSave(f);}}>{t("btn_save")}</Btn>
    </div>
  );
}
/* ═══════════════════════════════════════════
   TICKET EDIT FORM (Admin only)
═══════════════════════════════════════════ */
function TicketEditForm({ticket,onSave,lang}){
  const t=(k,v)=>tx(lang,k,v);
  const [f,setF]=useState({
    client:ticket.client||"",
    clientPhone:ticket.clientPhone||"",
    clientEmail:ticket.clientEmail||"",
    equipement:ticket.equipement||"",
    panne:ticket.panne||"",
    technicien:ticket.technicien||"",
    departement:ticket.departement||"",
    priorite:ticket.priorite||"Normale",
    statut:ticket.statut||"Ouvert",
    commentaires:ticket.commentaires||"",
  });
  const s=k=>v=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      <FL label={t("f_client")||"Client"}><input value={f.client} onChange={e=>s("client")(e.target.value)}/></FL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <FL label={t("f_phone")||"Téléphone"}><input value={f.clientPhone} onChange={e=>s("clientPhone")(e.target.value)} type="tel"/></FL>
        <FL label={t("f_email")||"Email"}><input value={f.clientEmail} onChange={e=>s("clientEmail")(e.target.value)} type="email"/></FL>
      </div>
      <FL label={t("f_equip")||"Équipement"}><input value={f.equipement} onChange={e=>s("equipement")(e.target.value)}/></FL>
      <FL label={t("f_fault")||"Panne"}><textarea value={f.panne} onChange={e=>s("panne")(e.target.value)} rows={3}/></FL>
      <FL label={t("f_notes")||"Notes"}><textarea value={f.commentaires} onChange={e=>s("commentaires")(e.target.value)} rows={2}/></FL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <FL label={t("f_prio")||"Priorité"}>
          <select value={f.priorite} onChange={e=>s("priorite")(e.target.value)}>
            {["Normale","Haute","Urgente"].map(p=><option key={p}>{p}</option>)}
          </select>
        </FL>
        <FL label={t("f_status")||"Statut"}>
          <select value={f.statut} onChange={e=>s("statut")(e.target.value)}>
            {["Ouvert","En cours","En attente","Clôturé","Livré"].map(s=><option key={s}>{s}</option>)}
          </select>
        </FL>
      </div>
      <Btn color="green" onClick={()=>onSave(f)}>{t("btn_save")||"Enregistrer"}</Btn>
    </div>
  );
}

/* ═══════════════════════════════════════════
   QR SHEET
═══════════════════════════════════════════ */
function QRSheet({t:ticket,lang,onPrint}){
  const t=(k,v)=>tx(lang,k,v);
  const canvasRef=useRef();
  const [ready,setReady]=useState(false);
  const [saving,setSaving]=useState(false);
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.numero)}&bgcolor=ffffff&color=111111&margin=10`;

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const W=400,H=480; canvas.width=W; canvas.height=H;
    ctx.fillStyle="#ffffff"; ctx.beginPath(); ctx.roundRect(0,0,W,H,16); ctx.fill();
    ctx.fillStyle="#111111"; ctx.beginPath();
    ctx.roundRect(0,0,W,52,{upperLeft:16,upperRight:16,lowerLeft:0,lowerRight:0}); ctx.fill();
    ctx.fillStyle="#ffffff"; ctx.font="600 13px Inter,-apple-system,sans-serif";
    ctx.letterSpacing="3px"; ctx.textAlign="center"; ctx.fillText("PIMAK FRANCE",W/2,22);
    ctx.font="400 9px Inter,-apple-system,sans-serif"; ctx.fillStyle="rgba(255,255,255,0.55)";
    ctx.fillText("SERVICE APRÈS-VENTE",W/2,38);
    const img=new Image(); img.crossOrigin="anonymous";
    img.onload=()=>{
      ctx.drawImage(img,100,68,200,200);
      ctx.fillStyle="#111111"; ctx.font="600 22px Inter,-apple-system,sans-serif";
      ctx.letterSpacing="1px"; ctx.textAlign="center"; ctx.fillText(ticket.numero,W/2,300);
      ctx.strokeStyle="#f0f0f0"; ctx.lineWidth=1; ctx.beginPath();
      ctx.moveTo(28,316); ctx.lineTo(W-28,316); ctx.stroke();
      ctx.fillStyle="#111111"; ctx.font="500 13px Inter,-apple-system,sans-serif";
      ctx.letterSpacing="0px";
      const cl=ticket.client.length>32?ticket.client.slice(0,32)+"…":ticket.client;
      ctx.fillText(cl,W/2,338);
      ctx.fillStyle="#888888"; ctx.font="400 11px Inter,-apple-system,sans-serif";
      const eq=ticket.equipement.length>38?ticket.equipement.slice(0,38)+"…":ticket.equipement;
      ctx.fillText(eq,W/2,357);
      ctx.fillStyle="#aaaaaa"; ctx.font="400 10px Inter,-apple-system,sans-serif";
      ctx.fillText(`${t("qr_open_date")} ${ticket.date_ouverture}`,W/2,376);
      ctx.strokeStyle="#e8e8e8"; ctx.lineWidth=1.5; ctx.beginPath();
      ctx.roundRect(0.75,0.75,W-1.5,H-1.5,16); ctx.stroke();
      ctx.fillStyle="#cccccc"; ctx.font="400 9px Inter,-apple-system,sans-serif";
      ctx.fillText(t("qr_scan_hint"),W/2,456);
      setReady(true);
    };
    img.onerror=()=>{
      ctx.fillStyle="#f5f5f5"; ctx.fillRect(100,68,200,200);
      ctx.fillStyle="#aaa"; ctx.font="11px sans-serif"; ctx.textAlign="center";
      ctx.fillText("QR Code",W/2,172); setReady(true);
    };
    img.src=qrUrl;
  },[ticket,lang]);

  const savePNG=async()=>{
    setSaving(true);
    const url=canvasRef.current.toDataURL("image/png");
    const a=document.createElement("a"); a.href=url;
    a.download=`${ticket.numero}-sticker.png`; a.click();
    setTimeout(()=>setSaving(false),800);
  };

  const printSticker=()=>{
    const dataUrl=canvasRef.current.toDataURL("image/png");
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Sticker ${ticket.numero}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f0f0}.wrap{background:#fff;padding:24px;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,.1)}img{width:200px;height:240px;display:block}p{text-align:center;font-size:10px;color:#aaa;margin-top:10px;font-family:sans-serif}@media print{body{background:#fff}.wrap{box-shadow:none;padding:0}p{display:none}}</style></head><body onload="window.print()"><div class="wrap"><img src="${dataUrl}"/><p>${t("qr_cut")}</p></div></body></html>`);
    w.document.close();
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{background:"var(--greenbg)",border:"1px solid var(--greenborder)",borderRadius:R.full,padding:"4px 14px",fontSize:11,fontWeight:600,color:"var(--green)",marginBottom:14}}>
        ✓ {t("qr_created",{n:ticket.numero})}
      </div>
      <div style={{borderRadius:R.lg,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",marginBottom:16,border:"1px solid var(--b0)"}}>
        <canvas ref={canvasRef} style={{display:"block",width:200,height:240}}/>
      </div>
      <div style={{fontSize:11,color:"var(--t2)",textAlign:"center",marginBottom:16,lineHeight:1.6}}>
        {ticket.client}<br/><span style={{color:"var(--t3)"}}>{ticket.equipement}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7,width:"100%"}}>
        <Btn color="black" onClick={printSticker} disabled={!ready}>{t("qr_print")}</Btn>
        <Btn color="blue" onClick={savePNG} disabled={!ready||saving}>{saving?t("qr_saving"):t("qr_save_png")}</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCAN SHEET
═══════════════════════════════════════════ */
function ScanSheet({tickets,onSelect,lang}){
  const t=(k,v)=>tx(lang,k,v);
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
    return()=>stream?.getTracks().forEach(tk=>tk.stop());
  },[]);

  const tryLookup=()=>{
    const found=tickets.find(tk=>tk.numero===val.trim().toUpperCase());
    if(found)onSelect(found);
  };

  return(
    <div>
      <div style={{borderRadius:R.lg,overflow:"hidden",background:"var(--s2)",aspectRatio:"4/3",marginBottom:12,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {!camErr?(
          <>
            <video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:camOn?"block":"none"}}/>
            {!camOn&&<div style={{fontSize:11,color:"var(--t2)"}}>…</div>}
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
              <div style={{width:150,height:150,border:"2px solid rgba(255,255,255,.75)",borderRadius:R.md,boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"}}/>
            </div>
          </>
        ):(
          <div style={{textAlign:"center",padding:20,color:"var(--t2)",fontSize:11}}>{t("scan_no_cam")}</div>
        )}
      </div>
      <div style={{fontSize:10,color:"var(--t2)",textAlign:"center",marginBottom:12}}>{camOn?t("scan_point"):t("scan_manual")}</div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={val} onChange={e=>setVal(e.target.value.toUpperCase())} placeholder="PI-001" onKeyDown={e=>e.key==="Enter"&&tryLookup()}/>
        <button onClick={tryLookup} style={{background:"var(--t0)",color:"var(--bg)",border:"none",borderRadius:R.md,padding:"0 16px",fontSize:14,fontWeight:500,flexShrink:0,fontFamily:FONT}}>→</button>
      </div>
      <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{t("scan_active")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {tickets.filter(tk=>tk.statut!=="Livré").map(tk=>(
          <button key={tk.id} onClick={()=>onSelect(tk)} style={{background:"var(--s1)",border:"1px solid var(--b0)",borderRadius:R.md,padding:"10px 12px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:FONT}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:"var(--t0)",marginBottom:1}}>{tk.numero} · {tk.client}</div>
              <div style={{fontSize:11,color:"var(--t2)"}}>{tk.equipement}</div>
            </div>
            <span style={{width:6,height:6,borderRadius:"50%",background:STATUSES[tk.statut]?.dot,display:"inline-block",flexShrink:0}}/>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIGNATURE CANVAS
═══════════════════════════════════════════ */
function SigCanvas({onDone,onBack,lang}){
  const t=(k,v)=>tx(lang,k,v);
  const ref=useRef();
  const drawing=useRef(false);
  const [drawn,setDrawn]=useState(false);
  const pos=(e,c)=>{const r=c.getBoundingClientRect(),tc=e.touches?.[0]||e;return{x:(tc.clientX-r.left)*(c.width/r.width),y:(tc.clientY-r.top)*(c.height/r.height)};};
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
      <div style={{fontSize:10,color:"var(--t2)",textAlign:"center",marginBottom:10}}>{drawn?t("sig_done"):t("sig_hint")}</div>
      <div style={{display:"flex",gap:7}}>
        <button onClick={onBack} style={{padding:"10px 13px",borderRadius:R.md,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontSize:12,fontFamily:FONT}}>{t("sig_back")}</button>
        <button onClick={clear} style={{padding:"10px 13px",borderRadius:R.md,border:"1px solid var(--b0)",background:"var(--s1)",color:"var(--t1)",fontSize:12,fontFamily:FONT}}>{t("sig_clear")}</button>
        <button onClick={()=>drawn&&onDone(ref.current.toDataURL())} style={{flex:1,padding:"10px",borderRadius:R.md,border:"none",background:drawn?"#059669":"var(--s2)",color:drawn?"#fff":"var(--t2)",fontSize:12,fontWeight:500,transition:"all .15s",cursor:drawn?"pointer":"default",fontFamily:FONT}}>{t("sig_confirm")}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PHOTO ZONE
═══════════════════════════════════════════ */
function PhotoZone({photos,onAdd,onRemove,onView,lang}){
  const t=(k,v)=>tx(lang,k,v);
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
        {photos.length===0?t("photo_add"):t("photo_add_more",{n:photos.length})}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANTS DE BASE
═══════════════════════════════════════════ */
function TRow({t:tk,onSel,np,delay=0}){
  const st=STATUSES[tk.statut]||STATUSES.Ouvert;
  return(
    <div onClick={()=>onSel(tk)} style={{background:"var(--s0)",border:"1px solid var(--b0)",borderRadius:R.lg,padding:"12px 14px",cursor:"pointer",animation:"up .2s ease both",animationDelay:`${delay}ms`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:st.dot,display:"inline-block",flexShrink:0}}/>
          <span style={{fontSize:11,fontWeight:600,color:"var(--t0)",fontVariantNumeric:"tabular-nums",letterSpacing:"0.02em"}}>{tk.numero}</span>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {np>0&&<span style={{fontSize:10,color:"var(--t2)"}}>{np}↑</span>}
          {tk.signature&&<span style={{fontSize:10,color:"var(--green)"}}>✓</span>}
          {tk.priorite==="Urgente"&&<span style={{fontSize:10,color:"var(--red)",fontWeight:600}}>!</span>}
          <StatusPill s={st}>{st.label}</StatusPill>
        </div>
      </div>
      <div style={{fontSize:13,fontWeight:500,color:"var(--t0)",marginBottom:2}}>{tk.client}</div>
      <div style={{fontSize:11,color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tk.equipement}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
        <span style={{fontSize:10,color:"var(--t2)"}}>{tk.date_ouverture}</span>
        {tk.technicien&&<span style={{fontSize:10,color:"var(--t2)"}}>{tk.technicien}</span>}
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

const BTN_COLORS={
  black: {bg:"var(--t0)",      fg:"var(--bg)",     bdr:"transparent"      },
  green: {bg:"var(--greenbg)", fg:"var(--green)",  bdr:"var(--greenborder)"},
  blue:  {bg:"var(--bluebg)",  fg:"var(--blue)",   bdr:"var(--blueborder)" },
  amber: {bg:"var(--amberbg)", fg:"var(--amber)",  bdr:"var(--amberborder)"},
  red:   {bg:"var(--redbg)",   fg:"var(--red)",    bdr:"var(--redborder)"  },
  purple:{bg:"var(--purplebg)",fg:"var(--purple)", bdr:"var(--purpleborder)"},
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

function NoteInput({onAdd,lang}){
  const t=(k,v)=>tx(lang,k,v);
  const [v,setV]=useState("");
  return(
    <div style={{padding:"11px 13px"}}>
      <textarea value={v} onChange={e=>setV(e.target.value)} rows={2} placeholder={t("note_placeholder")} style={{marginBottom:7}}/>
      <Btn color="blue" onClick={()=>{if(v.trim()){onAdd(v.trim());setV("");}}}>{t("btn_add_note")}</Btn>
    </div>
  );
}
