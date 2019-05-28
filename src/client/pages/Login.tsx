import * as React from 'react'
import Header, { getCookie, isLoggedIn } from '../components/Header'
import * as style from '../style.css'


export default class Login extends React.Component {
  inputs = [React.createRef<HTMLInputElement>(), React.createRef<HTMLInputElement>()]

  onSubmit = async (e: React.FormEvent) => {
    const username = this.inputs[0].current.value
    const password = this.inputs[1].current.value
    e.preventDefault()
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, csrf: getCookie('csrf') }),
    })
    if (res.status !== 200) alert('Не получилось войти. Возможно, вы неправильно ввели логин или пароль')
    else window.location.href = '/'
  }

  onUsernameInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('')
    if (e.target.validity.patternMismatch) {
      e.target.setCustomValidity('Имя должно содержать только символы "-", "a-Z", "0-9"')
      return
    }
    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity('Введите имя')
    }
  }

  onPasswordInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('')
    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity('Введите пароль')
    }
  }

  clearValidity = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('')
  }

  render() {
    if (isLoggedIn()) return <Header />
    return <React.Fragment>
      <Header />
      <div className={style.main}>
        <div className={style.adventures}>
          <h1 className={style.tagTitle}>Вход</h1>
          <form onSubmit={this.onSubmit}>
            <div className={style.loginFormField}>
              <input autoFocus onInput={this.clearValidity} onInvalid={this.onUsernameInvalid}
                required maxLength={50} pattern="^[a-zA-Z0-9-]+$" ref={this.inputs[0]} autoComplete="on"
                className={[style.input, style.loginFormInput].join(' ')} placeholder="Логин" />
            </div>
            <div className={style.loginFormField}>
              <input onInput={this.clearValidity} onInvalid={this.onPasswordInvalid} required
                maxLength={50} ref={this.inputs[1]} autoComplete="on" type="password"
                className={[style.input, style.loginFormInput].join(' ')} placeholder="Пароль" />
            </div>
            <button className={[style.button, style.buttonSearch].join(' ')}>Войти</button>
          </form>
        </div>
      </div>
    </React.Fragment>
  }
}
