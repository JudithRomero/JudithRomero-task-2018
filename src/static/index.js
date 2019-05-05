var urlencode = encodeURIComponent
var allTags = JSON.parse(document.getElementById('alltags').innerHTML)
var dom = {
  adventures: document.getElementById('adventures'),
  searchform: document.getElementById('searchform'),
  searchboxInput: document.getElementById('searchbox-input'),
  tagboxInput: document.getElementById('tagbox-input'),
  tagbox: document.getElementById('tagbox'),
  submitBtn: document.getElementById('submit-btn'),
  latestAdventureTitle: function() {
    return document.querySelector('.adventure:last-child .adventure-name')
  },
  tagboxSuggestions: document.getElementById('tagbox-suggestions'),
}
var loadingId = Math.random()
var KEYCODE = {
  enter: 13,
  arrowTop: 38,
  arrowDown: 40,
}
var isLoading = false
var isLastPage = false
var currentTags = {}
var searchArgs = {
  query: '',
  tags: [],
}

function defaultImgPlaceholder() {
  this.src = '/android-chrome-512x512.png'
}

function addTag(tag) {
  var btag = document.createElement('a')
  btag.className = 'button button-btag'
  var cross = document.createElement('span')
  cross.className = 'button-btag-cross'
  cross.onclick = (function(tag, btag) { return function(){
    delete currentTags[tag[1]]
    btag.parentNode.removeChild(btag)
  }})(tag, btag)
  cross.appendChild(document.createTextNode('✕'))
  btag.appendChild(document.createTextNode('#'))
  btag.appendChild(document.createTextNode(tag[0]))
  btag.appendChild(cross)
  dom.tagbox.appendChild(btag)
}

function addAdventure(name, imageUrl, sceneId, desc, tags) {
  var href = '/scene/' + urlencode(sceneId) + '?root=' + urlencode(sceneId)
  var adventureImg = document.createElement('img')
  adventureImg.src = imageUrl
  adventureImg.alt = name
  adventureImg.className = 'adventure-img'
  adventureImg.onerror = defaultImgPlaceholder
  var adventureImgLink = document.createElement('a')
  adventureImgLink.className = 'adventure-img-link'
  adventureImgLink.title = name
  adventureImgLink.href = href
  adventureImgLink.appendChild(adventureImg)
  var adventureName = document.createElement('a')
  adventureName.href = href
  adventureName.className = 'adventure-name'
  adventureName.appendChild(document.createTextNode(name))
  var adventureDesc = document.createElement('p')
  adventureDesc.className = 'adventure-desc'
  if (desc)
    adventureDesc.appendChild(document.createTextNode(desc))
  var adventureInfo = document.createElement('div')
  adventureInfo.appendChild(adventureName)
  adventureInfo.appendChild(adventureDesc)
  for (var i = 0; i < tags.length; i++) {
    var tag = document.createElement('a')
    tag.href = '/tag/' + tags[i][1]
    tag.className = 'button button-tag'
    tag.appendChild(document.createTextNode('#'))
    tag.appendChild(document.createTextNode(tags[i][0]))
    adventureInfo.appendChild(tag)
  }
  var adventureDiv = document.createElement('div')
  adventureDiv.className = 'adventure'
  adventureDiv.appendChild(adventureImgLink)
  adventureDiv.appendChild(adventureInfo)
  dom.adventures.appendChild(adventureDiv)
}

function isLastAdventureTitleVisible() {
  // https://stackoverflow.com/a/22480938
  var title = dom.latestAdventureTitle()
  if (!title) return true
  var rect = title.getBoundingClientRect()
  return (rect.top >= 0) && (rect.bottom <= window.innerHeight)
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
}

function getSearchResults(query, tags, page, cb) {
  var xhr = new XMLHttpRequest()
  var url = '/api/search?'
  for (var i = 0; i < tags.length; i++) {
    url += 't=' + encodeURIComponent(tags[i]) + '&'
  }
  url += 'q=' + encodeURIComponent(query) + '&'
  url += 'p=' + encodeURIComponent(page)
  xhr.open('GET', url)
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return
    if (xhr.status === 200) cb(JSON.parse(xhr.responseText))
    else cb(null)
  }
  xhr.onerror = function () { cb(null) }
  xhr.send()
}

function getCurrentSearchResults(page, cb) {
  if (isLastPage) {
    cb([])
    return
  }
  getSearchResults(searchArgs.query, searchArgs.tags, page, function(adventures) {
    if (!adventures) alert('Произошла ошибка, попробуйте повторить запрос позже')
    if (!adventures || !adventures.length) isLastPage = true
    cb(adventures)
  })
}

