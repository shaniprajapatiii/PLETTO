const PALETTE = [
   ["#f8b500", "#f97316"],
   ["#38bdf8", "#6366f1"],
   ["#22c55e", "#10b981"],
   ["#f472b6", "#ec4899"],
   ["#f59e0b", "#ef4444"],
   ["#60a5fa", "#14b8a6"],
];

function hashString(value) {
   return Array.from(value || "")
      .reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
}

export function getInitials(name, email = "") {
   const source = (name || email || "?").trim();
   if (!source) return "?";

   const parts = source.split(/\s+/).filter(Boolean);
   if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
   }

   return source.slice(0, 2).toUpperCase();
}

export function getAvatarSrc({ avatar, name, email }) {
   if (avatar) {
      return avatar;
   }

   const seed = `${name || email || "pletto"}-${email || name || "member"}`;
   const paletteIndex = Math.abs(hashString(seed)) % PALETTE.length;
   const [start, end] = PALETTE[paletteIndex];
   const initials = getInitials(name, email);

   const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${initials}">
         <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
               <stop offset="0%" stop-color="${start}" />
               <stop offset="100%" stop-color="${end}" />
            </linearGradient>
         </defs>
         <rect width="160" height="160" rx="44" fill="url(#g)" />
         <circle cx="80" cy="80" r="56" fill="rgba(255,255,255,0.12)" />
         <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="700">${initials}</text>
      </svg>
   `.trim();

   return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
