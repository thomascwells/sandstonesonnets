-- Turns each ### heading and the text under it into a section that stays
-- closed until the reader taps the heading. Used by the FAQ: add
-- `collapse-sections: true` to a page's front matter to switch it on.
-- Links to a heading, like /faq#offline, open that section (see site.js).

local function to_html(inlines)
  return pandoc.write(pandoc.Pandoc({ pandoc.Plain(inlines) }), "html")
end

function Pandoc(doc)
  if not doc.meta["collapse-sections"] then return nil end

  local out, open = pandoc.List(), false
  local function close()
    if open then out:insert(pandoc.RawBlock("html", "</details>")) end
    open = false
  end

  for _, block in ipairs(doc.blocks) do
    if block.t == "Header" and block.level <= 3 then
      close()
      if block.level == 3 then
        local id = block.identifier ~= "" and (' id="' .. block.identifier .. '"') or ""
        out:insert(pandoc.RawBlock("html",
          '<details class="collapsible-section"' .. id .. '><summary>'
            .. to_html(block.content) .. '</summary>'))
        open = true
      else
        out:insert(block)
      end
    else
      out:insert(block)
    end
  end
  close()
  doc.blocks = out
  return doc
end
