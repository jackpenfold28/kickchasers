import communityGuidelinesMarkdown from '../../docs/community-guidelines.md?raw'
import supportMarkdown from '../../docs/contact-support.md?raw'
import privacyMarkdown from '../../docs/privacy-policy.md?raw'
import termsMarkdown from '../../docs/terms-of-service.md?raw'

export type LegalDocumentKey = 'terms' | 'privacy' | 'community-guidelines' | 'support'

export type LegalDocument = {
  key: LegalDocumentKey
  title: string
  description: string
  route: string
  markdown: string
}

export const legalDocuments: Record<LegalDocumentKey, LegalDocument> = {
  terms: {
    key: 'terms',
    title: 'Terms of Service',
    description: 'How using KickChasers works, what users agree to, and the main service rules.',
    route: '/terms',
    markdown: termsMarkdown,
  },
  privacy: {
    key: 'privacy',
    title: 'Privacy Policy',
    description: 'How KickChasers collects, uses, stores, and protects personal information.',
    route: '/privacy',
    markdown: privacyMarkdown,
  },
  'community-guidelines': {
    key: 'community-guidelines',
    title: 'Community Guidelines',
    description: 'The conduct standards that keep KickChasers competitive, respectful, and safe.',
    route: '/community-guidelines',
    markdown: communityGuidelinesMarkdown,
  },
  support: {
    key: 'support',
    title: 'Contact / Support',
    description: 'How to reach KickChasers for support, moderation, privacy, and account questions.',
    route: '/support',
    markdown: supportMarkdown,
  },
}

export const legalDocumentList = [
  legalDocuments.terms,
  legalDocuments.privacy,
  legalDocuments['community-guidelines'],
  legalDocuments.support,
]
