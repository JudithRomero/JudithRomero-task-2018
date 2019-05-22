import * as React from 'react'
import Header from '../components/Header'
import Adventures from '../components/Adventures'
import * as style from '../style.css'
import SuggestionBox from '../components/SuggestionBox'


export default class Search extends React.Component {
  state = { adventures: [], tags: [] }
  mounted = true
  page = 0
  query = ''
  tags = []
  allTags: object = {}
  inputRef = React.createRef<HTMLInputElement>()

  async componentWillMount() {
    const tags = await fetch('/api/tags').then(x => x.json())
    const allTags = {}
    tags.forEach(([k, v]) => {
      allTags[k] = v
    })
    this.allTags = allTags
    await this.update()
  }

  update = async () => {
    const { page, query, tags } = this
    let qs = tags.map(t => `t=${encodeURIComponent(t.linkName)}`).join('&')
    if (qs) qs += '&'
    qs += `q=${encodeURIComponent(query)}&`
    qs += `p=${page}`
    const adventures = await fetch(`/api/search?${qs}`).then(x => x.json())
    if (!this.mounted || (!adventures.length && this.state.adventures.length)) return
    const adv = adventures.map(a => ({
      name: a[0],
      imageUrl: a[1],
      sceneId: a[2],
      description: a[3],
      tags: a[4].map(t => ({ name: t[0], linkName: t[1] })),
    }))
    this.page += 1
    this.setState({ adventures: this.state.adventures.concat(adv) })
  }

  componentWillUnmount() {
    this.mounted = false
  }

  onSubmit = async (e) => {
    this.query = this.inputRef.current.value
    this.page = 0
    this.tags = this.state.tags
    this.setState({ adventures: [] })
    e.preventDefault()
    await this.update()
  }

  removeTag = i => () => {
    const tag = this.state.tags[i]
    const tags = this.state.tags.slice(0, i).concat(this.state.tags.slice(i + 1))
    this.allTags[tag.name] = tag.linkName
    this.setState({ tags })
  }

  onSuggest = (name) => {
    const linkName = this.allTags[name]
    delete this.allTags[name]
    this.setState({ tags: [...this.state.tags, { name, linkName }] })
  }

  render() {
    return <React.Fragment>
      <Header />
      <div className={style.main}>
        <div className={style.adventuresControls}>
          <form onSubmit={this.onSubmit}>
            <div className={style.searchbox}>
              <input ref={this.inputRef} autoFocus className={[style.input, style.searchboxInput].join(' ')} placeholder="Текст запроса" />
              <button className={[style.button, style.buttonSearch, style.searchboxButton].join(' ')}>Найти</button>
            </div><div className={style.tagbox}>
              <SuggestionBox maxSuggestions={5} placeHolder="Хештег" onSuggest={this.onSuggest} suggestions={this.allTags} />
              {this.state.tags.map((t, i) => <span key={i} className={[style.button, style.buttonBtag].join(' ')}>
                #{t.name}
                <span onClick={this.removeTag(i)} className={style.buttonBtagCross}>✕</span>
              </span>)}
            </div>
          </form>
        </div>
        <Adventures onBottomReached={this.update} adventures={this.state.adventures} />
      </div>
    </React.Fragment>
  }
}
