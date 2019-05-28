import * as React from 'react'
import * as style from '../style.css'


export interface Props {
  url: string
  circleText?: string
  title?: string
}

export default class Avatar extends React.Component<Props> {
  render() {
    const { url, circleText, title } = this.props
    return <div title={title} className={style.avatar}>
      <div className={style.avatarImg} style={{ backgroundImage: `url(${url})` }} />
      {circleText ? <div className={style.avatarCircle}>{circleText}</div> : null}
    </div>
  }
}
