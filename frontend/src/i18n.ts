import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.categories': 'Categories',
      'nav.warez': 'Warez',
      'nav.useful': 'Useful',
      'nav.vpn': 'VPN',
      'nav.hosting': 'Hosting',
      'nav.addLink': '+ Add Link',
      'nav.information': 'Information',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.logout': 'Logout',
      'nav.profile': 'Profile',
      'nav.favorites': 'Favorites',
      'nav.admin': 'Admin Panel',
      
      // Common
      'common.search': 'Search',
      'common.searchPlaceholder': 'Search links...',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.submit': 'Submit',
      'common.online': 'online',
      'common.total': 'total',
      'common.version': 'Version',
      'common.changes': 'Changes',
      'common.noResults': 'No results found',
      'common.viewAll': 'View All',
      'common.back': 'Back',
      
      // Sidebar
      'sidebar.linkOrder': 'Link Order',
      'sidebar.added': 'added',
      'sidebar.reported': 'reported',
      'sidebar.ads': 'ads',
      'sidebar.statistics': 'Statistics',
      'sidebar.lastUpdate': 'Last Update',
      
      // Pages
      'page.pricing': 'Pricing',
      'page.contact': 'Contact',
      'page.changelog': 'Changelog',
      'page.scam': 'Scam/Fake',
      'page.faq': 'FAQ',
      'page.api': 'API',
      'page.about': 'About',
      'page.privacy': 'Privacy',
      'page.terms': 'Terms',
      
      // Auth
      'auth.loginTitle': 'Login',
      'auth.registerTitle': 'Create Account',
      'auth.email': 'Email',
      'auth.username': 'Username',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.loginButton': 'Login',
      'auth.registerButton': 'Register',
      'auth.noAccount': "Don't have an account?",
      'auth.hasAccount': 'Already have an account?',
      'auth.forgotPassword': 'Forgot password?',
      
      // Link submission
      'submit.title': 'Submit New Link',
      'submit.url': 'URL',
      'submit.mirrorUrl': 'Mirror URL',
      'submit.altUrl': 'Alt URL',
      'submit.backupUrl': 'Blockchain URL',
      'submit.category': 'Category',
      'submit.language': 'Language',
      'submit.description': 'Description',
      'submit.socialMedia': 'Social Media',
      'submit.captcha': 'Enter code',
      'submit.success': 'Link submitted successfully!',
      'submit.pending': 'Your link will be reviewed by our team.',
      
      // Scam page
      'scam.title': 'Scam Reports',
      'scam.warning': 'Warning: Listed sites are marked as scam.',
      'scam.forums': 'Forums',
      'scam.shops': 'Shops',
      'scam.report': 'Report Scam',
      
      // Favorites
      'favorites.title': 'My Favorites',
      'favorites.empty': 'No favorites yet',
      'favorites.addFirst': 'Start adding links to your favorites',
      
      // Profile
      'profile.title': 'Profile',
      'profile.changePassword': 'Change Password',
      'profile.currentPassword': 'Current Password',
      'profile.newPassword': 'New Password',
      'profile.memberSince': 'Member since',
      
      // Footer
      'footer.rights': 'All rights reserved',
      'footer.disclaimer': 'We do not host any content. All links are provided by users.',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
