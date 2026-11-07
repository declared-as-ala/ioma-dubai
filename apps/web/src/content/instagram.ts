// The five most recent posts of the official @ioma.paris account, taken on 2026-11-07 from the feed embedded on
// ioma-paris.com. Images are stored locally because Instagram CDN links are signed and expire. Refresh this list
// (and the files in public/images/instagram) when new posts should appear.
export type InstagramPost = {
  href: string;
  image: string;
  kind: "image" | "album" | "video";
  date: string;
  caption: string;
};

export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    href: "https://www.instagram.com/p/DfXpQOPiLYE/",
    image: "/images/instagram/DfXpQOPiLYE.jpg",
    kind: "album",
    date: "2026-11-05",
    caption:
      "Le sur-mesure IOMA, du jour à la nuit. Des formules concentrées en actifs, pensées pour chaque peau.",
  },
  {
    href: "https://www.instagram.com/p/DfAoeO0CCPz/",
    image: "/images/instagram/DfAoeO0CCPz.jpg",
    kind: "album",
    date: "2026-10-27",
    caption:
      "IOMA, l’innovation au service de votre peau. Découvrez IOMA Privé : une expérience personnalisée, du diagnosti…",
  },
  {
    href: "https://www.instagram.com/p/DemxdtkiMhw/",
    image: "/images/instagram/DemxdtkiMhw.jpg",
    kind: "album",
    date: "2026-10-17",
    caption:
      "Retour en images sur une soirée imaginée autour de la beauté, du savoir-faire et de la rencontre. 🥂 À La Maiso…",
  },
  {
    href: "https://www.instagram.com/reel/DeXANicoMqb/",
    image: "/images/instagram/DeXANicoMqb.jpg",
    kind: "video",
    date: "2026-10-11",
    caption:
      "Softness, shine, hydration. All in one serum. IOMA Haircare Moisturizing Hair Serum Essence leaves hair smooth…",
  },
  {
    href: "https://www.instagram.com/p/DePeBkbiHTA/",
    image: "/images/instagram/DePeBkbiHTA.jpg",
    kind: "album",
    date: "2026-10-08",
    caption:
      "Your lips deserve more than a balm 👄 Lip Lift 3 RENEW combines Volulip, Hyaluronic Acid and Seacode to hydrate…",
  },
];
