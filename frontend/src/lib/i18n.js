import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API } from "@/App";
import axios from "axios";

const translations = {
  en: {
    // Nav
    overview: "Overview", invoices: "Invoices", expenses: "Expenses", tax_center: "Tax Center",
    projects: "Projects", clients: "Clients", compliance: "Compliance", settings: "Settings",
    recurring: "Recurring", sign_out: "Sign Out",
    // Common
    create: "Create", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit",
    search: "Search", filter: "Filter", export: "Export", download: "Download",
    loading: "Loading...", no_data: "No data yet", back: "Back", submit: "Submit",
    // Auth
    sign_in: "Sign In", create_account: "Create Account", email: "Email", password: "Password",
    full_name: "Full Name", company: "Company", continue_google: "Continue with Google",
    welcome_back: "Welcome back", financial_clarity: "Financial clarity for modern freelancers",
    // Dashboard
    revenue: "Revenue", pending: "Pending", tax_collected: "Tax Collected",
    active_projects: "Active Projects", recent_invoices: "Recent Invoices",
    revenue_tax_overview: "Revenue & Tax Overview", heres_overview: "Here's your financial overview",
    // Invoices
    new_invoice: "New Invoice", client_name: "Client Name", due_date: "Due Date",
    status: "Status", amount: "Amount", currency: "Currency", tax_rate: "Tax Rate",
    subtotal: "Subtotal", total: "Total", notes: "Notes", line_items: "Line Items",
    description: "Description", quantity: "Quantity", unit_price: "Unit Price",
    add_item: "Add Item", payment_terms: "Payment Terms", download_pdf: "Download PDF",
    mark_sent: "Mark Sent", mark_paid: "Mark Paid", invoice_details: "Invoice Details",
    client_info: "Client Information", draft: "Draft", sent: "Sent", paid: "Paid",
    // Recurring
    recurring_invoices: "Recurring Invoices", frequency: "Frequency", next_date: "Next Date",
    weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly",
    create_recurring: "Create Recurring", active: "Active", paused: "Paused",
    manage_recurring: "Manage your recurring invoice templates",
    // Expenses
    new_expense: "New Expense", vendor: "Vendor", category: "Category", date: "Date",
    total_expenses: "Total Expenses", transactions: "Transactions", top_category: "Top Category",
    by_category: "By Category", monthly_trend: "Monthly Trend",
    scan_receipt: "Upload a receipt for automatic scanning",
    // Tax
    calculate: "Calculate", rate: "Rate", tax_amount: "Tax Amount",
    vat: "VAT / KDV", withholding: "Withholding", income_tax: "Income Tax",
    tax_vault: "Tax Vault", deposit: "Deposit", withdraw: "Withdraw",
    set_target: "Set Target", manage_vault: "Manage Vault",
    // Projects
    new_project: "New Project", budget: "Budget", milestones: "Milestones",
    add_milestone: "Add Milestone", budget_usage: "Budget Usage",
    // Clients
    new_client: "New Client", phone: "Phone", address: "Address", website: "Website",
    // Compliance
    global_compliance: "Global Compliance", run_check: "Run Compliance Check",
    country: "Country", score: "Score", country_regulations: "Country Regulations",
    // Settings
    profile: "Profile", security: "Security", signature: "Signature", data: "Data",
    account: "Account", language: "Language", change_password: "Change Password",
    export_data: "Export Data", delete_data: "Delete All Data", delete_account: "Delete Account",
    save_changes: "Save Changes", current_password: "Current Password", new_password: "New Password",
    // Notifications
    notifications: "Notifications", no_notifications: "No new notifications",
    mark_all_read: "Mark all read",
    // Portal
    client_portal: "Client Portal", copy_link: "Copy Link", link_copied: "Link copied!",
    invoice_viewed: "Invoice viewed by client", powered_by: "Powered by Keeps",
    // Language
    select_language: "Select Language",
  },
  tr: {
    overview: "Genel Bakis", invoices: "Faturalar", expenses: "Giderler", tax_center: "Vergi Merkezi",
    projects: "Projeler", clients: "Musteriler", compliance: "Uyumluluk", settings: "Ayarlar",
    recurring: "Tekrarlayan", sign_out: "Cikis Yap",
    create: "Olustur", save: "Kaydet", cancel: "Iptal", delete: "Sil", edit: "Duzenle",
    search: "Ara", filter: "Filtrele", export: "Disari Aktar", download: "Indir",
    loading: "Yukleniyor...", no_data: "Henuz veri yok", back: "Geri", submit: "Gonder",
    sign_in: "Giris Yap", create_account: "Hesap Olustur", email: "E-posta", password: "Sifre",
    full_name: "Ad Soyad", company: "Sirket", continue_google: "Google ile devam et",
    welcome_back: "Tekrar hos geldiniz", financial_clarity: "Modern serbest calisanlar icin finansal netlik",
    revenue: "Gelir", pending: "Bekleyen", tax_collected: "Toplanan Vergi",
    active_projects: "Aktif Projeler", recent_invoices: "Son Faturalar",
    revenue_tax_overview: "Gelir ve Vergi Ozeti", heres_overview: "Finansal durumunuzun ozeti",
    new_invoice: "Yeni Fatura", client_name: "Musteri Adi", due_date: "Vade Tarihi",
    status: "Durum", amount: "Tutar", currency: "Para Birimi", tax_rate: "Vergi Orani",
    subtotal: "Ara Toplam", total: "Toplam", notes: "Notlar", line_items: "Kalemler",
    description: "Aciklama", quantity: "Miktar", unit_price: "Birim Fiyat",
    add_item: "Kalem Ekle", payment_terms: "Odeme Kosullari", download_pdf: "PDF Indir",
    mark_sent: "Gonderildi", mark_paid: "Odendi", invoice_details: "Fatura Detaylari",
    client_info: "Musteri Bilgileri", draft: "Taslak", sent: "Gonderildi", paid: "Odendi",
    recurring_invoices: "Tekrarlayan Faturalar", frequency: "Siklik", next_date: "Sonraki Tarih",
    weekly: "Haftalik", monthly: "Aylik", quarterly: "Uc Aylik", yearly: "Yillik",
    create_recurring: "Tekrarlayan Olustur", active: "Aktif", paused: "Duraklatildi",
    manage_recurring: "Tekrarlayan fatura sablonlarinizi yonetin",
    new_expense: "Yeni Gider", vendor: "Satici", category: "Kategori", date: "Tarih",
    total_expenses: "Toplam Giderler", transactions: "Islemler", top_category: "En Cok Kategori",
    by_category: "Kategoriye Gore", monthly_trend: "Aylik Trend",
    scan_receipt: "Otomatik tarama icin fis yukleyin",
    calculate: "Hesapla", rate: "Oran", tax_amount: "Vergi Tutari",
    vat: "KDV", withholding: "Stopaj", income_tax: "Gelir Vergisi",
    tax_vault: "Vergi Kasasi", deposit: "Yatir", withdraw: "Cek",
    set_target: "Hedef Belirle", manage_vault: "Kasayi Yonet",
    new_project: "Yeni Proje", budget: "Butce", milestones: "Kilometre Taslari",
    add_milestone: "Kilometre Tasi Ekle", budget_usage: "Butce Kullanimi",
    new_client: "Yeni Musteri", phone: "Telefon", address: "Adres", website: "Web Sitesi",
    global_compliance: "Kuresel Uyumluluk", run_check: "Uyumluluk Kontrolu",
    country: "Ulke", score: "Puan", country_regulations: "Ulke Mevzuati",
    profile: "Profil", security: "Guvenlik", signature: "Imza", data: "Veri",
    account: "Hesap", language: "Dil", change_password: "Sifre Degistir",
    export_data: "Verileri Disari Aktar", delete_data: "Tum Verileri Sil", delete_account: "Hesabi Sil",
    save_changes: "Degisiklikleri Kaydet", current_password: "Mevcut Sifre", new_password: "Yeni Sifre",
    notifications: "Bildirimler", no_notifications: "Yeni bildirim yok",
    mark_all_read: "Tumunu okundu isaretle",
    client_portal: "Musteri Portali", copy_link: "Baglanti Kopyala", link_copied: "Baglanti kopyalandi!",
    invoice_viewed: "Fatura musteri tarafindan goruntulendi", powered_by: "Keeps tarafindan desteklenmektedir",
    select_language: "Dil Secin",
  },
  fr: {
    overview: "Apercu", invoices: "Factures", expenses: "Depenses", tax_center: "Centre Fiscal",
    projects: "Projets", clients: "Clients", compliance: "Conformite", settings: "Parametres",
    recurring: "Recurrent", sign_out: "Deconnexion",
    create: "Creer", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier",
    search: "Rechercher", filter: "Filtrer", export: "Exporter", download: "Telecharger",
    loading: "Chargement...", no_data: "Aucune donnee", back: "Retour", submit: "Soumettre",
    sign_in: "Connexion", create_account: "Creer un compte", email: "E-mail", password: "Mot de passe",
    full_name: "Nom complet", company: "Entreprise", continue_google: "Continuer avec Google",
    welcome_back: "Bon retour", financial_clarity: "Clarte financiere pour les freelances modernes",
    revenue: "Revenus", pending: "En attente", tax_collected: "Taxes collectees",
    active_projects: "Projets actifs", recent_invoices: "Factures recentes",
    revenue_tax_overview: "Apercu revenus et taxes", heres_overview: "Voici votre apercu financier",
    new_invoice: "Nouvelle facture", client_name: "Nom du client", due_date: "Echeance",
    status: "Statut", amount: "Montant", currency: "Devise", tax_rate: "Taux de taxe",
    subtotal: "Sous-total", total: "Total", notes: "Notes", line_items: "Lignes",
    description: "Description", quantity: "Quantite", unit_price: "Prix unitaire",
    add_item: "Ajouter", payment_terms: "Conditions", download_pdf: "Telecharger PDF",
    mark_sent: "Envoyee", mark_paid: "Payee", invoice_details: "Details facture",
    client_info: "Informations client", draft: "Brouillon", sent: "Envoyee", paid: "Payee",
    recurring_invoices: "Factures recurrentes", frequency: "Frequence", next_date: "Prochaine date",
    weekly: "Hebdomadaire", monthly: "Mensuel", quarterly: "Trimestriel", yearly: "Annuel",
    create_recurring: "Creer recurrent", active: "Actif", paused: "En pause",
    manage_recurring: "Gerez vos modeles de factures recurrentes",
    new_expense: "Nouvelle depense", vendor: "Fournisseur", category: "Categorie", date: "Date",
    total_expenses: "Total depenses", transactions: "Transactions", top_category: "Categorie principale",
    by_category: "Par categorie", monthly_trend: "Tendance mensuelle",
    scan_receipt: "Telechargez un recu pour la numerisation",
    calculate: "Calculer", rate: "Taux", tax_amount: "Montant taxe",
    vat: "TVA", withholding: "Retenue", income_tax: "Impot sur le revenu",
    tax_vault: "Coffre fiscal", deposit: "Deposer", withdraw: "Retirer",
    set_target: "Definir objectif", manage_vault: "Gerer le coffre",
    new_project: "Nouveau projet", budget: "Budget", milestones: "Jalons",
    add_milestone: "Ajouter jalon", budget_usage: "Utilisation budget",
    new_client: "Nouveau client", phone: "Telephone", address: "Adresse", website: "Site web",
    global_compliance: "Conformite mondiale", run_check: "Verifier conformite",
    country: "Pays", score: "Score", country_regulations: "Reglementations",
    profile: "Profil", security: "Securite", signature: "Signature", data: "Donnees",
    account: "Compte", language: "Langue", change_password: "Changer mot de passe",
    export_data: "Exporter donnees", delete_data: "Supprimer donnees", delete_account: "Supprimer compte",
    save_changes: "Enregistrer", current_password: "Mot de passe actuel", new_password: "Nouveau mot de passe",
    notifications: "Notifications", no_notifications: "Aucune notification",
    mark_all_read: "Tout marquer lu", client_portal: "Portail client",
    copy_link: "Copier lien", link_copied: "Lien copie!", select_language: "Choisir la langue",
    invoice_viewed: "Facture vue par le client", powered_by: "Propulse par Keeps",
  },
  de: {
    overview: "Ubersicht", invoices: "Rechnungen", expenses: "Ausgaben", tax_center: "Steuerzentrum",
    projects: "Projekte", clients: "Kunden", compliance: "Compliance", settings: "Einstellungen",
    recurring: "Wiederkehrend", sign_out: "Abmelden",
    create: "Erstellen", save: "Speichern", cancel: "Abbrechen", delete: "Loschen", edit: "Bearbeiten",
    loading: "Laden...", no_data: "Keine Daten", back: "Zuruck", submit: "Absenden",
    sign_in: "Anmelden", create_account: "Konto erstellen", email: "E-Mail", password: "Passwort",
    full_name: "Vollstandiger Name", company: "Unternehmen", continue_google: "Weiter mit Google",
    welcome_back: "Willkommen zuruck", financial_clarity: "Finanzielle Klarheit fur moderne Freelancer",
    revenue: "Umsatz", pending: "Ausstehend", tax_collected: "Steuer erhoben",
    active_projects: "Aktive Projekte", recent_invoices: "Letzte Rechnungen",
    new_invoice: "Neue Rechnung", client_name: "Kundenname", due_date: "Falligkeitsdatum",
    status: "Status", amount: "Betrag", currency: "Wahrung", tax_rate: "Steuersatz",
    subtotal: "Zwischensumme", total: "Gesamt", notes: "Notizen", line_items: "Positionen",
    description: "Beschreibung", quantity: "Menge", unit_price: "Einzelpreis",
    add_item: "Position hinzufugen", download_pdf: "PDF herunterladen",
    recurring_invoices: "Wiederkehrende Rechnungen", frequency: "Haufigkeit",
    weekly: "Wochentlich", monthly: "Monatlich", quarterly: "Vierteljahrlich", yearly: "Jahrlich",
    new_expense: "Neue Ausgabe", vendor: "Lieferant", category: "Kategorie", date: "Datum",
    total_expenses: "Gesamtausgaben", calculate: "Berechnen",
    vat: "MwSt", withholding: "Quellensteuer", income_tax: "Einkommensteuer",
    tax_vault: "Steuer-Tresor", deposit: "Einzahlen", withdraw: "Abheben",
    new_project: "Neues Projekt", budget: "Budget", milestones: "Meilensteine",
    new_client: "Neuer Kunde", phone: "Telefon", address: "Adresse",
    global_compliance: "Globale Compliance", profile: "Profil", security: "Sicherheit",
    language: "Sprache", change_password: "Passwort andern", export_data: "Daten exportieren",
    delete_data: "Alle Daten loschen", delete_account: "Konto loschen", save_changes: "Speichern",
    notifications: "Benachrichtigungen", no_notifications: "Keine Benachrichtigungen",
    client_portal: "Kundenportal", copy_link: "Link kopieren", link_copied: "Link kopiert!",
    select_language: "Sprache wahlen", signature: "Unterschrift", data: "Daten", account: "Konto",
    payment_terms: "Zahlungsbedingungen", mark_sent: "Gesendet", mark_paid: "Bezahlt",
    draft: "Entwurf", sent: "Gesendet", paid: "Bezahlt", active: "Aktiv",
    revenue_tax_overview: "Umsatz- und Steueriibersicht", heres_overview: "Ihre Finanziibersicht",
    manage_recurring: "Verwalten Sie Ihre wiederkehrenden Rechnungsvorlagen",
    scan_receipt: "Beleg hochladen fur automatisches Scannen", powered_by: "Betrieben von Keeps",
  },
  es: {
    overview: "Resumen", invoices: "Facturas", expenses: "Gastos", tax_center: "Centro Fiscal",
    projects: "Proyectos", clients: "Clientes", compliance: "Cumplimiento", settings: "Configuracion",
    recurring: "Recurrente", sign_out: "Cerrar sesion",
    create: "Crear", save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar",
    loading: "Cargando...", no_data: "Sin datos", back: "Volver", submit: "Enviar",
    sign_in: "Iniciar sesion", create_account: "Crear cuenta", email: "Correo", password: "Contrasena",
    full_name: "Nombre completo", company: "Empresa", continue_google: "Continuar con Google",
    welcome_back: "Bienvenido de nuevo", financial_clarity: "Claridad financiera para freelancers modernos",
    revenue: "Ingresos", pending: "Pendiente", tax_collected: "Impuestos cobrados",
    active_projects: "Proyectos activos", recent_invoices: "Facturas recientes",
    new_invoice: "Nueva factura", client_name: "Nombre del cliente", due_date: "Fecha de vencimiento",
    status: "Estado", amount: "Monto", currency: "Moneda", tax_rate: "Tasa impositiva",
    subtotal: "Subtotal", total: "Total", notes: "Notas", line_items: "Elementos",
    description: "Descripcion", quantity: "Cantidad", unit_price: "Precio unitario",
    add_item: "Agregar elemento", download_pdf: "Descargar PDF",
    recurring_invoices: "Facturas recurrentes", frequency: "Frecuencia",
    weekly: "Semanal", monthly: "Mensual", quarterly: "Trimestral", yearly: "Anual",
    new_expense: "Nuevo gasto", vendor: "Proveedor", category: "Categoria", date: "Fecha",
    total_expenses: "Total gastos", calculate: "Calcular",
    vat: "IVA", withholding: "Retencion", income_tax: "Impuesto sobre la renta",
    tax_vault: "Boveda fiscal", deposit: "Depositar", withdraw: "Retirar",
    new_project: "Nuevo proyecto", budget: "Presupuesto", milestones: "Hitos",
    new_client: "Nuevo cliente", phone: "Telefono", address: "Direccion",
    global_compliance: "Cumplimiento global", profile: "Perfil", security: "Seguridad",
    language: "Idioma", change_password: "Cambiar contrasena", export_data: "Exportar datos",
    delete_data: "Eliminar datos", delete_account: "Eliminar cuenta", save_changes: "Guardar cambios",
    notifications: "Notificaciones", no_notifications: "Sin notificaciones",
    client_portal: "Portal del cliente", copy_link: "Copiar enlace", link_copied: "Enlace copiado!",
    select_language: "Seleccionar idioma", signature: "Firma", data: "Datos", account: "Cuenta",
    payment_terms: "Condiciones de pago", mark_sent: "Enviada", mark_paid: "Pagada",
    draft: "Borrador", sent: "Enviada", paid: "Pagada", active: "Activo",
    manage_recurring: "Gestione sus plantillas de facturas recurrentes",
    scan_receipt: "Suba un recibo para escaneo automatico", powered_by: "Impulsado por Keeps",
  },
  it: {
    overview: "Panoramica", invoices: "Fatture", expenses: "Spese", tax_center: "Centro Fiscale",
    projects: "Progetti", clients: "Clienti", compliance: "Conformita", settings: "Impostazioni",
    recurring: "Ricorrente", sign_out: "Esci",
    create: "Crea", save: "Salva", cancel: "Annulla", delete: "Elimina", edit: "Modifica",
    loading: "Caricamento...", no_data: "Nessun dato", back: "Indietro", submit: "Invia",
    sign_in: "Accedi", create_account: "Crea account", email: "Email", password: "Password",
    full_name: "Nome completo", company: "Azienda", continue_google: "Continua con Google",
    welcome_back: "Bentornato", financial_clarity: "Chiarezza finanziaria per freelancer moderni",
    revenue: "Ricavi", pending: "In sospeso", tax_collected: "Tasse riscosse",
    active_projects: "Progetti attivi", recent_invoices: "Fatture recenti",
    new_invoice: "Nuova fattura", client_name: "Nome cliente", due_date: "Scadenza",
    status: "Stato", amount: "Importo", currency: "Valuta", tax_rate: "Aliquota",
    subtotal: "Subtotale", total: "Totale", notes: "Note", line_items: "Voci",
    description: "Descrizione", quantity: "Quantita", unit_price: "Prezzo unitario",
    add_item: "Aggiungi voce", download_pdf: "Scarica PDF",
    recurring_invoices: "Fatture ricorrenti", frequency: "Frequenza",
    weekly: "Settimanale", monthly: "Mensile", quarterly: "Trimestrale", yearly: "Annuale",
    new_expense: "Nuova spesa", vendor: "Fornitore", category: "Categoria", date: "Data",
    total_expenses: "Spese totali", calculate: "Calcola",
    vat: "IVA", withholding: "Ritenuta", income_tax: "Imposta sul reddito",
    tax_vault: "Cassaforte fiscale", deposit: "Deposita", withdraw: "Preleva",
    new_project: "Nuovo progetto", budget: "Budget", milestones: "Traguardi",
    new_client: "Nuovo cliente", phone: "Telefono", address: "Indirizzo",
    global_compliance: "Conformita globale", profile: "Profilo", security: "Sicurezza",
    language: "Lingua", change_password: "Cambia password", export_data: "Esporta dati",
    delete_data: "Elimina dati", delete_account: "Elimina account", save_changes: "Salva modifiche",
    notifications: "Notifiche", no_notifications: "Nessuna notifica",
    client_portal: "Portale clienti", copy_link: "Copia link", link_copied: "Link copiato!",
    select_language: "Seleziona lingua", signature: "Firma", data: "Dati", account: "Account",
    draft: "Bozza", sent: "Inviata", paid: "Pagata", active: "Attivo",
    manage_recurring: "Gestisci i tuoi modelli di fatture ricorrenti",
    scan_receipt: "Carica una ricevuta per la scansione", powered_by: "Powered by Keeps",
  },
  ja: {
    overview: "概要", invoices: "請求書", expenses: "経費", tax_center: "税務センター",
    projects: "プロジェクト", clients: "クライアント", compliance: "コンプライアンス", settings: "設定",
    recurring: "定期", sign_out: "ログアウト",
    create: "作成", save: "保存", cancel: "キャンセル", delete: "削除", edit: "編集",
    loading: "読み込み中...", no_data: "データなし", back: "戻る", submit: "送信",
    sign_in: "ログイン", create_account: "アカウント作成", email: "メール", password: "パスワード",
    full_name: "氏名", company: "会社", continue_google: "Googleで続ける",
    welcome_back: "お帰りなさい", financial_clarity: "フリーランサーのための財務管理",
    revenue: "収益", pending: "保留中", tax_collected: "徴収税",
    active_projects: "進行中プロジェクト", recent_invoices: "最近の請求書",
    new_invoice: "新規請求書", client_name: "クライアント名", due_date: "支払期日",
    status: "ステータス", amount: "金額", currency: "通貨", tax_rate: "税率",
    subtotal: "小計", total: "合計", notes: "備考", line_items: "明細",
    description: "説明", quantity: "数量", unit_price: "単価",
    add_item: "明細追加", download_pdf: "PDFダウンロード",
    recurring_invoices: "定期請求書", frequency: "頻度",
    weekly: "週次", monthly: "月次", quarterly: "四半期", yearly: "年次",
    new_expense: "新規経費", vendor: "取引先", category: "カテゴリ", date: "日付",
    total_expenses: "経費合計", calculate: "計算",
    vat: "消費税", withholding: "源泉徴収", income_tax: "所得税",
    tax_vault: "税金積立", deposit: "入金", withdraw: "出金",
    new_project: "新規プロジェクト", budget: "予算", milestones: "マイルストーン",
    new_client: "新規クライアント", phone: "電話", address: "住所",
    global_compliance: "グローバルコンプライアンス", profile: "プロフィール", security: "セキュリティ",
    language: "言語", change_password: "パスワード変更", export_data: "データエクスポート",
    delete_data: "全データ削除", delete_account: "アカウント削除", save_changes: "変更を保存",
    notifications: "通知", no_notifications: "新しい通知なし",
    client_portal: "クライアントポータル", copy_link: "リンクコピー", link_copied: "コピーしました!",
    select_language: "言語を選択", signature: "署名", data: "データ", account: "アカウント",
    draft: "下書き", sent: "送信済み", paid: "支払済み", active: "アクティブ",
    manage_recurring: "定期請求書テンプレートを管理",
    scan_receipt: "レシートをアップロードして自動スキャン", powered_by: "Keeps提供",
  }
};

const LANG_LABELS = {
  en: "English", tr: "Turkce", fr: "Francais", de: "Deutsch",
  es: "Espanol", it: "Italiano", ja: "日本語"
};

const LangContext = createContext({ lang: "en", t: (k) => k, setLang: () => {}, langs: LANG_LABELS });

export const useLang = () => useContext(LangContext);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("keeps_lang") || "en");

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem("keeps_lang", l);
    // Save to server if authenticated
    axios.put(`${API}/settings/language`, { language: l }, { withCredentials: true }).catch(() => {});
  }, []);

  // Load language preference from server on mount
  useEffect(() => {
    const stored = localStorage.getItem("keeps_lang");
    if (!stored) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => {
          if (res.data?.language) {
            setLangState(res.data.language);
            localStorage.setItem("keeps_lang", res.data.language);
          }
        }).catch(() => {});
    }
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en?.[key] || key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, t, setLang, langs: LANG_LABELS }}>
      {children}
    </LangContext.Provider>
  );
}
