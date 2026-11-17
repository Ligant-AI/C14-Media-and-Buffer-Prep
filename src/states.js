export function stateOf(result) {
    const s = result.summary;
    const lineRefused = s.refused > 0 || s.stop > 0;
    const recipeRefused = result.recipe.state === 'refused';
    const lineIncomplete = s.incomplete > 0;
    const incomplete = lineIncomplete || result.recipe.state === 'incomplete';
    const empty = result.lines.length === 0 && !recipeRefused;
    return { lineRefused, recipeRefused, incomplete, lineIncomplete, empty };
}
