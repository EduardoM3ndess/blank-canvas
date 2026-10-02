<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The `/` route hosts the imported Origem app from `public/origem/`. Preserve its functionality and the Lovable/TanStack configuration when making changes.
- Keep mobile installation manifest-only unless offline behavior is explicitly requested, so previews cannot retain stale app caches.

- Serve the legacy HTML through a session-gated server route, while its static CSS/JS remain public; direct HTML access must fail without a valid tenant session.
- Store tenant documents as versioned JSON snapshots in Cloud; reject stale writes instead of silently overwriting concurrent changes.
- Keep administrative roles separate from companies and authenticate every admin API request with a validated user bearer plus a role lookup.
