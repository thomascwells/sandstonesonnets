-- Builds the printable trail flyers on print.qmd (switched on with
-- `trail-flyer: true` in its front matter). One flyer per trail, made from
-- the poem files themselves, so new poems and trails appear automatically:
--   - the poem and its first two hints (the clue and the map); the photo
--     hint and the answer stay on the website
--   - the "how to play" text from print.qmd's .flyer-intro section
--   - the "Tread lightly" section from the homepage (index.qmd)
--   - a QR code to the trail on the website (drawn by flyer/flyer.js), and
--     the site address and description from _quarto.yml

local poems = dofile(pandoc.path.join({ quarto.project.directory, "poem-data.lua" }))
local escape = poems.escape

local function slug(s)
  return (s:lower():gsub("[^%w]+", "-"):gsub("^%-+", ""):gsub("%-+$", ""))
end

-- The blocks under a heading in a .qmd file, up to the next heading.
local function section_of(file, heading)
  local f = io.open(file, "r")
  if not f then return {} end
  local doc = pandoc.read(f:read("*a"), "markdown")
  f:close()
  local out, inside = {}, false
  for _, b in ipairs(doc.blocks) do
    if b.t == "Header" then
      if inside then break end
      inside = pandoc.utils.stringify(b):lower() == heading:lower()
    elseif inside then
      table.insert(out, b)
    end
  end
  return out
end

-- The poem text (everything before the hints) and its hints, by number.
local function read_poem(p)
  local doc = pandoc.read(p.text, "markdown")
  local verse = {}
  for _, b in ipairs(doc.blocks) do
    if b.t == "Div" then break end
    table.insert(verse, b)
  end
  local hints = {}
  doc:walk({
    Div = function(div)
      local first = div.content[1]
      if div.classes:includes("callout-tip") and first and first.t == "Header" then
        local n = pandoc.utils.stringify(first):match("^Hint #(%d+)")
        if n then
          local body = {}
          for i = 2, #div.content do table.insert(body, div.content[i]) end
          hints[tonumber(n)] = body
        end
      end
    end,
  })
  return verse, hints
end

-- The map hint as a plain picture with its caption (no link, no lightbox).
local function map_figure(blocks)
  local img
  pandoc.Blocks(blocks):walk({ Image = function(el) img = img or el end })
  if not img then return nil end
  local caption = pandoc.utils.stringify(img.caption)
    :gsub("%s*Click for an interactive map%.?", "")
  local alt = img.attributes["fig-alt"] or caption
  return pandoc.RawBlock("html", string.format(
    '<figure class="flyer-map"><img src="poems/%s" alt="%s" loading="eager">'
      .. '<figcaption>%s</figcaption></figure>',
    escape(img.src), escape(alt), escape(caption)))
end

local function build(intro, site_url, description)
  local dir = pandoc.path.join({ quarto.project.directory, "poems" })
  local all = poems.all(dir)
  local tread = section_of(pandoc.path.join({ quarto.project.directory, "index.qmd" }), "Tread lightly")

  -- Group by trail, keeping the order trails first appear in.
  local trails, by_trail = {}, {}
  for _, p in ipairs(all) do
    if not by_trail[p.trail] then
      by_trail[p.trail] = {}
      table.insert(trails, p.trail)
    end
    table.insert(by_trail[p.trail], p)
  end

  local blocks = pandoc.Blocks({})

  -- On-screen trail picker (not printed).
  local chips = {}
  for _, t in ipairs(trails) do
    table.insert(chips, string.format('<a class="trail-chip" href="#trail-%s">%s</a>',
      slug(t), escape(t)))
  end
  blocks:insert(pandoc.RawBlock("html",
    '<div class="flyer-picker">' .. table.concat(chips, " ")
      .. '<button type="button" class="btn flyer-print" onclick="window.print()">'
      .. 'Print this flyer</button></div>'))

  for _, t in ipairs(trails) do
    local list = by_trail[t]
    local first = list[1]
    local places = poems.places(t, first.fm.categories)
    local trail_url = site_url .. poems.category_link(t, first.fm.categories)

    local more_poems = #all - #list
    local more_trails = #trails - 1
    blocks:insert(pandoc.RawBlock("html", string.format(
      '<section class="flyer" id="flyer-%s">'
        .. '<header class="flyer-header">'
        .. '<img src="poems/images/logo.webp" alt="" loading="eager">'
        .. '<div><p class="flyer-site">Sandstone Sonnets</p>'
        .. '<p class="flyer-tagline">%s</p>'
        .. '<p class="flyer-trail">%s</p></div>'
        .. '<div class="flyer-qr-box"><div class="flyer-qr" data-url="%s"></div>'
        .. '<p>Photo hints, answers and <strong>%d more poems on %d more trails</strong>'
        .. ' at <strong>%s</strong></p></div></header>',
      slug(t), escape(description), escape(table.concat(places, " · ")),
      escape(trail_url), more_poems, more_trails,
      escape((site_url:gsub("^https?://", ""):gsub("/$", ""))))))
    blocks:extend(intro)
    if #tread > 0 then
      blocks:insert(pandoc.RawBlock("html", '<div class="flyer-tread"><strong>Tread lightly:</strong> '))
      blocks:extend(tread)
      blocks:insert(pandoc.RawBlock("html", '</div>'))
    end

    for _, p in ipairs(list) do
      local verse, hints = read_poem(p)
      blocks:insert(pandoc.RawBlock("html", string.format(
        '<article class="flyer-poem"><div class="flyer-verse">'
          .. '<h2 class="flyer-poem-title"><span>%s #%d</span> %s</h2>',
        escape(t), p.n, escape(p.title))))
      blocks:extend(verse)
      blocks:insert(pandoc.RawBlock("html", '</div><div class="flyer-hints">'))
      if hints[1] then
        blocks:insert(pandoc.RawBlock("html", '<p class="flyer-hint-label">Hint 1</p>'))
        blocks:extend(hints[1])
      end
      local map = hints[2] and map_figure(hints[2])
      if map then
        blocks:insert(pandoc.RawBlock("html", '<p class="flyer-hint-label">Hint 2</p>'))
        blocks:insert(map)
      end
      blocks:insert(pandoc.RawBlock("html", '</div></article>'))
    end

    blocks:insert(pandoc.RawBlock("html", '</section>'))
  end
  return blocks
end

function Pandoc(doc)
  if not doc.meta["trail-flyer"] then return nil end

  -- The site address and description, from the website settings in _quarto.yml.
  local f = io.open(pandoc.path.join({ quarto.project.directory, "_quarto.yml" }), "r")
  local config = f and f:read("*a") or ""
  if f then f:close() end
  local site_url = (config:match('\n%s*site%-url:%s*"([^"]*)"') or ""):gsub("/$", "")
  local description = config:match('\n%s*description:%s*"([^"]*)"') or ""

  -- Take the .flyer-intro section out of the page; it goes into each flyer.
  local intro = pandoc.Blocks({})
  local out = pandoc.Blocks({})
  for _, b in ipairs(doc.blocks) do
    if b.t == "Div" and b.classes:includes("flyer-intro") then
      intro:insert(b)
    else
      out:insert(b)
    end
  end

  local result = pandoc.Blocks({})
  for _, b in ipairs(out) do
    if b.t == "Div" and b.identifier == "flyers" then
      result:extend(build(intro, site_url, description))
    else
      result:insert(b)
    end
  end
  doc.blocks = result
  return doc
end
