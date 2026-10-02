import { gameTips, craftTips, recipeTips, bookTips } from './tips.js';

function createRotator(tips) {
    let index = 0;
    return () => {
        const tip = tips[index];
        index = (index + 1) % tips.length;
        return tip;
    };
}

export const nextGameTip   = createRotator(gameTips);
export const nextCraftTip  = createRotator(craftTips);
export const nextRecipeTip = createRotator(recipeTips);
export const nextBookTip   = createRotator(bookTips);
