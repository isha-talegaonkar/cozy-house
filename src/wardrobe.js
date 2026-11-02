import { FALL, SPRING, SUMMER, WINTER } from './season.js';

// What Izzy and Nik wear: an outfit per season, and pyjamas for the night.
// pyjamas: worn from bedtime until the morning coffee (short sleeves and shorts in summer)
export const PJS = {
  izzy: { top: 'pj', pattern: 'dots', color: '#f2c6cf', rib: '#ffffff', collar: 'crew', pants: '#f2c6cf', shoes: '#f6eee2' },
  nik: { top: 'pj', pattern: 'plaid', color: '#3d4f7a', rib: '#6d84b8', collar: 'crew', pants: '#3d4f7a', shoes: '#8a6a4a' },
};
// seasonal wardrobes
export const OUTFITS = {
  izzy: {
    [SPRING]: { top: 'knit', color: '#c9b6e0', rib: '#b8a3d2', collar: 'crew', pants: '#7f98bd', shoes: '#efe6d8' },
    [SUMMER]: { top: 'tee', color: '#f2d27a', rib: '#e6c060', collar: 'crew', short: true, shorts: true, pants: '#7d95b5', shoes: '#e9d9c4' },
    [FALL]:   { top: 'knit', color: '#d9a0a0', rib: '#c48a8a', collar: 'turtle', pants: '#26242a', shoes: '#f6eee2' },
    [WINTER]: { top: 'knit', color: '#efe6d8', rib: '#ddd2c0', band: ['#b5343a', '#2f5a34'], collar: 'turtle', pants: '#26242a', shoes: '#8a5a3a' },
  },
  nik: {
    [SPRING]: { top: 'knit', color: '#8fb0c8', rib: '#7f9fb8', collar: 'crew', pants: '#b8a888', shoes: '#ece7dc' },
    [SUMMER]: { top: 'tee', color: '#2f8a8a', rib: '#287878', collar: 'crew', short: true, shorts: true, pants: '#b8a888', shoes: '#ece7dc' },
    [FALL]:   { top: 'knit', color: '#2f6a6a', rib: '#285a5a', band: ['#efe2c8', '#c9763f'], collar: 'crew', pants: '#4a4a52', shoes: '#8a6a4a' },
    [WINTER]: { top: 'knit', color: '#2f5a3a', rib: '#284e32', band: ['#efe2c8', '#b5343a'], collar: 'crew', pants: '#4a4a52', shoes: '#5a3d28' },
  },
};
