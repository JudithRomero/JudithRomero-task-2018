import * as React from 'react'
import { NavLink } from 'react-router-dom'
import * as style from '../style.css'


export default class Header extends React.Component {
  render() {
    return <header className={style.header}>
      <NavLink to="/" className={style.logo}>
        <div className={style.logoIcon}></div>
        <span className={style.logoLeft}>Judith</span>
        <span className={style.logoRight}>Games</span>
      </NavLink>
    </header>
  }
}
