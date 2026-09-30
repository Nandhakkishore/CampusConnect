export const colors = {
  // Light, clean & modern canvas
  background: '#F8FAFC',       // Slate 50 - crisp, bright neutral background
  surface: '#FFFFFF',          // Pure White - elevated cards & modals
  surfaceLight: '#F1F5F9',     // Slate 100 - secondary containers, chips & search inputs
  surfaceHighlight: '#E2E8F0', // Slate 200 - hover & focused surface
  border: '#E2E8F0',           // Slate 200 - clean, subtle boundaries
  borderLight: '#CBD5E1',      // Slate 300 - emphasized dividers
  borderFocus: '#6366F1',      // Indigo 500 - focused inputs & active borders

  // Vibrant, high-contrast branding accents
  primary: '#059669',          // Emerald 600 - rich, impressive primary accent
  primaryHover: '#047857',     // Emerald 700 - button active/hover state
  primaryLight: 'rgba(5, 150, 105, 0.12)', // Subtle emerald glow for badges
  primaryDark: '#064E3B',      // Emerald 900 - high contrast text

  secondary: '#4F46E5',        // Indigo 600 - rich modern contrast accent
  secondaryHover: '#4338CA',   // Indigo 700
  secondaryLight: 'rgba(79, 70, 229, 0.10)',
  secondaryDark: '#312E81',

  accent: '#D97706',           // Amber 600 - warnings / bounties
  accentLight: 'rgba(217, 119, 6, 0.12)',
  danger: '#DC2626',           // Red 600 - error states
  dangerLight: 'rgba(220, 38, 38, 0.10)',
  success: '#10B981',          // Emerald 500 - positive indicators
  info: '#0284C7',             // Sky 600 - informational tags

  // Typography (Dark slate for readability on light backgrounds)
  text: '#0F172A',             // Slate 900 - high contrast headline & body
  textMuted: '#475569',        // Slate 600 - secondary captions & details
  textDim: '#94A3B8',          // Slate 400 - placeholders & inactive states
  textLight: '#F8FAFC',        // Slate 50 - white/light text on dark backgrounds

  // Surface mappings
  card: '#FFFFFF',             // White card surface
  inputBg: '#FFFFFF',          // White text inputs
  badgeBg: '#F1F5F9',          // Slate 100 pill badge backgrounds
};

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

