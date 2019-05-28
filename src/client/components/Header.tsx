import * as React from 'react'
import { NavLink } from 'react-router-dom'
import * as style from '../style.css'
import Avatar from './Avatar'


// https://stackoverflow.com/a/15724300
export const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  return parts.length === 2 ? parts.pop().split(';').shift() : null
}

export const isLoggedIn = () => !!getCookie('username')

export default class Header extends React.Component {
  render() {
    const username = getCookie('username')
    const avatarUrl = decodeURIComponent(getCookie('avatarUrl'))
    return <header className={style.header}>
      <NavLink to="/" className={style.logo}>
        <div className={style.logoIcon}></div>
        <span className={style.logoLeft}>Judith</span>
        <span className={style.logoRight}>Games</span>
      </NavLink>
      <div className={style.headerButtons}>{isLoggedIn() ? <React.Fragment>
        <Avatar url={avatarUrl} />
        <span className={style.headerUsername}>{username}</span>
        <form method="POST" action="/auth/logout">
          <input type="hidden" name="csrf" value={getCookie('csrf')} />
          <button className={[style.button, style.buttonRegister].join(' ')}>Выйти</button>
        </form>
      </React.Fragment> : <React.Fragment>
        <NavLink to="/register" className={[style.button, style.buttonRegister].join(' ')}>Зарегистрироваться</NavLink>
        <NavLink to="/login" className={[style.button, style.buttonLogin].join(' ')}>Войти</NavLink>
      </React.Fragment>}</div>
    </header>
  }
}
