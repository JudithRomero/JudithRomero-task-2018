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
    const { tagName } = nextProps.match.params
    const { adventures, title } = await fetch(`/api/tag/${tagName}`).then(x => x.json())
    if (!this.mounted) return
    const adv: AdventureProp[] = adventures
      .map(a => ({ ...a, tags: a.tags.map(t => ({ name: t[0], linkName: t[1] })) }))
    this.setState({ adventures: adv, title })
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    return <React.Fragment>
      <Header />
      <main className={style.main}>
        <Adventures {...this.state} />
      </main>
    </React.Fragment>
  }
}
