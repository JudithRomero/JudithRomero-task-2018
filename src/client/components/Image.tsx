import * as React from 'react'


export interface Props {
  src?: string
  placeholder?: string
  className: string
}

export default class Image extends React.Component<Props> {
  ref: React.RefObject<HTMLImageElement> = React.createRef()

  componentDidMount() {
    this.setPlaceholder()
  }

  setPlaceholder() {
    const img = this.ref.current
    if (img) {
      img.onerror = () => {
        img.onerror = null
        img.src = this.props.placeholder
      }
      img.onload = () => {
        img.style.background = 'none'
      }
    }
  }

  render() {
    const { className, src, placeholder } = this.props
    this.setPlaceholder()
    return <img className={className} src={placeholder ? src || 'none' : src} ref={this.ref} />
  }
}
