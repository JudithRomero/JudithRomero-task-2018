import * as React from 'react'
import Header from '../components/Header'
import * as style from '../style.css'
import Adventures, { AdventureProp } from '../components/Adventures'


export default class Tag extends React.Component<any> {
  state = { adventures: [], title: '' }
  mounted = true

  async componentWillMount() {
    await this.componentWillReceiveProps(this.props)
  }

  async componentWillReceiveProps(nextProps) {
    try {
      const { tagName } = nextProps.match.params
      const { adventures, title } = await fetch(`/api/tag/${tagName}`).then(x => x.json())
      if (!this.mounted) return
      const adv: AdventureProp[] = adventures
        .map(a => ({
          id: a[0],
          name: a[1],
          description: a[2],
          sceneId: a[3],
          imageUrl: a[4],
          tags: a[5].map(t => ({ name: t[0], linkName: t[1] })),
          submissions: Object.entries(a[6])
            .map(([name, [times, avatarUrl]]: any) => ({ name, times, avatarUrl })),
        }))
      this.setState({ adventures: adv, title })
    } catch {
      alert('Во время загрузки приключений возникла ошибка, попробуйте позже')
    }
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    return <React.Fragment>
      <Header />
      <div className={style.main}>
        <Adventures {...this.state} />
      </div>
    </React.Fragment>
  }
}
