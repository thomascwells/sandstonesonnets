-- Make the browser fetch each image only when it is about to come into view.
-- Hints and answers sit in collapsed sections, so most photos never load
-- unless the reader opens them.
function Image(el)
  if el.attributes.loading == nil then
    el.attributes.loading = "lazy"
  end
  return el
end
