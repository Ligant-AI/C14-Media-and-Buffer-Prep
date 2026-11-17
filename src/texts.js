const MU = 'µ';
const TIMES = '×';
const DIVIDE = '÷';
const MINUS = '−';
export const TEXTS = Object.freeze({
    'MBP-RF-02': 'Use digits and a decimal point only.',
    'MBP-IN-08': 'Enter the formula as on the label and where the formula weight comes from.',
    'MBP-UN-04': `Enter the stock per mL; 1 U per ${MU}L is 1000 U per mL.`,
    'MBP-RF-14': `Enter the stock per mL; 1 U per ${MU}L is 1000 U per mL.`,
    'MBP-IN-12-final': 'p% of the final volume; I will bring it to volume',
    'MBP-IN-12-added': 'p mL for every 100 mL I already have',
    'MBP-IN-12-reach': 'Add to the volume I have, to reach p% of the final.',
    'MBP-DT-12-caption': 'mass adds; volume may not',
    'MBP-CD-02-noAmount': 'no amount computed: see the note under this row',
    'MBP-FL-01': 'if volumes add',
    'MBP-FL-01-percentOfFinal': '% (v/v) of the final volume, if volumes add',
    'MBP-FL-02-kind2': 'fixed per batch, not scaled',
    'MBP-FL-02-kind4': 'adjust to, no amount',
    'MBP-FL-02-kind4-titrant': 'the tool computes no titrant amount',
    'MBP-FL-03': 'not scaled: you set this line as fixed per batch',
    'MBP-FL-04-route': "To get a stock volume, set this line's target as a mass concentration.",
    'MBP-FL-05': "U means what your supplier defines; another lot's figure is not interchangeable.",
    'MBP-FL-06': 'Handling and order of addition are not covered; follow your SOP and the safety data sheet.',
    'MBP-FL-07': 'Values rounded for display only; calculations use full precision.',
    'MBP-FL-09': `5.00 ${TIMES} 10^4 means 5.00 times 10 to the power 4; the three digits shown are significant.`,
    'MBP-FL-10': 'This tool does not check whether it dissolves.',
    'MBP-FL-12-w/v': 'grams per 100 mL of final solution',
    'MBP-FL-12-v/v': 'mL per 100 mL of final solution',
    'MBP-FL-12-w/w': 'grams per 100 g of solution',
    'MBP-RF-05': 'IU and U are different units and are never converted into each other. Use the same one throughout this line.',
    'MBP-RF-06': "Enter your lot's specific activity to see the mass concentration that corresponds to this target.",
    'MBP-RF-07': 'The specific activity must be a number above zero.',
    'MBP-RF-08-reversed': 'The lower limit is above the upper limit.',
    'MBP-RF-08-equal': 'The two limits are equal; enter it as a single value.',
    'MBP-RF-09': "A lower limit takes 'more than' or 'at least'; an upper limit takes 'less than' or 'at most'.",
    'MBP-RF-10-below0': 'The percent must be 0 or more.',
    'MBP-RF-10-above100': 'The percent cannot be above 100 here: the part cannot be more than the whole.',
    'MBP-RF-10-reach': 'The percent must be below 100 here: adding liquid to the volume you have comes closer to 100% of the final but never reaches it.',
    'MBP-RF-11': "These two ways of stating a percent add volumes, and the volume of a dissolved solid is not known; use 'of the final volume'.",
    'MBP-RF-12': 'A w/w percent needs the total mass of the solution. Use Percent solution.',
    'MBP-CD-01-component': 'Component',
    'MBP-CD-01-target': 'Target',
    'MBP-CD-01-actual': 'Actual (what you used, with unit)',
    'MBP-CD-08-caption': 'drawn as if volumes add',
    'MBP-CD-08-note': 'Lines given as a mass or an activity are not drawn; they are in the card.',
    'MBP-CD-09-partial': 'Share bar shown when every line has a result',
    'MBP-CD-09-refused': 'Share bar not drawn: a line is refused.',
    'MBP-CD-09-overFull': 'Share bar not drawn: the volume lines, if volumes add, come to more than the final volume. Every line is in the card.',
    'MBP-IN-14-W1': 'Why we ask: A recipe is written for one volume. Each line is worked out again for the final volume you set, except a line you set as fixed per batch, and the last row tells you the volume to bring it up to.',
    'MBP-IN-14-W2': 'Why we ask: Some lines scale with the volume and some do not. An amount written for one volume changes in proportion; a final concentration stays the same, so the amount that gives it is worked out again. Pick the kind that matches what the recipe means.',
    'MBP-IN-14-W3': 'Why we ask: 10% can mean 10 g per 100 mL of final solution, 10 mL per 100 mL of final solution, or 10 g per 100 g of solution. They are different preparations. Say which one you mean.',
    'MBP-IN-14-W4': 'Why we ask: The same salt can be sold with different amounts of water of hydration, and the formula weight changes with it. The formula as on the label and where the formula weight comes from tell the next person which form you used.',
    'MBP-IN-14-W5': 'Why we ask: Specific activity (activity per mass) differs from lot to lot. The same mass from two lots can carry different activity, so the lot and where the figure comes from are part of the answer.',
    'MBP-IN-14-W6': 'Why we ask: What the tool calculates and what you really weighed or pipetted are two records. Write down what you used, with its unit.',
});
export const QUESTIONS = Object.freeze({});
export function fill(template, slots) {
    let t = template;
    for (const name of Object.keys(slots))
        t = t.split('{' + name + '}').join(String(slots[name]));
    return t;
}
export const RULED = Object.freeze({
    'MBP-RF-04': 'a concentration does not scale with the final volume; set this line as a final concentration.',
    'MBP-DT-13-places': 'Use digits only for the decimal places, for example 2.',
    'MBP-DT-13-places-over': 'Use at most 400 decimal places, for example 2.',
    'MBP-DP-stop': 'This result cannot be written out exactly, so no figure is shown.',
    'MBP-DT-12-label-target': 'Target',
    'MBP-DT-12-label-solute': 'Solute',
    'MBP-DT-12-label-solvent': 'Solvent',
    'MBP-DT-12-label-finalVolume': 'Final volume',
    'MBP-CD-01-number': 'Line',
    'MBP-CD-17-caption': 'Recipe card',
    'MBP-CD-12-empty': 'Enter the final volume, the base liquid and a line to see the recipe card.',
    'MBP-CD-12-loading': 'Calculating',
    'MBP-CD-14-separator': '\t',
    'MBP-CD-09-refusedFinal': 'Share bar not drawn: the final volume is refused.',
    'MBP-CD-09-recipeIncomplete': 'Share bar shown when the final volume, its unit, the base liquid and any decimal places you chose are filled in.',
    'MBP-CD-09-notDrawn': 'Share bar not drawn: the volume lines could not be compared with the final volume. Every line is in the card.',
    'MBP-CD-08-noteAmount': 'Lines given as a mass, an amount of substance or an activity are not drawn; they are in the card.',
});
export const PAGE = Object.freeze({
    loadExample: `Load the worked example`,
    clear: `Clear`,
    addLine: `Add a line`,
    removeLine: `Remove line {n}`,
    copy: `Copy recipe`,
    export: `Export`,
    exportNotebook: `Notebook text`,
    exportCsv: `CSV`,
    exportJson: `JSON`,
    exportPrint: `Print`,
    copied: `Copied.`,
    copyFailed: `Copy did not work in this browser. Select the card and copy it yourself.`,
    workingLine: `Show the working for line {n}`,
    workingPercent: `Show the working`,
    headingPercent: `Percent solution`,
    headingRecipe: `Recipe`,
    panelCard: `Recipe card`,
    component: `Component`,
    actual: `Actual (what you used, with unit)`,
    actualName: `Line {n} Actual (what you used, with unit)`,
    unitPicker: `{field label} unit`,
    exampleMark: `example`,
    banner: `Fields marked example hold the worked example: round values, an illustration, not a published value. Replace them with your own, or press Clear.`,
    stripFinal: `Final volume: {v} {unit}`,
    stripBase: `Base liquid: {text}`,
    stripLine: `Line {n}: {kind word}`,
    partSource: `; source volume {v} {unit}`,
    partFw: `; formula weight {fw} g/mol; formula {formula}; formula weight from {source}`,
    partStock: `; stock concentration {v} {unit}`,
    partFold: `; stock {fold}X`,
    partBasis: `; percent basis {basis}`,
    partSa: `; specific activity {sa}; lot {lot}; figure from {source}; supplier's document number for this figure {doc}`,
    saSingle: `{v} {unit}`,
    saBound: `{strictness} {v} {unit}`,
    saRange: `{lower strictness} {low} {unit} and {upper strictness} {high} {unit}`,
    roundingNone: `Declared rounding: none; values rounded for display only; calculations use full precision`,
    roundingDeclared: `Declared rounding: {rule} to {places} decimal places; values rounded for display only; calculations use full precision`,
    roundingDeclaredOne: `Declared rounding: {rule} to 1 decimal place; values rounded for display only; calculations use full precision`,
    exampleInUse: `Example values still in use: {list}`,
    exampleField: `line {n} {label}`,
    barOverFull: `The volume lines, if volumes add, come to more than the final volume. Every line is in the card.`,
    barNotDrawn: `The volume lines could not be compared with the final volume. Every line is in the card.`,
    engineCopy: `Calculated with @ligant/bench-engines {version} (module E10 {e10}), commit {commit}`,
    enginePage: `This page calculates with @ligant/bench-engines {version} (module E10 {e10}), commit {commit}.`,
    csvLine1: `Numbers written by the tool use a point as the decimal separator and no digit grouping. Each exact value is written in full as a decimal where its decimal ends, and also as a fraction; where its decimal never ends, only the fraction is given. Rounded figures are written exactly as shown on the page, including × 10^ and µ. Text you typed may contain commas and is kept as typed, except for the prefix in the next line.`,
    csvLine2: `Some text cells carry the guard's prefix in this CSV file only. The JSON and notebook text files carry the same text exactly as typed.`,
});
export const CSV_COLUMNS = Object.freeze({
    unit: 'Unit',
    decimal: 'Unrounded value as a decimal',
    exactNum: 'Exact numerator',
    exactDen: 'Exact denominator',
    notes: 'Notes',
    inputs: 'Inputs as typed',
    toolVersion: 'Tool version',
    engine: 'Engine',
    engineCommit: 'Engine commit',
    exampleValues: 'Example values',
    exactValues: 'Exact values',
    typedInputs: 'Inputs as typed',
});
export const ABOUT = Object.freeze({
    headings: Object.freeze([`What it does`, `How to use it`, `How it works`, `Why not a spreadsheet?`, `What it does not do`]),
    whatItDoes: `Plan a media or buffer recipe from stocks and powders. You set the final volume and the base liquid, add one line for each component, and the tool works out how much of each to add for that volume. Each line says what kind of line it is: an amount written for another volume, scaled to yours; an amount fixed per batch; a final concentration, made from a solid, a stock or a percent of the final volume; or an instruction such as a pH to adjust to. The result is a recipe card with a Target column for what the tool calculated and an Actual column for what you used, which you can copy or export. A separate Percent solution section answers the three ways a percent is asked: of the final volume, per 100 mL you already have, or to reach a percent of the final.`,
    howToUseSteps: Object.freeze([
        `Type the final volume, pick its unit, and type the base liquid.`,
        `Add a line for each component. Give it a name and pick its kind.`,
        `For a final concentration, pick how the component is supplied, then type the target and the stock.`,
        `Pick the display unit for each line's result.`,
        `To round, pick a rounding rule and type the decimal places.`,
        `Read the Target column, weigh or pipette, and write what you used in the Actual column.`,
        `Copy the recipe or export it.`,
    ]),
    howToUseAfter: `To see a filled recipe first, load the worked example. For one percent solution on its own, use Percent solution: pick your question and the basis, then type the percent and the volume or mass.`,
    howItWorksIntro: `Each line is worked out from what you typed, with these relations:`,
    howItWorksRelations: Object.freeze([
        `Amount for this volume: amount = amount written × final volume ÷ source volume. An amount written for one volume changes in proportion to the volume.`,
        `Final concentration from a solid, to a mass concentration: mass = target × final volume. Concentration is amount per volume.`,
        `Final concentration from a solid, to a molar concentration: mass = target × formula weight × final volume. Formula weight is mass per amount of substance.`,
        `Final concentration from a stock: stock volume = target × final volume ÷ stock concentration. The stock volume you add holds the same amount of the component as the final volume at the target.`,
        `X-fold stock: stock volume = final volume ÷ fold. A 10X stock is one part stock in 10 parts in total.`,
        `Percent of the final volume: w/v, mass = (p ÷ 100) g/mL × final volume; v/v, volume = (p ÷ 100) × final volume.`,
        `Percent solution: p mL for every 100 mL you already have, volume to add = (p ÷ 100) × volume you have; to reach p% of the final, volume to add = volume you have × p ÷ (100 − p). Both assume that volumes add. For w/w, solute mass = (p ÷ 100) × total mass of solution.`,
        `Activity per mass: specific activity is activity divided by mass, so activity concentration = mass concentration × specific activity. The tool shows this as a statement under the line, never as an amount to add.`,
    ]),
    howItWorksConstants: `No published constants are used: every formula weight, stock concentration and specific activity is a value you type. The last row tells you to bring the recipe to the final volume with the base liquid. The tool gives no volume of base liquid, because the volumes of liquids and dissolved solids need not add up when mixed. When the volume lines would come to more than the final volume if volumes add, the tool says so.`,
    howItWorksRounding: `The tool calculates with exact fractions and rounds only what it shows. Amounts are shown to three significant digits, and from 1000 upward as, for example, 1.00 × 10^3 mL; concentrations are always shown that way. If you declare a rounding rule, each figure is rounded once from the exact result, half-up or half-even, to the decimal places you typed.`,
    whyNot: `A spreadsheet can do this arithmetic. Here, each line states what kind of line it is, so a final concentration is worked out again for the new volume and not scaled like an amount. Units are converted by the tool, and a unit that does not fit the line is refused. Every percent states its basis. The strip, the working and the export record each value as typed, with the exact result beside the rounded one, so the next person can check the recipe.`,
    notDo: Object.freeze([
        `It does not know whether the recipe is right.`,
        `It gives no titrant amount.`,
        `It makes no statement about pH, osmolality, sterility or solubility.`,
        `It does not cover handling or order of addition; follow your SOP and the safety data sheet.`,
        `It holds no formula weight, density or specific activity; you type each one.`,
        `When the target is an activity and the stock is labelled only by mass, it gives no amount to add; it states what your lot's specific activity implies.`,
        `It does not work out several supplements added to a full bottle of medium.`,
    ]),
});
export function tooManyDigits(fieldLabel) {
    return fieldLabel + ' has too many digits; use at most 400 before the decimal point and 400 after it.';
}
export const ROUTE_WORDS = Object.freeze({
    a: 'A solid, to a mass concentration',
    b: 'A solid, to a molar concentration',
    c: 'A liquid stock with the same kind of concentration',
    d: 'An activity stock (IU/mL or U/mL)',
    e: 'An X-fold stock (for example 10X)',
    f: 'A percent of the final volume',
    activityMass: 'An activity target, with a stock labelled only by mass',
});
export const SA_FORM_WORDS = Object.freeze({
    single: 'a single value',
    minimum: 'a minimum',
    maximum: 'a maximum',
    range: 'a range',
});
export const LOWER_STRICTNESS_WORDS = Object.freeze(['more than', 'at least']);
export const UPPER_STRICTNESS_WORDS = Object.freeze(['less than', 'at most']);
export const LINE_KIND_WORDS = Object.freeze({
    1: 'amount for this volume',
    2: 'fixed per batch',
    3: 'final concentration',
    4: 'adjust to',
});
export function stillNeeded(labels) {
    return 'Not calculated yet. Still needed: ' + labels.join(', ') + '.';
}
export function linePrefix(ordinal) {
    return 'Line ' + ordinal + ': ';
}
export const DIMENSION_WORDS = Object.freeze({
    mass: 'mass',
    volume: 'volume',
    amount: 'amount of substance',
    massConcentration: 'mass concentration',
    molarConcentration: 'molar concentration',
    activity: 'activity',
    activityConcentration: 'activity concentration',
    specificActivity: 'specific activity',
});
const AN_BEFORE = Object.freeze(['amount', 'activity', 'activityConcentration']);
export function dimensionPhrase(dims) {
    const keys = typeof dims === 'string' ? [dims] : dims;
    if (!keys || keys.length === 0)
        throw new TypeError('a unit field needs its dimensions');
    const words = [];
    for (let i = 0; i < keys.length; i++) {
        if (!Object.keys(DIMENSION_WORDS).includes(keys[i]))
            throw new TypeError('unknown dimension ' + keys[i]);
        words.push(DIMENSION_WORDS[keys[i]]);
    }
    let list = words[0];
    if (words.length > 1)
        list = words.slice(0, words.length - 1).join(', ') + ' or ' + words[words.length - 1];
    return (AN_BEFORE.includes(keys[0]) ? 'an ' : 'a ') + list;
}
export function needsUnit(fieldLabel, dims) {
    return fieldLabel + ' needs ' + dimensionPhrase(dims) + ' unit.';
}
export function aboveZero(fieldLabel) {
    return fieldLabel + ' must be above zero.';
}
export function foldTooSmall() {
    return 'The fold must be 1 or more.';
}
export function zeroOrMore(fieldLabel) {
    return fieldLabel + ' must be zero or more.';
}
export function kind1Words(factorText) {
    return 'amount for this volume, ' + TIMES + ' ' + factorText;
}
export function kind1WordsAboutOne(sourceAsTyped, finalAsTyped) {
    return 'amount for this volume, about ' + TIMES + ' 1 (from ' + sourceAsTyped + ' to ' + finalAsTyped + ')';
}
export function kind3StockWords(stockAsTyped) {
    return 'final concentration, from a ' + stockAsTyped + ' stock';
}
export function kind3SolidWords() {
    return 'final concentration, from a solid';
}
export function kind3SolidFwWords(fwAsTyped) {
    return 'final concentration, from a solid of formula weight ' + fwAsTyped + ' g/mol';
}
export function kind3FoldWords(foldAsTyped) {
    return 'final concentration, from a ' + foldAsTyped + 'X stock';
}
export function kind3ActivityMassWords() {
    return 'final concentration, from a stock labelled only by mass';
}
export function kind3PercentWords(percentAsTyped, basis) {
    return 'final concentration, ' + percentAsTyped + '% ' + basis + ' of the final volume';
}
export function makeUpRow(finalVolumeAsTyped, solvent) {
    return 'bring to ' + finalVolumeAsTyped + ' with ' + solvent;
}
function placesWords(places) {
    return places + (places === '1' ? ' decimal place' : ' decimal places');
}
export function roundingStatementTerminating(rule, places, decimalText, unitText) {
    return 'rounded ' + rule + ' to ' + placesWords(places) + ' from ' + decimalText + ' ' + unitText +
        ', the exact result of your entered values';
}
export function roundingStatementNonTerminating(rule, places, numText, denText, unitText) {
    return 'rounded ' + rule + ' to ' + placesWords(places) + ' from the exact result of your entered values, ' +
        numText + '/' + denText + ' ' + unitText + ', whose decimal never ends';
}
export function specificActivityBasis(value, unit, lot) {
    return value + ' ' + unit + ', lot ' + lot;
}
export const FL04_MASS_TARGET = Object.freeze({
    single: (massTargetAsTyped, activity, spec) => massTargetAsTyped + ' corresponds to ' + activity + " (activity computed from your lot's specific activity (" + spec + '))',
    minimum: (activity) => 'at least ' + activity + " (from your lot's stated minimum)",
    maximum: (activity) => 'at most ' + activity + " (from your lot's stated maximum)",
    range: (low, high) => 'at least ' + low + ' and at most ' + high + " (from your lot's stated range)",
});
export const FL04_ACTIVITY_TARGET = Object.freeze({
    single: (target, massConc, spec) => target + ' corresponds to ' + massConc + " (mass computed from your lot's specific activity (" + spec + ')).',
    minimum: (massConc, target) => 'Your lot states only a minimum specific activity. Adding ' + massConc + ' gives at least ' + target +
        '; the upper limit cannot be determined from what your lot states.',
    maximum: (massConc, target) => 'Your lot states only a maximum specific activity. Adding ' + massConc + ' gives at most ' + target +
        '; the lower limit cannot be determined from what your lot states.',
    range: (lowMassConc, highMassConc, target) => 'Your lot states a range of specific activity. Adding ' + lowMassConc + ' gives at most ' + target +
        ', and adding ' + highMassConc + ' gives at least ' + target + '; no single amount gives exactly ' + target +
        ' from what your lot states.',
});
export const WORKING = Object.freeze({
    wv: (p, b, target) => 'w/v: grams per 100 mL of final solution. Target = (' + p + ' ' + DIVIDE + ' 100) g/mL ' + TIMES + ' ' + b + ' = ' + target,
    vvFinal: (p, b, target) => 'v/v: mL per 100 mL of final solution. Target = (' + p + ' ' + DIVIDE + ' 100) ' + TIMES + ' ' + b + ' = ' + target,
    ww: (p, b, solute, solvent) => 'w/w: grams per 100 g of solution. Solute = (' + p + ' ' + DIVIDE + ' 100) ' + TIMES + ' ' + b + ' = ' + solute +
        '; solvent = the rest of the ' + b + ' = ' + solvent,
    added: (p, b, target, finalVolume, percentOfFinal) => 'v/v: ' + p + ' mL for every 100 mL you already have. Target = (' + p + ' ' + DIVIDE + ' 100) ' + TIMES + ' ' + b +
        ' = ' + target + ', if volumes add; final volume = ' + b + ' ' + TIMES + ' (100 + ' + p + ') ' + DIVIDE + ' 100 = ' +
        finalVolume + ', if volumes add; percent of the final volume = 100 ' + TIMES + ' ' + p + ' ' + DIVIDE + ' (100 + ' + p +
        ') = ' + percentOfFinal + '%, if volumes add',
    reach: (p, b, target, finalVolume) => 'v/v: add to the volume you have, to reach ' + p + '% of the final. Target = ' + b + ' ' + TIMES + ' ' + p + ' ' +
        DIVIDE + ' (100 ' + MINUS + ' ' + p + ') = ' + target + ', if volumes add; final volume = ' + b + ' ' + TIMES +
        ' 100 ' + DIVIDE + ' (100 ' + MINUS + ' ' + p + ') = ' + finalVolume + ', if volumes add',
});
export function ifVolumesAdd(value) {
    return value + ', ' + TEXTS['MBP-FL-01'];
}
export function percentOfFinalRow(percentOfFinalText) {
    return percentOfFinalText + TEXTS['MBP-FL-01-percentOfFinal'];
}
export function percentReachedRow(pAsTyped) {
    return pAsTyped + '% of the final volume, ' + TEXTS['MBP-FL-01'];
}
export function rowCopy(label, value) {
    return label + ': ' + value;
}
const fixedText = (text) => Object.freeze({ text });
const nad = (text) => Object.freeze({ text, source: 'NAD-2026-11-14-466' });
export const LABELS = Object.freeze({
    finalVolume: fixedText('Final volume'),
    baseLiquid: fixedText('Base liquid'),
    sourceVolume: fixedText('Source volume'),
    amount: fixedText('Amount'),
    displayUnit: fixedText('Display unit'),
    formulaWeight: fixedText('Formula weight'),
    formula: fixedText('formula as on the label (for example NaH2PO4·H2O)'),
    formulaSource: fixedText('where this formula weight comes from'),
    instruction: fixedText('Instruction text'),
    roundingPlaces: nad('Decimal places'),
    rounding: nad('Rounding'),
    route: nad('How the component is supplied'),
    target: nad('Final concentration'),
    stock: nad('Stock concentration'),
    fold: nad('Fold'),
    percent: nad('Percent'),
    basis: nad('Percent basis'),
    lineKind: nad('Line kind'),
    saValue: nad('Specific activity'),
    saLower: nad('Lower limit'),
    saUpper: nad('Upper limit'),
    saUnit: nad('Specific activity unit'),
    saForm: nad('What your lot states'),
    saStatementUnit: Object.freeze({ text: 'Display unit for the activity concentration', source: 'NAD-2026-11-14-477' }),
    saLowerStrictness: nad('How the lower limit is stated'),
    saUpperStrictness: nad('How the upper limit is stated'),
    saLot: nad('Lot'),
    saSource: nad('Where the figure comes from'),
    saDocNumber: nad("Supplier's document number for this figure"),
    question: nad('Your question'),
    bFinal: nad('Final volume'),
    bAdded: nad('Volume you already have'),
    bMass: nad('Total mass of solution'),
});
