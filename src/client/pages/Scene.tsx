import * as React from 'react'
import { NavLink } from 'react-router-dom'
import Header from '../components/Header'
import Image from '../components/Image'
import * as style from '../style.css'
import * as placeholderPath from '../static/adventure_placeholder.png'


export default class Scene extends React.Component<any> {
  state = { description: '', textAlign: '', imageUrl: '', actions: [], achievements: [] }
  mounted = true

  async componentWillMount() {
    await this.componentWillReceiveProps(this.props)
  }

  async componentWillReceiveProps(nextProps) {
    try {
      const { sceneId } = nextProps.match.params
      const scene = await fetch(`/api/scene/${sceneId}${window.location.search}`).then(x => x.json())
      if (!this.mounted) return
      this.setState(scene)
    } catch {
      if (!this.mounted) return
      this.setState({ description: '', textAlign: '', imageUrl: '', actions: [], achievements: [] })
    }
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    const { description, textAlign, imageUrl, actions, achievements } = this.state
    const south = ~['SE', 'SW'].indexOf(textAlign) ? 'south' : ''
    const east = ~['SE', 'NE'].indexOf(textAlign) ? 'east' : ''
    const textClasses = [style.sceneImageText, style[south], style[east]].join(' ')
    const actionClass = [style.button, style.buttonAction].join(' ')
    return <React.Fragment>
      <Header />
      <div className={style.main}>
        <div className={style.scene}>
          <div className={style.sceneImage}>
            {imageUrl ? <Image className={style.sceneImageImg} src={imageUrl} /> : null}
            <p className={textClasses}>{description}</p>
          </div>
          <div className={style.achievements}>{achievements
            .map((a, i) => <div key={i} className={style.achievement}>
              <Image placeholder={placeholderPath} className={style.achievementImg} src={a[1]} />
              <div>
                <h3 className={style.achievementTitle}>Достижение получено</h3>
                <p className={style.achievementDescription}>{a[0]}</p>
              </div>
            </div>)}</div>
          <div className={style.actions}>{actions.map((a, i) => <NavLink key={i}
            className={actionClass} to={`/scene/${a[0]}${window.location.search}`}>{a[1]}</NavLink>)}</div>
        </div>
      </div>
    </React.Fragment>
  }
}
