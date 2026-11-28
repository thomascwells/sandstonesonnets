-- Adds "Previous / All poems on this trail / Next" links to the bottom of
-- each poem, in hiking order. Order comes from the poem's subtitle, e.g.
-- "D4 #2" is the 2nd feature on trail D4. Drafts are skipped.
-- Also adds the "I found it!" and "Share" buttons above those links, and
-- puts the trail and area in the page's browser-tab / search-result title.

local poems = dofile(pandoc.path.join({ quarto.project.directory, "poem-data.lua" }))
local escape = poems.escape

-- Browser-tab and search-result title that says where the poem is, e.g.
-- "The Canyon's Secret Grin · D4, Devil's Canyon, Fruita". Built from the
-- trail and the categories, so it needs no upkeep. The page heading is unchanged.
local function place_title(doc, trail, categories)
  local title = pandoc.utils.stringify(doc.meta.title or "")
  if title ~= "" then
    doc.meta.pagetitle = title .. " · " .. table.concat(poems.places(trail, categories), ", ")
  end
end

function Pandoc(doc)
  local input = quarto.doc.input_file
  local dir = pandoc.path.directory(input)
  if pandoc.path.filename(dir) ~= "poems" then return nil end

  local me = poems.read_front_matter(input)
  local trail, num = poems.parse_subtitle(me and me.subtitle)
  if not trail then return nil end
  place_title(doc, trail, me.categories)

  local stops = {}
  for _, p in ipairs(poems.all(dir)) do
    if p.trail == trail then table.insert(stops, p) end
  end

  local prev, next
  for i, s in ipairs(stops) do
    if s.n == num then prev, next = stops[i - 1], stops[i + 1] end
  end

  local function link(s, class, label)
    if not s then return '<span class="' .. class .. '"></span>' end
    return string.format(
      '<a class="%s" href="%s"><span class="trail-nav-label">%s</span>'
        .. '<span class="trail-nav-title">%s</span></a>',
      class, s.href, label, escape(s.title))
  end

  -- "I found it!" and "Share" buttons (they work in site.js). The list of
  -- poems on this trail lets site.js show "2 of 4 D4 poems found".
  local hrefs = {}
  for _, s in ipairs(stops) do table.insert(hrefs, "/poems/" .. s.href) end
  local tools = string.format(
    '<div class="poem-tools" data-trail="%s" data-trail-poems="%s">'
      .. '<button type="button" class="btn found-toggle" aria-pressed="false">'
      .. 'I found it!</button>'
      .. '<button type="button" class="btn share-poem" hidden>Share</button>'
      .. '<span class="found-count" aria-live="polite"></span>'
      .. '</div>',
    escape(trail), escape(table.concat(hrefs, " ")))
  doc.blocks:insert(pandoc.RawBlock("html", tools))

  local html = '<nav class="trail-nav" aria-label="More poems on this trail">'
    .. link(prev, "trail-nav-prev", "&larr; Previous on " .. escape(trail))
    .. string.format('<a class="trail-nav-all" href="%s">All %s poems</a>',
                     poems.category_link(trail, me.categories), escape(trail))
    .. link(next, "trail-nav-next", "Next on " .. escape(trail) .. " &rarr;")
    .. "</nav>"

  doc.blocks:insert(pandoc.RawBlock("html", html))
  return doc
end
