-- Shared helpers for reading the poems in poems/*.qmd. Used by
-- trail-nav.lua (previous/next links) and trail-flyer.lua (printable flyers).
-- Load it with:  local poems = dofile(<project dir> .. "/poem-data.lua")

local M = {}

-- The front matter of a poem: simple "key: value" lines, plus the list of
-- categories.
function M.read_front_matter(path)
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
  return fm, text
end

-- "D4 #2" -> "D4", 2
function M.parse_subtitle(subtitle)
  if not subtitle then return nil end
  local trail, num = subtitle:match("^(.-)%s*#(%d+)%s*$")
  if trail and trail ~= "" then return trail, tonumber(num) end
end

function M.title_case(s)
  return (s:gsub("(%a)([%w']*)", function(first, rest) return first:upper() .. rest end))
end

function M.escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

-- The places a poem is in, most specific first: the trail, then its other
-- categories, e.g. { "D4", "Devil's Canyon", "Fruita" }.
function M.places(trail, categories)
  local places = { trail }
  for i = #categories, 1, -1 do
    local c = categories[i]
    if c:lower() ~= trail:lower() then table.insert(places, M.title_case(c)) end
  end
  return places
end

-- Link to the homepage filtered to a trail, using the poem's own category
-- spelling so the filter matches.
function M.category_link(trail, categories)
  local cat = trail
  for _, c in ipairs(categories) do
    if c:lower() == trail:lower() then cat = c end
  end
  return "/#category=" .. cat:gsub(" ", "%%20")
end

-- Every published poem in `dir`, each as
-- { file, name, href, title, trail, n, fm, text }, sorted by trail, then number.
function M.all(dir)
  local list = {}
  for _, name in ipairs(pandoc.system.list_directory(dir)) do
    if name:match("%.qmd$") then
      local file = pandoc.path.join({ dir, name })
      local fm, text = M.read_front_matter(file)
      local trail, n = M.parse_subtitle(fm and fm.subtitle)
      if trail and fm.draft ~= "true" then
        table.insert(list, { file = file, name = name, title = fm.title or name,
                             href = name:gsub("%.qmd$", ".html"),
                             trail = trail, n = n, fm = fm, text = text })
      end
    end
  end
  table.sort(list, function(a, b)
    if a.trail ~= b.trail then return a.trail < b.trail end
    return a.n < b.n
  end)
  return list
end

return M
