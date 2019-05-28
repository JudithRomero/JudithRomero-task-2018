import * as React from 'react'
import * as style from '../style.css'


export interface Props {
  suggestions: object
  maxSuggestions?: number
  placeHolder?: string
  onSuggest?: (suggestion: string) => void
}

const KEYCODE = {
  enter: 13,
  arrowTop: 38,
  arrowDown: 40,
}

export default class SuggestionBox extends React.Component<Props> {
  state = { show: false, suggestions: [], hovered: -1 }
  inputRef = React.createRef<HTMLInputElement>()
  query: RegExp = new RegExp('')

  constructor(props) {
    super(props)
    this.state.suggestions = Object.keys(this.props.suggestions)
  }

  componentDidMount() {
    this.inputRef.current.addEventListener('input', this.onInput)
    this.updateSuggestions(this.inputRef.current, this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.updateSuggestions(this.inputRef.current, nextProps)
  }

  componentWillUnmount() {
    this.inputRef.current.removeEventListener('input', this.onInput)
  }

  updateSuggestions(input, props) {
    const valEscaped = input.value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(valEscaped, 'gi')
    const suggs: string[] = Object.keys(props.suggestions)
    const suggestions = []
    const limit = this.props.maxSuggestions || suggs.length
    for (let i = 0; i < suggs.length && suggestions.length < limit; i++) {
      regex.lastIndex = 0
      if (regex.test(suggs[i])) suggestions.push(suggs[i])
    }
    this.query = valEscaped ? regex : null
    const hovered = this.state.hovered >= suggestions.length ? suggestions.length - 1
      : this.state.hovered
    this.setState({ suggestions, hovered })
  }

  onInput = (e) => {
    this.updateSuggestions(e.target, this.props)
  }

  getRenderedSuggestions() {
    const result = this.state.suggestions.map((s, i) => {
      const c = this.state.hovered === i ? [style.tagboxSuggestion, style.hover].join(' ')
        : style.tagboxSuggestion
      const parts = []
      if (this.query) {
        let lastIndex = 0
        s.replace(this.query, (v, index) => {
          parts.push(<span key={Math.random()}>{s.substring(lastIndex, index)}</span>)
          parts.push(<b key={Math.random()}>{v}</b>)
          lastIndex = index + v.length
          return ''
        })
        parts.push(s.substr(lastIndex))
      } else parts.push(<span key={Math.random()}>{s}</span>)
      const onMouseEnter = () => this.setState({ hovered: i })
      return <div key={i} onMouseEnter={onMouseEnter}
        onClick={() => this.inputRef.current.blur()} className={c}>{parts}</div>
    })
    return result
  }

  anyHovered = () => this.state.hovered >= 0 && this.state.hovered < this.state.suggestions.length

  onBlur = async () => {
    if (this.anyHovered() && this.props.onSuggest) {
      this.inputRef.current.value = ''
      const { hovered, suggestions } = this.state
      await new Promise(res => this.setState({ hovered: -1, show: false }, res))
      this.props.onSuggest(suggestions[hovered])
    } else this.setState({ show: false })
  }

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { hovered, suggestions } = this.state
    const slen = suggestions.length
    if (e.keyCode === KEYCODE.enter) {
      e.preventDefault()
      this.inputRef.current.blur()
    } else if (e.keyCode === KEYCODE.arrowDown) {
      e.preventDefault()
      this.setState({ hovered: this.anyHovered() ? (hovered + 1) % slen : 0 })
    } else if (e.keyCode === KEYCODE.arrowTop) {
      e.preventDefault()
      this.setState({ hovered: this.anyHovered() ? (hovered - 1 + slen) % slen : (slen - 1) })
    }
  }

  render() {
    return <div className={style.tagboxList}>
      <input ref={this.inputRef} autoComplete="off" className={[style.input, style.tagboxInput].join(' ')}
        placeholder={this.props.placeHolder} onKeyDown={this.onKeyDown}
        onFocus={() => this.setState({ show: true })} onBlur={this.onBlur} />
      <div onMouseLeave={() => this.setState({ hovered: -1 })}
        style={{ display: this.state.show ? 'block' : 'none' }}
        className={style.tagboxSuggestions}>{this.getRenderedSuggestions()}</div>
    </div>
  }
}
