import * as React from 'react'
import Header from '../components/Header'
import * as style from '../style.css'


export default class Register extends React.Component {
  render() {
    return <React.Fragment>
      <Header />
      <div className={style.main}>Register</div>
    </React.Fragment>
  }
}
