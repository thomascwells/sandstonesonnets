-- Adds "Previous / All poems on this trail / Next" links to the bottom of
-- each poem, in hiking order. Order comes from the poem's subtitle, e.g.
-- "D4 #2" is the 2nd feature on trail D4. Drafts are skipped.
-- Also adds the "I found it!" and "Share" buttons above those links.

local function read_front_matter(path)
  local f = io.open(path, "r")
  if not f then return nil end
  local text = f:read("*a")
  f:close()
  local yaml = text:match("^%-%-%-\r?\n(.-)\r?\n%-%-%-")
  if not yaml then return nil end

  local fm = { categories = {} }
  local in_categories = false
  for line in (yaml .. "\n"):gmatch("(.-)\r?\n") do
    local key, value = line:match("^([%w%-]+):%s*(.-)%s*$")
    if key then
      in_categories = (key == "categories")
      if not in_categories then
        fm[key] = value:gsub('^"(.*)"$', "%1"):gsub("^'(.*)'$", "%1")
      end
    elseif in_categories then
      local cat = line:match("^%s+%-%s+(.-)%s*$")
      if cat then table.insert(fm.categories, cat) end
    end
  end
  return fm
end

local function parse_subtitle(subtitle)
  if not subtitle then return nil end
  local trail, num = subtitle:match("^(.-)%s*#(%d+)%s*$")
  if trail and trail ~= "" then return trail, tonumber(num) end
end

local function escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

local function category_link(trail, categories)
  -- Use the poem's own category spelling so the homepage filter matches.
  local cat = trail
  for _, c in ipairs(categories) do
    if c:lower() == trail:lower() then cat = c end
  end
  return "/#category=" .. cat:gsub(" ", "%%20")
end

function Pandoc(doc)
  local input = quarto.doc.input_file
  local dir = pandoc.path.directory(input)
  if pandoc.path.filename(dir) ~= "poems" then return nil end

  local me = read_front_matter(input)
  local trail, num = parse_subtitle(me and me.subtitle)
  if not trail then return nil end

  local stops = {}
  for _, name in ipairs(pandoc.system.list_directory(dir)) do
    if name:match("%.qmd$") then
      local fm = read_front_matter(pandoc.path.join({ dir, name }))
      local t, n = parse_subtitle(fm and fm.subtitle)
      if t == trail and fm.draft ~= "true" then
        table.insert(stops, { n = n, title = fm.title or name,
                              href = name:gsub("%.qmd$", ".html") })
      end
    end
  end
  table.sort(stops, function(a, b) return a.n < b.n end)

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
                     category_link(trail, me.categories), escape(trail))
    .. link(next, "trail-nav-next", "Next on " .. escape(trail) .. " &rarr;")
    .. "</nav>"

  doc.blocks:insert(pandoc.RawBlock("html", html))
  return doc
end
