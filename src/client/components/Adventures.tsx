import * as React from 'react'
import { NavLink } from 'react-router-dom'
import Image from './Image'
import * as style from '../style.css'
import * as placeholderPath from '../static/adventure_placeholder.png'


export interface Tag {
  name: string
  linkName: string
}

export interface AdventureProp {
  name: string
  sceneId: string
  imageUrl?: string
  description?: string
  tags: Tag[]
}

export interface Props {
  title?: string
  adventures: AdventureProp[]
  onBottomReached?: () => Promise<void>
}

export default class Adventures extends React.Component<Props> {
  lastTitleRef = React.createRef<HTMLDivElement>()
  bottomReached = false

  onScroll = async () => {
    if (!this.lastTitleRef.current) return
    const rect = this.lastTitleRef.current.getBoundingClientRect()
    const isLastTitleVisible = (rect.top >= 0) && (rect.bottom <= window.innerHeight)
    const { onBottomReached } = this.props
    if (!this.bottomReached && isLastTitleVisible && onBottomReached) {
      this.bottomReached = true
      await onBottomReached()
    }
  }

  async componentDidUpdate() {
    this.bottomReached = false
    await this.onScroll()
  }

  componentWillMount() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  }

  render() {
    const setRef = i => (i === this.props.adventures.length ? { ref: this.lastTitleRef } : {})
    const adventures = this.props.adventures.map((a, i) => <div key={i} className={style.adventure}>
      <NavLink className={style.adventureImgLink} title={a.name} to={`/scene/${a.sceneId}`}>
        <Image src={a.imageUrl} placeholder={placeholderPath} className={style.adventureImg} />
      </NavLink>
      <div {...setRef(i + 1)}>
        <NavLink className={style.adventureName} title={a.name} to={`/scene/${a.sceneId}`}>{a.name}</NavLink>
        <p className={style.adventureDesc}>{a.description}</p>
        {a.tags.map((t, j) => <NavLink key={j} className={`${style.button} ${style.buttonTag}`}
          to={`/tag/${t.linkName}`}>#{t.name}</NavLink>)}
      </div>
    </div>)
    return <div className={style.adventures}>
      <h1 className={style.tagTitle}>{this.props.title ? `#${this.props.title}` : ''}</h1>
      {adventures}
    </div>
  }
}
