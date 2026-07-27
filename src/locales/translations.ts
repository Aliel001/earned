import { Language } from '../types';

export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi', flag: '🇧🇮' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
];

export const COUNTRY_CODES = [
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+243', country: 'DR Congo', flag: '🇨🇩' },
];

export const translations: Record<Language, Record<string, string>> = {
  rn: {
    // Nav
    home: 'Ahabanza',
    images: 'Amafoto',
    wallet: 'Igapuri',
    notifications: 'Amamenyesha',
    profile: 'Imyirondoro',
    admin: 'Ubuyobozi',

    // Header & Auth
    login: 'Kwinjira',
    register: 'Kwirangisha',
    logout: 'Gusohoka',
    welcome_bonus_badge: 'Bonus y\'Ikaze: 15,000 BIF',
    username: 'Izina ryo kwinjiraho',
    phone_number: 'Numero za telefoni',
    password: 'Inyandiko y\'ibanga',
    confirm_password: 'Emeza inyandiko y\'ibanga',
    select_country: 'Hitamo Igihugu',
    select_language: 'Hitamo Ururimi',
    already_have_account: 'Ufise konte? Injira',
    no_account_yet: 'Nta konte ufise? Izangishe',
    registration_pending_title: 'Konte Yawe Irarindiriye Kwemerwa',
    registration_pending_desc: 'Murakoze kwirangisha kuri TwigaMart! Bonus y\'ikaze ya 15,000 BIF yabitswe mu gapuri kawe. Ubuyobozi buriko burasuzuma konte yawe. Uzoyikoresha uheza kwemerwa.',
    contact_admin: 'Vugana n\'Ubuyobozi kuri WhatsApp',
    call_admin: 'Hamagara Ubuyobozi',
    check_status: 'Raba nimba wamerewe',

    // Dashboard
    current_balance: 'Amafaranga ufise',
    account_status: 'Inyifato ya Konte',
    available_images: 'Amafoto Ariho',
    total_likes: 'Kunda Zose',
    withdraw_btn: 'Saba Amafaranga',
    quick_stats: 'Icyino cy\'Inyungu',
    status_pending: 'Birarindiriye',
    status_approved: 'Yaremewe',
    status_rejected: 'Yanzwe',
    status_suspended: 'Irahagaritswe',

    // Image Rewards
    reward_per_like: 'Agashimwe ku gukunda',
    like_btn: 'Kunda',
    liked: 'Wamaze gukunda',
    earned_reward: 'Wakoreye',
    no_images_available: 'Nta mafoto mashasha ariho mu gihe gihaye.',

    // Wallet & Withdraw
    wallet_title: 'Igapuri Yawe',
    withdraw_title: 'Kusaba Amafaranga (Withdraw)',
    withdraw_amount: 'Ingano y\'Amafaranga (BIF)',
    payment_account_number: 'Numero ya Lumicash / Ecocash',
    min_withdraw_note: 'Ingano ntarengwa yo kwaka ni 5,000 BIF.',
    submit_withdraw: 'Ohereza Ubusabe',
    withdraw_history: 'Kahise k\'Ubusabe',
    no_withdrawals: 'Nta busabe bwo kwaka amafaranga uragira.',
    admin_message_label: 'Ubumenyeshi bw\'Ubuyobozi',
    payment_methods_instructions: 'Uburyo bwo Kwishyura & Mabwiriza',
    ussd_code_label: 'Ikode ya USSD',
    copy_code: 'Kopiya Ikode',
    code_copied: 'Ikode yakopewe!',

    // Notifications
    notifications_title: 'Amamenyesha Yawe',
    mark_all_read: 'Soma zose',
    no_notifications: 'Nta mamenyesha mashasha ufise.',

    // Profile
    profile_title: 'Imyirondoro y\'Umukoresha',
    language_settings: 'Uburimi',
    app_version: 'TwigaMart PWA v1.0 (Burundi)',
    pwa_install_btn: 'Shyira TwigaMart ku Telefoni',

    // Admin Panel
    admin_dashboard: 'Ikibaho cy\'Ubuyobozi',
    total_users: 'Abakoresha Bose',
    pending_users: 'Abataremerwa',
    approved_users: 'Abemewe',
    total_images: 'Amafoto Yose',
    pending_withdraws: 'Ubusabe bw\'Amafaranga',
    total_payouts: 'Amafaranga Yasohowe',
    user_management: 'Gucunga Abakoresha',
    image_management: 'Gucunga Amafoto',
    payment_settings_tab: 'Igenamiterere ry\'Ubwishyu',
    action_approve: 'Emeza',
    action_reject: 'Ogana',
    action_suspend: 'Hagarika',
    modify_balance: 'Hindura Amafaranga',
    add_balance: 'Ageraho',
    reduce_balance: 'Gabanura',
    set_balance: 'Shyiraho',
    add_image: 'Ongeraho Ifoto',
    image_title: 'Umutwe w\'Ifoto',
    image_url: 'Ikarita w\'Ifoto (URL)',
    reward_amount: 'Agashimwe (BIF)',
    save_settings: 'Bika Igenamiterere',
    reject_reason_prompt: 'Andika ubumenyeshi kuri uyu muryango/ubusabe:',

    // Common
    success: 'Byagenze neza!',
    error: 'Ikosa ryabaye.',
    close: 'Funga',
  },
  rw: {
    // Nav
    home: 'Ahabanza',
    images: 'Amafoto',
    wallet: 'Igapuri',
    notifications: 'Amamenyesha',
    profile: 'Imyirondoro',
    admin: 'Ubuyobozi',

    // Header & Auth
    login: 'Kwinjira',
    register: 'Kwirangisha',
    logout: 'Gusohoka',
    welcome_bonus_badge: 'Bonus y\'Ikaze: 15,000 BIF',
    username: 'Izina ryo kwinjiraho',
    phone_number: 'Numero za terefoni',
    password: 'Ijambo ry\'ibanga',
    confirm_password: 'Emeza ijambo ry\'ibanga',
    select_country: 'Hitamo Igihugu',
    select_language: 'Hitamo Ururimi',
    already_have_account: 'Ufite konte? Injira',
    no_account_yet: 'Nta konte ufite? Izangishe',
    registration_pending_title: 'Konte Yawe Irarindiriye Kwemerwa',
    registration_pending_desc: 'Murakoze kwirangisha kuri TwigaMart! Bonus y\'ikaze ya 15,000 BIF yabitswe mu gapuri kawe. Ubuyobozi buri gusuzuma konte yawe.',
    contact_admin: 'Vugana n\'Ubuyobozi kuri WhatsApp',
    call_admin: 'Hamagara Ubuyobozi',
    check_status: 'Raba ko wamerewe',

    // Dashboard
    current_balance: 'Amafaranga ufite',
    account_status: 'Imiterere ya Konte',
    available_images: 'Amafoto Ariho',
    total_likes: 'Kunda Zose',
    withdraw_btn: 'Saba Amafaranga',
    quick_stats: 'Inshamake',
    status_pending: 'Birarindiriye',
    status_approved: 'Byaremewe',
    status_rejected: 'Byanzwe',
    status_suspended: 'Byahagaritswe',

    // Image Rewards
    reward_per_like: 'Igihembo ku gukunda',
    like_btn: 'Kunda',
    liked: 'Wamaze gukunda',
    earned_reward: 'Wakoreye',
    no_images_available: 'Nta mafoto mashya ariho.',

    // Wallet & Withdraw
    wallet_title: 'Igapuri Yawe',
    withdraw_title: 'Kusaba Amafaranga',
    withdraw_amount: 'Ingano y\'Amafaranga (BIF)',
    payment_account_number: 'Numero ya Lumicash / Ecocash',
    min_withdraw_note: 'Ingano yo kwaka ni nibura 5,000 BIF.',
    submit_withdraw: 'Ohereza Ubusabe',
    withdraw_history: 'Amateka y\'Ubusabe',
    no_withdrawals: 'Nta busabe bw\'amafaranga uragira.',
    admin_message_label: 'Ubumenyeshi bw\'Ubuyobozi',
    payment_methods_instructions: 'Uburyo bwo Kwishyura & Amabwiriza',
    ussd_code_label: 'Icode ya USSD',
    copy_code: 'Kopiya Icode',
    code_copied: 'Icode yakopewe!',

    // Notifications
    notifications_title: 'Amamenyesha Yawe',
    mark_all_read: 'Soma zose',
    no_notifications: 'Nta mamenyesha mashya ufite.',

    // Profile
    profile_title: 'Imyirondoro y\'Umukoresha',
    language_settings: 'Ururimi',
    app_version: 'TwigaMart PWA v1.0',
    pwa_install_btn: 'Shyira TwigaMart ku Terefoni',

    // Admin Panel
    admin_dashboard: 'Ikibaho cy\'Ubuyobozi',
    total_users: 'Abakoresha Bose',
    pending_users: 'Abataremerwa',
    approved_users: 'Abemewe',
    total_images: 'Amafoto Yose',
    pending_withdraws: 'Ubusabe bw\'Amafaranga',
    total_payouts: 'Amafaranga Yasohowe',
    user_management: 'Gucunga Abakoresha',
    image_management: 'Gucunga Amafoto',
    payment_settings_tab: 'Igenamiterere ry\'Ubwishyu',
    action_approve: 'Emeza',
    action_reject: 'Ogana',
    action_suspend: 'Hagarika',
    modify_balance: 'Hindura Amafaranga',
    add_balance: 'Ogeraho',
    reduce_balance: 'Gabanura',
    set_balance: 'Shyiraho',
    add_image: 'Ongeraho Ifoto',
    image_title: 'Umutwe w\'Ifoto',
    image_url: 'Ikarita w\'Ifoto (URL)',
    reward_amount: 'Agashimwe (BIF)',
    save_settings: 'Bika Igenamiterere',
    reject_reason_prompt: 'Andika ubumenyeshi kuri uyu muryango/ubusabe:',

    // Common
    success: 'Byagenze neza!',
    error: 'Ikosa ryabaye.',
    close: 'Funga',
  },
  en: {
    // Nav
    home: 'Home',
    images: 'Images',
    wallet: 'Wallet',
    notifications: 'Notifications',
    profile: 'Profile',
    admin: 'Admin',

    // Header & Auth
    login: 'Log In',
    register: 'Register',
    logout: 'Log Out',
    welcome_bonus_badge: 'Welcome Bonus: 15,000 BIF',
    username: 'Username',
    phone_number: 'Phone Number',
    password: 'Password',
    confirm_password: 'Confirm Password',
    select_country: 'Select Country',
    select_language: 'Select Language',
    already_have_account: 'Already have an account? Log In',
    no_account_yet: "Don't have an account? Register",
    registration_pending_title: 'Account Pending Approval',
    registration_pending_desc: 'Thank you for registering on TwigaMart! Your 15,000 BIF welcome bonus is credited. An administrator is reviewing your account.',
    contact_admin: 'Contact Admin on WhatsApp',
    call_admin: 'Call Admin Directly',
    check_status: 'Check Approval Status',

    // Dashboard
    current_balance: 'Current Balance',
    account_status: 'Account Status',
    available_images: 'Available Images',
    total_likes: 'Total Likes',
    withdraw_btn: 'Withdraw Funds',
    quick_stats: 'Quick Summary',
    status_pending: 'Pending Approval',
    status_approved: 'Approved',
    status_rejected: 'Rejected',
    status_suspended: 'Suspended',

    // Image Rewards
    reward_per_like: 'Reward per Like',
    like_btn: 'Like Image',
    liked: 'Liked',
    earned_reward: 'Earned',
    no_images_available: 'No images available right now.',

    // Wallet & Withdraw
    wallet_title: 'Your Wallet',
    withdraw_title: 'Request Withdrawal',
    withdraw_amount: 'Amount (BIF)',
    payment_account_number: 'Lumicash / Ecocash Number',
    min_withdraw_note: 'Minimum withdrawal amount is 5,000 BIF.',
    submit_withdraw: 'Submit Request',
    withdraw_history: 'Withdrawal History',
    no_withdrawals: 'No withdrawal requests yet.',
    admin_message_label: 'Admin Response',
    payment_methods_instructions: 'Payment Methods & Instructions',
    ussd_code_label: 'USSD Code',
    copy_code: 'Copy Code',
    code_copied: 'Code copied to clipboard!',

    // Notifications
    notifications_title: 'Notifications',
    mark_all_read: 'Mark all as read',
    no_notifications: 'No new notifications.',

    // Profile
    profile_title: 'User Profile',
    language_settings: 'Language',
    app_version: 'TwigaMart PWA v1.0',
    pwa_install_btn: 'Install TwigaMart App',

    // Admin Panel
    admin_dashboard: 'Admin Control Center',
    total_users: 'Total Users',
    pending_users: 'Pending Users',
    approved_users: 'Approved Users',
    total_images: 'Total Images',
    pending_withdraws: 'Pending Withdrawals',
    total_payouts: 'Total Payouts',
    user_management: 'User Management',
    image_management: 'Image Management',
    payment_settings_tab: 'Payment Settings',
    action_approve: 'Approve',
    action_reject: 'Reject',
    action_suspend: 'Suspend',
    modify_balance: 'Modify Balance',
    add_balance: 'Add',
    reduce_balance: 'Reduce',
    set_balance: 'Set Exact',
    add_image: 'Add New Image',
    image_title: 'Image Title',
    image_url: 'Image URL',
    reward_amount: 'Reward Amount (BIF)',
    save_settings: 'Save Settings',
    reject_reason_prompt: 'Provide a note/message for the user:',

    // Common
    success: 'Operation completed successfully!',
    error: 'An error occurred.',
    close: 'Close',
  },
  fr: {
    // Nav
    home: 'Accueil',
    images: 'Images',
    wallet: 'Portefeuille',
    notifications: 'Notifications',
    profile: 'Profil',
    admin: 'Admin',

    // Header & Auth
    login: 'Se connecter',
    register: "S'inscrire",
    logout: 'Déconnexion',
    welcome_bonus_badge: 'Bonus de bienvenue: 15,000 BIF',
    username: "Nom d'utilisateur",
    phone_number: 'Numéro de téléphone',
    password: 'Mot de passe',
    confirm_password: 'Confirmer le mot de passe',
    select_country: 'Sélectionner le pays',
    select_language: 'Sélectionner la langue',
    already_have_account: 'Déjà un compte ? Se connecter',
    no_account_yet: "Pas encore de compte ? S'inscrire",
    registration_pending_title: 'Compte en attente d\'approbation',
    registration_pending_desc: 'Merci de vous être inscrit sur TwigaMart ! Votre bonus de 15,000 BIF a été crédité. Un administrateur examine votre compte.',
    contact_admin: 'Contacter l\'Admin sur WhatsApp',
    call_admin: 'Appeler l\'Admin',
    check_status: 'Vérifier l\'état',

    // Dashboard
    current_balance: 'Solde actuel',
    account_status: 'Statut du compte',
    available_images: 'Images disponibles',
    total_likes: 'Total des likes',
    withdraw_btn: 'Retirer des fonds',
    quick_stats: 'Aperçu rapide',
    status_pending: 'En attente',
    status_approved: 'Approuvé',
    status_rejected: 'Rejeté',
    status_suspended: 'Suspendu',

    // Image Rewards
    reward_per_like: 'Récompense par like',
    like_btn: 'Aimer',
    liked: 'Aimé',
    earned_reward: 'Gagné',
    no_images_available: 'Aucune image disponible pour le moment.',

    // Wallet & Withdraw
    wallet_title: 'Votre Portefeuille',
    withdraw_title: 'Demande de retrait',
    withdraw_amount: 'Montant (BIF)',
    payment_account_number: 'Numéro Lumicash / Ecocash',
    min_withdraw_note: 'Le montant minimum de retrait est de 5 000 BIF.',
    submit_withdraw: 'Soumettre la demande',
    withdraw_history: 'Historique des retraits',
    no_withdrawals: 'Aucune demande de retrait pour le moment.',
    admin_message_label: 'Message de l\'Admin',
    payment_methods_instructions: 'Modes de paiement & Instructions',
    ussd_code_label: 'Code USSD',
    copy_code: 'Copier le code',
    code_copied: 'Code copié dans le presse-papier !',

    // Notifications
    notifications_title: 'Notifications',
    mark_all_read: 'Tout marquer comme lu',
    no_notifications: 'Aucune nouvelle notification.',

    // Profile
    profile_title: 'Profil Utilisateur',
    language_settings: 'Langue',
    app_version: 'TwigaMart PWA v1.0',
    pwa_install_btn: 'Installer l\'application TwigaMart',

    // Admin Panel
    admin_dashboard: 'Tableau de Bord Admin',
    total_users: 'Utilisateurs totaux',
    pending_users: 'En attente',
    approved_users: 'Approuvés',
    total_images: 'Images totales',
    pending_withdraws: 'Demandes de retrait',
    total_payouts: 'Paiements totaux',
    user_management: 'Gestion des utilisateurs',
    image_management: 'Gestion des images',
    payment_settings_tab: 'Paramètres de paiement',
    action_approve: 'Approuver',
    action_reject: 'Rejeter',
    action_suspend: 'Suspendre',
    modify_balance: 'Modifier le solde',
    add_balance: 'Ajouter',
    reduce_balance: 'Réduire',
    set_balance: 'Définir',
    add_image: 'Ajouter une image',
    image_title: 'Titre de l\'image',
    image_url: 'URL de l\'image',
    reward_amount: 'Récompense (BIF)',
    save_settings: 'Enregistrer',
    reject_reason_prompt: 'Message pour l\'utilisateur:',

    // Common
    success: 'Opération réussie !',
    error: 'Une erreur est survenue.',
    close: 'Fermer',
  },
};

export function t(key: string, lang: Language = 'rn'): string {
  const dict = translations[lang] || translations['rn'];
  return dict[key] || translations['en'][key] || key;
}
