-- Small tweaks to every image on the site.

-- Make the browser fetch each image only when it is about to come into view.
-- Hints and answers sit in collapsed sections, so most photos never load
-- unless the reader opens them.
function Image(el)
  if el.attributes.loading == nil then
    el.attributes.loading = "lazy"
  end
  return el
end

-- A photo that links to its own file, like [![](a.jpg)](a.jpg), would open
-- the bare image file. Drop that link so the photo opens in the zoomable
-- lightbox instead. Links that go somewhere else (e.g. maps) are kept.
function Link(el)
  if #el.content == 1 and el.content[1].t == "Image"
      and el.content[1].src == el.target then
    return el.content[1]
  end
end
