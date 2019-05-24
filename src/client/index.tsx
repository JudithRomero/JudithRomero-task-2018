import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import Tag from './pages/Tag'
import Scene from './pages/Scene'
import NotFound from './pages/NotFound'


// IE polyfill: https://stackoverflow.com/a/45851440
if (!Object.entries) {
  Object.entries = (obj) => {
    const ownProps = Object.keys(obj)
    const resArray = new Array(ownProps.length)
    for (let i = 0; i < resArray.length; i++) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]]
    }

    return resArray
  }
}

const App = () => <BrowserRouter>
  <Switch>
    <Route exact path="/" component={Search} />
    <Route path="/tag/:tagName" component={Tag} />
    <Route path="/scene/:sceneId" component={Scene} />
    <Route path="/register" component={Register} />
    <Route path="/login" component={Login} />
    <Route path="*" component={NotFound} />
  </Switch>
</BrowserRouter>

ReactDOM.render(<App />, document.getElementById('app'))
