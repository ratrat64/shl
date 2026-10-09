# Colored tag filters

- Keep full tag labels visible in link rows; reject dots and hover-only labels.
- Assign tag colors automatically and persistently; the same tag keeps its color across folders, row labels, available tags, and selected tags. Tags retain their colors on disabled links, replacing grayscale-only tag styling; disabled codes and unavailable actions retain disabled styling.
- Replace Show hidden links with Show tags. It reveals a single horizontally scrollable available-tag row below search and the button.
- Available tags cover the current directory and descendants, including hidden leaves, minus selected tags. Filtering does not change that pool.
- Selecting an available tag moves it to a horizontally scrollable selected-tag row beside search. Selecting it again removes its filter and returns it to the available row.
- Results must match every selected tag (AND). Remaining free text further narrows results using the existing broad substring search.
- Typed tags start with #. Space, comma, or Enter commits a known tag, removing the token and delimiter from search. Unknown tags remain in the input with “Tag not found” so they can be corrected.
- Reject whitespace and commas in tag names with clear validation guidance; existing affected tags require explicit renaming, never silent migration.
- Hidden links stay excluded unless hidden, broken, or disabled is selected. Revealed leaves and their ancestors must still satisfy all selected tags and free text.
