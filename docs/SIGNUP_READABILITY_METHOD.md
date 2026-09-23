# Signup readability measurement method

**Status:** proposed method; numeric thresholds pending the first measured baseline and human approval.

## Scope

Measure all user-visible signup text in English and French. Preserve each source string and group it into one of three separate corpora per locale:

1. **Page and instruction copy:** headings, explanatory paragraphs, password guidance, consent explanations, and other sentence-form content.
2. **Labels and actions:** field labels, option labels, buttons, and language-switch text.
3. **Validation messages:** required-field, format, password, boundary, and submission feedback in each visible state that the read-only suite can reach safely.

Do not combine English and French or merge labels and validation messages into the page-copy score. Report every string's word count, sentence count, and syllable count so a corpus result can be traced back to deployed text.

## Language-specific methods

| Locale  | Primary method           | Secondary output                 | Use                                                                                                                                                      |
| ------- | ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| English | Flesch Reading Ease      | Flesch–Kincaid Grade Level       | Score sentence-form page and instruction copy. Reading Ease provides a 0–100-style ease score; grade level provides a familiar secondary interpretation. |
| French  | Kandel–Moles readability | Component counts used in formula | Score sentence-form page and instruction copy with the French adaptation of Flesch rather than applying English coefficients to translated text.         |

WCAG 2.1 AA does not impose a numeric reading-level threshold. WCAG 2.1 reading level is a Level AAA criterion, so this repository must describe readability scoring as a product quality gate rather than claim that the formula proves AA conformance.

Use these exact formulas, where `ASL = words / sentences` and `ASW = syllables / words`:

- English Flesch Reading Ease: `206.835 - (1.015 × ASL) - (84.6 × ASW)`.
- English Flesch–Kincaid Grade Level: `(0.39 × ASL) + (11.8 × ASW) - 15.59`.
- French Kandel–Moles: `207 - (1.015 × ASL) - (73.6 × ASW)`.

## Deterministic collection and counting contract

The implementation must be local and versioned with golden fixtures; it must not send deployed copy to an external scoring service.

- Normalize collected text to Unicode NFC, replace nonbreaking space with ordinary space, collapse whitespace, and preserve the displayed spelling and punctuation in evidence.
- Use `Intl.Segmenter` from the repository's pinned Node runtime with the matching `en-CA` or `fr-CA` locale for word and sentence segmentation. Count only `isWordLike` word segments.
- Implement and version language-specific syllable counters in this repository. Count contiguous vowel sounds with documented English and French rules, silent-ending adjustments, and a minimum of one syllable per word. Lock representative names, mortgage terms, contractions, accented words, and exception words in golden fixtures. The implementation handoff must record the Node version and fixture results; formula output is blocked until these counters exist.
- Wait for page hydration and collect visible rendered text from headings, paragraphs, lists, legends, labels, buttons, links, placeholders, currently displayed feedback, and every option in native selects. Exclude hidden templates, scripts, styles, and accessible-only names that have no visible text because those belong to the accessibility contract.
- Exercise the initial page plus every read-only validation state already covered by SGN-005, SGN-015, and SGN-016. Do not send an account request to discover text. A validation state that cannot be reached without a write is recorded as blocked rather than silently omitted.
- Deduplicate by locale, state, category, normalized text, and semantic source. Retain an occurrence count so responsive duplicates remain auditable without weighting the formula twice.
- Attach a manifest with locale, page state, category, semantic source, normalized text, occurrence count, and content hash. This manifest is the proof that every safely reachable page string entered a corpus.

## Short labels and validation messages

Sentence-based readability formulas are unstable for individual short strings. For labels/actions and validation messages:

- preserve and report every string separately;
- report characters, words, sentences, syllables, and the locale-specific score when it can be calculated;
- calculate a separate aggregate score for the complete labels/actions corpus and validation-message corpus in each locale;
- calculate but mark a corpus below 100 words as `small-sample`; never enforce a pass/fail threshold from that score alone;
- keep wording defects visible even when the aggregate score passes.

This approach will expose changes such as a much longer label or validation message without pretending that a one-word field name has a meaningful grade level.

## Threshold decision after the first run

The first implementation should report observed values without failing. The human approver can then set separate thresholds for:

- English page/instruction Reading Ease and grade level;
- French page/instruction Kandel–Moles score;
- English and French label/action corpus;
- English and French validation-message corpus;
- permitted change from the approved baseline.

A reasonable starting proposal for sentence-form public copy is English Flesch Reading Ease at least 60 with Flesch–Kincaid Grade Level no higher than 8, and French Kandel–Moles at least 60. These values are proposals for calibration, not current results or approved gates. Short-copy categories should first use no-regression against their observed baseline because fixed scores on small corpora can move sharply after a minor wording change.

## Limits

Formula scores measure surface characteristics such as word, sentence, and syllable length. They do not establish factual clarity, translation quality, tone, correct terminology, or whether instructions tell the user enough to complete the form. The French phrase previously observed as “au entre,” for example, needs a copy correction even if its surrounding corpus receives an acceptable numeric score.

## References

- [W3C WCAG 2.1, Guideline 3.1 Readable](https://www.w3.org/TR/WCAG21/#readable) and [Understanding Reading Level](https://www.w3.org/WAI/WCAG21/Understanding/reading-level.html) distinguish readability from Level AA conformance and place the reading-level criterion at Level AAA.
- The Council of Ministers of Education, Canada used Flesch–Kincaid for English and Kandel–Moles for French in its [PCAP technical report](https://cmec.ca/Publications/Lists/Publications/Attachments/351/PCAP2013-Technical-Report-FR-Final-Web.pdf), supporting separate language-specific formulas.
