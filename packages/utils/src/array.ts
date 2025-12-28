export function shuffleArray<T>(array: T[]): T[] {
   const shuffled = [...array];

   for (let i = shuffled.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      const randomValue = shuffled[randomIndex];
      if (temp !== undefined && randomValue !== undefined) {
         shuffled[i] = randomValue;
         shuffled[randomIndex] = temp;
      }
   }

   return shuffled;
}
