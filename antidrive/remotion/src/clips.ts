// Each clip: a sequence of real antiDrive screenshots (1280x800) with a camera move,
// an optional red engraving box drawn around a region, and short captions that build in.
export type Shot = {img: string; from: number; to: number; zoom?: [number, number, number, number]; box?: [number, number, number, number]; tag?: string};
export type Inset = {img: string; from: number; w: number; x: number; y: number};
export type Chip = {text: string; from: number};
export type Typed = {text: string; from: number; x: number; y: number; w: number; mono?: boolean; who?: string};
export type ClipDef = {id: string; title: string; shots: Shot[]; insets?: Inset[]; chips: Chip[]; typed?: Typed[]};

export const CLIPS: ClipDef[] = [
  {id: 'link', title: 'Pendrive and public link',
    shots: [{img: 'drive.jpg', from: 0, to: 180, zoom: [640, 400, 1, 1.08], box: [0, 640, 245, 120], tag: 'Go online'}],
    insets: [{img: 'online.jpg', from: 40, w: 250, x: 650, y: 70}],
    chips: [{text: 'Runs from the stick', from: 8}, {text: 'One click: https link + QR', from: 50}, {text: 'Cloudflare → port 443 → localhost.run', from: 100}]},
  {id: 'security', title: 'Security and vaults',
    shots: [{img: 'banner.jpg', from: 0, to: 90, zoom: [640, 120, 1.05, 1.25]}, {img: 'vault-prompt.jpg', from: 84, to: 180, zoom: [640, 300, 1.15, 1.3], box: [210, 200, 580, 90], tag: 'Vault password'}],
    chips: [{text: 'Password + authenticator code', from: 10}, {text: 'Passkeys on a stable address', from: 46}, {text: 'Vaults sealed on the stick', from: 100}]},
  {id: 'files', title: 'Files and editors',
    shots: [{img: 'newmenu.jpg', from: 0, to: 50, zoom: [700, 200, 1.1, 1.3]}, {img: 'md.jpg', from: 46, to: 96, zoom: [600, 350, 1.05, 1.15]}, {img: 'sheet.jpg', from: 92, to: 140, zoom: [500, 250, 1.1, 1.2]}, {img: 'lightbox.jpg', from: 136, to: 180, zoom: [640, 400, 1, 1.12]}],
    chips: [{text: 'New: note, sheet, doc, sketch, recording', from: 6}, {text: 'Markdown with outline', from: 52}, {text: 'xlsx, csv, docx editors', from: 98}, {text: 'Lightbox with zoom', from: 140}]},
  {id: 'ai', title: 'Local AI, read-only',
    shots: [{img: 'hover-card.jpg', from: 0, to: 50, zoom: [420, 330, 1.05, 1.3], box: [240, 210, 320, 280], tag: 'Hover summary'},
      {img: 'search-text.jpg', from: 46, to: 92, zoom: [640, 160, 1.05, 1.2]},
      {img: 'chat-ask.jpg', from: 88, to: 136, zoom: [600, 200, 1.05, 1.2], box: [300, 150, 620, 50], tag: 'Ask only'},
      {img: 'selection.jpg', from: 132, to: 180, zoom: [640, 520, 1.05, 1.25]}],
    chips: [{text: 'Qwen3 0.6B on your CPU', from: 6}, {text: 'Search inside files', from: 50}, {text: 'Chat reads, never changes', from: 92}, {text: 'Select text: Explain, Copy', from: 136}]},
  {id: 'history', title: 'History and backup',
    shots: [{img: 'history.jpg', from: 0, to: 100, zoom: [640, 380, 1.05, 1.2], box: [586, 575, 170, 70], tag: 'big file, outside git'}, {img: 'backup.jpg', from: 94, to: 180, zoom: [900, 400, 1.1, 1.25]}],
    chips: [{text: 'Every change is a git commit', from: 8}, {text: 'Restore a file or the whole drive', from: 54}, {text: 'Scheduled backup to any folder', from: 110}]},
];