function currentPage() {
  return Math.ceil(dom.adventures.children.length / 5)
}

function loadAdventures() {
  onScroll(loadAdventures)
}

function onScroll(cb) {
  if (isLoading || !isLastAdventureTitleVisible()) return
  var currentLoadingId = loadingId
  var page = currentPage()
  isLoading = true
  getCurrentSearchResults(page, function(adventures) {
    isLoading = false
    if (loadingId !== currentLoadingId || currentPage() !== page
      || !adventures || !adventures.length) return
    for (var i = 0; i < adventures.length; i++) {
      var a = adventures[i]
      addAdventure(a[0], a[1], a[2], a[3], a[4])
    }
    cb()
  })
}

function removeHoverFromSuggestions() {
  var children = dom.tagboxSuggestions.childNodes
  for (var i = 0; i < children.length; i++)
    children[i].classList.remove('hover')
}

function hoverSuggestion(node) {
  removeHoverFromSuggestions()
  node.classList.add('hover')
}

function updateSuggestions() {
  var val = dom.tagboxInput.value
  var valEscaped = val.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  var regex = new RegExp(valEscaped, 'gi')
  var appropriateTags = []
  for (var i = 0; i < allTags.length && appropriateTags.length < 5; i++) {
    if (currentTags[allTags[i][1]]) continue
    regex.lastIndex = 0
    if (regex.test(allTags[i][0])) appropriateTags.push(allTags[i])
  }
  clearChildren(dom.tagboxSuggestions)
  for (var i = 0; i < appropriateTags.length; i++) {
    var sugg = document.createElement('div')
    sugg.className = 'tagbox-suggestion'
    var text = appropriateTags[i][0]
    sugg.onclick = (function(tag){ return function() {
      dom.tagboxSuggestions.style.display = 'none'
      currentTags[tag[1]] = 1
      addTag(tag)
      dom.tagboxInput.value = ''
      updateSuggestions()
    }})(appropriateTags[i])
    sugg.onmouseenter = function() { hoverSuggestion(this) }
    var lastIndex = 0
    text.replace(regex, function (v, index) {
      sugg.appendChild(document.createTextNode(text.substring(lastIndex, index)))
      var bold = document.createElement('b')
      bold.appendChild(document.createTextNode(v))
      sugg.appendChild(bold)
      lastIndex = index + v.length
    })
    sugg.appendChild(document.createTextNode(text.substr(lastIndex)))
    dom.tagboxSuggestions.appendChild(sugg)
  }
}

dom.searchform.addEventListener('submit', function(e) {
  e.preventDefault()
  searchArgs.query = dom.searchboxInput.value
  searchArgs.tags = []
  for (var tagName in currentTags) searchArgs.tags.push(tagName)
  isLastPage = false
  isLoading = false
  loadingId = Math.random()
  clearChildren(dom.adventures)
  loadAdventures()
})

window.addEventListener('scroll', function() {
  loadAdventures()
}, { passive: true })

dom.tagboxInput.addEventListener('focus', function() {
  updateSuggestions()
  dom.tagboxSuggestions.style.display = ''
})

var previousInputValue = '' // IE 11 input event hack
dom.tagboxInput.addEventListener('input', function () {
  var val = dom.tagboxInput.value
  if (val === previousInputValue) return
  previousInputValue = val
  updateSuggestions()
}, { passive: true })

dom.tagboxInput.addEventListener('keydown', function(e) {
  var first = dom.tagboxSuggestions.firstChild
  var last = dom.tagboxSuggestions.lastChild
  if (!first) return
  var hovered = dom.tagboxSuggestions.querySelector('.hover')
  if (e.keyCode === KEYCODE.arrowTop) {
    e.preventDefault()
    hoverSuggestion(hovered ? (hovered.previousSibling || last) : last)
  } else if (e.keyCode === KEYCODE.arrowDown) {
    e.preventDefault()
    hoverSuggestion(hovered ? (hovered.nextSibling || first) : first)
  } else if (e.keyCode === KEYCODE.enter && hovered) {
    e.preventDefault()
    hovered.click()
    dom.tagboxInput.blur()
  }
})

dom.tagboxInput.addEventListener('blur', function() {
  var hovered = dom.tagboxSuggestions.querySelector('.hover')
  if (hovered) hovered.click()
  dom.tagboxSuggestions.style.display = 'none'
}, { passive: true })

dom.tagboxSuggestions.addEventListener('mouseleave', removeHoverFromSuggestions, { passive: true })

loadAdventures()
