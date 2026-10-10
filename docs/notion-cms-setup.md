# Notion CMS setup

The routes `/projects`, `/blog`, `/articles`, `/tutorials`, and `/glossary` read published content from Notion on the server. Every item has a canonical `/{collection}/{slug}` detail page. The site uses Notion for content and metadata only; its own archive/detail design is intentionally independent of the reference project.

The integration is read-only. Drafts stay private, Notion credentials remain server-side, and saved items are stored only in each reader's browser.

## 1. Create a read-only Notion integration

1. Open [Notion integrations](https://www.notion.so/my-integrations) and create an internal integration in the workspace that owns your content.
2. Copy its internal integration token.
3. Give it **Read content** capability only. This site never creates or edits Notion pages.
4. Open each collection database and use **Connections** / **Connect to** to share it with the integration. Repeat for all five collections. If using an Authors database, share that too.

Keep the token private. Never use a `NEXT_PUBLIC_` prefix for the Notion token or expose it to browser code.

## 2. Create the content databases

Use one Notion database (or data source) per collection. Properties are detected case-insensitively; the first Title property supplies the entry title.

| Property                     | Notion type            | Required    | Purpose / recognized alternatives                                                                                                    |
| ---------------------------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Name (or any title property) | Title                  | Yes         | Entry heading; the title property's name does not matter.                                                                            |
| Slug                         | Rich text              | Recommended | Stable route slug, e.g. `motor-selection`. `URL Slug` is also recognized. If omitted, the title is converted to a slug.              |
| Status                       | Select or Status       | Yes         | Only entries matching `NOTION_PUBLISHED_STATUS` are public. `Publication status` is also recognized.                                 |
| Description                  | Rich text              | No          | Short summary, SEO description, and archive/search text. `Summary` and `Excerpt` are alternatives.                                   |
| Date                         | Date                   | No          | Publication/sort date. `Published date` and `Publication date` are alternatives; creation/edit time is used as a fallback.           |
| Tags                         | Multi-select           | No          | Topics and search terms. `Keywords` is an alternative.                                                                               |
| Categories                   | Select or Multi-select | No          | Subject labels. `Category` is an alternative.                                                                                        |
| Technical                    | Multi-select or Select | No          | Technology/discipline labels. `Technology` is an alternative.                                                                        |
| Thumbnail                    | Files & media or URL   | No          | Archive and hero image. `Cover image` or `Image` are alternatives; the page cover is a fallback.                                     |
| RTime                        | Number                 | No          | Optional reading time in minutes. `Reading time` and `Read time` are alternatives; otherwise time is estimated from the page blocks. |
| AIAssisted                   | Checkbox               | No          | Optional AI-assisted indicator. `AI Assisted` and `AI-assisted` are alternatives.                                                    |
| Author / Authors             | Relation               | No          | Optional relation to the Authors database.                                                                                           |

### Optional Authors database

Set `NOTION_AUTHORS_ID` and create an Authors database with a Title property for the author's name. Optional properties: `Slug` (rich text), `Role` (rich text), `Biography` (rich text), `Avatar` (Files & media or URL), and `Twitter`, `GitHub`, `LinkedIn` (URL or rich text). Link each content entry using its `Author` or `Authors` relation. Author data is optional; the site simply omits the byline/profile when no matching author exists. An Authors row with no publication status is visible; if it has a Status property, set it to the published value to include it.

For Glossary, use one database row per term. Put the term in the title property, a concise definition in Description, and the extended explanation in the page body.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and enter the token and database IDs:

```env
NOTION_API_KEY=secret_your_internal_integration_token
NOTION_PROJECTS_ID=your_projects_database_or_data_source_id
NOTION_BLOG_ID=your_blog_database_or_data_source_id
NOTION_ARTICLES_ID=your_articles_database_or_data_source_id
NOTION_TUTORIALS_ID=your_tutorials_database_or_data_source_id
NOTION_GLOSSARY_ID=your_glossary_database_or_data_source_id
NOTION_PUBLISHED_STATUS=Published

# Optional:
NOTION_AUTHORS_ID=your_authors_database_or_data_source_id
NEXT_PUBLIC_SITE_URL=https://prasadm.vercel.app
```

`NOTION_AUTH_TOKEN` is accepted instead of `NOTION_API_KEY`. `NOTION_WIKI_ID` is accepted as a compatibility alias for `NOTION_GLOSSARY_ID`. `NOTION_API_VERSION` can override the default. You can provide a database ID copied from its URL or a data source ID; when a database has multiple data sources, use the one containing the intended collection.

For Vercel, add the same variables in **Project Settings → Environment Variables** and redeploy. Set `NEXT_PUBLIC_SITE_URL` to the deployed canonical origin if it differs from the example. Never commit `.env.local`.

## 4. Write and publish content

Set each entry's Status to `Published` (or the exact value configured in `NOTION_PUBLISHED_STATUS`). Archived pages, drafts, and entries with another/missing status are excluded. The title, description, date, categories, technical labels, author, reading time, and cover metadata populate collection cards and detail pages. A full-text block renderer handles headings, rich text, lists, nested/toggled content, callouts, quotes, todos, code, math, images, files, tables, columns, links, bookmarks, and supported video embeds.

### Optional interactive blocks

These are written literally in one Notion paragraph (long quiz JSON may continue across rich-text fragments within that paragraph):

- **Tabs:**

  ```text
  [tabs]
  [tab title="Overview"]
  Markdown is supported here.
  [/tab]
  [tab title="Details"]
  **Another panel**
  [/tab]
  [/tabs]
  ```

- **Button:** `[button href="https://example.com"]Open the resource[/button]` (HTTP(S), `mailto:`, `tel:`, local paths, and page anchors are accepted; unsafe URL schemes are rejected).
- **Quiz:** wrap a JSON object in `[quiz]` and `[/quiz]`. `answer` is a zero-based option index:

  ```text
  [quiz]
  {"title":"Quick check","questions":[{"question":"Which unit measures force?","options":["Watt","Newton","Joule"],"answer":1,"explanation":"The newton is the SI unit of force."}]}
  [/quiz]
  ```

- **Mermaid:** use a native Notion code block with language set to `Mermaid`; diagrams render lazily with safe mode and controls.
- **Math:** native Notion equation blocks use KaTeX. Inline equations in rich-text are also supported.
- **Alerts:** a paragraph/quote beginning with `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, or `[!CAUTION]` is styled as an alert.
- **Markdown inside tabs/alerts:** rendered on the server and sanitized; arbitrary HTML and executable attributes are stripped.

Readers can search and paginate compact collection archives, follow a heading-aware desktop outline or mobile section-progress control, adjust article text size/font/line spacing/contrast, copy code, take quizzes, and save items to `/bookmarks`. Saved items use browser local storage; they are not written back to Notion or synced between devices. Social links and author profiles appear when author metadata is available. Public detail pages do not link viewers to the private Notion workspace. Article metadata and JSON-LD are generated from each entry; `/rss.xml` aggregates the five published collections, and `/sitemap.xml` includes the public collection and detail routes.

## 5. Caching and images

Notion API responses are cached for about one hour. Newly published or edited pages may take up to an hour to appear. Notion-hosted image URLs expire; the site refreshes them through a server endpoint so the Notion token remains private. Arbitrary external image hosts remain subject to the site's Content Security Policy.

## Troubleshooting

- **“Connect this collection” appears:** confirm the token and that collection's ID are present in the server environment; restart or redeploy.
- **The collection is empty:** check that rows have a Status/Publication status property set to the published value and that the integration has Read content access.
- **The integration returns 403/404:** check the database/data source ID and share the database with the integration.
- **Author details are missing:** configure `NOTION_AUTHORS_ID`, share that database, and confirm a content row's Author/Authors relation points to an included author.
- **A card has no image:** add a page cover or a `Thumbnail` property containing a file or URL.
- **Changes have not appeared:** wait for the one-hour cache window or redeploy after checking configuration.
- **A block is not displayed:** unsupported Notion block types are omitted rather than injected as unsafe markup. Public viewers only see the content rendered on this site.
