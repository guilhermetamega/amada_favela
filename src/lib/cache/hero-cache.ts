type HeroCache = {
  communityName: string;
  description: string;
  imageUrl: string;
};

let heroCache: HeroCache | null = null;

export function getHeroCache() {
  return heroCache;
}

export function setHeroCache(data: HeroCache) {
  heroCache = data;
}
