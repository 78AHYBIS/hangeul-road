/** The five bottom-navigation sections. `icon` is an SVG path on a 24x24 grid. */
export const NAV_ITEMS = [
  {
    to: '/',
    label: 'Today',
    icon: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  },
  {
    to: '/learn',
    label: 'Learn',
    icon: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM12 3h5.5A2.5 2.5 0 0 1 20 5.5v16a2.5 2.5 0 0 0-2.5-2.5H12',
  },
  { to: '/library', label: 'Library', icon: 'M5 4v16M9 4v16M13 5l4 15M19.5 4.5 21 20' },
  {
    to: '/korea',
    label: 'Korea',
    icon: 'M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21ZM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  },
  { to: '/me', label: 'Me', icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21a8 8 0 0 1 16 0' },
] as const;
