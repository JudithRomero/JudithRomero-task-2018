import * as React from 'react'
import Header, { getCookie, isLoggedIn } from '../components/Header'
import * as style from '../style.css'


const getImgurId = async (file: File) => {
  const body = new FormData()
  body.append('image', file)
  const res = await fetch('https://api.imgur.com/3/image/', {
    method: 'POST',
    headers: { Authorization: 'Client-ID e31fe794c8655c5' },
    body,
  }).then(x => x.json())
  if (res.status !== 200) throw new Error(res.data.error)
  return res.data.id
}

export default class Register extends React.Component {
  state = { disabled: false }
  imgurId = null
  inputs = [React.createRef<HTMLInputElement>(), React.createRef<HTMLInputElement>()]

  onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const username = this.inputs[0].current.value
    const password = this.inputs[1].current.value
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, imgurId: this.imgurId, csrf: getCookie('csrf') }),
    })
    if (res.status !== 200) alert('Не получилось зарегистрироваться. Возможно, такой пользователь уже существует')
    else window.location.href = '/'
  }

  onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e
    const file = target.files[0]
    if (!file) return
    if (file.size > 1024 * 1024 * 20) {
      alert('Изображение больше 20МБ, выберите другой файл')
      target.value = ''
      return
    }
    try {
      this.setState({ disabled: true })
      this.imgurId = await getImgurId(file)
    } catch {
      alert('К сожалению, аватарку не удалось загрузить')
      target.value = ''
      return
    } finally {
      this.setState({ disabled: false })
    }
  }

  onUsernameInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('')
    if (e.target.validity.patternMismatch) {
      e.target.setCustomValidity('Имя должно содержать только символы "-", "a-Z", "0-9"')
      return
    }
    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity('Придумайте себе имя')
    }
  }

  onPasswordInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('')
    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity('Придумайте себе пароль')
    }
  }

  clearValidity = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('')
  }

  render() {
    if (isLoggedIn()) return <Header />
    const btnClasses = [style.button, style.buttonSearch]
    if (this.state.disabled) btnClasses.push(style.disabled)
    return <React.Fragment>
      <Header />
      <div className={style.main}>
        <div className={style.adventures}>
          <h1 className={style.tagTitle}>Регистрация</h1>
          <form onSubmit={this.onSubmit}>
            <div className={style.loginFormField}>
              <input onInput={this.clearValidity} onInvalid={this.onUsernameInvalid} required
                maxLength={50} pattern="^[a-zA-Z0-9-]+$" ref={this.inputs[0]} autoComplete="on"
                className={[style.input, style.loginFormInput].join(' ')} placeholder="Логин" />
            </div>
            <div className={style.loginFormField}>
              <input onInput={this.clearValidity} onInvalid={this.onPasswordInvalid} required
                maxLength={50} ref={this.inputs[1]} autoComplete="on" type="password"
                className={[style.input, style.loginFormInput].join(' ')} placeholder="Пароль" />
            </div>
            <div className={style.loginFormField}>
              <input title={this.state.disabled ? 'Подождите, загружается аватар' : 'Изображение в формате png/jpg/gif до 20МБ'}
                accept=".png,.jpg,.jpeg" type="file" onChange={this.onFiles} disabled={this.state.disabled} />
            </div>
            <button disabled={this.state.disabled} title={this.state.disabled ? 'Подождите, загружается аватар' : null}
              className={btnClasses.join(' ')}>Зарегистрироваться и войти</button>
          </form>
        </div>
      </div>
    </React.Fragment>
  }
}
