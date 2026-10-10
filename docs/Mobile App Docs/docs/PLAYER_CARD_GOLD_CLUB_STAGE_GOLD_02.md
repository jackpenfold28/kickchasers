# Stage Gold-02 — Production Template Ladder

`resolvePlayerCardTemplate()` is the single source of truth for the resolved
rating tier. It uses the unrounded numeric rating:

- below 7.5: `club`
- 7.5 to below 8.0: `white-editorial`
- 8.0 to below 8.5: `black-performance`
- 8.5 to below 9.0: `performance-smoke`
- 9.0 to below 9.5: `gold-club`
- 9.5 and above: `gold-rare`

## Resolved tier and renderable template

The selection contract deliberately preserves two values:

- `resolvedTemplateId`: the product/rating tier
- `renderTemplateId`: the registered visual renderer used for generation

Black Performance and Gold Rare do not yet have visual templates. The central
capability fallback in `template-resolver.ts` therefore temporarily maps:

- `black-performance` to `white-editorial`
- `gold-rare` to `gold-club`

This does not redefine either rating tier. Generated requests and post payloads
retain `resolvedTemplateId`/`resolved_template_id`, while `templateId` and
`template_id` identify the artwork actually rendered and published. Removing a
fallback later requires registering its renderer and deleting its single map
entry.

Historical post routing continues to use persisted versioned payload metadata;
it never reruns the current rating resolver.
